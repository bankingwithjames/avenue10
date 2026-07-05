import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const vendors = await prisma.vendor.findMany({
      where: { isActive: true },
      orderBy: { vendorName: "asc" },
    });
    return NextResponse.json(vendors);
  } catch (e) {
    console.error("GET /api/admin/inventory-vendors error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const vendor = await prisma.vendor.create({ data: body });
    return NextResponse.json(vendor, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/inventory-vendors error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
