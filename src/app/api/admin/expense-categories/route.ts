import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const categories = await prisma.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (e) {
    console.error("GET /api/admin/expense-categories error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const category = await prisma.expenseCategory.create({ data: body });
    return NextResponse.json(category, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/expense-categories error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
