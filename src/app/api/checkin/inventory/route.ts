import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGuest } from "@/lib/guestAuth";

export async function GET(req: NextRequest) {
  const { error, guest } = await requireGuest(req);
  if (error) return error;

  const items = await prisma.inventoryItem.findMany({
    where: {
      listingId: guest!.listingId,
      guestVisible: true,
    },
    orderBy: [{ room: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      room: true,
      itemName: true,
      category: true,
      quantity: true,
      quantityExpected: true,
      condition: true,
    },
  });

  return NextResponse.json(items);
}
