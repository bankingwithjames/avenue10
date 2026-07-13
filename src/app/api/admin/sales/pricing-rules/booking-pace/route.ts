import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const listingId = req.nextUrl.searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const settings = await prisma.bookingPaceSettings.findUnique({ where: { listingId } });
  return NextResponse.json(settings || { isEnabled: false });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { listingId, ...data } = body;
    if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });

    const settings = await prisma.bookingPaceSettings.upsert({
      where: { listingId },
      update: data,
      create: { listingId, ...data },
    });

    await prisma.pricingChangeLog.create({
      data: {
        listingId,
        changedField: "booking_pace_settings",
        newValue: JSON.stringify({ isEnabled: settings.isEnabled }),
        changedByRule: "booking_pace",
        changedFromPage: "sales_manager",
        reason: settings.isEnabled ? "Booking pace adjustment enabled" : "Booking pace adjustment disabled",
      },
    });

    return NextResponse.json(settings);
  } catch (err) {
    console.error("Booking pace settings save error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
