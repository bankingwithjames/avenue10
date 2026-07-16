"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import {
  Card,
  NumberInput,
  TextInput,
  SelectInput,
  Toggle,
  StatusBadge,
  sectionHeader,
  labelClass,
  inputClass,
  btnClass,
  btnSecondary,
  btnDanger,
  EmptyState,
  fmt,
} from "./shared";

interface PromoCode {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  listingId: string | null;
  startDate: string | null;
  endDate: string | null;
  minimumNights: number;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
}

interface PromosTabProps {
  listings: { id: string; title: string }[];
}

export default function PromosTab({ listings }: PromosTabProps) {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState<number | null>(0);
  const [listingId, setListingId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minimumNights, setMinimumNights] = useState<number | null>(1);
  const [maxUses, setMaxUses] = useState<number | null>(0);

  const loadPromos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sales/promos");
      if (res.ok) {
        const data = await res.json();
        setPromos(data.promos || []);
      }
    } catch {
      // fail silently
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPromos();
  }, [loadPromos]);

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "AV10-";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const resetForm = () => {
    setCode("");
    setDiscountType("percentage");
    setDiscountValue(0);
    setListingId("");
    setStartDate("");
    setEndDate("");
    setMinimumNights(1);
    setMaxUses(0);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!code.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/sales/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discountType,
          discountValue: discountValue ?? 0,
          listingId: listingId || null,
          startDate: startDate || null,
          endDate: endDate || null,
          minimumNights: minimumNights ?? 1,
          maxUses: maxUses ?? 0,
        }),
      });
      if (res.ok) {
        resetForm();
        loadPromos();
      }
    } catch {
      // fail silently
    }
    setSaving(false);
  };

  const togglePromo = async (id: string, active: boolean) => {
    await fetch("/api/admin/sales/promos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: active }),
    });
    loadPromos();
  };

  const deletePromo = async (id: string) => {
    await fetch(`/api/admin/sales/promos?id=${id}`, { method: "DELETE" });
    loadPromos();
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className={sectionHeader + " mb-0"}>Promo Codes & Discounts</h2>
          <button
            className={btnSecondary}
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) generateCode();
            }}
          >
            <Plus size={10} className="inline mr-1" />
            {showForm ? "Cancel" : "New Promo"}
          </button>
        </div>

        {showForm && (
          <div className="mb-6 p-4 bg-cream/50 border border-light-gray space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Promo Code</label>
                <div className="flex gap-1">
                  <input
                    className={inputClass}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="AV10-SUMMER25"
                  />
                  <button
                    className="shrink-0 px-2 border border-light-gray hover:bg-white transition"
                    onClick={generateCode}
                    title="Generate random code"
                  >
                    <Copy size={12} className="text-warm-gray" />
                  </button>
                </div>
              </div>
              <SelectInput
                label="Discount Type"
                value={discountType}
                onChange={setDiscountType}
                options={[
                  { value: "percentage", label: "Percentage Off" },
                  { value: "fixed", label: "Fixed Amount Off" },
                ]}
              />
              <NumberInput
                label={discountType === "percentage" ? "Discount %" : "Discount Amount"}
                value={discountValue}
                onChange={(v) => setDiscountValue(v)}
                suffix={discountType === "percentage" ? "%" : undefined}
                prefix={discountType === "fixed" ? "$" : undefined}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SelectInput
                label="Applies to Listing"
                value={listingId}
                onChange={setListingId}
                options={[
                  { value: "", label: "All Listings" },
                  ...listings.map((l) => ({ value: l.id, label: l.title })),
                ]}
              />
              <div>
                <label className={labelClass}>Start Date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>End Date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <NumberInput
                label="Minimum Nights"
                value={minimumNights}
                onChange={(v) => setMinimumNights(v)}
              />
              <NumberInput
                label="Max Uses (0 = unlimited)"
                value={maxUses}
                onChange={(v) => setMaxUses(v)}
              />
            </div>
            <button
              className={btnClass}
              onClick={handleSave}
              disabled={saving || !code.trim()}
            >
              {saving ? "Creating..." : "Create Promo Code"}
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-xs text-warm-gray py-8 text-center">Loading promos...</p>
        ) : promos.length > 0 ? (
          <div className="border border-light-gray">
            <div className="grid grid-cols-[1fr_100px_80px_80px_60px_60px_40px] gap-2 px-3 py-2 bg-cream/50 border-b border-light-gray">
              <span className={`${labelClass} mb-0`}>Code</span>
              <span className={`${labelClass} mb-0`}>Discount</span>
              <span className={`${labelClass} mb-0`}>Listing</span>
              <span className={`${labelClass} mb-0`}>Uses</span>
              <span className={`${labelClass} mb-0`}>Status</span>
              <span className={`${labelClass} mb-0`}>Active</span>
              <span />
            </div>
            {promos.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_100px_80px_80px_60px_60px_40px] gap-2 px-3 py-2.5 border-b border-light-gray last:border-0 items-center"
              >
                <span className="text-xs font-mono text-charcoal font-medium">
                  {p.code}
                </span>
                <span className="text-xs text-charcoal">
                  {p.discountType === "percentage"
                    ? `${p.discountValue}%`
                    : fmt(p.discountValue)}
                </span>
                <span className="text-[9px] text-warm-gray">
                  {p.listingId
                    ? listings.find((l) => l.id === p.listingId)?.title || "—"
                    : "All"}
                </span>
                <span className="text-xs text-charcoal">
                  {p.currentUses}/{p.maxUses || "∞"}
                </span>
                <StatusBadge
                  status={
                    !p.isActive
                      ? "expired"
                      : p.maxUses > 0 && p.currentUses >= p.maxUses
                        ? "expired"
                        : "active"
                  }
                />
                <div
                  className={`w-8 h-4 rounded-full transition-colors cursor-pointer ${
                    p.isActive ? "bg-charcoal" : "bg-light-gray"
                  } relative`}
                  onClick={() => togglePromo(p.id, !p.isActive)}
                >
                  <div
                    className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${
                      p.isActive ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </div>
                <button
                  onClick={() => deletePromo(p.id)}
                  className="text-warm-gray hover:text-red-500 transition"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No promo codes created yet" />
        )}
      </Card>
    </div>
  );
}
