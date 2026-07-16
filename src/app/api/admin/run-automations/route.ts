import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { sendEmail, sendSms, renderTemplate, wrapEmailHtml, getMessagingStatus } from "@/lib/messaging";

// Automation execution engine.
// POST — run manually from the admin UI (admin session required).
// GET  — run from Vercel Cron (Authorization: Bearer CRON_SECRET).
//
// Rules enforced on every send:
//  - doNotContact guests never receive anything.
//  - Marketing sends (repeat-guest offer, win-back) additionally require
//    marketingOptIn + emailOptIn (email) or smsOptIn (SMS), and skip doNotHost.
//  - Every send/skip is logged to CrmActivityLog; sends are idempotent via
//    a unique action key per (automation, reservation/guest).

const MARKETING_NAMES = new Set(["Repeat guest offer", "Win-back campaign"]);

const DEFAULT_CONTENT: Record<string, { subject: string; body: string }> = {
  "Send booking confirmation": {
    subject: "Your Avenue10 reservation is confirmed",
    body: `<p>Hi {{guestName}},</p><p>Your stay at <strong>{{listingTitle}}</strong> is confirmed.</p><p>Check-in: {{checkIn}}<br/>Check-out: {{checkOut}}</p><p>We'll send your guest portal details shortly. We can't wait to host you.</p>`,
  },
  "Send portal link": {
    subject: "Your Avenue10 guest portal",
    body: `<p>Hi {{guestName}},</p><p>Your guest portal for <strong>{{listingTitle}}</strong> is ready. Sign your rental terms, view check-in instructions, and manage your stay:</p><p><a href="{{portalLink}}" style="color:#c9a96e;">Open Guest Portal</a></p><p>Sign in with your last name and access code: <strong>{{accessCode}}</strong></p>`,
  },
  "Terms reminder": {
    subject: "Action needed — sign your rental terms",
    body: `<p>Hi {{guestName}},</p><p>Your stay at <strong>{{listingTitle}}</strong> is coming up, but the rental terms haven't been signed yet. Door codes and check-in instructions unlock after signing.</p><p><a href="{{portalLink}}" style="color:#c9a96e;">Sign Terms Now</a></p>`,
  },
  "Check-in instructions": {
    subject: "Check-in tomorrow — everything you need",
    body: `<p>Hi {{guestName}},</p><p>Your stay at <strong>{{listingTitle}}</strong> begins {{checkIn}}. Full check-in instructions are in your guest portal:</p><p><a href="{{portalLink}}" style="color:#c9a96e;">View Instructions</a></p>`,
  },
  "Door code available": {
    subject: "Your door code is now available",
    body: `<p>Hi {{guestName}},</p><p>Your access window is open. View your door code and arrival details in the guest portal:</p><p><a href="{{portalLink}}" style="color:#c9a96e;">View Door Code</a></p>`,
  },
  "During-stay check-in": {
    subject: "How is your stay going?",
    body: `<p>Hi {{guestName}},</p><p>We hope you're settling in at <strong>{{listingTitle}}</strong>. If anything isn't perfect, submit a request through your portal and we'll take care of it right away.</p><p><a href="{{portalLink}}" style="color:#c9a96e;">Guest Portal</a></p>`,
  },
  "Checkout reminder": {
    subject: "Checkout today — quick checklist",
    body: `<p>Hi {{guestName}},</p><p>It's checkout day at <strong>{{listingTitle}}</strong>. Your checkout checklist is in the portal:</p><p><a href="{{portalLink}}" style="color:#c9a96e;">Checkout Checklist</a></p><p>Safe travels — we'd love to host you again.</p>`,
  },
  "Review request": {
    subject: "How was your stay at Avenue10?",
    body: `<p>Hi {{guestName}},</p><p>Thanks for staying at <strong>{{listingTitle}}</strong>. Would you take a minute to share how it went?</p><p><a href="{{portalLink}}" style="color:#c9a96e;">Leave a Review</a></p>`,
  },
  "Repeat guest offer": {
    subject: "A welcome-back offer from Avenue10",
    body: `<p>Hi {{guestName}},</p><p>It was a pleasure hosting you. As a returning guest, book your next stay directly with us for the best available rate.</p><p><a href="https://avenue10.net" style="color:#c9a96e;">Book Your Next Stay</a></p>`,
  },
  "Win-back campaign": {
    subject: "We miss you at Avenue10",
    body: `<p>Hi {{guestName}},</p><p>It's been a while since your last stay. Dallas is calling — come back and see what's new at Avenue10.</p><p><a href="https://avenue10.net" style="color:#c9a96e;">See Availability</a></p>`,
  },
};

function parseDelayMs(delay: string | null): number {
  if (!delay) return 0;
  // The delay picker uses "m" for both minutes (15m, 30m) and months (3m, 6m).
  if (delay === "3m") return 90 * 86_400_000;
  if (delay === "6m") return 182 * 86_400_000;
  const m = delay.match(/^(\d+)(m|h|d)$/);
  if (m) {
    const n = Number(m[1]);
    if (m[2] === "m") return n * 60_000;
    if (m[2] === "h") return n * 3_600_000;
    if (m[2] === "d") return n * 86_400_000;
  }
  return 0;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" });
}

