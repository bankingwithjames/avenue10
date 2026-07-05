import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const listingId = req.nextUrl.searchParams.get("listingId");
  if (listingId) {
    const config = await prisma.pricingConfig.findUnique({ where: { listingId } });
    return NextResponse.json(config);
  }

  const configs = await prisma.pricingConfig.findMany({
    include: { listing: { select: { title: true } } },
  });
  return NextResponse.json(configs);
}

export async function PUT(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { listingId, ...data } = body;

  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const existing = await prisma.pricingConfig.findUnique({ where: { listingId } });
  const changedFields: string[] = [];

  if (existing) {
    for (const [key, val] of Object.entries(data)) {
      const oldVal = (existing as Record<string, unknown>)[key];
      if (oldVal !== val && val !== undefined) {
        changedFields.push(key);
        await prisma.pricingChangeLog.create({
          data: {
            listingId,
            changedField: key,
            oldValue: String(oldVal ?? ""),
            newValue: String(val),
            changedFromPage: body.changedFromPage || "listings",
            changedBy: session?.user?.email || null,
          },
        });
      }
    }
  }

  const config = await prisma.pricingConfig.upsert({
    where: { listingId },
    update: data,
    create: { listingId, ...data },
  });

  if (data.baseNightlyRate !== undefined || data.cleaningFee !== undefined) {
    await prisma.listing.update({
      where: { id: listingId },
      data: {
        ...(data.baseNightlyRate !== undefined && { pricePerNight: data.baseNightlyRate }),
        ...(data.cleaningFee !== undefined && { cleaningFee: data.cleaningFee }),
      },
    });
  }

  return NextResponse.json(config);
}
