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

    // 1. Add new columns to MaintenanceLog
    console.log("\nAdding new columns to MaintenanceLog...");
    const mlCols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'MaintenanceLog' ORDER BY ordinal_position
    `);
    const existingCols = new Set(mlCols.rows.map((r: { column_name: string }) => r.column_name));
    console.log("Current MaintenanceLog columns:", [...existingCols].join(", "));

    const newColumns: [string, string][] = [
      ["listingId", "TEXT"],
      ["roomId", "TEXT"],
      ["inventoryItemId", "TEXT"],
      ["guestRequestId", "TEXT"],
      ["issueTitle", "TEXT"],
      ["category", "TEXT"],
      ["priority", "TEXT DEFAULT 'medium'"],
      ["reportedBy", "TEXT"],
      ["scheduledDate", "TIMESTAMPTZ"],
      ["startTime", "TIMESTAMPTZ"],
      ["endTime", "TIMESTAMPTZ"],
      ["dueDate", "TIMESTAMPTZ"],
      ["completedDate", "TIMESTAMPTZ"],
      ["estimatedCost", "DOUBLE PRECISION DEFAULT 0"],
      ["actualCost", "DOUBLE PRECISION DEFAULT 0"],
      ["laborCost", "DOUBLE PRECISION DEFAULT 0"],
      ["materialsCost", "DOUBLE PRECISION DEFAULT 0"],
      ["beforePhotoUrl", "TEXT"],
      ["afterPhotoUrl", "TEXT"],
      ["createdBy", "TEXT"],
      ["updatedAt", "TIMESTAMPTZ DEFAULT now()"],
    ];

    for (const [col, type] of newColumns) {
      if (!existingCols.has(col)) {
        console.log(`  Adding ${col}...`);
        await client.query(`ALTER TABLE "MaintenanceLog" ADD COLUMN "${col}" ${type}`);
        console.log(`    Added!`);
      } else {
        console.log(`  ${col} already exists`);
      }
    }

    // Add indexes
    try {
      await client.query(`CREATE INDEX "MaintenanceLog_vendorId_idx" ON "MaintenanceLog"("vendorId")`);
      console.log("  Added MaintenanceLog.vendorId index");
    } catch { console.log("  MaintenanceLog.vendorId index already exists"); }

    try {
      await client.query(`CREATE INDEX "MaintenanceLog_status_idx" ON "MaintenanceLog"("status")`);
      console.log("  Added MaintenanceLog.status index");
    } catch { console.log("  MaintenanceLog.status index already exists"); }

    // 2. MaintenanceCalendarEvent
    if (!existing.has("MaintenanceCalendarEvent")) {
      console.log("\nCreating MaintenanceCalendarEvent...");
      await client.query(`
        CREATE TABLE "MaintenanceCalendarEvent" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "maintenanceLogId" TEXT NOT NULL,
          "propertyId" TEXT NOT NULL,
          "listingId" TEXT,
          "title" TEXT NOT NULL,
          "startDatetime" TIMESTAMPTZ NOT NULL,
          "endDatetime" TIMESTAMPTZ,
          "calendarViewStatus" TEXT NOT NULL DEFAULT 'scheduled',
          "colorStatus" TEXT,
          "isRecurring" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "MaintenanceCalendarEvent_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "MaintenanceCalendarEvent_maintenanceLogId_fkey" FOREIGN KEY ("maintenanceLogId") REFERENCES "MaintenanceLog"("id") ON DELETE CASCADE
        )
      `);
      await client.query(`CREATE INDEX "MaintenanceCalendarEvent_propertyId_idx" ON "MaintenanceCalendarEvent"("propertyId")`);
      await client.query(`CREATE INDEX "MaintenanceCalendarEvent_maintenanceLogId_idx" ON "MaintenanceCalendarEvent"("maintenanceLogId")`);
      console.log("  Created!");
    } else {
      console.log("MaintenanceCalendarEvent already exists");
    }

    // 3. RecurringMaintenanceTask
    if (!existing.has("RecurringMaintenanceTask")) {
      console.log("\nCreating RecurringMaintenanceTask...");
      await client.query(`
        CREATE TABLE "RecurringMaintenanceTask" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "propertyId" TEXT NOT NULL,
          "listingId" TEXT,
          "roomId" TEXT,
          "taskName" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "frequency" TEXT NOT NULL DEFAULT 'monthly',
          "nextDueDate" TIMESTAMPTZ,
          "lastCompletedDate" TIMESTAMPTZ,
          "vendorId" TEXT,
          "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "reminderDaysBefore" INTEGER NOT NULL DEFAULT 7,
          "autoCreateEvent" BOOLEAN NOT NULL DEFAULT true,
          "status" TEXT NOT NULL DEFAULT 'active',
          "notes" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "RecurringMaintenanceTask_pkey" PRIMARY KEY ("id")
        )
      `);
      await client.query(`CREATE INDEX "RecurringMaintenanceTask_propertyId_idx" ON "RecurringMaintenanceTask"("propertyId")`);
      console.log("  Created!");
    } else {
      console.log("RecurringMaintenanceTask already exists");
    }

    // 4. MaintenanceFile
    if (!existing.has("MaintenanceFile")) {
      console.log("\nCreating MaintenanceFile...");
      await client.query(`
        CREATE TABLE "MaintenanceFile" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "maintenanceLogId" TEXT NOT NULL,
          "fileUrl" TEXT NOT NULL,
          "fileType" TEXT,
          "fileName" TEXT,
          "fileCategory" TEXT NOT NULL DEFAULT 'photo',
          "uploadedBy" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "MaintenanceFile_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "MaintenanceFile_maintenanceLogId_fkey" FOREIGN KEY ("maintenanceLogId") REFERENCES "MaintenanceLog"("id") ON DELETE CASCADE
        )
      `);
      await client.query(`CREATE INDEX "MaintenanceFile_maintenanceLogId_idx" ON "MaintenanceFile"("maintenanceLogId")`);
      console.log("  Created!");
    } else {
      console.log("MaintenanceFile already exists");
    }

    // 5. MaintenanceActivityLog
    if (!existing.has("MaintenanceActivityLog")) {
      console.log("\nCreating MaintenanceActivityLog...");
      await client.query(`
        CREATE TABLE "MaintenanceActivityLog" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "maintenanceLogId" TEXT NOT NULL,
          "activityType" TEXT NOT NULL,
          "oldValue" TEXT,
          "newValue" TEXT,
          "note" TEXT,
          "createdBy" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "MaintenanceActivityLog_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "MaintenanceActivityLog_maintenanceLogId_fkey" FOREIGN KEY ("maintenanceLogId") REFERENCES "MaintenanceLog"("id") ON DELETE CASCADE
        )
      `);
      await client.query(`CREATE INDEX "MaintenanceActivityLog_maintenanceLogId_idx" ON "MaintenanceActivityLog"("maintenanceLogId")`);
      console.log("  Created!");
    } else {
      console.log("MaintenanceActivityLog already exists");
    }

    // Verification
    console.log("\n=== FINAL VERIFICATION ===");
    const finalTables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('MaintenanceCalendarEvent','RecurringMaintenanceTask','MaintenanceFile','MaintenanceActivityLog')
      ORDER BY table_name
    `);
    console.log("Maintenance tables present:", finalTables.rows.map((r: { table_name: string }) => r.table_name));

    const finalCols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'MaintenanceLog' ORDER BY ordinal_position
    `);
    console.log("MaintenanceLog columns:", finalCols.rows.map((r: { column_name: string }) => r.column_name));

    console.log(`\nAll maintenance migrations applied successfully!`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
