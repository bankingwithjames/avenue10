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

    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;
    if (itemId) where.itemId = itemId;

    const purchases = await prisma.inventoryPurchase.findMany({
      where,
      include: { item: true },
      orderBy: { purchaseDate: "desc" },
    });
    return NextResponse.json(purchases);
  } catch (e) {
    console.error("GET /api/admin/inventory-purchases error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const totalCost = body.quantityPurchased * body.unitCost;

    const item = await prisma.propertyInventory.findUniqueOrThrow({
      where: { id: body.itemId },
    });

    const newQty = item.quantityOnHand + body.quantityPurchased;
    const avgUnitCost =
      (item.avgUnitCost * item.quantityOnHand + totalCost) / newQty;
    const remainingValue = newQty * avgUnitCost;

    const inventoryStatus = newQty > item.reorderThreshold ? "ok" : newQty === 0 ? "missing" : "low_stock";

    const [purchase] = await prisma.$transaction([
      prisma.inventoryPurchase.create({
        data: { ...body, totalCost },
      }),
      prisma.propertyInventory.update({
        where: { id: body.itemId },
        data: {
          quantityOnHand: newQty,
          avgUnitCost,
          remainingValue,
          lastRestockedAt: new Date(),
          inventoryStatus,
        },
      }),
    ]);

    return NextResponse.json(purchase, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/inventory-purchases error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
