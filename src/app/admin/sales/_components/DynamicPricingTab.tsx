"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ChevronLeft, ChevronRight, Lock, Unlock } from "lucide-react";
import {
  NumberInput,
  SelectInput,
  Toggle,
  Card,
  sectionHeader,
  labelClass,
  inputClass,
  btnClass,
  btnSecondary,
  fmt,
} from "./shared";

export interface DynamicPricingData {
  enabled: boolean;
  pricingMode: string;
  minimumRate: number | null;
  maximumRate: number | null;
  weekendPremiumPercent: number | null;
  eventPremiumPercent: number | null;
  gapNightDiscountPercent: number | null;
  lastMinuteDiscountPercent: number | null;
  farOutPremiumPercent: number | null;
  occupancyBasedEnabled: boolean;
  bookingPaceEnabled: boolean;
  marketCompEnabled: boolean;
  manualPriceLockEnabled: boolean;
  pricingProvider: string;
}

export const defaultDynamicPricing: DynamicPricingData = {
  enabled: false,
  pricingMode: "balanced",
  minimumRate: 0,
  maximumRate: 0,
  weekendPremiumPercent: 0,
  eventPremiumPercent: 0,
  gapNightDiscountPercent: 0,
  lastMinuteDiscountPercent: 0,
  farOutPremiumPercent: 0,
  occupancyBasedEnabled: false,
  bookingPaceEnabled: false,
  marketCompEnabled: false,
  manualPriceLockEnabled: false,
  pricingProvider: "",
};

interface DailyRate {
  id?: string;
  date: string;
  baseRate: number;
  ruleAdjustedRate: number | null;
  aiSuggestedRate: number | null;
  adminApprovedRate: number | null;
  manualOverrideRate: number | null;
  finalRate: number;
  rateSource: string;
  isLocked: boolean;
}

interface DynamicPricingTabProps {
  listingId: string;
  dynamicPricing: DynamicPricingData;
  onUpdateDynamic: <K extends keyof DynamicPricingData>(field: K, value: DynamicPricingData[K]) => void;
  onSaveDynamic: () => Promise<void>;
  savingDynamic: boolean;
  saveResult?: string | null;
}

