import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const listingId = req.nextUrl.searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const rule = await prisma.bookingRule.findUnique({ where: { listingId } });
  return NextResponse.json({ rule });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { listingId, ...ruleData } = body;

    if (!listingId) {
      return NextResponse.json({ error: "listingId required" }, { status: 400 });
    }

    // Separate approval rules (stored as JSON in notes or separate columns)
    const {
      approvalSameDay,
      approvalPets,
      approvalExtraGuests,
      approvalLongStays,
      approvalHighValue,
      approvalDiscounted,
      approvalEventWeekend,
      approvalCustomAddOns,
      approvalNewGuest,
      ...coreData
    } = ruleData;

    const rule = await prisma.bookingRule.upsert({
      where: { listingId },
      update: coreData,
      create: { listingId, ...coreData },
    });

    return NextResponse.json({ rule });
  } catch (err) {
    console.error("Booking rules save error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
