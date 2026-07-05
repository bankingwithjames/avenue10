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

    // --- Reservation: add new columns ---
    await client.query(`
      ALTER TABLE "Reservation"
        ADD COLUMN IF NOT EXISTS "channel" TEXT,
        ADD COLUMN IF NOT EXISTS "portalToken" TEXT,
        ADD COLUMN IF NOT EXISTS "portalExpires" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "portalRevoked" BOOLEAN NOT NULL DEFAULT false
    `);
    // Add unique index on portalToken if not exists
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Reservation_portalToken_key" ON "Reservation"("portalToken")
    `);

    // --- ReservationAgreement ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ReservationAgreement" (
        "id" TEXT NOT NULL,
        "reservationId" TEXT NOT NULL,
        "signedName" TEXT NOT NULL,
        "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "documentHash" TEXT NOT NULL,
        CONSTRAINT "ReservationAgreement_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ReservationAgreement_reservationId_key" UNIQUE ("reservationId"),
        CONSTRAINT "ReservationAgreement_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE
      )
    `);

    // --- InventoryItem ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS "InventoryItem" (
        "id" TEXT NOT NULL,
        "listingId" TEXT NOT NULL,
        "room" TEXT NOT NULL,
        "itemName" TEXT NOT NULL,
        "category" TEXT NOT NULL DEFAULT 'General',
        "quantity" INT NOT NULL DEFAULT 1,
        "quantityExpected" INT NOT NULL DEFAULT 1,
        "condition" TEXT NOT NULL DEFAULT 'good',
        "replacementCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "guestVisible" BOOLEAN NOT NULL DEFAULT true,
        "lastChecked" TIMESTAMP(3),
        "photoUrl" TEXT,
        "notes" TEXT,
        "sortOrder" INT NOT NULL DEFAULT 0,
        CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "InventoryItem_listingId_idx" ON "InventoryItem"("listingId")`);
    // Add new columns if table already existed with old schema
    await client.query(`
      ALTER TABLE "InventoryItem"
        ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'General',
        ADD COLUMN IF NOT EXISTS "quantityExpected" INT NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS "condition" TEXT NOT NULL DEFAULT 'good',
        ADD COLUMN IF NOT EXISTS "replacementCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "guestVisible" BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "lastChecked" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "photoUrl" TEXT,
        ADD COLUMN IF NOT EXISTS "notes" TEXT
    `);

    // --- CheckinInstruction ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS "CheckinInstruction" (
        "id" TEXT NOT NULL,
        "listingId" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "sensitive" BOOLEAN NOT NULL DEFAULT false,
        "visibleBeforeHours" INT NOT NULL DEFAULT 0,
        "adminNotes" TEXT,
        "sortOrder" INT NOT NULL DEFAULT 0,
        CONSTRAINT "CheckinInstruction_pkey" PRIMARY KEY ("id")
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "CheckinInstruction_listingId_idx" ON "CheckinInstruction"("listingId")`);
    await client.query(`
      ALTER TABLE "CheckinInstruction"
        ADD COLUMN IF NOT EXISTS "sensitive" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "visibleBeforeHours" INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "adminNotes" TEXT
    `);

    // --- LocalRecommendation ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS "LocalRecommendation" (
        "id" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "address" TEXT,
        "link" TEXT,
        "phone" TEXT,
        "imageUrl" TEXT,
        "distance" TEXT,
        "priceRange" TEXT,
        "bestFor" TEXT,
        "mapLink" TEXT,
        "guestVisible" BOOLEAN NOT NULL DEFAULT true,
        "featured" BOOLEAN NOT NULL DEFAULT false,
        "sortOrder" INT NOT NULL DEFAULT 0,
        CONSTRAINT "LocalRecommendation_pkey" PRIMARY KEY ("id")
      )
    `);
    await client.query(`
      ALTER TABLE "LocalRecommendation"
        ADD COLUMN IF NOT EXISTS "phone" TEXT,
        ADD COLUMN IF NOT EXISTS "distance" TEXT,
        ADD COLUMN IF NOT EXISTS "priceRange" TEXT,
        ADD COLUMN IF NOT EXISTS "bestFor" TEXT,
        ADD COLUMN IF NOT EXISTS "mapLink" TEXT,
        ADD COLUMN IF NOT EXISTS "guestVisible" BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false
    `);

    // --- GuestRequest ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS "GuestRequest" (
        "id" TEXT NOT NULL,
        "reservationId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "category" TEXT NOT NULL DEFAULT 'general',
        "priority" TEXT NOT NULL DEFAULT 'normal',
        "status" TEXT NOT NULL DEFAULT 'new',
        "assignedStaff" TEXT,
        "internalNotes" TEXT,
        "adminReply" TEXT,
        "photos" TEXT[] DEFAULT '{}',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "GuestRequest_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "GuestRequest_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "GuestRequest_reservationId_idx" ON "GuestRequest"("reservationId")`);
    await client.query(`
      ALTER TABLE "GuestRequest"
        ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'general',
        ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'normal',
        ADD COLUMN IF NOT EXISTS "assignedStaff" TEXT,
        ADD COLUMN IF NOT EXISTS "internalNotes" TEXT,
        ADD COLUMN IF NOT EXISTS "photos" TEXT[] DEFAULT '{}'
    `);

    // --- GuestReview ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS "GuestReview" (
        "id" TEXT NOT NULL,
        "reservationId" TEXT NOT NULL,
        "overallRating" INT NOT NULL DEFAULT 5,
        "cleanlinessRating" INT,
        "accuracyRating" INT,
        "communicationRating" INT,
        "locationRating" INT,
        "valueRating" INT,
        "comments" TEXT,
        "adminResponse" TEXT,
        "publishToWebsite" BOOLEAN NOT NULL DEFAULT false,
        "featured" BOOLEAN NOT NULL DEFAULT false,
        "source" TEXT NOT NULL DEFAULT 'direct',
        "approvalStatus" TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "GuestReview_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "GuestReview_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "GuestReview_reservationId_idx" ON "GuestReview"("reservationId")`);

    // --- GuestInventoryReport ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS "GuestInventoryReport" (
        "id" TEXT NOT NULL,
        "itemId" TEXT NOT NULL,
        "reportType" TEXT NOT NULL,
        "description" TEXT,
        "photos" TEXT[] DEFAULT '{}',
        "status" TEXT NOT NULL DEFAULT 'new',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "GuestInventoryReport_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "GuestInventoryReport_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "GuestInventoryReport_itemId_idx" ON "GuestInventoryReport"("itemId")`);

    // --- GuestPortalLog ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS "GuestPortalLog" (
        "id" TEXT NOT NULL,
        "reservationId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "details" TEXT,
        "ipAddress" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "GuestPortalLog_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "GuestPortalLog_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "GuestPortalLog_reservationId_idx" ON "GuestPortalLog"("reservationId")`);

    await client.query("COMMIT");
    console.log("Check-in portal migration completed successfully!");
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
