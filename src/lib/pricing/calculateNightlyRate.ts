import type {
  NightlyRateContext,
  NightlyBreakdown,
  RuleAdjustment,
  DynamicPricingSettings,
  PricingMode,
} from "./types";

const MODE_MULTIPLIERS: Record<PricingMode, number> = {
  conservative: 0.5,
  balanced: 1.0,
  aggressive: 1.5,
};

const LAST_MINUTE_WINDOWS: Record<PricingMode, number> = {
  conservative: 3,
  balanced: 7,
  aggressive: 14,
};

const FAR_OUT_WINDOWS: Record<PricingMode, number> = {
  conservative: 120,
  balanced: 90,
  aggressive: 60,
};

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 5 || day === 6;
}

function applyRule(
  rate: number,
  rule: string,
  description: string,
  multiplier: number,
  adjustments: RuleAdjustment[]
): number {
  const rateBeforeRule = rate;
  const rateAfterRule = Math.round(rate * multiplier * 100) / 100;
  adjustments.push({ rule, description, multiplier, rateBeforeRule, rateAfterRule });
  return rateAfterRule;
}

/**
 * Deterministic rule ordering for a single night:
 * 1. Manual price lock (if locked, skip all other rules)
 * 2. Base rate selection (weekday vs weekend/event)
 * 3. Weekend premium (only if no explicit weekend rate)
 * 4. Event premium
 * 5. Gap-night discount
 * 6. Last-minute discount
 * 7. Far-out premium
 * 8. Occupancy-based adjustment
 * 9. Booking pace adjustment
 * 10. Market comp adjustment
 * 11. Clamp to min/max rate
 */
