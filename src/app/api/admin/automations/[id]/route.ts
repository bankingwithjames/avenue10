import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const { name, trigger, templateId, delay, isActive, conditions } =
      await req.json();

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (trigger !== undefined) data.trigger = trigger;
    if (templateId !== undefined) data.templateId = templateId;
    if (delay !== undefined) data.delay = delay;
    if (isActive !== undefined) data.isActive = isActive;
    if (conditions !== undefined) data.conditions = conditions;

    const automation = await prisma.crmAutomation.update({
      where: { id },
      data,
    });

    return NextResponse.json(automation);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update automation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    await prisma.crmAutomation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete automation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
