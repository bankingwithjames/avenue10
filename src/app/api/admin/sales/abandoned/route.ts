import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const listingId = req.nextUrl.searchParams.get("listingId");

  const abandoned = await prisma.abandonedCheckout.findMany({
    where: listingId ? { listingId } : {},
    include: {
      listing: { select: { title: true } },
    },
    orderBy: { abandonedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    abandoned: abandoned.map((a) => ({
      id: a.id,
      guestEmail: a.guestEmail,
      guestPhone: a.guestPhone,
      listingTitle: a.listing?.title || "Unknown",
      checkIn: a.checkIn?.toISOString() || null,
      checkOut: a.checkOut?.toISOString() || null,
      totalQuote: a.totalQuote,
      abandonedStep: a.abandonedStep,
      abandonedAt: a.abandonedAt.toISOString(),
      followUpStatus: a.followUpStatus,
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { id, followUpStatus } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    await prisma.abandonedCheckout.update({
      where: { id },
      data: { followUpStatus },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Abandoned checkout update error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
