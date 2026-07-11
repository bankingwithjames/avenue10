import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const listingId = req.nextUrl.searchParams.get("listingId");
  const start = req.nextUrl.searchParams.get("start");
  const end = req.nextUrl.searchParams.get("end");

  if (!listingId || !start || !end) {
    return NextResponse.json(
      { error: "listingId, start, and end required" },
      { status: 400 }
    );
  }

  const rates = await prisma.finalDailyRate.findMany({
    where: {
      listingId,
      date: {
        gte: new Date(start),
        lte: new Date(end + "T23:59:59Z"),
      },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({
    rates: rates.map((r) => ({
      id: r.id,
      date: r.date.toISOString(),
      baseRate: r.baseRate ?? 0,
      ruleAdjustedRate: r.ruleAdjustedRate,
      aiSuggestedRate: r.aiSuggestedRate,
      adminApprovedRate: r.approvedAiRate,
      manualOverrideRate: r.manualOverrideRate,
      finalRate: r.finalRate,
      rateSource: r.rateSource,
      isLocked: r.isLocked,
    })),
  });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { listingId, date, manualOverrideRate, isLocked } = body;

    if (!listingId || !date) {
      return NextResponse.json(
        { error: "listingId and date required" },
        { status: 400 }
      );
    }

    const dateObj = new Date(date + "T00:00:00Z");

    const salesConfig = await prisma.salesConfig.findUnique({
      where: { listingId },
    });
    const baseRate = salesConfig?.boardRate ?? 0;

    const finalRate = manualOverrideRate ?? baseRate;

    const rate = await prisma.finalDailyRate.upsert({
      where: {
        listingId_date: { listingId, date: dateObj },
      },
      update: {
        manualOverrideRate: manualOverrideRate ?? undefined,
        finalRate,
        rateSource: manualOverrideRate != null ? "manual_override" : "base",
        isLocked: isLocked ?? false,
      },
      create: {
        listingId,
        date: dateObj,
        baseRate,
        finalRate,
        manualOverrideRate: manualOverrideRate ?? null,
        rateSource: manualOverrideRate != null ? "manual_override" : "base",
        isLocked: isLocked ?? false,
      },
    });

    return NextResponse.json(rate);
  } catch (err) {
    console.error("Daily rate save error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
