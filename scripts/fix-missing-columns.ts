import pg from "pg";
import dns from "dns";
import "dotenv/config";

dns.setDefaultResultOrder("ipv4first");

const raw = process.env.DATABASE_URL!;
const connStr = raw.includes("sslmode=") ? raw : raw + (raw.includes("?") ? "&sslmode=disable" : "?sslmode=disable");
const pool = new pg.Pool({ connectionString: connStr });

async function main() {
  const client = await pool.connect();
  try {
    // 1. Check which Reservation columns exist
    const resCols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'Reservation' ORDER BY ordinal_position
    `);
    console.log("Reservation columns:", resCols.rows.map(r => r.column_name));

    // 2. Check which tables exist
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log("\nAll tables:", tables.rows.map(r => r.table_name));

    // 3. Add missing Reservation columns
    const existingCols = new Set(resCols.rows.map(r => r.column_name));
    const missingCols: [string, string][] = [
      ["channel", "TEXT"],
      ["portalToken", "TEXT UNIQUE"],
      ["portalExpires", "TIMESTAMPTZ"],
      ["portalRevoked", "BOOLEAN DEFAULT false"],
    ];

    for (const [col, type] of missingCols) {
      if (!existingCols.has(col)) {
        console.log(`Adding Reservation.${col}...`);
        await client.query(`ALTER TABLE "Reservation" ADD COLUMN "${col}" ${type}`);
      } else {
        console.log(`Reservation.${col} already exists`);
      }
    }

    // 4. Create missing tables
    const existingTables = new Set(tables.rows.map(r => r.table_name));

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
      console.log("PricingConfig created");
    }

    if (!existingTables.has("FinalDailyRate")) {
      console.log("Creating FinalDailyRate table...");
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
      console.log("FinalDailyRate created");
    }

    if (!existingTables.has("PricingRule")) {
      console.log("Creating PricingRule table...");
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
      console.log("PricingRule created");
    }

    if (!existingTables.has("PricingChangeLog")) {
      console.log("Creating PricingChangeLog table...");
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
      console.log("PricingChangeLog created");
    }

    if (!existingTables.has("ListingContentLink")) {
      console.log("Creating ListingContentLink table...");
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
      console.log("ListingContentLink created");
    }

    // 5. Seed PricingConfig for existing listings
    if (!existingTables.has("PricingConfig")) {
      console.log("\nSeeding PricingConfig from existing listing data...");
      const listings = await client.query(`SELECT "id", "pricePerNight", "cleaningFee" FROM "Listing"`);
      for (const l of listings.rows) {
        await client.query(`
          INSERT INTO "PricingConfig" ("id", "listingId", "baseNightlyRate", "cleaningFee")
          VALUES (gen_random_uuid()::text, $1, $2, $3)
          ON CONFLICT ("listingId") DO NOTHING
        `, [l.id, l.pricePerNight || 0, l.cleaningFee || 0]);
        console.log(`  Seeded PricingConfig for listing ${l.id}`);
      }
    }

    // 6. Also check ReservationAgreement table
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
      console.log("ReservationAgreement created");
    }

    // 7. Check for other missing tables referenced in schema
    const otherTables = [
      "GuestRequest", "GuestReview", "GuestInventoryReport", "GuestPortalLog",
      "InventoryItem", "CheckinInstruction", "LocalRecommendation"
    ];
    for (const t of otherTables) {
      if (!existingTables.has(t)) {
        console.log(`WARNING: Table ${t} is missing from database!`);
      }
    }

    console.log("\nDone! All missing columns and tables have been created.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
