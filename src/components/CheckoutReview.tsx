"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Clock,
  CheckCircle,
  Loader2,
  Lock,
  Edit3,
} from "lucide-react";

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
  serviceFee: number;
  depositHold: number;
  addOnsTotal: number;
  addOnsBreakdown: { name: string; price: number }[] | null;
  promoCode: string | null;
  promoDiscount: number;
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

interface BookingRule {
  bookingMode: string;
  cancellationPolicy: string;
  depositPercent: number;
  depositFlat: number;
  requireAgreement: boolean;
  extraGuestFeeType?: string;
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

interface CheckoutData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  specialRequests: string;
  selectedAddOns: string[];
  earlyCheckin?: boolean;
  lateCheckout?: boolean;
  needsCrib?: boolean;
  needsHighChair?: boolean;
  agreedToRules: boolean;
  paymentMethod: string;
}

const CANCELLATION_POLICIES: Record<
  string,
  { label: string; description: string }
> = {
  flexible: {
    label: "Flexible",
    description:
      "Free cancellation up to 5 days before check-in. After that, the first night is non-refundable.",
  },
  moderate: {
    label: "Moderate",
    description:
      "Free cancellation up to 14 days before check-in. 50% refund after that.",
  },
  strict: {
    label: "Strict",
    description:
      "50% refund up to 30 days before check-in. No refund after that.",
  },
};

