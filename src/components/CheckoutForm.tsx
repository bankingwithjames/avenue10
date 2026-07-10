"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Clock, CheckCircle, Loader2 } from "lucide-react";

interface Quote {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  nightlyBreakdown: { date: string; rate: number; source: string }[];
  subtotal: number;
  cleaningFee: number;
  petFee: number;
  extraGuestFee: number;
  taxAmount: number;
  total: number;
  expiresAt: string;
  listing: {
    id: string;
    title: string;
    slug: string;
    type: string;
    photos: string[];
    maxGuests: number;
  };
}

interface BookingResult {
  id: string;
  confirmationCode: string;
  status: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  guestName: string;
  listingTitle: string;
}

export function CheckoutForm({ quoteId }: { quoteId: string }) {
  const router = useRouter();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<BookingResult | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  useEffect(() => {
    async function loadQuote() {
      try {
        const res = await fetch(`/api/booking/quote?id=${quoteId}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load quote");
          return;
        }
        setQuote(data.quote);
      } catch {
        setError("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    }
    loadQuote();
  }, [quoteId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/booking/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          firstName,
          lastName,
          email,
          phone,
          specialRequests,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Booking failed");
        setSubmitting(false);
        return;
      }
      setBooking(data.reservation);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const labelClass =
    "text-[9px] tracking-[0.2em] uppercase text-warm-gray font-medium mb-1.5 block";
  const inputClass =
    "w-full border border-light-gray text-charcoal text-sm px-4 py-3 focus:border-charcoal/40 outline-none transition-colors";

  if (booking) {
    return (
      <div className="max-w-xl mx-auto px-6">
        <div className="bg-white border border-light-gray p-10 text-center">
          <CheckCircle size={48} className="text-accent mx-auto mb-6" />
          <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-3 font-medium">
            {booking.status === "confirmed"
              ? "Booking Confirmed"
              : "Request Received"}
          </p>
          <h1 className="font-serif text-3xl text-charcoal mb-2">
            {booking.status === "confirmed"
              ? "You're All Set"
              : "We'll Be in Touch"}
          </h1>
          <p className="text-sm text-charcoal/60 mb-8">
            {booking.status === "confirmed"
              ? "Your reservation has been confirmed. You'll receive a confirmation email shortly."
              : "Your booking request has been submitted. We'll review it and get back to you soon."}
          </p>

          <div className="border-t border-light-gray pt-8 space-y-4 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-warm-gray">Confirmation</span>
              <span className="text-charcoal font-medium">
                {booking.confirmationCode}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-warm-gray">Property</span>
              <span className="text-charcoal">{booking.listingTitle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-warm-gray">Check-in</span>
              <span className="text-charcoal">
                {new Date(booking.checkIn).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-warm-gray">Check-out</span>
              <span className="text-charcoal">
                {new Date(booking.checkOut).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-warm-gray">Guests</span>
              <span className="text-charcoal">{booking.guests}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-light-gray pt-4">
              <span className="text-charcoal font-medium">Total</span>
              <span className="text-charcoal font-medium">
                ${booking.totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={() => router.push("/")}
            className="mt-10 w-full border border-charcoal text-charcoal text-[10px] tracking-[0.15em] uppercase py-3.5 hover:bg-charcoal hover:text-white transition-all duration-300 font-medium"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={24} className="animate-spin text-warm-gray" />
      </div>
    );
  }

  if (error && !quote) {
    return (
      <div className="max-w-xl mx-auto px-6 text-center">
        <h1 className="font-serif text-2xl text-charcoal mb-4">
          Quote Unavailable
        </h1>
        <p className="text-sm text-charcoal/60 mb-8">{error}</p>
        <button
          onClick={() => router.push("/listings")}
          className="border border-charcoal text-charcoal text-[10px] tracking-[0.15em] uppercase px-8 py-3 hover:bg-charcoal hover:text-white transition-all duration-300 font-medium"
        >
          Browse Properties
        </button>
      </div>
    );
  }

  if (!quote) return null;

  const checkInDate = new Date(quote.checkIn);
  const checkOutDate = new Date(quote.checkOut);
  const expiresAt = new Date(quote.expiresAt);
  const minutesLeft = Math.max(
    0,
    Math.ceil((expiresAt.getTime() - Date.now()) / 60000)
  );

  return (
    <div className="max-w-[1100px] mx-auto px-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-xs text-warm-gray hover:text-charcoal transition-colors mb-8"
      >
        <ArrowLeft size={14} />
        <span className="tracking-[0.1em] uppercase">Back</span>
      </button>

      <h1 className="font-serif text-3xl md:text-4xl text-charcoal mb-2">
        Complete Your Reservation
      </h1>
      <p className="text-sm text-charcoal/50 mb-12">
        {quote.listing.title} &middot; {quote.nights} night
        {quote.nights > 1 ? "s" : ""}
      </p>

      <div className="grid md:grid-cols-5 gap-12">
        <div className="md:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-6 font-medium">
                Guest Information
              </p>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone (optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Special Requests (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase py-4 hover:bg-stone transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Processing...
                </span>
              ) : (
                "Confirm Booking"
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-warm-gray">
              <Shield size={12} />
              <span>Your information is secure and encrypted</span>
            </div>
          </form>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white border border-light-gray p-8 sticky top-24">
            {quote.listing.photos[0] && (
              <img
                src={quote.listing.photos[0]}
                alt={quote.listing.title}
                className="w-full h-40 object-cover mb-6"
              />
            )}
            <p className="text-[10px] tracking-[0.2em] uppercase text-warm-gray mb-1 font-medium">
              {quote.listing.type}
            </p>
            <h3 className="font-serif text-xl text-charcoal mb-6">
              {quote.listing.title}
            </h3>

            <div className="space-y-3 text-sm border-t border-light-gray pt-6">
              <div className="flex justify-between text-charcoal/60">
                <span>
                  {checkInDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  –{" "}
                  {checkOutDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span>
                  {quote.guests} guest{quote.guests > 1 ? "s" : ""}
                </span>
              </div>

              <div className="border-t border-light-gray pt-3 space-y-2">
                <div className="flex justify-between text-charcoal/60">
                  <span>
                    {quote.nights} night{quote.nights > 1 ? "s" : ""}
                  </span>
                  <span>${quote.subtotal.toFixed(2)}</span>
                </div>
                {quote.cleaningFee > 0 && (
                  <div className="flex justify-between text-charcoal/60">
                    <span>Cleaning fee</span>
                    <span>${quote.cleaningFee.toFixed(2)}</span>
                  </div>
                )}
                {quote.petFee > 0 && (
                  <div className="flex justify-between text-charcoal/60">
                    <span>Pet fee</span>
                    <span>${quote.petFee.toFixed(2)}</span>
                  </div>
                )}
                {quote.extraGuestFee > 0 && (
                  <div className="flex justify-between text-charcoal/60">
                    <span>Extra guest fee</span>
                    <span>${quote.extraGuestFee.toFixed(2)}</span>
                  </div>
                )}
                {quote.taxAmount > 0 && (
                  <div className="flex justify-between text-charcoal/60">
                    <span>Taxes</span>
                    <span>${quote.taxAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between font-medium text-charcoal border-t border-light-gray pt-3">
                <span>Total</span>
                <span>${quote.total.toFixed(2)}</span>
              </div>
            </div>

            {minutesLeft > 0 && minutesLeft <= 10 && (
              <div className="mt-6 flex items-center gap-2 text-[10px] text-accent">
                <Clock size={12} />
                <span>
                  Quote expires in {minutesLeft} minute
                  {minutesLeft > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
