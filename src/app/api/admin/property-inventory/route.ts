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

    const items = await prisma.propertyInventory.findMany({
      where,
      include: { vendor: true },
      orderBy: [{ category: "asc" }, { itemName: "asc" }],
    });
    return NextResponse.json(items);
  } catch (e) {
    console.error("GET /api/admin/property-inventory error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const item = await prisma.propertyInventory.create({ data: body });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/property-inventory error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id, ...data } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const item = await prisma.propertyInventory.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (e) {
    console.error("PUT /api/admin/property-inventory error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    await prisma.propertyInventory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/admin/property-inventory error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
