import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { recipients: true } },
      },
    });

    return NextResponse.json(campaigns);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const {
      name,
      type,
      status,
      segment,
      listingFilter,
      subject,
      body,
      ctaText,
      ctaLink,
      scheduledAt,
      createdBy,
    } = await req.json();

    if (!name || !body) {
      return NextResponse.json(
        { error: "name and body are required" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        type,
        status,
        segment,
        listingFilter,
        subject,
        body,
        ctaText,
        ctaLink,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        createdBy,
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create campaign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
