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

    // 1. InventoryRoom
    if (!existing.has("InventoryRoom")) {
      console.log("\nCreating InventoryRoom...");
      await client.query(`
        CREATE TABLE "InventoryRoom" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "propertyId" TEXT NOT NULL,
          "listingId" TEXT,
          "roomName" TEXT NOT NULL,
          "roomType" TEXT NOT NULL DEFAULT 'other',
          "displayOrder" INTEGER NOT NULL DEFAULT 0,
          "notes" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "InventoryRoom_pkey" PRIMARY KEY ("id")
        )
      `);
      await client.query(`CREATE INDEX "InventoryRoom_propertyId_idx" ON "InventoryRoom"("propertyId")`);
      console.log("  Created!");
    } else {
      console.log("InventoryRoom already exists");
    }

    // 2. InventoryIssue
    if (!existing.has("InventoryIssue")) {
      console.log("\nCreating InventoryIssue...");
      await client.query(`
        CREATE TABLE "InventoryIssue" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "propertyId" TEXT NOT NULL,
          "listingId" TEXT,
          "roomId" TEXT,
          "itemId" TEXT,
          "bookingId" TEXT,
          "issueType" TEXT NOT NULL,
          "issueDescription" TEXT NOT NULL,
          "priority" TEXT NOT NULL DEFAULT 'medium',
          "status" TEXT NOT NULL DEFAULT 'open',
          "reportedBy" TEXT,
          "photoUrl" TEXT,
          "replacementCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "resolvedAt" TIMESTAMPTZ,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "InventoryIssue_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "InventoryIssue_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PropertyInventory"("id") ON DELETE SET NULL
        )
      `);
      await client.query(`CREATE INDEX "InventoryIssue_propertyId_idx" ON "InventoryIssue"("propertyId")`);
      await client.query(`CREATE INDEX "InventoryIssue_itemId_idx" ON "InventoryIssue"("itemId")`);
      console.log("  Created!");
    } else {
      console.log("InventoryIssue already exists");
    }

    // 3. CleanerInventoryCheck
    if (!existing.has("CleanerInventoryCheck")) {
      console.log("\nCreating CleanerInventoryCheck...");
      await client.query(`
        CREATE TABLE "CleanerInventoryCheck" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "propertyId" TEXT NOT NULL,
          "listingId" TEXT,
          "bookingId" TEXT,
          "roomId" TEXT,
          "itemId" TEXT,
          "expectedQuantity" INTEGER NOT NULL DEFAULT 1,
          "actualQuantity" INTEGER NOT NULL DEFAULT 1,
          "conditionStatus" TEXT NOT NULL DEFAULT 'good',
          "status" TEXT NOT NULL DEFAULT 'pending',
          "cleanerNotes" TEXT,
          "photoUrl" TEXT,
          "checkedBy" TEXT,
          "checkedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "CleanerInventoryCheck_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "CleanerInventoryCheck_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PropertyInventory"("id") ON DELETE SET NULL
        )
      `);
      await client.query(`CREATE INDEX "CleanerInventoryCheck_propertyId_idx" ON "CleanerInventoryCheck"("propertyId")`);
      await client.query(`CREATE INDEX "CleanerInventoryCheck_itemId_idx" ON "CleanerInventoryCheck"("itemId")`);
      console.log("  Created!");
    } else {
      console.log("CleanerInventoryCheck already exists");
    }

    // 4. Add new columns to PropertyInventory
    console.log("\nAdding new columns to PropertyInventory...");
    const piCols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'PropertyInventory' ORDER BY ordinal_position
    `);
    const existingCols = new Set(piCols.rows.map((r: { column_name: string }) => r.column_name));
    console.log("Current PropertyInventory columns:", [...existingCols].join(", "));

    const newColumns: [string, string][] = [
      ["roomId", "TEXT"],
      ["itemType", "TEXT DEFAULT 'reusable'"],
      ["description", "TEXT"],
      ["quantityExpected", "INTEGER DEFAULT 1"],
      ["quantityUsed", "INTEGER DEFAULT 0"],
      ["quantityMissing", "INTEGER DEFAULT 0"],
      ["inventoryStatus", "TEXT DEFAULT 'ok'"],
      ["lastCheckedAt", "TIMESTAMPTZ"],
      ["lastRestockedAt", "TIMESTAMPTZ"],
      ["guestVisible", "BOOLEAN DEFAULT false"],
      ["cleanerCheckRequired", "BOOLEAN DEFAULT false"],
      ["receiptUrl", "TEXT"],
      ["photoUrl", "TEXT"],
      ["archivedAt", "TIMESTAMPTZ"],
    ];

    for (const [col, type] of newColumns) {
      if (!existingCols.has(col)) {
        console.log(`  Adding ${col}...`);
        await client.query(`ALTER TABLE "PropertyInventory" ADD COLUMN "${col}" ${type}`);
        console.log(`    Added!`);
      } else {
        console.log(`  ${col} already exists`);
      }
    }

    // Add FK for roomId -> InventoryRoom
    try {
      await client.query(`
        ALTER TABLE "PropertyInventory" ADD CONSTRAINT "PropertyInventory_roomId_fkey"
        FOREIGN KEY ("roomId") REFERENCES "InventoryRoom"("id") ON DELETE SET NULL
      `);
      console.log("  Added PropertyInventory.roomId FK");
    } catch {
      console.log("  PropertyInventory.roomId FK already exists");
    }

    // Add index on roomId
    try {
      await client.query(`CREATE INDEX "PropertyInventory_roomId_idx" ON "PropertyInventory"("roomId")`);
      console.log("  Added PropertyInventory.roomId index");
    } catch {
      console.log("  PropertyInventory.roomId index already exists");
    }

    // Verification
    console.log("\n=== FINAL VERIFICATION ===");
    const finalTables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('InventoryRoom','InventoryIssue','CleanerInventoryCheck')
      ORDER BY table_name
    `);
    console.log("Inventory tables present:", finalTables.rows.map((r: { table_name: string }) => r.table_name));

    const finalCols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'PropertyInventory' ORDER BY ordinal_position
    `);
    console.log("PropertyInventory columns:", finalCols.rows.map((r: { column_name: string }) => r.column_name));

    console.log(`\nAll inventory migrations applied successfully!`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
