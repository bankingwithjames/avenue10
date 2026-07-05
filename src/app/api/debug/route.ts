import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const results: Record<string, unknown> = {};

  // Test 1: Simplest possible Prisma query
  try {
    const count = await prisma.listing.count();
    results.listingCount = count;
  } catch (e: unknown) {
    results.listingCountError = e instanceof Error ? e.message : String(e);
  }

  // Test 2: Basic findMany with no includes
  try {
    const listings = await prisma.listing.findMany({
      select: { id: true, title: true },
    });
    results.listings = listings;
  } catch (e: unknown) {
    results.listingsError = e instanceof Error ? e.message : String(e);
  }

  // Test 3: Reservation count
  try {
    const count = await prisma.reservation.count();
    results.reservationCount = count;
  } catch (e: unknown) {
    results.reservationCountError = e instanceof Error ? e.message : String(e);
  }

  // Test 4: Reservation with accessCode filter
  try {
    const res = await prisma.reservation.findFirst({
      where: { accessCode: "AV10-TEST01" },
      select: { id: true, guestName: true, accessCode: true, status: true },
    });
    results.reservationByCode = res;
  } catch (e: unknown) {
    results.reservationByCodeError = e instanceof Error ? e.message : String(e);
  }

  // Test 5: Reservation with listing include
  try {
    const res = await prisma.reservation.findFirst({
      where: { accessCode: "AV10-TEST01" },
      include: {
        listing: { select: { id: true, title: true } },
      },
    });
    results.reservationWithListing = res ? { id: res.id, guestName: res.guestName, listing: res.listing } : null;
  } catch (e: unknown) {
    results.reservationWithListingError = e instanceof Error ? e.message : String(e);
  }

  // Test 6: PricingConfig
  try {
    const configs = await prisma.pricingConfig.findMany({
      select: { id: true, listingId: true, baseNightlyRate: true },
    });
    results.pricingConfigs = configs;
  } catch (e: unknown) {
    results.pricingConfigError = e instanceof Error ? e.message : String(e);
  }

  // Test 7: Listing with pricingConfig include
  try {
    const listings = await prisma.listing.findMany({
      include: { pricingConfig: true },
      take: 1,
    });
    results.listingWithPricing = listings.length > 0 ? { id: listings[0].id, hasPricingConfig: !!listings[0].pricingConfig } : null;
  } catch (e: unknown) {
    results.listingWithPricingError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(results);
}
