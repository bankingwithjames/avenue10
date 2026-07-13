export type PricingMode = "conservative" | "balanced" | "aggressive";

export type ExtraGuestFeeType = "per_night" | "flat";

export type AddOnPricingType = "flat" | "per_night" | "per_guest" | "percentage";

export type PromoDiscountType = "percentage" | "flat";

export interface DynamicPricingSettings {
  enabled: boolean;
  pricingMode: PricingMode;
  minimumRate: number;
  maximumRate: number;
  weekendPremiumPercent: number;
  eventPremiumPercent: number;
  gapNightDiscountPercent: number;
  lastMinuteDiscountPercent: number;
  farOutPremiumPercent: number;
  occupancyBasedEnabled: boolean;
  bookingPaceEnabled: boolean;
  marketCompEnabled: boolean;
  manualPriceLockEnabled: boolean;
}

export interface PricingConfig {
  boardRate: number;
  weekendRate: number | null;
  cleaningFee: number;
  taxRate: number;
  taxLabel: string;
  serviceFeePercent: number;
  serviceFeeFlat: number;
  serviceFeeLabel: string;
  depositHoldPercent: number;
  depositHoldFlat: number;
  depositHoldLabel: string;
  petFee: number;
  extraGuestFee: number;
  extraGuestFeeType: ExtraGuestFeeType;
  guestsIncluded: number;
  minimumStay: number;
  maximumStay: number;
}

export interface AddOnItem {
  name: string;
  price: number;
  pricingType: AddOnPricingType;
  taxable: boolean;
}

export interface PromoCode {
  code: string;
  discountType: PromoDiscountType;
  discountValue: number;
  listingId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  minimumNights: number;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
}

export interface ManualOverride {
  date: string;
  rate: number;
  isLocked: boolean;
}

export interface ReservationRange {
  checkIn: Date;
  checkOut: Date;
}

export interface NightlyRateContext {
  date: Date;
  baseRate: number;
  weekendRate: number | null;
  dynamicSettings: DynamicPricingSettings | null;
  manualOverride: ManualOverride | null;
  daysFromToday: number;
  isGapNight: boolean;
  occupancyPercent: number;
  bookingPacePercent: number;
  marketCompRate: number | null;
}

export interface RuleAdjustment {
  rule: string;
  description: string;
  multiplier: number;
  rateBeforeRule: number;
  rateAfterRule: number;
}

export interface NightlyBreakdown {
  date: string;
  rate: number;
  source: string;
  adjustments: RuleAdjustment[];
}

export interface BookingQuoteInput {
  listingId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  hasPets?: boolean;
  selectedAddOns?: string[];
  promoCode?: string;
}

export interface BookingQuoteResult {
  nights: number;
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
  addOns: { name: string; price: number; pricingType: AddOnPricingType }[];
  addOnsTotal: number;
  promoDiscount: number;
  promoCode: string | null;
  total: number;
}

export interface PreviewTotalInput {
  nightlyRates: number[];
  cleaningFee: number;
  taxRate: number;
  serviceFeePercent: number;
  serviceFeeFlat: number;
  depositHoldPercent: number;
  depositHoldFlat: number;
  petFee: number;
  extraGuestFee: number;
  addOnsTotal: number;
  promoDiscount: number;
}

export interface PreviewTotalResult {
  subtotal: number;
  cleaningFee: number;
  petFee: number;
  extraGuestFee: number;
  taxAmount: number;
  serviceFee: number;
  depositHold: number;
  addOnsTotal: number;
  promoDiscount: number;
  total: number;
}