async function runEngine() {
  const status = getMessagingStatus();
  const now = Date.now();
  const results: { automation: string; sent: number; skipped: number; errors: string[] }[] = [];

  const automations = await prisma.crmAutomation.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  const templates = await prisma.messageTemplate.findMany({ where: { isActive: true } });
  // Custom personalization variables ({{key}} → value), merged into every message.
  let customVars: Record<string, string> = {};
  try {
    const rows = await prisma.personalizationVariable.findMany();
    customVars = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch { /* table may not exist yet */ }
  const reservations = await prisma.reservation.findMany({
    where: { status: "confirmed" },
    include: { listing: { select: { title: true } }, agreement: true, guest: true },
  });

  for (const auto of automations) {
    const delayMs = parseDelayMs(auto.delay);
    const isMarketing = MARKETING_NAMES.has(auto.name);
    const template = auto.templateId ? templates.find((t) => t.id === auto.templateId) : null;
    const defaults = DEFAULT_CONTENT[auto.name] || { subject: `Avenue10 — ${auto.name}`, body: `<p>Hi {{guestName}},</p><p>Update regarding your stay at {{listingTitle}}.</p>` };
    const subjectSrc = template?.subject || defaults.subject;
    const bodySrc = template?.body || defaults.body;
    const channel = template?.type === "sms" ? "sms" : "email";

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Which reservations does this trigger match right now?
    const matches = reservations.filter((r) => {
      const checkIn = new Date(r.checkIn).getTime();
      const checkOut = new Date(r.checkOut).getTime();
      const created = new Date(r.createdAt).getTime();
      switch (auto.trigger) {
        case "booking-confirmed":
          return created + delayMs <= now && now < checkOut;
        case "terms-unsigned":
          return !r.agreement && created + delayMs <= now && now < checkIn;
        case "pre-arrival":
          return checkIn - delayMs <= now && now < checkIn;
        case "access-unlocked":
          return !!r.agreement && checkIn <= now && now < checkOut;
        case "during-stay":
          return checkIn + delayMs <= now && now < checkOut;
        case "checkout-day": {
          const co = new Date(r.checkOut);
          const today = new Date();
          return (
            co.getUTCFullYear() === today.getUTCFullYear() &&
            co.getUTCMonth() === today.getUTCMonth() &&
            co.getUTCDate() === today.getUTCDate()
          );
        }
        case "post-checkout":
          return checkOut + delayMs <= now && now < checkOut + delayMs + 30 * 86_400_000;
        case "win-back":
          return checkOut + delayMs <= now && now < checkOut + delayMs + 60 * 86_400_000;
        default:
          return false;
      }
    });

    for (const r of matches) {
      const key = `automation:${auto.trigger}:${auto.name}:${r.id}`;
      const already = await prisma.crmActivityLog.findFirst({ where: { action: key } });
      if (already) continue;

      // Consent gates
      const guest = r.guest;
      if (guest?.doNotContact) { skipped++; continue; }
      if (isMarketing) {
        if (!guest) { skipped++; continue; }
        if (guest.doNotHost || !guest.marketingOptIn) { skipped++; continue; }
        if (channel === "email" && !guest.emailOptIn) { skipped++; continue; }
        if (channel === "sms" && !guest.smsOptIn) { skipped++; continue; }
      }
      if (channel === "sms" && !r.guestPhone) { skipped++; continue; }

      const nameParts = r.guestName.trim().split(/\s+/);
      const nights = Math.max(1, Math.round((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86_400_000));
      const vars: Record<string, string> = {
        ...customVars,
        guestName: nameParts[0] || r.guestName,
        firstName: nameParts[0] || r.guestName,
        lastName: nameParts.slice(1).join(" "),
        fullName: r.guestName,
        guestEmail: r.guestEmail,
        guestPhone: r.guestPhone || "",
        listingTitle: r.listing?.title || "Avenue10",
        propertyName: r.listing?.title || "Avenue10",
        checkIn: fmtDate(new Date(r.checkIn)),
        checkOut: fmtDate(new Date(r.checkOut)),
        nights: String(nights),
        guestCount: String(r.guests),
        totalPrice: `$${r.totalPrice.toFixed(2)}`,
        confirmationCode: r.confirmationCode || "",
        portalLink: "https://avenue10.net/checkin",
        website: "https://avenue10.net",
        companyName: "Avenue10",
        accessCode: r.accessCode || "",
        today: fmtDate(new Date()),
      };

      const subject = renderTemplate(subjectSrc, vars);
      const body = renderTemplate(bodySrc, vars);

      let result;
      if (channel === "sms") {
        result = await sendSms({ to: r.guestPhone!, body: body.replace(/<[^>]+>/g, "") });
      } else {
        // bccMonitorEmail (Variables tab) receives a copy of every email for delivery monitoring.
        result = await sendEmail({ to: r.guestEmail, subject, html: wrapEmailHtml(body), bcc: customVars.bccMonitorEmail || undefined });
      }

      await prisma.crmActivityLog.create({
        data: {
          guestId: guest?.id || null,
          action: result.ok ? key : `${key}:failed`,
          details: JSON.stringify({
            automation: auto.name,
            trigger: auto.trigger,
            channel,
            to: channel === "sms" ? r.guestPhone : r.guestEmail,
            reservationId: r.id,
            provider: result.provider,
            ok: result.ok,
            error: result.error || undefined,
            subject: channel === "email" ? subject : undefined,
          }),
          actor: "automation-engine",
        },
      });

      if (result.ok) sent++;
      else { skipped++; if (result.error && errors.length < 3) errors.push(result.error); }
    }

    results.push({ automation: `${auto.name} (${auto.trigger})`, sent, skipped, errors });
  }

  return {
    ran: true,
    emailConfigured: status.emailConfigured,
    smsConfigured: status.smsConfigured,
    activeAutomations: automations.length,
    confirmedReservations: reservations.length,
    results,
  };
}

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const summary = await runEngine();
    return NextResponse.json(summary);
  } catch (e: unknown) {
    console.error("run-automations error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Vercel Cron entrypoint
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runEngine();
    return NextResponse.json(summary);
  } catch (e: unknown) {
    console.error("run-automations cron error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
