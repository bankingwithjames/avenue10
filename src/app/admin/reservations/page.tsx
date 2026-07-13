"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface Reservation {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: string;
  notes: string | null;
  createdAt: string;
  accessCode: string | null;
  confirmationCode: string | null;
  bookingMode: string | null;
  subtotal: number | null;
  cleaningFeeCharged: number | null;
  petFeeCharged: number | null;
  extraGuestFeeCharged: number | null;
  taxAmount: number | null;
  paymentStatus: string;
  adminNotes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  declinedReason: string | null;
  listing: { title: string; slug: string };
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [decliningId, setDecliningId] = useState<string | null>(null);

  useEffect(() => { loadReservations(); }, []);

  async function loadReservations() {
    const res = await fetch("/api/admin/reservations");
    if (res.ok) setReservations(await res.json());
  }

  async function updateStatus(id: string, status: string, extra?: Record<string, string>) {
    await fetch(`/api/admin/reservations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...extra }),
    });
    setDecliningId(null);
    setDeclineReason("");
    loadReservations();
  }

  async function deleteReservation(id: string) {
    if (!confirm("Delete this reservation?")) return;
    await fetch(`/api/admin/reservations/${id}`, { method: "DELETE" });
    loadReservations();
  }

  const filtered = filter === "all" ? reservations : reservations.filter((r) => r.status === filter);

  const statusColors: Record<string, string> = {
    pending: "text-yellow-700 bg-yellow-50",
    confirmed: "text-green-700 bg-green-50",
    declined: "text-red-600 bg-red-50",
    cancelled: "text-warm-gray bg-cream",
  };

  const pendingCount = reservations.filter((r) => r.status === "pending").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-charcoal font-light">Reservations</h1>
        {pendingCount > 0 && (
          <span className="bg-yellow-100 text-yellow-800 text-[10px] tracking-[0.1em] uppercase font-medium px-3 py-1.5">
            {pendingCount} pending approval
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "pending", "confirmed", "declined", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 text-[10px] tracking-[0.15em] uppercase font-medium transition ${
              filter === s
                ? "bg-charcoal text-white"
                : "bg-white text-charcoal border border-light-gray hover:bg-cream"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== "all" && (
              <span className="ml-1.5 opacity-50">
                ({reservations.filter((r) => r.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-warm-gray text-sm text-center py-12">No reservations found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const isExpanded = expanded === r.id;
            return (
              <div key={r.id} className="bg-white border border-light-gray">
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-charcoal text-sm">{r.guestName}</h3>
                        <span className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 ${statusColors[r.status] || "text-warm-gray"}`}>
                          {r.status}
                        </span>
                        {r.confirmationCode && (
                          <span className="font-mono text-[10px] text-charcoal/50">{r.confirmationCode}</span>
                        )}
                        {r.bookingMode && (
                          <span className="text-[9px] text-warm-gray border border-light-gray px-1.5 py-0.5">
                            {r.bookingMode.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-warm-gray">
                        {r.listing.title} &middot;{" "}
                        {new Date(r.checkIn).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} &ndash;{" "}
                        {new Date(r.checkOut).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })} &middot;{" "}
                        {r.guests} guest{r.guests > 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-warm-gray">
                        {r.guestEmail}{r.guestPhone && ` | ${r.guestPhone}`}
                      </p>
                      <p className="text-sm font-medium text-charcoal">${r.totalPrice.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {r.status === "pending" && (
                        <>
                          <button onClick={() => updateStatus(r.id, "confirmed")} className="flex items-center gap-1 text-green-700 border border-green-200 hover:bg-green-50 px-3 py-1.5 text-xs transition">
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button
                            onClick={() => setDecliningId(decliningId === r.id ? null : r.id)}
                            className="flex items-center gap-1 text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1.5 text-xs transition"
                          >
                            <XCircle size={12} /> Decline
                          </button>
                        </>
                      )}
                      {r.status === "confirmed" && (
                        <button onClick={() => updateStatus(r.id, "cancelled")} className="flex items-center gap-1 text-warm-gray border border-light-gray hover:bg-cream px-3 py-1.5 text-xs transition">
                          <Clock size={12} /> Cancel
                        </button>
                      )}
                      <button onClick={() => deleteReservation(r.id)} className="flex items-center gap-1 border border-red-200 text-red-400 hover:bg-red-50 px-2.5 py-1.5 text-xs transition">
                        <Trash2 size={12} />
                      </button>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : r.id)}
                        className="text-warm-gray hover:text-charcoal transition p-1.5"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {decliningId === r.id && (
                    <div className="mt-4 flex gap-2">
                      <input
                        type="text"
                        placeholder="Reason for declining (optional)"
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        className="flex-1 border border-light-gray text-xs px-3 py-2 focus:border-charcoal/40 outline-none"
                      />
                      <button
                        onClick={() => updateStatus(r.id, "declined", { declinedReason: declineReason })}
                        className="bg-red-500 text-white text-xs px-4 py-2 hover:bg-red-600 transition"
                      >
                        Confirm Decline
                      </button>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-light-gray px-5 py-4 bg-cream/50 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      {r.accessCode && (
                        <div>
                          <span className="text-[9px] tracking-[0.1em] uppercase text-warm-gray block mb-0.5">Access Code</span>
                          <span className="font-mono font-medium text-charcoal">{r.accessCode}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-[9px] tracking-[0.1em] uppercase text-warm-gray block mb-0.5">Payment</span>
                        <span className="text-charcoal">{r.paymentStatus || "none"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] tracking-[0.1em] uppercase text-warm-gray block mb-0.5">Booked</span>
                        <span className="text-charcoal">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      {r.approvedAt && (
                        <div>
                          <span className="text-[9px] tracking-[0.1em] uppercase text-warm-gray block mb-0.5">Approved</span>
                          <span className="text-charcoal">{new Date(r.approvedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    {r.subtotal != null && (
                      <div className="text-xs space-y-1 border-t border-light-gray pt-3">
                        <div className="flex justify-between text-charcoal/60">
                          <span>Subtotal</span>
                          <span>${r.subtotal.toFixed(2)}</span>
                        </div>
                        {(r.cleaningFeeCharged ?? 0) > 0 && (
                          <div className="flex justify-between text-charcoal/60">
                            <span>Cleaning</span>
                            <span>${r.cleaningFeeCharged!.toFixed(2)}</span>
                          </div>
                        )}
                        {(r.petFeeCharged ?? 0) > 0 && (
                          <div className="flex justify-between text-charcoal/60">
                            <span>Pet fee</span>
                            <span>${r.petFeeCharged!.toFixed(2)}</span>
                          </div>
                        )}
                        {(r.extraGuestFeeCharged ?? 0) > 0 && (
                          <div className="flex justify-between text-charcoal/60">
                            <span>Extra guest fee</span>
                            <span>${r.extraGuestFeeCharged!.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium text-charcoal pt-1 border-t border-light-gray">
                          <span>Total</span>
                          <span>${r.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                    {r.notes && (
                      <div className="text-xs">
                        <span className="text-[9px] tracking-[0.1em] uppercase text-warm-gray block mb-0.5">Guest Notes</span>
                        <p className="text-charcoal/70 italic">{r.notes.replace(/\{[^}]*"street"[^}]*\}/g, (match) => {
                          try {
                            const addr = JSON.parse(match);
                            return [addr.street, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(", ");
                          } catch { return match; }
                        })}</p>
                      </div>
                    )}
                    {r.declinedReason && (
                      <div className="text-xs">
                        <span className="text-[9px] tracking-[0.1em] uppercase text-red-400 block mb-0.5">Decline Reason</span>
                        <p className="text-charcoal/70">{r.declinedReason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
