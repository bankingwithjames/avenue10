import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const maintenanceLogId = req.nextUrl.searchParams.get("maintenanceLogId");
    const where: Record<string, unknown> = {};
    if (maintenanceLogId) where.maintenanceLogId = maintenanceLogId;

    const logs = await prisma.maintenanceActivityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(logs);
  } catch (e) {
    console.error("GET /api/admin/maintenance-activity error:", e);
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
    const activity = await prisma.maintenanceActivityLog.create({ data: body });
    return NextResponse.json(activity, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/maintenance-activity error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
