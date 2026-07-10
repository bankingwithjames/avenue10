import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const listingId = req.nextUrl.searchParams.get("listingId");
  if (!listingId) {
    const rules = await prisma.bookingRule.findMany({
      include: { listing: { select: { title: true, slug: true } } },
    });
    return NextResponse.json(rules);
  }

  const rule = await prisma.bookingRule.findUnique({ where: { listingId } });
  return NextResponse.json(rule);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { listingId, ...data } = body;

  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const rule = await prisma.bookingRule.upsert({
    where: { listingId },
    create: { listingId, ...data },
    update: data,
  });

  return NextResponse.json(rule);
}
