import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  const results: string[] = [];

  try {
    // ─── Expand PricingRule ─────────────────────────────────────────
    const pricingRuleCols = [
      `ALTER TABLE "PricingRule" ADD COLUMN IF NOT EXISTS "ruleStatus" TEXT NOT NULL DEFAULT 'draft'`,
      `ALTER TABLE "PricingRule" ADD COLUMN IF NOT EXISTS "settingsJson" JSONB`,
      `ALTER TABLE "PricingRule" ADD COLUMN IF NOT EXISTS "minRate" DOUBLE PRECISION NOT NULL DEFAULT 0`,
      `ALTER TABLE "PricingRule" ADD COLUMN IF NOT EXISTS "maxRate" DOUBLE PRECISION NOT NULL DEFAULT 0`,
      `ALTER TABLE "PricingRule" ADD COLUMN IF NOT EXISTS "requiresAdminApproval" BOOLEAN NOT NULL DEFAULT false`,
    ];
    for (const sql of pricingRuleCols) {
      await prisma.$executeRawUnsafe(sql);
    }
    results.push("PricingRule expanded");

    // ─── Expand PricingChangeLog ────────────────────────────────────
    const changeLogCols = [
      `ALTER TABLE "PricingChangeLog" ADD COLUMN IF NOT EXISTS "date" TIMESTAMP(3)`,
      `ALTER TABLE "PricingChangeLog" ADD COLUMN IF NOT EXISTS "oldRate" DOUBLE PRECISION`,
      `ALTER TABLE "PricingChangeLog" ADD COLUMN IF NOT EXISTS "newRate" DOUBLE PRECISION`,
      `ALTER TABLE "PricingChangeLog" ADD COLUMN IF NOT EXISTS "changedByRule" TEXT`,
      `ALTER TABLE "PricingChangeLog" ADD COLUMN IF NOT EXISTS "changedByAdmin" TEXT`,
      `ALTER TABLE "PricingChangeLog" ADD COLUMN IF NOT EXISTS "reason" TEXT`,
    ];
    for (const sql of changeLogCols) {
      await prisma.$executeRawUnsafe(sql);
    }
    results.push("PricingChangeLog expanded");

    // ─── OccupancyPricingSettings ───────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OccupancyPricingSettings" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "listingId" TEXT NOT NULL,
        "isEnabled" BOOLEAN NOT NULL DEFAULT false,
        "occupancyWindowDays" INT NOT NULL DEFAULT 30,
        "lowOccupancyThreshold" DOUBLE PRECISION NOT NULL DEFAULT 40,
        "highOccupancyThreshold" DOUBLE PRECISION NOT NULL DEFAULT 75,
        "lowOccupancyAdjustmentPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
        "highOccupancyAdjustmentPercent" DOUBLE PRECISION NOT NULL DEFAULT 15,
        "maxIncreasePercent" DOUBLE PRECISION NOT NULL DEFAULT 25,
        "maxDecreasePercent" DOUBLE PRECISION NOT NULL DEFAULT 15,
        "applyWeekdays" BOOLEAN NOT NULL DEFAULT true,
        "applyWeekends" BOOLEAN NOT NULL DEFAULT true,
        "excludeLockedDates" BOOLEAN NOT NULL DEFAULT true,
        "excludeEventDates" BOOLEAN NOT NULL DEFAULT true,
        "requireAdminApproval" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "OccupancyPricingSettings_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "OccupancyPricingSettings_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "OccupancyPricingSettings_listingId_key" ON "OccupancyPricingSettings"("listingId")`);
    results.push("OccupancyPricingSettings created");

    // ─── BookingPaceSettings ────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BookingPaceSettings" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "listingId" TEXT NOT NULL,
        "isEnabled" BOOLEAN NOT NULL DEFAULT false,
        "comparisonPeriodDays" INT NOT NULL DEFAULT 90,
        "fastPaceThresholdPercent" DOUBLE PRECISION NOT NULL DEFAULT 120,
        "slowPaceThresholdPercent" DOUBLE PRECISION NOT NULL DEFAULT 80,
        "fastPaceAdjustmentPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
        "slowPaceAdjustmentPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
        "leadTimeWindowsJson" JSONB NOT NULL DEFAULT '[{"min":0,"max":7,"label":"0-7 days"},{"min":8,"max":30,"label":"8-30 days"},{"min":31,"max":90,"label":"31-90 days"},{"min":91,"max":365,"label":"90+ days"}]',
        "maxAdjustmentPercent" DOUBLE PRECISION NOT NULL DEFAULT 20,
        "applyFutureOpenDatesOnly" BOOLEAN NOT NULL DEFAULT true,
        "excludeLockedDates" BOOLEAN NOT NULL DEFAULT true,
        "requireAdminApproval" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "BookingPaceSettings_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "BookingPaceSettings_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "BookingPaceSettings_listingId_key" ON "BookingPaceSettings"("listingId")`);
    results.push("BookingPaceSettings created");

    // ─── MarketCompSettings ─────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MarketCompSettings" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "listingId" TEXT NOT NULL,
        "isEnabled" BOOLEAN NOT NULL DEFAULT false,
        "marketDataSource" TEXT NOT NULL DEFAULT 'manual',
        "compRadiusMiles" DOUBLE PRECISION NOT NULL DEFAULT 5,
        "compPropertyType" TEXT NOT NULL DEFAULT 'entire_home',
        "bedroomMatchRequired" BOOLEAN NOT NULL DEFAULT true,
        "guestCapacityMatchRequired" BOOLEAN NOT NULL DEFAULT false,
        "targetMarketPosition" TEXT NOT NULL DEFAULT 'premium',
        "adjustmentStrength" TEXT NOT NULL DEFAULT 'balanced',
        "minimumConfidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 60,
        "maxIncreasePercent" DOUBLE PRECISION NOT NULL DEFAULT 20,
        "maxDecreasePercent" DOUBLE PRECISION NOT NULL DEFAULT 15,
        "excludeWeakCompData" BOOLEAN NOT NULL DEFAULT true,
        "excludeLockedDates" BOOLEAN NOT NULL DEFAULT true,
        "requireAdminApproval" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MarketCompSettings_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "MarketCompSettings_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "MarketCompSettings_listingId_key" ON "MarketCompSettings"("listingId")`);
    results.push("MarketCompSettings created");

    // ─── ManualPriceLock ────────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ManualPriceLock" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "listingId" TEXT NOT NULL,
        "startDate" TIMESTAMP(3) NOT NULL,
        "endDate" TIMESTAMP(3) NOT NULL,
        "lockedRate" DOUBLE PRECISION NOT NULL,
        "lockReason" TEXT,
        "lockAppliesTo" TEXT NOT NULL DEFAULT 'rate_only',
        "expiresAt" TIMESTAMP(3),
        "preventAiChanges" BOOLEAN NOT NULL DEFAULT true,
        "preventBulkUpdates" BOOLEAN NOT NULL DEFAULT true,
        "preventDynamicRules" BOOLEAN NOT NULL DEFAULT true,
        "createdBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ManualPriceLock_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ManualPriceLock_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ManualPriceLock_listingId_idx" ON "ManualPriceLock"("listingId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ManualPriceLock_listingId_startDate_endDate_idx" ON "ManualPriceLock"("listingId", "startDate", "endDate")`);
    results.push("ManualPriceLock created");

    // ─── PricingRulePreview ─────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PricingRulePreview" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "listingId" TEXT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL,
        "baseRate" DOUBLE PRECISION NOT NULL,
        "occupancyAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "bookingPaceAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "marketCompAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "aiSuggestedRate" DOUBLE PRECISION,
        "manualLockRate" DOUBLE PRECISION,
        "finalPreviewRate" DOUBLE PRECISION NOT NULL,
        "rateSource" TEXT NOT NULL DEFAULT 'base',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PricingRulePreview_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "PricingRulePreview_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PricingRulePreview_listingId_idx" ON "PricingRulePreview"("listingId")`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "PricingRulePreview_listingId_date_key" ON "PricingRulePreview"("listingId", "date")`);
    results.push("PricingRulePreview created");

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error("Migration error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
