"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";

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
  listing: { title: string; slug: string };
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => { loadReservations(); }, []);

  async function loadReservations() {
    const res = await fetch("/api/admin/reservations");
    setReservations(await res.json());
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/reservations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadReservations();
  }

  async function deleteReservation(id: string) {
    if (!confirm("Delete this reservation?")) return;
    await fetch(`/api/admin/reservations/${id}`, { method: "DELETE" });
    loadReservations();
  }

  const filtered = filter === "all" ? reservations : reservations.filter((r) => r.status === filter);

  const statusColors: Record<string, string> = {
    pending: "text-yellow-700",
    confirmed: "text-accent",
    declined: "text-red-500",
    cancelled: "text-warm-gray",
  };

  return (
    <div>
      <h1 className="font-serif text-2xl text-charcoal font-light mb-6">Reservations</h1>

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
          {filtered.map((r) => (
            <div key={r.id} className="bg-white border border-light-gray p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-charcoal text-sm">{r.guestName}</h3>
                    <span className={`text-[9px] tracking-[0.1em] uppercase font-medium ${statusColors[r.status] || "text-warm-gray"}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-warm-gray">
                    {r.listing.title} &middot; {new Date(r.checkIn).toLocaleDateString()} &ndash; {new Date(r.checkOut).toLocaleDateString()} &middot; {r.guests} guest{r.guests > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-warm-gray">
                    {r.guestEmail}{r.guestPhone && ` | ${r.guestPhone}`}
                  </p>
                  {r.notes && <p className="text-xs text-warm-gray italic">Note: {r.notes}</p>}
                  <p className="text-xs font-medium text-charcoal">Total: ${r.totalPrice}</p>
                </div>

                <div className="flex gap-2 shrink-0">
                  {r.status === "pending" && (
                    <>
                      <button onClick={() => updateStatus(r.id, "confirmed")} className="flex items-center gap-1 text-accent border border-accent/30 hover:bg-accent/10 px-3 py-1.5 text-xs transition">
                        <CheckCircle size={12} /> Accept
                      </button>
                      <button onClick={() => updateStatus(r.id, "declined")} className="flex items-center gap-1 text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1.5 text-xs transition">
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
