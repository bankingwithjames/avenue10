"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  DollarSign,
  Check,
  TrendingUp,
  ShoppingBag,
  Tag,
  Shield,
  FileText,
  BarChart3,
} from "lucide-react";
import { tabBase, btnClass } from "./_components/shared";
import PricingTab, {
  type PricingFormData,
  defaultPricingData,
} from "./_components/PricingTab";
import DynamicPricingTab, {
  type DynamicPricingData,
  defaultDynamicPricing,
} from "./_components/DynamicPricingTab";
import AddOnsTab, { type AddOnData } from "./_components/AddOnsTab";
import PromosTab from "./_components/PromosTab";
import BookingRulesTab from "./_components/BookingRulesTab";
import ChangeOrdersTab from "./_components/ChangeOrdersTab";
import AnalyticsTab from "./_components/AnalyticsTab";
import PricePreview from "./_components/PricePreview";

const LISTINGS = [
  { id: "cmr52no5h0001wo5tgz5nm1zk", title: "Main Home" },
  { id: "cmr52nof20002wo5tddtsx973", title: "Garage Apartment" },
];

const TABS = [
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "dynamic", label: "Dynamic Pricing", icon: TrendingUp },
  { id: "addons", label: "Add-Ons & Upsells", icon: ShoppingBag },
  { id: "promos", label: "Promos", icon: Tag },
  { id: "rules", label: "Booking Rules", icon: Shield },
  { id: "changes", label: "Change Orders", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
] as const;

type TabId = (typeof TABS)[number]["id"];

