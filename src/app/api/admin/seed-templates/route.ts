import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

// Seeds 2-3 message templates per automation event. Idempotent — skips
// templates whose name already exists. Category = automation trigger key.
const TEMPLATES: { name: string; type: "email" | "sms"; category: string; subject?: string; body: string }[] = [
  // ── booking-confirmed ────────────────────────────────────────────────
  {
    name: "Booking Confirmation — Warm Welcome",
    type: "email",
    category: "booking-confirmed",
    subject: "You're booked, {{firstName}} — welcome to {{propertyName}}",
    body: `<p>Hi {{firstName}},</p><p>Wonderful news — your stay at <strong>{{propertyName}}</strong> is confirmed. We're already getting things ready for you.</p><p><strong>Your stay</strong><br/>Check-in: {{checkIn}}<br/>Check-out: {{checkOut}}<br/>Guests: {{guestCount}} · {{nights}} night(s)<br/>Confirmation: {{confirmationCode}}</p><p>Your guest portal invitation arrives shortly with everything you need for a seamless arrival.</p><p>Warmly,<br/>The {{companyName}} Team</p>`,
  },
  {
    name: "Booking Confirmation — Concise",
    type: "email",
    category: "booking-confirmed",
    subject: "Reservation confirmed — {{propertyName}}, {{checkIn}}",
    body: `<p>Hi {{firstName}},</p><p>Your reservation at <strong>{{propertyName}}</strong> is confirmed for {{checkIn}} through {{checkOut}} ({{nights}} nights, {{guestCount}} guests).</p><p>Total: {{totalPrice}} · Confirmation: {{confirmationCode}}</p><p>Portal access and check-in details will follow. Reply to this email with any questions.</p><p>— {{companyName}}</p>`,
  },
  {
    name: "Booking Confirmation — SMS",
    type: "sms",
    category: "booking-confirmed",
    body: `{{companyName}}: You're confirmed at {{propertyName}}, {{checkIn}} – {{checkOut}}. Confirmation {{confirmationCode}}. Portal details arriving by email shortly.`,
  },

  // ── portal link (booking-confirmed trigger) ──────────────────────────
  {
    name: "Portal Link — Standard",
    type: "email",
    category: "booking-confirmed",
    subject: "Your {{companyName}} guest portal is ready",
    body: `<p>Hi {{firstName}},</p><p>Your guest portal for <strong>{{propertyName}}</strong> is ready. Sign your rental terms, view arrival instructions, and manage your entire stay in one place:</p><p><a href="{{portalLink}}" style="color:#c9a96e;">Open Guest Portal</a></p><p>Sign in with your last name and this access code: <strong>{{accessCode}}</strong></p><p>— {{companyName}}</p>`,
  },
  {
    name: "Portal Link — SMS",
    type: "sms",
    category: "booking-confirmed",
    body: `{{companyName}}: Your guest portal is ready. Sign terms & view check-in info at {{portalLink}} — access code {{accessCode}}.`,
  },

  // ── terms-unsigned ───────────────────────────────────────────────────
  {
    name: "Terms Reminder — Friendly",
    type: "email",
    category: "terms-unsigned",
    subject: "One quick step before your stay, {{firstName}}",
    body: `<p>Hi {{firstName}},</p><p>We're looking forward to hosting you at <strong>{{propertyName}}</strong> on {{checkIn}}. One quick step remains: signing your rental terms.</p><p>Door codes and arrival instructions unlock the moment you sign — it takes under two minutes.</p><p><a href="{{portalLink}}" style="color:#c9a96e;">Sign Terms Now</a> (access code {{accessCode}})</p><p>— {{companyName}}</p>`,
  },
  {
    name: "Terms Reminder — Direct",
    type: "email",
    category: "terms-unsigned",
    subject: "Action required — rental terms for {{checkIn}}",
    body: `<p>Hi {{firstName}},</p><p>Your check-in at <strong>{{propertyName}}</strong> is approaching and the rental agreement is still unsigned. Access details cannot be released until it's complete.</p><p><a href="{{portalLink}}" style="color:#c9a96e;">Complete Rental Agreement</a></p><p>Questions? Just reply to this email.</p><p>— {{companyName}}</p>`,
  },
  {
    name: "Terms Reminder — SMS",
    type: "sms",
    category: "terms-unsigned",
    body: `{{companyName}}: Reminder — your rental terms for {{propertyName}} ({{checkIn}}) are unsigned. Door codes unlock after signing: {{portalLink}}`,
  },

  // ── pre-arrival ──────────────────────────────────────────────────────
  {
    name: "Check-In Instructions — Full Detail",
    type: "email",
    category: "pre-arrival",
    subject: "Arriving tomorrow — your check-in guide",
    body: `<p>Hi {{firstName}},</p><p>Tomorrow's the day! Your stay at <strong>{{propertyName}}</strong> begins {{checkIn}}.</p><p>Everything you need — directions, parking, door access, Wi-Fi — is in your guest portal:</p><p><a href="{{portalLink}}" style="color:#c9a96e;">View Check-In Instructions</a></p><p>Travel safely. We're here if you need anything along the way.</p><p>— {{companyName}}</p>`,
  },
  {
    name: "Check-In Instructions — Quick Reference",
    type: "email",
    category: "pre-arrival",
    subject: "Check-in tomorrow at {{propertyName}}",
    body: `<p>Hi {{firstName}},</p><p>Quick reminder: check-in is tomorrow, {{checkIn}}. Your full arrival guide is here:</p><p><a href="{{portalLink}}" style="color:#c9a96e;">Arrival Guide</a> — sign in with your last name + code {{accessCode}}.</p><p>— {{companyName}}</p>`,
  },
  {
    name: "Check-In Instructions — SMS",
    type: "sms",
    category: "pre-arrival",
    body: `{{companyName}}: Check-in tomorrow at {{propertyName}}! Arrival guide, parking & access info: {{portalLink}}`,
  },

  // ── access-unlocked ──────────────────────────────────────────────────
  {
    name: "Door Code — Standard",
    type: "email",
    category: "access-unlocked",
    subject: "Your door code is ready",
    body: `<p>Hi {{firstName}},</p><p>Your access window is open — your door code for <strong>{{propertyName}}</strong> is now visible in the guest portal:</p><p><a href="{{portalLink}}" style="color:#c9a96e;">View Door Code</a></p><p>Have a wonderful stay.</p><p>— {{companyName}}</p>`,
  },
  {
    name: "Door Code — SMS",
    type: "sms",
    category: "access-unlocked",
    body: `{{companyName}}: Your door code for {{propertyName}} is now available in your portal: {{portalLink}}`,
  },

  // ── during-stay ──────────────────────────────────────────────────────
  {
    name: "During-Stay Check-In — Warm",
    type: "email",
    category: "during-stay",
    subject: "How's everything at {{propertyName}}?",
    body: `<p>Hi {{firstName}},</p><p>Just checking in — we hope your first night at <strong>{{propertyName}}</strong> was everything you hoped for.</p><p>If anything isn't perfect (or you simply need a restaurant recommendation), send us a request through your portal and we'll handle it promptly:</p><p><a href="{{portalLink}}" style="color:#c9a96e;">Guest Portal</a></p><p>Enjoy your stay,<br/>{{companyName}}</p>`,
  },
  {
    name: "During-Stay Check-In — Brief",
    type: "email",
    category: "during-stay",
    subject: "Everything good, {{firstName}}?",
    body: `<p>Hi {{firstName}},</p><p>Quick note from {{companyName}} — if anything at {{propertyName}} needs attention, tell us here and we'll take care of it: <a href="{{portalLink}}" style="color:#c9a96e;">Submit a Request</a>.</p>`,
  },
  {
    name: "During-Stay Check-In — SMS",
    type: "sms",
    category: "during-stay",
    body: `{{companyName}}: Hope you're settling in at {{propertyName}}! Need anything? Submit a request: {{portalLink}}`,
  },

  // ── checkout-day ─────────────────────────────────────────────────────
  {
    name: "Checkout Reminder — Checklist",
    type: "email",
    category: "checkout-day",
    subject: "Checkout today — quick checklist",
    body: `<p>Hi {{firstName}},</p><p>It's checkout day at <strong>{{propertyName}}</strong>. Before you head out:</p><ul><li>Load & start the dishwasher</li><li>Bag trash and place in the outdoor bins</li><li>Turn off lights and lock all doors</li></ul><p>The full checklist is in your portal: <a href="{{portalLink}}" style="color:#c9a96e;">Checkout Checklist</a></p><p>Safe travels — we'd love to welcome you back.</p><p>— {{companyName}}</p>`,
  },
  {
    name: "Checkout Reminder — Simple",
    type: "email",
    category: "checkout-day",
    subject: "Checkout today at {{propertyName}}",
    body: `<p>Hi {{firstName}},</p><p>A gentle reminder that checkout is today. Your checkout steps are in the portal: <a href="{{portalLink}}" style="color:#c9a96e;">View Checklist</a>.</p><p>Thank you for staying with {{companyName}} — safe travels!</p>`,
  },
  {
    name: "Checkout Reminder — SMS",
    type: "sms",
    category: "checkout-day",
    body: `{{companyName}}: Checkout today at {{propertyName}}. Checklist: {{portalLink}} — thanks for staying with us!`,
  },

  // ── post-checkout (review request) ───────────────────────────────────
  {
    name: "Review Request — Personal",
    type: "email",
    category: "post-checkout",
    subject: "How was your stay, {{firstName}}?",
    body: `<p>Hi {{firstName}},</p><p>Thank you for staying at <strong>{{propertyName}}</strong> — it was a pleasure hosting you.</p><p>Would you take one minute to share how your stay went? Your feedback shapes every detail of the guest experience.</p><p><a href="{{portalLink}}" style="color:#c9a96e;">Leave a Review</a></p><p>With gratitude,<br/>{{companyName}}</p>`,
  },
  {
    name: "Review Request — Short & Sweet",
    type: "email",
    category: "post-checkout",
    subject: "One minute of your time?",
    body: `<p>Hi {{firstName}},</p><p>Hope you made it home safely! If you enjoyed {{propertyName}}, a quick review would mean the world to us: <a href="{{portalLink}}" style="color:#c9a96e;">Rate Your Stay</a>.</p><p>— {{companyName}}</p>`,
  },

  // ── post-checkout (repeat guest offer — marketing) ───────────────────
  {
    name: "Repeat Guest Offer — Direct Booking",
    type: "email",
    category: "post-checkout",
    subject: "A welcome-back rate, just for you",
    body: `<p>Hi {{firstName}},</p><p>Guests like you make hosting a joy. When you're ready for your next Dallas visit, book directly with us for the best available rate — no platform fees, priority arrangements.</p><p><a href="{{website}}" style="color:#c9a96e;">Book Your Next Stay</a></p><p>— {{companyName}}</p>`,
  },
  {
    name: "Repeat Guest Offer — Warm Invitation",
    type: "email",
    category: "post-checkout",
    subject: "The door's always open, {{firstName}}",
    body: `<p>Hi {{firstName}},</p><p>It's been a couple of weeks since your stay at <strong>{{propertyName}}</strong> and we're already looking forward to next time.</p><p>As a returning guest, you'll always get our best direct rate at <a href="{{website}}" style="color:#c9a96e;">{{website}}</a>.</p><p>Until then,<br/>{{companyName}}</p>`,
  },

  // ── win-back (marketing) ─────────────────────────────────────────────
  {
    name: "Win-Back — We Miss You",
    type: "email",
    category: "win-back",
    subject: "We miss you at {{companyName}}",
    body: `<p>Hi {{firstName}},</p><p>It's been a while since your last stay — Dallas has been busy, and so have we. New touches, same attention to detail.</p><p>Come see what's new:</p><p><a href="{{website}}" style="color:#c9a96e;">See Availability</a></p><p>— {{companyName}}</p>`,
  },
  {
    name: "Win-Back — Special Occasion Nudge",
    type: "email",
    category: "win-back",
    subject: "Planning your next Dallas trip?",
    body: `<p>Hi {{firstName}},</p><p>Whether it's a family gathering, a game weekend, or just an escape — <strong>{{companyName}}</strong> sleeps up to 16 across the main home and garage apartment, and returning guests always get our best direct rate.</p><p><a href="{{website}}" style="color:#c9a96e;">Check Dates</a></p><p>Hope to host you again soon.</p>`,
  },
];

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const existing = await prisma.messageTemplate.findMany({ select: { name: true } });
    const existingNames = new Set(existing.map((t) => t.name));

    let created = 0;
    for (const t of TEMPLATES) {
      if (existingNames.has(t.name)) continue;
      await prisma.messageTemplate.create({
        data: { name: t.name, type: t.type, category: t.category, subject: t.subject || null, body: t.body, isActive: true },
      });
      created++;
    }

    return NextResponse.json({ success: true, created, skipped: TEMPLATES.length - created, total: TEMPLATES.length });
  } catch (e) {
    console.error("seed-templates error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
