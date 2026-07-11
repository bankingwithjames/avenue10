import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const listingId = req.nextUrl.searchParams.get("listingId");

  if (listingId) {
    const config = await prisma.salesConfig.findUnique({
      where: { listingId },
      include: {
        addOns: { orderBy: { sortOrder: "asc" } },
        listing: { select: { title: true } },
      },
    });
    return NextResponse.json(config);
  }

  const configs = await prisma.salesConfig.findMany({
    include: {
      addOns: { orderBy: { sortOrder: "asc" } },
      listing: { select: { title: true } },
    },
  });
  return NextResponse.json(configs);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { listingId, addOns, ...configData } = body;

    if (!listingId) {
      return NextResponse.json({ error: "listingId required" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const config = await prisma.salesConfig.upsert({
      where: { listingId },
      update: configData,
      create: { listingId, ...configData },
    });

    if (Array.isArray(addOns)) {
      await prisma.addOnItem.deleteMany({
        where: { salesConfigId: config.id },
      });

      if (addOns.length > 0) {
        await prisma.addOnItem.createMany({
          data: addOns.map(
            (item: { name: string; price: number; category?: string; description?: string; isActive?: boolean }, index: number) => ({
              salesConfigId: config.id,
              name: item.name,
              price: item.price,
              category: item.category || "service",
              description: item.description || null,
              isActive: item.isActive !== undefined ? item.isActive : true,
              sortOrder: index,
            })
          ),
        });
      }
    }

    const result = await prisma.salesConfig.findUnique({
      where: { id: config.id },
      include: {
        addOns: { orderBy: { sortOrder: "asc" } },
        listing: { select: { title: true } },
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Sales config save error:", err);
    return NextResponse.json({ error: "Failed to save sales config" }, { status: 500 });
  }
}
