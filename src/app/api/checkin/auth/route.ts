import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret"
);

export async function POST(req: NextRequest) {
  const { lastName, accessCode } = await req.json();

  if (!lastName || !accessCode) {
    return NextResponse.json(
      { error: "Last name and access code are required" },
      { status: 400 }
    );
  }

  const reservation = await prisma.reservation.findFirst({
    where: {
      accessCode,
      status: { in: ["confirmed", "pending"] },
    },
    include: {
      listing: { select: { id: true, title: true, slug: true } },
      agreement: { select: { id: true, signedAt: true } },
    },
  });

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

  return NextResponse.json({
    token,
    reservation: {
      id: reservation.id,
      guestName: reservation.guestName,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      listing: reservation.listing,
      agreementSigned: !!reservation.agreement,
    },
  });
}
