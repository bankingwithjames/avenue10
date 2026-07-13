import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "BookingQuote"
      ADD COLUMN IF NOT EXISTS "promoCode" TEXT,
      ADD COLUMN IF NOT EXISTS "promoDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "SalesConfig"
      ADD COLUMN IF NOT EXISTS "extraGuestFeeType" TEXT NOT NULL DEFAULT 'per_night';
    `);
    return NextResponse.json({ success: true, message: "Added promoCode and promoDiscount to BookingQuote" });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
