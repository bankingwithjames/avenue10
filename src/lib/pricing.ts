import { prisma } from "@/lib/prisma";
import { calculateBookingQuote } from "@/lib/pricing/calculateBookingQuote";
import type { PricingConfig, AddOnItem, PromoCode, ManualOverride, NightlyBreakdown } from "@/lib/pricing/types";

export interface NightlyRate {
  date: string;
  rate: number;
  source: string;
}

export interface PriceBreakdown {
  nights: number;
  nightlyRates: NightlyRate[];
  nightlyBreakdown: NightlyBreakdown[];
  subtotal: number;
  cleaningFee: number;
  petFee: number;
  extraGuestFee: number;
  taxRate: number;
  taxLabel: string;
  taxAmount: number;
  serviceFeeLabel: string;
  serviceFee: number;
  depositHoldLabel: string;
  depositHold: number;
  addOns: { name: string; price: number; pricingType: string }[];
  addOnsTotal: number;
  promoDiscount: number;
  promoCode: string | null;
  total: number;
}

export async function calculatePricing(
  listingId: string,
  checkIn: Date,
  checkOut: Date,
  guests: number,
  options?: {
    hasPets?: boolean;
    selectedAddOns?: string[];
    promoCode?: string;
  }
): Promise<PriceBreakdown> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { pricingConfig: true },
  });

  if (!listing) throw new Error("Listing not found");

  const salesConfig = await prisma.salesConfig.findUnique({
    where: { listingId },
    include: { addOns: { where: { isActive: true } } },
  });

  const useSalesConfig = salesConfig && salesConfig.isActive;
  const config = listing.pricingConfig;

  const pricingConfig: PricingConfig = {
    boardRate: useSalesConfig
      ? salesConfig.boardRate
      : config?.baseNightlyRate || listing.pricePerNight,
    weekendRate: useSalesConfig
      ? salesConfig.weekendRate ?? null
      : config?.weekendRate ?? null,
    cleaningFee: useSalesConfig
      ? salesConfig.cleaningFee
      : config?.cleaningFee ?? listing.cleaningFee,
    taxRate: useSalesConfig ? salesConfig.taxRate : 0,
    taxLabel: useSalesConfig ? salesConfig.taxLabel : "Taxes & Fees",
    serviceFeePercent: useSalesConfig ? salesConfig.serviceFeePercent : 0,
    serviceFeeFlat: useSalesConfig ? salesConfig.serviceFeeFlat : 0,
    serviceFeeLabel: useSalesConfig ? salesConfig.serviceFeeLabel : "Service Fee",
    depositHoldPercent: useSalesConfig ? salesConfig.depositHoldPercent : 0,
    depositHoldFlat: useSalesConfig ? salesConfig.depositHoldFlat : 0,
    depositHoldLabel: useSalesConfig ? salesConfig.depositHoldLabel : "Security Deposit Hold",
    petFee: useSalesConfig ? salesConfig.petFee : config?.petFee ?? 0,
    extraGuestFee: useSalesConfig ? salesConfig.extraGuestFee : config?.extraGuestFee ?? 0,
    extraGuestFeeType: (useSalesConfig ? salesConfig.extraGuestFeeType : "per_night") as "per_night" | "flat",
    guestsIncluded: useSalesConfig
      ? salesConfig.guestsIncluded
      : listing.maxGuests > 2 ? 2 : listing.maxGuests,
    minimumStay: useSalesConfig ? salesConfig.minimumStay : config?.minimumStay ?? 1,
    maximumStay: useSalesConfig ? salesConfig.maximumStay : 30,
  };

  // Fetch FinalDailyRate overrides as manual overrides
  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dates: Date[] = [];
  for (let i = 0; i < nights; i++) {
    const d = new Date(checkIn);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }

  const dailyRates = await prisma.finalDailyRate.findMany({
    where: { listingId, date: { in: dates } },
  });

  const manualOverrides: ManualOverride[] = dailyRates.map((r) => ({
    date: r.date.toISOString().split("T")[0],
    rate: r.finalRate,
    isLocked: true,
  }));

  // Fetch dynamic pricing settings
  const dynamicSettings = await prisma.dynamicPricingSettings.findUnique({
    where: { listingId },
  });

  // Fetch reservations for gap-night detection
  const reservations = await prisma.reservation.findMany({
    where: { listingId, status: { in: ["confirmed", "pending"] } },
    select: { checkIn: true, checkOut: true },
  });

  // Map add-ons to engine type
  const addOns: AddOnItem[] = useSalesConfig
    ? salesConfig.addOns.map((a) => ({
        name: a.name,
        price: a.price,
        pricingType: a.pricingType as "flat" | "per_night" | "per_guest" | "percentage",
        taxable: a.taxable,
      }))
    : [];

  // Fetch promo code if provided
  let promoCode: PromoCode | null = null;
  if (options?.promoCode) {
    const promo = await prisma.promoCode.findUnique({
      where: { code: options.promoCode.toUpperCase() },
    });
    if (promo) {
      promoCode = {
        code: promo.code,
        discountType: promo.discountType as "percentage" | "flat",
        discountValue: promo.discountValue,
        listingId: promo.listingId,
        startDate: promo.startDate,
        endDate: promo.endDate,
        minimumNights: promo.minimumNights,
        maxUses: promo.maxUses,
        currentUses: promo.currentUses,
        isActive: promo.isActive,
      };
    }
  }

  const result = calculateBookingQuote({
    checkIn,
    checkOut,
    guests,
    hasPets: options?.hasPets ?? false,
    pricingConfig,
    dynamicSettings: dynamicSettings
      ? {
          enabled: dynamicSettings.enabled,
          pricingMode: dynamicSettings.pricingMode as "conservative" | "balanced" | "aggressive",
          minimumRate: dynamicSettings.minimumRate,
          maximumRate: dynamicSettings.maximumRate,
          weekendPremiumPercent: dynamicSettings.weekendPremiumPercent,
          eventPremiumPercent: dynamicSettings.eventPremiumPercent,
          gapNightDiscountPercent: dynamicSettings.gapNightDiscountPercent,
          lastMinuteDiscountPercent: dynamicSettings.lastMinuteDiscountPercent,
          farOutPremiumPercent: dynamicSettings.farOutPremiumPercent,
          occupancyBasedEnabled: dynamicSettings.occupancyBasedEnabled,
          bookingPaceEnabled: dynamicSettings.bookingPaceEnabled,
          marketCompEnabled: dynamicSettings.marketCompEnabled,
          manualPriceLockEnabled: dynamicSettings.manualPriceLockEnabled,
        }
      : null,
    manualOverrides,
    reservations: reservations.map((r) => ({
      checkIn: new Date(r.checkIn),
      checkOut: new Date(r.checkOut),
    })),
    addOns,
    selectedAddOnNames: options?.selectedAddOns ?? [],
    promoCode,
    listingId,
  });

  return {
    nights: result.nights,
    nightlyRates: result.nightlyBreakdown.map((n) => ({
      date: n.date,
      rate: n.rate,
      source: n.source,
    })),
    nightlyBreakdown: result.nightlyBreakdown,
    subtotal: result.subtotal,
    cleaningFee: result.cleaningFee,
    petFee: result.petFee,
    extraGuestFee: result.extraGuestFee,
    taxRate: result.taxRate,
    taxLabel: result.taxLabel,
    taxAmount: result.taxAmount,
    serviceFeeLabel: result.serviceFeeLabel,
    serviceFee: result.serviceFee,
    depositHoldLabel: result.depositHoldLabel,
    depositHold: result.depositHold,
    addOns: result.addOns,
    addOnsTotal: result.addOnsTotal,
    promoDiscount: result.promoDiscount,
    promoCode: result.promoCode,
    total: result.total,
  };
}
