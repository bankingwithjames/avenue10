"use client";

import { useState, useEffect } from "react";

interface ListingOption {
  id: string;
  title: string;
}

export function ContactForm() {
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [form, setForm] = useState({
    checkIn: "",
    checkOut: "",
    guests: "2",
    listingId: "",
    guestName: "",
    guestEmail: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/listings")
      .then((r) => r.json())
      .then((data) => {
        setListings(data);
        if (data.length > 0) setForm((f) => ({ ...f, listingId: data[0].id }));
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: form.listingId,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          guests: parseInt(form.guests),
          guestName: form.guestName,
          guestEmail: form.guestEmail,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: "Inquiry submitted. We'll be in touch shortly." });
        setForm((f) => ({ ...f, checkIn: "", checkOut: "", guestName: "", guestEmail: "", notes: "" }));
      } else {
        setResult({ ok: false, message: data.error || "Something went wrong." });
      }
    } catch {
      setResult({ ok: false, message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full bg-transparent border-b border-white/20 text-white text-sm py-3 outline-none focus:border-white/60 transition-colors placeholder:text-white/25";
  const labelClass =
    "text-[9px] tracking-[0.2em] uppercase text-white/40 font-medium mb-1 block";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Check-in</label>
          <input
            type="date"
            required
            value={form.checkIn}
            onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Check-out</label>
          <input
            type="date"
            required
            value={form.checkOut}
            onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Guests</label>
          <input
            type="number"
            min={1}
            max={10}
            value={form.guests}
            onChange={(e) => setForm({ ...form, guests: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Room Type</label>
          <select
            value={form.listingId}
            onChange={(e) => setForm({ ...form, listingId: e.target.value })}
            className={`${inputClass} bg-stone`}
          >
            <option value="">Any room</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Full Name</label>
        <input
          type="text"
          required
          placeholder="Jane Doe"
          value={form.guestName}
          onChange={(e) => setForm({ ...form, guestName: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          required
          placeholder="you@domain.com"
          value={form.guestEmail}
          onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Message (Optional)</label>
        <textarea
          rows={2}
          placeholder="Occasion, dietary preferences, arrival needs..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full border border-white/40 text-white text-[11px] tracking-[0.2em] uppercase py-4 hover:bg-white hover:text-charcoal transition-all duration-300 font-medium disabled:opacity-40 mt-4"
      >
        {submitting ? "Submitting..." : "Submit Inquiry"}
      </button>

      {result && (
        <p className={`text-xs text-center ${result.ok ? "text-accent" : "text-red-400"}`}>
          {result.message}
        </p>
      )}
    </form>
  );
}
