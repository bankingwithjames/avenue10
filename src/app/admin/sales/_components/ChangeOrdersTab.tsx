"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Check, X } from "lucide-react";
import {
  Card,
  StatusBadge,
  sectionHeader,
  labelClass,
  inputClass,
  btnClass,
  btnSecondary,
  EmptyState,
  fmt,
} from "./shared";

interface ChangeOrder {
  id: string;
  reservationId: string;
  reservation?: {
    guestName: string;
    confirmationCode: string;
    checkIn: string;
    checkOut: string;
  };
  changeType: string;
  description: string | null;
  originalValue: string | null;
  newValue: string | null;
  originalPrice: number;
  newPrice: number;
  priceDifference: number;
  adminApprovalRequired: boolean;
  guestApprovalRequired: boolean;
  approvalStatus: string;
  paymentStatus: string;
  notes: string | null;
  createdAt: string;
}

interface ChangeOrdersTabProps {
  listingId: string;
}

export default function ChangeOrdersTab({ listingId }: ChangeOrdersTabProps) {
  const [orders, setOrders] = useState<ChangeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [reservationCode, setReservationCode] = useState("");
  const [changeType, setChangeType] = useState("add_guest");
  const [description, setDescription] = useState("");
  const [originalValue, setOriginalValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const [priceDiff, setPriceDiff] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sales/change-orders?listingId=${listingId}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {
      // fail silently
    }
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCreate = async () => {
    if (!reservationCode.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/sales/change-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmationCode: reservationCode.trim(),
          changeType,
          description: description || null,
          originalValue: originalValue || null,
          newValue: newValue || null,
          priceDifference: priceDiff,
          notes: notes || null,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setReservationCode("");
        setChangeType("add_guest");
        setDescription("");
        setOriginalValue("");
        setNewValue("");
        setPriceDiff(0);
        setNotes("");
        loadOrders();
      }
    } catch {
      // fail silently
    }
    setCreating(false);
  };

  const updateStatus = async (id: string, approvalStatus: string) => {
    await fetch("/api/admin/sales/change-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, approvalStatus }),
    });
    loadOrders();
  };

  const changeTypes = [
    { value: "add_guest", label: "Add Extra Guest" },
    { value: "add_pet", label: "Add Pet" },
    { value: "early_checkin", label: "Early Check-in" },
    { value: "late_checkout", label: "Late Checkout" },
    { value: "extend_stay", label: "Extend Stay" },
    { value: "change_dates", label: "Change Dates" },
    { value: "extra_cleaning", label: "Extra Cleaning" },
    { value: "damage_charge", label: "Damage Charge" },
    { value: "extra_parking", label: "Extra Parking" },
    { value: "special_setup", label: "Special Setup" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className={sectionHeader + " mb-0"}>Reservation Change Orders</h2>
          <button
            className={btnSecondary}
            onClick={() => setShowCreate(!showCreate)}
          >
            <Plus size={10} className="inline mr-1" />
            {showCreate ? "Cancel" : "New Change Order"}
          </button>
        </div>

        {showCreate && (
          <div className="mb-6 p-4 bg-cream/50 border border-light-gray space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Reservation Code</label>
                <input
                  className={inputClass}
                  value={reservationCode}
                  onChange={(e) => setReservationCode(e.target.value)}
                  placeholder="AVX-XXXXXXXX"
                />
              </div>
              <div>
                <label className={labelClass}>Change Type</label>
                <select
                  className={inputClass}
                  value={changeType}
                  onChange={(e) => setChangeType(e.target.value)}
                >
                  {changeTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <input
                className={inputClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Guest wants to add 1 extra guest for remaining nights"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Original Value</label>
                <input
                  className={inputClass}
                  value={originalValue}
                  onChange={(e) => setOriginalValue(e.target.value)}
                  placeholder="e.g. 2 guests"
                />
              </div>
              <div>
                <label className={labelClass}>New Value</label>
                <input
                  className={inputClass}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="e.g. 3 guests"
                />
              </div>
              <div>
                <label className={labelClass}>Price Difference</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray text-xs">$</span>
                  <input
                    type="number"
                    className={`${inputClass} pl-7`}
                    value={priceDiff}
                    onChange={(e) => setPriceDiff(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Internal Notes</label>
              <textarea
                className={`${inputClass} min-h-[60px]`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Admin-only notes"
              />
            </div>
            <button
              className={btnClass}
              onClick={handleCreate}
              disabled={creating || !reservationCode.trim()}
            >
              {creating ? "Creating..." : "Create Change Order"}
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-xs text-warm-gray py-8 text-center">Loading change orders...</p>
        ) : orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border border-light-gray p-4 hover:bg-cream/20 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs font-medium text-charcoal">
                      {order.reservation?.guestName || "Guest"}
                    </span>
                    <span className="text-[9px] text-warm-gray ml-2">
                      {order.reservation?.confirmationCode || order.reservationId.slice(0, 8)}
                    </span>
                    <span className="text-[9px] text-warm-gray ml-2">
                      {changeTypes.find((t) => t.value === order.changeType)?.label || order.changeType}
                    </span>
                  </div>
                  <StatusBadge status={order.approvalStatus} />
                </div>

                {order.description && (
                  <p className="text-xs text-charcoal/80 mb-2">{order.description}</p>
                )}

                <div className="flex items-center gap-4 text-[9px] text-warm-gray mb-2">
                  {order.originalValue && (
                    <span>From: {order.originalValue}</span>
                  )}
                  {order.newValue && <span>To: {order.newValue}</span>}
                  <span
                    className={`font-medium ${
                      order.priceDifference > 0
                        ? "text-red-600"
                        : order.priceDifference < 0
                          ? "text-green-600"
                          : "text-warm-gray"
                    }`}
                  >
                    {order.priceDifference > 0 ? "+" : ""}
                    {fmt(order.priceDifference)}
                  </span>
                  <span>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {order.approvalStatus === "pending" && (
                  <div className="flex gap-2 mt-2">
                    <button
                      className="flex items-center gap-1 text-[9px] bg-charcoal text-white px-2 py-1"
                      onClick={() => updateStatus(order.id, "approved")}
                    >
                      <Check size={10} /> Approve
                    </button>
                    <button
                      className="flex items-center gap-1 text-[9px] border border-light-gray text-warm-gray px-2 py-1 hover:text-red-600 hover:border-red-200"
                      onClick={() => updateStatus(order.id, "declined")}
                    >
                      <X size={10} /> Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No change orders yet. Changes to confirmed reservations will appear here." />
        )}
      </Card>
    </div>
  );
}
