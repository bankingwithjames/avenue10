"use client";

import { useState } from "react";
import { TermsTab } from "./TermsTab";
import { InstructionsTab } from "./InstructionsTab";
import { ThingsToDoTab } from "./ThingsToDoTab";
import { RequestsTab } from "./RequestsTab";
import { ReviewsTab } from "./ReviewsTab";
import { CheckoutTab } from "./CheckoutTab";
import {
  FileCheck,
  KeyRound,
  MapPin,
  MessageSquare,
  Star,
  Lock,
  LogOut,
  DoorOpen,
  Check,
  Sun,
  Moon,
  Users,
  CalendarDays,
  Hotel,
} from "lucide-react";

const TABS = [
  { key: "terms", label: "Terms & Conditions", shortLabel: "Terms", icon: FileCheck, locked: false },
  { key: "instructions", label: "Instructions & Codes", shortLabel: "Instructions", icon: KeyRound, locked: true },
  { key: "explore", label: "Things to Do", shortLabel: "Explore", icon: MapPin, locked: true },
  { key: "requests", label: "Requests", shortLabel: "Requests", icon: MessageSquare, locked: true },
  { key: "reviews", label: "Reviews", shortLabel: "Reviews", icon: Star, locked: true },
  { key: "checkout", label: "Checkout", shortLabel: "Checkout", icon: DoorOpen, locked: true },
];

const TIMELINE_STEPS = [
  { key: "terms", label: "Terms", icon: FileCheck },
  { key: "checkin", label: "Check-in", icon: Sun },
  { key: "during", label: "During Stay", icon: Hotel },
  { key: "checkout", label: "Checkout", icon: Moon },
  { key: "review", label: "Review", icon: Star },
];

interface Props {
  token: string;
  reservation: {
    id: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    guests?: number;
    channel?: string;
    listing: { id: string; title: string; slug: string };
    agreementSigned: boolean;
  };
}

function getStayPhase(reservation: Props["reservation"]): string {
  const now = new Date();
  const checkIn = new Date(reservation.checkIn);
  const checkOut = new Date(reservation.checkOut);

  if (!reservation.agreementSigned) return "terms";
  if (now < checkIn) return "checkin";
  if (now >= checkIn && now < checkOut) return "during";
  if (now >= checkOut) {
    return "review";
  }
  return "checkout";
}

export function CheckInPortal({ token, reservation }: Props) {
  const [activeTab, setActiveTab] = useState("terms");
  const [signed, setSigned] = useState(reservation.agreementSigned);

  const currentPhase = getStayPhase({ ...reservation, agreementSigned: signed });

  function handleSigned() {
    setSigned(true);
    setActiveTab("instructions");
  }

  function handleLogout() {
    window.location.reload();
  }

  const checkInDate = new Date(reservation.checkIn).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const checkOutDate = new Date(reservation.checkOut).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  const phaseIndex = TIMELINE_STEPS.findIndex((s) => s.key === currentPhase);

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-light-gray">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
          <span className="text-[12px] font-medium tracking-[0.3em] uppercase text-charcoal">
            AVENUE10
          </span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-warm-gray hidden sm:block">
              Welcome, {reservation.guestName.split(" ")[0]}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-warm-gray hover:text-charcoal transition-colors"
            >
              <LogOut size={14} /> Exit
            </button>
          </div>
        </div>
      </header>

      {/* Stay info bar */}
      <div className="bg-charcoal text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium">{reservation.listing.title}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                <span className="flex items-center gap-1.5 text-[10px] text-white/60 tracking-wider uppercase">
                  <CalendarDays size={10} /> {checkInDate} — {checkOutDate}
                </span>
                {reservation.guests && (
                  <span className="flex items-center gap-1.5 text-[10px] text-white/60 tracking-wider uppercase">
                    <Users size={10} /> {reservation.guests} {reservation.guests === 1 ? "Guest" : "Guests"}
                  </span>
                )}
                {reservation.channel && (
                  <span className="text-[10px] text-white/40 tracking-wider uppercase">
                    via {reservation.channel}
                  </span>
                )}
              </div>
            </div>
            {signed && (
              <span className="text-[10px] tracking-wider uppercase bg-white/10 px-3 py-1.5 rounded-sm flex items-center gap-1.5">
                <Check size={10} /> Agreement Signed
              </span>
            )}
          </div>

          {/* Status timeline */}
          <div className="mt-4 flex items-center gap-0 overflow-x-auto">
            {TIMELINE_STEPS.map((step, i) => {
              const isCompleted = i < phaseIndex;
              const isCurrent = i === phaseIndex;
              return (
                <div key={step.key} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? "bg-white/20"
                          : isCurrent
                          ? "bg-white text-charcoal"
                          : "bg-white/5 border border-white/15"
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={12} className="text-white/70" />
                      ) : (
                        <step.icon size={12} className={isCurrent ? "text-charcoal" : "text-white/30"} />
                      )}
                    </div>
                    <span
                      className={`text-[8px] tracking-[0.1em] uppercase mt-1 whitespace-nowrap ${
                        isCurrent ? "text-white font-medium" : "text-white/40"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div
                      className={`w-6 sm:w-10 h-px mx-1 ${
                        isCompleted ? "bg-white/30" : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="bg-white border-b border-light-gray overflow-x-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 flex">
          {TABS.map((tab) => {
            const isLocked = tab.locked && !signed;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => !isLocked && setActiveTab(tab.key)}
                disabled={isLocked}
                className={`flex items-center gap-2 px-3 sm:px-4 py-4 text-[10px] sm:text-[11px] tracking-[0.1em] uppercase font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-charcoal text-charcoal"
                    : isLocked
                    ? "border-transparent text-warm-gray/40 cursor-not-allowed"
                    : "border-transparent text-warm-gray hover:text-charcoal hover:border-charcoal/30"
                }`}
              >
                {isLocked ? <Lock size={12} /> : <tab.icon size={14} />}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
        {activeTab === "terms" && (
          <TermsTab token={token} signed={signed} onSigned={handleSigned} />
        )}
        {activeTab === "instructions" && signed && (
          <InstructionsTab token={token} checkIn={reservation.checkIn} signed={signed} />
        )}
        {activeTab === "explore" && signed && <ThingsToDoTab token={token} />}
        {activeTab === "requests" && signed && <RequestsTab token={token} />}
        {activeTab === "reviews" && signed && <ReviewsTab token={token} />}
        {activeTab === "checkout" && signed && (
          <CheckoutTab token={token} checkOut={reservation.checkOut} />
        )}
      </div>
    </div>
  );
}
