"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Zap } from "lucide-react";

interface MessagingStatus {
  emailConfigured: boolean;
  emailProvider: string | null;
  emailFrom: string;
  smsConfigured: boolean;
  smsProvider: string | null;
}

interface RunSummary {
  results: { automation: string; sent: number; skipped: number; errors: string[] }[];
  activeAutomations: number;
  confirmedReservations: number;
}

export function MessagingStatusBanner() {
  const [status, setStatus] = useState<MessagingStatus | null>(null);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/messaging-status")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => {});
  }, []);

  async function runNow() {
    setRunning(true);
    setSummary(null);
    try {
      const r = await fetch("/api/admin/run-automations", { method: "POST" });
      if (r.ok) {
        const d: RunSummary = await r.json();
        const sent = d.results.reduce((s, x) => s + x.sent, 0);
        const skipped = d.results.reduce((s, x) => s + x.skipped, 0);
        setSummary(`Run complete — ${sent} message${sent === 1 ? "" : "s"} sent, ${skipped} skipped (already sent, opted out, or no provider), across ${d.activeAutomations} active automations and ${d.confirmedReservations} confirmed reservations.`);
      } else {
        setSummary("Run failed — check server logs.");
      }
    } catch {
      setSummary("Run failed — network error.");
    }
    setRunning(false);
  }

  if (!status) return null;

  const allConfigured = status.emailConfigured && status.smsConfigured;

  return (
    <div className="mt-4 space-y-3">
      <div className={`border p-4 ${allConfigured ? "bg-emerald-50 border-emerald-200" : status.emailConfigured ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
        <div className="flex flex-wrap items-start gap-2">
          {status.emailConfigured ? (
            <CheckCircle size={14} className="text-emerald-600 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
          )}
          <div className="flex-1 min-w-[200px]">
            <p className={`text-xs font-medium ${status.emailConfigured ? "text-emerald-800" : "text-amber-800"}`}>
              Email: {status.emailConfigured ? `connected via ${status.emailProvider} (from ${status.emailFrom})` : "not configured"}
              {" · "}
              SMS: {status.smsConfigured ? `connected via ${status.smsProvider}` : "not configured"}
            </p>
            {!allConfigured && (
              <p className="text-xs text-amber-700 mt-1">
                {!status.emailConfigured && (
                  <>Email — add <code className="bg-white/60 px-1">RESEND_API_KEY</code> (or <code className="bg-white/60 px-1">SENDGRID_API_KEY</code>) and <code className="bg-white/60 px-1">EMAIL_FROM</code> in Vercel → Project → Settings → Environment Variables, then redeploy. </>
                )}
                {!status.smsConfigured && (
                  <>SMS — add <code className="bg-white/60 px-1">TWILIO_ACCOUNT_SID</code>, <code className="bg-white/60 px-1">TWILIO_AUTH_TOKEN</code>, <code className="bg-white/60 px-1">TWILIO_FROM_NUMBER</code>. </>
                )}
                Until configured, automations log actions but skip delivery.
              </p>
            )}
            <p className="text-[10px] text-warm-gray mt-1.5">
              Automations run automatically once daily at 9am Central (Vercel Cron) — use Run Now for immediate sends. Marketing messages honor unsubscribe, SMS opt-in, and do-not-contact flags; do-not-contact guests never receive anything.
            </p>
          </div>
          <button
            onClick={runNow}
            disabled={running}
            className="shrink-0 w-full sm:w-auto justify-center sm:justify-start bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Zap size={11} />
            {running ? "Running..." : "Run Now"}
          </button>
        </div>
      </div>
      {summary && (
        <div className="bg-white border border-light-gray p-3">
          <p className="text-xs text-charcoal">{summary}</p>
        </div>
      )}
    </div>
  );
}
