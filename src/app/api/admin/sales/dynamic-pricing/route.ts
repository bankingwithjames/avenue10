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

  const settings = await prisma.dynamicPricingSettings.findUnique({
    where: { listingId },
  });

  return NextResponse.json(settings || {});
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { listingId, ...data } = body;

    if (!listingId) {
      return NextResponse.json({ error: "listingId required" }, { status: 400 });
    }

    const settings = await prisma.dynamicPricingSettings.upsert({
      where: { listingId },
      update: data,
      create: { listingId, ...data },
    });

    return NextResponse.json(settings);
  } catch (err) {
    console.error("Dynamic pricing save error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
