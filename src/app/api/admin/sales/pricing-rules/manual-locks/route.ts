import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const listingId = req.nextUrl.searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const locks = await prisma.manualPriceLock.findMany({
    where: { listingId },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json({ locks });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { listingId, startDate, endDate, lockedRate, lockReason, lockAppliesTo, expiresAt, preventAiChanges, preventBulkUpdates, preventDynamicRules } = body;

    if (!listingId || !startDate || !endDate || lockedRate == null) {
      return NextResponse.json({ error: "listingId, startDate, endDate, and lockedRate required" }, { status: 400 });
    }

    const lock = await prisma.manualPriceLock.create({
      data: {
        listingId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        lockedRate,
        lockReason: lockReason || null,
        lockAppliesTo: lockAppliesTo || "rate_only",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        preventAiChanges: preventAiChanges !== false,
        preventBulkUpdates: preventBulkUpdates !== false,
        preventDynamicRules: preventDynamicRules !== false,
        createdBy: session?.user?.email || null,
      },
    });

    // Apply locked rates to FinalDailyRate
    const start = new Date(startDate);
    const end = new Date(endDate);
    const d = new Date(start);
    let applied = 0;
    while (d <= end) {
      await prisma.finalDailyRate.upsert({
        where: { listingId_date: { listingId, date: new Date(d) } },
        update: { finalRate: lockedRate, rateSource: "manual_lock", manualOverrideRate: lockedRate, isLocked: true },
        create: { listingId, date: new Date(d), finalRate: lockedRate, rateSource: "manual_lock", baseRate: lockedRate, ruleAdjustedRate: lockedRate, manualOverrideRate: lockedRate, isLocked: true },
      });
      applied++;
      d.setDate(d.getDate() + 1);
    }

    await prisma.pricingChangeLog.create({
      data: {
        listingId,
        changedField: "manual_price_lock",
        newRate: lockedRate,
        changedByAdmin: session?.user?.email || null,
        changedFromPage: "sales_manager",
        reason: lockReason || `Manual lock: ${startDate} to ${endDate} at $${lockedRate}`,
      },
    });

    return NextResponse.json({ lock, datesApplied: applied });
  } catch (err) {
    console.error("Manual lock save error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const lockId = req.nextUrl.searchParams.get("id");
    const listingId = req.nextUrl.searchParams.get("listingId");
    if (!lockId) return NextResponse.json({ error: "id required" }, { status: 400 });

    const lock = await prisma.manualPriceLock.findUnique({ where: { id: lockId } });
    if (!lock) return NextResponse.json({ error: "Lock not found" }, { status: 404 });

    // Unlock affected dates
    const d = new Date(lock.startDate);
    while (d <= lock.endDate) {
      await prisma.finalDailyRate.updateMany({
        where: { listingId: lock.listingId, date: new Date(d), isLocked: true },
        data: { isLocked: false, manualOverrideRate: null, rateSource: "base" },
      });
      d.setDate(d.getDate() + 1);
    }

    await prisma.manualPriceLock.delete({ where: { id: lockId } });

    await prisma.pricingChangeLog.create({
      data: {
        listingId: listingId || lock.listingId,
        changedField: "manual_price_lock_removed",
        changedFromPage: "sales_manager",
        reason: `Removed lock for ${lock.startDate.toISOString().split("T")[0]} to ${lock.endDate.toISOString().split("T")[0]}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Manual lock delete error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
