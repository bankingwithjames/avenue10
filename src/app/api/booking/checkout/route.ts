import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

function generateAccessCode(): string {
  return "AV10-" + randomBytes(3).toString("hex").toUpperCase();
}

function generateConfirmationCode(): string {
  return "AVX-" + randomBytes(4).toString("hex").toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      quoteId,
      firstName,
      lastName,
      email,
      phone,
      specialRequests,
      address,
      agreedToRules,
      depositAmount,
      earlyCheckin,
      lateCheckout,
      needsCrib,
      needsHighChair,
      paymentMethod,
    } = body;

    if (!quoteId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "quoteId, firstName, lastName, and email are required" },
        { status: 400 }
      );
    }

    const quote = await prisma.bookingQuote.findUnique({
      where: { id: quoteId },
      include: {
        listing: {
          include: { pricingConfig: true },
        },
      },
    });

    if (!quote || quote.status !== "active") {
      return NextResponse.json(
        { error: "Quote not found or no longer active" },
        { status: 404 }
      );
    }

    if (quote.expiresAt < new Date()) {
      await prisma.bookingQuote.update({
        where: { id: quoteId },
        data: { status: "expired" },
      });
      return NextResponse.json(
        { error: "Quote has expired. Please start a new booking." },
        { status: 410 }
      );
    }

    const closedDates = await prisma.closedDate.findMany({
      where: {
        listingId: quote.listingId,
        date: { gte: quote.checkIn, lt: quote.checkOut },
      },
    });
    if (closedDates.length > 0) {
      return NextResponse.json(
        { error: "Some dates are no longer available" },
        { status: 409 }
      );
    }

    const overlapping = await prisma.reservation.findFirst({
      where: {
        listingId: quote.listingId,
        status: { in: ["pending", "confirmed"] },
        checkIn: { lt: quote.checkOut },
        checkOut: { gt: quote.checkIn },
      },
    });
    if (overlapping) {
      return NextResponse.json(
        { error: "These dates have been booked by another guest" },
        { status: 409 }
      );
    }

    const bookingRule = await prisma.bookingRule.findUnique({
      where: { listingId: quote.listingId },
    });

    const bookingMode = bookingRule?.bookingMode ?? "request_to_book";

    // Build notes with address and special requests
    const notesParts: string[] = [];

    if (address) {
      notesParts.push(
        `Address: ${JSON.stringify(address)}`
      );
    }

    if (specialRequests) {
      notesParts.push(`Special Requests: ${specialRequests}`);
    }

    const specialRequestItems: string[] = [];
    if (earlyCheckin) specialRequestItems.push("Early check-in requested");
    if (lateCheckout) specialRequestItems.push("Late check-out requested");
    if (needsCrib) specialRequestItems.push("Pack-n-play / Crib needed");
    if (needsHighChair) specialRequestItems.push("High chair needed");
    if (specialRequestItems.length > 0) {
      notesParts.push(`Additional Requests: ${specialRequestItems.join(", ")}`);
    }

    if (paymentMethod) {
      notesParts.push(`Payment Method: ${paymentMethod}`);
    }

    if (agreedToRules) {
      notesParts.push("Guest agreed to House Rules and Rental Agreement");
    }

    const notes = notesParts.length > 0 ? notesParts.join("\n") : null;

    // Calculate deposit
    let calculatedDeposit = 0;
    if (depositAmount && depositAmount > 0) {
      calculatedDeposit = depositAmount;
    } else if (bookingRule) {
      if (bookingRule.depositPercent > 0) {
        calculatedDeposit =
          Math.round(quote.total * (bookingRule.depositPercent / 100) * 100) /
          100;
      } else if (bookingRule.depositFlat > 0) {
        calculatedDeposit = bookingRule.depositFlat;
      }
    }

    const guestName = `${firstName} ${lastName}`;

    // All bookings start as pending — admin confirms via the admin API
    const reservation = await prisma.reservation.create({
      data: {
        listingId: quote.listingId,
        checkIn: quote.checkIn,
        checkOut: quote.checkOut,
        guests: quote.guests,
        totalPrice: quote.total,
        guestName,
        guestEmail: email,
        guestPhone: phone || null,
        notes,
        status: "pending",
        accessCode: generateAccessCode(),
        confirmationCode: generateConfirmationCode(),
        quoteId: quoteId,
        bookingMode,
        nightlyBreakdown: quote.nightlyBreakdown as object,
        subtotal: quote.subtotal,
        cleaningFeeCharged: quote.cleaningFee,
        petFeeCharged: quote.petFee,
        extraGuestFeeCharged: quote.extraGuestFee,
        taxAmount: quote.taxAmount,
        serviceFeeCharged: quote.serviceFee,
        depositHoldCharged: quote.depositHold,
        addOnsTotalCharged: quote.addOnsTotal,
        addOnsDetail: quote.addOnsBreakdown as object ?? undefined,
        paymentStatus: "none",
        channel: "website",
        depositAmount: calculatedDeposit > 0 ? calculatedDeposit : null,
      },
    });

    await prisma.bookingQuote.update({
      where: { id: quoteId },
      data: { status: "converted" },
    });

    // Create or find guest profile (non-blocking)
    try {
      let guest = await prisma.guest.findUnique({ where: { email } });
      if (!guest) {
        guest = await prisma.guest.create({
          data: {
            firstName,
            lastName,
            email,
            phone: phone || null,
            source: "booking",
          },
        });
      }
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { guestId: guest.id },
      });
    } catch (guestErr) {
      console.error("Guest profile creation failed (non-blocking):", guestErr);
    }

    // Create locked agreement snapshot
    try {
      await prisma.bookingAgreementSnapshot.create({
        data: {
          reservationId: reservation.id,
          guestId: reservation.guestId,
          nightlyRateSnapshot: quote.nightlyBreakdown as object,
          cleaningFeeSnapshot: quote.cleaningFee,
          taxesSnapshot: quote.taxAmount,
          serviceFeeSnapshot: quote.serviceFee,
          depositHoldSnapshot: quote.depositHold,
          addOnsSnapshot: quote.addOnsBreakdown as object ?? undefined,
          totalPriceSnapshot: quote.total,
          termsAccepted: agreedToRules ?? true,
          cancellationPolicy:
            bookingRule?.cancellationPolicy ?? "flexible",
          paymentStatus: "none",
        },
      });
    } catch (snapErr) {
      console.error("Agreement snapshot creation failed (non-blocking):", snapErr);
    }

    await prisma.bookingNotification.create({
      data: {
        reservationId: reservation.id,
        type: "request_received",
        channel: "email",
        recipient: email,
        subject: `Booking Request Received - ${reservation.confirmationCode}`,
        status: "pending",
      },
    });

    return NextResponse.json(
      {
        reservation: {
          id: reservation.id,
          confirmationCode: reservation.confirmationCode,
          status: reservation.status,
          checkIn: reservation.checkIn,
          checkOut: reservation.checkOut,
          guests: reservation.guests,
          totalPrice: reservation.totalPrice,
          guestName: reservation.guestName,
          listingTitle: quote.listing.title,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Booking failed. Please try again." },
      { status: 500 }
    );
  }
}
