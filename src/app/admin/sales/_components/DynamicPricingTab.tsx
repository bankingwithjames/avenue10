"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Lock,
  BarChart3,
  TrendingUp,
  Building2,
  Shield,
  Eye,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
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
  btnDanger,
  badgeClass,
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

interface OccupancySettings {
  isEnabled: boolean;
  occupancyWindowDays: number;
  lowOccupancyThreshold: number | null;
  highOccupancyThreshold: number | null;
  lowOccupancyAdjustmentPercent: number | null;
  highOccupancyAdjustmentPercent: number | null;
  maxIncreasePercent: number | null;
  maxDecreasePercent: number | null;
  applyWeekdays: boolean;
  applyWeekends: boolean;
  excludeLockedDates: boolean;
  excludeEventDates: boolean;
  requireAdminApproval: boolean;
}

interface BookingPaceSettingsData {
  isEnabled: boolean;
  comparisonPeriodDays: number;
  fastPaceThresholdPercent: number | null;
  slowPaceThresholdPercent: number | null;
  fastPaceAdjustmentPercent: number | null;
  slowPaceAdjustmentPercent: number | null;
  maxAdjustmentPercent: number | null;
  applyFutureOpenDatesOnly: boolean;
  excludeLockedDates: boolean;
  requireAdminApproval: boolean;
}

interface MarketCompSettingsData {
  isEnabled: boolean;
  marketDataSource: string;
  compRadiusMiles: number | null;
  compPropertyType: string;
  bedroomMatchRequired: boolean;
  guestCapacityMatchRequired: boolean;
  targetMarketPosition: string;
  adjustmentStrength: string;
  minimumConfidenceScore: number | null;
  maxIncreasePercent: number | null;
  maxDecreasePercent: number | null;
  excludeWeakCompData: boolean;
  excludeLockedDates: boolean;
  requireAdminApproval: boolean;
}

interface PriceLock {
  id: string;
  startDate: string;
  endDate: string;
  lockedRate: number;
  lockReason: string | null;
  lockAppliesTo: string;
  expiresAt: string | null;
  preventAiChanges: boolean;
  preventBulkUpdates: boolean;
  preventDynamicRules: boolean;
}

