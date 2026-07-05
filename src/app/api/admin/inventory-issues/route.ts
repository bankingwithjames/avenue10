import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const propertyId = req.nextUrl.searchParams.get("propertyId");
    const status = req.nextUrl.searchParams.get("status");
    const itemId = req.nextUrl.searchParams.get("itemId");

    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;
    if (itemId) where.itemId = itemId;

    const issues = await prisma.inventoryIssue.findMany({
      where,
      include: { item: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(issues);
  } catch (e) {
    console.error("GET /api/admin/inventory-issues error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const issue = await prisma.inventoryIssue.create({ data: body });
    return NextResponse.json(issue, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/inventory-issues error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
