import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const bookingId = req.nextUrl.searchParams.get("bookingId");
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId required" }, { status: 400 });
    }

    const expenses = await prisma.bookingExpense.findMany({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (e) {
    console.error("GET /api/admin/booking-expenses error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const expense = await prisma.bookingExpense.create({ data: body });
    return NextResponse.json(expense, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/booking-expenses error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
