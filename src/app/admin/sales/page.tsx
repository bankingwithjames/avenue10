"use client";

import { useState, useEffect, useCallback } from "react";
import { DollarSign, Plus, Trash2, Check, Eye } from "lucide-react";

const inputClass =
  "w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 transition-colors";
const labelClass =
  "text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1 block";
const sectionHeader =
  "text-[10px] tracking-[0.3em] uppercase text-warm-gray font-medium mb-4";
const btnClass =
  "bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5";
const btnSecondary =
  "bg-white text-charcoal text-[10px] tracking-[0.15em] uppercase font-medium border border-light-gray hover:bg-cream transition px-4 py-2.5";
const tabBase =
  "px-4 py-1.5 text-[10px] tracking-[0.15em] uppercase font-medium transition flex items-center gap-1.5 rounded-full";

interface AddOn {
  name: string;
  price: number;
  category: string;
  description: string;
  isActive: boolean;
}

interface SalesFormData {
  boardRate: number;
  weekendRate: number | null;
  cleaningFee: number;
  taxRate: number;
  taxLabel: string;
  serviceFeePercent: number;
  serviceFeeFlat: number;
  serviceFeeLabel: string;
  depositHoldPercent: number;
  depositHoldFlat: number;
  depositHoldLabel: string;
  petFee: number;
  extraGuestFee: number;
  extraGuestThreshold: number;
  addOns: AddOn[];
}

const defaultFormData: SalesFormData = {
  boardRate: 0,
  weekendRate: null,
  cleaningFee: 0,
  taxRate: 0,
  taxLabel: "Taxes & Fees",
  serviceFeePercent: 0,
  serviceFeeFlat: 0,
  serviceFeeLabel: "Service Fee",
  depositHoldPercent: 0,
  depositHoldFlat: 0,
  depositHoldLabel: "Security Deposit Hold",
  petFee: 0,
  extraGuestFee: 0,
  extraGuestThreshold: 2,
  addOns: [],
};

const LISTINGS = [
  { id: "cmr52no5h0001wo5tgz5nm1zk", title: "Main Home" },
  { id: "cmr52nof20002wo5tddtsx973", title: "Garage Apartment" },
];

function NumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step,
  placeholder,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray text-xs">
            {prefix}
          </span>
        )}
        <input
          type="number"
          className={`${inputClass} ${prefix ? "pl-7" : ""} ${suffix ? "pr-8" : ""}`}
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
          step={step || 1}
          min={0}
          placeholder={placeholder}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray text-xs">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex gap-4">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <div
              className={`w-3.5 h-3.5 rounded-full border ${
                value === opt.value
                  ? "border-charcoal bg-charcoal"
                  : "border-light-gray"
              } flex items-center justify-center`}
              onClick={() => onChange(opt.value)}
            >
              {value === opt.value && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </div>
            <span className="text-xs text-charcoal">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function AddOnRow({
  addOn,
  onUpdate,
  onDelete,
}: {
  addOn: AddOn;
  onUpdate: (a: AddOn) => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b border-light-gray last:border-0">
      <td className="py-2 pr-3">
        <span className="text-xs text-charcoal">{addOn.name}</span>
      </td>
      <td className="py-2 pr-3">
        <span className="text-xs text-charcoal">${addOn.price.toFixed(2)}</span>
      </td>
      <td className="py-2 pr-3">
        <span className="text-[9px] tracking-[0.1em] uppercase text-warm-gray">
          {addOn.category}
        </span>
      </td>
      <td className="py-2 pr-3">
        <div
          className={`w-8 h-4 rounded-full transition-colors cursor-pointer ${
            addOn.isActive ? "bg-charcoal" : "bg-light-gray"
          } relative`}
          onClick={() => onUpdate({ ...addOn, isActive: !addOn.isActive })}
        >
          <div
            className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${
              addOn.isActive ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </div>
      </td>
      <td className="py-2">
        <button
          onClick={onDelete}
          className="text-warm-gray hover:text-charcoal transition"
        >
          <Trash2 size={12} />
        </button>
      </td>
    </tr>
  );
}

function AddOnForm({ onAdd }: { onAdd: (a: AddOn) => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState("service");
  const [description, setDescription] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      price,
      category,
      description,
      isActive: true,
    });
    setName("");
    setPrice(0);
    setCategory("service");
    setDescription("");
  };

  return (
    <div className="flex gap-2 items-end flex-wrap mt-3">
      <div className="flex-1 min-w-[140px]">
        <label className={labelClass}>Name</label>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Early Check-in"
        />
      </div>
      <div className="w-24">
        <label className={labelClass}>Price</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray text-xs">
            $
          </span>
          <input
            type="number"
            className={`${inputClass} pl-7`}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            min={0}
          />
        </div>
      </div>
      <div className="w-32">
        <label className={labelClass}>Category</label>
        <select
          className={inputClass}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="service">Service</option>
          <option value="amenity">Amenity</option>
          <option value="equipment">Equipment</option>
        </select>
      </div>
      <div className="flex-1 min-w-[140px]">
        <label className={labelClass}>Description</label>
        <input
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
        />
      </div>
      <button className={btnSecondary} onClick={handleAdd}>
        <Plus size={10} className="inline mr-1" />
        Add
      </button>
    </div>
  );
}

