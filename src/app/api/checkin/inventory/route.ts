import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGuest } from "@/lib/guestAuth";

export async function GET(req: NextRequest) {
  const { error, guest } = await requireGuest(req);
  if (error) return error;

  const items = await prisma.inventoryItem.findMany({
    where: { listingId: guest!.listingId },
    orderBy: [{ room: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json(items);
}
