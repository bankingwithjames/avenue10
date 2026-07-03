import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!listing) {
    return NextResponse.json([]);
  }

  const items = await prisma.listingMedia.findMany({
    where: { listingId: listing.id },
    include: { media: true },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(
    items.map((item: typeof items[number]) => ({
      id: item.id,
      src: item.media.url,
      type: item.media.mimeType.startsWith("video/") ? "video" : "image",
      label: item.label,
      room: item.room,
    }))
  );
}
