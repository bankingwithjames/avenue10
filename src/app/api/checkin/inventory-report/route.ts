import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGuest } from "@/lib/guestAuth";

export async function POST(req: NextRequest) {
  const { error, guest } = await requireGuest(req);
  if (error) return error;

  const { itemId, reportType, description } = await req.json();

  if (!itemId || !reportType) {
    return NextResponse.json(
      { error: "itemId and reportType are required" },
      { status: 400 }
    );
  }

  // Validate item exists and belongs to the guest's listing
  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, listingId: guest!.listingId },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const report = await prisma.guestInventoryReport.create({
    data: {
      itemId,
      reportType,
      description: description?.trim() || null,
    },
  });

  return NextResponse.json(report);
}
