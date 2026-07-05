"use client";

import { useState, useEffect } from "react";
import {
  KeyRound, Wifi, Tv, DoorOpen, Clock, Info, LogOut, Car, Smartphone,
  Thermometer, Trash2, Shirt, Phone, BookOpen, Moon, AlertTriangle,
  Copy, Check, ShieldAlert,
} from "lucide-react";

interface Instruction {
  id: string;
  category: string;
  title: string;
  value: string;
  sensitive?: boolean;
  visibleBeforeHours?: number;
  locked?: boolean;
}

const CATEGORY_ICONS: Record<string, typeof KeyRound> = {
  "Check-In": DoorOpen,
  "Check-Out": LogOut,
  "Door Codes": KeyRound,
  "Wi-Fi": Wifi,
  "WiFi": Wifi,
  "Parking": Car,
  "Smart Lock": Smartphone,
  "Thermostat": Thermometer,
  "TV/Remote": Tv,
  "Streaming": Tv,
  "Trash": Trash2,
  "Laundry": Shirt,
  "Emergency": Phone,
  "House Manual": BookOpen,
  "Quiet Hours": Moon,
  "Damage Reporting": AlertTriangle,
};

const COPIABLE_CATEGORIES = ["Door Codes", "Wi-Fi", "WiFi", "Smart Lock"];

interface Props {
  token: string;
  checkIn: string;
  signed: boolean;
}

export function InstructionsTab({ token, checkIn, signed }: Props) {
  const [items, setItems] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  function isCodeVisible(item: Instruction): boolean {
    if (!signed) return false;
    if (!item.visibleBeforeHours || item.visibleBeforeHours <= 0) return true;
    const checkInDate = new Date(checkIn);
    const visibleFrom = new Date(checkInDate.getTime() - item.visibleBeforeHours * 60 * 60 * 1000);
    return new Date() >= visibleFrom;
  }

  function getLockedMessage(item: Instruction): string | null {
    if (!signed) return "Sign terms to view";
    if (item.locked) {
      if (item.visibleBeforeHours && item.visibleBeforeHours > 0) {
        return `Available ${item.visibleBeforeHours} hours before check-in`;
      }
      return "Not yet available";
    }
    if (item.visibleBeforeHours && item.visibleBeforeHours > 0 && !isCodeVisible(item)) {
      return `Available ${item.visibleBeforeHours} hours before check-in`;
    }
    return null;
  }

  function getDisplayValue(item: Instruction): { value: string; isLocked: boolean } {
    const lockedMsg = getLockedMessage(item);
    if (lockedMsg) return { value: lockedMsg, isLocked: true };
    return { value: item.value, isLocked: false };
  }

  async function handleCopy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard not available
    }
  }

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
        const isCopyable = COPIABLE_CATEGORIES.includes(category);
        return (
          <div key={category} className="bg-white border border-light-gray">
            <div className="px-6 py-4 border-b border-light-gray bg-cream/50 flex items-center gap-3">
              <Icon size={16} className="text-charcoal" />
              <h3 className="text-[11px] tracking-[0.15em] uppercase font-medium text-charcoal">
                {category}
              </h3>
            </div>
            <div className="divide-y divide-light-gray">
              {catItems.map((item) => {
                const { value, isLocked } = getDisplayValue(item);
                return (
                  <div key={item.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs text-warm-gray">{item.title}</p>
                          {item.sensitive && !isLocked && (
                            <ShieldAlert size={12} className="text-amber-500 shrink-0" />
                          )}
                        </div>
                        {isLocked ? (
                          <p className="text-sm text-warm-gray/60 italic flex items-center gap-1.5">
                            <Clock size={12} />
                            {value}
                          </p>
                        ) : (
                          <p className="text-sm text-charcoal font-medium whitespace-pre-line">
                            {value}
                          </p>
                        )}
                      </div>
                      {isCopyable && !isLocked && (
                        <button
                          onClick={() => handleCopy(value, item.id)}
                          className="shrink-0 flex items-center gap-1 text-[9px] tracking-[0.15em] uppercase text-warm-gray hover:text-charcoal transition-colors mt-4 border border-light-gray px-2.5 py-1.5"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check size={10} /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={10} /> Copy
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
