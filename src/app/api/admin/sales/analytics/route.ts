import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const listingId = req.nextUrl.searchParams.get("listingId");

  try {
    const where = listingId ? { listingId } : {};

    const [reservations, quotes, changeOrders, abandonedCount] =
      await Promise.all([
        prisma.reservation.findMany({
          where: { ...where, status: { in: ["confirmed", "pending"] } },
          select: {
            totalPrice: true,
            guests: true,
            addOnsTotalCharged: true,
            depositHoldCharged: true,
          },
        }),
        prisma.bookingQuote.count({ where }),
        prisma.reservationChangeOrder.findMany({
          where: {
            ...(listingId ? { reservation: { listingId } } : {}),
            approvalStatus: "pending",
          },
          select: { priceDifference: true },
        }),
        prisma.abandonedCheckout.count({
          where: listingId ? { listingId } : {},
        }),
      ]);

    const grossBookingRevenue = reservations.reduce(
      (s, r) => s + (r.totalPrice || 0),
      0
    );
    const addOnRevenue = reservations.reduce(
      (s, r) => s + (r.addOnsTotalCharged || 0),
      0
    );
    const pendingUpcharges = changeOrders.reduce(
      (s, o) => s + Math.max(0, o.priceDifference),
      0
    );
    const totalGuests = reservations.reduce((s, r) => s + (r.guests || 1), 0);
    const activeDepositHolds = reservations.reduce(
      (s, r) => s + (r.depositHoldCharged || 0),
      0
    );
    const confirmedCount = reservations.length;
    const conversionRate =
      quotes > 0 ? (confirmedCount / quotes) * 100 : 0;
    const averageBookingValue =
      confirmedCount > 0 ? grossBookingRevenue / confirmedCount : 0;
    const revenuePerGuest =
      totalGuests > 0 ? grossBookingRevenue / totalGuests : 0;

    return NextResponse.json({
      kpis: {
        grossBookingRevenue,
        addOnRevenue,
        pendingUpcharges,
        dynamicPricingLift: 0,
        discountAmount: 0,
        activeDepositHolds,
        checkoutConversionRate: conversionRate,
        abandonedCheckouts: abandonedCount,
        averageBookingValue,
        revenuePerGuest,
      },
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
