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

    const bills = await prisma.propertyBill.findMany({
      where,
      orderBy: { dueDate: "desc" },
    });
    return NextResponse.json(bills);
  } catch (e) {
    console.error("GET /api/admin/property-bills error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const bill = await prisma.propertyBill.create({ data: body });
    return NextResponse.json(bill, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/property-bills error:", e);
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
    const bill = await prisma.propertyBill.update({ where: { id }, data });
    return NextResponse.json(bill);
  } catch (e) {
    console.error("PUT /api/admin/property-bills error:", e);
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
    await prisma.propertyBill.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/admin/property-bills error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
