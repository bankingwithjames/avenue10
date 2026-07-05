import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGuest } from "@/lib/guestAuth";

export async function GET(req: NextRequest) {
  const { error } = await requireGuest(req);
  if (error) return error;

  const items = await prisma.localRecommendation.findMany({
    where: { guestVisible: true },
    orderBy: [{ featured: "desc" }, { category: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      category: true,
      name: true,
      description: true,
      address: true,
      link: true,
      imageUrl: true,
      phone: true,
      distance: true,
      priceRange: true,
      bestFor: true,
      mapLink: true,
      featured: true,
    },
  });

  return NextResponse.json(items);
}
