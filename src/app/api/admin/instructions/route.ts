import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const listingId = req.nextUrl.searchParams.get("listingId");
  const items = await prisma.checkinInstruction.findMany({
    where: listingId ? { listingId } : {},
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const data = await req.json();
  const item = await prisma.checkinInstruction.create({ data });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id, ...data } = await req.json();
  const item = await prisma.checkinInstruction.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await req.json();
  await prisma.checkinInstruction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
