import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const messages = await prisma.guestMessage.findMany({
      where: { guestId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(messages);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const {
      reservationId,
      channel,
      messageType,
      direction,
      subject,
      body,
      deliveryStatus,
      campaignId,
    } = await req.json();

    if (!channel || !messageType || !body) {
      return NextResponse.json(
        { error: "channel, messageType, and body are required" },
        { status: 400 }
      );
    }

    const message = await prisma.guestMessage.create({
      data: {
        guestId: id,
        reservationId,
        channel,
        messageType,
        direction: direction || "outbound",
        subject,
        body,
        deliveryStatus: deliveryStatus || "sent",
        campaignId,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
