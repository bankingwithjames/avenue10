import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { sendEmail, sendSms, wrapEmailHtml, renderTemplate } from "@/lib/messaging";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { channel, guestId, templateId, ctaLinkId } = await req.json();
    if (!guestId || !templateId || !channel) {
      return NextResponse.json({ error: "guestId, templateId, and channel are required" }, { status: 400 });
    }

    // Load guest
    const guest = await prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });

    // Respect DNC
    if (guest.doNotContact) {
      return NextResponse.json({ error: "Guest is marked Do Not Contact" }, { status: 400 });
    }

    // Respect opt-in
    if (channel === "email" && !guest.emailOptIn) {
      return NextResponse.json({ error: "Guest has not opted in to email" }, { status: 400 });
    }
    if (channel === "sms" && !guest.smsOptIn) {
      return NextResponse.json({ error: "Guest has not opted in to SMS" }, { status: 400 });
    }

    // Load template
    const template = await prisma.messageTemplate.findUnique({ where: { id: templateId } });
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    // Load CTA if specified
    let ctaLink: { label: string; url: string } | null = null;
    if (ctaLinkId) {
      const cta = await prisma.ctaLink.findUnique({ where: { id: ctaLinkId } });
      if (cta?.isActive) ctaLink = { label: cta.label, url: cta.url };
    }

    // Build vars
    const vars: Record<string, string> = {
      guestName: [guest.firstName, guest.lastName].filter(Boolean).join(" ") || guest.email,
      firstName: guest.firstName || "",
      lastName: guest.lastName || "",
      fullName: [guest.firstName, guest.lastName].filter(Boolean).join(" ") || guest.email,
      guestEmail: guest.email,
      guestPhone: guest.phone || "",
      companyName: "Avenue10",
      website: "https://avenue10.net",
      portalLink: "https://avenue10.net/checkin",
      today: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };

    let body = renderTemplate(template.body, vars);

    // Append CTA
    if (ctaLink) {
      if (channel === "email") {
        body += `<div style="text-align:center;margin-top:24px;"><a href="${ctaLink.url}" style="display:inline-block;padding:12px 28px;background:#1a1a1a;color:#fff;text-decoration:none;font-size:13px;font-weight:600;border-radius:2px;">${ctaLink.label}</a></div>`;
      } else {
        body += `\n\n${ctaLink.label}: ${ctaLink.url}`;
      }
    }

    // Send
    let result: { ok: boolean; provider: string; error?: string };
    if (channel === "email") {
      if (!guest.email) return NextResponse.json({ error: "Guest has no email" }, { status: 400 });
      const subject = template.subject ? renderTemplate(template.subject, vars) : "Message from Avenue10";
      const bccEmail = (await prisma.personalizationVariable.findUnique({ where: { key: "bccMonitorEmail" } }))?.value;
      result = await sendEmail({ to: guest.email, subject, html: wrapEmailHtml(body), bcc: bccEmail || undefined });
    } else {
      if (!guest.phone) return NextResponse.json({ error: "Guest has no phone number" }, { status: 400 });
      result = await sendSms({ to: guest.phone, body });
    }

    // Log activity
    await prisma.crmActivityLog.create({
      data: {
        guestId: guest.id,
        action: "manual-send",
        actor: "admin",
        details: JSON.stringify({
          channel,
          templateId,
          templateName: template.name,
          ctaLabel: ctaLink?.label || null,
          ctaUrl: ctaLink?.url || null,
          to: channel === "email" ? guest.email : guest.phone,
          subject: channel === "email" ? (template.subject ? renderTemplate(template.subject, vars) : "Message from Avenue10") : null,
          ok: result.ok,
          provider: result.provider,
          error: result.error || null,
        }),
      },
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Send failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, provider: result.provider });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
