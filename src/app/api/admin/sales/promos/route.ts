import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const promos = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ promos });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const {
      code,
      discountType,
      discountValue,
      listingId,
      startDate,
      endDate,
      minimumNights,
      maxUses,
    } = body;

    if (!code) {
      return NextResponse.json({ error: "code required" }, { status: 400 });
    }

    const existing = await prisma.promoCode.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { error: "Promo code already exists" },
        { status: 409 }
      );
    }

    const promo = await prisma.promoCode.create({
      data: {
        code,
        discountType: discountType || "percentage",
        discountValue: discountValue || 0,
        listingId: listingId || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        minimumNights: minimumNights || 1,
        maxUses: maxUses || 0,
      },
    });

    return NextResponse.json(promo, { status: 201 });
  } catch (err) {
    console.error("Promo create error:", err);
    return NextResponse.json({ error: "Failed to create promo" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const promo = await prisma.promoCode.update({
      where: { id },
      data,
    });

    return NextResponse.json(promo);
  } catch (err) {
    console.error("Promo update error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await prisma.promoCode.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
