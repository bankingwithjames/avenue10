import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { reservations: true } } },
  });
  return NextResponse.json(listings);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { title, slug, description, type, bedrooms, bathrooms, maxGuests, pricePerNight, cleaningFee, amenities, photos } = body;

  if (!title || !slug || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.listing.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
  }

  const listing = await prisma.listing.create({
    data: {
      title,
      slug,
      description,
      type: type || "Entire Home",
      bedrooms: bedrooms || 1,
      bathrooms: bathrooms || 1,
      maxGuests: maxGuests || 2,
      pricePerNight: pricePerNight || 100,
      cleaningFee: cleaningFee || 0,
      amenities: amenities || [],
      photos: photos || [],
    },
  });

  return NextResponse.json(listing, { status: 201 });
}