interface PreviewRow {
  date: string;
  baseRate: number;
  occupancyAdjustment: number;
  bookingPaceAdjustment: number;
  marketCompAdjustment: number;
  manualLockRate: number | null;
  finalPreviewRate: number;
  rateSource: string;
  isBooked: boolean;
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

function RuleBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className={`${badgeClass} ${enabled ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
      {enabled ? "Active" : "Off"}
    </span>
  );
}

function RulePanel({
  icon,
  title,
  description,
  enabled,
  expanded,
  onToggleExpand,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`border ${enabled ? "border-charcoal/20" : "border-light-gray"} bg-white transition-all`}>
      <button
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-cream/30 transition"
        onClick={onToggleExpand}
      >
        <div className={`w-8 h-8 flex items-center justify-center rounded ${enabled ? "bg-charcoal text-white" : "bg-light-gray text-warm-gray"}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-charcoal">{title}</span>
            <RuleBadge enabled={enabled} />
          </div>
          <p className="text-[9px] text-warm-gray mt-0.5">{description}</p>
        </div>
        {expanded ? <ChevronUp size={14} className="text-warm-gray" /> : <ChevronDown size={14} className="text-warm-gray" />}
      </button>
      {expanded && (
        <div className="border-t border-light-gray p-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
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

  // Expanded panels
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);

  // Rule settings state
  const [occupancy, setOccupancy] = useState<OccupancySettings>({
    isEnabled: false, occupancyWindowDays: 30, lowOccupancyThreshold: 40, highOccupancyThreshold: 75,
    lowOccupancyAdjustmentPercent: 10, highOccupancyAdjustmentPercent: 15, maxIncreasePercent: 25,
    maxDecreasePercent: 15, applyWeekdays: true, applyWeekends: true, excludeLockedDates: true,
    excludeEventDates: true, requireAdminApproval: false,
  });
  const [bookingPace, setBookingPace] = useState<BookingPaceSettingsData>({
    isEnabled: false, comparisonPeriodDays: 90, fastPaceThresholdPercent: 120, slowPaceThresholdPercent: 80,
    fastPaceAdjustmentPercent: 10, slowPaceAdjustmentPercent: 10, maxAdjustmentPercent: 20,
    applyFutureOpenDatesOnly: true, excludeLockedDates: true, requireAdminApproval: false,
  });
  const [marketComp, setMarketComp] = useState<MarketCompSettingsData>({
    isEnabled: false, marketDataSource: "manual", compRadiusMiles: 5, compPropertyType: "entire_home",
    bedroomMatchRequired: true, guestCapacityMatchRequired: false, targetMarketPosition: "premium",
    adjustmentStrength: "balanced", minimumConfidenceScore: 60, maxIncreasePercent: 20,
    maxDecreasePercent: 15, excludeWeakCompData: true, excludeLockedDates: true, requireAdminApproval: false,
  });
  const [priceLocks, setPriceLocks] = useState<PriceLock[]>([]);
  const [savingRule, setSavingRule] = useState<string | null>(null);
  const [ruleResult, setRuleResult] = useState<string | null>(null);

  // New lock form
  const [newLock, setNewLock] = useState({ startDate: "", endDate: "", lockedRate: null as number | null, lockReason: "", lockAppliesTo: "rate_only", preventAiChanges: true, preventBulkUpdates: true, preventDynamicRules: true });

  // Preview
  const [previews, setPreview] = useState<PreviewRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Load rule settings
  useEffect(() => {
    async function loadRules() {
      const [occRes, paceRes, compRes, locksRes] = await Promise.all([
        fetch(`/api/admin/sales/pricing-rules/occupancy?listingId=${listingId}`),
        fetch(`/api/admin/sales/pricing-rules/booking-pace?listingId=${listingId}`),
        fetch(`/api/admin/sales/pricing-rules/market-comp?listingId=${listingId}`),
        fetch(`/api/admin/sales/pricing-rules/manual-locks?listingId=${listingId}`),
      ]);
      if (occRes.ok) { const d = await occRes.json(); if (d.id) setOccupancy(d); }
      if (paceRes.ok) { const d = await paceRes.json(); if (d.id) setBookingPace(d); }
      if (compRes.ok) { const d = await compRes.json(); if (d.id) setMarketComp(d); }
      if (locksRes.ok) { const d = await locksRes.json(); setPriceLocks(d.locks || []); }
    }
    loadRules();
  }, [listingId]);

  const loadDailyRates = useCallback(async () => {
    setLoadingRates(true);
    try {
      const start = calendarMonth.toISOString().split("T")[0];
      const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).toISOString().split("T")[0];
      const res = await fetch(`/api/admin/sales/daily-rates?listingId=${listingId}&start=${start}&end=${end}`);
      if (res.ok) { const data = await res.json(); setDailyRates(data.rates || []); }
    } catch { /* fail silently */ }
    setLoadingRates(false);
  }, [listingId, calendarMonth]);

  useEffect(() => { loadDailyRates(); }, [loadDailyRates]);

  const saveRuleSettings = async (ruleType: string, data: object) => {
    setSavingRule(ruleType);
    setRuleResult(null);
    try {
      const res = await fetch(`/api/admin/sales/pricing-rules/${ruleType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, ...data }),
      });
      if (res.ok) {
        setRuleResult(`${ruleType} settings saved`);
        setTimeout(() => setRuleResult(null), 3000);
      }
    } catch { /* fail silently */ }
    setSavingRule(null);
  };

  const createLock = async () => {
    if (!newLock.startDate || !newLock.endDate || !newLock.lockedRate) return;
    setSavingRule("manual-locks");
    try {
      const res = await fetch("/api/admin/sales/pricing-rules/manual-locks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, ...newLock, lockedRate: newLock.lockedRate ?? 0 }),
      });
      if (res.ok) {
        const locksRes = await fetch(`/api/admin/sales/pricing-rules/manual-locks?listingId=${listingId}`);
        if (locksRes.ok) { const d = await locksRes.json(); setPriceLocks(d.locks || []); }
        setNewLock({ startDate: "", endDate: "", lockedRate: null, lockReason: "", lockAppliesTo: "rate_only", preventAiChanges: true, preventBulkUpdates: true, preventDynamicRules: true });
        setRuleResult("Price lock created");
        loadDailyRates();
        setTimeout(() => setRuleResult(null), 3000);
      }
    } catch { /* fail silently */ }
    setSavingRule(null);
  };

  const deleteLock = async (lockId: string) => {
    try {
      await fetch(`/api/admin/sales/pricing-rules/manual-locks?id=${lockId}&listingId=${listingId}`, { method: "DELETE" });
      setPriceLocks((prev) => prev.filter((l) => l.id !== lockId));
      loadDailyRates();
    } catch { /* fail silently */ }
  };

  const loadPreview = async () => {
    setLoadingPreview(true);
    setShowPreview(true);
    try {
      const start = calendarMonth.toISOString().split("T")[0];
      const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).toISOString().split("T")[0];
      const res = await fetch(`/api/admin/sales/pricing-rules/preview?listingId=${listingId}&start=${start}&end=${end}`);
      if (res.ok) { const data = await res.json(); setPreview(data.previews || []); }
    } catch { /* fail silently */ }
    setLoadingPreview(false);
  };

  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
  const monthLabel = calendarMonth.toLocaleString("en-US", { month: "long", year: "numeric" });
  const rateMap = new Map(dailyRates.map((r) => [r.date.split("T")[0], r]));

  const saveOverride = async (date: string, rate: number) => {
    try {
      await fetch("/api/admin/sales/daily-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, date, manualOverrideRate: rate, isLocked: true }),
      });
      setEditingDate(null);
      loadDailyRates();
    } catch { /* fail silently */ }
  };

  const toggleLock = async (date: string, locked: boolean) => {
    try {
      await fetch("/api/admin/sales/daily-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, date, isLocked: locked }),
      });
      loadDailyRates();
    } catch { /* fail silently */ }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Pricing Engine */}
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
                <SelectInput label="Pricing Mode" value={dynamicPricing.pricingMode} onChange={(v) => onUpdateDynamic("pricingMode", v)} options={[{ value: "conservative", label: "Conservative" }, { value: "balanced", label: "Balanced" }, { value: "aggressive", label: "Aggressive" }]} />
                <NumberInput label="Minimum Rate" value={dynamicPricing.minimumRate} onChange={(v) => onUpdateDynamic("minimumRate", v)} prefix="$" />
                <NumberInput label="Maximum Rate" value={dynamicPricing.maximumRate} onChange={(v) => onUpdateDynamic("maximumRate", v)} prefix="$" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <NumberInput label="Weekend Premium" value={dynamicPricing.weekendPremiumPercent} onChange={(v) => onUpdateDynamic("weekendPremiumPercent", v)} suffix="%" step={0.5} />
                <NumberInput label="Event Premium" value={dynamicPricing.eventPremiumPercent} onChange={(v) => onUpdateDynamic("eventPremiumPercent", v)} suffix="%" step={0.5} />
                <NumberInput label="Gap-Night Discount" value={dynamicPricing.gapNightDiscountPercent} onChange={(v) => onUpdateDynamic("gapNightDiscountPercent", v)} suffix="%" step={0.5} />
                <NumberInput label="Last-Minute Discount" value={dynamicPricing.lastMinuteDiscountPercent} onChange={(v) => onUpdateDynamic("lastMinuteDiscountPercent", v)} suffix="%" step={0.5} />
                <NumberInput label="Far-Out Booking Premium" value={dynamicPricing.farOutPremiumPercent} onChange={(v) => onUpdateDynamic("farOutPremiumPercent", v)} suffix="%" step={0.5} />
              </div>

              <SelectInput label="AI Pricing Provider" value={dynamicPricing.pricingProvider} onChange={(v) => onUpdateDynamic("pricingProvider", v)} options={[{ value: "", label: "None (Manual Only)" }, { value: "airdna", label: "AirDNA" }, { value: "pricelabs", label: "PriceLabs" }, { value: "wheelhouse", label: "Wheelhouse" }, { value: "beyond", label: "Beyond Pricing" }, { value: "custom", label: "Custom Integration" }]} />
            </>
          )}

          <div className="flex items-center gap-3">
            <button className={btnClass} onClick={async () => { await onSaveDynamic(); loadDailyRates(); }} disabled={savingDynamic}>
              {savingDynamic ? "Generating rates..." : "Save Dynamic Pricing Settings"}
            </button>
            {saveResult && (
              <span className="text-xs text-charcoal/60 flex items-center gap-1"><Check size={12} /> {saveResult}</span>
            )}
          </div>
        </div>
      </Card>

      {/* Pricing Rules */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className={sectionHeader + " mb-0"}>Pricing Rules</h2>
          {ruleResult && (
            <span className="text-xs text-charcoal/60 flex items-center gap-1"><Check size={12} /> {ruleResult}</span>
          )}
        </div>
        <p className="text-[9px] text-warm-gray mb-4">
          Each rule feeds into the final daily rate. Calculation order: Base Rate → Weekend/Event → Occupancy → Booking Pace → Market Comp → Manual Lock → Min/Max Guardrails → Final Rate
        </p>

        <div className="space-y-2">
          {/* Occupancy-Based Pricing */}
          <RulePanel
            icon={<BarChart3 size={16} />}
            title="Occupancy-Based Pricing"
            description="Adjust rates based on current occupancy levels in a rolling window"
            enabled={occupancy.isEnabled}
            expanded={expandedPanel === "occupancy"}
            onToggleExpand={() => setExpandedPanel(expandedPanel === "occupancy" ? null : "occupancy")}
          >
            <Toggle label="Enable Occupancy-Based Pricing" checked={occupancy.isEnabled} onChange={(v) => setOccupancy({ ...occupancy, isEnabled: v })} />
            {occupancy.isEnabled && (
              <>
                <SelectInput label="Occupancy Window" value={String(occupancy.occupancyWindowDays)} onChange={(v) => setOccupancy({ ...occupancy, occupancyWindowDays: Number(v) })} options={[{ value: "7", label: "7 days" }, { value: "14", label: "14 days" }, { value: "30", label: "30 days" }, { value: "60", label: "60 days" }, { value: "90", label: "90 days" }]} />
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput label="Low Occupancy Threshold" value={occupancy.lowOccupancyThreshold} onChange={(v) => setOccupancy({ ...occupancy, lowOccupancyThreshold: v })} suffix="%" />
                  <NumberInput label="High Occupancy Threshold" value={occupancy.highOccupancyThreshold} onChange={(v) => setOccupancy({ ...occupancy, highOccupancyThreshold: v })} suffix="%" />
                  <NumberInput label="Low Occupancy Decrease" value={occupancy.lowOccupancyAdjustmentPercent} onChange={(v) => setOccupancy({ ...occupancy, lowOccupancyAdjustmentPercent: v })} suffix="%" />
                  <NumberInput label="High Occupancy Increase" value={occupancy.highOccupancyAdjustmentPercent} onChange={(v) => setOccupancy({ ...occupancy, highOccupancyAdjustmentPercent: v })} suffix="%" />
                  <NumberInput label="Max Increase" value={occupancy.maxIncreasePercent} onChange={(v) => setOccupancy({ ...occupancy, maxIncreasePercent: v })} suffix="%" />
                  <NumberInput label="Max Decrease" value={occupancy.maxDecreasePercent} onChange={(v) => setOccupancy({ ...occupancy, maxDecreasePercent: v })} suffix="%" />
                </div>
                <div className="space-y-2">
                  <Toggle label="Apply to weekdays" checked={occupancy.applyWeekdays} onChange={(v) => setOccupancy({ ...occupancy, applyWeekdays: v })} />
                  <Toggle label="Apply to weekends" checked={occupancy.applyWeekends} onChange={(v) => setOccupancy({ ...occupancy, applyWeekends: v })} />
                  <Toggle label="Exclude locked dates" checked={occupancy.excludeLockedDates} onChange={(v) => setOccupancy({ ...occupancy, excludeLockedDates: v })} />
                  <Toggle label="Exclude event dates" checked={occupancy.excludeEventDates} onChange={(v) => setOccupancy({ ...occupancy, excludeEventDates: v })} />
                  <Toggle label="Require admin approval" checked={occupancy.requireAdminApproval} onChange={(v) => setOccupancy({ ...occupancy, requireAdminApproval: v })} />
                </div>
              </>
            )}
            <div className="flex items-center gap-2 pt-2">
              <button className={btnClass} disabled={savingRule === "occupancy"} onClick={() => saveRuleSettings("occupancy", occupancy)}>
                {savingRule === "occupancy" ? "Saving..." : "Save Occupancy Rule"}
              </button>
              {occupancy.isEnabled && <button className={btnSecondary} onClick={() => { setOccupancy({ ...occupancy, isEnabled: false }); saveRuleSettings("occupancy", { ...occupancy, isEnabled: false }); }}>Disable Rule</button>}
            </div>
          </RulePanel>

          {/* Booking Pace Adjustment */}
          <RulePanel
            icon={<TrendingUp size={16} />}
            title="Booking Pace Adjustment"
            description="Adjust rates based on how fast bookings are coming in compared to historical pace"
            enabled={bookingPace.isEnabled}
            expanded={expandedPanel === "bookingPace"}
            onToggleExpand={() => setExpandedPanel(expandedPanel === "bookingPace" ? null : "bookingPace")}
          >
            <Toggle label="Enable Booking Pace Adjustment" checked={bookingPace.isEnabled} onChange={(v) => setBookingPace({ ...bookingPace, isEnabled: v })} />
            {bookingPace.isEnabled && (
              <>
                <SelectInput label="Comparison Period" value={String(bookingPace.comparisonPeriodDays)} onChange={(v) => setBookingPace({ ...bookingPace, comparisonPeriodDays: Number(v) })} options={[{ value: "30", label: "Last 30 days" }, { value: "60", label: "Last 60 days" }, { value: "90", label: "Last 90 days" }, { value: "180", label: "Last 180 days" }]} />
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput label="Fast Pace Threshold" value={bookingPace.fastPaceThresholdPercent} onChange={(v) => setBookingPace({ ...bookingPace, fastPaceThresholdPercent: v })} suffix="%" />
                  <NumberInput label="Slow Pace Threshold" value={bookingPace.slowPaceThresholdPercent} onChange={(v) => setBookingPace({ ...bookingPace, slowPaceThresholdPercent: v })} suffix="%" />
                  <NumberInput label="Fast Pace Increase" value={bookingPace.fastPaceAdjustmentPercent} onChange={(v) => setBookingPace({ ...bookingPace, fastPaceAdjustmentPercent: v })} suffix="%" />
                  <NumberInput label="Slow Pace Decrease" value={bookingPace.slowPaceAdjustmentPercent} onChange={(v) => setBookingPace({ ...bookingPace, slowPaceAdjustmentPercent: v })} suffix="%" />
                  <NumberInput label="Max Adjustment" value={bookingPace.maxAdjustmentPercent} onChange={(v) => setBookingPace({ ...bookingPace, maxAdjustmentPercent: v })} suffix="%" />
                </div>
                <p className={labelClass}>Lead Time Windows</p>
                <div className="grid grid-cols-4 gap-2">
                  {["0-7 days", "8-30 days", "31-90 days", "90+ days"].map((w) => (
                    <div key={w} className="bg-cream/50 border border-light-gray px-2 py-1.5 text-center">
                      <span className="text-[9px] text-warm-gray">{w}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Toggle label="Apply only to future open dates" checked={bookingPace.applyFutureOpenDatesOnly} onChange={(v) => setBookingPace({ ...bookingPace, applyFutureOpenDatesOnly: v })} />
                  <Toggle label="Exclude locked dates" checked={bookingPace.excludeLockedDates} onChange={(v) => setBookingPace({ ...bookingPace, excludeLockedDates: v })} />
                  <Toggle label="Require admin approval" checked={bookingPace.requireAdminApproval} onChange={(v) => setBookingPace({ ...bookingPace, requireAdminApproval: v })} />
                </div>
              </>
            )}
            <div className="flex items-center gap-2 pt-2">
              <button className={btnClass} disabled={savingRule === "booking-pace"} onClick={() => saveRuleSettings("booking-pace", bookingPace)}>
                {savingRule === "booking-pace" ? "Saving..." : "Save Booking Pace Rule"}
              </button>
              {bookingPace.isEnabled && <button className={btnSecondary} onClick={() => { setBookingPace({ ...bookingPace, isEnabled: false }); saveRuleSettings("booking-pace", { ...bookingPace, isEnabled: false }); }}>Disable Rule</button>}
            </div>
          </RulePanel>

          {/* Market Comp Adjustment */}
          <RulePanel
            icon={<Building2 size={16} />}
            title="Market Comp Adjustment"
            description="Adjust rates based on comparable listings in your market"
            enabled={marketComp.isEnabled}
            expanded={expandedPanel === "marketComp"}
            onToggleExpand={() => setExpandedPanel(expandedPanel === "marketComp" ? null : "marketComp")}
          >
            <Toggle label="Enable Market Comp Adjustment" checked={marketComp.isEnabled} onChange={(v) => setMarketComp({ ...marketComp, isEnabled: v })} />
            {marketComp.isEnabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <SelectInput label="Market Data Source" value={marketComp.marketDataSource} onChange={(v) => setMarketComp({ ...marketComp, marketDataSource: v })} options={[{ value: "manual", label: "Manual Entry" }, { value: "airdna", label: "AirDNA" }, { value: "pricelabs", label: "PriceLabs" }, { value: "wheelhouse", label: "Wheelhouse" }, { value: "beyond", label: "Beyond Pricing" }, { value: "custom", label: "Custom" }]} />
                  <NumberInput label="Comp Radius" value={marketComp.compRadiusMiles} onChange={(v) => setMarketComp({ ...marketComp, compRadiusMiles: v })} suffix="mi" />
                  <SelectInput label="Property Type" value={marketComp.compPropertyType} onChange={(v) => setMarketComp({ ...marketComp, compPropertyType: v })} options={[{ value: "entire_home", label: "Entire Home" }, { value: "private_room", label: "Private Room" }, { value: "shared_room", label: "Shared Room" }, { value: "any", label: "Any" }]} />
                  <SelectInput label="Target Position" value={marketComp.targetMarketPosition} onChange={(v) => setMarketComp({ ...marketComp, targetMarketPosition: v })} options={[{ value: "budget", label: "Budget" }, { value: "average", label: "Average" }, { value: "premium", label: "Premium" }, { value: "luxury", label: "Luxury" }]} />
                  <SelectInput label="Adjustment Strength" value={marketComp.adjustmentStrength} onChange={(v) => setMarketComp({ ...marketComp, adjustmentStrength: v })} options={[{ value: "conservative", label: "Conservative (25%)" }, { value: "balanced", label: "Balanced (50%)" }, { value: "aggressive", label: "Aggressive (75%)" }]} />
                  <NumberInput label="Min Confidence Score" value={marketComp.minimumConfidenceScore} onChange={(v) => setMarketComp({ ...marketComp, minimumConfidenceScore: v })} suffix="%" />
                  <NumberInput label="Max Increase" value={marketComp.maxIncreasePercent} onChange={(v) => setMarketComp({ ...marketComp, maxIncreasePercent: v })} suffix="%" />
                  <NumberInput label="Max Decrease" value={marketComp.maxDecreasePercent} onChange={(v) => setMarketComp({ ...marketComp, maxDecreasePercent: v })} suffix="%" />
                </div>
                <div className="space-y-2">
                  <Toggle label="Require bedroom count match" checked={marketComp.bedroomMatchRequired} onChange={(v) => setMarketComp({ ...marketComp, bedroomMatchRequired: v })} />
                  <Toggle label="Require guest capacity match" checked={marketComp.guestCapacityMatchRequired} onChange={(v) => setMarketComp({ ...marketComp, guestCapacityMatchRequired: v })} />
                  <Toggle label="Exclude weak comp data" checked={marketComp.excludeWeakCompData} onChange={(v) => setMarketComp({ ...marketComp, excludeWeakCompData: v })} />
                  <Toggle label="Exclude locked dates" checked={marketComp.excludeLockedDates} onChange={(v) => setMarketComp({ ...marketComp, excludeLockedDates: v })} />
                  <Toggle label="Require admin approval" checked={marketComp.requireAdminApproval} onChange={(v) => setMarketComp({ ...marketComp, requireAdminApproval: v })} />
                </div>
              </>
            )}
            <div className="flex items-center gap-2 pt-2">
              <button className={btnClass} disabled={savingRule === "market-comp"} onClick={() => saveRuleSettings("market-comp", marketComp)}>
                {savingRule === "market-comp" ? "Saving..." : "Save Market Comp Rule"}
              </button>
              {marketComp.isEnabled && <button className={btnSecondary} onClick={() => { setMarketComp({ ...marketComp, isEnabled: false }); saveRuleSettings("market-comp", { ...marketComp, isEnabled: false }); }}>Disable Rule</button>}
            </div>
          </RulePanel>

          {/* Manual Price Lock */}
          <RulePanel
            icon={<Shield size={16} />}
            title="Manual Price Lock"
            description="Lock specific dates or date ranges to a fixed rate that overrides all dynamic pricing"
            enabled={dynamicPricing.manualPriceLockEnabled}
            expanded={expandedPanel === "manualLock"}
            onToggleExpand={() => setExpandedPanel(expandedPanel === "manualLock" ? null : "manualLock")}
          >
            <Toggle label="Enable Manual Price Locks" checked={dynamicPricing.manualPriceLockEnabled} onChange={(v) => onUpdateDynamic("manualPriceLockEnabled", v)} description="When enabled, locked dates cannot be changed by any dynamic pricing rule" />

            {dynamicPricing.manualPriceLockEnabled && (
              <>
                {/* Existing locks */}
                {priceLocks.length > 0 && (
                  <div>
                    <p className={labelClass}>Active Locks</p>
                    <div className="space-y-1.5">
                      {priceLocks.map((lock) => (
                        <div key={lock.id} className="flex items-center justify-between bg-cream/30 border border-light-gray px-3 py-2">
                          <div className="flex items-center gap-3">
                            <Lock size={12} className="text-charcoal/40" />
                            <div>
                              <span className="text-xs text-charcoal">
                                {new Date(lock.startDate).toLocaleDateString()} – {new Date(lock.endDate).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-charcoal font-medium ml-2">{fmt(lock.lockedRate)}/night</span>
                            </div>
                            {lock.lockReason && <span className="text-[9px] text-warm-gray">— {lock.lockReason}</span>}
                          </div>
                          <button className="text-warm-gray hover:text-red-600 transition" onClick={() => deleteLock(lock.id)}><Trash2 size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New lock form */}
                <div className="border border-dashed border-light-gray p-4 space-y-3">
                  <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium flex items-center gap-1"><Plus size={10} /> Create New Lock</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>Start Date</label>
                      <input type="date" className={inputClass} value={newLock.startDate} onChange={(e) => setNewLock({ ...newLock, startDate: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>End Date</label>
                      <input type="date" className={inputClass} value={newLock.endDate} onChange={(e) => setNewLock({ ...newLock, endDate: e.target.value })} />
                    </div>
                    <NumberInput label="Locked Rate" value={newLock.lockedRate} onChange={(v) => setNewLock({ ...newLock, lockedRate: v })} prefix="$" />
                  </div>
                  <div>
                    <label className={labelClass}>Lock Reason</label>
                    <input className={inputClass} value={newLock.lockReason} onChange={(e) => setNewLock({ ...newLock, lockReason: e.target.value })} placeholder="e.g., Holiday pricing, Special event" />
                  </div>
                  <SelectInput label="Lock Applies To" value={newLock.lockAppliesTo} onChange={(v) => setNewLock({ ...newLock, lockAppliesTo: v })} options={[{ value: "rate_only", label: "Rate Only" }, { value: "minimum_stay", label: "Rate + Minimum Stay" }, { value: "fees", label: "Rate + Fees" }, { value: "full_date", label: "Full Date (Rate, Stay, Fees)" }]} />
                  <div className="space-y-2">
                    <Toggle label="Prevent AI pricing changes" checked={newLock.preventAiChanges} onChange={(v) => setNewLock({ ...newLock, preventAiChanges: v })} />
                    <Toggle label="Prevent bulk updates" checked={newLock.preventBulkUpdates} onChange={(v) => setNewLock({ ...newLock, preventBulkUpdates: v })} />
                    <Toggle label="Prevent dynamic rule changes" checked={newLock.preventDynamicRules} onChange={(v) => setNewLock({ ...newLock, preventDynamicRules: v })} />
                  </div>
                  <button className={btnClass} disabled={savingRule === "manual-locks" || !newLock.startDate || !newLock.endDate || !newLock.lockedRate} onClick={createLock}>
                    {savingRule === "manual-locks" ? "Creating..." : "Create Price Lock"}
                  </button>
                </div>

                <div className="flex items-center gap-1 text-[9px] text-warm-gray">
                  <AlertTriangle size={10} />
                  <span>Locked dates cannot be changed by any dynamic pricing rule. Only admin unlock removes the lock.</span>
                </div>
              </>
            )}
          </RulePanel>
        </div>
      </Card>

      {/* Pricing Impact Preview */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className={sectionHeader + " mb-0"}>Pricing Impact Preview</h2>
          <button className={btnSecondary + " flex items-center gap-1"} onClick={loadPreview} disabled={loadingPreview}>
            <Eye size={12} /> {loadingPreview ? "Loading..." : "Preview Changes"}
          </button>
        </div>

        {showPreview && (
          <div className="overflow-x-auto">
            {loadingPreview ? (
              <p className="text-xs text-warm-gray py-8 text-center">Generating preview...</p>
            ) : previews.length > 0 ? (
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-light-gray">
                    <th className="text-left py-2 text-[9px] tracking-[0.1em] uppercase text-warm-gray font-medium">Date</th>
                    <th className="text-right py-2 text-[9px] tracking-[0.1em] uppercase text-warm-gray font-medium">Base</th>
                    <th className="text-right py-2 text-[9px] tracking-[0.1em] uppercase text-warm-gray font-medium">Occupancy</th>
                    <th className="text-right py-2 text-[9px] tracking-[0.1em] uppercase text-warm-gray font-medium">Pace</th>
                    <th className="text-right py-2 text-[9px] tracking-[0.1em] uppercase text-warm-gray font-medium">Market</th>
                    <th className="text-right py-2 text-[9px] tracking-[0.1em] uppercase text-warm-gray font-medium">Lock</th>
                    <th className="text-right py-2 text-[9px] tracking-[0.1em] uppercase text-warm-gray font-medium">Final</th>
                    <th className="text-left py-2 pl-2 text-[9px] tracking-[0.1em] uppercase text-warm-gray font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {previews.filter((p) => !p.isBooked).map((p) => (
                    <tr key={p.date} className="border-b border-light-gray/50 hover:bg-cream/30">
                      <td className="py-1.5 text-charcoal">{new Date(p.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</td>
                      <td className="text-right text-charcoal">{fmt(p.baseRate)}</td>
                      <td className={`text-right ${p.occupancyAdjustment > 0 ? "text-green-600" : p.occupancyAdjustment < 0 ? "text-red-600" : "text-warm-gray"}`}>
                        {p.occupancyAdjustment !== 0 ? `${p.occupancyAdjustment > 0 ? "+" : ""}${fmt(p.occupancyAdjustment)}` : "—"}
                      </td>
                      <td className={`text-right ${p.bookingPaceAdjustment > 0 ? "text-green-600" : p.bookingPaceAdjustment < 0 ? "text-red-600" : "text-warm-gray"}`}>
                        {p.bookingPaceAdjustment !== 0 ? `${p.bookingPaceAdjustment > 0 ? "+" : ""}${fmt(p.bookingPaceAdjustment)}` : "—"}
                      </td>
                      <td className={`text-right ${p.marketCompAdjustment > 0 ? "text-green-600" : p.marketCompAdjustment < 0 ? "text-red-600" : "text-warm-gray"}`}>
                        {p.marketCompAdjustment !== 0 ? `${p.marketCompAdjustment > 0 ? "+" : ""}${fmt(p.marketCompAdjustment)}` : "—"}
                      </td>
                      <td className="text-right">
                        {p.isLocked ? <span className="flex items-center justify-end gap-0.5 text-charcoal"><Lock size={8} /> {fmt(p.manualLockRate!)}</span> : <span className="text-warm-gray">—</span>}
                      </td>
                      <td className="text-right font-medium text-charcoal">{fmt(p.finalPreviewRate)}</td>
                      <td className="pl-2">
                        <span className={`${badgeClass} text-[8px] ${p.rateSource === "manual_lock" ? "bg-yellow-50 text-yellow-700 border border-yellow-200" : p.rateSource === "dynamic" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                          {p.rateSource}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-warm-gray py-4 text-center">No preview data. Click "Preview Changes" to generate.</p>
            )}
          </div>
        )}
      </Card>

      {/* Final Daily Rates Calendar */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className={sectionHeader + " mb-0"}>Final Daily Rates</h2>
          <div className="flex items-center gap-2">
            <button className={btnSecondary} onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
              <ChevronLeft size={12} />
            </button>
            <span className="text-xs text-charcoal font-medium min-w-[140px] text-center">{monthLabel}</span>
            <button className={btnSecondary} onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
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
              <div key={d} className="bg-cream py-1.5 text-center text-[9px] tracking-[0.1em] uppercase text-warm-gray font-medium">{d}</div>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`e-${i}`} className="bg-white p-2 min-h-[70px]" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const rate = rateMap.get(dateStr);
              const isWeekend = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day).getDay() === 5 || new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day).getDay() === 6;
              const isEditing = editingDate === dateStr;

              return (
                <div
                  key={day}
                  className={`bg-white p-1.5 min-h-[70px] cursor-pointer hover:bg-cream/50 transition relative ${isWeekend ? "bg-cream/30" : ""} ${rate?.isLocked ? "ring-1 ring-inset ring-charcoal/20" : ""}`}
                  onClick={() => { if (!isEditing) { setEditingDate(dateStr); setEditRate(rate?.finalRate || 0); } }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-warm-gray">{day}</span>
                    {rate?.isLocked && (
                      <button className="text-charcoal/40 hover:text-charcoal" onClick={(e) => { e.stopPropagation(); toggleLock(dateStr, false); }}>
                        <Lock size={8} />
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                      <input type="number" className="w-full text-[10px] border border-charcoal/30 px-1 py-0.5 text-charcoal" value={editRate} onChange={(e) => setEditRate(e.target.value === "" ? "" : Number(e.target.value))} autoFocus onKeyDown={(e) => { if (e.key === "Enter") saveOverride(dateStr, Number(editRate) || 0); if (e.key === "Escape") setEditingDate(null); }} />
                      <div className="flex gap-0.5 mt-0.5">
                        <button className="text-[8px] bg-charcoal text-white px-1 py-0.5" onClick={() => saveOverride(dateStr, Number(editRate) || 0)}>Save</button>
                        <button className="text-[8px] text-warm-gray px-1 py-0.5" onClick={() => setEditingDate(null)}>Esc</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {rate ? (
                        <div className="mt-1">
                          <span className="text-xs font-medium text-charcoal block">{fmt(rate.finalRate)}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-warm-gray/50 mt-1 block">—</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 text-[9px] text-warm-gray">
          <span className="flex items-center gap-1"><Lock size={8} /> Locked</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-cream/30 border border-light-gray inline-block" /> Weekend</span>
        </div>
      </Card>
    </div>
  );
}
