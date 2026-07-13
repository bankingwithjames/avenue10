import { describe, it, expect } from "vitest";
import { calculateBookingQuote, previewTotal } from "../calculateBookingQuote";
import type { PricingConfig, DynamicPricingSettings, AddOnItem, PromoCode } from "../types";

function makeDate(str: string): Date {
  return new Date(str + "T00:00:00.000Z");
}

const BASE_CONFIG: PricingConfig = {
  boardRate: 200,
  weekendRate: null,
  cleaningFee: 150,
  taxRate: 10,
  taxLabel: "Taxes & Fees",
  serviceFeePercent: 5,
  serviceFeeFlat: 0,
  serviceFeeLabel: "Service Fee",
  depositHoldPercent: 0,
  depositHoldFlat: 200,
  depositHoldLabel: "Security Deposit",
  petFee: 50,
  extraGuestFee: 25,
  extraGuestFeeType: "per_night",
  guestsIncluded: 2,
  minimumStay: 1,
  maximumStay: 30,
};

const DYNAMIC_OFF: DynamicPricingSettings = {
  enabled: false,
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

describe("calculateBookingQuote", () => {
  describe("basic quote calculation", () => {
    it("calculates a simple 3-night stay", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"), // Wed
        checkOut: makeDate("2026-07-18"), // Sat (3 nights: Wed, Thu, Fri)
        guests: 2,
        hasPets: false,
        pricingConfig: BASE_CONFIG,
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns: [],
        selectedAddOnNames: [],
        promoCode: null,
        listingId: "test-listing",
        today: makeDate("2026-07-10"),
      });

      expect(result.nights).toBe(3);
      expect(result.subtotal).toBe(600); // 200 * 3
      expect(result.cleaningFee).toBe(150);
      expect(result.petFee).toBe(0);
      expect(result.extraGuestFee).toBe(0);
      // Tax: (600 + 150) * 10% = 75
      expect(result.taxAmount).toBe(75);
      // Service fee: 600 * 5% = 30
      expect(result.serviceFee).toBe(30);
      // Total: 600 + 150 + 75 + 30 = 855
      expect(result.total).toBe(855);
      // Deposit hold is not added to total
      expect(result.depositHold).toBe(200);
    });

    it("throws for invalid dates", () => {
      expect(() =>
        calculateBookingQuote({
          checkIn: makeDate("2026-07-18"),
          checkOut: makeDate("2026-07-15"),
          guests: 2,
          hasPets: false,
          pricingConfig: BASE_CONFIG,
          dynamicSettings: null,
          manualOverrides: [],
          reservations: [],
          addOns: [],
          selectedAddOnNames: [],
          promoCode: null,
          listingId: "test",
          today: makeDate("2026-07-10"),
        })
      ).toThrow("Check-out must be after check-in");
    });
  });

  describe("weekend rates", () => {
    it("uses weekend rate for Fri/Sat nights", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-16"), // Thu
        checkOut: makeDate("2026-07-20"), // Mon (4 nights: Thu, Fri, Sat, Sun)
        guests: 2,
        hasPets: false,
        pricingConfig: { ...BASE_CONFIG, weekendRate: 300 },
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns: [],
        selectedAddOnNames: [],
        promoCode: null,
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      expect(result.nights).toBe(4);
      // Thu=200, Fri=300, Sat=300, Sun=200
      expect(result.subtotal).toBe(1000);
    });
  });

  describe("extra guest fee", () => {
    it("charges per-night extra guest fee", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-18"),
        guests: 4, // 2 extra guests
        hasPets: false,
        pricingConfig: BASE_CONFIG,
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns: [],
        selectedAddOnNames: [],
        promoCode: null,
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      // 2 extra * $25 * 3 nights = $150
      expect(result.extraGuestFee).toBe(150);
    });

    it("charges flat extra guest fee", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-18"),
        guests: 4,
        hasPets: false,
        pricingConfig: { ...BASE_CONFIG, extraGuestFeeType: "flat" },
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns: [],
        selectedAddOnNames: [],
        promoCode: null,
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      // 2 extra * $25 = $50
      expect(result.extraGuestFee).toBe(50);
    });

    it("no charge when at or below threshold", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-18"),
        guests: 2,
        hasPets: false,
        pricingConfig: BASE_CONFIG,
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns: [],
        selectedAddOnNames: [],
        promoCode: null,
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      expect(result.extraGuestFee).toBe(0);
    });
  });

  describe("pet fee", () => {
    it("charges pet fee when has pets", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-18"),
        guests: 2,
        hasPets: true,
        pricingConfig: BASE_CONFIG,
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns: [],
        selectedAddOnNames: [],
        promoCode: null,
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      expect(result.petFee).toBe(50);
    });
  });

  describe("service fee", () => {
    it("uses flat fee when percent is 0", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-18"),
        guests: 2,
        hasPets: false,
        pricingConfig: { ...BASE_CONFIG, serviceFeePercent: 0, serviceFeeFlat: 75 },
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns: [],
        selectedAddOnNames: [],
        promoCode: null,
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      expect(result.serviceFee).toBe(75);
    });
  });

  describe("deposit hold", () => {
    it("calculates percentage deposit", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-18"),
        guests: 2,
        hasPets: false,
        pricingConfig: { ...BASE_CONFIG, depositHoldPercent: 10, depositHoldFlat: 0 },
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns: [],
        selectedAddOnNames: [],
        promoCode: null,
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      expect(result.depositHold).toBeGreaterThan(0);
      // Deposit is NOT included in total
      const expectedTotal = result.subtotal + result.cleaningFee + result.taxAmount + result.serviceFee;
      expect(result.total).toBe(expectedTotal);
    });
  });

  describe("add-ons", () => {
    const addOns: AddOnItem[] = [
      { name: "Early Check-In", price: 50, pricingType: "flat", taxable: true },
      { name: "Daily Housekeeping", price: 30, pricingType: "per_night", taxable: true },
      { name: "Extra Towels", price: 10, pricingType: "per_guest", taxable: false },
      { name: "Premium Upgrade", price: 5, pricingType: "percentage", taxable: false },
    ];

    it("calculates flat add-on", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-18"),
        guests: 2,
        hasPets: false,
        pricingConfig: BASE_CONFIG,
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns,
        selectedAddOnNames: ["Early Check-In"],
        promoCode: null,
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      expect(result.addOns[0].price).toBe(50);
      expect(result.addOnsTotal).toBe(50);
    });

    it("calculates per-night add-on", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-18"),
        guests: 2,
        hasPets: false,
        pricingConfig: BASE_CONFIG,
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns,
        selectedAddOnNames: ["Daily Housekeeping"],
        promoCode: null,
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      expect(result.addOns[0].price).toBe(90); // 30 * 3 nights
    });

    it("calculates per-guest add-on", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-18"),
        guests: 4,
        hasPets: false,
        pricingConfig: BASE_CONFIG,
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns,
        selectedAddOnNames: ["Extra Towels"],
        promoCode: null,
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      expect(result.addOns[0].price).toBe(40); // 10 * 4 guests
    });

    it("calculates percentage add-on", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-18"),
        guests: 2,
        hasPets: false,
        pricingConfig: BASE_CONFIG,
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns,
        selectedAddOnNames: ["Premium Upgrade"],
        promoCode: null,
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      expect(result.addOns[0].price).toBe(30); // 600 * 5%
    });

    it("ignores unmatched add-on names", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-18"),
        guests: 2,
        hasPets: false,
        pricingConfig: BASE_CONFIG,
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns,
        selectedAddOnNames: ["Nonexistent"],
        promoCode: null,
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      expect(result.addOns).toHaveLength(0);
      expect(result.addOnsTotal).toBe(0);
    });
  });

  describe("promo codes", () => {
    const validPromo: PromoCode = {
      code: "SAVE20",
      discountType: "percentage",
      discountValue: 20,
      listingId: null,
      startDate: makeDate("2026-01-01"),
      endDate: makeDate("2026-12-31"),
      minimumNights: 1,
      maxUses: 100,
      currentUses: 5,
      isActive: true,
    };

    it("applies percentage promo", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-18"),
        guests: 2,
        hasPets: false,
        pricingConfig: BASE_CONFIG,
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns: [],
        selectedAddOnNames: [],
        promoCode: validPromo,
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      expect(result.promoDiscount).toBe(120); // 600 * 20%
      expect(result.promoCode).toBe("SAVE20");
    });

    it("applies flat promo", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-18"),
        guests: 2,
        hasPets: false,
        pricingConfig: BASE_CONFIG,
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns: [],
        selectedAddOnNames: [],
        promoCode: { ...validPromo, discountType: "flat", discountValue: 50 },
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      expect(result.promoDiscount).toBe(50);
    });

    it("rejects expired promo", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-18"),
        guests: 2,
        hasPets: false,
        pricingConfig: BASE_CONFIG,
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns: [],
        selectedAddOnNames: [],
        promoCode: { ...validPromo, endDate: makeDate("2026-06-01") },
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      expect(result.promoDiscount).toBe(0);
      expect(result.promoCode).toBeNull();
    });

    it("rejects promo when max uses reached", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-18"),
        guests: 2,
        hasPets: false,
        pricingConfig: BASE_CONFIG,
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns: [],
        selectedAddOnNames: [],
        promoCode: { ...validPromo, maxUses: 5, currentUses: 5 },
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      expect(result.promoDiscount).toBe(0);
    });

    it("rejects promo for wrong listing", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-18"),
        guests: 2,
        hasPets: false,
        pricingConfig: BASE_CONFIG,
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns: [],
        selectedAddOnNames: [],
        promoCode: { ...validPromo, listingId: "other-listing" },
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      expect(result.promoDiscount).toBe(0);
    });

    it("rejects promo below minimum nights", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-16"), // 1 night
        guests: 2,
        hasPets: false,
        pricingConfig: BASE_CONFIG,
        dynamicSettings: null,
        manualOverrides: [],
        reservations: [],
        addOns: [],
        selectedAddOnNames: [],
        promoCode: { ...validPromo, minimumNights: 3 },
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      expect(result.promoDiscount).toBe(0);
    });
  });

  describe("manual overrides in quotes", () => {
    it("uses locked manual rate for specific dates", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-18"),
        guests: 2,
        hasPets: false,
        pricingConfig: BASE_CONFIG,
        dynamicSettings: null,
        manualOverrides: [
          { date: "2026-07-16", rate: 500, isLocked: true },
        ],
        reservations: [],
        addOns: [],
        selectedAddOnNames: [],
        promoCode: null,
        listingId: "test",
        today: makeDate("2026-07-10"),
      });

      // Jul 15 = 200, Jul 16 = 500 (locked), Jul 17 = 200
      expect(result.subtotal).toBe(900);
      const lockedNight = result.nightlyBreakdown.find((n) => n.date === "2026-07-16");
      expect(lockedNight?.rate).toBe(500);
      expect(lockedNight?.source).toBe("manual");
    });
  });

  describe("nightly breakdown auditability", () => {
    it("includes adjustments for every night", () => {
      const result = calculateBookingQuote({
        checkIn: makeDate("2026-07-15"),
        checkOut: makeDate("2026-07-18"),
        guests: 2,
        hasPets: false,
        pricingConfig: BASE_CONFIG,
        dynamicSettings: {
          ...DYNAMIC_OFF,
          enabled: true,
          lastMinuteDiscountPercent: 10,
        },
        manualOverrides: [],
        reservations: [],
        addOns: [],
        selectedAddOnNames: [],
        promoCode: null,
        listingId: "test",
        today: makeDate("2026-07-12"),
      });

      for (const night of result.nightlyBreakdown) {
        expect(night.adjustments.length).toBeGreaterThanOrEqual(1);
        expect(night.adjustments[0].rule).toBe("base_rate");
      }
    });
  });
});

