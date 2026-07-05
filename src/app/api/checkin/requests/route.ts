import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGuest } from "@/lib/guestAuth";

export async function GET(req: NextRequest) {
  const { error, guest } = await requireGuest(req);
  if (error) return error;

  const requests = await prisma.guestRequest.findMany({
    where: { reservationId: guest!.reservationId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const { error, guest } = await requireGuest(req);
  if (error) return error;

  const { type, message, category, priority } = await req.json();
  if (!type || !message?.trim()) {
    return NextResponse.json({ error: "Type and message are required" }, { status: 400 });
  }

  const request = await prisma.guestRequest.create({
    data: {
      reservationId: guest!.reservationId,
      type,
      message: message.trim(),
      category: category || "general",
      priority: priority || "normal",
    },
  });

  return NextResponse.json(request);
}
