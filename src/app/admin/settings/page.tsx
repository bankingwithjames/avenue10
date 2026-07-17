"use client";

import { useState, useEffect } from "react";
import { Settings, Building2, DoorOpen, DollarSign, Bell, Check } from "lucide-react";

type Tab = "profile" | "portal" | "pricing" | "notifications";

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "profile", label: "Business Profile", icon: <Building2 size={12} /> },
  { key: "portal", label: "Guest Portal", icon: <DoorOpen size={12} /> },
  { key: "pricing", label: "Pricing", icon: <DollarSign size={12} /> },
  { key: "notifications", label: "Notifications", icon: <Bell size={12} /> },
];

const inputClass = "w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 transition-colors";
const labelClass = "text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1 block";
const btnClass = "bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5";
const tabBase = "px-4 py-1.5 text-[10px] tracking-[0.15em] uppercase font-medium transition flex items-center gap-1.5 rounded-full";

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-xs text-charcoal">{label}</span>
      <div
        className={`w-9 h-5 rounded-full transition-colors ${value ? "bg-charcoal" : "bg-light-gray"} relative`}
        onClick={() => onChange(!value)}
      >
        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${value ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </label>
  );
}

function SaveButton({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button className={btnClass} onClick={onSave}>Save</button>
      {saved && (
        <span className="text-xs text-charcoal/60 flex items-center gap-1">
          <Check size={12} /> Saved!
        </span>
      )}
    </div>
  );
}

function useLocalStorage<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>, boolean, () => void] {
  const [data, setData] = useState<T>(initial);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only localStorage hydration on mount; intended side effect
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, [key]);

  const save = () => {
    localStorage.setItem(key, JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return [data, setData, saved, save];
}

function ProfileTab() {
  const [data, setData, saved, save] = useLocalStorage("avenue10-settings-profile", {
    businessName: "Avenue10",
    businessEmail: "",
    businessPhone: "",
    businessAddress: "",
    timezone: "America/New_York",
    currency: "USD",
  });

  const update = (field: string, value: string) => setData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Business Name</label>
        <input className={inputClass} value={data.businessName} onChange={(e) => update("businessName", e.target.value)} />
      </div>
      <div>
        <label className={labelClass}>Business Email</label>
        <input className={inputClass} type="email" value={data.businessEmail} onChange={(e) => update("businessEmail", e.target.value)} />
      </div>
      <div>
        <label className={labelClass}>Business Phone</label>
        <input className={inputClass} type="tel" value={data.businessPhone} onChange={(e) => update("businessPhone", e.target.value)} />
      </div>
      <div>
        <label className={labelClass}>Business Address</label>
        <input className={inputClass} value={data.businessAddress} onChange={(e) => update("businessAddress", e.target.value)} />
      </div>
      <div>
        <label className={labelClass}>Timezone</label>
        <select className={inputClass} value={data.timezone} onChange={(e) => update("timezone", e.target.value)}>
          <option value="America/New_York">America/New_York</option>
          <option value="America/Chicago">America/Chicago</option>
          <option value="America/Denver">America/Denver</option>
          <option value="America/Los_Angeles">America/Los_Angeles</option>
          <option value="America/Anchorage">America/Anchorage</option>
          <option value="Pacific/Honolulu">Pacific/Honolulu</option>
        </select>
      </div>
      <div>
        <label className={labelClass}>Currency</label>
        <select className={inputClass} value={data.currency} onChange={(e) => update("currency", e.target.value)}>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="CAD">CAD</option>
          <option value="AUD">AUD</option>
        </select>
      </div>
      <SaveButton onSave={save} saved={saved} />
    </div>
  );
}

