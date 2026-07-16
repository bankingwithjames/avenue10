import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

// Creates all maintenance tables if they don't exist (idempotent).
export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  const results: string[] = [];
  const run = async (label: string, sql: string) => {
    try {
      await prisma.$executeRawUnsafe(sql);
      results.push(`OK: ${label}`);
    } catch (e: any) {
      results.push(`SKIP/ERR: ${label} — ${e.message?.slice(0, 120)}`);
    }
  };

  await run("Vendor", `
    CREATE TABLE IF NOT EXISTS "Vendor" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "vendorName" TEXT NOT NULL,
      "vendorType" TEXT NOT NULL,
      "contactName" TEXT,
      "phone" TEXT,
      "email" TEXT,
      "website" TEXT,
      "notes" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
    )`);

  await run("MaintenanceLog", `
    CREATE TABLE IF NOT EXISTS "MaintenanceLog" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "propertyId" TEXT NOT NULL,
      "unitId" TEXT,
      "bookingId" TEXT,
      "vendorId" TEXT,
      "maintenanceDate" TIMESTAMPTZ NOT NULL,
      "issueType" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'open',
      "receiptUrl" TEXT,
      "notes" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "listingId" TEXT,
      "roomId" TEXT,
      "inventoryItemId" TEXT,
      "guestRequestId" TEXT,
      "issueTitle" TEXT,
      "category" TEXT,
      "priority" TEXT NOT NULL DEFAULT 'medium',
      "reportedBy" TEXT,
      "scheduledDate" TIMESTAMPTZ,
      "startTime" TIMESTAMPTZ,
      "endTime" TIMESTAMPTZ,
      "dueDate" TIMESTAMPTZ,
      "completedDate" TIMESTAMPTZ,
      "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "actualCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "laborCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "materialsCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "beforePhotoUrl" TEXT,
      "afterPhotoUrl" TEXT,
      "createdBy" TEXT,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "MaintenanceLog_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "MaintenanceLog_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL
    )`);
  await run("MaintenanceLog_propertyId_idx", `CREATE INDEX IF NOT EXISTS "MaintenanceLog_propertyId_idx" ON "MaintenanceLog"("propertyId")`);
  await run("MaintenanceLog_vendorId_idx", `CREATE INDEX IF NOT EXISTS "MaintenanceLog_vendorId_idx" ON "MaintenanceLog"("vendorId")`);
  await run("MaintenanceLog_status_idx", `CREATE INDEX IF NOT EXISTS "MaintenanceLog_status_idx" ON "MaintenanceLog"("status")`);

  // In case the table pre-existed without the newer columns, add them.
  const addCols: [string, string][] = [
    ["listingId", "TEXT"], ["roomId", "TEXT"], ["inventoryItemId", "TEXT"],
    ["guestRequestId", "TEXT"], ["issueTitle", "TEXT"], ["category", "TEXT"],
    ["priority", "TEXT DEFAULT 'medium'"], ["reportedBy", "TEXT"],
    ["scheduledDate", "TIMESTAMPTZ"], ["startTime", "TIMESTAMPTZ"],
    ["endTime", "TIMESTAMPTZ"], ["dueDate", "TIMESTAMPTZ"],
    ["completedDate", "TIMESTAMPTZ"], ["estimatedCost", "DOUBLE PRECISION DEFAULT 0"],
    ["actualCost", "DOUBLE PRECISION DEFAULT 0"], ["laborCost", "DOUBLE PRECISION DEFAULT 0"],
    ["materialsCost", "DOUBLE PRECISION DEFAULT 0"], ["beforePhotoUrl", "TEXT"],
    ["afterPhotoUrl", "TEXT"], ["createdBy", "TEXT"],
    ["updatedAt", "TIMESTAMPTZ DEFAULT now()"],
  ];
  for (const [col, type] of addCols) {
    await run(`MaintenanceLog.${col}`, `ALTER TABLE "MaintenanceLog" ADD COLUMN IF NOT EXISTS "${col}" ${type}`);
  }

  await run("MaintenanceCalendarEvent", `
    CREATE TABLE IF NOT EXISTS "MaintenanceCalendarEvent" (
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
    )`);
  await run("MaintenanceCalendarEvent_propertyId_idx", `CREATE INDEX IF NOT EXISTS "MaintenanceCalendarEvent_propertyId_idx" ON "MaintenanceCalendarEvent"("propertyId")`);
  await run("MaintenanceCalendarEvent_maintenanceLogId_idx", `CREATE INDEX IF NOT EXISTS "MaintenanceCalendarEvent_maintenanceLogId_idx" ON "MaintenanceCalendarEvent"("maintenanceLogId")`);

  await run("RecurringMaintenanceTask", `
    CREATE TABLE IF NOT EXISTS "RecurringMaintenanceTask" (
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
    )`);
  await run("RecurringMaintenanceTask_propertyId_idx", `CREATE INDEX IF NOT EXISTS "RecurringMaintenanceTask_propertyId_idx" ON "RecurringMaintenanceTask"("propertyId")`);

  await run("MaintenanceFile", `
    CREATE TABLE IF NOT EXISTS "MaintenanceFile" (
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
    )`);
  await run("MaintenanceFile_maintenanceLogId_idx", `CREATE INDEX IF NOT EXISTS "MaintenanceFile_maintenanceLogId_idx" ON "MaintenanceFile"("maintenanceLogId")`);

  await run("MaintenanceActivityLog", `
    CREATE TABLE IF NOT EXISTS "MaintenanceActivityLog" (
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
    )`);
  await run("MaintenanceActivityLog_maintenanceLogId_idx", `CREATE INDEX IF NOT EXISTS "MaintenanceActivityLog_maintenanceLogId_idx" ON "MaintenanceActivityLog"("maintenanceLogId")`);

  // Verify
  const tables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('Vendor','MaintenanceLog','MaintenanceCalendarEvent','RecurringMaintenanceTask','MaintenanceFile','MaintenanceActivityLog')
    ORDER BY table_name
  `);

  return NextResponse.json({
    success: true,
    tablesPresent: tables.map((t) => t.table_name),
    results,
  });
}
