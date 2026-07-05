import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const propertyId = req.nextUrl.searchParams.get("propertyId");
    const bookingId = req.nextUrl.searchParams.get("bookingId");

    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;
    if (bookingId) where.bookingId = bookingId;

    const checks = await prisma.cleanerInventoryCheck.findMany({
      where,
      include: { item: true },
      orderBy: { checkedAt: "desc" },
    });
    return NextResponse.json(checks);
  } catch (e) {
    console.error("GET /api/admin/cleaner-checks error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const check = await prisma.cleanerInventoryCheck.create({ data: body });
    return NextResponse.json(check, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/cleaner-checks error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
