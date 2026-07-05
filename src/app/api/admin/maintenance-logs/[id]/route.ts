import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const log = await prisma.maintenanceLog.findUnique({
      where: { id },
      include: {
        vendor: true,
        calendarEvents: true,
        files: true,
        activityLogs: true,
      },
    });
    if (!log) {
      return NextResponse.json(
        { error: "Maintenance log not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(log);
  } catch (e) {
    console.error("GET /api/admin/maintenance-logs/[id] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const data = await req.json();
    const log = await prisma.maintenanceLog.update({ where: { id }, data });
    return NextResponse.json(log);
  } catch (e) {
    console.error("PUT /api/admin/maintenance-logs/[id] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.maintenanceLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/admin/maintenance-logs/[id] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