describe("previewTotal", () => {
  it("calculates preview from nightly rates array", () => {
    const result = previewTotal({
      nightlyRates: [200, 200, 300],
      cleaningFee: 150,
      taxRate: 10,
      serviceFeePercent: 5,
      serviceFeeFlat: 0,
      depositHoldPercent: 0,
      depositHoldFlat: 200,
      petFee: 0,
      extraGuestFee: 0,
      addOnsTotal: 50,
      promoDiscount: 0,
    });

    expect(result.subtotal).toBe(700);
    expect(result.cleaningFee).toBe(150);
    // Tax: (700 + 150) * 10% = 85
    expect(result.taxAmount).toBe(85);
    // Service: 700 * 5% = 35
    expect(result.serviceFee).toBe(35);
    // Total: 700 + 150 + 85 + 35 + 50 = 1020
    expect(result.total).toBe(1020);
    expect(result.depositHold).toBe(200);
  });

  it("handles percentage deposit hold", () => {
    const result = previewTotal({
      nightlyRates: [200],
      cleaningFee: 0,
      taxRate: 0,
      serviceFeePercent: 0,
      serviceFeeFlat: 0,
      depositHoldPercent: 50,
      depositHoldFlat: 0,
      petFee: 0,
      extraGuestFee: 0,
      addOnsTotal: 0,
      promoDiscount: 0,
    });

    expect(result.total).toBe(200);
    expect(result.depositHold).toBe(100); // 50% of 200
  });

  it("subtracts promo discount from total", () => {
    const result = previewTotal({
      nightlyRates: [200, 200],
      cleaningFee: 0,
      taxRate: 0,
      serviceFeePercent: 0,
      serviceFeeFlat: 0,
      depositHoldPercent: 0,
      depositHoldFlat: 0,
      petFee: 0,
      extraGuestFee: 0,
      addOnsTotal: 0,
      promoDiscount: 100,
    });

    expect(result.total).toBe(300); // 400 - 100
  });
});
