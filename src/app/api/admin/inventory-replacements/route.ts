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

    const replacements = await prisma.inventoryReplacement.findMany({
      where,
      include: { item: true },
      orderBy: [{ priority: "asc" }, { replacementDate: "asc" }],
    });
    return NextResponse.json(replacements);
  } catch (e) {
    console.error("GET /api/admin/inventory-replacements error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const totalReplacementCost =
      (body.quantityReplaced || 0) * (body.replacementCostPerItem || 0);

    const replacement = await prisma.inventoryReplacement.create({
      data: { ...body, totalReplacementCost },
    });
    return NextResponse.json(replacement, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/inventory-replacements error:", e);
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
    const replacement = await prisma.inventoryReplacement.update({
      where: { id },
      data,
    });
    return NextResponse.json(replacement);
  } catch (e) {
    console.error("PUT /api/admin/inventory-replacements error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
