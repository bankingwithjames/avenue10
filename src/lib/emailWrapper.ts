// Branded email shell used for BOTH real sends (lib/messaging.ts) and the
// admin template preview, so previews match delivered emails exactly.
// Safe to import from client components — no server-only APIs.

export function wrapEmailHtml(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="text-align:center;padding:24px 0;">
      <span style="font-size:14px;letter-spacing:0.3em;color:#1a1a1a;font-weight:600;">AVENUE10</span>
    </div>
    <div style="background:#ffffff;border:1px solid #e8e6e1;padding:32px;color:#1a1a1a;font-size:14px;line-height:1.7;">
      ${bodyHtml}
    </div>
    <div style="text-align:center;padding:20px 0;color:#8a8578;font-size:11px;">
      Avenue10 · Dallas, TX · <a href="https://avenue10.net" style="color:#8a8578;">avenue10.net</a>
    </div>
  </div>
</body>
</html>`;
}

export function renderTemplateVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] ?? "");
}

// Sample data used by the admin preview.
export const SAMPLE_PREVIEW_VARS: Record<string, string> = {
  guestName: "James",
  firstName: "James",
  lastName: "Davis",
  fullName: "James Davis",
  guestEmail: "guest@example.com",
  guestPhone: "+1 (214) 555-0142",
  listingTitle: "The Main Home",
  propertyName: "The Main Home",
  checkIn: "Fri, Aug 15, 2026",
  checkOut: "Mon, Aug 18, 2026",
  nights: "3",
  guestCount: "4",
  totalPrice: "$2,331.90",
  confirmationCode: "AVX-7F314F28",
  portalLink: "https://avenue10.net/checkin",
  website: "https://avenue10.net",
  companyName: "Avenue10",
  accessCode: "4829",
  today: "Thu, Jul 16, 2026",
};
