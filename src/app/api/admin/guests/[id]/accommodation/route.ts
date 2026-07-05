import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const accommodation = await prisma.guestAccommodation.findUnique({
      where: { guestId: id },
    });

    return NextResponse.json(accommodation);
  } catch {
    return NextResponse.json(null);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await req.json();
    const {
      accessibilityNeeds,
      familyNeeds,
      petNotes,
      parkingNeeds,
      sleepingPreferences,
      temperaturePreferences,
      allergies,
      specialOccasions,
      preferredCheckinTime,
      preferredCheckoutTime,
      preferredListing,
      favoriteAmenities,
      hostNotes,
    } = body;

    const data: Record<string, unknown> = {};
    if (accessibilityNeeds !== undefined) data.accessibilityNeeds = accessibilityNeeds;
    if (familyNeeds !== undefined) data.familyNeeds = familyNeeds;
    if (petNotes !== undefined) data.petNotes = petNotes;
    if (parkingNeeds !== undefined) data.parkingNeeds = parkingNeeds;
    if (sleepingPreferences !== undefined) data.sleepingPreferences = sleepingPreferences;
    if (temperaturePreferences !== undefined) data.temperaturePreferences = temperaturePreferences;
    if (allergies !== undefined) data.allergies = allergies;
    if (specialOccasions !== undefined) data.specialOccasions = specialOccasions;
    if (preferredCheckinTime !== undefined) data.preferredCheckinTime = preferredCheckinTime;
    if (preferredCheckoutTime !== undefined) data.preferredCheckoutTime = preferredCheckoutTime;
    if (preferredListing !== undefined) data.preferredListing = preferredListing;
    if (favoriteAmenities !== undefined) data.favoriteAmenities = favoriteAmenities;
    if (hostNotes !== undefined) data.hostNotes = hostNotes;

    const accommodation = await prisma.guestAccommodation.upsert({
      where: { guestId: id },
      create: { guestId: id, ...data },
      update: data,
    });

    return NextResponse.json(accommodation);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update accommodation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
