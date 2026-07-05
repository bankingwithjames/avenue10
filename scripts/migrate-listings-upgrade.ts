import pg from "pg";
import dns from "dns";
import "dotenv/config";

dns.setDefaultResultOrder("ipv4first");

const raw = process.env.DATABASE_URL!;
const connStr = raw.includes("sslmode=")
  ? raw
  : raw + (raw.includes("?") ? "&sslmode=disable" : "?sslmode=disable");
const pool = new pg.Pool({ connectionString: connStr });

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // --- PricingConfig ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS "PricingConfig" (
        "id" TEXT NOT NULL,
        "listingId" TEXT NOT NULL,
        "baseNightlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "cleaningFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "weekendRate" DOUBLE PRECISION,
        "minRate" DOUBLE PRECISION,
        "maxRate" DOUBLE PRECISION,
        "petFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "extraGuestFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "securityDeposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "minimumStay" INT NOT NULL DEFAULT 1,
        "dynamicPricingEnabled" BOOLEAN NOT NULL DEFAULT false,
        "pricingProvider" TEXT,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PricingConfig_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "PricingConfig_listingId_key" UNIQUE ("listingId"),
        CONSTRAINT "PricingConfig_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE
      )
    `);

    // --- FinalDailyRate ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS "FinalDailyRate" (
        "id" TEXT NOT NULL,
        "listingId" TEXT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL,
        "finalRate" DOUBLE PRECISION NOT NULL,
        "rateSource" TEXT NOT NULL DEFAULT 'base',
        "baseRate" DOUBLE PRECISION,
        "ruleAdjustedRate" DOUBLE PRECISION,
        "aiSuggestedRate" DOUBLE PRECISION,
        "approvedAiRate" DOUBLE PRECISION,
        "manualOverrideRate" DOUBLE PRECISION,
        "isLocked" BOOLEAN NOT NULL DEFAULT false,
        "syncStatus" TEXT NOT NULL DEFAULT 'synced',
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FinalDailyRate_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "FinalDailyRate_listingId_date_key" UNIQUE ("listingId", "date"),
        CONSTRAINT "FinalDailyRate_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "FinalDailyRate_listingId_idx" ON "FinalDailyRate"("listingId")`);

    // --- PricingRule ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS "PricingRule" (
        "id" TEXT NOT NULL,
        "listingId" TEXT NOT NULL,
        "ruleType" TEXT NOT NULL,
        "ruleName" TEXT NOT NULL,
        "adjustmentType" TEXT NOT NULL DEFAULT 'percentage',
        "adjustmentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "appliesTo" TEXT NOT NULL DEFAULT 'all',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "PricingRule_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "PricingRule_listingId_idx" ON "PricingRule"("listingId")`);

    // --- PricingChangeLog ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS "PricingChangeLog" (
        "id" TEXT NOT NULL,
        "listingId" TEXT NOT NULL,
        "changedField" TEXT NOT NULL,
        "oldValue" TEXT,
        "newValue" TEXT,
        "changedFromPage" TEXT NOT NULL DEFAULT 'listings',
        "changedBy" TEXT,
        "affectsFinalPricing" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PricingChangeLog_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "PricingChangeLog_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "PricingChangeLog_listingId_idx" ON "PricingChangeLog"("listingId")`);

    // --- ListingContentLink ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ListingContentLink" (
        "id" TEXT NOT NULL,
        "listingId" TEXT NOT NULL,
        "contentKey" TEXT NOT NULL,
        "siteContentId" TEXT,
        "usageLocation" TEXT NOT NULL DEFAULT 'listing',
        "isSynced" BOOLEAN NOT NULL DEFAULT true,
        "overrideValue" TEXT,
        "allowsOverride" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ListingContentLink_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ListingContentLink_listingId_contentKey_key" UNIQUE ("listingId", "contentKey"),
        CONSTRAINT "ListingContentLink_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE,
        CONSTRAINT "ListingContentLink_siteContentId_fkey" FOREIGN KEY ("siteContentId") REFERENCES "SiteContent"("id") ON DELETE SET NULL
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "ListingContentLink_listingId_idx" ON "ListingContentLink"("listingId")`);

    // --- Seed PricingConfig for existing listings ---
    const listings = await client.query(`SELECT "id", "pricePerNight", "cleaningFee" FROM "Listing"`);
    for (const row of listings.rows) {
      const exists = await client.query(`SELECT 1 FROM "PricingConfig" WHERE "listingId" = $1`, [row.id]);
      if (exists.rows.length === 0) {
        const id = `pc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await client.query(
          `INSERT INTO "PricingConfig" ("id", "listingId", "baseNightlyRate", "cleaningFee", "updatedAt") VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
          [id, row.id, row.pricePerNight, row.cleaningFee]
        );
      }
    }

    await client.query("COMMIT");
    console.log("Listings upgrade migration completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
