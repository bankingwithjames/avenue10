import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const listingId = req.nextUrl.searchParams.get("listingId");

  const orders = await prisma.reservationChangeOrder.findMany({
    where: listingId
      ? { reservation: { listingId } }
      : undefined,
    include: {
      reservation: {
        select: {
          guestName: true,
          confirmationCode: true,
          checkIn: true,
          checkOut: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const {
      confirmationCode,
      changeType,
      description,
      originalValue,
      newValue,
      priceDifference,
      notes,
    } = body;

    if (!confirmationCode || !changeType) {
      return NextResponse.json(
        { error: "confirmationCode and changeType required" },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findFirst({
      where: { confirmationCode },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    const newPrice = (reservation.totalPrice || 0) + (priceDifference || 0);

    const order = await prisma.reservationChangeOrder.create({
      data: {
        reservationId: reservation.id,
        guestId: reservation.guestId,
        changeType,
        description,
        originalValue,
        newValue,
        originalPrice: reservation.totalPrice,
        newPrice,
        priceDifference: priceDifference || 0,
        adminApprovalRequired: true,
        guestApprovalRequired: priceDifference > 0,
        notes,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("Change order create error:", err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { id, approvalStatus } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const order = await prisma.reservationChangeOrder.update({
      where: { id },
      data: {
        approvalStatus,
        processedBy: "admin",
      },
    });

    // If approved with a price difference, update the reservation total
    if (approvalStatus === "approved" && order.priceDifference !== 0) {
      await prisma.reservation.update({
        where: { id: order.reservationId },
        data: {
          totalPrice: order.newPrice,
        },
      });
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error("Change order update error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
