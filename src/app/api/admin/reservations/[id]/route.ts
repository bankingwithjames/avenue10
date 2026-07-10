import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  if (body.status && !["pending", "confirmed", "declined", "cancelled"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.status !== undefined) updateData.status = body.status;
  if (body.declinedReason !== undefined) updateData.declinedReason = body.declinedReason;
  if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes;

  if (body.status === "confirmed" && existing.status !== "confirmed") {
    updateData.approvedBy = session?.user?.email || "admin";
    updateData.approvedAt = new Date();

    const checkIn = new Date(existing.checkIn);
    const checkOut = new Date(existing.checkOut);
    const current = new Date(checkIn);
    while (current < checkOut) {
      await prisma.closedDate.upsert({
        where: {
          listingId_date: { listingId: existing.listingId, date: new Date(current) },
        },
        create: {
          listingId: existing.listingId,
          date: new Date(current),
          reason: `Booking ${existing.confirmationCode || existing.id}`,
        },
        update: {},
      });
      current.setDate(current.getDate() + 1);
    }
  }

  if (body.status === "cancelled" && existing.status === "confirmed") {
    const checkIn = new Date(existing.checkIn);
    const checkOut = new Date(existing.checkOut);
    await prisma.closedDate.deleteMany({
      where: {
        listingId: existing.listingId,
        date: { gte: checkIn, lt: checkOut },
        reason: { contains: existing.confirmationCode || existing.id },
      },
    });
  }

  const reservation = await prisma.reservation.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(reservation);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  await prisma.reservation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
