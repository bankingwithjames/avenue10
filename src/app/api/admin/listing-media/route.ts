import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const listingId = req.nextUrl.searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const items = await prisma.listingMedia.findMany({
    where: { listingId },
    include: { media: true },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { listingId, mediaId, room, label } = await req.json();

  const maxOrder = await prisma.listingMedia.findFirst({
    where: { listingId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const item = await prisma.listingMedia.create({
    data: {
      listingId,
      mediaId,
      room: room || "General",
      label: label || "Untitled",
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
    },
    include: { media: true },
  });

  return NextResponse.json(item);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id, room, label, sortOrder } = await req.json();

  const item = await prisma.listingMedia.update({
    where: { id },
    data: { room, label, sortOrder },
    include: { media: true },
  });

  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await req.json();
  await prisma.listingMedia.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
