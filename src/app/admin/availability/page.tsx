"use client";

import { useEffect, useState } from "react";
import { CalendarOff, Plus, Trash2 } from "lucide-react";

interface Listing { id: string; title: string; }
interface ClosedDate { id: string; date: string; reason: string | null; }

export default function AdminAvailabilityPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState("");
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [newDates, setNewDates] = useState("");
  const [reason, setReason] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/admin/listings")
      .then((r) => r.json())
      .then((data) => {
        setListings(data);
        if (data.length > 0) setSelectedListing(data[0].id);
      });
  }, []);

  useEffect(() => { if (selectedListing) loadClosedDates(); }, [selectedListing]);

  async function loadClosedDates() {
    const res = await fetch(`/api/admin/availability?listingId=${selectedListing}`);
    setClosedDates(await res.json());
  }

  async function addClosedDates(e: React.FormEvent) {
    e.preventDefault();
    if (!newDates) return;
    setAdding(true);
    const dates = newDates.split(",").map((d) => d.trim()).filter(Boolean);
    await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: selectedListing, dates, reason: reason || null }),
    });
    setNewDates("");
    setReason("");
    setAdding(false);
    loadClosedDates();
  }

  async function removeDates(ids: string[]) {
    await fetch("/api/admin/availability", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    loadClosedDates();
  }

  const inputClass = "w-full bg-transparent border border-light-gray text-charcoal text-sm px-3 py-2.5 outline-none focus:border-charcoal/40 transition-colors";
  const labelClass = "text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1 block";

  return (
    <div>
      <h1 className="font-serif text-2xl text-charcoal font-light mb-6">Availability & Closed Days</h1>

      <div className="mb-6">
        <label className={labelClass}>Select Property</label>
        <select value={selectedListing} onChange={(e) => setSelectedListing(e.target.value)} className={`${inputClass} max-w-xs`}>
          {listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
      </div>

      <div className="bg-white border border-light-gray p-6 mb-6">
        <h2 className="text-sm font-medium text-charcoal mb-4 flex items-center gap-2">
          <Plus size={16} /> Add Closed Dates
        </h2>
        <form onSubmit={addClosedDates} className="space-y-3">
          <div>
            <label className={labelClass}>Dates (comma-separated, e.g. 2026-07-04, 2026-07-05)</label>
            <input value={newDates} onChange={(e) => setNewDates(e.target.value)} placeholder="2026-07-04, 2026-07-05" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Reason (optional)</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Maintenance, Owner use" className={inputClass} />
          </div>
          <button type="submit" disabled={adding || !newDates} className="bg-charcoal text-white px-6 py-2.5 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition disabled:opacity-40">
            {adding ? "Adding..." : "Block Dates"}
          </button>
        </form>
      </div>

      <div className="bg-white border border-light-gray p-6">
        <h2 className="text-sm font-medium text-charcoal mb-4 flex items-center gap-2">
          <CalendarOff size={16} /> Blocked Dates
        </h2>
        {closedDates.length === 0 ? (
          <p className="text-warm-gray text-xs">No blocked dates for this property.</p>
        ) : (
          <div className="space-y-2">
            {closedDates.map((cd) => (
              <div key={cd.id} className="flex items-center justify-between bg-cream px-4 py-2.5">
                <div>
                  <span className="text-sm text-charcoal">{new Date(cd.date).toLocaleDateString()}</span>
                  {cd.reason && <span className="text-xs text-warm-gray ml-2">({cd.reason})</span>}
                </div>
                <button onClick={() => removeDates([cd.id])} className="text-red-400 hover:text-red-600 transition">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
