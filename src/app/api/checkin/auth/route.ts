import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret"
);

export async function POST(req: NextRequest) {
  try {
    const { lastName, accessCode } = await req.json();

    if (!lastName || !accessCode) {
      return NextResponse.json(
        { error: "Last name and access code are required" },
        { status: 400 }
      );
    }

    let reservation;
    try {
      reservation = await prisma.reservation.findFirst({
        where: {
          accessCode,
          status: { in: ["confirmed", "pending"] },
        },
        include: {
          listing: { select: { id: true, title: true, slug: true } },
          agreement: { select: { id: true, signedAt: true } },
        },
      });
    } catch {
      reservation = await prisma.reservation.findFirst({
        where: {
          accessCode,
          status: { in: ["confirmed", "pending"] },
        },
        include: {
          listing: { select: { id: true, title: true, slug: true } },
        },
      });
    }

    if (!reservation) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your last name and access code." },
        { status: 401 }
      );
    }

    const guestLastName = reservation.guestName.trim().split(/\s+/).pop()?.toLowerCase();
    if (guestLastName !== lastName.trim().toLowerCase()) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your last name and access code." },
        { status: 401 }
      );
    }

    const token = await new SignJWT({
      reservationId: reservation.id,
      listingId: reservation.listing.id,
      guestName: reservation.guestName,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(SECRET);

    const agreementSigned = "agreement" in reservation ? !!reservation.agreement : false;

    return NextResponse.json({
      token,
      reservation: {
        id: reservation.id,
        guestName: reservation.guestName,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        listing: reservation.listing,
        agreementSigned,
      },
    });
  } catch (e) {
    console.error("Check-in auth error:", e);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
