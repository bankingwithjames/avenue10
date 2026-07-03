import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const reservations = await prisma.reservation.findMany({
    orderBy: { createdAt: "desc" },
    include: { listing: { select: { title: true, slug: true } } },
  });
  return NextResponse.json(reservations);
}
