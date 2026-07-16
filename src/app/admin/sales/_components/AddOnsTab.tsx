"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  Card,
  Toggle,
  sectionHeader,
  labelClass,
  inputClass,
  btnSecondary,
  EmptyState,
} from "./shared";

export interface AddOnData {
  name: string;
  description: string;
  price: number;
  category: string;
  pricingType: string;
  guestVisible: boolean;
  requiresAdminApproval: boolean;
  requiresInventory: boolean;
  taxable: boolean;
  isActive: boolean;
}

export const defaultAddOn: AddOnData = {
  name: "",
  description: "",
  price: 0,
  category: "service",
  pricingType: "flat",
  guestVisible: true,
  requiresAdminApproval: false,
  requiresInventory: false,
  taxable: true,
  isActive: true,
};

interface AddOnsTabProps {
  addOns: AddOnData[];
  onUpdate: (addOns: AddOnData[]) => void;
}

function AddOnRow({
  addOn,
  onUpdate,
  onDelete,
  onExpand,
  expanded,
}: {
  addOn: AddOnData;
  onUpdate: (a: AddOnData) => void;
  onDelete: () => void;
  onExpand: () => void;
  expanded: boolean;
}) {
  return (
    <div className="border-b border-light-gray last:border-0">
      <div
        className="flex items-center gap-3 py-3 px-2 cursor-pointer hover:bg-cream/50 transition"
        onClick={onExpand}
      >
        <GripVertical size={12} className="text-warm-gray/40 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs text-charcoal font-medium">{addOn.name || "Untitled"}</span>
          {addOn.description && (
            <span className="text-[9px] text-warm-gray ml-2">{addOn.description}</span>
          )}
        </div>
        <span className="text-xs text-charcoal shrink-0">
          ${addOn.price.toFixed(2)}
          {addOn.pricingType !== "flat" && (
            <span className="text-[8px] text-warm-gray ml-0.5">/{addOn.pricingType}</span>
          )}
        </span>
        <span className="text-[9px] tracking-[0.1em] uppercase text-warm-gray shrink-0 w-16">
          {addOn.category}
        </span>
        <div
          className={`w-8 h-4 rounded-full transition-colors cursor-pointer shrink-0 ${
            addOn.isActive ? "bg-charcoal" : "bg-light-gray"
          } relative`}
          onClick={(e) => {
            e.stopPropagation();
            onUpdate({ ...addOn, isActive: !addOn.isActive });
          }}
        >
          <div
            className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${
              addOn.isActive ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-warm-gray hover:text-red-500 transition shrink-0"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {expanded && (
        <div className="px-2 pb-4 pt-1 bg-cream/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className={labelClass}>Name</label>
              <input
                className={inputClass}
                value={addOn.name}
                onChange={(e) => onUpdate({ ...addOn, name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray text-xs">$</span>
                <input
                  type="number"
                  className={`${inputClass} pl-7`}
                  value={addOn.price || ""}
                  onChange={(e) => onUpdate({ ...addOn, price: e.target.value === "" ? 0 : Number(e.target.value) })}
                  min={0}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Pricing Type</label>
              <select
                className={inputClass}
                value={addOn.pricingType}
                onChange={(e) => onUpdate({ ...addOn, pricingType: e.target.value })}
              >
                <option value="flat">Flat Fee</option>
                <option value="per_night">Per Night</option>
                <option value="per_guest">Per Guest</option>
                <option value="percentage">Percentage</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className={labelClass}>Category</label>
              <select
                className={inputClass}
                value={addOn.category}
                onChange={(e) => onUpdate({ ...addOn, category: e.target.value })}
              >
                <option value="service">Service</option>
                <option value="amenity">Amenity</option>
                <option value="equipment">Equipment</option>
                <option value="experience">Experience</option>
                <option value="cleaning">Cleaning</option>
                <option value="transport">Transport</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Description</label>
              <input
                className={inputClass}
                value={addOn.description}
                onChange={(e) => onUpdate({ ...addOn, description: e.target.value })}
                placeholder="Shown to guest during checkout"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <Toggle
              label="Guest Visible"
              checked={addOn.guestVisible}
              onChange={(v) => onUpdate({ ...addOn, guestVisible: v })}
              description="Show this add-on during checkout"
            />
            <Toggle
              label="Requires Admin Approval"
              checked={addOn.requiresAdminApproval}
              onChange={(v) => onUpdate({ ...addOn, requiresAdminApproval: v })}
              description="Admin must approve before confirming"
            />
            <Toggle
              label="Requires Inventory"
              checked={addOn.requiresInventory}
              onChange={(v) => onUpdate({ ...addOn, requiresInventory: v })}
              description="Check availability before allowing"
            />
            <Toggle
              label="Taxable"
              checked={addOn.taxable}
              onChange={(v) => onUpdate({ ...addOn, taxable: v })}
              description="Include in tax calculation"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddOnsTab({ addOns, onUpdate }: AddOnsTabProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const presets = [
    { name: "Early Check-in", price: 75, category: "service", description: "Check in before 3:00 PM" },
    { name: "Late Checkout", price: 75, category: "service", description: "Check out after 11:00 AM" },
    { name: "Pet Stay", price: 100, category: "service", description: "Pet-friendly accommodation" },
    { name: "Extra Guest", price: 50, category: "service", description: "Additional guest beyond included count" },
    { name: "Extra Parking", price: 25, category: "amenity", description: "Additional parking space" },
    { name: "Celebration Package", price: 150, category: "experience", description: "Balloons, banner, and sparkling cider" },
    { name: "Grocery Pre-Stock", price: 75, category: "service", description: "Pre-stock fridge with essentials" },
    { name: "Extra Cleaning", price: 125, category: "cleaning", description: "Additional cleaning service" },
    { name: "Mid-Stay Cleaning", price: 125, category: "cleaning", description: "Cleaning during extended stays" },
    { name: "Linen Refresh", price: 50, category: "amenity", description: "Fresh linens and towels mid-stay" },
    { name: "Fire Pit Setup", price: 35, category: "experience", description: "Fire pit with firewood and s'mores kit" },
    { name: "Private Chef Inquiry", price: 0, category: "experience", description: "Custom pricing — admin approval required" },
    { name: "Airport Pickup", price: 75, category: "transport", description: "Airport transfer service" },
    { name: "Event/Party Approval", price: 250, category: "service", description: "Approval fee for events or gatherings" },
  ];

  const addPreset = (preset: typeof presets[0]) => {
    const exists = addOns.some(
      (a) => a.name.toLowerCase() === preset.name.toLowerCase()
    );
    if (exists) return;
    onUpdate([
      ...addOns,
      {
        ...defaultAddOn,
        name: preset.name,
        price: preset.price,
        category: preset.category,
        description: preset.description,
        requiresAdminApproval: preset.price === 0,
      },
    ]);
  };

  const addCustom = () => {
    onUpdate([...addOns, { ...defaultAddOn }]);
    setExpandedIdx(addOns.length);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className={sectionHeader + " mb-0"}>Add-On Items & Upsells</h2>
          <div className="flex gap-2">
            <button
              className={btnSecondary}
              onClick={() => setShowQuickAdd(!showQuickAdd)}
            >
              {showQuickAdd ? "Hide Presets" : "Quick Add"}
            </button>
            <button className={btnSecondary} onClick={addCustom}>
              <Plus size={10} className="inline mr-1" />
              Custom
            </button>
          </div>
        </div>

        {showQuickAdd && (
          <div className="mb-4 p-3 bg-cream/50 border border-light-gray">
            <p className={labelClass + " mb-2"}>Quick Add Presets</p>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => {
                const exists = addOns.some(
                  (a) => a.name.toLowerCase() === p.name.toLowerCase()
                );
                return (
                  <button
                    key={p.name}
                    className={`text-[9px] px-2 py-1 border transition ${
                      exists
                        ? "bg-charcoal/5 text-warm-gray border-light-gray cursor-not-allowed"
                        : "bg-white text-charcoal border-light-gray hover:border-charcoal"
                    }`}
                    onClick={() => addPreset(p)}
                    disabled={exists}
                  >
                    {p.name}
                    {p.price > 0 && ` · $${p.price}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {addOns.length > 0 ? (
          <div className="border border-light-gray">
            <div className="flex items-center gap-3 py-2 px-2 bg-cream/50 border-b border-light-gray">
              <span className="w-4" />
              <span className={`${labelClass} mb-0 flex-1`}>Name</span>
              <span className={`${labelClass} mb-0 w-20 text-right`}>Price</span>
              <span className={`${labelClass} mb-0 w-16`}>Category</span>
              <span className={`${labelClass} mb-0 w-8`}>On</span>
              <span className="w-5" />
            </div>
            {addOns.map((addOn, i) => (
              <AddOnRow
                key={i}
                addOn={addOn}
                onUpdate={(a) => {
                  const updated = [...addOns];
                  updated[i] = a;
                  onUpdate(updated);
                }}
                onDelete={() => onUpdate(addOns.filter((_, idx) => idx !== i))}
                onExpand={() => setExpandedIdx(expandedIdx === i ? null : i)}
                expanded={expandedIdx === i}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No add-on items configured. Use Quick Add or create a custom add-on." />
        )}
      </Card>
    </div>
  );
}
