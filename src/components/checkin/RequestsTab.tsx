"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare, Send, Clock, CheckCircle, AlertCircle, ChevronDown,
  Wrench, SprayCan, Package, Wifi, KeyRound, Volume2, Sun, Moon,
  ShoppingBag, DollarSign, HelpCircle, Circle,
} from "lucide-react";

interface GuestRequest {
  id: string;
  type: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "maintenance", label: "Maintenance Issue", icon: Wrench },
  { value: "cleaning", label: "Cleaning Issue", icon: SprayCan },
  { value: "missing-item", label: "Missing Item", icon: Package },
  { value: "wifi", label: "WiFi Issue", icon: Wifi },
  { value: "door-code", label: "Door Code Issue", icon: KeyRound },
  { value: "noise", label: "Noise Concern", icon: Volume2 },
  { value: "early-checkin", label: "Early Check-in", icon: Sun },
  { value: "late-checkout", label: "Late Checkout", icon: Moon },
  { value: "extra-supplies", label: "Extra Supplies", icon: ShoppingBag },
  { value: "refund", label: "Refund/Complaint", icon: DollarSign },
  { value: "general", label: "General Question", icon: HelpCircle },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof Clock }> = {
  new: { color: "text-blue-700", bg: "bg-blue-50", icon: Circle },
  open: { color: "text-amber-700", bg: "bg-amber-50", icon: AlertCircle },
  "in-progress": { color: "text-purple-700", bg: "bg-purple-50", icon: Clock },
  "waiting-on-guest": { color: "text-orange-700", bg: "bg-orange-50", icon: AlertCircle },
  resolved: { color: "text-green-700", bg: "bg-green-50", icon: CheckCircle },
  closed: { color: "text-gray-600", bg: "bg-gray-100", icon: CheckCircle },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-gray-600 bg-gray-50",
  normal: "text-blue-700 bg-blue-50",
  high: "text-amber-700 bg-amber-50",
  urgent: "text-red-700 bg-red-50",
};

export function RequestsTab({ token }: { token: string }) {
  const [requests, setRequests] = useState<GuestRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
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
      body: JSON.stringify({ type: "request", message, category, priority }),
    });

    if (res.ok) {
      setMessage("");
      setCategory("general");
      setPriority("normal");
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
          <h2 className="text-lg font-medium text-charcoal mb-1">Submit Request</h2>
          <p className="text-xs text-warm-gray">
            Need something during your stay? Let us know and we will respond promptly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-warm-gray mb-2 font-medium">
                Category
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-light-gray px-4 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:border-charcoal appearance-none pr-8"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] tracking-[0.15em] uppercase text-warm-gray mb-2 font-medium">
                Priority
              </label>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`flex-1 px-3 py-2.5 text-[10px] tracking-[0.1em] uppercase font-medium border transition-colors ${
                      priority === p.value
                        ? "bg-charcoal text-white border-charcoal"
                        : "bg-white text-warm-gray border-light-gray hover:border-charcoal"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
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
              placeholder="Describe your request in detail..."
            />
          </div>

          <button
            type="submit"
            disabled={!message.trim() || submitting}
            className="flex items-center gap-2 bg-charcoal text-white px-6 py-3 text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-charcoal/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            {submitting ? "Sending..." : "Submit Request"}
          </button>
        </form>
      </div>

      {/* Request History */}
      {requests.length > 0 && (
        <div className="bg-white border border-light-gray">
          <div className="px-6 py-4 border-b border-light-gray bg-cream/50">
            <h3 className="text-[11px] tracking-[0.15em] uppercase font-medium text-charcoal">
              Request History
            </h3>
          </div>
          <div className="divide-y divide-light-gray">
            {requests.map((req) => {
              const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.new;
              const StatusIcon = statusCfg.icon;
              const catLabel = CATEGORIES.find((c) => c.value === req.category)?.label || req.category;
              const priorityColor = PRIORITY_COLORS[req.priority] || PRIORITY_COLORS.normal;
              return (
                <div key={req.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-[9px] tracking-[0.15em] uppercase font-medium px-2 py-0.5 ${statusCfg.bg} ${statusCfg.color}`}>
                      <StatusIcon size={10} className="inline mr-1 -mt-px" />
                      {req.status.replace(/-/g, " ")}
                    </span>
                    <span className="text-[9px] tracking-[0.15em] uppercase font-medium px-2 py-0.5 bg-cream text-charcoal">
                      {catLabel}
                    </span>
                    <span className={`text-[9px] tracking-[0.15em] uppercase font-medium px-2 py-0.5 ${priorityColor}`}>
                      {req.priority}
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
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-[10px] text-warm-gray/60">
                      Submitted {new Date(req.createdAt).toLocaleString()}
                    </p>
                    {req.updatedAt !== req.createdAt && (
                      <p className="text-[10px] text-warm-gray/60">
                        Updated {new Date(req.updatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
