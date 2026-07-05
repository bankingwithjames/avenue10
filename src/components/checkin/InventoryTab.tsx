"use client";

import { useState, useEffect } from "react";
import { Package, AlertTriangle, Send, X, ChevronDown } from "lucide-react";

interface InventoryItem {
  id: string;
  room: string;
  itemName: string;
  category: string;
  quantity: number;
  quantityExpected: number;
  condition: string;
}

const REPORT_TYPES = [
  "Missing Item",
  "Damaged Item",
  "Not Enough Quantity",
  "Cleaning Issue",
  "Other",
];

export function InventoryTab({ token }: { token: string }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [reportDescription, setReportDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/checkin/inventory", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      });
  }, [token]);

  async function handleReport(itemId: string) {
    setSubmitting(true);
    const res = await fetch("/api/checkin/inventory-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        itemId,
        reportType,
        description: reportDescription.trim(),
      }),
    });

    if (res.ok) {
      setSubmitted((prev) => new Set(prev).add(itemId));
      setReportingId(null);
      setReportType(REPORT_TYPES[0]);
      setReportDescription("");
    }
    setSubmitting(false);
  }

  if (loading) return <p className="text-sm text-warm-gray">Loading inventory...</p>;

  const rooms = items.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    (acc[item.room] ||= []).push(item);
    return acc;
  }, {});

  if (Object.keys(rooms).length === 0) {
    return (
      <div className="bg-white border border-light-gray p-8 text-center">
        <Package size={32} className="mx-auto text-warm-gray/40 mb-3" />
        <p className="text-sm text-warm-gray">Inventory has not been set up yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-light-gray p-6">
        <h2 className="text-lg font-medium text-charcoal mb-1">Property Inventory</h2>
        <p className="text-xs text-warm-gray">
          Items provided for your stay, listed by room. Please report any discrepancies.
        </p>
      </div>

      {Object.entries(rooms).map(([room, roomItems]) => (
        <div key={room} className="bg-white border border-light-gray">
          <div className="px-6 py-4 border-b border-light-gray bg-cream/50">
            <h3 className="text-[11px] tracking-[0.15em] uppercase font-medium text-charcoal">
              {room}
            </h3>
          </div>
          <div className="divide-y divide-light-gray">
            {roomItems.map((item) => (
              <div key={item.id}>
                <div className="px-6 py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-charcoal">{item.itemName}</span>
                    <div className="flex items-center gap-3 mt-0.5">
                      {item.category !== "General" && (
                        <span className="text-[9px] tracking-[0.1em] uppercase text-warm-gray/60">
                          {item.category}
                        </span>
                      )}
                      <span className="text-[9px] tracking-[0.1em] uppercase text-warm-gray/60">
                        Condition: {item.condition}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-warm-gray bg-cream px-3 py-1">
                      Qty: {item.quantityExpected}
                    </span>
                    {submitted.has(item.id) ? (
                      <span className="text-[9px] tracking-[0.1em] uppercase text-green-700 bg-green-50 px-2 py-1">
                        Reported
                      </span>
                    ) : (
                      <button
                        onClick={() => setReportingId(reportingId === item.id ? null : item.id)}
                        className="flex items-center gap-1 text-[9px] tracking-[0.1em] uppercase text-warm-gray hover:text-charcoal border border-light-gray px-2 py-1 transition-colors"
                      >
                        <AlertTriangle size={10} /> Report Issue
                      </button>
                    )}
                  </div>
                </div>

                {/* Report form */}
                {reportingId === item.id && (
                  <div className="px-6 pb-4">
                    <div className="bg-cream border border-light-gray p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium">
                          Report Issue — {item.itemName}
                        </span>
                        <button onClick={() => setReportingId(null)} className="text-warm-gray hover:text-charcoal">
                          <X size={14} />
                        </button>
                      </div>
                      <div>
                        <label className="block text-[10px] tracking-[0.15em] uppercase text-warm-gray mb-1 font-medium">
                          Report Type
                        </label>
                        <div className="relative">
                          <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="w-full border border-light-gray px-3 py-2 text-sm text-charcoal bg-white focus:outline-none focus:border-charcoal appearance-none pr-8"
                          >
                            {REPORT_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] tracking-[0.15em] uppercase text-warm-gray mb-1 font-medium">
                          Description
                        </label>
                        <textarea
                          value={reportDescription}
                          onChange={(e) => setReportDescription(e.target.value)}
                          rows={3}
                          className="w-full border border-light-gray px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-charcoal resize-none"
                          placeholder="Describe the issue..."
                        />
                      </div>
                      <button
                        onClick={() => handleReport(item.id)}
                        disabled={submitting}
                        className="flex items-center gap-2 bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90 transition-colors disabled:opacity-30"
                      >
                        <Send size={12} />
                        {submitting ? "Submitting..." : "Submit Report"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