function storageKey(quoteId: string) {
  return `avenue10_checkout_${quoteId}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function calculateDeposit(total: number, rule: BookingRule | null): number {
  if (!rule) return 0;
  if (rule.depositPercent > 0) {
    return Math.round(total * (rule.depositPercent / 100) * 100) / 100;
  }
  if (rule.depositFlat > 0) {
    return rule.depositFlat;
  }
  return 0;
}

export function CheckoutReview({ quoteId }: { quoteId: string }) {
  const router = useRouter();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [rule, setRule] = useState<BookingRule | null>(null);
  const [formData, setFormData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<BookingResult | null>(null);

  useEffect(() => {
    async function loadData() {
      // Load saved form data
      try {
        const saved = localStorage.getItem(storageKey(quoteId));
        if (!saved) {
          // No form data — redirect back to checkout
          router.replace(`/checkout/${quoteId}`);
          return;
        }
        setFormData(JSON.parse(saved) as CheckoutData);
      } catch {
        router.replace(`/checkout/${quoteId}`);
        return;
      }

      // Load quote
      try {
        const res = await fetch(`/api/booking/quote?id=${quoteId}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load quote");
          return;
        }
        setQuote(data.quote);

        // Load booking rules
        const rulesRes = await fetch(
          `/api/booking/rules?listingId=${data.quote.listing.id}`
        );
        const rulesData = await rulesRes.json();
        if (rulesRes.ok) {
          setRule(rulesData.rule);
        }
      } catch {
        setError("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [quoteId, router]);

  async function handleSubmit() {
    if (!quote || !formData) return;
    setSubmitting(true);
    setError("");

    const depositAmount = calculateDeposit(quote.total, rule);

    try {
      const res = await fetch("/api/booking/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          specialRequests: formData.specialRequests,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            country: formData.country,
          },
          agreedToRules: formData.agreedToRules,
          depositAmount,
          selectedAddOns: formData.selectedAddOns,
          paymentMethod: formData.paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Booking failed");
        setSubmitting(false);
        return;
      }

      // Clear localStorage
      try {
        localStorage.removeItem(storageKey(quoteId));
      } catch {
        // ignore
      }

      setBooking(data.reservation);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const sectionHeaderClass =
    "text-[10px] tracking-[0.3em] uppercase text-warm-gray font-medium mb-4";

  // Confirmation view
  if (booking) {
    return (
      <div className="max-w-xl mx-auto px-6">
        <div className="bg-white border border-light-gray p-10 text-center">
          <CheckCircle size={48} className="text-accent mx-auto mb-6" />
          <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-3 font-medium">
            Request Received
          </p>
          <h1 className="font-serif text-3xl text-charcoal mb-2">
            We&apos;ll Be in Touch
          </h1>
          <p className="text-sm text-charcoal/60 mb-8">
            Your booking request has been submitted. We&apos;ll review it and
            get back to you soon.
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
                {formatDate(booking.checkIn)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-warm-gray">Check-out</span>
              <span className="text-charcoal">
                {formatDate(booking.checkOut)}
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
          Unable to Load Review
        </h1>
        <p className="text-sm text-charcoal/60 mb-8">{error}</p>
        <button
          onClick={() => router.push(`/checkout/${quoteId}`)}
          className="border border-charcoal text-charcoal text-[10px] tracking-[0.15em] uppercase px-8 py-3 hover:bg-charcoal hover:text-white transition-all duration-300 font-medium"
        >
          Back to Checkout
        </button>
      </div>
    );
  }

  if (!quote || !formData) return null;

  const checkInDate = new Date(quote.checkIn);
  const checkOutDate = new Date(quote.checkOut);
  const expiresAt = new Date(quote.expiresAt);
  const minutesLeft = Math.max(
    0,
    Math.ceil((expiresAt.getTime() - Date.now()) / 60000)
  );

  const cancellation =
    CANCELLATION_POLICIES[rule?.cancellationPolicy ?? "flexible"] ??
    CANCELLATION_POLICIES.flexible;

  const depositAmount = calculateDeposit(quote.total, rule);

  const selectedAddOnNames = formData.selectedAddOns ?? [];
  const hasSpecialRequests =
    formData.specialRequests.trim() || selectedAddOnNames.length > 0;

  return (
    <div className="max-w-[1100px] mx-auto px-6">
      <button
        onClick={() => router.push(`/checkout/${quoteId}`)}
        className="flex items-center gap-2 text-xs text-warm-gray hover:text-charcoal transition-colors mb-8"
      >
        <ArrowLeft size={14} />
        <span className="tracking-[0.1em] uppercase">Back to Checkout</span>
      </button>

      <h1 className="font-serif text-3xl md:text-4xl text-charcoal mb-2">
        Review Your Reservation
      </h1>
      <p className="text-sm text-charcoal/50 mb-12">
        Please confirm the details below before submitting.
      </p>

      <div className="grid md:grid-cols-5 gap-12">
        {/* Left column — review sections */}
        <div className="md:col-span-3 space-y-8">
          {/* 1. Guest Information */}
          <div className="bg-white border border-light-gray p-8">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray font-medium">
                Guest Information
              </p>
              <a
                href={`/checkout/${quoteId}`}
                className="flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase text-warm-gray hover:text-charcoal transition-colors"
              >
                <Edit3 size={12} />
                Edit
              </a>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-warm-gray">Name</span>
                <span className="text-charcoal">
                  {formData.firstName} {formData.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-gray">Email</span>
                <span className="text-charcoal">{formData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-gray">Phone</span>
                <span className="text-charcoal">{formData.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-gray">Address</span>
                <span className="text-charcoal text-right max-w-[60%]">
                  {formData.street}
                  <br />
                  {formData.city}, {formData.state} {formData.zip}
                  <br />
                  {formData.country}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Booking Details */}
          <div className="bg-white border border-light-gray p-8">
            <p className={sectionHeaderClass}>Booking Details</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-warm-gray">Property</span>
                <span className="text-charcoal">{quote.listing.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-gray">Check-in</span>
                <span className="text-charcoal">
                  {formatDate(quote.checkIn)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-gray">Check-out</span>
                <span className="text-charcoal">
                  {formatDate(quote.checkOut)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-gray">Guests</span>
                <span className="text-charcoal">
                  {quote.guests} guest{quote.guests > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-gray">Nights</span>
                <span className="text-charcoal">
                  {quote.nights} night{quote.nights > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Cancellation Policy */}
          <div className="bg-white border border-light-gray p-8">
            <p className={sectionHeaderClass}>Cancellation Policy</p>
            <div className="border border-light-gray p-5">
              <p className="text-sm font-medium text-charcoal mb-2">
                {cancellation.label}
              </p>
              <p className="text-sm text-charcoal/60 leading-relaxed">
                {cancellation.description}
              </p>
            </div>
          </div>

          {/* 4. Deposit Information */}
          {depositAmount > 0 && (
            <div className="bg-white border border-light-gray p-8">
              <p className={sectionHeaderClass}>Deposit Information</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-warm-gray">Deposit Amount</span>
                  <span className="text-charcoal font-medium">
                    ${depositAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warm-gray">Due</span>
                  <span className="text-charcoal">Upon confirmation</span>
                </div>
              </div>
            </div>
          )}

          {/* 5. Special Requests */}
          {hasSpecialRequests && (
            <div className="bg-white border border-light-gray p-8">
              <p className={sectionHeaderClass}>
                {selectedAddOnNames.length > 0 ? "Add-Ons & Special Requests" : "Special Requests"}
              </p>
              <div className="space-y-3">
                {selectedAddOnNames.length > 0 && (
                  <ul className="space-y-1.5">
                    {selectedAddOnNames.map((item) => (
                      <li
                        key={item}
                        className="text-sm text-charcoal flex items-center gap-2"
                      >
                        <CheckCircle
                          size={14}
                          className="text-accent flex-shrink-0"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {formData.specialRequests.trim() && (
                  <p className="text-sm text-charcoal leading-relaxed">
                    {formData.specialRequests}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 6. Payment Method */}
          <div className="bg-white border border-light-gray p-8">
            <p className={sectionHeaderClass}>Payment Method</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-warm-gray">Method</span>
                <span className="text-charcoal">
                  {formData.paymentMethod === "card"
                    ? "Credit / Debit Card"
                    : "Bank Transfer"}
                </span>
              </div>
              <p className="text-[10px] text-warm-gray leading-relaxed pt-2">
                Payment will be processed after your request is approved.
              </p>
            </div>
          </div>

          {/* 7. Agreement Acknowledgment */}
          {formData.agreedToRules && (
            <div className="bg-white border border-light-gray p-8">
              <div className="flex items-center gap-3">
                <CheckCircle size={18} className="text-accent flex-shrink-0" />
                <p className="text-sm text-charcoal">
                  You agreed to the House Rules and Rental Agreement
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase py-4 hover:bg-stone transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Submitting...
              </span>
            ) : (
              "Submit Booking Request"
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-[10px] text-warm-gray pb-4">
            <Lock size={12} />
            <span>Your information is secure and encrypted</span>
          </div>
        </div>

        {/* Right sidebar */}
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
                    timeZone: "UTC",
                  })}{" "}
                  &ndash;{" "}
                  {checkOutDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </span>
                <span>
                  {quote.guests} guest{quote.guests > 1 ? "s" : ""}
                </span>
              </div>

              <div className="border-t border-light-gray pt-3 space-y-2">
                <div className="flex justify-between text-charcoal/60">
                  <span>
                    Board rate &times; {quote.nights} night{quote.nights > 1 ? "s" : ""}
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
                    <span>Extra guest fee <span className="text-[9px] text-warm-gray">({rule?.extraGuestFeeType === "per_stay" ? "per stay" : "per night"})</span></span>
                    <span>${quote.extraGuestFee.toFixed(2)}</span>
                  </div>
                )}
                {quote.taxAmount > 0 && (
                  <div className="flex justify-between text-charcoal/60">
                    <span>Taxes &amp; fees</span>
                    <span>${quote.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {quote.serviceFee > 0 && (
                  <div className="flex justify-between text-charcoal/60">
                    <span>Service fee</span>
                    <span>${quote.serviceFee.toFixed(2)}</span>
                  </div>
                )}
                {quote.addOnsBreakdown && quote.addOnsBreakdown.length > 0 && (
                  <>
                    {quote.addOnsBreakdown.map((addon, i) => (
                      <div key={i} className="flex justify-between text-charcoal/60">
                        <span>{addon.name}</span>
                        <span>${addon.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                )}
                {quote.promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Promo ({quote.promoCode})</span>
                    <span>-${quote.promoDiscount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between font-medium text-charcoal border-t border-light-gray pt-3">
                <span>Final Charge</span>
                <span>${quote.total.toFixed(2)}</span>
              </div>
              {quote.depositHold > 0 && (
                <div className="mt-3 pt-3 border-t border-dashed border-light-gray">
                  <div className="flex justify-between text-charcoal/60 text-sm">
                    <span>Security Deposit Hold <span className="text-[9px]">(refundable)</span></span>
                    <span>${quote.depositHold.toFixed(2)}</span>
                  </div>
                  <p className="text-[9px] text-warm-gray mt-1">
                    Charged upon signing rental agreement
                  </p>
                </div>
              )}
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
