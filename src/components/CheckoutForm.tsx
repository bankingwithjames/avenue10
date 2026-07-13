"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Clock,
  Loader2,
  Lock,
  FileText,
  CreditCard,
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
  taxLabel?: string;
  serviceFeeLabel?: string;
  depositHoldLabel?: string;
  extraGuestFeeType?: string;
}

interface AddOn {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  pricingType: string;
  requiresAdminApproval: boolean;
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
  agreedToRules: boolean;
  paymentMethod: string;
}

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Mexico",
  "Brazil",
  "Japan",
  "South Korea",
  "India",
  "Other",
];

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

export function CheckoutForm({ quoteId }: { quoteId: string }) {
  const router = useRouter();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [rule, setRule] = useState<BookingRule | null>(null);
  const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingAddOns, setUpdatingAddOns] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<CheckoutData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    specialRequests: "",
    selectedAddOns: [],
    agreedToRules: false,
    paymentMethod: "card",
  });

  // Load saved form data from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey(quoteId));
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<CheckoutData>;
        setForm((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore parse errors
    }
  }, [quoteId]);

  // Persist form data to localStorage on change
  const updateForm = useCallback(
    (updates: Partial<CheckoutData>) => {
      setForm((prev) => {
        const next = { ...prev, ...updates };
        try {
          localStorage.setItem(storageKey(quoteId), JSON.stringify(next));
        } catch {
          // storage full — ignore
        }
        return next;
      });
    },
    [quoteId]
  );

  async function toggleAddOn(addOnName: string) {
    if (!quote) return;
    const current = form.selectedAddOns;
    const next = current.includes(addOnName)
      ? current.filter((n) => n !== addOnName)
      : [...current, addOnName];
    updateForm({ selectedAddOns: next });

    setUpdatingAddOns(true);
    try {
      const res = await fetch("/api/booking/quote", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quote.id,
          selectedAddOns: next,
        }),
      });
      const data = await res.json();
      if (res.ok && data.quote) {
        setQuote(data.quote);
      }
    } catch {
      // keep current quote on error
    } finally {
      setUpdatingAddOns(false);
    }
  }

  async function applyPromoCode() {
    if (!quote || !promoInput.trim()) return;
    setApplyingPromo(true);
    setPromoError("");
    try {
      const res = await fetch("/api/booking/quote", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quote.id,
          selectedAddOns: form.selectedAddOns,
          promoCode: promoInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.quote) {
        setQuote(data.quote);
        if (!data.quote.promoCode) {
          setPromoError("Invalid or expired promo code");
        }
      } else {
        setPromoError(data.error || "Failed to apply promo code");
      }
    } catch {
      setPromoError("Network error");
    } finally {
      setApplyingPromo(false);
    }
  }

  async function removePromoCode() {
    if (!quote) return;
    setApplyingPromo(true);
    try {
      const res = await fetch("/api/booking/quote", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quote.id,
          selectedAddOns: form.selectedAddOns,
        }),
      });
      const data = await res.json();
      if (res.ok && data.quote) {
        setQuote(data.quote);
        setPromoInput("");
        setPromoError("");
      }
    } catch {
      // keep current state
    } finally {
      setApplyingPromo(false);
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/booking/quote?id=${quoteId}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load quote");
          return;
        }
        setQuote(data.quote);

        // Load booking rules and available add-ons in parallel
        const [rulesRes, addOnsRes] = await Promise.all([
          fetch(`/api/booking/rules?listingId=${data.quote.listing.id}`),
          fetch(`/api/booking/addons?listingId=${data.quote.listing.id}`),
        ]);
        const rulesData = await rulesRes.json();
        if (rulesRes.ok) {
          setRule(rulesData.rule);
        }
        const addOnsData = await addOnsRes.json();
        if (addOnsRes.ok && addOnsData.addOns) {
          setAvailableAddOns(addOnsData.addOns);
        }
      } catch {
        setError("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [quoteId]);

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!form.firstName.trim()) errors.firstName = "First name is required";
    if (!form.lastName.trim()) errors.lastName = "Last name is required";
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Enter a valid email";
    if (!form.phone.trim()) errors.phone = "Phone number is required";
    if (!form.street.trim()) errors.street = "Street address is required";
    if (!form.city.trim()) errors.city = "City is required";
    if (!form.state.trim()) errors.state = "State is required";
    if (!form.zip.trim()) errors.zip = "ZIP code is required";
    if (!form.country) errors.country = "Country is required";
    if (rule?.requireAgreement && !form.agreedToRules)
      errors.agreedToRules = "You must agree to the House Rules and Rental Agreement";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      // Scroll to first error
      const firstErrorKey = Object.keys(fieldErrors)[0];
      if (firstErrorKey) {
        const el = document.querySelector(`[data-field="${firstErrorKey}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Save to localStorage and redirect to review
    try {
      localStorage.setItem(storageKey(quoteId), JSON.stringify(form));
    } catch {
      // ignore
    }
    router.push(`/checkout/${quoteId}/review`);
  }

  const depositAmount = calculateDeposit(quote?.total ?? 0, rule);

  const labelClass =
    "text-[9px] tracking-[0.2em] uppercase text-warm-gray font-medium mb-1.5 block";
  const inputClass =
    "w-full border border-light-gray text-charcoal text-sm px-4 py-3 focus:border-charcoal/40 outline-none transition-colors";
  const errorInputClass =
    "w-full border border-red-300 text-charcoal text-sm px-4 py-3 focus:border-red-400 outline-none transition-colors";
  const sectionHeaderClass =
    "text-[10px] tracking-[0.3em] uppercase text-warm-gray font-medium";

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

  const cancellation =
    CANCELLATION_POLICIES[rule?.cancellationPolicy ?? "flexible"] ??
    CANCELLATION_POLICIES.flexible;

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
        {/* Left column — form sections */}
        <div className="md:col-span-3">
          <form onSubmit={handleContinue} className="space-y-10" noValidate>
            {/* Section 1: Guest Profile */}
            <div className="bg-white border border-light-gray p-8" data-field="firstName">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-7 h-7 border border-charcoal text-charcoal text-[10px] font-medium">
                  1
                </span>
                <p className={sectionHeaderClass}>Guest Information</p>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div data-field="firstName">
                    <label className={labelClass}>First Name *</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => updateForm({ firstName: e.target.value })}
                      className={fieldErrors.firstName ? errorInputClass : inputClass}
                    />
                    {fieldErrors.firstName && (
                      <p className="text-[10px] text-red-500 mt-1">{fieldErrors.firstName}</p>
                    )}
                  </div>
                  <div data-field="lastName">
                    <label className={labelClass}>Last Name *</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => updateForm({ lastName: e.target.value })}
                      className={fieldErrors.lastName ? errorInputClass : inputClass}
                    />
                    {fieldErrors.lastName && (
                      <p className="text-[10px] text-red-500 mt-1">{fieldErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div data-field="email">
                  <label className={labelClass}>Email Address *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm({ email: e.target.value })}
                    className={fieldErrors.email ? errorInputClass : inputClass}
                  />
                  {fieldErrors.email && (
                    <p className="text-[10px] text-red-500 mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div data-field="phone">
                  <label className={labelClass}>Phone Number *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm({ phone: e.target.value })}
                    className={fieldErrors.phone ? errorInputClass : inputClass}
                  />
                  {fieldErrors.phone && (
                    <p className="text-[10px] text-red-500 mt-1">{fieldErrors.phone}</p>
                  )}
                </div>

                <div data-field="street">
                  <label className={labelClass}>Street Address *</label>
                  <input
                    type="text"
                    value={form.street}
                    onChange={(e) => updateForm({ street: e.target.value })}
                    className={fieldErrors.street ? errorInputClass : inputClass}
                  />
                  {fieldErrors.street && (
                    <p className="text-[10px] text-red-500 mt-1">{fieldErrors.street}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div data-field="city">
                    <label className={labelClass}>City *</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => updateForm({ city: e.target.value })}
                      className={fieldErrors.city ? errorInputClass : inputClass}
                    />
                    {fieldErrors.city && (
                      <p className="text-[10px] text-red-500 mt-1">{fieldErrors.city}</p>
                    )}
                  </div>
                  <div data-field="state">
                    <label className={labelClass}>State / Region *</label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => updateForm({ state: e.target.value })}
                      className={fieldErrors.state ? errorInputClass : inputClass}
                    />
                    {fieldErrors.state && (
                      <p className="text-[10px] text-red-500 mt-1">{fieldErrors.state}</p>
                    )}
                  </div>
                  <div data-field="zip">
                    <label className={labelClass}>ZIP / Postal *</label>
                    <input
                      type="text"
                      value={form.zip}
                      onChange={(e) => updateForm({ zip: e.target.value })}
                      className={fieldErrors.zip ? errorInputClass : inputClass}
                    />
                    {fieldErrors.zip && (
                      <p className="text-[10px] text-red-500 mt-1">{fieldErrors.zip}</p>
                    )}
                  </div>
                </div>

                <div data-field="country">
                  <label className={labelClass}>Country *</label>
                  <select
                    value={form.country}
                    onChange={(e) => updateForm({ country: e.target.value })}
                    className={fieldErrors.country ? errorInputClass : inputClass}
                  >
                    <option value="">Select a country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.country && (
                    <p className="text-[10px] text-red-500 mt-1">{fieldErrors.country}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Cancellation Policy */}
            <div className="bg-white border border-light-gray p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-7 h-7 border border-charcoal text-charcoal text-[10px] font-medium">
                  2
                </span>
                <p className={sectionHeaderClass}>Cancellation Policy</p>
              </div>

              <div className="border border-light-gray p-5">
                <p className="text-sm font-medium text-charcoal mb-2">
                  {cancellation.label}
                </p>
                <p className="text-sm text-charcoal/60 leading-relaxed">
                  {cancellation.description}
                </p>
              </div>
            </div>

            {/* Section 3: Deposit & House Rules */}
            <div className="bg-white border border-light-gray p-8" data-field="agreedToRules">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-7 h-7 border border-charcoal text-charcoal text-[10px] font-medium">
                  3
                </span>
                <p className={sectionHeaderClass}>Deposit &amp; House Rules</p>
              </div>

              {depositAmount > 0 && (
                <div className="border border-light-gray p-5 mb-6">
                  <p className="text-sm text-charcoal leading-relaxed">
                    A deposit of{" "}
                    <span className="font-medium">
                      ${depositAmount.toFixed(2)}
                    </span>
                    {rule && rule.depositPercent > 0
                      ? ` (${rule.depositPercent}%)`
                      : ""}{" "}
                    is required to secure your reservation.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3 mb-6">
                <a
                  href="/house-rules"
                  className="text-sm text-charcoal underline underline-offset-4 hover:text-accent transition-colors inline-flex items-center gap-2"
                >
                  <FileText size={14} className="text-warm-gray" />
                  View House Rules
                </a>
                <a
                  href="/rental-agreement"
                  className="text-sm text-charcoal underline underline-offset-4 hover:text-accent transition-colors inline-flex items-center gap-2"
                >
                  <FileText size={14} className="text-warm-gray" />
                  View Rental Agreement
                </a>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreedToRules}
                  onChange={(e) =>
                    updateForm({ agreedToRules: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 accent-charcoal"
                />
                <span className="text-sm text-charcoal leading-relaxed">
                  I have read and agree to the House Rules and Rental Agreement *
                </span>
              </label>
              {fieldErrors.agreedToRules && (
                <p className="text-[10px] text-red-500 mt-2 ml-7">
                  {fieldErrors.agreedToRules}
                </p>
              )}
            </div>

            {/* Section 4: Add-Ons & Special Requests */}
            <div className="bg-white border border-light-gray p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-7 h-7 border border-charcoal text-charcoal text-[10px] font-medium">
                  4
                </span>
                <p className={sectionHeaderClass}>
                  {availableAddOns.length > 0 ? "Add-Ons & Special Requests" : "Special Requests"}
                </p>
              </div>

              <div className="space-y-5">
                {availableAddOns.length > 0 && (
                  <div className="space-y-3">
                    {updatingAddOns && (
                      <div className="flex items-center gap-2 text-[10px] text-warm-gray mb-2">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Updating pricing...</span>
                      </div>
                    )}
                    {availableAddOns.map((addon) => {
                      const isSelected = form.selectedAddOns.includes(addon.name);
                      const priceLabel =
                        addon.pricingType === "per_night"
                          ? `$${addon.price.toFixed(0)}/night`
                          : addon.pricingType === "per_guest"
                            ? `$${addon.price.toFixed(0)}/guest`
                            : addon.pricingType === "percentage"
                              ? `${addon.price}%`
                              : addon.price > 0
                                ? `$${addon.price.toFixed(0)}`
                                : "Custom pricing";
                      return (
                        <label
                          key={addon.id}
                          className={`flex items-start gap-3 cursor-pointer p-4 border transition-colors ${
                            isSelected
                              ? "border-charcoal/30 bg-cream/50"
                              : "border-light-gray hover:border-charcoal/20"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAddOn(addon.name)}
                            disabled={updatingAddOns}
                            className="mt-0.5 w-4 h-4 accent-charcoal shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm text-charcoal font-medium">
                                {addon.name}
                              </span>
                              <span className="text-xs text-warm-gray shrink-0">
                                {priceLabel}
                              </span>
                            </div>
                            {addon.description && (
                              <p className="text-[11px] text-warm-gray mt-0.5 leading-relaxed">
                                {addon.description}
                              </p>
                            )}
                            {addon.requiresAdminApproval && (
                              <p className="text-[9px] tracking-[0.1em] uppercase text-accent mt-1">
                                Subject to availability
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                <div className={availableAddOns.length > 0 ? "border-t border-light-gray pt-5" : ""}>
                  <label className={labelClass}>Promo Code</label>
                  {quote.promoCode ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-sm">
                      <span className="text-green-700 font-medium">{quote.promoCode}</span>
                      <span className="text-green-600 text-xs">applied &ndash; saving ${quote.promoDiscount.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={removePromoCode}
                        disabled={applyingPromo}
                        className="ml-auto text-xs text-charcoal/50 hover:text-charcoal underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                        placeholder="Enter code"
                        className={`${inputClass} flex-1`}
                      />
                      <button
                        type="button"
                        onClick={applyPromoCode}
                        disabled={applyingPromo || !promoInput.trim()}
                        className="border border-charcoal text-charcoal text-[10px] tracking-[0.15em] uppercase px-4 py-2 hover:bg-charcoal hover:text-white transition-all disabled:opacity-30"
                      >
                        {applyingPromo ? <Loader2 size={12} className="animate-spin" /> : "Apply"}
                      </button>
                    </div>
                  )}
                  {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
                </div>

                <div className="border-t border-light-gray pt-5">
                  <label className={labelClass}>
                    Additional Requests (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={form.specialRequests}
                    onChange={(e) =>
                      updateForm({ specialRequests: e.target.value })
                    }
                    className={`${inputClass} resize-none`}
                    placeholder="Any special accommodations or notes for the property..."
                  />
                  <p className="text-[10px] text-warm-gray mt-2">
                    Special requests are not guaranteed but the property will do
                    its best to accommodate.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 5: Payment Method (Mock) */}
            <div className="bg-white border border-light-gray p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-7 h-7 border border-charcoal text-charcoal text-[10px] font-medium">
                  5
                </span>
                <p className={sectionHeaderClass}>Payment Method</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={form.paymentMethod === "card"}
                      onChange={() => updateForm({ paymentMethod: "card" })}
                      className="w-4 h-4 accent-charcoal"
                    />
                    <CreditCard size={16} className="text-charcoal" />
                    <span className="text-sm text-charcoal">
                      Credit / Debit Card
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={form.paymentMethod === "bank_transfer"}
                      onChange={() =>
                        updateForm({ paymentMethod: "bank_transfer" })
                      }
                      className="w-4 h-4 accent-charcoal"
                    />
                    <span className="text-sm text-charcoal">Bank Transfer</span>
                  </label>
                </div>

                {form.paymentMethod === "card" && (
                  <div className="border border-light-gray p-5 space-y-4">
                    <div>
                      <label className={labelClass}>Card Number</label>
                      <input
                        type="text"
                        disabled
                        placeholder="&bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull;"
                        className={`${inputClass} bg-cream/50 cursor-not-allowed`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Expiry</label>
                        <input
                          type="text"
                          disabled
                          placeholder="MM / YY"
                          className={`${inputClass} bg-cream/50 cursor-not-allowed`}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>CVV</label>
                        <input
                          type="text"
                          disabled
                          placeholder="&bull;&bull;&bull;"
                          className={`${inputClass} bg-cream/50 cursor-not-allowed`}
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-warm-gray leading-relaxed">
                      Payment processing will be available soon. Your
                      reservation will be submitted as a request.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[10px] text-warm-gray">
                  <Lock size={12} />
                  <span>
                    Your payment information is encrypted and secure
                  </span>
                </div>
              </div>
            </div>

            {/* Error summary */}
            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}
            {Object.keys(fieldErrors).length > 0 && (
              <p className="text-xs text-red-500 text-center">
                Please fill in all required fields above.
              </p>
            )}

            {/* Continue button */}
            <button
              type="submit"
              className="w-full bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase py-4 hover:bg-stone transition-all duration-300 font-medium"
            >
              Review Your Request &rarr;
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-warm-gray">
              <Shield size={12} />
              <span>Your information is secure and encrypted</span>
            </div>
          </form>
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
                    <span>{rule?.taxLabel || "Taxes & fees"}</span>
                    <span>${quote.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {quote.serviceFee > 0 && (
                  <div className="flex justify-between text-charcoal/60">
                    <span>{rule?.serviceFeeLabel || "Service fee"}</span>
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
                    <span>{rule?.depositHoldLabel || "Security Deposit Hold"} <span className="text-[9px]">(refundable)</span></span>
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

function calculateDeposit(
  total: number,
  rule: BookingRule | null
): number {
  if (!rule) return 0;
  if (rule.depositPercent > 0) {
    return Math.round(total * (rule.depositPercent / 100) * 100) / 100;
  }
  if (rule.depositFlat > 0) {
    return rule.depositFlat;
  }
  return 0;
}