function SalesManagerPageInner() {
  const searchParams = useSearchParams();
  const initialListing = searchParams.get("listing");
  const [selectedListing, setSelectedListing] = useState(
    initialListing && LISTINGS.some(l => l.id === initialListing) ? initialListing : LISTINGS[0].id
  );
  const [activeTab, setActiveTab] = useState<TabId>("pricing");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Pricing form state
  const [pricingForm, setPricingForm] = useState<PricingFormData>({
    ...defaultPricingData,
  });
  const [serviceFeeType, setServiceFeeType] = useState<"percent" | "flat">(
    "percent"
  );
  const [depositType, setDepositType] = useState<"percent" | "flat">("percent");

  // Add-ons state
  const [addOns, setAddOns] = useState<AddOnData[]>([]);

  // Dynamic pricing state
  const [dynamicPricing, setDynamicPricing] = useState<DynamicPricingData>({
    ...defaultDynamicPricing,
  });
  const [savingDynamic, setSavingDynamic] = useState(false);

  const selectedTitle =
    LISTINGS.find((l) => l.id === selectedListing)?.title || "";

  // Load SalesConfig + AddOns for selected listing
  const loadConfig = useCallback(async (listingId: string) => {
    setLoading(true);
    setSaved(false);
    try {
      const [salesRes, dynRes] = await Promise.all([
        fetch(`/api/admin/sales?listingId=${listingId}`),
        fetch(`/api/admin/sales/dynamic-pricing?listingId=${listingId}`),
      ]);

      // Sales config
      if (salesRes.ok) {
        const data = await salesRes.json();
        if (data && data.id) {
          setPricingForm({
            boardRate: data.boardRate,
            weekendRate: data.weekendRate,
            cleaningFee: data.cleaningFee,
            petFee: data.petFee,
            extraGuestFee: data.extraGuestFee,
            extraGuestFeeType: data.extraGuestFeeType ?? "per_night",
            extraGuestThreshold: data.extraGuestThreshold,
            guestsIncluded: data.guestsIncluded ?? 2,
            maxGuests: data.maxGuests ?? 10,
            minimumStay: data.minimumStay ?? 1,
            maximumStay: data.maximumStay ?? 30,
            sameDayBookingAllowed: data.sameDayBookingAllowed ?? false,
            advanceNoticeHours: data.advanceNoticeHours ?? 24,
            taxRate: data.taxRate,
            taxLabel: data.taxLabel,
            serviceFeePercent: data.serviceFeePercent,
            serviceFeeFlat: data.serviceFeeFlat,
            serviceFeeLabel: data.serviceFeeLabel,
            depositHoldPercent: data.depositHoldPercent,
            depositHoldFlat: data.depositHoldFlat,
            depositHoldLabel: data.depositHoldLabel,
          });
          setServiceFeeType(data.serviceFeePercent > 0 ? "percent" : "flat");
          setDepositType(data.depositHoldPercent > 0 ? "percent" : "flat");
          setAddOns(
            (data.addOns || []).map(
              (a: Record<string, unknown>) => ({
                name: a.name as string,
                price: a.price as number,
                category: (a.category as string) || "service",
                description: (a.description as string) || "",
                pricingType: (a.pricingType as string) || "flat",
                guestVisible: a.guestVisible !== false,
                requiresAdminApproval: a.requiresAdminApproval === true,
                requiresInventory: a.requiresInventory === true,
                taxable: a.taxable !== false,
                isActive: a.isActive !== false,
              })
            )
          );
        } else {
          setPricingForm({ ...defaultPricingData });
          setServiceFeeType("percent");
          setDepositType("percent");
          setAddOns([]);
        }
      }

      // Dynamic pricing
      if (dynRes.ok) {
        const dynData = await dynRes.json();
        if (dynData && dynData.id) {
          setDynamicPricing({
            enabled: dynData.enabled,
            pricingMode: dynData.pricingMode,
            minimumRate: dynData.minimumRate,
            maximumRate: dynData.maximumRate,
            weekendPremiumPercent: dynData.weekendPremiumPercent,
            eventPremiumPercent: dynData.eventPremiumPercent,
            gapNightDiscountPercent: dynData.gapNightDiscountPercent,
            lastMinuteDiscountPercent: dynData.lastMinuteDiscountPercent,
            farOutPremiumPercent: dynData.farOutPremiumPercent,
            occupancyBasedEnabled: dynData.occupancyBasedEnabled,
            bookingPaceEnabled: dynData.bookingPaceEnabled,
            marketCompEnabled: dynData.marketCompEnabled,
            manualPriceLockEnabled: dynData.manualPriceLockEnabled,
            pricingProvider: dynData.pricingProvider || "",
          });
        } else {
          setDynamicPricing({ ...defaultDynamicPricing });
        }
      }
    } catch {
      setPricingForm({ ...defaultPricingData });
      setAddOns([]);
      setDynamicPricing({ ...defaultDynamicPricing });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadConfig(selectedListing);
  }, [selectedListing, loadConfig]);

  const updatePricing = <K extends keyof PricingFormData>(
    field: K,
    value: PricingFormData[K]
  ) => {
    setPricingForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const updateDynamic = <K extends keyof DynamicPricingData>(
    field: K,
    value: DynamicPricingData[K]
  ) => {
    setDynamicPricing((prev) => ({ ...prev, [field]: value }));
  };

  // Save pricing config + add-ons
  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        listingId: selectedListing,
        boardRate: pricingForm.boardRate ?? 0,
        weekendRate: pricingForm.weekendRate,
        cleaningFee: pricingForm.cleaningFee ?? 0,
        petFee: pricingForm.petFee ?? 0,
        extraGuestFee: pricingForm.extraGuestFee ?? 0,
        extraGuestFeeType: pricingForm.extraGuestFeeType,
        extraGuestThreshold: pricingForm.extraGuestThreshold ?? 2,
        guestsIncluded: pricingForm.guestsIncluded ?? 2,
        maxGuests: pricingForm.maxGuests ?? 10,
        minimumStay: pricingForm.minimumStay ?? 1,
        maximumStay: pricingForm.maximumStay ?? 30,
        sameDayBookingAllowed: pricingForm.sameDayBookingAllowed,
        advanceNoticeHours: pricingForm.advanceNoticeHours ?? 24,
        taxRate: pricingForm.taxRate ?? 0,
        taxLabel: pricingForm.taxLabel,
        serviceFeePercent:
          serviceFeeType === "percent" ? (pricingForm.serviceFeePercent ?? 0) : 0,
        serviceFeeFlat:
          serviceFeeType === "flat" ? (pricingForm.serviceFeeFlat ?? 0) : 0,
        serviceFeeLabel: pricingForm.serviceFeeLabel,
        depositHoldPercent:
          depositType === "percent" ? (pricingForm.depositHoldPercent ?? 0) : 0,
        depositHoldFlat:
          depositType === "flat" ? (pricingForm.depositHoldFlat ?? 0) : 0,
        depositHoldLabel: pricingForm.depositHoldLabel,
        addOns,
      };

      const res = await fetch("/api/admin/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Save failed:", err);
    }
    setSaving(false);
  };

  // Save dynamic pricing settings
  const [dynamicSaveResult, setDynamicSaveResult] = useState<string | null>(null);
  const handleSaveDynamic = async () => {
    setSavingDynamic(true);
    setDynamicSaveResult(null);
    try {
      const res = await fetch("/api/admin/sales/dynamic-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: selectedListing,
          ...dynamicPricing,
          minimumRate: dynamicPricing.minimumRate ?? 0,
          maximumRate: dynamicPricing.maximumRate ?? 0,
          weekendPremiumPercent: dynamicPricing.weekendPremiumPercent ?? 0,
          eventPremiumPercent: dynamicPricing.eventPremiumPercent ?? 0,
          gapNightDiscountPercent: dynamicPricing.gapNightDiscountPercent ?? 0,
          lastMinuteDiscountPercent: dynamicPricing.lastMinuteDiscountPercent ?? 0,
          farOutPremiumPercent: dynamicPricing.farOutPremiumPercent ?? 0,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ratesGenerated !== undefined) {
          setDynamicSaveResult(`Settings saved — ${data.ratesGenerated} daily rates generated`);
        } else {
          setDynamicSaveResult("Settings saved");
        }
        setTimeout(() => setDynamicSaveResult(null), 5000);
      }
    } catch {
      // fail silently
    }
    setSavingDynamic(false);
  };

  const showPreview =
    activeTab === "pricing" ||
    activeTab === "addons" ||
    activeTab === "dynamic";

  return (
    <div>
      <h1 className="font-serif text-2xl text-charcoal font-light mb-6 flex items-center gap-2">
        <DollarSign size={20} />
        Sales Manager
      </h1>

      {/* Listing Selector */}
      <div className="flex gap-2 mb-4">
        {LISTINGS.map((listing) => (
          <button
            key={listing.id}
            onClick={() => setSelectedListing(listing.id)}
            className={`${tabBase} ${
              selectedListing === listing.id
                ? "bg-charcoal text-white"
                : "bg-white text-warm-gray border border-light-gray hover:bg-cream"
            }`}
          >
            {listing.title}
          </button>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[10px] tracking-[0.1em] uppercase font-medium transition border-b-2 ${
              activeTab === tab.id
                ? "text-charcoal border-charcoal"
                : "text-warm-gray border-transparent hover:text-charcoal hover:border-light-gray"
            }`}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-xs text-warm-gray py-8 text-center">
          Loading configuration...
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main Content */}
          <div className="flex-1 min-w-0 w-full">
            {activeTab === "pricing" && (
              <>
                <PricingTab
                  form={pricingForm}
                  onUpdate={updatePricing}
                  serviceFeeType={serviceFeeType}
                  setServiceFeeType={setServiceFeeType}
                  depositType={depositType}
                  setDepositType={setDepositType}
                />
                <div className="flex items-center gap-3 mt-6">
                  <button
                    className={btnClass}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Configuration"}
                  </button>
                  {saved && (
                    <span className="text-xs text-charcoal/60 flex items-center gap-1">
                      <Check size={12} /> Configuration saved for{" "}
                      {selectedTitle}
                    </span>
                  )}
                </div>
              </>
            )}

            {activeTab === "dynamic" && (
              <DynamicPricingTab
                listingId={selectedListing}
                dynamicPricing={dynamicPricing}
                onUpdateDynamic={updateDynamic}
                onSaveDynamic={handleSaveDynamic}
                savingDynamic={savingDynamic}
                saveResult={dynamicSaveResult}
              />
            )}

            {activeTab === "addons" && (
              <>
                <AddOnsTab addOns={addOns} onUpdate={setAddOns} />
                <div className="flex items-center gap-3 mt-6">
                  <button
                    className={btnClass}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Add-Ons"}
                  </button>
                  {saved && (
                    <span className="text-xs text-charcoal/60 flex items-center gap-1">
                      <Check size={12} /> Add-ons saved for {selectedTitle}
                    </span>
                  )}
                </div>
              </>
            )}

            {activeTab === "promos" && <PromosTab listings={LISTINGS} />}

            {activeTab === "rules" && (
              <BookingRulesTab listingId={selectedListing} />
            )}

            {activeTab === "changes" && (
              <ChangeOrdersTab listingId={selectedListing} />
            )}

            {activeTab === "analytics" && (
              <AnalyticsTab listingId={selectedListing} />
            )}
          </div>

          {/* Price Preview Sidebar */}
          {showPreview && (
            <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-6">
              <PricePreview
                form={pricingForm}
                addOns={addOns}
                listingTitle={selectedTitle}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SalesManagerPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><p className="text-warm-gray text-sm">Loading...</p></div>}>
      <SalesManagerPageInner />
    </Suspense>
  );
}
