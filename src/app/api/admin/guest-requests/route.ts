import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const requests = await prisma.guestRequest.findMany({
    include: {
      reservation: { select: { guestName: true, listing: { select: { title: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id, status, adminReply, assignedStaff, internalNotes, priority, category } =
    await req.json();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (adminReply !== undefined) data.adminReply = adminReply;
  if (assignedStaff !== undefined) data.assignedStaff = assignedStaff;
  if (internalNotes !== undefined) data.internalNotes = internalNotes;
  if (priority !== undefined) data.priority = priority;
  if (category !== undefined) data.category = category;

  const request = await prisma.guestRequest.update({
    where: { id },
    data,
  });

  return NextResponse.json(request);
}
