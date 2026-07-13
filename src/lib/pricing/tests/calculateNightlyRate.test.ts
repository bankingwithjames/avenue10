import { describe, it, expect } from "vitest";
import { calculateNightlyRate, identifyGapNights } from "../calculateNightlyRate";
import type { NightlyRateContext, DynamicPricingSettings } from "../types";

function makeDate(str: string): Date {
  return new Date(str + "T00:00:00.000Z");
}

const BASE_DYNAMIC: DynamicPricingSettings = {
  enabled: true,
  pricingMode: "balanced",
  minimumRate: 0,
  maximumRate: 0,
  weekendPremiumPercent: 0,
  eventPremiumPercent: 0,
  gapNightDiscountPercent: 0,
  lastMinuteDiscountPercent: 0,
  farOutPremiumPercent: 0,
  occupancyBasedEnabled: false,
  bookingPaceEnabled: false,
  marketCompEnabled: false,
  manualPriceLockEnabled: false,
};

function makeCtx(overrides: Partial<NightlyRateContext> = {}): NightlyRateContext {
  return {
    date: makeDate("2026-07-15"), // Wednesday
    baseRate: 200,
    weekendRate: null,
    dynamicSettings: null,
    manualOverride: null,
    daysFromToday: 3,
    isGapNight: false,
    occupancyPercent: 0,
    bookingPacePercent: 0,
    marketCompRate: null,
    ...overrides,
  };
}

