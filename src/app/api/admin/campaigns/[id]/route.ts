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
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        recipients: {
          include: {
            guest: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { sentAt: "desc" },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json(campaign);
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
      name,
      type,
      status,
      segment,
      listingFilter,
      subject,
      body: campaignBody,
      ctaText,
      ctaLink,
      scheduledAt,
      sentAt,
      totalRecipients,
      totalSent,
      totalOpened,
      totalClicked,
      totalBounced,
    } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (type !== undefined) data.type = type;
    if (status !== undefined) data.status = status;
    if (segment !== undefined) data.segment = segment;
    if (listingFilter !== undefined) data.listingFilter = listingFilter;
    if (subject !== undefined) data.subject = subject;
    if (campaignBody !== undefined) data.body = campaignBody;
    if (ctaText !== undefined) data.ctaText = ctaText;
    if (ctaLink !== undefined) data.ctaLink = ctaLink;
    if (scheduledAt !== undefined) data.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (sentAt !== undefined) data.sentAt = sentAt ? new Date(sentAt) : null;
    if (totalRecipients !== undefined) data.totalRecipients = totalRecipients;
    if (totalSent !== undefined) data.totalSent = totalSent;
    if (totalOpened !== undefined) data.totalOpened = totalOpened;
    if (totalClicked !== undefined) data.totalClicked = totalClicked;
    if (totalBounced !== undefined) data.totalBounced = totalBounced;

    const campaign = await prisma.campaign.update({
      where: { id },
      data,
    });

    return NextResponse.json(campaign);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update campaign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  try {
    await prisma.campaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete campaign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
