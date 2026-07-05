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

    const tasks = await prisma.recurringMaintenanceTask.findMany({
      where,
      orderBy: { nextDueDate: "asc" },
    });
    return NextResponse.json(tasks);
  } catch (e) {
    console.error("GET /api/admin/recurring-maintenance error:", e);
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
    const task = await prisma.recurringMaintenanceTask.create({ data: body });
    return NextResponse.json(task, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/recurring-maintenance error:", e);
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
    const task = await prisma.recurringMaintenanceTask.update({
      where: { id },
      data,
    });
    return NextResponse.json(task);
  } catch (e) {
    console.error("PUT /api/admin/recurring-maintenance error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
