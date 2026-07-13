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
    const occRule = ctx.occupancyRuleSettings;
    const weekend = isWeekend(ctx.date);
    const skipForDayType = occRule && ((!occRule.applyWeekdays && !weekend) || (!occRule.applyWeekends && weekend));

    if (!skipForDayType) {
      const lowThreshold = occRule?.lowOccupancyThreshold ?? 40;
      const highThreshold = occRule?.highOccupancyThreshold ?? 75;
      const lowAdjPct = occRule?.lowOccupancyAdjustmentPercent ?? 10;
      const highAdjPct = occRule?.highOccupancyAdjustmentPercent ?? 15;
      const maxInc = occRule?.maxIncreasePercent ?? 25;
      const maxDec = occRule?.maxDecreasePercent ?? 15;

      let occMultiplier = 1;
      if (ctx.occupancyPercent >= highThreshold) {
        const scale = Math.min((ctx.occupancyPercent - highThreshold) / (100 - highThreshold), 1);
        occMultiplier = 1 + (highAdjPct / 100) * scale * mm;
        occMultiplier = Math.min(occMultiplier, 1 + maxInc / 100);
      } else if (ctx.occupancyPercent <= lowThreshold) {
        const scale = Math.min((lowThreshold - ctx.occupancyPercent) / lowThreshold, 1);
        occMultiplier = 1 - (lowAdjPct / 100) * scale * mm;
        occMultiplier = Math.max(occMultiplier, 1 - maxDec / 100);
      }

      if (occMultiplier !== 1) {
        rate = applyRule(rate, "occupancy", `Occupancy adjustment (${ctx.occupancyPercent}% booked)`, occMultiplier, adjustments);
      }
    }
  }

  // Rule 9: Booking pace adjustment
  if (ds.bookingPaceEnabled && ctx.bookingPacePercent > 0) {
    const paceRule = ctx.bookingPaceRuleSettings;
    const fastThreshold = paceRule?.fastPaceThresholdPercent ?? 120;
    const slowThreshold = paceRule?.slowPaceThresholdPercent ?? 80;
    const fastAdjPct = paceRule?.fastPaceAdjustmentPercent ?? 10;
    const slowAdjPct = paceRule?.slowPaceAdjustmentPercent ?? 10;
    const maxAdj = paceRule?.maxAdjustmentPercent ?? 20;

    if (ctx.bookingPacePercent >= fastThreshold) {
      const paceBoost = Math.min((fastAdjPct / 100) * mm, maxAdj / 100);
      rate = applyRule(rate, "booking_pace", `Booking pace premium (${ctx.bookingPacePercent}% of expected)`, 1 + paceBoost, adjustments);
    } else if (ctx.bookingPacePercent <= slowThreshold) {
      const paceDiscount = Math.min((slowAdjPct / 100) * mm, maxAdj / 100);
      rate = applyRule(rate, "booking_pace", `Booking pace discount (${ctx.bookingPacePercent}% of expected)`, 1 - paceDiscount, adjustments);
    }
  }

  // Rule 10: Market comp adjustment
  if (ds.marketCompEnabled && ctx.marketCompRate !== null && ctx.marketCompRate > 0) {
    const compRule = ctx.marketCompRuleSettings;
    const maxInc = compRule?.maxIncreasePercent ?? 20;
    const maxDec = compRule?.maxDecreasePercent ?? 15;
    const strengthMap: Record<string, number> = { conservative: 0.25, balanced: 0.5, aggressive: 0.75 };
    const blendFactor = (strengthMap[compRule?.adjustmentStrength ?? "balanced"] ?? 0.5) * mm;

    const compRatio = ctx.marketCompRate / rate;
    if (compRatio > 1.05 || compRatio < 0.95) {
      const blendedRate = rate + (ctx.marketCompRate - rate) * blendFactor;
      let multiplier = blendedRate / rate;
      multiplier = Math.min(multiplier, 1 + maxInc / 100);
      multiplier = Math.max(multiplier, 1 - maxDec / 100);
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
