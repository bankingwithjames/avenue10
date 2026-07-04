import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

function generateAccessCode(): string {
  return "AV10-" + randomBytes(3).toString("hex").toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listingId, checkIn, checkOut, guests, guestName, guestEmail, guestPhone, notes } = body;

    if (!listingId || !checkIn || !checkOut || !guestName || !guestEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return NextResponse.json({ error: "Check-out must be after check-in" }, { status: 400 });
    }

    if (guests > listing.maxGuests) {
      return NextResponse.json({ error: `Maximum ${listing.maxGuests} guests allowed` }, { status: 400 });
    }

    const closedDates = await prisma.closedDate.findMany({
      where: {
        listingId,
        date: { gte: checkInDate, lt: checkOutDate },
      },
    });

    if (closedDates.length > 0) {
      return NextResponse.json({ error: "Some of your selected dates are unavailable" }, { status: 400 });
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
      return NextResponse.json({ error: "These dates are already booked" }, { status: 400 });
    }

    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = nights * listing.pricePerNight + listing.cleaningFee;

    const reservation = await prisma.reservation.create({
      data: {
        listingId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: guests || 1,
        guestName,
        guestEmail,
        guestPhone: guestPhone || null,
        notes: notes || null,
        totalPrice,
        status: "pending",
        accessCode: generateAccessCode(),
      },
    });

    return NextResponse.json({ success: true, reservation }, { status: 201 });
  } catch (error) {
    console.error("Reservation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
