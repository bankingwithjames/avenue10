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

  const links = await prisma.listingContentLink.findMany({
    where: { listingId },
    include: { siteContent: true },
    orderBy: { contentKey: "asc" },
  });

  return NextResponse.json(links);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { listingId, contentKey, siteContentId, isSynced, overrideValue, usageLocation } = await req.json();

  if (!listingId || !contentKey) {
    return NextResponse.json({ error: "listingId and contentKey required" }, { status: 400 });
  }

  const link = await prisma.listingContentLink.upsert({
    where: { listingId_contentKey: { listingId, contentKey } },
    update: {
      ...(siteContentId !== undefined && { siteContentId }),
      ...(isSynced !== undefined && { isSynced }),
      ...(overrideValue !== undefined && { overrideValue }),
      ...(usageLocation !== undefined && { usageLocation }),
    },
    create: {
      listingId,
      contentKey,
      siteContentId: siteContentId || null,
      usageLocation: usageLocation || "listing",
      isSynced: isSynced ?? true,
      overrideValue: overrideValue || null,
    },
    include: { siteContent: true },
  });

  return NextResponse.json(link);
}
