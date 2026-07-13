import { prisma } from "@/lib/prisma";
import { calculateNightlyRate, identifyGapNights } from "@/lib/pricing/calculateNightlyRate";
import type {
  DynamicPricingSettings,
  OccupancyRuleSettings,
  BookingPaceRuleSettings,
  MarketCompRuleSettings,
} from "@/lib/pricing/types";

export async function generateDynamicRates(listingId: string) {
  const [settings, salesConfig, reservations, occupancySettings, bookingPaceSettings, marketCompSettings, manualLocks] =
    await Promise.all([
      prisma.dynamicPricingSettings.findUnique({ where: { listingId } }),
      prisma.salesConfig.findUnique({ where: { listingId } }),
      prisma.reservation.findMany({
        where: { listingId, status: { in: ["confirmed", "pending"] } },
        select: { checkIn: true, checkOut: true, createdAt: true },
      }),
      prisma.occupancyPricingSettings.findUnique({ where: { listingId } }),
      prisma.bookingPaceSettings.findUnique({ where: { listingId } }),
      prisma.marketCompSettings.findUnique({ where: { listingId } }),
      prisma.manualPriceLock.findMany({
        where: { listingId },
      }),
    ]);

  if (!salesConfig?.isActive) return { generated: 0 };

  const baseRate = salesConfig.boardRate;
  const weekendRate = salesConfig.weekendRate ?? null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build booked dates set
  const bookedDates = new Set<string>();
  for (const r of reservations) {
    const d = new Date(r.checkIn);
    while (d < r.checkOut) {
      bookedDates.add(d.toISOString().split("T")[0]);
      d.setDate(d.getDate() + 1);
    }
  }

  const resRanges = reservations.map((r) => ({
    checkIn: new Date(r.checkIn),
    checkOut: new Date(r.checkOut),
  }));
  const gapDates = identifyGapNights(resRanges);

  // Build manual lock map (date string → locked rate)
  const lockMap = new Map<string, number>();
  for (const lock of manualLocks) {
    if (lock.expiresAt && lock.expiresAt < today) continue;
    const d = new Date(lock.startDate);
    while (d <= lock.endDate) {
      lockMap.set(d.toISOString().split("T")[0], lock.lockedRate);
      d.setDate(d.getDate() + 1);
    }
  }

  const dynamicSettings: DynamicPricingSettings | null = settings
    ? {
        enabled: settings.enabled,
        pricingMode: settings.pricingMode as "conservative" | "balanced" | "aggressive",
        minimumRate: settings.minimumRate,
        maximumRate: settings.maximumRate,
        weekendPremiumPercent: settings.weekendPremiumPercent,
        eventPremiumPercent: settings.eventPremiumPercent,
        gapNightDiscountPercent: settings.gapNightDiscountPercent,
        lastMinuteDiscountPercent: settings.lastMinuteDiscountPercent,
        farOutPremiumPercent: settings.farOutPremiumPercent,
        occupancyBasedEnabled: occupancySettings?.isEnabled ?? settings.occupancyBasedEnabled,
        bookingPaceEnabled: bookingPaceSettings?.isEnabled ?? settings.bookingPaceEnabled,
        marketCompEnabled: marketCompSettings?.isEnabled ?? settings.marketCompEnabled,
        manualPriceLockEnabled: settings.manualPriceLockEnabled,
      }
    : null;

  // Calculate occupancy percent
  const occupancyWindowDays = occupancySettings?.occupancyWindowDays ?? 30;
  let occupancyPercent = 0;
  if (occupancySettings?.isEnabled) {
    let bookedCount = 0;
    for (let i = 0; i < occupancyWindowDays; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      if (bookedDates.has(d.toISOString().split("T")[0])) bookedCount++;
    }
    occupancyPercent = Math.round((bookedCount / occupancyWindowDays) * 100);
  }

  // Calculate booking pace percent
  let bookingPacePercent = 0;
  if (bookingPaceSettings?.isEnabled) {
    const compDays = bookingPaceSettings.comparisonPeriodDays ?? 90;
    const compStart = new Date(today);
    compStart.setDate(compStart.getDate() - compDays);

    const recentBookings = reservations.filter(
      (r) => r.createdAt >= compStart && r.createdAt <= today
    ).length;

    const halfCompStart = new Date(today);
    halfCompStart.setDate(halfCompStart.getDate() - compDays * 2);

    const priorBookings = reservations.filter(
      (r) => r.createdAt >= halfCompStart && r.createdAt < compStart
    ).length;

    if (priorBookings > 0) {
      bookingPacePercent = Math.round((recentBookings / priorBookings) * 100);
    } else if (recentBookings > 0) {
      bookingPacePercent = 150;
    }
  }

  // Build rule settings for the engine
  const occRuleSettings: OccupancyRuleSettings | null = occupancySettings?.isEnabled
    ? {
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
      }
    : null;

  const paceRuleSettings: BookingPaceRuleSettings | null = bookingPaceSettings?.isEnabled
    ? {
        fastPaceThresholdPercent: bookingPaceSettings.fastPaceThresholdPercent ?? 120,
        slowPaceThresholdPercent: bookingPaceSettings.slowPaceThresholdPercent ?? 80,
        fastPaceAdjustmentPercent: bookingPaceSettings.fastPaceAdjustmentPercent ?? 10,
        slowPaceAdjustmentPercent: bookingPaceSettings.slowPaceAdjustmentPercent ?? 10,
        maxAdjustmentPercent: bookingPaceSettings.maxAdjustmentPercent ?? 20,
        excludeLockedDates: bookingPaceSettings.excludeLockedDates ?? true,
      }
    : null;

  const compRuleSettings: MarketCompRuleSettings | null = marketCompSettings?.isEnabled
    ? {
        targetMarketPosition: marketCompSettings.targetMarketPosition ?? "premium",
        adjustmentStrength: marketCompSettings.adjustmentStrength ?? "balanced",
        maxIncreasePercent: marketCompSettings.maxIncreasePercent ?? 20,
        maxDecreasePercent: marketCompSettings.maxDecreasePercent ?? 15,
        excludeLockedDates: marketCompSettings.excludeLockedDates ?? true,
      }
    : null;

  const daysOut = 365;
  let generated = 0;

  for (let i = 0; i < daysOut; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    if (bookedDates.has(dateStr)) continue;

    // Manual lock takes priority — write locked rate directly
    const lockedRate = lockMap.get(dateStr);
    if (lockedRate !== undefined) {
      const skipLocked =
        (occRuleSettings?.excludeLockedDates ?? true) &&
        (paceRuleSettings?.excludeLockedDates ?? true);

      if (skipLocked) {
        await prisma.finalDailyRate.upsert({
          where: { listingId_date: { listingId, date } },
          update: {
            finalRate: lockedRate,
            rateSource: "manual_lock",
            baseRate: lockedRate,
            ruleAdjustedRate: lockedRate,
            manualOverrideRate: lockedRate,
            isLocked: true,
          },
          create: {
            listingId,
            date,
            finalRate: lockedRate,
            rateSource: "manual_lock",
            baseRate: lockedRate,
            ruleAdjustedRate: lockedRate,
            manualOverrideRate: lockedRate,
            isLocked: true,
          },
        });
        generated++;
        continue;
      }
    }

    // Check if date is already locked by admin (not from a ManualPriceLock record)
    if (dynamicSettings?.enabled && dynamicSettings.manualPriceLockEnabled && !lockedRate) {
      const existing = await prisma.finalDailyRate.findUnique({
        where: { listingId_date: { listingId, date } },
      });
      if (existing?.isLocked) continue;
    }

    const breakdown = calculateNightlyRate({
      date,
      baseRate,
      weekendRate,
      dynamicSettings,
      manualOverride: null,
      daysFromToday: i,
      isGapNight: gapDates.has(dateStr),
      occupancyPercent,
      bookingPacePercent,
      marketCompRate: null,
      occupancyRuleSettings: occRuleSettings,
      bookingPaceRuleSettings: paceRuleSettings,
      marketCompRuleSettings: compRuleSettings,
    });

    await prisma.finalDailyRate.upsert({
      where: { listingId_date: { listingId, date } },
      update: {
        finalRate: breakdown.rate,
        rateSource: breakdown.source,
        baseRate,
        ruleAdjustedRate: breakdown.rate,
      },
      create: {
        listingId,
        date,
        finalRate: breakdown.rate,
        rateSource: breakdown.source,
        baseRate,
        ruleAdjustedRate: breakdown.rate,
      },
    });
    generated++;
  }

  return { generated, occupancyPercent, bookingPacePercent };
}
