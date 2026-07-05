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

    const files = await prisma.maintenanceFile.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(files);
  } catch (e) {
    console.error("GET /api/admin/maintenance-files error:", e);
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
    const file = await prisma.maintenanceFile.create({ data: body });
    return NextResponse.json(file, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/maintenance-files error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
