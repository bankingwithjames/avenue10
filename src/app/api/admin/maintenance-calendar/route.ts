import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const searchParams = req.nextUrl.searchParams;
    const propertyId = searchParams.get("propertyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};
    if (propertyId) where.propertyId = propertyId;
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.startDatetime = dateFilter;
    }

    const events = await prisma.maintenanceCalendarEvent.findMany({
      where,
      include: { maintenanceLog: true },
      orderBy: { startDatetime: "asc" },
    });
    return NextResponse.json(events);
  } catch (e) {
    console.error("GET /api/admin/maintenance-calendar error:", e);
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
    const event = await prisma.maintenanceCalendarEvent.create({ data: body });
    return NextResponse.json(event, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/maintenance-calendar error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
