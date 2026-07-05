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
    const task = await prisma.recurringMaintenanceTask.findUnique({
      where: { id },
    });
    if (!task) {
      return NextResponse.json(
        { error: "Recurring task not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(task);
  } catch (e) {
    console.error("GET /api/admin/recurring-maintenance/[id] error:", e);
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
    const task = await prisma.recurringMaintenanceTask.update({
      where: { id },
      data,
    });
    return NextResponse.json(task);
  } catch (e) {
    console.error("PUT /api/admin/recurring-maintenance/[id] error:", e);
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
    await prisma.recurringMaintenanceTask.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/admin/recurring-maintenance/[id] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
