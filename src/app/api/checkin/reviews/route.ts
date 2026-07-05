import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGuest } from "@/lib/guestAuth";

export async function GET(req: NextRequest) {
  const { error, guest } = await requireGuest(req);
  if (error) return error;

  const review = await prisma.guestReview.findFirst({
    where: { reservationId: guest!.reservationId },
  });

  return NextResponse.json(review || {});
}

export async function POST(req: NextRequest) {
  const { error, guest } = await requireGuest(req);
  if (error) return error;

  // Check if review already exists
  const existing = await prisma.guestReview.findFirst({
    where: { reservationId: guest!.reservationId },
  });

  if (existing) {
    return NextResponse.json(
      { error: "You have already submitted a review for this reservation" },
      { status: 400 }
    );
  }

  const {
    overallRating,
    cleanlinessRating,
    accuracyRating,
    communicationRating,
    locationRating,
    valueRating,
    comments,
  } = await req.json();

  if (!overallRating || overallRating < 1 || overallRating > 5) {
    return NextResponse.json(
      { error: "Overall rating (1-5) is required" },
      { status: 400 }
    );
  }

  const review = await prisma.guestReview.create({
    data: {
      reservationId: guest!.reservationId,
      overallRating,
      cleanlinessRating: cleanlinessRating || null,
      accuracyRating: accuracyRating || null,
      communicationRating: communicationRating || null,
      locationRating: locationRating || null,
      valueRating: valueRating || null,
      comments: comments?.trim() || null,
      source: "portal",
    },
  });

  return NextResponse.json(review);
}
