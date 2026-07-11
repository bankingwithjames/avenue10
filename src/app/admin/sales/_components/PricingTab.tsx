"use client";

import { NumberInput, TextInput, RadioGroup, Toggle, Card, sectionHeader } from "./shared";

export interface PricingFormData {
  boardRate: number;
  weekendRate: number | null;
  cleaningFee: number;
  petFee: number;
  extraGuestFee: number;
  extraGuestThreshold: number;
  guestsIncluded: number;
  maxGuests: number;
  minimumStay: number;
  maximumStay: number;
  sameDayBookingAllowed: boolean;
  advanceNoticeHours: number;
  taxRate: number;
  taxLabel: string;
  serviceFeePercent: number;
  serviceFeeFlat: number;
  serviceFeeLabel: string;
  depositHoldPercent: number;
  depositHoldFlat: number;
  depositHoldLabel: string;
}

export const defaultPricingData: PricingFormData = {
  boardRate: 0,
  weekendRate: null,
  cleaningFee: 0,
  petFee: 0,
  extraGuestFee: 0,
  extraGuestThreshold: 2,
  guestsIncluded: 2,
  maxGuests: 10,
  minimumStay: 1,
  maximumStay: 30,
  sameDayBookingAllowed: false,
  advanceNoticeHours: 24,
  taxRate: 0,
  taxLabel: "Taxes & Fees",
  serviceFeePercent: 0,
  serviceFeeFlat: 0,
  serviceFeeLabel: "Service Fee",
  depositHoldPercent: 0,
  depositHoldFlat: 0,
  depositHoldLabel: "Security Deposit Hold",
};

interface PricingTabProps {
  form: PricingFormData;
  onUpdate: <K extends keyof PricingFormData>(field: K, value: PricingFormData[K]) => void;
  serviceFeeType: "percent" | "flat";
  setServiceFeeType: (v: "percent" | "flat") => void;
  depositType: "percent" | "flat";
  setDepositType: (v: "percent" | "flat") => void;
}