describe("calculateNightlyRate", () => {
  describe("base rate selection", () => {
    it("returns base rate on weekdays", () => {
      const result = calculateNightlyRate(makeCtx());
      expect(result.rate).toBe(200);
      expect(result.source).toBe("base");
    });

    it("returns weekend rate on Friday", () => {
      const result = calculateNightlyRate(makeCtx({
        date: makeDate("2026-07-17"), // Friday
        weekendRate: 300,
      }));
      expect(result.rate).toBe(300);
      expect(result.source).toBe("weekend");
    });

    it("returns weekend rate on Saturday", () => {
      const result = calculateNightlyRate(makeCtx({
        date: makeDate("2026-07-18"), // Saturday
        weekendRate: 300,
      }));
      expect(result.rate).toBe(300);
      expect(result.source).toBe("weekend");
    });

    it("returns base rate on Sunday even with weekend rate set", () => {
      const result = calculateNightlyRate(makeCtx({
        date: makeDate("2026-07-19"), // Sunday
        weekendRate: 300,
      }));
      expect(result.rate).toBe(200);
      expect(result.source).toBe("base");
    });

    it("falls back to base rate when weekendRate is null on Friday", () => {
      const result = calculateNightlyRate(makeCtx({
        date: makeDate("2026-07-17"),
        weekendRate: null,
      }));
      expect(result.rate).toBe(200);
      expect(result.source).toBe("base");
    });
  });

  describe("manual price lock", () => {
    it("overrides all rules when locked", () => {
      const result = calculateNightlyRate(makeCtx({
        manualOverride: { date: "2026-07-15", rate: 500, isLocked: true },
        dynamicSettings: { ...BASE_DYNAMIC, lastMinuteDiscountPercent: 20 },
      }));
      expect(result.rate).toBe(500);
      expect(result.source).toBe("manual");
      expect(result.adjustments).toHaveLength(1);
      expect(result.adjustments[0].rule).toBe("manual_lock");
    });

    it("does not override when not locked", () => {
      const result = calculateNightlyRate(makeCtx({
        manualOverride: { date: "2026-07-15", rate: 500, isLocked: false },
      }));
      expect(result.rate).toBe(200);
    });
  });

  describe("dynamic pricing disabled", () => {
    it("returns base rate without adjustments", () => {
      const result = calculateNightlyRate(makeCtx({
        dynamicSettings: { ...BASE_DYNAMIC, enabled: false, lastMinuteDiscountPercent: 20 },
      }));
      expect(result.rate).toBe(200);
      expect(result.source).toBe("base");
      expect(result.adjustments).toHaveLength(1);
      expect(result.adjustments[0].rule).toBe("base_rate");
    });
  });

  describe("weekend premium", () => {
    it("applies weekend premium when no explicit weekend rate", () => {
      const result = calculateNightlyRate(makeCtx({
        date: makeDate("2026-07-17"), // Friday
        weekendRate: null,
        dynamicSettings: { ...BASE_DYNAMIC, weekendPremiumPercent: 20 },
      }));
      expect(result.rate).toBe(240); // 200 * 1.20
      expect(result.source).toBe("dynamic");
    });

    it("does not apply weekend premium when weekend rate exists", () => {
      const result = calculateNightlyRate(makeCtx({
        date: makeDate("2026-07-17"),
        weekendRate: 300,
        dynamicSettings: { ...BASE_DYNAMIC, weekendPremiumPercent: 20 },
      }));
      expect(result.rate).toBe(300);
    });

    it("scales weekend premium with conservative mode", () => {
      const result = calculateNightlyRate(makeCtx({
        date: makeDate("2026-07-17"),
        weekendRate: null,
        dynamicSettings: { ...BASE_DYNAMIC, pricingMode: "conservative", weekendPremiumPercent: 20 },
      }));
      expect(result.rate).toBe(220); // 200 * 1.10 (20% * 0.5 multiplier)
    });

    it("scales weekend premium with aggressive mode", () => {
      const result = calculateNightlyRate(makeCtx({
        date: makeDate("2026-07-17"),
        weekendRate: null,
        dynamicSettings: { ...BASE_DYNAMIC, pricingMode: "aggressive", weekendPremiumPercent: 20 },
      }));
      expect(result.rate).toBe(260); // 200 * 1.30 (20% * 1.5 multiplier)
    });
  });

  describe("gap-night discount", () => {
    it("applies gap-night discount", () => {
      const result = calculateNightlyRate(makeCtx({
        isGapNight: true,
        dynamicSettings: { ...BASE_DYNAMIC, gapNightDiscountPercent: 15 },
      }));
      expect(result.rate).toBe(170); // 200 * 0.85
    });

    it("does not apply when not a gap night", () => {
      const result = calculateNightlyRate(makeCtx({
        isGapNight: false,
        dynamicSettings: { ...BASE_DYNAMIC, gapNightDiscountPercent: 15 },
      }));
      expect(result.rate).toBe(200);
    });
  });

  describe("last-minute discount", () => {
    it("applies within balanced window (7 days)", () => {
      const result = calculateNightlyRate(makeCtx({
        daysFromToday: 5,
        dynamicSettings: { ...BASE_DYNAMIC, lastMinuteDiscountPercent: 10 },
      }));
      expect(result.rate).toBe(180); // 200 * 0.90
    });

    it("does not apply outside window", () => {
      const result = calculateNightlyRate(makeCtx({
        daysFromToday: 10,
        dynamicSettings: { ...BASE_DYNAMIC, lastMinuteDiscountPercent: 10 },
      }));
      expect(result.rate).toBe(200);
    });

    it("conservative mode has 3-day window", () => {
      const result = calculateNightlyRate(makeCtx({
        daysFromToday: 5,
        dynamicSettings: { ...BASE_DYNAMIC, pricingMode: "conservative", lastMinuteDiscountPercent: 10 },
      }));
      expect(result.rate).toBe(200); // 5 > 3 day window
    });

    it("aggressive mode has 14-day window", () => {
      const result = calculateNightlyRate(makeCtx({
        daysFromToday: 12,
        dynamicSettings: { ...BASE_DYNAMIC, pricingMode: "aggressive", lastMinuteDiscountPercent: 10 },
      }));
      expect(result.rate).toBe(170); // 200 * (1 - 10*1.5/100) = 200 * 0.85
    });
  });

  describe("far-out premium", () => {
    it("applies beyond balanced window (90 days)", () => {
      const result = calculateNightlyRate(makeCtx({
        daysFromToday: 100,
        dynamicSettings: { ...BASE_DYNAMIC, farOutPremiumPercent: 10 },
      }));
      expect(result.rate).toBe(220); // 200 * 1.10
    });

    it("does not apply within window", () => {
      const result = calculateNightlyRate(makeCtx({
        daysFromToday: 60,
        dynamicSettings: { ...BASE_DYNAMIC, farOutPremiumPercent: 10 },
      }));
      expect(result.rate).toBe(200);
    });
  });

  describe("min/max clamping", () => {
    it("clamps to minimum rate", () => {
      const result = calculateNightlyRate(makeCtx({
        baseRate: 50,
        dynamicSettings: { ...BASE_DYNAMIC, minimumRate: 100 },
      }));
      expect(result.rate).toBe(100);
      const clampAdj = result.adjustments.find((a) => a.rule === "clamp_min");
      expect(clampAdj).toBeDefined();
    });

    it("clamps to maximum rate", () => {
      const result = calculateNightlyRate(makeCtx({
        baseRate: 500,
        dynamicSettings: { ...BASE_DYNAMIC, maximumRate: 300 },
      }));
      expect(result.rate).toBe(300);
      const clampAdj = result.adjustments.find((a) => a.rule === "clamp_max");
      expect(clampAdj).toBeDefined();
    });

    it("does not clamp when rate is within bounds", () => {
      const result = calculateNightlyRate(makeCtx({
        dynamicSettings: { ...BASE_DYNAMIC, minimumRate: 100, maximumRate: 300 },
      }));
      expect(result.rate).toBe(200);
    });

    it("ignores zero min/max", () => {
      const result = calculateNightlyRate(makeCtx({
        baseRate: 50,
        dynamicSettings: { ...BASE_DYNAMIC, minimumRate: 0, maximumRate: 0 },
      }));
      expect(result.rate).toBe(50);
    });
  });

  describe("occupancy-based pricing", () => {
    it("increases rate at high occupancy", () => {
      const result = calculateNightlyRate(makeCtx({
        occupancyPercent: 90,
        dynamicSettings: { ...BASE_DYNAMIC, occupancyBasedEnabled: true },
      }));
      expect(result.rate).toBeGreaterThan(200);
    });

    it("no effect below 50% occupancy", () => {
      const result = calculateNightlyRate(makeCtx({
        occupancyPercent: 40,
        dynamicSettings: { ...BASE_DYNAMIC, occupancyBasedEnabled: true },
      }));
      expect(result.rate).toBe(200);
    });

    it("no effect when disabled", () => {
      const result = calculateNightlyRate(makeCtx({
        occupancyPercent: 90,
        dynamicSettings: { ...BASE_DYNAMIC, occupancyBasedEnabled: false },
      }));
      expect(result.rate).toBe(200);
    });
  });

  describe("booking pace", () => {
    it("increases rate when pace is fast", () => {
      const result = calculateNightlyRate(makeCtx({
        bookingPacePercent: 150,
        dynamicSettings: { ...BASE_DYNAMIC, bookingPaceEnabled: true },
      }));
      expect(result.rate).toBeGreaterThan(200);
    });

    it("decreases rate when pace is slow", () => {
      const result = calculateNightlyRate(makeCtx({
        bookingPacePercent: 70,
        dynamicSettings: { ...BASE_DYNAMIC, bookingPaceEnabled: true },
      }));
      expect(result.rate).toBeLessThan(200);
    });

    it("no effect at normal pace", () => {
      const result = calculateNightlyRate(makeCtx({
        bookingPacePercent: 100,
        dynamicSettings: { ...BASE_DYNAMIC, bookingPaceEnabled: true },
      }));
      expect(result.rate).toBe(200);
    });
  });

  describe("market comp adjustment", () => {
    it("blends toward higher comp rate", () => {
      const result = calculateNightlyRate(makeCtx({
        marketCompRate: 300,
        dynamicSettings: { ...BASE_DYNAMIC, marketCompEnabled: true },
      }));
      expect(result.rate).toBeGreaterThan(200);
      expect(result.rate).toBeLessThan(300);
    });

    it("blends toward lower comp rate", () => {
      const result = calculateNightlyRate(makeCtx({
        marketCompRate: 100,
        dynamicSettings: { ...BASE_DYNAMIC, marketCompEnabled: true },
      }));
      expect(result.rate).toBeLessThan(200);
      expect(result.rate).toBeGreaterThan(100);
    });

    it("no effect when within 5%", () => {
      const result = calculateNightlyRate(makeCtx({
        marketCompRate: 205,
        dynamicSettings: { ...BASE_DYNAMIC, marketCompEnabled: true },
      }));
      expect(result.rate).toBe(200);
    });
  });

  describe("stacked adjustments", () => {
    it("applies multiple rules in order", () => {
      const result = calculateNightlyRate(makeCtx({
        date: makeDate("2026-07-17"), // Friday
        weekendRate: null,
        daysFromToday: 3,
        isGapNight: true,
        dynamicSettings: {
          ...BASE_DYNAMIC,
          weekendPremiumPercent: 20,
          lastMinuteDiscountPercent: 10,
          gapNightDiscountPercent: 15,
        },
      }));
      // 200 * 1.20 (weekend premium) = 240
      // 240 * 0.85 (gap night) = 204
      // 204 * 0.90 (last minute) = 183.6
      expect(result.rate).toBe(183.6);
      expect(result.adjustments.length).toBeGreaterThanOrEqual(4);
    });

    it("records transparent audit trail", () => {
      const result = calculateNightlyRate(makeCtx({
        daysFromToday: 3,
        dynamicSettings: { ...BASE_DYNAMIC, lastMinuteDiscountPercent: 10 },
      }));
      const lastMinuteAdj = result.adjustments.find((a) => a.rule === "last_minute");
      expect(lastMinuteAdj).toBeDefined();
      expect(lastMinuteAdj!.rateBeforeRule).toBe(200);
      expect(lastMinuteAdj!.rateAfterRule).toBe(180);
      expect(lastMinuteAdj!.multiplier).toBeCloseTo(0.9);
    });
  });
});