export function calculateNightlyRate(ctx: NightlyRateContext): NightlyBreakdown {
  const dateStr = ctx.date.toISOString().split("T")[0];
  const adjustments: RuleAdjustment[] = [];

  // Rule 1: Manual price lock — highest priority, skip everything
  if (ctx.manualOverride?.isLocked) {
    return {
      date: dateStr,
      rate: ctx.manualOverride.rate,
      source: "manual",
      adjustments: [{
        rule: "manual_lock",
        description: "Manually locked rate",
        multiplier: 1,
        rateBeforeRule: ctx.manualOverride.rate,
        rateAfterRule: ctx.manualOverride.rate,
      }],
    };
  }

  // Rule 2: Base rate selection
  const weekend = isWeekend(ctx.date);
  let rate: number;
  let source: string;

  if (weekend && ctx.weekendRate !== null && ctx.weekendRate > 0) {
    rate = ctx.weekendRate;
    source = "weekend";
    adjustments.push({
      rule: "base_rate",
      description: "Weekend rate applied",
      multiplier: 1,
      rateBeforeRule: ctx.baseRate,
      rateAfterRule: rate,
    });
  } else {
    rate = ctx.baseRate;
    source = "base";
    adjustments.push({
      rule: "base_rate",
      description: "Base nightly rate",
      multiplier: 1,
      rateBeforeRule: rate,
      rateAfterRule: rate,
    });
  }

  const ds = ctx.dynamicSettings;
  if (!ds || !ds.enabled) {
    return { date: dateStr, rate, source, adjustments };
  }

  source = "dynamic";
  const mm = MODE_MULTIPLIERS[ds.pricingMode];

  // Rule 3: Weekend premium (only when no explicit weekend rate)
  if (weekend && ds.weekendPremiumPercent > 0 && (ctx.weekendRate === null || ctx.weekendRate === 0)) {
    const pct = ds.weekendPremiumPercent * mm;
    rate = applyRule(rate, "weekend_premium", `Weekend premium ${pct.toFixed(1)}%`, 1 + pct / 100, adjustments);
  }

  // Rule 4: Event premium
  if (ds.eventPremiumPercent > 0) {
    // Event premium is a placeholder — applied when event data is available
    // Currently a no-op; the rule slot is reserved for future event calendar integration
  }

  // Rule 5: Gap-night discount
  if (ctx.isGapNight && ds.gapNightDiscountPercent > 0) {
    const pct = ds.gapNightDiscountPercent * mm;
    rate = applyRule(rate, "gap_night", `Gap-night discount ${pct.toFixed(1)}%`, 1 - pct / 100, adjustments);
  }

  // Rule 6: Last-minute discount
  const lastMinuteWindow = LAST_MINUTE_WINDOWS[ds.pricingMode];
  if (ctx.daysFromToday <= lastMinuteWindow && ds.lastMinuteDiscountPercent > 0) {
    const pct = ds.lastMinuteDiscountPercent * mm;
    rate = applyRule(rate, "last_minute", `Last-minute discount ${pct.toFixed(1)}% (${ctx.daysFromToday}d out)`, 1 - pct / 100, adjustments);
  }

  // Rule 7: Far-out premium
  const farOutWindow = FAR_OUT_WINDOWS[ds.pricingMode];
  if (ctx.daysFromToday >= farOutWindow && ds.farOutPremiumPercent > 0) {
    const pct = ds.farOutPremiumPercent * mm;
    rate = applyRule(rate, "far_out", `Far-out premium ${pct.toFixed(1)}% (${ctx.daysFromToday}d out)`, 1 + pct / 100, adjustments);
  }

  // Rule 8: Occupancy-based adjustment
  if (ds.occupancyBasedEnabled && ctx.occupancyPercent > 0) {
    // Scale: 0-50% occupancy = no effect, 50-80% = up to +10%, 80-100% = up to +25%
    let occMultiplier = 1;
    if (ctx.occupancyPercent >= 80) {
      occMultiplier = 1 + (0.25 * mm * (ctx.occupancyPercent - 80)) / 20;
    } else if (ctx.occupancyPercent >= 50) {
      occMultiplier = 1 + (0.10 * mm * (ctx.occupancyPercent - 50)) / 30;
    }
    if (occMultiplier > 1) {
      rate = applyRule(rate, "occupancy", `Occupancy adjustment (${ctx.occupancyPercent}% booked)`, occMultiplier, adjustments);
    }
  }

  // Rule 9: Booking pace adjustment
  if (ds.bookingPaceEnabled && ctx.bookingPacePercent > 0) {
    // Faster-than-expected pace = higher rates
    // bookingPacePercent: 100 = normal, >100 = faster, <100 = slower
    if (ctx.bookingPacePercent > 110) {
      const paceBoost = Math.min(((ctx.bookingPacePercent - 100) / 100) * mm, 0.3);
      rate = applyRule(rate, "booking_pace", `Booking pace premium (${ctx.bookingPacePercent}% of expected)`, 1 + paceBoost, adjustments);
    } else if (ctx.bookingPacePercent < 90) {
      const paceDiscount = Math.min(((100 - ctx.bookingPacePercent) / 100) * mm, 0.15);
      rate = applyRule(rate, "booking_pace", `Booking pace discount (${ctx.bookingPacePercent}% of expected)`, 1 - paceDiscount, adjustments);
    }
  }

  // Rule 10: Market comp adjustment
  if (ds.marketCompEnabled && ctx.marketCompRate !== null && ctx.marketCompRate > 0) {
    const compRatio = ctx.marketCompRate / rate;
    if (compRatio > 1.05 || compRatio < 0.95) {
      const blendFactor = 0.3 * mm;
      const blendedRate = rate + (ctx.marketCompRate - rate) * blendFactor;
      const multiplier = blendedRate / rate;
      rate = applyRule(rate, "market_comp", `Market comp adjustment (comp: $${ctx.marketCompRate.toFixed(0)})`, multiplier, adjustments);
    }
  }

  // Rule 11: Clamp to min/max
  if (ds.minimumRate > 0 && rate < ds.minimumRate) {
    adjustments.push({
      rule: "clamp_min",
      description: `Clamped to minimum rate $${ds.minimumRate}`,
      multiplier: ds.minimumRate / rate,
      rateBeforeRule: rate,
      rateAfterRule: ds.minimumRate,
    });
    rate = ds.minimumRate;
  }
  if (ds.maximumRate > 0 && rate > ds.maximumRate) {
    adjustments.push({
      rule: "clamp_max",
      description: `Clamped to maximum rate $${ds.maximumRate}`,
      multiplier: ds.maximumRate / rate,
      rateBeforeRule: rate,
      rateAfterRule: ds.maximumRate,
    });
    rate = ds.maximumRate;
  }

  rate = Math.round(rate * 100) / 100;

  return { date: dateStr, rate, source, adjustments };
}

export function identifyGapNights(reservations: { checkIn: Date; checkOut: Date }[]): Set<string> {
  const gapDates = new Set<string>();
  const sorted = [...reservations].sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());

  for (let i = 0; i < sorted.length - 1; i++) {
    const gapStart = sorted[i].checkOut;
    const gapEnd = sorted[i + 1].checkIn;
    const gapNights = Math.round((gapEnd.getTime() - gapStart.getTime()) / (1000 * 60 * 60 * 24));
    if (gapNights > 0 && gapNights <= 2) {
      const d = new Date(gapStart);
      while (d < gapEnd) {
        gapDates.add(d.toISOString().split("T")[0]);
        d.setDate(d.getDate() + 1);
      }
    }
  }

  return gapDates;
}
