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

    const logs = await prisma.maintenanceLog.findMany({
      where,
      include: { vendor: true },
      orderBy: { maintenanceDate: "desc" },
    });
    return NextResponse.json(logs);
  } catch (e) {
    console.error("GET /api/admin/maintenance-logs error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const log = await prisma.maintenanceLog.create({ data: body });
    return NextResponse.json(log, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/maintenance-logs error:", e);
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
    const log = await prisma.maintenanceLog.update({ where: { id }, data });
    return NextResponse.json(log);
  } catch (e) {
    console.error("PUT /api/admin/maintenance-logs error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
