import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const params = req.nextUrl.searchParams;
    const propertyId = params.get("propertyId");
    const categoryId = params.get("categoryId");
    const startDate = params.get("startDate");
    const endDate = params.get("endDate");
    const frequency = params.get("frequency");

    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;
    if (categoryId) where.categoryId = categoryId;
    if (frequency) where.frequency = frequency;
    if (startDate || endDate) {
      where.expenseDate = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { category: true, vendor: true },
      orderBy: { expenseDate: "desc" },
      take: 100,
    });
    return NextResponse.json(expenses);
  } catch (e) {
    console.error("GET /api/admin/expenses error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const expense = await prisma.expense.create({ data: body });
    return NextResponse.json(expense, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/expenses error:", e);
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
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/admin/expenses error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
