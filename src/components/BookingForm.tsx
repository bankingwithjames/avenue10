"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface BookingFormProps {
  listingId: string;
  pricePerNight: number;
  cleaningFee: number;
  maxGuests: number;
  minStay?: number;
  maxStay?: number;
  petFee?: number;
  closedDates: string[];
}

export function BookingForm({
  listingId,
  pricePerNight,
  cleaningFee,
  maxGuests,
  minStay = 1,
  maxStay = 30,
  petFee = 0,
}: BookingFormProps) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [hasPets, setHasPets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  const estimatedNightlyTotal = nights * pricePerNight;
  const estimatedPetFee = hasPets ? petFee : 0;
  const estimatedTotal = estimatedNightlyTotal + (nights > 0 ? cleaningFee : 0) + estimatedPetFee;
  const today = new Date().toISOString().split("T")[0];

  const stayError =
    nights > 0 && nights < minStay
      ? `Minimum stay is ${minStay} night${minStay > 1 ? "s" : ""}`
      : nights > maxStay
        ? `Maximum stay is ${maxStay} nights`
        : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stayError) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/booking/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, checkIn, checkOut, guests, hasPets }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }
      router.push(`/checkout/${data.quote.id}`);
    } catch {
      setError("Network error. Please try again.");
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

      {petFee > 0 && (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasPets}
            onChange={(e) => setHasPets(e.target.checked)}
            className="w-4 h-4 accent-charcoal"
          />
          <span className="text-sm text-charcoal">
            Bringing pets <span className="text-warm-gray">(+${petFee} fee)</span>
          </span>
        </label>
      )}

      {stayError && (
        <p className="text-xs text-red-500 text-center">{stayError}</p>
      )}

      {nights > 0 && !stayError && (
        <div className="border-t border-b border-charcoal/10 py-4 text-sm space-y-2">
          <div className="flex justify-between text-charcoal/60">
            <span>${pricePerNight} &times; {nights} night{nights > 1 ? "s" : ""}</span>
            <span>${estimatedNightlyTotal}</span>
          </div>
          {cleaningFee > 0 && (
            <div className="flex justify-between text-charcoal/60">
              <span>Cleaning fee</span>
              <span>${cleaningFee}</span>
            </div>
          )}
          {estimatedPetFee > 0 && (
            <div className="flex justify-between text-charcoal/60">
              <span>Pet fee</span>
              <span>${estimatedPetFee}</span>
            </div>
          )}
          <div className="flex justify-between font-medium text-charcoal pt-1">
            <span>Estimated Total</span>
            <span>${estimatedTotal}</span>
          </div>
          <p className="text-[10px] text-warm-gray/70 pt-1">
            Final pricing calculated at checkout
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || nights === 0 || !!stayError}
        className="w-full border border-charcoal text-charcoal text-[11px] tracking-[0.2em] uppercase py-3.5 hover:bg-charcoal hover:text-white transition-all duration-300 font-medium disabled:opacity-30 disabled:cursor-not-allowed mt-2"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Loading...
          </span>
        ) : (
          "Book Now"
        )}
      </button>
    </form>
  );
}