function PortalTab() {
  const [data, setData, saved, save] = useLocalStorage("avenue10-settings-portal", {
    checkInTime: "3:00 PM",
    checkOutTime: "11:00 AM",
    termsSignatureRequired: true,
    doorCodeVisibility: 4,
    autoSendPortalLink: false,
    autoSendReviewRequest: false,
  });

  const update = (field: string, value: string | number | boolean) => setData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Default Check-in Time</label>
        <input className={inputClass} value={data.checkInTime} onChange={(e) => update("checkInTime", e.target.value)} />
      </div>
      <div>
        <label className={labelClass}>Default Check-out Time</label>
        <input className={inputClass} value={data.checkOutTime} onChange={(e) => update("checkOutTime", e.target.value)} />
      </div>
      <Toggle label="Terms Signature Required" value={data.termsSignatureRequired} onChange={(v) => update("termsSignatureRequired", v)} />
      <div>
        <label className={labelClass}>Door Code Visibility (Hours Before Check-in)</label>
        <input className={inputClass} type="number" value={data.doorCodeVisibility} onChange={(e) => update("doorCodeVisibility", Number(e.target.value))} />
      </div>
      <Toggle label="Auto-send Portal Link" value={data.autoSendPortalLink} onChange={(v) => update("autoSendPortalLink", v)} />
      <Toggle label="Auto-send Review Request" value={data.autoSendReviewRequest} onChange={(v) => update("autoSendReviewRequest", v)} />
      <SaveButton onSave={save} saved={saved} />
    </div>
  );
}

function PricingTab() {
  const [data, setData, saved, save] = useLocalStorage("avenue10-settings-pricing", {
    cleaningFee: 0,
    serviceFeePercent: 0,
    minStayNights: 1,
    maxStayNights: 30,
    weekendRateMultiplier: 1.0,
  });

  const update = (field: string, value: number) => setData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Default Cleaning Fee</label>
        <input className={inputClass} type="number" value={data.cleaningFee || ""} onChange={(e) => update("cleaningFee", Number(e.target.value))} placeholder="0.00" />
      </div>
      <div>
        <label className={labelClass}>Default Service Fee %</label>
        <input className={inputClass} type="number" value={data.serviceFeePercent || ""} onChange={(e) => update("serviceFeePercent", Number(e.target.value))} placeholder="0" />
      </div>
      <div>
        <label className={labelClass}>Minimum Stay Nights</label>
        <input className={inputClass} type="number" value={data.minStayNights} onChange={(e) => update("minStayNights", Number(e.target.value))} />
      </div>
      <div>
        <label className={labelClass}>Maximum Stay Nights</label>
        <input className={inputClass} type="number" value={data.maxStayNights} onChange={(e) => update("maxStayNights", Number(e.target.value))} />
      </div>
      <div>
        <label className={labelClass}>Weekend Rate Multiplier</label>
        <input className={inputClass} type="number" step={0.1} value={data.weekendRateMultiplier} onChange={(e) => update("weekendRateMultiplier", Number(e.target.value))} />
      </div>
      <SaveButton onSave={save} saved={saved} />
    </div>
  );
}

function NotificationsTab() {
  const [data, setData, saved, save] = useLocalStorage("avenue10-settings-notifications", {
    emailNotifications: true,
    newBookingAlert: true,
    guestRequestAlert: true,
    checkoutReminder: true,
    reviewRequest: false,
    lowInventoryAlert: false,
  });

  const update = (field: string, value: boolean) => setData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-3">
      <Toggle label="Email Notifications" value={data.emailNotifications} onChange={(v) => update("emailNotifications", v)} />
      <Toggle label="New Booking Alert" value={data.newBookingAlert} onChange={(v) => update("newBookingAlert", v)} />
      <Toggle label="Guest Request Alert" value={data.guestRequestAlert} onChange={(v) => update("guestRequestAlert", v)} />
      <Toggle label="Checkout Reminder" value={data.checkoutReminder} onChange={(v) => update("checkoutReminder", v)} />
      <Toggle label="Review Request" value={data.reviewRequest} onChange={(v) => update("reviewRequest", v)} />
      <Toggle label="Low Inventory Alert" value={data.lowInventoryAlert} onChange={(v) => update("lowInventoryAlert", v)} />
      <SaveButton onSave={save} saved={saved} />
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div>
      <h1 className="font-serif text-2xl text-charcoal font-light mb-6 flex items-center gap-2">
        <Settings size={20} />
        Settings
      </h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`${tabBase} ${
              activeTab === tab.key
                ? "bg-charcoal text-white"
                : "bg-white text-warm-gray border border-light-gray hover:bg-cream"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-light-gray p-6">
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "portal" && <PortalTab />}
        {activeTab === "pricing" && <PricingTab />}
        {activeTab === "notifications" && <NotificationsTab />}
      </div>
    </div>
  );
}
