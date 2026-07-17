"use client";

import { useState, useEffect, useCallback } from "react";
import { Check } from "lucide-react";
import {
  Card,
  SelectInput,
  Toggle,
  sectionHeader,
  btnClass,
} from "./shared";

interface BookingRulesData {
  bookingMode: string;
  cancellationPolicy: string;
  requireAgreement: boolean;
  requireIdVerification: boolean;
  autoApproveReturning: boolean;
  depositPercent: number;
  depositFlat: number;
  minAdvanceDays: number;
  maxAdvanceDays: number;
  instantBookMaxNights: number | null;
  // Approval rules
  approvalSameDay: boolean;
  approvalPets: boolean;
  approvalExtraGuests: boolean;
  approvalLongStays: boolean;
  approvalHighValue: boolean;
  approvalDiscounted: boolean;
  approvalEventWeekend: boolean;
  approvalCustomAddOns: boolean;
  approvalNewGuest: boolean;
}

const defaultRules: BookingRulesData = {
  bookingMode: "request_to_book",
  cancellationPolicy: "flexible",
  requireAgreement: true,
  requireIdVerification: false,
  autoApproveReturning: false,
  depositPercent: 0,
  depositFlat: 0,
  minAdvanceDays: 1,
  maxAdvanceDays: 365,
  instantBookMaxNights: null,
  approvalSameDay: true,
  approvalPets: true,
  approvalExtraGuests: false,
  approvalLongStays: false,
  approvalHighValue: false,
  approvalDiscounted: false,
  approvalEventWeekend: false,
  approvalCustomAddOns: true,
  approvalNewGuest: false,
};

interface BookingRulesTabProps {
  listingId: string;
}

export default function BookingRulesTab({ listingId }: BookingRulesTabProps) {
  const [rules, setRules] = useState<BookingRulesData>({ ...defaultRules });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sales/booking-rules?listingId=${listingId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.rule) {
          setRules({
            ...defaultRules,
            ...data.rule,
          });
        }
      }
    } catch {
      // fail silently
    }
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetch effect; intended side effect, not a derived-state cascade
    loadRules();
  }, [loadRules]);

  const update = <K extends keyof BookingRulesData>(field: K, value: BookingRulesData[K]) => {
    setRules((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/sales/booking-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, ...rules }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // fail silently
    }
    setSaving(false);
  };

  if (loading) {
    return <p className="text-xs text-warm-gray py-8 text-center">Loading booking rules...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Booking Mode */}
      <Card>
        <h2 className={sectionHeader}>Booking Mode</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <SelectInput
            label="Default Booking Mode"
            value={rules.bookingMode}
            onChange={(v) => update("bookingMode", v)}
            options={[
              { value: "instant_book", label: "Instant Book" },
              { value: "request_to_book", label: "Request to Book" },
              { value: "manual_approval", label: "Manual Approval Required" },
              { value: "deposit_to_hold", label: "Deposit to Hold" },
              { value: "inquiry_only", label: "Inquiry Only" },
            ]}
          />
          <SelectInput
            label="Cancellation Policy"
            value={rules.cancellationPolicy}
            onChange={(v) => update("cancellationPolicy", v)}
            options={[
              { value: "flexible", label: "Flexible (5 days)" },
              { value: "moderate", label: "Moderate (14 days)" },
              { value: "strict", label: "Strict (30 days)" },
              { value: "non_refundable", label: "Non-Refundable" },
            ]}
          />
        </div>
        <div className="space-y-3">
          <Toggle
            label="Require Rental Agreement"
            checked={rules.requireAgreement}
            onChange={(v) => update("requireAgreement", v)}
            description="Guest must agree to house rules and rental agreement"
          />
          <Toggle
            label="Require ID Verification"
            checked={rules.requireIdVerification}
            onChange={(v) => update("requireIdVerification", v)}
            description="Guest must upload government ID before confirmation"
          />
          <Toggle
            label="Auto-Approve Returning Guests"
            checked={rules.autoApproveReturning}
            onChange={(v) => update("autoApproveReturning", v)}
            description="Skip approval for guests who have completed a previous stay"
          />
        </div>
      </Card>

      {/* Approval Rules */}
      <Card>
        <h2 className={sectionHeader}>Require Admin Approval When</h2>
        <div className="space-y-3">
          <Toggle
            label="Same-Day Booking"
            checked={rules.approvalSameDay}
            onChange={(v) => update("approvalSameDay", v)}
          />
          <Toggle
            label="Pet Booking"
            checked={rules.approvalPets}
            onChange={(v) => update("approvalPets", v)}
          />
          <Toggle
            label="Extra Guests (beyond included)"
            checked={rules.approvalExtraGuests}
            onChange={(v) => update("approvalExtraGuests", v)}
          />
          <Toggle
            label="Long Stays (7+ nights)"
            checked={rules.approvalLongStays}
            onChange={(v) => update("approvalLongStays", v)}
          />
          <Toggle
            label="High-Value Bookings ($2000+)"
            checked={rules.approvalHighValue}
            onChange={(v) => update("approvalHighValue", v)}
          />
          <Toggle
            label="Discounted Bookings (promo code applied)"
            checked={rules.approvalDiscounted}
            onChange={(v) => update("approvalDiscounted", v)}
          />
          <Toggle
            label="Event Weekends"
            checked={rules.approvalEventWeekend}
            onChange={(v) => update("approvalEventWeekend", v)}
          />
          <Toggle
            label="Custom Add-Ons"
            checked={rules.approvalCustomAddOns}
            onChange={(v) => update("approvalCustomAddOns", v)}
          />
          <Toggle
            label="New Guest Without Phone Number"
            checked={rules.approvalNewGuest}
            onChange={(v) => update("approvalNewGuest", v)}
          />
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <button
          className={btnClass}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Booking Rules"}
        </button>
        {saved && (
          <span className="text-xs text-charcoal/60 flex items-center gap-1">
            <Check size={12} /> Rules saved
          </span>
        )}
      </div>
    </div>
  );
}
