import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { sendEmail, sendSms, renderTemplate, wrapEmailHtml, getMessagingStatus } from "@/lib/messaging";

// Sends a campaign to its eligible segment.
// Consent rules (always enforced):
//  - doNotContact and doNotHost guests are excluded from ALL campaigns
//  - email campaigns require emailOptIn + marketingOptIn
//  - SMS campaigns require smsOptIn + marketingOptIn and a phone number
// Every send is logged to CrmActivityLog and CampaignRecipient.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  // Optional: restrict this send to a single guest (individual communication).
  let targetGuestId: string | null = null;
  try {
    const body = await req.json();
    if (body && typeof body.guestId === "string") targetGuestId = body.guestId;
  } catch { /* no body — full segment send */ }

  try {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const status = getMessagingStatus();
    const isSms = campaign.type === "sms";
    if (isSms && !status.smsConfigured) {
      return NextResponse.json({ error: "SMS provider not configured. Add Twilio credentials in Vercel environment variables." }, { status: 400 });
    }
    if (!isSms && !status.emailConfigured) {
      return NextResponse.json({ error: "Email provider not configured. Add RESEND_API_KEY or SENDGRID_API_KEY in Vercel environment variables." }, { status: 400 });
    }

    const guests = await prisma.guest.findMany({
      include: { reservations: { select: { checkIn: true, checkOut: true, status: true } } },
    });

    let customVars: Record<string, string> = {};
    try {
      const rows = await prisma.personalizationVariable.findMany();
      customVars = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    } catch { /* table may not exist yet */ }

    const now = new Date();
    const segmentMatch = (g: (typeof guests)[number]) => {
      switch (campaign.segment) {
        case "upcoming":
          return g.reservations.some((r) => r.status === "confirmed" && new Date(r.checkIn) > now);
        case "current":
          return g.reservations.some((r) => r.status === "confirmed" && new Date(r.checkIn) <= now && new Date(r.checkOut) >= now);
        case "past":
          return g.reservations.some((r) => new Date(r.checkOut) < now);
        case "repeat":
          return g.totalBookings > 1;
        case "vip":
          return g.isVip;
        default:
          return true; // "all"
      }
    };

    const eligible = guests.filter((g) => {
      if (targetGuestId && g.id !== targetGuestId) return false;
      if (g.doNotContact || g.doNotHost) return false;
      if (!g.marketingOptIn) return false;
      if (isSms && (!g.smsOptIn || !g.phone)) return false;
      if (!isSms && !g.emailOptIn) return false;
      return targetGuestId ? true : segmentMatch(g);
    });

    if (targetGuestId && eligible.length === 0) {
      return NextResponse.json({ error: "This guest can't receive this message (do-not-contact, unsubscribed, or missing phone for SMS)." }, { status: 400 });
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const g of eligible) {
      const vars = {
        ...customVars,
        guestName: g.firstName,
        firstName: g.firstName,
        lastName: g.lastName,
        fullName: `${g.firstName} ${g.lastName}`.trim(),
        guestEmail: g.email,
        website: "https://avenue10.net",
        companyName: "Avenue10",
        portalLink: "https://avenue10.net/checkin",
      };
      const body = renderTemplate(campaign.body, vars);
      const subject = renderTemplate(campaign.subject || campaign.name, vars);
      const cta = campaign.ctaText && campaign.ctaLink
        ? `<p style="margin-top:20px;"><a href="${campaign.ctaLink}" style="background:#1a1a1a;color:#ffffff;padding:10px 22px;text-decoration:none;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">${campaign.ctaText}</a></p>`
        : "";

      const result = isSms
        ? await sendSms({ to: g.phone!, body: body.replace(/<[^>]+>/g, "") })
        : await sendEmail({ to: g.email, subject, html: wrapEmailHtml(`${body}${cta}`), bcc: customVars.bccMonitorEmail || undefined });

      await prisma.campaignRecipient.upsert({
        where: { campaignId_guestId: { campaignId: id, guestId: g.id } },
        create: {
          campaignId: id,
          guestId: g.id,
          deliveryStatus: result.ok ? "sent" : "failed",
          sentAt: result.ok ? new Date() : null,
        },
        update: {
          deliveryStatus: result.ok ? "sent" : "failed",
          sentAt: result.ok ? new Date() : null,
        },
      });

      await prisma.crmActivityLog.create({
        data: {
          guestId: g.id,
          action: `campaign-send:${id}`,
          details: JSON.stringify({ campaign: campaign.name, channel: campaign.type, to: isSms ? g.phone : g.email, ok: result.ok, error: result.error || undefined }),
          actor: "campaign-engine",
        },
      });

      if (result.ok) sentCount++;
      else failedCount++;
    }

    if (targetGuestId) {
      // Individual send: accumulate counters, don't close out the campaign.
      await prisma.campaign.update({
        where: { id },
        data: {
          sentAt: new Date(),
          totalRecipients: { increment: eligible.length },
          totalSent: { increment: sentCount },
          totalBounced: { increment: failedCount },
        },
      });
    } else {
      await prisma.campaign.update({
        where: { id },
        data: {
          status: "sent",
          sentAt: new Date(),
          totalRecipients: eligible.length,
          totalSent: sentCount,
          totalBounced: failedCount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      eligible: eligible.length,
      sent: sentCount,
      failed: failedCount,
      excluded: guests.length - eligible.length,
    });
  } catch (e: unknown) {
    console.error("campaign send error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
