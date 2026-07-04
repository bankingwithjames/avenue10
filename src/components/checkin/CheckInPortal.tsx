"use client";

import { useState, useEffect } from "react";
import { TermsTab } from "./TermsTab";
import { InventoryTab } from "./InventoryTab";
import { InstructionsTab } from "./InstructionsTab";
import { ThingsToDoTab } from "./ThingsToDoTab";
import { RequestsTab } from "./RequestsTab";
import {
  FileCheck,
  ClipboardList,
  KeyRound,
  MapPin,
  MessageSquare,
  Lock,
  LogOut,
} from "lucide-react";

const TABS = [
  { key: "terms", label: "Terms & Conditions", icon: FileCheck, locked: false },
  { key: "inventory", label: "Inventory", icon: ClipboardList, locked: true },
  { key: "instructions", label: "Instructions & Codes", icon: KeyRound, locked: true },
  { key: "explore", label: "Things to Do", icon: MapPin, locked: true },
  { key: "requests", label: "Review & Request", icon: MessageSquare, locked: true },
];

interface Props {
  token: string;
  reservation: {
    id: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    listing: { id: string; title: string; slug: string };
    agreementSigned: boolean;
  };
}

export function CheckInPortal({ token, reservation }: Props) {
  const [activeTab, setActiveTab] = useState("terms");
  const [signed, setSigned] = useState(reservation.agreementSigned);

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
  });
  const checkOutDate = new Date(reservation.checkOut).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

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
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium">{reservation.listing.title}</h2>
            <p className="text-[10px] text-white/60 tracking-wider uppercase mt-0.5">
              {checkInDate} — {checkOutDate}
            </p>
          </div>
          {signed && (
            <span className="text-[10px] tracking-wider uppercase bg-white/10 px-3 py-1.5 rounded-sm">
              Agreement Signed
            </span>
          )}
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
                className={`flex items-center gap-2 px-4 py-4 text-[10px] sm:text-[11px] tracking-[0.1em] uppercase font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-charcoal text-charcoal"
                    : isLocked
                    ? "border-transparent text-warm-gray/40 cursor-not-allowed"
                    : "border-transparent text-warm-gray hover:text-charcoal hover:border-charcoal/30"
                }`}
              >
                {isLocked ? <Lock size={12} /> : <tab.icon size={14} />}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">
                  {tab.label.split(" ")[0]}
                </span>
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
        {activeTab === "inventory" && signed && <InventoryTab token={token} />}
        {activeTab === "instructions" && signed && <InstructionsTab token={token} />}
        {activeTab === "explore" && signed && <ThingsToDoTab token={token} />}
        {activeTab === "requests" && signed && <RequestsTab token={token} />}
      </div>
    </div>
  );
}
