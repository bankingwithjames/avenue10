import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const listings = await prisma.listing.findMany({
    where: { active: true },
    select: { id: true, title: true, slug: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(listings);
}