function LivePreview({ form }: { form: SalesFormData }) {
  const previewNights = 3;
  const boardRate = form.boardRate || 0;
  const weekendRate = form.weekendRate ?? boardRate;

  // Simulate 3 nights: Thu, Fri, Sat for preview
  const nightlyTotal = boardRate + weekendRate + weekendRate;
  const subtotal = previewNights > 0 ? nightlyTotal : 0;
  const cleaningFee = form.cleaningFee || 0;
  const petFee = form.petFee || 0;
  const extraGuestFee = 0;
  const taxableAmount = subtotal + cleaningFee + petFee + extraGuestFee;
  const taxAmount = taxableAmount * ((form.taxRate || 0) / 100);

  let serviceFee = 0;
  if (form.serviceFeePercent > 0) {
    serviceFee = subtotal * (form.serviceFeePercent / 100);
  } else {
    serviceFee = form.serviceFeeFlat || 0;
  }

  const addOnsTotal = form.addOns
    .filter((a) => a.isActive)
    .reduce((s, a) => s + a.price, 0);

  const totalBeforeDeposit =
    subtotal + cleaningFee + petFee + taxAmount + serviceFee + addOnsTotal;

  let depositHold = 0;
  if (form.depositHoldPercent > 0) {
    depositHold = totalBeforeDeposit * (form.depositHoldPercent / 100);
  } else {
    depositHold = form.depositHoldFlat || 0;
  }

  const total = totalBeforeDeposit + depositHold;

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="bg-white border border-light-gray p-5">
      <div className="flex items-center gap-2 mb-4">
        <Eye size={12} className="text-warm-gray" />
        <h3 className={sectionHeader + " mb-0"}>Price Preview</h3>
      </div>
      <p className="text-[9px] text-warm-gray mb-4">
        Sample: 3 nights (Thu-Sat), no extra guests
      </p>

      <div className="space-y-2.5">
        <div className="flex justify-between text-xs text-charcoal">
          <span>
            Board Rate: {fmt(boardRate)} x 1 +{" "}
            {fmt(weekendRate)} x 2
          </span>
          <span>{fmt(subtotal)}</span>
        </div>

        {cleaningFee > 0 && (
          <div className="flex justify-between text-xs text-charcoal">
            <span>Cleaning Fee</span>
            <span>{fmt(cleaningFee)}</span>
          </div>
        )}

        {petFee > 0 && (
          <div className="flex justify-between text-xs text-charcoal">
            <span>Pet Fee</span>
            <span>{fmt(petFee)}</span>
          </div>
        )}

        {taxAmount > 0 && (
          <div className="flex justify-between text-xs text-charcoal">
            <span>
              {form.taxLabel || "Taxes & Fees"} ({form.taxRate}%)
            </span>
            <span>{fmt(taxAmount)}</span>
          </div>
        )}

        {serviceFee > 0 && (
          <div className="flex justify-between text-xs text-charcoal">
            <span>{form.serviceFeeLabel || "Service Fee"}</span>
            <span>{fmt(serviceFee)}</span>
          </div>
        )}

        {addOnsTotal > 0 && (
          <div className="flex justify-between text-xs text-charcoal">
            <span>Add-Ons ({form.addOns.filter((a) => a.isActive).length})</span>
            <span>{fmt(addOnsTotal)}</span>
          </div>
        )}

        {depositHold > 0 && (
          <div className="flex justify-between text-xs text-charcoal">
            <span>
              {form.depositHoldLabel || "Security Deposit Hold"}
              <span className="text-[9px] text-warm-gray ml-1">(refundable)</span>
            </span>
            <span>{fmt(depositHold)}</span>
          </div>
        )}

        <div className="border-t border-light-gray pt-2.5 mt-2.5 flex justify-between text-xs font-medium text-charcoal">
          <span>Final Charge</span>
          <span>{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const [selectedListing, setSelectedListing] = useState(LISTINGS[0].id);
  const [form, setForm] = useState<SalesFormData>({ ...defaultFormData });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [serviceFeeType, setServiceFeeType] = useState<"percent" | "flat">("percent");
  const [depositType, setDepositType] = useState<"percent" | "flat">("percent");
  const [showAddOnForm, setShowAddOnForm] = useState(false);

  const loadConfig = useCallback(async (listingId: string) => {
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/sales?listingId=${listingId}`);
      const data = await res.json();
      if (data && data.id) {
        setForm({
          boardRate: data.boardRate,
          weekendRate: data.weekendRate,
          cleaningFee: data.cleaningFee,
          taxRate: data.taxRate,
          taxLabel: data.taxLabel,
          serviceFeePercent: data.serviceFeePercent,
          serviceFeeFlat: data.serviceFeeFlat,
          serviceFeeLabel: data.serviceFeeLabel,
          depositHoldPercent: data.depositHoldPercent,
          depositHoldFlat: data.depositHoldFlat,
          depositHoldLabel: data.depositHoldLabel,
          petFee: data.petFee,
          extraGuestFee: data.extraGuestFee,
          extraGuestThreshold: data.extraGuestThreshold,
          addOns: (data.addOns || []).map(
            (a: { name: string; price: number; category: string; description: string | null; isActive: boolean }) => ({
              name: a.name,
              price: a.price,
              category: a.category,
              description: a.description || "",
              isActive: a.isActive,
            })
          ),
        });
        setServiceFeeType(data.serviceFeePercent > 0 ? "percent" : "flat");
        setDepositType(data.depositHoldPercent > 0 ? "percent" : "flat");
      } else {
        setForm({ ...defaultFormData });
        setServiceFeeType("percent");
        setDepositType("percent");
      }
    } catch {
      setForm({ ...defaultFormData });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadConfig(selectedListing);
  }, [selectedListing, loadConfig]);

  const update = <K extends keyof SalesFormData>(
    field: K,
    value: SalesFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        listingId: selectedListing,
        boardRate: form.boardRate,
        weekendRate: form.weekendRate,
        cleaningFee: form.cleaningFee,
        taxRate: form.taxRate,
        taxLabel: form.taxLabel,
        serviceFeePercent:
          serviceFeeType === "percent" ? form.serviceFeePercent : 0,
        serviceFeeFlat: serviceFeeType === "flat" ? form.serviceFeeFlat : 0,
        serviceFeeLabel: form.serviceFeeLabel,
        depositHoldPercent:
          depositType === "percent" ? form.depositHoldPercent : 0,
        depositHoldFlat: depositType === "flat" ? form.depositHoldFlat : 0,
        depositHoldLabel: form.depositHoldLabel,
        petFee: form.petFee,
        extraGuestFee: form.extraGuestFee,
        extraGuestThreshold: form.extraGuestThreshold,
        addOns: form.addOns,
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

  const addAddOn = (addOn: AddOn) => {
    update("addOns", [...form.addOns, addOn]);
    setShowAddOnForm(false);
  };

  const updateAddOn = (index: number, addOn: AddOn) => {
    const updated = [...form.addOns];
    updated[index] = addOn;
    update("addOns", updated);
  };

  const deleteAddOn = (index: number) => {
    update(
      "addOns",
      form.addOns.filter((_, i) => i !== index)
    );
  };

  const selectedTitle =
    LISTINGS.find((l) => l.id === selectedListing)?.title || "";

  return (
    <div>
      <h1 className="font-serif text-2xl text-charcoal font-light mb-6 flex items-center gap-2">
        <DollarSign size={20} />
        Sales Management
      </h1>

      {/* Listing selector */}
      <div className="flex gap-2 mb-6">
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

      {loading ? (
        <div className="text-xs text-warm-gray py-8 text-center">
          Loading configuration...
        </div>
      ) : (
        <div className="flex gap-6 items-start">
          {/* Main form */}
          <div className="flex-1 space-y-6 min-w-0">
            {/* Board Rate & Accommodations */}
            <div className="bg-white border border-light-gray p-6">
              <h2 className={sectionHeader}>Board Rate &amp; Accommodations</h2>
              <div className="grid grid-cols-2 gap-4">
                <NumberInput
                  label="Board Rate (Nightly)"
                  value={form.boardRate}
                  onChange={(v) => update("boardRate", v ?? 0)}
                  prefix="$"
                />
                <NumberInput
                  label="Weekend Rate (Fri/Sat)"
                  value={form.weekendRate}
                  onChange={(v) => update("weekendRate", v)}
                  prefix="$"
                  placeholder="Same as board rate"
                />
                <NumberInput
                  label="Cleaning Fee"
                  value={form.cleaningFee}
                  onChange={(v) => update("cleaningFee", v ?? 0)}
                  prefix="$"
                />
                <NumberInput
                  label="Pet Fee"
                  value={form.petFee}
                  onChange={(v) => update("petFee", v ?? 0)}
                  prefix="$"
                />
                <NumberInput
                  label="Extra Guest Fee (per guest/night)"
                  value={form.extraGuestFee}
                  onChange={(v) => update("extraGuestFee", v ?? 0)}
                  prefix="$"
                />
                <NumberInput
                  label="Extra Guest Threshold"
                  value={form.extraGuestThreshold}
                  onChange={(v) => update("extraGuestThreshold", v ?? 2)}
                />
              </div>
            </div>

            {/* Taxes */}
            <div className="bg-white border border-light-gray p-6">
              <h2 className={sectionHeader}>Taxes</h2>
              <div className="grid grid-cols-2 gap-4">
                <NumberInput
                  label="Tax Rate"
                  value={form.taxRate}
                  onChange={(v) => update("taxRate", v ?? 0)}
                  suffix="%"
                  step={0.1}
                />
                <div>
                  <label className={labelClass}>Tax Label</label>
                  <input
                    className={inputClass}
                    value={form.taxLabel}
                    onChange={(e) => update("taxLabel", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Service Fee */}
            <div className="bg-white border border-light-gray p-6">
              <h2 className={sectionHeader}>Service Fee</h2>
              <div className="space-y-4">
                <RadioGroup
                  label="Service Fee Type"
                  options={[
                    { value: "percent", label: "Percentage" },
                    { value: "flat", label: "Flat Amount" },
                  ]}
                  value={serviceFeeType}
                  onChange={(v) =>
                    setServiceFeeType(v as "percent" | "flat")
                  }
                />
                <div className="grid grid-cols-2 gap-4">
                  {serviceFeeType === "percent" ? (
                    <NumberInput
                      label="Service Fee Percentage"
                      value={form.serviceFeePercent}
                      onChange={(v) => update("serviceFeePercent", v ?? 0)}
                      suffix="%"
                      step={0.1}
                    />
                  ) : (
                    <NumberInput
                      label="Service Fee Amount"
                      value={form.serviceFeeFlat}
                      onChange={(v) => update("serviceFeeFlat", v ?? 0)}
                      prefix="$"
                    />
                  )}
                  <div>
                    <label className={labelClass}>Service Fee Label</label>
                    <input
                      className={inputClass}
                      value={form.serviceFeeLabel}
                      onChange={(e) =>
                        update("serviceFeeLabel", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Deposit Hold */}
            <div className="bg-white border border-light-gray p-6">
              <h2 className={sectionHeader}>Deposit Hold</h2>
              <div className="space-y-4">
                <RadioGroup
                  label="Deposit Type"
                  options={[
                    { value: "percent", label: "Percentage of Total" },
                    { value: "flat", label: "Flat Amount" },
                  ]}
                  value={depositType}
                  onChange={(v) =>
                    setDepositType(v as "percent" | "flat")
                  }
                />
                <div className="grid grid-cols-2 gap-4">
                  {depositType === "percent" ? (
                    <NumberInput
                      label="Deposit Percentage"
                      value={form.depositHoldPercent}
                      onChange={(v) => update("depositHoldPercent", v ?? 0)}
                      suffix="%"
                      step={0.1}
                    />
                  ) : (
                    <NumberInput
                      label="Deposit Amount"
                      value={form.depositHoldFlat}
                      onChange={(v) => update("depositHoldFlat", v ?? 0)}
                      prefix="$"
                    />
                  )}
                  <div>
                    <label className={labelClass}>Deposit Label</label>
                    <input
                      className={inputClass}
                      value={form.depositHoldLabel}
                      onChange={(e) =>
                        update("depositHoldLabel", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Add-On Items */}
            <div className="bg-white border border-light-gray p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className={sectionHeader + " mb-0"}>Add-On Items</h2>
                <button
                  className={btnSecondary}
                  onClick={() => setShowAddOnForm(!showAddOnForm)}
                >
                  <Plus size={10} className="inline mr-1" />
                  {showAddOnForm ? "Cancel" : "Add Item"}
                </button>
              </div>

              {form.addOns.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-light-gray">
                      <th className={`${labelClass} text-left pb-2`}>Name</th>
                      <th className={`${labelClass} text-left pb-2`}>Price</th>
                      <th className={`${labelClass} text-left pb-2`}>
                        Category
                      </th>
                      <th className={`${labelClass} text-left pb-2`}>Active</th>
                      <th className="pb-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {form.addOns.map((addOn, i) => (
                      <AddOnRow
                        key={i}
                        addOn={addOn}
                        onUpdate={(a) => updateAddOn(i, a)}
                        onDelete={() => deleteAddOn(i)}
                      />
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-warm-gray py-4 text-center">
                  No add-on items configured
                </p>
              )}

              {showAddOnForm && <AddOnForm onAdd={addAddOn} />}
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3">
              <button
                className={btnClass}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Configuration"}
              </button>
              {saved && (
                <span className="text-xs text-charcoal/60 flex items-center gap-1">
                  <Check size={12} /> Configuration saved for {selectedTitle}
                </span>
              )}
            </div>
          </div>

          {/* Live Preview Sidebar */}
          <div className="w-72 shrink-0 sticky top-6">
            <LivePreview form={form} />
          </div>
        </div>
      )}
    </div>
  );
}
