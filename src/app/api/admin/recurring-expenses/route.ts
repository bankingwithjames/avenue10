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

    const recurring = await prisma.recurringExpense.findMany({
      where,
      include: { category: true, vendor: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(recurring);
  } catch (e) {
    console.error("GET /api/admin/recurring-expenses error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const expense = await prisma.recurringExpense.create({ data: body });
    return NextResponse.json(expense, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/recurring-expenses error:", e);
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
    const expense = await prisma.recurringExpense.update({ where: { id }, data });
    return NextResponse.json(expense);
  } catch (e) {
    console.error("PUT /api/admin/recurring-expenses error:", e);
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
    await prisma.recurringExpense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/admin/recurring-expenses error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