export default function PricingTab({
  form,
  onUpdate,
  serviceFeeType,
  setServiceFeeType,
  depositType,
  setDepositType,
}: PricingTabProps) {
  return (
    <div className="space-y-6">
      {/* Board Rate & Accommodations */}
      <Card>
        <h2 className={sectionHeader}>Board Rate & Accommodations</h2>
        <div className="grid grid-cols-2 gap-4">
          <NumberInput
            label="Base Nightly Rate"
            value={form.boardRate}
            onChange={(v) => onUpdate("boardRate", v ?? 0)}
            prefix="$"
          />
          <NumberInput
            label="Weekend Rate (Fri/Sat)"
            value={form.weekendRate}
            onChange={(v) => onUpdate("weekendRate", v)}
            prefix="$"
            placeholder="Same as base rate"
          />
          <NumberInput
            label="Cleaning Fee"
            value={form.cleaningFee}
            onChange={(v) => onUpdate("cleaningFee", v ?? 0)}
            prefix="$"
          />
          <NumberInput
            label="Pet Fee"
            value={form.petFee}
            onChange={(v) => onUpdate("petFee", v ?? 0)}
            prefix="$"
          />
          <NumberInput
            label="Extra Guest Fee (per guest/night)"
            value={form.extraGuestFee}
            onChange={(v) => onUpdate("extraGuestFee", v ?? 0)}
            prefix="$"
          />
          <NumberInput
            label="Guests Included in Base Rate"
            value={form.guestsIncluded}
            onChange={(v) => onUpdate("guestsIncluded", v ?? 2)}
          />
          <NumberInput
            label="Max Guests Allowed"
            value={form.maxGuests}
            onChange={(v) => onUpdate("maxGuests", v ?? 10)}
          />
          <NumberInput
            label="Security Deposit Hold"
            value={form.depositHoldPercent > 0 ? form.depositHoldPercent : form.depositHoldFlat}
            onChange={(v) => {
              if (depositType === "percent") {
                onUpdate("depositHoldPercent", v ?? 0);
              } else {
                onUpdate("depositHoldFlat", v ?? 0);
              }
            }}
            prefix={depositType === "flat" ? "$" : undefined}
            suffix={depositType === "percent" ? "%" : undefined}
          />
        </div>
      </Card>

      {/* Stay Rules */}
      <Card>
        <h2 className={sectionHeader}>Stay Rules</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <NumberInput
            label="Minimum Stay (nights)"
            value={form.minimumStay}
            onChange={(v) => onUpdate("minimumStay", v ?? 1)}
          />
          <NumberInput
            label="Maximum Stay (nights)"
            value={form.maximumStay}
            onChange={(v) => onUpdate("maximumStay", v ?? 30)}
          />
          <NumberInput
            label="Advance Notice (hours)"
            value={form.advanceNoticeHours}
            onChange={(v) => onUpdate("advanceNoticeHours", v ?? 24)}
          />
        </div>
        <Toggle
          label="Allow Same-Day Booking"
          checked={form.sameDayBookingAllowed}
          onChange={(v) => onUpdate("sameDayBookingAllowed", v)}
          description="Guests can book for today if advance notice window has passed"
        />
      </Card>

      {/* Taxes */}
      <Card>
        <h2 className={sectionHeader}>Taxes</h2>
        <div className="grid grid-cols-2 gap-4">
          <NumberInput
            label="Tax Rate"
            value={form.taxRate}
            onChange={(v) => onUpdate("taxRate", v ?? 0)}
            suffix="%"
            step={0.1}
          />
          <TextInput
            label="Tax Label"
            value={form.taxLabel}
            onChange={(v) => onUpdate("taxLabel", v)}
          />
        </div>
      </Card>

      {/* Service Fee */}
      <Card>
        <h2 className={sectionHeader}>Service Fee</h2>
        <div className="space-y-4">
          <RadioGroup
            label="Service Fee Type"
            options={[
              { value: "percent", label: "Percentage" },
              { value: "flat", label: "Flat Amount" },
            ]}
            value={serviceFeeType}
            onChange={(v) => setServiceFeeType(v as "percent" | "flat")}
          />
          <div className="grid grid-cols-2 gap-4">
            {serviceFeeType === "percent" ? (
              <NumberInput
                label="Service Fee Percentage"
                value={form.serviceFeePercent}
                onChange={(v) => onUpdate("serviceFeePercent", v ?? 0)}
                suffix="%"
                step={0.1}
              />
            ) : (
              <NumberInput
                label="Service Fee Amount"
                value={form.serviceFeeFlat}
                onChange={(v) => onUpdate("serviceFeeFlat", v ?? 0)}
                prefix="$"
              />
            )}
            <TextInput
              label="Service Fee Label"
              value={form.serviceFeeLabel}
              onChange={(v) => onUpdate("serviceFeeLabel", v)}
            />
          </div>
        </div>
      </Card>

      {/* Deposit Hold */}
      <Card>
        <h2 className={sectionHeader}>Deposit Hold</h2>
        <div className="space-y-4">
          <RadioGroup
            label="Deposit Type"
            options={[
              { value: "percent", label: "Percentage of Total" },
              { value: "flat", label: "Flat Amount" },
            ]}
            value={depositType}
            onChange={(v) => setDepositType(v as "percent" | "flat")}
          />
          <div className="grid grid-cols-2 gap-4">
            {depositType === "percent" ? (
              <NumberInput
                label="Deposit Percentage"
                value={form.depositHoldPercent}
                onChange={(v) => onUpdate("depositHoldPercent", v ?? 0)}
                suffix="%"
                step={0.1}
              />
            ) : (
              <NumberInput
                label="Deposit Amount"
                value={form.depositHoldFlat}
                onChange={(v) => onUpdate("depositHoldFlat", v ?? 0)}
                prefix="$"
              />
            )}
            <TextInput
              label="Deposit Label"
              value={form.depositHoldLabel}
              onChange={(v) => onUpdate("depositHoldLabel", v)}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
