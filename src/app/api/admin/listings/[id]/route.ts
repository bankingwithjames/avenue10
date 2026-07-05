import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      closedDates: true,
      pricingConfig: true,
      galleryItems: {
        include: { media: true },
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { reservations: true, galleryItems: true } },
    },
  });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(listing);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const listing = await prisma.listing.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.bedrooms !== undefined && { bedrooms: body.bedrooms }),
      ...(body.bathrooms !== undefined && { bathrooms: body.bathrooms }),
      ...(body.maxGuests !== undefined && { maxGuests: body.maxGuests }),
      ...(body.pricePerNight !== undefined && { pricePerNight: body.pricePerNight }),
      ...(body.cleaningFee !== undefined && { cleaningFee: body.cleaningFee }),
      ...(body.amenities !== undefined && { amenities: body.amenities }),
      ...(body.photos !== undefined && { photos: body.photos }),
      ...(body.active !== undefined && { active: body.active }),
    },
  });

  return NextResponse.json(listing);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  await prisma.listing.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
