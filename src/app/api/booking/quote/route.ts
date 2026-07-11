import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePricing } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listingId, checkIn, checkOut, guests, hasPets } = body;

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
      include: { pricingConfig: true },
    });

    if (!listing || !listing.active) {
      return NextResponse.json(
        { error: "Listing not found or inactive" },
        { status: 404 }
      );
    }

    if (guests > listing.maxGuests) {
      return NextResponse.json(
        { error: `Maximum ${listing.maxGuests} guests allowed` },
        { status: 400 }
      );
    }

    const minStay = listing.pricingConfig?.minimumStay ?? 1;
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (nights < minStay) {
      return NextResponse.json(
        { error: `Minimum stay is ${minStay} night${minStay > 1 ? "s" : ""}` },
        { status: 400 }
      );
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
      { hasPets }
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
        total: pricing.total,
        expiresAt,
      },
    });

    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Quote creation error:", msg, error);
    return NextResponse.json(
      { error: "Failed to create quote", detail: msg },
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