export default function DynamicPricingTab({
  listingId,
  dynamicPricing,
  onUpdateDynamic,
  onSaveDynamic,
  savingDynamic,
  saveResult,
}: DynamicPricingTabProps) {
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [dailyRates, setDailyRates] = useState<DailyRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editRate, setEditRate] = useState<number | string>(0);

  const loadDailyRates = useCallback(async () => {
    setLoadingRates(true);
    try {
      const start = calendarMonth.toISOString().split("T")[0];
      const end = new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + 1,
        0
      )
        .toISOString()
        .split("T")[0];
      const res = await fetch(
        `/api/admin/sales/daily-rates?listingId=${listingId}&start=${start}&end=${end}`
      );
      if (res.ok) {
        const data = await res.json();
        setDailyRates(data.rates || []);
      }
    } catch {
      // fail silently
    }
    setLoadingRates(false);
  }, [listingId, calendarMonth]);

  useEffect(() => {
    loadDailyRates();
  }, [loadDailyRates]);

  const daysInMonth = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfWeek = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1
  ).getDay();

  const monthLabel = calendarMonth.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const rateMap = new Map(dailyRates.map((r) => [r.date.split("T")[0], r]));

  const saveOverride = async (date: string, rate: number) => {
    try {
      await fetch("/api/admin/sales/daily-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          date,
          manualOverrideRate: rate,
          isLocked: true,
        }),
      });
      setEditingDate(null);
      loadDailyRates();
    } catch {
      // fail silently
    }
  };

  const toggleLock = async (date: string, locked: boolean) => {
    try {
      await fetch("/api/admin/sales/daily-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, date, isLocked: locked }),
      });
      loadDailyRates();
    } catch {
      // fail silently
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Pricing Settings */}
      <Card>
        <h2 className={sectionHeader}>Dynamic Pricing Engine</h2>
        <div className="space-y-5">
          <Toggle
            label="Enable Dynamic Pricing"
            checked={dynamicPricing.enabled}
            onChange={(v) => onUpdateDynamic("enabled", v)}
            description="Automatically adjust rates based on demand, seasonality, and market conditions"
          />

          {dynamicPricing.enabled && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <SelectInput
                  label="Pricing Mode"
                  value={dynamicPricing.pricingMode}
                  onChange={(v) => onUpdateDynamic("pricingMode", v)}
                  options={[
                    { value: "conservative", label: "Conservative" },
                    { value: "balanced", label: "Balanced" },
                    { value: "aggressive", label: "Aggressive" },
                  ]}
                />
                <NumberInput
                  label="Minimum Rate"
                  value={dynamicPricing.minimumRate}
                  onChange={(v) => onUpdateDynamic("minimumRate", v)}
                  prefix="$"
                />
                <NumberInput
                  label="Maximum Rate"
                  value={dynamicPricing.maximumRate}
                  onChange={(v) => onUpdateDynamic("maximumRate", v)}
                  prefix="$"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <NumberInput
                  label="Weekend Premium"
                  value={dynamicPricing.weekendPremiumPercent}
                  onChange={(v) => onUpdateDynamic("weekendPremiumPercent", v)}
                  suffix="%"
                  step={0.5}
                />
                <NumberInput
                  label="Event Premium"
                  value={dynamicPricing.eventPremiumPercent}
                  onChange={(v) => onUpdateDynamic("eventPremiumPercent", v)}
                  suffix="%"
                  step={0.5}
                />
                <NumberInput
                  label="Gap-Night Discount"
                  value={dynamicPricing.gapNightDiscountPercent}
                  onChange={(v) =>
                    onUpdateDynamic("gapNightDiscountPercent", v)
                  }
                  suffix="%"
                  step={0.5}
                />
                <NumberInput
                  label="Last-Minute Discount"
                  value={dynamicPricing.lastMinuteDiscountPercent}
                  onChange={(v) =>
                    onUpdateDynamic("lastMinuteDiscountPercent", v)
                  }
                  suffix="%"
                  step={0.5}
                />
                <NumberInput
                  label="Far-Out Booking Premium"
                  value={dynamicPricing.farOutPremiumPercent}
                  onChange={(v) =>
                    onUpdateDynamic("farOutPremiumPercent", v)
                  }
                  suffix="%"
                  step={0.5}
                />
              </div>

              <div className="space-y-3 pt-2">
                <Toggle
                  label="Occupancy-Based Pricing"
                  checked={dynamicPricing.occupancyBasedEnabled}
                  onChange={(v) => onUpdateDynamic("occupancyBasedEnabled", v)}
                  description="Increase rates when occupancy is high"
                />
                <Toggle
                  label="Booking Pace Adjustment"
                  checked={dynamicPricing.bookingPaceEnabled}
                  onChange={(v) => onUpdateDynamic("bookingPaceEnabled", v)}
                  description="Adjust rates based on booking velocity"
                />
                <Toggle
                  label="Market Comp Adjustment"
                  checked={dynamicPricing.marketCompEnabled}
                  onChange={(v) => onUpdateDynamic("marketCompEnabled", v)}
                  description="Adjust rates based on comparable listings"
                />
                <Toggle
                  label="Manual Price Lock"
                  checked={dynamicPricing.manualPriceLockEnabled}
                  onChange={(v) =>
                    onUpdateDynamic("manualPriceLockEnabled", v)
                  }
                  description="Lock manually set rates from being overridden by dynamic pricing"
                />
              </div>

              <SelectInput
                label="AI Pricing Provider"
                value={dynamicPricing.pricingProvider}
                onChange={(v) => onUpdateDynamic("pricingProvider", v)}
                options={[
                  { value: "", label: "None (Manual Only)" },
                  { value: "airdna", label: "AirDNA" },
                  { value: "pricelabs", label: "PriceLabs" },
                  { value: "wheelhouse", label: "Wheelhouse" },
                  { value: "beyond", label: "Beyond Pricing" },
                  { value: "custom", label: "Custom Integration" },
                ]}
              />
            </>
          )}

          <div className="flex items-center gap-3">
            <button
              className={btnClass}
              onClick={async () => {
                await onSaveDynamic();
                loadDailyRates();
              }}
              disabled={savingDynamic}
            >
              {savingDynamic ? "Generating rates..." : "Save Dynamic Pricing Settings"}
            </button>
            {saveResult && (
              <span className="text-xs text-charcoal/60 flex items-center gap-1">
                <Check size={12} /> {saveResult}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Final Daily Rates Calendar */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className={sectionHeader + " mb-0"}>Final Daily Rates</h2>
          <div className="flex items-center gap-2">
            <button
              className={btnSecondary}
              onClick={() =>
                setCalendarMonth(
                  new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() - 1,
                    1
                  )
                )
              }
            >
              <ChevronLeft size={12} />
            </button>
            <span className="text-xs text-charcoal font-medium min-w-[140px] text-center">
              {monthLabel}
            </span>
            <button
              className={btnSecondary}
              onClick={() =>
                setCalendarMonth(
                  new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth() + 1,
                    1
                  )
                )
              }
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>

        <p className="text-[9px] text-warm-gray mb-3">
          Click any date to set a manual override rate. Locked rates won't be changed by dynamic pricing.
        </p>

        {loadingRates ? (
          <p className="text-xs text-warm-gray py-8 text-center">Loading rates...</p>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-light-gray border border-light-gray">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="bg-cream py-1.5 text-center text-[9px] tracking-[0.1em] uppercase text-warm-gray font-medium"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`e-${i}`} className="bg-white p-2 min-h-[70px]" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const rate = rateMap.get(dateStr);
              const isWeekend =
                new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day).getDay() === 5 ||
                new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day).getDay() === 6;
              const isEditing = editingDate === dateStr;

              return (
                <div
                  key={day}
                  className={`bg-white p-1.5 min-h-[70px] cursor-pointer hover:bg-cream/50 transition relative ${
                    isWeekend ? "bg-cream/30" : ""
                  } ${rate?.isLocked ? "ring-1 ring-inset ring-charcoal/20" : ""}`}
                  onClick={() => {
                    if (!isEditing) {
                      setEditingDate(dateStr);
                      setEditRate(rate?.finalRate || 0);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-warm-gray">{day}</span>
                    {rate?.isLocked && (
                      <button
                        className="text-charcoal/40 hover:text-charcoal"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLock(dateStr, false);
                        }}
                      >
                        <Lock size={8} />
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <div
                      className="mt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="number"
                        className="w-full text-[10px] border border-charcoal/30 px-1 py-0.5 text-charcoal"
                        value={editRate}
                        onChange={(e) => setEditRate(e.target.value === "" ? "" : Number(e.target.value))}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveOverride(dateStr, Number(editRate) || 0);
                          if (e.key === "Escape") setEditingDate(null);
                        }}
                      />
                      <div className="flex gap-0.5 mt-0.5">
                        <button
                          className="text-[8px] bg-charcoal text-white px-1 py-0.5"
                          onClick={() => saveOverride(dateStr, Number(editRate) || 0)}
                        >
                          Save
                        </button>
                        <button
                          className="text-[8px] text-warm-gray px-1 py-0.5"
                          onClick={() => setEditingDate(null)}
                        >
                          Esc
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {rate ? (
                        <div className="mt-1">
                          <span className="text-xs font-medium text-charcoal block">
                            {fmt(rate.finalRate)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-warm-gray/50 mt-1 block">
                          —
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 text-[9px] text-warm-gray">
          <span className="flex items-center gap-1">
            <Lock size={8} /> Locked
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-cream/30 border border-light-gray inline-block" /> Weekend
          </span>
        </div>
      </Card>
    </div>
  );
}
