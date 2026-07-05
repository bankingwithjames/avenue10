import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const searchParams = req.nextUrl.searchParams;
    const propertyId = searchParams.get("propertyId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const vendorId = searchParams.get("vendorId");
    const listingId = searchParams.get("listingId");

    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (vendorId) where.vendorId = vendorId;
    if (listingId) where.listingId = listingId;

    const logs = await prisma.maintenanceLog.findMany({
      where,
      include: {
        vendor: true,
        calendarEvents: true,
        files: true,
        activityLogs: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(logs);
  } catch (e) {
    console.error("GET /api/admin/maintenance-logs error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
