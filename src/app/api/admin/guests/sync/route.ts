import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const reservations = await prisma.reservation.findMany({
      select: {
        guestName: true,
        guestEmail: true,
        guestPhone: true,
        totalPrice: true,
        status: true,
      },
    });

    // Group reservations by email to aggregate stats
    const guestMap = new Map<
      string,
      {
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        lifetimeRevenue: number;
        totalBookings: number;
      }
    >();

    for (const res of reservations) {
      if (!res.guestEmail) continue;

      const email = res.guestEmail.toLowerCase().trim();
      const existing = guestMap.get(email);

      // Split guestName into first/last
      const nameParts = (res.guestName || "").trim().split(/\s+/);
      const firstName = nameParts[0] || "Unknown";
      const lastName = nameParts.slice(1).join(" ") || "Guest";

      const revenue = res.status === "cancelled" ? 0 : (res.totalPrice || 0);

      if (existing) {
        existing.lifetimeRevenue += revenue;
        existing.totalBookings += 1;
        // Use phone from reservation if we don't have one yet
        if (!existing.phone && res.guestPhone) {
          existing.phone = res.guestPhone;
        }
      } else {
        guestMap.set(email, {
          firstName,
          lastName,
          email,
          phone: res.guestPhone || null,
          lifetimeRevenue: revenue,
          totalBookings: 1,
        });
      }
    }

    let created = 0;
    let updated = 0;

    for (const guest of guestMap.values()) {
      const existing = await prisma.guest.findUnique({
        where: { email: guest.email },
      });

      if (existing) {
        await prisma.guest.update({
          where: { email: guest.email },
          data: {
            lifetimeRevenue: guest.lifetimeRevenue,
            totalBookings: guest.totalBookings,
            phone: existing.phone || guest.phone,
          },
        });
        updated++;
      } else {
        await prisma.guest.create({
          data: {
            firstName: guest.firstName,
            lastName: guest.lastName,
            email: guest.email,
            phone: guest.phone,
            source: "reservation",
            lifetimeRevenue: guest.lifetimeRevenue,
            totalBookings: guest.totalBookings,
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      total: guestMap.size,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to sync guests";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
