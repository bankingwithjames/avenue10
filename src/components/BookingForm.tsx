"use client";

import { useState } from "react";

interface BookingFormProps {
  listingId: string;
  pricePerNight: number;
  cleaningFee: number;
  maxGuests: number;
  closedDates: string[];
}

export function BookingForm({
  listingId,
  pricePerNight,
  cleaningFee,
  maxGuests,
  closedDates,
}: BookingFormProps) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const nights =
    checkIn && checkOut
      ? Math.max(
          0,
          Math.ceil(
            (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  const total = nights * pricePerNight + (nights > 0 ? cleaningFee : 0);
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          guests,
          guestName,
          guestEmail,
          guestPhone,
          notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: "Request submitted. We'll confirm shortly." });
        setCheckIn("");
        setCheckOut("");
        setGuests(1);
        setGuestName("");
        setGuestEmail("");
        setGuestPhone("");
        setNotes("");
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
    "w-full bg-transparent border-b border-charcoal/15 text-charcoal text-sm py-2.5 outline-none focus:border-charcoal/50 transition-colors placeholder:text-warm-gray/50";
  const labelClass =
    "text-[9px] tracking-[0.2em] uppercase text-warm-gray font-medium mb-1 block";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Check-in</label>
          <input
            type="date"
            required
            min={today}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Check-out</label>
          <input
            type="date"
            required
            min={checkIn || today}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Guests</label>
        <select
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className={`${inputClass} bg-cream`}
        >
          {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} guest{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>

      {nights > 0 && (
        <div className="border-t border-b border-charcoal/10 py-4 text-sm space-y-2">
          <div className="flex justify-between text-charcoal/60">
            <span>${pricePerNight} &times; {nights} night{nights > 1 ? "s" : ""}</span>
            <span>${nights * pricePerNight}</span>
          </div>
          {cleaningFee > 0 && (
            <div className="flex justify-between text-charcoal/60">
              <span>Cleaning fee</span>
              <span>${cleaningFee}</span>
            </div>
          )}
          <div className="flex justify-between font-medium text-charcoal pt-1">
            <span>Total</span>
            <span>${total}</span>
          </div>
        </div>
      )}

      <div>
        <label className={labelClass}>Full Name</label>
        <input
          type="text"
          required
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input
          type="email"
          required
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Phone (optional)</label>
        <input
          type="tel"
          value={guestPhone}
          onChange={(e) => setGuestPhone(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Notes (optional)</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={submitting || nights === 0}
        className="w-full border border-charcoal text-charcoal text-[11px] tracking-[0.2em] uppercase py-3.5 hover:bg-charcoal hover:text-white transition-all duration-300 font-medium disabled:opacity-30 disabled:cursor-not-allowed mt-2"
      >
        {submitting ? "Submitting..." : "Request to Book"}
      </button>

      {result && (
        <p className={`text-xs text-center ${result.ok ? "text-accent" : "text-red-500"}`}>
          {result.message}
        </p>
      )}
    </form>
  );
}
