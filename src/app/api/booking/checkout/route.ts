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
    const { quoteId, firstName, lastName, email, phone, specialRequests } = body;

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
    const status = bookingMode === "instant_book" ? "confirmed" : "pending";

    const guestName = `${firstName} ${lastName}`;

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
        notes: specialRequests || null,
        status,
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
        paymentStatus: "none",
        channel: "website",
      },
    });

    await prisma.bookingQuote.update({
      where: { id: quoteId },
      data: { status: "converted" },
    });

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

    if (status === "confirmed") {
      const dates: Date[] = [];
      const current = new Date(quote.checkIn);
      while (current < quote.checkOut) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      for (const date of dates) {
        await prisma.closedDate.upsert({
          where: {
            listingId_date: { listingId: quote.listingId, date },
          },
          create: {
            listingId: quote.listingId,
            date,
            reason: `Booking ${reservation.confirmationCode}`,
          },
          update: {},
        });
      }
    }

    await prisma.bookingNotification.create({
      data: {
        reservationId: reservation.id,
        type: status === "confirmed" ? "confirmation" : "request_received",
        channel: "email",
        recipient: email,
        subject:
          status === "confirmed"
            ? `Booking Confirmed - ${reservation.confirmationCode}`
            : `Booking Request Received - ${reservation.confirmationCode}`,
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
