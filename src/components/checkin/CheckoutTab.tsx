"use client";

import { useState, useEffect } from "react";
import { DoorOpen, Check, Clock, Info, CheckCircle } from "lucide-react";

interface Instruction {
  id: string;
  category: string;
  title: string;
  value: string;
}

export function CheckoutTab({ token, checkOut }: { token: string; checkOut: string }) {
  const [items, setItems] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  const checkOutDate = new Date(checkOut);
  const formattedDate = checkOutDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = checkOutDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  useEffect(() => {
    fetch("/api/checkin/instructions?category=Check-Out", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <p className="text-sm text-warm-gray">Loading checkout information...</p>;

  if (confirmed) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-light-gray p-8 text-center">
          <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
          <h2 className="text-lg font-medium text-charcoal mb-2">Thank You!</h2>
          <p className="text-sm text-warm-gray max-w-md mx-auto">
            We hope you enjoyed your stay. Please complete the checkout steps above
            before departing. We would love to host you again!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Checkout date/time */}
      <div className="bg-white border border-light-gray p-6">
        <h2 className="text-lg font-medium text-charcoal mb-1">Checkout</h2>
        <p className="text-xs text-warm-gray">
          Please complete the following before your departure.
        </p>
        <div className="mt-4 bg-cream p-4 flex items-center gap-4">
          <Clock size={20} className="text-charcoal shrink-0" />
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium">
              Checkout Date & Time
            </p>
            <p className="text-sm font-medium text-charcoal">
              {formattedDate} at {formattedTime}
            </p>
          </div>
        </div>
      </div>

      {/* Checkout checklist */}
      {items.length > 0 ? (
        <div className="bg-white border border-light-gray">
          <div className="px-6 py-4 border-b border-light-gray bg-cream/50 flex items-center gap-3">
            <DoorOpen size={16} className="text-charcoal" />
            <h3 className="text-[11px] tracking-[0.15em] uppercase font-medium text-charcoal">
              Checkout Instructions
            </h3>
          </div>
          <div className="divide-y divide-light-gray">
            {items.map((item, index) => (
              <div key={item.id} className="px-6 py-4 flex gap-4">
                <div className="w-6 h-6 rounded-full bg-cream flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-medium text-charcoal">{index + 1}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-charcoal mb-0.5">{item.title}</p>
                  <p className="text-xs text-warm-gray whitespace-pre-line">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-light-gray p-8 text-center">
          <Info size={32} className="mx-auto text-warm-gray/40 mb-3" />
          <p className="text-sm text-warm-gray">
            Checkout instructions have not been added yet. Please contact your host for details.
          </p>
        </div>
      )}

      {/* Confirmation button */}
      <div className="bg-white border border-light-gray p-6 text-center">
        <button
          onClick={() => setConfirmed(true)}
          className="inline-flex items-center gap-2 bg-charcoal text-white px-8 py-3 text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-charcoal/90 transition-colors"
        >
          <Check size={14} />
          Ready to Checkout
        </button>
        <p className="text-[10px] text-warm-gray/60 mt-2">
          This confirms you have reviewed the checkout instructions.
        </p>
      </div>
    </div>
  );
}
