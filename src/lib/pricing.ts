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
  taxAmount: number;
  total: number;
}

export async function calculatePricing(
  listingId: string,
  checkIn: Date,
  checkOut: Date,
  guests: number,
  options?: { hasPets?: boolean }
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

  const dailyRates = await prisma.finalDailyRate.findMany({
    where: {
      listingId,
      date: { in: dates },
    },
  });
  const rateMap = new Map(
    dailyRates.map((r) => [r.date.toISOString().split("T")[0], r])
  );

  const config = listing.pricingConfig;
  const baseRate = config?.baseNightlyRate || listing.pricePerNight;

  const nightlyRates: NightlyRate[] = dates.map((d) => {
    const key = d.toISOString().split("T")[0];
    const daily = rateMap.get(key);
    if (daily) {
      return { date: key, rate: daily.finalRate, source: daily.rateSource };
    }
    if (config?.weekendRate && (d.getDay() === 5 || d.getDay() === 6)) {
      return { date: key, rate: config.weekendRate, source: "weekend" };
    }
    return { date: key, rate: baseRate, source: "base" };
  });

  const subtotal = nightlyRates.reduce((sum, n) => sum + n.rate, 0);

  const cleaningFee = config?.cleaningFee ?? listing.cleaningFee;

  const extraGuestThreshold = listing.maxGuests > 2 ? 2 : listing.maxGuests;
  const extraGuests = Math.max(0, guests - extraGuestThreshold);
  const extraGuestFee = extraGuests * (config?.extraGuestFee ?? 0) * nights;

  const petFee = options?.hasPets ? (config?.petFee ?? 0) : 0;

  const total = subtotal + cleaningFee + petFee + extraGuestFee;

  return {
    nights,
    nightlyRates,
    subtotal,
    cleaningFee,
    petFee,
    extraGuestFee,
    taxAmount: 0,
    total,
  };
}
