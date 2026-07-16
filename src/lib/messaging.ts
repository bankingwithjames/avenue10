// Provider-agnostic email/SMS sending layer.
// Credentials come ONLY from environment variables (set in Vercel dashboard):
//   Email:  RESEND_API_KEY  (preferred)  or  SENDGRID_API_KEY
//           EMAIL_FROM  e.g. "Avenue10 <noreply@avenue10.net>"
//   SMS:    TWILIO_ACCOUNT_SID (AC...), TWILIO_FROM_NUMBER, and either
//           TWILIO_AUTH_TOKEN  or  TWILIO_API_KEY_SID (SK...) + TWILIO_API_KEY_SECRET
// No keys are ever stored in the database or exposed to the frontend.

export interface SendResult {
  ok: boolean;
  provider: string;
  error?: string;
}

export function getMessagingStatus() {
  const emailProvider = process.env.RESEND_API_KEY
    ? "resend"
    : process.env.SENDGRID_API_KEY
      ? "sendgrid"
      : null;
  const twilioAuthAvailable =
    !!process.env.TWILIO_AUTH_TOKEN ||
    (!!process.env.TWILIO_API_KEY_SID && !!process.env.TWILIO_API_KEY_SECRET);
  const smsProvider =
    process.env.TWILIO_ACCOUNT_SID &&
    twilioAuthAvailable &&
    process.env.TWILIO_FROM_NUMBER
      ? "twilio"
      : null;
  return {
    emailConfigured: !!emailProvider,
    emailProvider,
    emailFrom: process.env.EMAIL_FROM || "Avenue10 <noreply@avenue10.net>",
    smsConfigured: !!smsProvider,
    smsProvider,
  };
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  bcc?: string;
}): Promise<SendResult> {
  const from = process.env.EMAIL_FROM || "Avenue10 <noreply@avenue10.net>";
  // Delivery-monitor BCC: per-call value wins, else the EMAIL_BCC env var.
  const bcc = opts.bcc || process.env.EMAIL_BCC || undefined;

  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html, ...(bcc ? { bcc: [bcc] } : {}) }),
      });
      if (res.ok) return { ok: true, provider: "resend" };
      const err = await res.text();
      return { ok: false, provider: "resend", error: err.slice(0, 300) };
    } catch (e: unknown) {
      return { ok: false, provider: "resend", error: e instanceof Error ? e.message : "fetch failed" };
    }
  }

  if (process.env.SENDGRID_API_KEY) {
    try {
      const fromMatch = from.match(/^(.*)<(.+)>$/);
      const fromEmail = fromMatch ? fromMatch[2].trim() : from;
      const fromName = fromMatch ? fromMatch[1].trim() : "Avenue10";
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: opts.to }], ...(bcc ? { bcc: [{ email: bcc }] } : {}) }],
          from: { email: fromEmail, name: fromName },
          subject: opts.subject,
          content: [{ type: "text/html", value: opts.html }],
        }),
      });
      if (res.ok || res.status === 202) return { ok: true, provider: "sendgrid" };
      const err = await res.text();
      return { ok: false, provider: "sendgrid", error: err.slice(0, 300) };
    } catch (e: unknown) {
      return { ok: false, provider: "sendgrid", error: e instanceof Error ? e.message : "fetch failed" };
    }
  }

  return { ok: false, provider: "none", error: "No email provider configured (set RESEND_API_KEY or SENDGRID_API_KEY)" };
}

export async function sendSms(opts: { to: string; body: string }): Promise<SendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  // Prefer API Key auth (SK sid + secret); fall back to Account SID + Auth Token.
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  const basicUser = apiKeySid && apiKeySecret ? apiKeySid : accountSid;
  const basicPass = apiKeySid && apiKeySecret ? apiKeySecret : authToken;

  if (!accountSid || !basicUser || !basicPass || !fromNumber) {
    return { ok: false, provider: "none", error: "SMS not configured (set TWILIO_ACCOUNT_SID, TWILIO_FROM_NUMBER, and TWILIO_AUTH_TOKEN or TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET)" };
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${basicUser}:${basicPass}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: opts.to, From: fromNumber, Body: opts.body }).toString(),
      }
    );
    if (res.ok) return { ok: true, provider: "twilio" };
    const err = await res.text();
    return { ok: false, provider: "twilio", error: err.slice(0, 300) };
  } catch (e: unknown) {
    return { ok: false, provider: "twilio", error: e instanceof Error ? e.message : "fetch failed" };
  }
}

// Template substitution + branded email shell live in emailWrapper.ts so the
// admin preview renders exactly what gets delivered.
export { wrapEmailHtml, renderTemplateVars as renderTemplate } from "./emailWrapper";
