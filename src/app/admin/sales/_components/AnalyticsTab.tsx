"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Tag, XCircle } from "lucide-react";
import {
  Card,
  KPICard,
  StatusBadge,
  sectionHeader,
  labelClass,
  btnSecondary,
  EmptyState,
  fmt,
} from "./shared";

interface SalesKPIs {
  grossBookingRevenue: number;
  addOnRevenue: number;
  pendingUpcharges: number;
  dynamicPricingLift: number;
  discountAmount: number;
  activeDepositHolds: number;
  checkoutConversionRate: number;
  abandonedCheckouts: number;
  averageBookingValue: number;
  revenuePerGuest: number;
}

interface AbandonedCheckout {
  id: string;
  guestEmail: string | null;
  guestPhone: string | null;
  listingTitle: string;
  checkIn: string | null;
  checkOut: string | null;
  totalQuote: number;
  abandonedStep: string | null;
  abandonedAt: string;
  followUpStatus: string;
}

interface AnalyticsTabProps {
  listingId: string;
}

export default function AnalyticsTab({ listingId }: AnalyticsTabProps) {
  const [kpis, setKpis] = useState<SalesKPIs | null>(null);
  const [abandoned, setAbandoned] = useState<AbandonedCheckout[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiRes, abRes] = await Promise.all([
        fetch(`/api/admin/sales/analytics?listingId=${listingId}`),
        fetch(`/api/admin/sales/abandoned?listingId=${listingId}`),
      ]);
      if (kpiRes.ok) {
        const data = await kpiRes.json();
        setKpis(data.kpis);
      }
      if (abRes.ok) {
        const data = await abRes.json();
        setAbandoned(data.abandoned || []);
      }
    } catch {
      // fail silently
    }
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetch effect; intended side effect, not a derived-state cascade
    loadData();
  }, [loadData]);

  const updateFollowUp = async (id: string, status: string) => {
    await fetch("/api/admin/sales/abandoned", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, followUpStatus: status }),
    });
    loadData();
  };

  const stepLabels: Record<string, string> = {
    guest_info: "Guest Information",
    agreement: "Agreement",
    payment: "Payment Method",
    review: "Review Page",
    unknown: "Unknown",
  };

  if (loading) {
    return <p className="text-xs text-warm-gray py-8 text-center">Loading analytics...</p>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-3">
        <KPICard
          label="Gross Booking Revenue"
          value={fmt(kpis?.grossBookingRevenue ?? 0)}
          sublabel="All confirmed bookings"
        />
        <KPICard
          label="Add-On Revenue"
          value={fmt(kpis?.addOnRevenue ?? 0)}
          sublabel="Upsell items"
        />
        <KPICard
          label="Pending Upcharges"
          value={fmt(kpis?.pendingUpcharges ?? 0)}
          sublabel="Awaiting payment"
        />
        <KPICard
          label="Avg Booking Value"
          value={fmt(kpis?.averageBookingValue ?? 0)}
          sublabel="Per reservation"
        />
        <KPICard
          label="Checkout Conversion"
          value={`${(kpis?.checkoutConversionRate ?? 0).toFixed(1)}%`}
          sublabel="Quotes → Bookings"
        />
      </div>

      <div className="grid grid-cols-5 gap-3">
        <KPICard
          label="Dynamic Pricing Lift"
          value={`${(kpis?.dynamicPricingLift ?? 0).toFixed(1)}%`}
          sublabel="vs base rate"
        />
        <KPICard
          label="Discount Amount"
          value={fmt(kpis?.discountAmount ?? 0)}
          sublabel="Promos applied"
        />
        <KPICard
          label="Active Deposits"
          value={fmt(kpis?.activeDepositHolds ?? 0)}
          sublabel="Held deposits"
        />
        <KPICard
          label="Revenue Per Guest"
          value={fmt(kpis?.revenuePerGuest ?? 0)}
          sublabel="Per person"
        />
        <KPICard
          label="Abandoned Checkouts"
          value={String(kpis?.abandonedCheckouts ?? abandoned.length)}
          sublabel="This period"
        />
      </div>

      {/* Abandoned Checkouts */}
      <Card>
        <h2 className={sectionHeader}>Abandoned Checkouts</h2>

        {abandoned.length > 0 ? (
          <div className="space-y-2">
            {abandoned.map((ab) => (
              <div
                key={ab.id}
                className="border border-light-gray p-3 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-charcoal font-medium">
                      {ab.guestEmail || ab.guestPhone || "Anonymous"}
                    </span>
                    <span className="text-[9px] text-warm-gray">
                      {ab.listingTitle}
                    </span>
                    {ab.abandonedStep && (
                      <span className="text-[9px] text-warm-gray">
                        Step: {stepLabels[ab.abandonedStep] || ab.abandonedStep}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-warm-gray">
                    {ab.checkIn && ab.checkOut && (
                      <span>
                        {new Date(ab.checkIn).toLocaleDateString("en-US", { timeZone: "UTC" })} –{" "}
                        {new Date(ab.checkOut).toLocaleDateString("en-US", { timeZone: "UTC" })}
                      </span>
                    )}
                    <span>{fmt(ab.totalQuote)}</span>
                    <span>
                      {new Date(ab.abandonedAt).toLocaleDateString()}{" "}
                      {new Date(ab.abandonedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <StatusBadge status={ab.followUpStatus} />

                <div className="flex gap-1 shrink-0">
                  {ab.guestEmail && ab.followUpStatus === "none" && (
                    <button
                      className={btnSecondary + " py-1 px-2"}
                      onClick={() => updateFollowUp(ab.id, "sent")}
                      title="Mark reminder sent"
                    >
                      <Send size={10} />
                    </button>
                  )}
                  {ab.followUpStatus !== "lost" && (
                    <button
                      className={btnSecondary + " py-1 px-2"}
                      onClick={() => updateFollowUp(ab.id, "lost")}
                      title="Mark as lost"
                    >
                      <XCircle size={10} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No abandoned checkouts tracked yet" />
        )}
      </Card>
    </div>
  );
}
