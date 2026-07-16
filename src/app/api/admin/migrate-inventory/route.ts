import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  const results: string[] = [];

  try {
    // ─── Vendor (must come first — PropertyInventory references it) ─
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Vendor" (
        "id" TEXT NOT NULL,
        "vendorName" TEXT NOT NULL,
        "vendorType" TEXT NOT NULL DEFAULT 'supplier',
        "contactName" TEXT,
        "phone" TEXT,
        "email" TEXT,
        "website" TEXT,
        "address" TEXT,
        "notes" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
      )
    `);
    results.push("Vendor table ready");

    // ─── InventoryRoom ─────────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "InventoryRoom" (
        "id" TEXT NOT NULL,
        "propertyId" TEXT NOT NULL,
        "listingId" TEXT,
        "roomName" TEXT NOT NULL,
        "roomType" TEXT NOT NULL DEFAULT 'other',
        "displayOrder" INTEGER NOT NULL DEFAULT 0,
        "notes" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "InventoryRoom_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InventoryRoom_propertyId_idx" ON "InventoryRoom"("propertyId")`);
    results.push("InventoryRoom table ready");

    // ─── PropertyInventory ─────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PropertyInventory" (
        "id" TEXT NOT NULL,
        "propertyId" TEXT NOT NULL,
        "unitId" TEXT,
        "roomId" TEXT,
        "itemName" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "itemType" TEXT NOT NULL DEFAULT 'reusable',
        "description" TEXT,
        "sku" TEXT,
        "quantityExpected" INTEGER NOT NULL DEFAULT 1,
        "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
        "quantityUsed" INTEGER NOT NULL DEFAULT 0,
        "quantityMissing" INTEGER NOT NULL DEFAULT 0,
        "reorderThreshold" INTEGER NOT NULL DEFAULT 0,
        "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "avgUnitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "replacementCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "remainingValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "inventoryStatus" TEXT NOT NULL DEFAULT 'ok',
        "conditionStatus" TEXT NOT NULL DEFAULT 'good',
        "vendorId" TEXT,
        "purchaseDate" TIMESTAMP(3),
        "expectedLifeMonths" INTEGER,
        "lastCheckedAt" TIMESTAMP(3),
        "lastRestockedAt" TIMESTAMP(3),
        "guestVisible" BOOLEAN NOT NULL DEFAULT false,
        "cleanerCheckRequired" BOOLEAN NOT NULL DEFAULT false,
        "receiptUrl" TEXT,
        "photoUrl" TEXT,
        "notes" TEXT,
        "archivedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PropertyInventory_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "PropertyInventory_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "InventoryRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "PropertyInventory_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PropertyInventory_propertyId_idx" ON "PropertyInventory"("propertyId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PropertyInventory_roomId_idx" ON "PropertyInventory"("roomId")`);
    results.push("PropertyInventory table ready");

    // ─── InventoryPurchase ─────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "InventoryPurchase" (
        "id" TEXT NOT NULL,
        "propertyId" TEXT NOT NULL,
        "unitId" TEXT,
        "itemId" TEXT NOT NULL,
        "vendorId" TEXT,
        "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "quantityPurchased" INTEGER NOT NULL,
        "unitCost" DOUBLE PRECISION NOT NULL,
        "totalCost" DOUBLE PRECISION NOT NULL,
        "receiptUrl" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "InventoryPurchase_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "InventoryPurchase_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PropertyInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "InventoryPurchase_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InventoryPurchase_propertyId_idx" ON "InventoryPurchase"("propertyId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InventoryPurchase_itemId_idx" ON "InventoryPurchase"("itemId")`);
    results.push("InventoryPurchase table ready");

    // ─── InventoryUsage ────────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "InventoryUsage" (
        "id" TEXT NOT NULL,
        "propertyId" TEXT NOT NULL,
        "unitId" TEXT,
        "bookingId" TEXT,
        "itemId" TEXT NOT NULL,
        "usageDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "quantityUsed" INTEGER NOT NULL,
        "unitCostAtUsage" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "totalUsageCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "reason" TEXT NOT NULL DEFAULT 'guest_stay',
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "InventoryUsage_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "InventoryUsage_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PropertyInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InventoryUsage_propertyId_idx" ON "InventoryUsage"("propertyId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InventoryUsage_itemId_idx" ON "InventoryUsage"("itemId")`);
    results.push("InventoryUsage table ready");

    // ─── InventoryReplacement ──────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "InventoryReplacement" (
        "id" TEXT NOT NULL,
        "propertyId" TEXT NOT NULL,
        "unitId" TEXT,
        "itemId" TEXT NOT NULL,
        "replacementDate" TIMESTAMP(3),
        "quantityReplaced" INTEGER NOT NULL DEFAULT 0,
        "replacementCostPerItem" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "totalReplacementCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "reason" TEXT NOT NULL DEFAULT 'worn',
        "priority" TEXT NOT NULL DEFAULT 'medium',
        "status" TEXT NOT NULL DEFAULT 'needed',
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "InventoryReplacement_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "InventoryReplacement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PropertyInventory"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InventoryReplacement_propertyId_idx" ON "InventoryReplacement"("propertyId")`);
    results.push("InventoryReplacement table ready");

    // ─── InventoryIssue ────────────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "InventoryIssue" (
        "id" TEXT NOT NULL,
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
        "resolvedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "InventoryIssue_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "InventoryIssue_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PropertyInventory"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InventoryIssue_propertyId_idx" ON "InventoryIssue"("propertyId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InventoryIssue_itemId_idx" ON "InventoryIssue"("itemId")`);
    results.push("InventoryIssue table ready");

    // ─── CleanerInventoryCheck ─────────────────────────────────────
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CleanerInventoryCheck" (
        "id" TEXT NOT NULL,
        "propertyId" TEXT NOT NULL,
        "listingId" TEXT,
        "bookingId" TEXT,
        "roomId" TEXT,
        "itemId" TEXT,
        "expectedQuantity" INTEGER NOT NULL DEFAULT 0,
        "actualQuantity" INTEGER NOT NULL DEFAULT 0,
        "conditionStatus" TEXT NOT NULL DEFAULT 'good',
        "status" TEXT NOT NULL DEFAULT 'complete',
        "cleanerNotes" TEXT,
        "photoUrl" TEXT,
        "checkedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CleanerInventoryCheck_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "CleanerInventoryCheck_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PropertyInventory"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CleanerInventoryCheck_propertyId_idx" ON "CleanerInventoryCheck"("propertyId")`);
    results.push("CleanerInventoryCheck table ready");

    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Migration failed";
    return NextResponse.json({ error: message, results }, { status: 500 });
  }
}
