"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Star, Send, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface GuestRequest {
  id: string;
  type: string;
  message: string;
  status: string;
  adminReply?: string;
  createdAt: string;
}

const STATUS_ICONS: Record<string, typeof Clock> = {
  pending: Clock,
  acknowledged: AlertCircle,
  resolved: CheckCircle,
};

export function RequestsTab({ token }: { token: string }) {
  const [requests, setRequests] = useState<GuestRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("request");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function loadRequests() {
    fetch("/api/checkin/requests", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setRequests(data);
        setLoading(false);
      });
  }

  useEffect(() => { loadRequests(); }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch("/api/checkin/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ type, message }),
    });

    if (res.ok) {
      setMessage("");
      loadRequests();
    }
    setSubmitting(false);
  }

  if (loading) return <p className="text-sm text-warm-gray">Loading...</p>;

  return (
    <div className="space-y-6">
      {/* Submit form */}
      <div className="bg-white border border-light-gray">
        <div className="p-6 border-b border-light-gray">
          <h2 className="text-lg font-medium text-charcoal mb-1">Review & Request</h2>
          <p className="text-xs text-warm-gray">
            Leave a review or request something during your stay.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-warm-gray mb-2 font-medium">
              Type
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType("request")}
                className={`flex items-center gap-2 px-4 py-2.5 text-[10px] tracking-[0.1em] uppercase font-medium border transition-colors ${
                  type === "request"
                    ? "bg-charcoal text-white border-charcoal"
                    : "bg-white text-warm-gray border-light-gray hover:border-charcoal"
                }`}
              >
                <MessageSquare size={12} /> Request
              </button>
              <button
                type="button"
                onClick={() => setType("review")}
                className={`flex items-center gap-2 px-4 py-2.5 text-[10px] tracking-[0.1em] uppercase font-medium border transition-colors ${
                  type === "review"
                    ? "bg-charcoal text-white border-charcoal"
                    : "bg-white text-warm-gray border-light-gray hover:border-charcoal"
                }`}
              >
                <Star size={12} /> Review
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.15em] uppercase text-warm-gray mb-2 font-medium">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="w-full border border-light-gray px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-charcoal resize-none"
              placeholder={
                type === "review"
                  ? "Share your experience..."
                  : "What do you need? Extra towels, early check-out, etc."
              }
            />
          </div>

          <button
            type="submit"
            disabled={!message.trim() || submitting}
            className="flex items-center gap-2 bg-charcoal text-white px-6 py-3 text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-charcoal/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            {submitting ? "Sending..." : "Submit"}
          </button>
        </form>
      </div>

      {/* History */}
      {requests.length > 0 && (
        <div className="bg-white border border-light-gray">
          <div className="px-6 py-4 border-b border-light-gray bg-cream/50">
            <h3 className="text-[11px] tracking-[0.15em] uppercase font-medium text-charcoal">
              Your Submissions
            </h3>
          </div>
          <div className="divide-y divide-light-gray">
            {requests.map((req) => {
              const StatusIcon = STATUS_ICONS[req.status] || Clock;
              return (
                <div key={req.id} className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] tracking-[0.15em] uppercase font-medium px-2 py-0.5 ${
                      req.type === "review" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                    }`}>
                      {req.type}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-warm-gray">
                      <StatusIcon size={12} />
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm text-charcoal">{req.message}</p>
                  {req.adminReply && (
                    <div className="mt-3 bg-cream p-3 border-l-2 border-charcoal">
                      <p className="text-[10px] tracking-[0.1em] uppercase text-warm-gray mb-1 font-medium">
                        Host Reply
                      </p>
                      <p className="text-sm text-charcoal">{req.adminReply}</p>
                    </div>
                  )}
                  <p className="text-[10px] text-warm-gray/60 mt-2">
                    {new Date(req.createdAt).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
