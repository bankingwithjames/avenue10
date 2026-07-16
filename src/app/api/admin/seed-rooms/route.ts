import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    // Ensure floor column exists
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "InventoryRoom"
      ADD COLUMN IF NOT EXISTS "floor" INTEGER NOT NULL DEFAULT 1
    `);

    // Unlink any items from rooms about to be deleted
    await prisma.$executeRawUnsafe(`UPDATE "PropertyInventory" SET "roomId" = NULL WHERE "roomId" IS NOT NULL`);

    // Clear existing rooms
    await prisma.$executeRawUnsafe(`DELETE FROM "InventoryRoom"`);

    // Main Home ID
    const mh = 'cmr52no5h0001wo5tgz5nm1zk';
    // Garage Apartment ID
    const ga = 'cmr52nof20002wo5tddtsx973';

    // Insert all rooms via raw SQL
    await prisma.$executeRawUnsafe(`
      INSERT INTO "InventoryRoom" ("id", "propertyId", "roomName", "roomType", "floor", "displayOrder", "isActive", "createdAt", "updatedAt")
      VALUES
        -- ═══ Main Home — 1st Floor ═══
        (gen_random_uuid()::text, '${mh}', 'Foyer Area',                'living',   1,  0, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${mh}', 'Living Room',              'living',   1,  1, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${mh}', 'Theatre Room',             'living',   1,  2, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${mh}', 'Dining Room',              'dining',   1,  3, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${mh}', 'Kitchen',                  'kitchen',  1,  4, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${mh}', 'Full Bathroom (Lvl 1)',    'bathroom', 1,  5, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${mh}', 'Full Bathroom (2) (Lvl 1)','bathroom', 1,  6, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${mh}', 'Laundry Room',             'laundry',  1,  7, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${mh}', 'Patio / Backyard',         'outdoor',  1,  8, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${mh}', 'Parking / Exterior',       'outdoor',  1,  9, true, NOW(), NOW()),

        -- ═══ Main Home — 2nd Floor ═══
        (gen_random_uuid()::text, '${mh}', 'Master Suite',             'bedroom',  2,  0, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${mh}', 'Master Suite Office',      'bedroom',  2,  1, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${mh}', 'Master Bathroom',          'bathroom', 2,  2, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${mh}', 'Queen Bedroom',            'bedroom',  2,  3, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${mh}', 'Double Full Bedroom',      'bedroom',  2,  4, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${mh}', 'Double Bunk Bed',          'bedroom',  2,  5, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${mh}', 'Full Bathroom (Lvl 2)',    'bathroom', 2,  6, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${mh}', 'Half Bathroom (Lvl 2)',    'bathroom', 2,  7, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${mh}', 'Cleaning Closet',          'storage',  2,  8, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${mh}', 'Safety Equipment',         'safety',   2,  9, true, NOW(), NOW()),

        -- ═══ Garage Apartment — 1st Floor ═══
        (gen_random_uuid()::text, '${ga}', 'Living Area',              'living',   1,  0, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${ga}', 'Kitchen / Kitchenette',    'kitchen',  1,  1, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${ga}', 'Queen Bedroom',            'bedroom',  1,  2, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${ga}', 'Bathroom',                 'bathroom', 1,  3, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${ga}', 'Dining Nook',              'dining',   1,  4, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${ga}', 'Patio / Entry',            'outdoor',  1,  5, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${ga}', 'Closet / Storage',         'storage',  1,  6, true, NOW(), NOW()),
        (gen_random_uuid()::text, '${ga}', 'Safety Equipment',         'safety',   1,  7, true, NOW(), NOW())
    `);

    const count = await prisma.inventoryRoom.count();

    return NextResponse.json({
      success: true,
      total: count,
      mainHome: 20,
      garageApartment: 8,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
