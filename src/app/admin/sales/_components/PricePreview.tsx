"use client";

import { Eye } from "lucide-react";
import { sectionHeader, fmt } from "./shared";
import type { PricingFormData } from "./PricingTab";
import type { AddOnData } from "./AddOnsTab";

interface PricePreviewProps {
  form: PricingFormData;
  addOns: AddOnData[];
  listingTitle: string;
}

export default function PricePreview({
  form,
  addOns,
  listingTitle,
}: PricePreviewProps) {
  const boardRate = form.boardRate || 0;
  const weekendRate = form.weekendRate ?? boardRate;

  // Simulate 3 nights: Thu(1), Fri(2), Sat(2) for preview
  const nightlyTotal = boardRate + weekendRate + weekendRate;
  const subtotal = nightlyTotal;
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

  const activeAddOns = addOns.filter((a) => a.isActive && a.guestVisible);
  const addOnsTotal = activeAddOns.reduce((s, a) => s + a.price, 0);

  const totalBeforeDeposit =
    subtotal + cleaningFee + petFee + taxAmount + serviceFee + addOnsTotal;

  let depositHold = 0;
  if (form.depositHoldPercent > 0) {
    depositHold = totalBeforeDeposit * (form.depositHoldPercent / 100);
  } else {
    depositHold = form.depositHoldFlat || 0;
  }

  const total = totalBeforeDeposit + depositHold;

  return (
    <div className="bg-white border border-light-gray p-5">
      <div className="flex items-center gap-2 mb-1">
        <Eye size={12} className="text-warm-gray" />
        <h3 className={sectionHeader + " mb-0"}>Price Preview</h3>
      </div>
      <p className="text-[9px] text-warm-gray mb-4">
        {listingTitle} · 3 nights (Thu–Sat) · 2 guests
      </p>

      <div className="space-y-2.5">
        <div className="flex justify-between text-xs text-charcoal">
          <span>
            {fmt(boardRate)} × 1 + {fmt(weekendRate)} × 2
          </span>
          <span>{fmt(subtotal)}</span>
        </div>

        {cleaningFee > 0 && (
          <div className="flex justify-between text-xs text-charcoal">
            <span>Cleaning fee</span>
            <span>{fmt(cleaningFee)}</span>
          </div>
        )}

        {petFee > 0 && (
          <div className="flex justify-between text-xs text-charcoal">
            <span>Pet fee</span>
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
            <span>
              Add-ons ({activeAddOns.length})
            </span>
            <span>{fmt(addOnsTotal)}</span>
          </div>
        )}

        {depositHold > 0 && (
          <div className="flex justify-between text-xs text-charcoal">
            <span>
              {form.depositHoldLabel || "Deposit Hold"}
              <span className="text-[9px] text-warm-gray ml-1">
                (refundable)
              </span>
            </span>
            <span>{fmt(depositHold)}</span>
          </div>
        )}

        <div className="border-t border-light-gray pt-2.5 mt-2.5 flex justify-between text-xs font-medium text-charcoal">
          <span>Final Charge</span>
          <span>{fmt(total)}</span>
        </div>

        {depositHold > 0 && (
          <div className="flex justify-between text-[9px] text-warm-gray">
            <span>Amount due today</span>
            <span>{fmt(totalBeforeDeposit)}</span>
          </div>
        )}
      </div>

      {/* Stay rules summary */}
      <div className="mt-4 pt-3 border-t border-light-gray space-y-1">
        <p className="text-[9px] text-warm-gray">
          Min stay: {form.minimumStay} night{form.minimumStay !== 1 ? "s" : ""}
          {" · "}Max stay: {form.maximumStay} nights
        </p>
        <p className="text-[9px] text-warm-gray">
          Guests included: {form.guestsIncluded}
          {" · "}Max guests: {form.maxGuests}
        </p>
        {form.sameDayBookingAllowed && (
          <p className="text-[9px] text-warm-gray">Same-day booking allowed</p>
        )}
      </div>
    </div>
  );
}
