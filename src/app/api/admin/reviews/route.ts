import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const reviews = await prisma.guestReview.findMany({
    include: {
      reservation: {
        select: {
          guestName: true,
          checkIn: true,
          checkOut: true,
          listing: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reviews);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id, adminResponse, approvalStatus, publishToWebsite, featured } =
    await req.json();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (adminResponse !== undefined) data.adminResponse = adminResponse;
  if (approvalStatus !== undefined) data.approvalStatus = approvalStatus;
  if (publishToWebsite !== undefined) data.publishToWebsite = publishToWebsite;
  if (featured !== undefined) data.featured = featured;

  const review = await prisma.guestReview.update({
    where: { id },
    data,
  });

  return NextResponse.json(review);
}
