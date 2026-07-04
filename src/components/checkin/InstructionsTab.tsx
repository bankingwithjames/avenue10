"use client";

import { useState, useEffect } from "react";
import { KeyRound, Wifi, Tv, DoorOpen, Clock, Info } from "lucide-react";

interface Instruction {
  id: string;
  category: string;
  title: string;
  value: string;
}

const CATEGORY_ICONS: Record<string, typeof KeyRound> = {
  "Door Codes": DoorOpen,
  "Wi-Fi": Wifi,
  "Streaming": Tv,
  "Check-In": Clock,
  "Check-Out": Clock,
};

export function InstructionsTab({ token }: { token: string }) {
  const [items, setItems] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/checkin/instructions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <p className="text-sm text-warm-gray">Loading instructions...</p>;

  const categories = items.reduce<Record<string, Instruction[]>>((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  if (Object.keys(categories).length === 0) {
    return (
      <div className="bg-white border border-light-gray p-8 text-center">
        <KeyRound size={32} className="mx-auto text-warm-gray/40 mb-3" />
        <p className="text-sm text-warm-gray">Instructions have not been set up yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-light-gray p-6">
        <h2 className="text-lg font-medium text-charcoal mb-1">Instructions & Access Codes</h2>
        <p className="text-xs text-warm-gray">
          Everything you need to access and enjoy your stay.
        </p>
      </div>

      {Object.entries(categories).map(([category, catItems]) => {
        const Icon = CATEGORY_ICONS[category] || Info;
        return (
          <div key={category} className="bg-white border border-light-gray">
            <div className="px-6 py-4 border-b border-light-gray bg-cream/50 flex items-center gap-3">
              <Icon size={16} className="text-charcoal" />
              <h3 className="text-[11px] tracking-[0.15em] uppercase font-medium text-charcoal">
                {category}
              </h3>
            </div>
            <div className="divide-y divide-light-gray">
              {catItems.map((item) => (
                <div key={item.id} className="px-6 py-4">
                  <p className="text-xs text-warm-gray mb-1">{item.title}</p>
                  <p className="text-sm text-charcoal font-medium whitespace-pre-line">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
