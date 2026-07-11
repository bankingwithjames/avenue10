import { prisma } from "@/lib/prisma";

export interface NightlyRate {
  date: string;
  rate: number;
  source: string;
}

export interface PriceBreakdown {
  nights: number;
  nightlyRates: NightlyRate[];
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

  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (nights <= 0) throw new Error("Check-out must be after check-in");

  const dates: Date[] = [];
  for (let i = 0; i < nights; i++) {
    const d = new Date(checkIn);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }

  // FinalDailyRate overrides (highest priority)
  const dailyRates = await prisma.finalDailyRate.findMany({
    where: { listingId, date: { in: dates } },
  });
  const rateMap = new Map(
    dailyRates.map((r) => [r.date.toISOString().split("T")[0], r])
  );

  // SalesConfig (primary source)
  const salesConfig = await prisma.salesConfig.findUnique({
    where: { listingId },
    include: { addOns: { where: { isActive: true } } },
  });

  const useSalesConfig = salesConfig && salesConfig.isActive;
  const config = listing.pricingConfig;

  // Base rate: SalesConfig > PricingConfig > Listing
  const baseRate = useSalesConfig
    ? salesConfig.boardRate
    : config?.baseNightlyRate || listing.pricePerNight;

  const weekendRate = useSalesConfig
    ? salesConfig.weekendRate
    : config?.weekendRate ?? null;

  // Build nightly rates: FinalDailyRate > weekend/base
  const nightlyRates: NightlyRate[] = dates.map((d) => {
    const key = d.toISOString().split("T")[0];
    const daily = rateMap.get(key);
    if (daily) {
      return { date: key, rate: daily.finalRate, source: daily.rateSource };
    }
    if (weekendRate && (d.getDay() === 5 || d.getDay() === 6)) {
      return { date: key, rate: weekendRate, source: "weekend" };
    }
    return { date: key, rate: baseRate, source: "base" };
  });

  const subtotal = nightlyRates.reduce((sum, n) => sum + n.rate, 0);

  // Cleaning fee
  const cleaningFee = useSalesConfig
    ? salesConfig.cleaningFee
    : config?.cleaningFee ?? listing.cleaningFee;

  // Extra guest fee
  const extraGuestThreshold = useSalesConfig
    ? salesConfig.guestsIncluded
    : listing.maxGuests > 2
      ? 2
      : listing.maxGuests;
  const extraGuestRate = useSalesConfig
    ? salesConfig.extraGuestFee
    : config?.extraGuestFee ?? 0;
  const extraGuests = Math.max(0, guests - extraGuestThreshold);
  const extraGuestFee = extraGuests * extraGuestRate * nights;

  // Pet fee
  const petFeeAmount = useSalesConfig
    ? salesConfig.petFee
    : config?.petFee ?? 0;
  const petFee = options?.hasPets ? petFeeAmount : 0;

  // Tax
  const taxRate = useSalesConfig ? salesConfig.taxRate : 0;
  const taxLabel = useSalesConfig ? salesConfig.taxLabel : "Taxes & Fees";
  const taxableAmount = subtotal + cleaningFee + petFee + extraGuestFee;
  const taxAmount = taxableAmount * (taxRate / 100);

  // Service fee
  let serviceFee = 0;
  const serviceFeeLabel = useSalesConfig
    ? salesConfig.serviceFeeLabel
    : "Service Fee";
  if (useSalesConfig) {
    if (salesConfig.serviceFeePercent > 0) {
      serviceFee = subtotal * (salesConfig.serviceFeePercent / 100);
    } else {
      serviceFee = salesConfig.serviceFeeFlat;
    }
  }

  // Add-ons
  const matchedAddOns: { name: string; price: number; pricingType: string }[] = [];
  if (
    useSalesConfig &&
    options?.selectedAddOns &&
    salesConfig.addOns.length > 0
  ) {
    for (const addOnName of options.selectedAddOns) {
      const found = salesConfig.addOns.find(
        (a) => a.name.toLowerCase() === addOnName.toLowerCase()
      );
      if (found) {
        let addOnPrice = found.price;
        if (found.pricingType === "per_night") {
          addOnPrice = found.price * nights;
        } else if (found.pricingType === "per_guest") {
          addOnPrice = found.price * guests;
        } else if (found.pricingType === "percentage") {
          addOnPrice = subtotal * (found.price / 100);
        }
        matchedAddOns.push({
          name: found.name,
          price: addOnPrice,
          pricingType: found.pricingType,
        });
      }
    }
  }
  const addOnsTotal = matchedAddOns.reduce((sum, a) => sum + a.price, 0);

  // Promo code discount
  let promoDiscount = 0;
  let appliedPromoCode: string | null = null;

  if (options?.promoCode) {
    const promo = await prisma.promoCode.findUnique({
      where: { code: options.promoCode.toUpperCase() },
    });
    if (promo && promo.isActive) {
      const now = new Date();
      const validDate =
        (!promo.startDate || promo.startDate <= now) &&
        (!promo.endDate || promo.endDate >= now);
      const validUses = promo.maxUses === 0 || promo.currentUses < promo.maxUses;
      const validNights = nights >= promo.minimumNights;
      const validListing = !promo.listingId || promo.listingId === listingId;

      if (validDate && validUses && validNights && validListing) {
        if (promo.discountType === "percentage") {
          promoDiscount = subtotal * (promo.discountValue / 100);
        } else {
          promoDiscount = promo.discountValue;
        }
        appliedPromoCode = promo.code;
      }
    }
  }

  // Total before deposit
  const totalBeforeDeposit =
    subtotal +
    cleaningFee +
    petFee +
    extraGuestFee +
    taxAmount +
    serviceFee +
    addOnsTotal -
    promoDiscount;

  // Deposit hold
  let depositHold = 0;
  const depositHoldLabel = useSalesConfig
    ? salesConfig.depositHoldLabel
    : "Security Deposit Hold";
  if (useSalesConfig) {
    if (salesConfig.depositHoldPercent > 0) {
      depositHold = totalBeforeDeposit * (salesConfig.depositHoldPercent / 100);
    } else {
      depositHold = salesConfig.depositHoldFlat;
    }
  }

  const total = totalBeforeDeposit + depositHold;

  return {
    nights,
    nightlyRates,
    subtotal,
    cleaningFee,
    petFee,
    extraGuestFee,
    taxRate,
    taxLabel,
    taxAmount,
    serviceFeeLabel,
    serviceFee,
    depositHoldLabel,
    depositHold,
    addOns: matchedAddOns,
    addOnsTotal,
    promoDiscount,
    promoCode: appliedPromoCode,
    total,
  };
}
