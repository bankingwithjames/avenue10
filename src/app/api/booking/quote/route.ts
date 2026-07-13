import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePricing } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listingId, checkIn, checkOut, guests, hasPets, selectedAddOns, promoCode } = body;

    if (!listingId || !checkIn || !checkOut || !guests) {
      return NextResponse.json(
        { error: "listingId, checkIn, checkOut, and guests are required" },
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const now = new Date();

    if (checkInDate < new Date(now.toISOString().split("T")[0])) {
      return NextResponse.json(
        { error: "Check-in cannot be in the past" },
        { status: 400 }
      );
    }

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { error: "Check-out must be after check-in" },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { pricingConfig: true, salesConfig: true },
    });

    if (!listing || !listing.active) {
      return NextResponse.json(
        { error: "Listing not found or inactive" },
        { status: 404 }
      );
    }

    const sc = listing.salesConfig?.isActive ? listing.salesConfig : null;
    const effectiveMaxGuests = sc ? sc.maxGuests : listing.maxGuests;

    if (guests > effectiveMaxGuests) {
      return NextResponse.json(
        { error: `Maximum ${effectiveMaxGuests} guests allowed` },
        { status: 400 }
      );
    }

    const minStay = sc?.minimumStay ?? listing.pricingConfig?.minimumStay ?? 1;
    const maxStay = sc?.maximumStay ?? 365;
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (nights < minStay) {
      return NextResponse.json(
        { error: `Minimum stay is ${minStay} night${minStay > 1 ? "s" : ""}` },
        { status: 400 }
      );
    }
    if (nights > maxStay) {
      return NextResponse.json(
        { error: `Maximum stay is ${maxStay} nights` },
        { status: 400 }
      );
    }

    if (sc) {
      if (!sc.sameDayBookingAllowed) {
        const todayStr = now.toISOString().split("T")[0];
        const checkInStr = checkInDate.toISOString().split("T")[0];
        if (todayStr === checkInStr) {
          return NextResponse.json(
            { error: "Same-day bookings are not available for this property" },
            { status: 400 }
          );
        }
      }

      if (sc.advanceNoticeHours > 0) {
        const minBookingTime = new Date(checkInDate.getTime() - sc.advanceNoticeHours * 60 * 60 * 1000);
        if (now > minBookingTime) {
          return NextResponse.json(
            { error: `Bookings require at least ${sc.advanceNoticeHours} hours advance notice` },
            { status: 400 }
          );
        }
      }
    }

    const closedDates = await prisma.closedDate.findMany({
      where: {
        listingId,
        date: { gte: checkInDate, lt: checkOutDate },
      },
    });
    if (closedDates.length > 0) {
      return NextResponse.json(
        { error: "Some selected dates are unavailable" },
        { status: 400 }
      );
    }

    const overlapping = await prisma.reservation.findFirst({
      where: {
        listingId,
        status: { in: ["pending", "confirmed"] },
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
    });
    if (overlapping) {
      return NextResponse.json(
        { error: "These dates are already booked" },
        { status: 400 }
      );
    }

    const pricing = await calculatePricing(
      listingId,
      checkInDate,
      checkOutDate,
      guests,
      { hasPets, selectedAddOns: selectedAddOns as string[] | undefined, promoCode: promoCode as string | undefined }
    );

    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);

    const quote = await prisma.bookingQuote.create({
      data: {
        listingId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
        nights: pricing.nights,
        nightlyBreakdown: pricing.nightlyRates as unknown as object,
        subtotal: pricing.subtotal,
        cleaningFee: pricing.cleaningFee,
        petFee: pricing.petFee,
        extraGuestFee: pricing.extraGuestFee,
        taxAmount: pricing.taxAmount,
        serviceFee: pricing.serviceFee,
        depositHold: pricing.depositHold,
        addOnsTotal: pricing.addOnsTotal,
        addOnsBreakdown: pricing.addOns.length > 0 ? (pricing.addOns as unknown as object) : undefined,
        promoCode: pricing.promoCode ?? undefined,
        promoDiscount: pricing.promoDiscount,
        total: pricing.total,
        expiresAt,
      },
    });

    // Create BookingQuoteAddon records for selected add-ons
    if (pricing.addOns.length > 0) {
      const salesConfig = await prisma.salesConfig.findUnique({
        where: { listingId },
        include: { addOns: { where: { isActive: true } } },
      });
      if (salesConfig) {
        for (const matched of pricing.addOns) {
          const addOnItem = salesConfig.addOns.find(
            (a) => a.name.toLowerCase() === matched.name.toLowerCase()
          );
          if (addOnItem) {
            await prisma.bookingQuoteAddon.create({
              data: {
                quoteId: quote.id,
                addOnItemId: addOnItem.id,
                quantity: 1,
                priceSnapshot: addOnItem.price,
                totalPrice: matched.price,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    console.error("Quote creation error:", error);
    return NextResponse.json(
      { error: "Failed to create quote" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const quoteId = req.nextUrl.searchParams.get("id");
  if (!quoteId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const quote = await prisma.bookingQuote.findUnique({
    where: { id: quoteId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          photos: true,
          maxGuests: true,
        },
      },
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (quote.status === "active" && quote.expiresAt < new Date()) {
    await prisma.bookingQuote.update({
      where: { id: quoteId },
      data: { status: "expired" },
    });
    return NextResponse.json({ error: "Quote has expired" }, { status: 410 });
  }

  if (quote.status !== "active") {
    return NextResponse.json(
      { error: `Quote is ${quote.status}` },
      { status: 410 }
    );
  }

  return NextResponse.json({ quote });
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { quoteId, selectedAddOns, promoCode } = body;

    if (!quoteId) {
      return NextResponse.json({ error: "quoteId is required" }, { status: 400 });
    }

    const existing = await prisma.bookingQuote.findUnique({
      where: { id: quoteId },
      include: { listing: true },
    });

    if (!existing || existing.status !== "active") {
      return NextResponse.json({ error: "Quote not found or inactive" }, { status: 404 });
    }

    if (existing.expiresAt < new Date()) {
      return NextResponse.json({ error: "Quote has expired" }, { status: 410 });
    }

    const pricing = await calculatePricing(
      existing.listingId,
      existing.checkIn,
      existing.checkOut,
      existing.guests,
      { selectedAddOns: selectedAddOns as string[] | undefined, promoCode: promoCode as string | undefined }
    );

    // Delete old BookingQuoteAddon records
    await prisma.bookingQuoteAddon.deleteMany({ where: { quoteId } });

    // Update the quote with new pricing
    const updated = await prisma.bookingQuote.update({
      where: { id: quoteId },
      data: {
        addOnsTotal: pricing.addOnsTotal,
        addOnsBreakdown: pricing.addOns.length > 0 ? (pricing.addOns as unknown as object) : undefined,
        promoCode: pricing.promoCode ?? undefined,
        promoDiscount: pricing.promoDiscount,
        total: pricing.total,
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            photos: true,
            maxGuests: true,
          },
        },
      },
    });

    // Create new BookingQuoteAddon records
    if (pricing.addOns.length > 0) {
      const salesConfig = await prisma.salesConfig.findUnique({
        where: { listingId: existing.listingId },
        include: { addOns: { where: { isActive: true } } },
      });
      if (salesConfig) {
        for (const matched of pricing.addOns) {
          const addOnItem = salesConfig.addOns.find(
            (a) => a.name.toLowerCase() === matched.name.toLowerCase()
          );
          if (addOnItem) {
            await prisma.bookingQuoteAddon.create({
              data: {
                quoteId,
                addOnItemId: addOnItem.id,
                quantity: 1,
                priceSnapshot: addOnItem.price,
                totalPrice: matched.price,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ quote: updated });
  } catch (error) {
    console.error("Quote update error:", error);
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
  }
}
