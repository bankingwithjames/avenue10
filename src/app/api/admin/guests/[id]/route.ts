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
    const guest = await prisma.guest.findUnique({
      where: { id },
      include: {
        accommodation: true,
        tags: { include: { tag: true } },
        notes: { orderBy: { createdAt: "desc" } },
        messages: { orderBy: { createdAt: "desc" }, take: 50 },
        campaignRecipients: {
          include: { campaign: { select: { id: true, name: true, type: true } } },
          orderBy: { sentAt: "desc" },
        },
        activityLogs: { orderBy: { createdAt: "desc" }, take: 50 },
        _count: { select: { messages: true, notes: true } },
      },
    });

    if (!guest) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    return NextResponse.json(guest);
  } catch {
    return NextResponse.json(null);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      status,
      guestType,
      isVip,
      doNotHost,
      doNotContact,
      emailOptIn,
      smsOptIn,
      marketingOptIn,
      preferredContact,
      source,
      internalNotes,
    } = body;

    const data: Record<string, unknown> = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (status !== undefined) data.status = status;
    if (guestType !== undefined) data.guestType = guestType;
    if (isVip !== undefined) data.isVip = isVip;
    if (doNotHost !== undefined) data.doNotHost = doNotHost;
    if (doNotContact !== undefined) data.doNotContact = doNotContact;
    if (emailOptIn !== undefined) data.emailOptIn = emailOptIn;
    if (smsOptIn !== undefined) data.smsOptIn = smsOptIn;
    if (marketingOptIn !== undefined) data.marketingOptIn = marketingOptIn;
    if (preferredContact !== undefined) data.preferredContact = preferredContact;
    if (source !== undefined) data.source = source;
    if (internalNotes !== undefined) data.internalNotes = internalNotes;

    const guest = await prisma.guest.update({
      where: { id },
      data,
      include: {
        tags: { include: { tag: true } },
        accommodation: true,
      },
    });

    return NextResponse.json(guest);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update guest";
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
    await prisma.guest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete guest";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
