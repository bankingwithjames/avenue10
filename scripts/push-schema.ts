import pg from "pg";
import dns from "dns";
import "dotenv/config";

dns.setDefaultResultOrder("ipv4first");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

const migrations = [
  // Add accessCode to Reservation
  `ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "accessCode" TEXT`,

  // ReservationAgreement
  `CREATE TABLE IF NOT EXISTS "ReservationAgreement" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "signedName" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "documentHash" TEXT NOT NULL,
    CONSTRAINT "ReservationAgreement_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ReservationAgreement_reservationId_key" ON "ReservationAgreement"("reservationId")`,
  `DO $$ BEGIN
    ALTER TABLE "ReservationAgreement" ADD CONSTRAINT "ReservationAgreement_reservationId_fkey"
      FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  // InventoryItem
  `CREATE TABLE IF NOT EXISTS "InventoryItem" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "InventoryItem_listingId_idx" ON "InventoryItem"("listingId")`,

  // CheckinInstruction
  `CREATE TABLE IF NOT EXISTS "CheckinInstruction" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CheckinInstruction_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "CheckinInstruction_listingId_idx" ON "CheckinInstruction"("listingId")`,

  // LocalRecommendation
  `CREATE TABLE IF NOT EXISTS "LocalRecommendation" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT,
    "link" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "LocalRecommendation_pkey" PRIMARY KEY ("id")
  )`,

  // GuestRequest
  `CREATE TABLE IF NOT EXISTS "GuestRequest" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminReply" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GuestRequest_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "GuestRequest_reservationId_idx" ON "GuestRequest"("reservationId")`,
  `DO $$ BEGIN
    ALTER TABLE "GuestRequest" ADD CONSTRAINT "GuestRequest_reservationId_fkey"
      FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
];

async function main() {
  const client = await pool.connect();
  try {
    for (const sql of migrations) {
      console.log("Running:", sql.substring(0, 60) + "...");
      await client.query(sql);
    }
    console.log("\nAll migrations applied successfully!");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