describe("identifyGapNights", () => {
  it("identifies 1-night gaps", () => {
    const gaps = identifyGapNights([
      { checkIn: makeDate("2026-07-10"), checkOut: makeDate("2026-07-12") },
      { checkIn: makeDate("2026-07-13"), checkOut: makeDate("2026-07-15") },
    ]);
    expect(gaps.has("2026-07-12")).toBe(true);
    expect(gaps.size).toBe(1);
  });

  it("identifies 2-night gaps", () => {
    const gaps = identifyGapNights([
      { checkIn: makeDate("2026-07-10"), checkOut: makeDate("2026-07-12") },
      { checkIn: makeDate("2026-07-14"), checkOut: makeDate("2026-07-16") },
    ]);
    expect(gaps.has("2026-07-12")).toBe(true);
    expect(gaps.has("2026-07-13")).toBe(true);
    expect(gaps.size).toBe(2);
  });

  it("does not flag 3+ night gaps", () => {
    const gaps = identifyGapNights([
      { checkIn: makeDate("2026-07-10"), checkOut: makeDate("2026-07-12") },
      { checkIn: makeDate("2026-07-15"), checkOut: makeDate("2026-07-17") },
    ]);
    expect(gaps.size).toBe(0);
  });

  it("handles unsorted reservations", () => {
    const gaps = identifyGapNights([
      { checkIn: makeDate("2026-07-13"), checkOut: makeDate("2026-07-15") },
      { checkIn: makeDate("2026-07-10"), checkOut: makeDate("2026-07-12") },
    ]);
    expect(gaps.has("2026-07-12")).toBe(true);
  });

  it("returns empty set for no reservations", () => {
    expect(identifyGapNights([]).size).toBe(0);
  });

  it("returns empty set for single reservation", () => {
    expect(
      identifyGapNights([
        { checkIn: makeDate("2026-07-10"), checkOut: makeDate("2026-07-12") },
      ]).size
    ).toBe(0);
  });
});
