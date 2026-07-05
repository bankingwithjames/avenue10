import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireGuest } from "@/lib/guestAuth";

export async function GET(req: NextRequest) {
  const { error, guest } = await requireGuest(req);
  if (error) return error;

  const categoryFilter = req.nextUrl.searchParams.get("category");

  const items = await prisma.checkinInstruction.findMany({
    where: {
      listingId: guest!.listingId,
      ...(categoryFilter ? { category: categoryFilter } : {}),
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  // Check if terms are signed
  const agreement = await prisma.reservationAgreement.findUnique({
    where: { reservationId: guest!.reservationId },
  });
  const signed = !!agreement;

  // Get reservation for check-in date
  const reservation = await prisma.reservation.findUnique({
    where: { id: guest!.reservationId },
    select: { checkIn: true },
  });

  const now = new Date();

  const processed = items.map((item) => {
    const result: Record<string, unknown> = {
      id: item.id,
      category: item.category,
      title: item.title,
      value: item.value,
      sensitive: item.sensitive,
      visibleBeforeHours: item.visibleBeforeHours,
      locked: false,
    };

    // For sensitive items, require signed terms
    if (item.sensitive && !signed) {
      result.value = "[Sign terms to view]";
      result.locked = true;
      return result;
    }

    // For items with time-window visibility
    if (item.visibleBeforeHours > 0 && reservation) {
      const checkInDate = new Date(reservation.checkIn);
      const visibleFrom = new Date(
        checkInDate.getTime() - item.visibleBeforeHours * 60 * 60 * 1000
      );
      if (now < visibleFrom) {
        result.value = `[Available ${item.visibleBeforeHours} hours before check-in]`;
        result.locked = true;
        return result;
      }
    }

    return result;
  });

  return NextResponse.json(processed);
}
