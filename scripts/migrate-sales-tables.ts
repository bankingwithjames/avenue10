import pg from "pg";
import dns from "dns";
import "dotenv/config";

dns.setDefaultResultOrder("ipv4first");

const connStr = process.env.SUPABASE_DIRECT_URL || process.env.DATABASE_URL!;
const pool = new pg.Pool({ connectionString: connStr });

async function main() {
  const client = await pool.connect();
  try {
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    const existing = new Set(tables.rows.map((r: { table_name: string }) => r.table_name));
    console.log("Existing tables:", [...existing].sort().join(", "));

    // 1. SalesConfig
    if (!existing.has("SalesConfig")) {
      console.log("\nCreating SalesConfig...");
      await client.query(`
        CREATE TABLE "SalesConfig" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "listingId" TEXT NOT NULL,
          "boardRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "weekendRate" DOUBLE PRECISION,
          "cleaningFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "taxLabel" TEXT NOT NULL DEFAULT 'Taxes & Fees',
          "serviceFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "serviceFeeFlat" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "serviceFeeLabel" TEXT NOT NULL DEFAULT 'Service Fee',
          "depositHoldPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "depositHoldFlat" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "depositHoldLabel" TEXT NOT NULL DEFAULT 'Security Deposit Hold',
          "petFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "extraGuestFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "extraGuestThreshold" INTEGER NOT NULL DEFAULT 2,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY ("id"),
          CONSTRAINT "SalesConfig_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE
        )
      `);
      await client.query(`CREATE UNIQUE INDEX "SalesConfig_listingId_key" ON "SalesConfig"("listingId")`);
      console.log("  SalesConfig created.");
    } else {
      console.log("SalesConfig already exists, skipping.");
    }

    // 2. AddOnItem
    if (!existing.has("AddOnItem")) {
      console.log("\nCreating AddOnItem...");
      await client.query(`
        CREATE TABLE "AddOnItem" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "salesConfigId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "price" DOUBLE PRECISION NOT NULL,
          "category" TEXT NOT NULL DEFAULT 'service',
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY ("id"),
          CONSTRAINT "AddOnItem_salesConfigId_fkey" FOREIGN KEY ("salesConfigId") REFERENCES "SalesConfig"("id") ON DELETE CASCADE
        )
      `);
      await client.query(`CREATE INDEX "AddOnItem_salesConfigId_idx" ON "AddOnItem"("salesConfigId")`);
      console.log("  AddOnItem created.");
    } else {
      console.log("AddOnItem already exists, skipping.");
    }

    // 3. Add new columns to BookingQuote
    const quoteColumns = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'BookingQuote'
    `);
    const qCols = new Set(quoteColumns.rows.map((r: { column_name: string }) => r.column_name));

    if (!qCols.has("serviceFee")) {
      console.log("\nAdding serviceFee to BookingQuote...");
      await client.query(`ALTER TABLE "BookingQuote" ADD COLUMN "serviceFee" DOUBLE PRECISION NOT NULL DEFAULT 0`);
    }
    if (!qCols.has("depositHold")) {
      console.log("Adding depositHold to BookingQuote...");
      await client.query(`ALTER TABLE "BookingQuote" ADD COLUMN "depositHold" DOUBLE PRECISION NOT NULL DEFAULT 0`);
    }
    if (!qCols.has("addOnsTotal")) {
      console.log("Adding addOnsTotal to BookingQuote...");
      await client.query(`ALTER TABLE "BookingQuote" ADD COLUMN "addOnsTotal" DOUBLE PRECISION NOT NULL DEFAULT 0`);
    }
    if (!qCols.has("addOnsBreakdown")) {
      console.log("Adding addOnsBreakdown to BookingQuote...");
      await client.query(`ALTER TABLE "BookingQuote" ADD COLUMN "addOnsBreakdown" JSONB`);
    }

    // 4. Add new columns to Reservation
    const resColumns = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'Reservation'
    `);
    const rCols = new Set(resColumns.rows.map((r: { column_name: string }) => r.column_name));

    if (!rCols.has("serviceFeeCharged")) {
      console.log("\nAdding serviceFeeCharged to Reservation...");
      await client.query(`ALTER TABLE "Reservation" ADD COLUMN "serviceFeeCharged" DOUBLE PRECISION`);
    }
    if (!rCols.has("depositHoldCharged")) {
      console.log("Adding depositHoldCharged to Reservation...");
      await client.query(`ALTER TABLE "Reservation" ADD COLUMN "depositHoldCharged" DOUBLE PRECISION`);
    }
    if (!rCols.has("addOnsTotalCharged")) {
      console.log("Adding addOnsTotalCharged to Reservation...");
      await client.query(`ALTER TABLE "Reservation" ADD COLUMN "addOnsTotalCharged" DOUBLE PRECISION`);
    }
    if (!rCols.has("addOnsDetail")) {
      console.log("Adding addOnsDetail to Reservation...");
      await client.query(`ALTER TABLE "Reservation" ADD COLUMN "addOnsDetail" JSONB`);
    }

    console.log("\nSales migration complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
