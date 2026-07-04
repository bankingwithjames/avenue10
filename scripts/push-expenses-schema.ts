import pg from "pg";
import dns from "dns";
import "dotenv/config";

dns.setDefaultResultOrder("ipv4first");

const raw = process.env.DATABASE_URL!;
const connStr = raw.includes("sslmode=") ? raw : raw + (raw.includes("?") ? "&sslmode=disable" : "?sslmode=disable");
const pool = new pg.Pool({
  connectionString: connStr,
});

const migrations = [
  // ─── Vendor ───────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "Vendor" (
    "id" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "vendorType" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
  )`,

  // ─── ExpenseCategory ──────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
  )`,

  // ─── Expense ──────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "Expense" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "bookingId" TEXT,
    "categoryId" TEXT NOT NULL,
    "subcategory" TEXT,
    "vendorId" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "amount" FLOAT8 NOT NULL,
    "paymentMethod" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "frequency" TEXT NOT NULL DEFAULT 'one-time',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "Expense_propertyId_idx" ON "Expense"("propertyId")`,
  `CREATE INDEX IF NOT EXISTS "Expense_categoryId_idx" ON "Expense"("categoryId")`,
  `DO $$ BEGIN
    ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    ALTER TABLE "Expense" ADD CONSTRAINT "Expense_vendorId_fkey"
      FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  // ─── RecurringExpense ─────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "RecurringExpense" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "vendorId" TEXT,
    "name" TEXT NOT NULL,
    "amount" FLOAT8 NOT NULL,
    "frequency" TEXT NOT NULL,
    "dueDay" INTEGER,
    "nextDueDate" TIMESTAMP(3),
    "autoPay" BOOLEAN NOT NULL DEFAULT false,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "RecurringExpense_propertyId_idx" ON "RecurringExpense"("propertyId")`,
  `DO $$ BEGIN
    ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_vendorId_fkey"
      FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  // ─── BookingExpense ───────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "BookingExpense" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "expenseId" TEXT,
    "expenseType" TEXT NOT NULL,
    "amount" FLOAT8 NOT NULL,
    "allocationMethod" TEXT NOT NULL DEFAULT 'direct',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookingExpense_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "BookingExpense_bookingId_idx" ON "BookingExpense"("bookingId")`,

  // ─── PropertyBill ─────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "PropertyBill" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "billType" TEXT NOT NULL,
    "provider" TEXT,
    "billingPeriodStart" TIMESTAMP(3),
    "billingPeriodEnd" TIMESTAMP(3),
    "amountDue" FLOAT8 NOT NULL,
    "amountPaid" FLOAT8 NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PropertyBill_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "PropertyBill_propertyId_idx" ON "PropertyBill"("propertyId")`,

  // ─── UtilityReading ───────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "UtilityReading" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "utilityType" TEXT NOT NULL,
    "readingDate" TIMESTAMP(3) NOT NULL,
    "meterReading" FLOAT8,
    "usageAmount" FLOAT8,
    "billAmount" FLOAT8,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UtilityReading_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "UtilityReading_propertyId_idx" ON "UtilityReading"("propertyId")`,

  // ─── PropertyInventory ────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "PropertyInventory" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "itemName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sku" TEXT,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "reorderThreshold" INTEGER NOT NULL DEFAULT 0,
    "unitCost" FLOAT8 NOT NULL DEFAULT 0,
    "avgUnitCost" FLOAT8 NOT NULL DEFAULT 0,
    "replacementCost" FLOAT8 NOT NULL DEFAULT 0,
    "remainingValue" FLOAT8 NOT NULL DEFAULT 0,
    "vendorId" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "expectedLifeMonths" INTEGER,
    "conditionStatus" TEXT NOT NULL DEFAULT 'good',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PropertyInventory_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "PropertyInventory_propertyId_idx" ON "PropertyInventory"("propertyId")`,
  `DO $$ BEGIN
    ALTER TABLE "PropertyInventory" ADD CONSTRAINT "PropertyInventory_vendorId_fkey"
      FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  // ─── InventoryPurchase ────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "InventoryPurchase" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "itemId" TEXT NOT NULL,
    "vendorId" TEXT,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "quantityPurchased" INTEGER NOT NULL,
    "unitCost" FLOAT8 NOT NULL,
    "totalCost" FLOAT8 NOT NULL,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryPurchase_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "InventoryPurchase_propertyId_idx" ON "InventoryPurchase"("propertyId")`,
  `CREATE INDEX IF NOT EXISTS "InventoryPurchase_itemId_idx" ON "InventoryPurchase"("itemId")`,
  `DO $$ BEGIN
    ALTER TABLE "InventoryPurchase" ADD CONSTRAINT "InventoryPurchase_itemId_fkey"
      FOREIGN KEY ("itemId") REFERENCES "PropertyInventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
    ALTER TABLE "InventoryPurchase" ADD CONSTRAINT "InventoryPurchase_vendorId_fkey"
      FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  // ─── InventoryUsage ───────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "InventoryUsage" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "bookingId" TEXT,
    "itemId" TEXT NOT NULL,
    "usageDate" TIMESTAMP(3) NOT NULL,
    "quantityUsed" INTEGER NOT NULL,
    "unitCostAtUsage" FLOAT8 NOT NULL DEFAULT 0,
    "totalUsageCost" FLOAT8 NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL DEFAULT 'guest_stay',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryUsage_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "InventoryUsage_propertyId_idx" ON "InventoryUsage"("propertyId")`,
  `CREATE INDEX IF NOT EXISTS "InventoryUsage_itemId_idx" ON "InventoryUsage"("itemId")`,
  `DO $$ BEGIN
    ALTER TABLE "InventoryUsage" ADD CONSTRAINT "InventoryUsage_itemId_fkey"
      FOREIGN KEY ("itemId") REFERENCES "PropertyInventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  // ─── InventoryReplacement ─────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "InventoryReplacement" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "itemId" TEXT NOT NULL,
    "replacementDate" TIMESTAMP(3),
    "quantityReplaced" INTEGER NOT NULL DEFAULT 0,
    "replacementCostPerItem" FLOAT8 NOT NULL DEFAULT 0,
    "totalReplacementCost" FLOAT8 NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL DEFAULT 'worn',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'needed',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryReplacement_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "InventoryReplacement_propertyId_idx" ON "InventoryReplacement"("propertyId")`,
  `DO $$ BEGIN
    ALTER TABLE "InventoryReplacement" ADD CONSTRAINT "InventoryReplacement_itemId_fkey"
      FOREIGN KEY ("itemId") REFERENCES "PropertyInventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  // ─── MaintenanceLog ───────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "MaintenanceLog" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "bookingId" TEXT,
    "vendorId" TEXT,
    "maintenanceDate" TIMESTAMP(3) NOT NULL,
    "issueType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" FLOAT8 NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaintenanceLog_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "MaintenanceLog_propertyId_idx" ON "MaintenanceLog"("propertyId")`,
  `DO $$ BEGIN
    ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_vendorId_fkey"
      FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  // ─── MonthlyPnlReport ────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "MonthlyPnlReport" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "grossRevenue" FLOAT8 NOT NULL DEFAULT 0,
    "platformFees" FLOAT8 NOT NULL DEFAULT 0,
    "paymentProcessingFees" FLOAT8 NOT NULL DEFAULT 0,
    "netRevenue" FLOAT8 NOT NULL DEFAULT 0,
    "fixedExpenses" FLOAT8 NOT NULL DEFAULT 0,
    "variableExpenses" FLOAT8 NOT NULL DEFAULT 0,
    "inventoryPurchased" FLOAT8 NOT NULL DEFAULT 0,
    "inventoryUsed" FLOAT8 NOT NULL DEFAULT 0,
    "replacementReserveNeeded" FLOAT8 NOT NULL DEFAULT 0,
    "totalExpenses" FLOAT8 NOT NULL DEFAULT 0,
    "netOperatingIncome" FLOAT8 NOT NULL DEFAULT 0,
    "netProfit" FLOAT8 NOT NULL DEFAULT 0,
    "profitMargin" FLOAT8 NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MonthlyPnlReport_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "MonthlyPnlReport_propertyId_month_year_key" ON "MonthlyPnlReport"("propertyId", "month", "year")`,

  // ─── WeeklyExpenseSummary ─────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS "WeeklyExpenseSummary" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "grossRevenue" FLOAT8 NOT NULL DEFAULT 0,
    "occupiedNights" INTEGER NOT NULL DEFAULT 0,
    "cleaningExpenses" FLOAT8 NOT NULL DEFAULT 0,
    "laundryExpenses" FLOAT8 NOT NULL DEFAULT 0,
    "suppliesUsed" FLOAT8 NOT NULL DEFAULT 0,
    "utilitiesAllocated" FLOAT8 NOT NULL DEFAULT 0,
    "repairs" FLOAT8 NOT NULL DEFAULT 0,
    "maintenance" FLOAT8 NOT NULL DEFAULT 0,
    "inventoryUsed" FLOAT8 NOT NULL DEFAULT 0,
    "totalExpenses" FLOAT8 NOT NULL DEFAULT 0,
    "netProfit" FLOAT8 NOT NULL DEFAULT 0,
    "profitMargin" FLOAT8 NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeeklyExpenseSummary_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "WeeklyExpenseSummary_propertyId_idx" ON "WeeklyExpenseSummary"("propertyId")`,
];

async function main() {
  const client = await pool.connect();
  try {
    for (const sql of migrations) {
      console.log("Running:", sql.substring(0, 60) + "...");
      await client.query(sql);
    }
    console.log("\nAll expense schema migrations applied successfully!");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
