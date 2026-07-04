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

  const { id, status, adminReply } = await req.json();
  const request = await prisma.guestRequest.update({
    where: { id },
    data: { status, adminReply },
  });

  return NextResponse.json(request);
}
