import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const params = req.nextUrl.searchParams;
    const propertyId = params.get("propertyId");
    const itemId = params.get("itemId");
    const bookingId = params.get("bookingId");

    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;
    if (itemId) where.itemId = itemId;
    if (bookingId) where.bookingId = bookingId;

    const usages = await prisma.inventoryUsage.findMany({
      where,
      include: { item: true },
      orderBy: { usageDate: "desc" },
    });
    return NextResponse.json(usages);
  } catch (e) {
    console.error("GET /api/admin/inventory-usage error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const totalUsageCost = body.quantityUsed * (body.unitCostAtUsage || 0);

    const item = await prisma.propertyInventory.findUniqueOrThrow({
      where: { id: body.itemId },
    });
    const newQty = Math.max(0, item.quantityOnHand - body.quantityUsed);
    const inventoryStatus = newQty === 0 ? "missing" : newQty <= item.reorderThreshold && item.reorderThreshold > 0 ? "low_stock" : "ok";

    const [usage] = await prisma.$transaction([
      prisma.inventoryUsage.create({
        data: { ...body, totalUsageCost },
      }),
      prisma.propertyInventory.update({
        where: { id: body.itemId },
        data: {
          quantityOnHand: newQty,
          quantityUsed: { increment: body.quantityUsed },
          remainingValue: { decrement: totalUsageCost },
          inventoryStatus,
        },
      }),
    ]);

    return NextResponse.json(usage, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/inventory-usage error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
