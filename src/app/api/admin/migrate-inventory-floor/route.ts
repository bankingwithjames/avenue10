import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "InventoryRoom"
      ADD COLUMN IF NOT EXISTS "floor" INTEGER NOT NULL DEFAULT 1
    `);

    return NextResponse.json({ success: true, message: "floor column added to InventoryRoom" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Migration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
