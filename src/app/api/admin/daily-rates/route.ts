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

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  const where: Record<string, unknown> = { listingId };
  if (from || to) {
    where.date = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
  }

  const rates = await prisma.finalDailyRate.findMany({
    where,
    orderBy: { date: "asc" },
  });

  return NextResponse.json(rates);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { listingId, date, finalRate, rateSource, isLocked, manualOverrideRate } = await req.json();

  if (!listingId || !date) {
    return NextResponse.json({ error: "listingId and date required" }, { status: 400 });
  }

  const rate = await prisma.finalDailyRate.upsert({
    where: { listingId_date: { listingId, date: new Date(date) } },
    update: {
      ...(finalRate !== undefined && { finalRate }),
      ...(rateSource !== undefined && { rateSource }),
      ...(isLocked !== undefined && { isLocked }),
      ...(manualOverrideRate !== undefined && { manualOverrideRate }),
    },
    create: {
      listingId,
      date: new Date(date),
      finalRate: finalRate ?? 0,
      rateSource: rateSource ?? "base",
      isLocked: isLocked ?? false,
      manualOverrideRate,
    },
  });

  return NextResponse.json(rate);
}
