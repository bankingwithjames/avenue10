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
    const { name, type, category, subject, body, isActive } = await req.json();

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (type !== undefined) data.type = type;
    if (category !== undefined) data.category = category;
    if (subject !== undefined) data.subject = subject;
    if (body !== undefined) data.body = body;
    if (isActive !== undefined) data.isActive = isActive;

    const template = await prisma.messageTemplate.update({
      where: { id },
      data,
    });

    return NextResponse.json(template);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update template";
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
    await prisma.messageTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
