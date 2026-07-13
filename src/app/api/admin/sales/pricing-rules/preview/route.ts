import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { calculateNightlyRate, identifyGapNights } from "@/lib/pricing/calculateNightlyRate";
import type { DynamicPricingSettings, OccupancyRuleSettings, BookingPaceRuleSettings, MarketCompRuleSettings } from "@/lib/pricing/types";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const listingId = req.nextUrl.searchParams.get("listingId");
  const startDate = req.nextUrl.searchParams.get("start");
  const endDate = req.nextUrl.searchParams.get("end");

  if (!listingId || !startDate || !endDate) {
    return NextResponse.json({ error: "listingId, start, and end required" }, { status: 400 });
  }

  try {
    const [salesConfig, dynamicSettings, occupancySettings, bookingPaceSettings, marketCompSettings, reservations, locks] = await Promise.all([
      prisma.salesConfig.findUnique({ where: { listingId } }),
      prisma.dynamicPricingSettings.findUnique({ where: { listingId } }),
      prisma.occupancyPricingSettings.findUnique({ where: { listingId } }),
      prisma.bookingPaceSettings.findUnique({ where: { listingId } }),
      prisma.marketCompSettings.findUnique({ where: { listingId } }),
      prisma.reservation.findMany({
        where: { listingId, status: { in: ["confirmed", "pending"] } },
        select: { checkIn: true, checkOut: true },
      }),
      prisma.manualPriceLock.findMany({
        where: { listingId, startDate: { lte: new Date(endDate) }, endDate: { gte: new Date(startDate) } },
      }),
    ]);

    if (!salesConfig?.isActive) {
      return NextResponse.json({ previews: [] });
    }

    const baseRate = salesConfig.boardRate;
    const weekendRate = salesConfig.weekendRate ?? null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const resRanges = reservations.map((r) => ({ checkIn: new Date(r.checkIn), checkOut: new Date(r.checkOut) }));
    const gapDates = identifyGapNights(resRanges);

    const bookedDates = new Set<string>();
    for (const r of reservations) {
      const d = new Date(r.checkIn);
      while (d < r.checkOut) {
        bookedDates.add(d.toISOString().split("T")[0]);
        d.setDate(d.getDate() + 1);
      }
    }

    // Build lock map
    const lockMap = new Map<string, typeof locks[0]>();
    for (const lock of locks) {
      if (lock.expiresAt && lock.expiresAt < today) continue;
      const d = new Date(lock.startDate);
      while (d <= lock.endDate) {
        lockMap.set(d.toISOString().split("T")[0], lock);
        d.setDate(d.getDate() + 1);
      }
    }

    // Calculate occupancy for the window
    const windowDays = occupancySettings?.occupancyWindowDays ?? 30;
    let occupancyPercent = 0;
    if (occupancySettings?.isEnabled) {
      let bookedCount = 0;
      for (let i = 0; i < windowDays; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        if (bookedDates.has(d.toISOString().split("T")[0])) bookedCount++;
      }
      occupancyPercent = Math.round((bookedCount / windowDays) * 100);
    }

    const ds: DynamicPricingSettings | null = dynamicSettings ? {
      enabled: dynamicSettings.enabled,
      pricingMode: dynamicSettings.pricingMode as "conservative" | "balanced" | "aggressive",
      minimumRate: dynamicSettings.minimumRate,
      maximumRate: dynamicSettings.maximumRate,
      weekendPremiumPercent: dynamicSettings.weekendPremiumPercent,
      eventPremiumPercent: dynamicSettings.eventPremiumPercent,
      gapNightDiscountPercent: dynamicSettings.gapNightDiscountPercent,
      lastMinuteDiscountPercent: dynamicSettings.lastMinuteDiscountPercent,
      farOutPremiumPercent: dynamicSettings.farOutPremiumPercent,
      occupancyBasedEnabled: occupancySettings?.isEnabled ?? false,
      bookingPaceEnabled: bookingPaceSettings?.isEnabled ?? false,
      marketCompEnabled: marketCompSettings?.isEnabled ?? false,
      manualPriceLockEnabled: dynamicSettings.manualPriceLockEnabled,
    } : null;

    const occRuleSettings: OccupancyRuleSettings | null = occupancySettings?.isEnabled ? {
      lowOccupancyThreshold: occupancySettings.lowOccupancyThreshold ?? 40,
      highOccupancyThreshold: occupancySettings.highOccupancyThreshold ?? 75,
      lowOccupancyAdjustmentPercent: occupancySettings.lowOccupancyAdjustmentPercent ?? 10,
      highOccupancyAdjustmentPercent: occupancySettings.highOccupancyAdjustmentPercent ?? 15,
      maxIncreasePercent: occupancySettings.maxIncreasePercent ?? 25,
      maxDecreasePercent: occupancySettings.maxDecreasePercent ?? 15,
      applyWeekdays: occupancySettings.applyWeekdays ?? true,
      applyWeekends: occupancySettings.applyWeekends ?? true,
      excludeLockedDates: occupancySettings.excludeLockedDates ?? true,
      excludeEventDates: occupancySettings.excludeEventDates ?? true,
    } : null;

    const paceRuleSettings: BookingPaceRuleSettings | null = bookingPaceSettings?.isEnabled ? {
      fastPaceThresholdPercent: bookingPaceSettings.fastPaceThresholdPercent ?? 120,
      slowPaceThresholdPercent: bookingPaceSettings.slowPaceThresholdPercent ?? 80,
      fastPaceAdjustmentPercent: bookingPaceSettings.fastPaceAdjustmentPercent ?? 10,
      slowPaceAdjustmentPercent: bookingPaceSettings.slowPaceAdjustmentPercent ?? 10,
      maxAdjustmentPercent: bookingPaceSettings.maxAdjustmentPercent ?? 20,
      excludeLockedDates: bookingPaceSettings.excludeLockedDates ?? true,
    } : null;

    const compRuleSettings: MarketCompRuleSettings | null = marketCompSettings?.isEnabled ? {
      targetMarketPosition: marketCompSettings.targetMarketPosition ?? "premium",
      adjustmentStrength: marketCompSettings.adjustmentStrength ?? "balanced",
      maxIncreasePercent: marketCompSettings.maxIncreasePercent ?? 20,
      maxDecreasePercent: marketCompSettings.maxDecreasePercent ?? 15,
      excludeLockedDates: marketCompSettings.excludeLockedDates ?? true,
    } : null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const previews: {
      date: string;
      baseRate: number;
      occupancyAdjustment: number;
      bookingPaceAdjustment: number;
      marketCompAdjustment: number;
      manualLockRate: number | null;
      finalPreviewRate: number;
      rateSource: string;
      isBooked: boolean;
      isLocked: boolean;
    }[] = [];

    const d = new Date(start);
    while (d <= end) {
      const dateStr = d.toISOString().split("T")[0];
      const daysFromToday = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const isBooked = bookedDates.has(dateStr);
      const lock = lockMap.get(dateStr);

      if (isBooked) {
        previews.push({
          date: dateStr,
          baseRate,
          occupancyAdjustment: 0,
          bookingPaceAdjustment: 0,
          marketCompAdjustment: 0,
          manualLockRate: null,
          finalPreviewRate: 0,
          rateSource: "booked",
          isBooked: true,
          isLocked: false,
        });
        d.setDate(d.getDate() + 1);
        continue;
      }

      if (lock) {
        previews.push({
          date: dateStr,
          baseRate,
          occupancyAdjustment: 0,
          bookingPaceAdjustment: 0,
          marketCompAdjustment: 0,
          manualLockRate: lock.lockedRate,
          finalPreviewRate: lock.lockedRate,
          rateSource: "manual_lock",
          isBooked: false,
          isLocked: true,
        });
        d.setDate(d.getDate() + 1);
        continue;
      }

      const breakdown = calculateNightlyRate({
        date: new Date(d),
        baseRate,
        weekendRate,
        dynamicSettings: ds,
        manualOverride: null,
        daysFromToday,
        isGapNight: gapDates.has(dateStr),
        occupancyPercent,
        bookingPacePercent: 0,
        marketCompRate: null,
        occupancyRuleSettings: occRuleSettings,
        bookingPaceRuleSettings: paceRuleSettings,
        marketCompRuleSettings: compRuleSettings,
      });

      // Calculate individual adjustments for the preview
      const baseResult = calculateNightlyRate({
        date: new Date(d),
        baseRate,
        weekendRate,
        dynamicSettings: null,
        manualOverride: null,
        daysFromToday,
        isGapNight: false,
        occupancyPercent: 0,
        bookingPacePercent: 0,
        marketCompRate: null,
      });

      const occupancyAdj = breakdown.adjustments.find((a) => a.rule === "occupancy");
      const paceAdj = breakdown.adjustments.find((a) => a.rule === "booking_pace");
      const compAdj = breakdown.adjustments.find((a) => a.rule === "market_comp");

      previews.push({
        date: dateStr,
        baseRate: baseResult.rate,
        occupancyAdjustment: occupancyAdj ? occupancyAdj.rateAfterRule - occupancyAdj.rateBeforeRule : 0,
        bookingPaceAdjustment: paceAdj ? paceAdj.rateAfterRule - paceAdj.rateBeforeRule : 0,
        marketCompAdjustment: compAdj ? compAdj.rateAfterRule - compAdj.rateBeforeRule : 0,
        manualLockRate: null,
        finalPreviewRate: breakdown.rate,
        rateSource: breakdown.source,
        isBooked: false,
        isLocked: false,
      });

      d.setDate(d.getDate() + 1);
    }

    return NextResponse.json({
      previews,
      occupancyPercent,
      rules: {
        occupancy: occupancySettings?.isEnabled ?? false,
        bookingPace: bookingPaceSettings?.isEnabled ?? false,
        marketComp: marketCompSettings?.isEnabled ?? false,
        manualLocks: locks.length,
      },
    });
  } catch (err) {
    console.error("Preview generation error:", err);
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}
