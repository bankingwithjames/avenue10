import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ─── Expand SalesConfig ──────────────────────────────────────────
    const salesConfigCols = [
      { name: "guestsIncluded", sql: `ALTER TABLE "SalesConfig" ADD COLUMN IF NOT EXISTS "guestsIncluded" INT NOT NULL DEFAULT 2` },
      { name: "maxGuests", sql: `ALTER TABLE "SalesConfig" ADD COLUMN IF NOT EXISTS "maxGuests" INT NOT NULL DEFAULT 10` },
      { name: "minimumStay", sql: `ALTER TABLE "SalesConfig" ADD COLUMN IF NOT EXISTS "minimumStay" INT NOT NULL DEFAULT 1` },
      { name: "maximumStay", sql: `ALTER TABLE "SalesConfig" ADD COLUMN IF NOT EXISTS "maximumStay" INT NOT NULL DEFAULT 30` },
      { name: "sameDayBookingAllowed", sql: `ALTER TABLE "SalesConfig" ADD COLUMN IF NOT EXISTS "sameDayBookingAllowed" BOOLEAN NOT NULL DEFAULT false` },
      { name: "advanceNoticeHours", sql: `ALTER TABLE "SalesConfig" ADD COLUMN IF NOT EXISTS "advanceNoticeHours" INT NOT NULL DEFAULT 24` },
    ];

    for (const col of salesConfigCols) {
      await client.query(col.sql);
      console.log(`  ✓ SalesConfig.${col.name}`);
    }

    // ─── Expand AddOnItem ────────────────────────────────────────────
    const addOnCols = [
      { name: "pricingType", sql: `ALTER TABLE "AddOnItem" ADD COLUMN IF NOT EXISTS "pricingType" TEXT NOT NULL DEFAULT 'flat'` },
      { name: "guestVisible", sql: `ALTER TABLE "AddOnItem" ADD COLUMN IF NOT EXISTS "guestVisible" BOOLEAN NOT NULL DEFAULT true` },
      { name: "requiresAdminApproval", sql: `ALTER TABLE "AddOnItem" ADD COLUMN IF NOT EXISTS "requiresAdminApproval" BOOLEAN NOT NULL DEFAULT false` },
      { name: "requiresInventory", sql: `ALTER TABLE "AddOnItem" ADD COLUMN IF NOT EXISTS "requiresInventory" BOOLEAN NOT NULL DEFAULT false` },
      { name: "taxable", sql: `ALTER TABLE "AddOnItem" ADD COLUMN IF NOT EXISTS "taxable" BOOLEAN NOT NULL DEFAULT true` },
    ];

    for (const col of addOnCols) {
      await client.query(col.sql);
      console.log(`  ✓ AddOnItem.${col.name}`);
    }

    // ─── Add guestId FK to Reservation if missing ────────────────────
    const resGuestCol = await client.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'Reservation' AND column_name = 'guestId'
    `);
    if (resGuestCol.rowCount === 0) {
      await client.query(`ALTER TABLE "Reservation" ADD COLUMN "guestId" TEXT`);
    }
    // Add FK constraint if not exists
    const fkCheck = await client.query(`
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'Reservation_guestId_fkey' AND table_name = 'Reservation'
    `);
    if (fkCheck.rowCount === 0) {
      try {
        await client.query(`
          ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_guestId_fkey"
          FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL
        `);
        console.log("  ✓ Reservation.guestId FK");
      } catch {
        console.log("  ⚠ Reservation.guestId FK already exists or skipped");
      }
    }

    // ─── BookingQuoteAddon ───────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "BookingQuoteAddon" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "quoteId" TEXT NOT NULL,
        "addOnItemId" TEXT NOT NULL,
        "quantity" INT NOT NULL DEFAULT 1,
        "priceSnapshot" DOUBLE PRECISION NOT NULL,
        "totalPrice" DOUBLE PRECISION NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "BookingQuoteAddon_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "BookingQuoteAddon_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "BookingQuote"("id") ON DELETE CASCADE,
        CONSTRAINT "BookingQuoteAddon_addOnItemId_fkey" FOREIGN KEY ("addOnItemId") REFERENCES "AddOnItem"("id") ON DELETE CASCADE
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "BookingQuoteAddon_quoteId_idx" ON "BookingQuoteAddon"("quoteId")`);
    await client.query(`CREATE INDEX IF NOT EXISTS "BookingQuoteAddon_addOnItemId_idx" ON "BookingQuoteAddon"("addOnItemId")`);
    console.log("✓ BookingQuoteAddon table");

    // ─── DynamicPricingSettings ──────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "DynamicPricingSettings" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "listingId" TEXT NOT NULL,
        "enabled" BOOLEAN NOT NULL DEFAULT false,
        "pricingMode" TEXT NOT NULL DEFAULT 'balanced',
        "minimumRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "maximumRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "weekendPremiumPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "eventPremiumPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "gapNightDiscountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "lastMinuteDiscountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "farOutPremiumPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "occupancyBasedEnabled" BOOLEAN NOT NULL DEFAULT false,
        "bookingPaceEnabled" BOOLEAN NOT NULL DEFAULT false,
        "marketCompEnabled" BOOLEAN NOT NULL DEFAULT false,
        "manualPriceLockEnabled" BOOLEAN NOT NULL DEFAULT false,
        "pricingProvider" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DynamicPricingSettings_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "DynamicPricingSettings_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE
      )
    `);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "DynamicPricingSettings_listingId_key" ON "DynamicPricingSettings"("listingId")`);
    console.log("✓ DynamicPricingSettings table");

    // ─── BookingAgreementSnapshot ────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "BookingAgreementSnapshot" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "reservationId" TEXT NOT NULL,
        "guestId" TEXT,
        "nightlyRateSnapshot" JSONB NOT NULL,
        "cleaningFeeSnapshot" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "taxesSnapshot" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "serviceFeeSnapshot" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "depositHoldSnapshot" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "addOnsSnapshot" JSONB,
        "discountsSnapshot" JSONB,
        "totalPriceSnapshot" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "termsAccepted" BOOLEAN NOT NULL DEFAULT true,
        "cancellationPolicy" TEXT NOT NULL DEFAULT 'flexible',
        "paymentStatus" TEXT NOT NULL DEFAULT 'none',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "BookingAgreementSnapshot_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "BookingAgreementSnapshot_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE
      )
    `);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "BookingAgreementSnapshot_reservationId_key" ON "BookingAgreementSnapshot"("reservationId")`);
    console.log("✓ BookingAgreementSnapshot table");

    // ─── ReservationChangeOrder ──────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ReservationChangeOrder" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "reservationId" TEXT NOT NULL,
        "guestId" TEXT,
        "changeType" TEXT NOT NULL,
        "description" TEXT,
        "originalValue" TEXT,
        "newValue" TEXT,
        "originalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "newPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "priceDifference" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "adminApprovalRequired" BOOLEAN NOT NULL DEFAULT false,
        "guestApprovalRequired" BOOLEAN NOT NULL DEFAULT false,
        "approvalStatus" TEXT NOT NULL DEFAULT 'pending',
        "paymentStatus" TEXT NOT NULL DEFAULT 'none',
        "invoiceUrl" TEXT,
        "notes" TEXT,
        "processedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ReservationChangeOrder_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ReservationChangeOrder_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "ReservationChangeOrder_reservationId_idx" ON "ReservationChangeOrder"("reservationId")`);
    console.log("✓ ReservationChangeOrder table");

    // ─── PromoCode ───────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "PromoCode" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "code" TEXT NOT NULL,
        "discountType" TEXT NOT NULL DEFAULT 'percentage',
        "discountValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "listingId" TEXT,
        "startDate" TIMESTAMP(3),
        "endDate" TIMESTAMP(3),
        "minimumNights" INT NOT NULL DEFAULT 1,
        "maxUses" INT NOT NULL DEFAULT 0,
        "currentUses" INT NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "PromoCode_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL
      )
    `);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS "PromoCode_code_key" ON "PromoCode"("code")`);
    console.log("✓ PromoCode table");

    // ─── AbandonedCheckout ───────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "AbandonedCheckout" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "quoteId" TEXT,
        "guestEmail" TEXT,
        "guestPhone" TEXT,
        "listingId" TEXT,
        "checkIn" TIMESTAMP(3),
        "checkOut" TIMESTAMP(3),
        "totalQuote" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "abandonedStep" TEXT,
        "abandonedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "followUpStatus" TEXT NOT NULL DEFAULT 'none',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AbandonedCheckout_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "AbandonedCheckout_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "AbandonedCheckout_listingId_idx" ON "AbandonedCheckout"("listingId")`);
    console.log("✓ AbandonedCheckout table");

    // ─── SalesActivityLog ────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "SalesActivityLog" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "listingId" TEXT,
        "activityType" TEXT NOT NULL,
        "description" TEXT,
        "oldValue" TEXT,
        "newValue" TEXT,
        "changedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SalesActivityLog_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "SalesActivityLog_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "SalesActivityLog_listingId_idx" ON "SalesActivityLog"("listingId")`);
    console.log("✓ SalesActivityLog table");

    await client.query("COMMIT");
    console.log("\n✅ Sales Manager migration complete!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
