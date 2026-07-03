import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const listingId = req.nextUrl.searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const closedDates = await prisma.closedDate.findMany({
    where: { listingId },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(closedDates);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { listingId, dates, reason } = body;

  if (!listingId || !dates || !Array.isArray(dates)) {
    return NextResponse.json({ error: "listingId and dates[] required" }, { status: 400 });
  }

  const created = await prisma.closedDate.createMany({
    data: dates.map((d: string) => ({
      listingId,
      date: new Date(d),
      reason: reason || null,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ success: true, count: created.count }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { ids } = body;

  if (!ids || !Array.isArray(ids)) {
    return NextResponse.json({ error: "ids[] required" }, { status: 400 });
  }

  await prisma.closedDate.deleteMany({
    where: { id: { in: ids } },
  });

  return NextResponse.json({ success: true });
}
