import { prisma } from "@/lib/prisma";
import { calculateNightlyRate, identifyGapNights } from "@/lib/pricing/calculateNightlyRate";
import type { DynamicPricingSettings } from "@/lib/pricing/types";

export async function generateDynamicRates(listingId: string) {
  const [settings, salesConfig, reservations] = await Promise.all([
    prisma.dynamicPricingSettings.findUnique({ where: { listingId } }),
    prisma.salesConfig.findUnique({ where: { listingId } }),
    prisma.reservation.findMany({
      where: { listingId, status: { in: ["confirmed", "pending"] } },
      select: { checkIn: true, checkOut: true },
    }),
  ]);

  if (!salesConfig?.isActive) return { generated: 0 };

  const baseRate = salesConfig.boardRate;
  const weekendRate = salesConfig.weekendRate ?? null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
        occupancyBasedEnabled: settings.occupancyBasedEnabled,
        bookingPaceEnabled: settings.bookingPaceEnabled,
        marketCompEnabled: settings.marketCompEnabled,
        manualPriceLockEnabled: settings.manualPriceLockEnabled,
      }
    : null;

  const daysOut = 365;
  const upserts: { date: Date; rate: number; source: string }[] = [];

  for (let i = 0; i < daysOut; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    if (bookedDates.has(dateStr)) continue;

    const breakdown = calculateNightlyRate({
      date,
      baseRate,
      weekendRate,
      dynamicSettings,
      manualOverride: null,
      daysFromToday: i,
      isGapNight: gapDates.has(dateStr),
      occupancyPercent: 0,
      bookingPacePercent: 0,
      marketCompRate: null,
    });

    upserts.push({ date, rate: breakdown.rate, source: breakdown.source });
  }

  let generated = 0;
  for (const u of upserts) {
    if (dynamicSettings?.enabled && dynamicSettings.manualPriceLockEnabled) {
      const existing = await prisma.finalDailyRate.findUnique({
        where: { listingId_date: { listingId, date: u.date } },
      });
      if (existing?.isLocked) continue;
    }

    await prisma.finalDailyRate.upsert({
      where: { listingId_date: { listingId, date: u.date } },
      update: {
        finalRate: u.rate,
        rateSource: u.source,
        baseRate: u.rate,
        ruleAdjustedRate: u.rate,
      },
      create: {
        listingId,
        date: u.date,
        finalRate: u.rate,
        rateSource: u.source,
        baseRate: u.rate,
        ruleAdjustedRate: u.rate,
      },
    });
    generated++;
  }

  return { generated };
}
