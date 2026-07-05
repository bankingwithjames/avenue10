import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const propertyId = req.nextUrl.searchParams.get("propertyId");
    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;

    const rooms = await prisma.inventoryRoom.findMany({
      where,
      orderBy: { displayOrder: "asc" },
    });
    return NextResponse.json(rooms);
  } catch (e) {
    console.error("GET /api/admin/inventory-rooms error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const room = await prisma.inventoryRoom.create({ data: body });
    return NextResponse.json(room, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/inventory-rooms error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
