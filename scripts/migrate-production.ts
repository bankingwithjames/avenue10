import pg from "pg";
import dns from "dns";
import "dotenv/config";

dns.setDefaultResultOrder("ipv4first");

const connStr = process.env.SUPABASE_DIRECT_URL || process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: connStr });

async function main() {
  const client = await pool.connect();
  try {
    // 1. Check current state
    const resCols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'Reservation' ORDER BY ordinal_position
    `);
    console.log("Current Reservation columns:", resCols.rows.map(r => r.column_name));

    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log("\nCurrent tables:", tables.rows.map(r => r.table_name));

    const existingCols = new Set(resCols.rows.map(r => r.column_name));
    const existingTables = new Set(tables.rows.map(r => r.table_name));

    // 2. Add missing Reservation columns
    const missingResCols: [string, string][] = [
      ["accessCode", "TEXT"],
      ["channel", "TEXT"],
      ["portalToken", "TEXT UNIQUE"],
      ["portalExpires", "TIMESTAMPTZ"],
      ["portalRevoked", "BOOLEAN DEFAULT false"],
    ];

    for (const [col, type] of missingResCols) {
      if (!existingCols.has(col)) {
        console.log(`\nAdding Reservation.${col}...`);
        await client.query(`ALTER TABLE "Reservation" ADD COLUMN "${col}" ${type}`);
        console.log(`  Added!`);
      } else {
        console.log(`Reservation.${col} already exists`);
      }
    }

    // 3. Create PricingConfig
    if (!existingTables.has("PricingConfig")) {
      console.log("\nCreating PricingConfig table...");
      await client.query(`
        CREATE TABLE "PricingConfig" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "listingId" TEXT NOT NULL UNIQUE,
          "baseNightlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "cleaningFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "weekendRate" DOUBLE PRECISION,
          "minRate" DOUBLE PRECISION,
          "maxRate" DOUBLE PRECISION,
          "petFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "extraGuestFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "securityDeposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "minimumStay" INTEGER NOT NULL DEFAULT 1,
          "dynamicPricingEnabled" BOOLEAN NOT NULL DEFAULT false,
          "pricingProvider" TEXT,
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PricingConfig_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "PricingConfig_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE
        )
      `);
      console.log("  Created!");

      // Seed from existing listing data
      const listings = await client.query(`SELECT "id", "pricePerNight", "cleaningFee" FROM "Listing"`);
      for (const l of listings.rows) {
        await client.query(`
          INSERT INTO "PricingConfig" ("id", "listingId", "baseNightlyRate", "cleaningFee")
          VALUES (gen_random_uuid()::text, $1, $2, $3)
          ON CONFLICT ("listingId") DO NOTHING
        `, [l.id, l.pricePerNight || 0, l.cleaningFee || 0]);
        console.log(`  Seeded PricingConfig for listing ${l.id}`);
      }
    } else {
      console.log("PricingConfig already exists");
    }

    // 4. Create FinalDailyRate
    if (!existingTables.has("FinalDailyRate")) {
      console.log("\nCreating FinalDailyRate table...");
      await client.query(`
        CREATE TABLE "FinalDailyRate" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "listingId" TEXT NOT NULL,
          "date" TIMESTAMPTZ NOT NULL,
          "finalRate" DOUBLE PRECISION NOT NULL,
          "rateSource" TEXT NOT NULL DEFAULT 'base',
          "baseRate" DOUBLE PRECISION,
          "ruleAdjustedRate" DOUBLE PRECISION,
          "aiSuggestedRate" DOUBLE PRECISION,
          "approvedAiRate" DOUBLE PRECISION,
          "manualOverrideRate" DOUBLE PRECISION,
          "isLocked" BOOLEAN NOT NULL DEFAULT false,
          "syncStatus" TEXT NOT NULL DEFAULT 'synced',
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "FinalDailyRate_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "FinalDailyRate_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE,
          CONSTRAINT "FinalDailyRate_listingId_date_key" UNIQUE ("listingId", "date")
        )
      `);
      await client.query(`CREATE INDEX "FinalDailyRate_listingId_idx" ON "FinalDailyRate"("listingId")`);
      console.log("  Created!");
    } else {
      console.log("FinalDailyRate already exists");
    }

    // 5. Create PricingRule
    if (!existingTables.has("PricingRule")) {
      console.log("\nCreating PricingRule table...");
      await client.query(`
        CREATE TABLE "PricingRule" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "listingId" TEXT NOT NULL,
          "ruleType" TEXT NOT NULL,
          "ruleName" TEXT NOT NULL,
          "adjustmentType" TEXT NOT NULL DEFAULT 'percentage',
          "adjustmentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "appliesTo" TEXT NOT NULL DEFAULT 'all',
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "PricingRule_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE
        )
      `);
      await client.query(`CREATE INDEX "PricingRule_listingId_idx" ON "PricingRule"("listingId")`);
      console.log("  Created!");
    } else {
      console.log("PricingRule already exists");
    }

    // 6. Create PricingChangeLog
    if (!existingTables.has("PricingChangeLog")) {
      console.log("\nCreating PricingChangeLog table...");
      await client.query(`
        CREATE TABLE "PricingChangeLog" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "listingId" TEXT NOT NULL,
          "changedField" TEXT NOT NULL,
          "oldValue" TEXT,
          "newValue" TEXT,
          "changedFromPage" TEXT NOT NULL DEFAULT 'listings',
          "changedBy" TEXT,
          "affectsFinalPricing" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PricingChangeLog_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "PricingChangeLog_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE
        )
      `);
      await client.query(`CREATE INDEX "PricingChangeLog_listingId_idx" ON "PricingChangeLog"("listingId")`);
      console.log("  Created!");
    } else {
      console.log("PricingChangeLog already exists");
    }

    // 7. Create ListingContentLink
    if (!existingTables.has("ListingContentLink")) {
      console.log("\nCreating ListingContentLink table...");
      await client.query(`
        CREATE TABLE "ListingContentLink" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "listingId" TEXT NOT NULL,
          "contentKey" TEXT NOT NULL,
          "siteContentId" TEXT,
          "usageLocation" TEXT NOT NULL DEFAULT 'listing',
          "isSynced" BOOLEAN NOT NULL DEFAULT true,
          "overrideValue" TEXT,
          "allowsOverride" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "ListingContentLink_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ListingContentLink_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE,
          CONSTRAINT "ListingContentLink_siteContentId_fkey" FOREIGN KEY ("siteContentId") REFERENCES "SiteContent"("id"),
          CONSTRAINT "ListingContentLink_listingId_contentKey_key" UNIQUE ("listingId", "contentKey")
        )
      `);
      await client.query(`CREATE INDEX "ListingContentLink_listingId_idx" ON "ListingContentLink"("listingId")`);
      console.log("  Created!");
    } else {
      console.log("ListingContentLink already exists");
    }

    // 8. Create ReservationAgreement if missing
    if (!existingTables.has("ReservationAgreement")) {
      console.log("\nCreating ReservationAgreement table...");
      await client.query(`
        CREATE TABLE "ReservationAgreement" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "reservationId" TEXT NOT NULL UNIQUE,
          "signedName" TEXT NOT NULL,
          "signedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "ipAddress" TEXT,
          "userAgent" TEXT,
          "documentHash" TEXT NOT NULL,
          CONSTRAINT "ReservationAgreement_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ReservationAgreement_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE
        )
      `);
      console.log("  Created!");
    } else {
      console.log("ReservationAgreement already exists");
    }

    // 9. Set test access codes on reservations
    console.log("\nSetting test access codes...");
    const reservations = await client.query(`SELECT "id", "guestName", "accessCode" FROM "Reservation"`);
    console.log("Reservations:", reservations.rows);

    for (const r of reservations.rows) {
      if (!r.accessCode) {
        const lastName = r.guestName?.trim().split(/\s+/).pop()?.toLowerCase();
        if (lastName === "smith") {
          await client.query(`UPDATE "Reservation" SET "accessCode" = 'AV10-TEST01' WHERE "id" = $1`, [r.id]);
          console.log(`  Set AV10-TEST01 for ${r.guestName}`);
        } else if (lastName === "doe") {
          await client.query(`UPDATE "Reservation" SET "accessCode" = 'AV10-TEST02' WHERE "id" = $1`, [r.id]);
          console.log(`  Set AV10-TEST02 for ${r.guestName}`);
        }
      } else {
        console.log(`  ${r.guestName} already has code: ${r.accessCode}`);
      }
    }

    // 10. Verify final state
    console.log("\n=== FINAL VERIFICATION ===");
    const finalCols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'Reservation' ORDER BY ordinal_position
    `);
    console.log("Reservation columns:", finalCols.rows.map(r => r.column_name));

    const finalTables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('PricingConfig','FinalDailyRate','PricingRule','PricingChangeLog','ListingContentLink','ReservationAgreement')
      ORDER BY table_name
    `);
    console.log("New tables:", finalTables.rows.map(r => r.table_name));

    console.log("\nAll migrations applied successfully!");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
