import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const guestType = searchParams.get("guestType");
    const isVip = searchParams.get("isVip");
    const tagId = searchParams.get("tagId");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (guestType) where.guestType = guestType;
    if (isVip === "true") where.isVip = true;
    if (tagId) {
      where.tags = { some: { tagId } };
    }

    const guests = await prisma.guest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        tags: { include: { tag: true } },
        accommodation: true,
        _count: { select: { messages: true, notes: true } },
      },
    });

    return NextResponse.json(guests);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

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

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "firstName, lastName, and email are required" },
        { status: 400 }
      );
    }

    const guest = await prisma.guest.create({
      data: {
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
      },
      include: {
        tags: { include: { tag: true } },
        accommodation: true,
      },
    });

    return NextResponse.json(guest, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create guest";
    if (typeof message === "string" && message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A guest with this email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
