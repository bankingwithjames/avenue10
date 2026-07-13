import type {
  PricingConfig,
  DynamicPricingSettings,
  AddOnItem,
  PromoCode,
  ManualOverride,
  NightlyBreakdown,
  BookingQuoteResult,
  PreviewTotalInput,
  PreviewTotalResult,
  AddOnPricingType,
} from "./types";
import { calculateNightlyRate, identifyGapNights } from "./calculateNightlyRate";

interface QuoteContext {
  checkIn: Date;
  checkOut: Date;
  guests: number;
  hasPets: boolean;
  pricingConfig: PricingConfig;
  dynamicSettings: DynamicPricingSettings | null;
  manualOverrides: ManualOverride[];
  reservations: { checkIn: Date; checkOut: Date }[];
  addOns: AddOnItem[];
  selectedAddOnNames: string[];
  promoCode: PromoCode | null;
  listingId: string;
  today?: Date;
  occupancyPercent?: number;
  bookingPacePercent?: number;
  marketCompRate?: number | null;
}

function dateDiffDays(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function calculateBookingQuote(ctx: QuoteContext): BookingQuoteResult {
  const nights = dateDiffDays(ctx.checkIn, ctx.checkOut);
  if (nights <= 0) {
    throw new Error("Check-out must be after check-in");
  }

  const pc = ctx.pricingConfig;
  const today = ctx.today ?? new Date();
  today.setHours(0, 0, 0, 0);

  const overrideMap = new Map(ctx.manualOverrides.map((o) => [o.date, o]));
  const gapNights = identifyGapNights(ctx.reservations);

  // Build nightly breakdown with deterministic rule ordering
  const nightlyBreakdown: NightlyBreakdown[] = [];
  for (let i = 0; i < nights; i++) {
    const date = new Date(ctx.checkIn);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    const daysFromToday = dateDiffDays(today, date);

    const breakdown = calculateNightlyRate({
      date,
      baseRate: pc.boardRate,
      weekendRate: pc.weekendRate,
      dynamicSettings: ctx.dynamicSettings,
      manualOverride: overrideMap.get(dateStr) ?? null,
      daysFromToday,
      isGapNight: gapNights.has(dateStr),
      occupancyPercent: ctx.occupancyPercent ?? 0,
      bookingPacePercent: ctx.bookingPacePercent ?? 0,
      marketCompRate: ctx.marketCompRate ?? null,
    });

    nightlyBreakdown.push(breakdown);
  }

  const subtotal = nightlyBreakdown.reduce((sum, n) => sum + n.rate, 0);

  // Cleaning fee
  const cleaningFee = pc.cleaningFee;

  // Extra guest fee
  const extraGuests = Math.max(0, ctx.guests - pc.guestsIncluded);
  const extraGuestFee =
    pc.extraGuestFeeType === "per_night"
      ? extraGuests * pc.extraGuestFee * nights
      : extraGuests * pc.extraGuestFee;

  // Pet fee
  const petFee = ctx.hasPets ? pc.petFee : 0;

  // Tax
  const taxableAmount = subtotal + cleaningFee + petFee + extraGuestFee;
  const taxAmount = Math.round(taxableAmount * (pc.taxRate / 100) * 100) / 100;

  // Service fee
  let serviceFee = 0;
  if (pc.serviceFeePercent > 0) {
    serviceFee = Math.round(subtotal * (pc.serviceFeePercent / 100) * 100) / 100;
  } else {
    serviceFee = pc.serviceFeeFlat;
  }

  // Add-ons
  const matchedAddOns: { name: string; price: number; pricingType: AddOnPricingType }[] = [];
  for (const addOnName of ctx.selectedAddOnNames) {
    const found = ctx.addOns.find(
      (a) => a.name.toLowerCase() === addOnName.toLowerCase()
    );
    if (found) {
      let addOnPrice = found.price;
      if (found.pricingType === "per_night") {
        addOnPrice = found.price * nights;
      } else if (found.pricingType === "per_guest") {
        addOnPrice = found.price * ctx.guests;
      } else if (found.pricingType === "percentage") {
        addOnPrice = subtotal * (found.price / 100);
      }
      matchedAddOns.push({
        name: found.name,
        price: Math.round(addOnPrice * 100) / 100,
        pricingType: found.pricingType,
      });
    }
  }
  const addOnsTotal = matchedAddOns.reduce((sum, a) => sum + a.price, 0);

  // Promo code
  let promoDiscount = 0;
  let appliedPromoCode: string | null = null;

  if (ctx.promoCode) {
    const promo = ctx.promoCode;
    const now = ctx.today ?? new Date();
    const validDate =
      (!promo.startDate || promo.startDate <= now) &&
      (!promo.endDate || promo.endDate >= now);
    const validUses = promo.maxUses === 0 || promo.currentUses < promo.maxUses;
    const validNights = nights >= promo.minimumNights;
    const validListing = !promo.listingId || promo.listingId === ctx.listingId;

    if (promo.isActive && validDate && validUses && validNights && validListing) {
      if (promo.discountType === "percentage") {
        promoDiscount = Math.round(subtotal * (promo.discountValue / 100) * 100) / 100;
      } else {
        promoDiscount = promo.discountValue;
      }
      appliedPromoCode = promo.code;
    }
  }

  // Total before deposit
  const totalBeforeDeposit =
    subtotal + cleaningFee + petFee + extraGuestFee + taxAmount + serviceFee + addOnsTotal - promoDiscount;

  // Deposit hold (not added to total — it's a hold, not a charge)
  let depositHold = 0;
  if (pc.depositHoldPercent > 0) {
    depositHold = Math.round(totalBeforeDeposit * (pc.depositHoldPercent / 100) * 100) / 100;
  } else {
    depositHold = pc.depositHoldFlat;
  }

  const total = Math.round(totalBeforeDeposit * 100) / 100;

  return {
    nights,
    nightlyBreakdown,
    subtotal: Math.round(subtotal * 100) / 100,
    cleaningFee,
    petFee,
    extraGuestFee: Math.round(extraGuestFee * 100) / 100,
    taxRate: pc.taxRate,
    taxLabel: pc.taxLabel,
    taxAmount,
    serviceFeeLabel: pc.serviceFeeLabel,
    serviceFee,
    depositHoldLabel: pc.depositHoldLabel,
    depositHold,
    addOns: matchedAddOns,
    addOnsTotal: Math.round(addOnsTotal * 100) / 100,
    promoDiscount,
    promoCode: appliedPromoCode,
    total,
  };
}

export function previewTotal(input: PreviewTotalInput): PreviewTotalResult {
  const subtotal = input.nightlyRates.reduce((sum, r) => sum + r, 0);
  const taxableAmount = subtotal + input.cleaningFee + input.petFee + input.extraGuestFee;
  const taxAmount = Math.round(taxableAmount * (input.taxRate / 100) * 100) / 100;

  let serviceFee = 0;
  if (input.serviceFeePercent > 0) {
    serviceFee = Math.round(subtotal * (input.serviceFeePercent / 100) * 100) / 100;
  } else {
    serviceFee = input.serviceFeeFlat;
  }

  const totalBeforeDeposit =
    subtotal + input.cleaningFee + input.petFee + input.extraGuestFee +
    taxAmount + serviceFee + input.addOnsTotal - input.promoDiscount;

  let depositHold = 0;
  if (input.depositHoldPercent > 0) {
    depositHold = Math.round(totalBeforeDeposit * (input.depositHoldPercent / 100) * 100) / 100;
  } else {
    depositHold = input.depositHoldFlat;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    cleaningFee: input.cleaningFee,
    petFee: input.petFee,
    extraGuestFee: input.extraGuestFee,
    taxAmount,
    serviceFee,
    depositHold,
    addOnsTotal: input.addOnsTotal,
    promoDiscount: input.promoDiscount,
    total: Math.round(totalBeforeDeposit * 100) / 100,
  };
}
