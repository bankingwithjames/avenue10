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

    // 1. BookingQuote
    if (!existing.has("BookingQuote")) {
      console.log("\nCreating BookingQuote...");
      await client.query(`
        CREATE TABLE "BookingQuote" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "listingId" TEXT NOT NULL,
          "checkIn" TIMESTAMPTZ NOT NULL,
          "checkOut" TIMESTAMPTZ NOT NULL,
          "guests" INTEGER NOT NULL,
          "nights" INTEGER NOT NULL,
          "nightlyBreakdown" JSONB NOT NULL,
          "subtotal" DOUBLE PRECISION NOT NULL,
          "cleaningFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "petFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "extraGuestFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "total" DOUBLE PRECISION NOT NULL,
          "currency" TEXT NOT NULL DEFAULT 'USD',
          "status" TEXT NOT NULL DEFAULT 'active',
          "expiresAt" TIMESTAMPTZ NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "BookingQuote_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "BookingQuote_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE
        )
      `);
      await client.query(`CREATE INDEX "BookingQuote_listingId_idx" ON "BookingQuote"("listingId")`);
      await client.query(`CREATE INDEX "BookingQuote_status_expiresAt_idx" ON "BookingQuote"("status", "expiresAt")`);
      console.log("  Created!");
    } else {
      console.log("BookingQuote already exists, skipping.");
    }

    // 2. BookingRule
    if (!existing.has("BookingRule")) {
      console.log("\nCreating BookingRule...");
      await client.query(`
        CREATE TABLE "BookingRule" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "listingId" TEXT NOT NULL,
          "bookingMode" TEXT NOT NULL DEFAULT 'request_to_book',
          "requireIdVerification" BOOLEAN NOT NULL DEFAULT false,
          "requireAgreement" BOOLEAN NOT NULL DEFAULT true,
          "depositPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "depositFlat" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "cancellationPolicy" TEXT NOT NULL DEFAULT 'flexible',
          "minAdvanceDays" INTEGER NOT NULL DEFAULT 0,
          "maxAdvanceDays" INTEGER NOT NULL DEFAULT 365,
          "instantBookMaxNights" INTEGER,
          "autoApproveReturning" BOOLEAN NOT NULL DEFAULT false,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "BookingRule_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "BookingRule_listingId_key" UNIQUE ("listingId"),
          CONSTRAINT "BookingRule_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE
        )
      `);
      console.log("  Created!");
    } else {
      console.log("BookingRule already exists, skipping.");
    }

    // 3. CheckoutSession
    if (!existing.has("CheckoutSession")) {
      console.log("\nCreating CheckoutSession...");
      await client.query(`
        CREATE TABLE "CheckoutSession" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "quoteId" TEXT NOT NULL,
          "reservationId" TEXT,
          "step" TEXT NOT NULL DEFAULT 'guest_info',
          "guestFirstName" TEXT,
          "guestLastName" TEXT,
          "guestEmail" TEXT,
          "guestPhone" TEXT,
          "specialRequests" TEXT,
          "status" TEXT NOT NULL DEFAULT 'in_progress',
          "expiresAt" TIMESTAMPTZ NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "CheckoutSession_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "CheckoutSession_quoteId_key" UNIQUE ("quoteId"),
          CONSTRAINT "CheckoutSession_reservationId_key" UNIQUE ("reservationId"),
          CONSTRAINT "CheckoutSession_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "BookingQuote"("id") ON DELETE CASCADE,
          CONSTRAINT "CheckoutSession_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL
        )
      `);
      await client.query(`CREATE INDEX "CheckoutSession_status_expiresAt_idx" ON "CheckoutSession"("status", "expiresAt")`);
      console.log("  Created!");
    } else {
      console.log("CheckoutSession already exists, skipping.");
    }

    // 4. BookingNotification
    if (!existing.has("BookingNotification")) {
      console.log("\nCreating BookingNotification...");
      await client.query(`
        CREATE TABLE "BookingNotification" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "reservationId" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "channel" TEXT NOT NULL DEFAULT 'email',
          "recipient" TEXT NOT NULL,
          "subject" TEXT,
          "body" TEXT,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "sentAt" TIMESTAMPTZ,
          "error" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "BookingNotification_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "BookingNotification_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE
        )
      `);
      await client.query(`CREATE INDEX "BookingNotification_reservationId_idx" ON "BookingNotification"("reservationId")`);
      console.log("  Created!");
    } else {
      console.log("BookingNotification already exists, skipping.");
    }

    // 5. Add new columns to Reservation
    console.log("\nAdding new columns to Reservation...");
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'Reservation' AND table_schema = 'public'
    `);
    const existingCols = new Set(cols.rows.map((r: { column_name: string }) => r.column_name));

    const newCols: [string, string][] = [
      ["quoteId", "TEXT"],
      ["guestId", "TEXT"],
      ["bookingMode", "TEXT"],
      ["nightlyBreakdown", "JSONB"],
      ["subtotal", "DOUBLE PRECISION"],
      ["cleaningFeeCharged", "DOUBLE PRECISION"],
      ["petFeeCharged", "DOUBLE PRECISION"],
      ["extraGuestFeeCharged", "DOUBLE PRECISION"],
      ["taxAmount", "DOUBLE PRECISION"],
      ["paymentStatus", "TEXT DEFAULT 'none' NOT NULL"],
      ["depositAmount", "DOUBLE PRECISION"],
      ["depositPaidAt", "TIMESTAMPTZ"],
      ["confirmationCode", "TEXT"],
      ["adminNotes", "TEXT"],
      ["approvedBy", "TEXT"],
      ["approvedAt", "TIMESTAMPTZ"],
      ["declinedReason", "TEXT"],
    ];

    for (const [col, type] of newCols) {
      if (!existingCols.has(col)) {
        await client.query(`ALTER TABLE "Reservation" ADD COLUMN "${col}" ${type}`);
        console.log(`  Added ${col}`);
      }
    }

    // Add unique constraint on confirmationCode if not exists
    try {
      await client.query(`
        ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_confirmationCode_key" UNIQUE ("confirmationCode")
      `);
      console.log("  Added confirmationCode unique constraint");
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("already exists")) {
        console.log("  confirmationCode unique constraint already exists");
      } else {
        throw e;
      }
    }

    console.log("\nMigration complete!");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
