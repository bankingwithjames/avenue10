import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const items = await prisma.localRecommendation.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const data = await req.json();
  const item = await prisma.localRecommendation.create({ data });
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id, ...data } = await req.json();
  const item = await prisma.localRecommendation.update({ where: { id }, data });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await req.json();
  await prisma.localRecommendation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
