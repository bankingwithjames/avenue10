"use client";

import { Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { DataTable } from "@/components/admin/DataTable";
import {
  ChevronLeft,
  ChevronRight,
  CalendarOff,
  Plus,
  Trash2,
  X,
  Users,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  BarChart3,
  CalendarDays,
  Info,
} from "lucide-react";

interface Listing {
  id: string;
  title: string;
  pricePerNight: number;
}

interface ClosedDate {
  id: string;
  date: string;
  reason: string | null;
}

interface Reservation {
  id: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: string;
  accessCode: string | null;
  listing: { title: string };
}

interface DailyRate {
  date: string;
  finalRate: number;
  rateSource: string;
}

type DateStatus =
  | { type: "booked"; reservation: Reservation }
  | { type: "blocked"; reason: string | null; id: string }
  | { type: "available" }
  | { type: "past" };

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function AdminAvailabilityPageInner() {
  const searchParams = useSearchParams();
  const initialListing = searchParams.get("listing") || "";
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState(initialListing);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [adding, setAdding] = useState(false);
  const [dailyRates, setDailyRates] = useState<DailyRate[]>([]);

  useEffect(() => {
    fetch("/api/admin/listings")
      .then((r) => r.json())
      .then((data) => {
        setListings(data);
        if (data.length > 0 && !initialListing) setSelectedListing(data[0].id);
        if (initialListing && data.some((l: Listing) => l.id === initialListing)) setSelectedListing(initialListing);
      });
  }, []);

  const loadClosedDates = useCallback(async () => {
    if (!selectedListing) return;
    const res = await fetch(
      `/api/admin/availability?listingId=${selectedListing}`
    );
    setClosedDates(await res.json());
  }, [selectedListing]);

  const loadDailyRates = useCallback(async () => {
    if (!selectedListing) return;
    const start = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
    const endDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const end = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
    try {
      const res = await fetch(`/api/admin/sales/daily-rates?listingId=${selectedListing}&start=${start}&end=${end}`);
      if (res.ok) {
        const data = await res.json();
        setDailyRates(data.rates || []);
      }
    } catch {
      setDailyRates([]);
    }
  }, [selectedListing, currentYear, currentMonth]);

  const loadReservations = useCallback(async () => {
    const res = await fetch("/api/admin/reservations");
    const all: Reservation[] = await res.json();
    setReservations(all);
  }, []);

  useEffect(() => {
    if (selectedListing) {
      loadClosedDates();
      loadReservations();
      loadDailyRates();
    }
  }, [selectedListing, loadClosedDates, loadReservations, loadDailyRates]);

  async function blockDates() {
    if (!blockStart) return;
    setAdding(true);
    const dates: string[] = [];
    const start = new Date(blockStart + "T12:00:00");
    const end = blockEnd ? new Date(blockEnd + "T12:00:00") : new Date(start);
    for (
      let d = new Date(start);
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      dates.push(d.toISOString().split("T")[0]);
    }
    await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: selectedListing,
        dates,
        reason: blockReason || null,
      }),
    });
    setBlockStart("");
    setBlockEnd("");
    setBlockReason("");
    setShowBlockModal(false);
    setAdding(false);
    loadClosedDates();
  }

  async function unblockDate(id: string) {
    await fetch("/api/admin/availability", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    loadClosedDates();
  }

  async function updateReservationStatus(id: string, status: string) {
    await fetch(`/api/admin/reservations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadReservations();
  }

  async function deleteReservation(id: string) {
    if (!confirm("Delete this reservation permanently?")) return;
    await fetch(`/api/admin/reservations/${id}`, { method: "DELETE" });
    loadReservations();
    setSelectedDate(null);
  }

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentMonth, currentYear]);

  const closedMap = useMemo(() => {
    const map = new Map<string, ClosedDate>();
    closedDates.forEach((cd) => {
      const key = new Date(cd.date).toISOString().split("T")[0];
      map.set(key, cd);
    });
    return map;
  }, [closedDates]);

  // Only include active reservations for the selected listing
  const activeReservations = useMemo(() => {
    const selectedListingObj = listings.find((l) => l.id === selectedListing);
    if (!selectedListingObj) return reservations;
    return reservations.filter(
      (r) => r.listing.title === selectedListingObj.title
    );
  }, [reservations, selectedListing, listings]);

  function formatDateStr(day: number) {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function getDateStatus(day: number): DateStatus {
    const dateStr = formatDateStr(day);

    const res = activeReservations.find((r) => {
      const ciStr = new Date(r.checkIn).toISOString().split("T")[0];
      const coStr = new Date(r.checkOut).toISOString().split("T")[0];
      return dateStr >= ciStr && dateStr < coStr;
    });

    if (res) {
      return { type: "booked", reservation: res };
    }

    const cd = closedMap.get(dateStr);
    if (cd) {
      return { type: "blocked", reason: cd.reason, id: cd.id };
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (dateStr < todayStr) {
      return { type: "past" };
    }

    return { type: "available" };
  }

  function handleDateClick(day: number) {
    const dateStr = formatDateStr(day);
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  }

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  }

  const selectedListingObj = listings.find((l) => l.id === selectedListing);
  const nightlyRate = selectedListingObj?.pricePerNight ?? 0;

  const rateMap = useMemo(() => {
    const map = new Map<string, DailyRate>();
    dailyRates.forEach((r) => {
      const key = r.date.split("T")[0];
      map.set(key, r);
    });
    return map;
  }, [dailyRates]);

  function getRateForDate(day: number): number {
    const dateStr = formatDateStr(day);
    const dr = rateMap.get(dateStr);
    return dr ? dr.finalRate : nightlyRate;
  }

  // Monthly stats
  const totalDaysInMonth = new Date(
    currentYear,
    currentMonth + 1,
    0
  ).getDate();

  const monthStats = useMemo(() => {
    let booked = 0;
    let blocked = 0;
    let revenue = 0;

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const status = getDateStatus(d);
      if (status.type === "booked") {
        booked++;
      } else if (status.type === "blocked") {
        blocked++;
      }
    }

    // Revenue from confirmed reservations overlapping this month
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    activeReservations
      .filter((r) => r.status === "confirmed" || r.status === "completed")
      .forEach((r) => {
        const ci = new Date(r.checkIn);
        const co = new Date(r.checkOut);
        ci.setHours(0, 0, 0, 0);
        co.setHours(0, 0, 0, 0);
        monthStart.setHours(0, 0, 0, 0);
        monthEnd.setHours(0, 0, 0, 0);
        // Count nights that fall within this month
        const overlapStart = ci > monthStart ? ci : monthStart;
        const overlapEnd = co < monthEnd ? co : new Date(monthEnd.getTime() + 86400000);
        if (overlapStart < overlapEnd) {
          const nights = Math.ceil(
            (overlapEnd.getTime() - overlapStart.getTime()) / 86400000
          );
          // Estimate per-night revenue from totalPrice / total nights
          const totalNights = Math.ceil(
            (co.getTime() - ci.getTime()) / 86400000
          );
          if (totalNights > 0) {
            revenue += (r.totalPrice / totalNights) * nights;
          }
        }
      });

    const available = totalDaysInMonth - booked - blocked;
    const occupancy =
      totalDaysInMonth > 0
        ? Math.round((booked / totalDaysInMonth) * 100)
        : 0;
    const adr = booked > 0 ? Math.round(revenue / booked) : 0;

    return {
      revenue: Math.round(revenue),
      occupancy,
      adr,
      available,
      booked,
      blocked,
    };
  }, [
    totalDaysInMonth,
    currentMonth,
    currentYear,
    closedMap,
    activeReservations,
  ]);

  // Guest name snippet: first name + last initial
  function guestSnippet(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }

  // Selected date info
  const selectedDateInfo = selectedDate
    ? (() => {
        const day = parseInt(selectedDate.split("-")[2]);
        return getDateStatus(day);
      })()
    : null;

  // Upcoming reservations (next 10, sorted by check-in)
  const upcomingReservations = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return activeReservations
      .filter(
        (r) =>
          new Date(r.checkIn) >= now &&
          r.status !== "cancelled" &&
          r.status !== "declined"
      )
      .sort(
        (a, b) =>
          new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
      )
      .slice(0, 10);
  }, [activeReservations]);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700",
    confirmed: "bg-emerald-50 text-emerald-700",
    declined: "bg-red-50 text-red-600",
    cancelled: "bg-gray-100 text-warm-gray",
    completed: "bg-blue-50 text-blue-600",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-serif text-2xl text-charcoal font-light">
          Calendar Management
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setBlockStart("");
              setBlockEnd("");
              setBlockReason("");
              setShowBlockModal(true);
            }}
            className="flex items-center gap-2 bg-charcoal text-white px-5 py-2.5 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90 transition"
          >
            <Ban size={14} /> Block Dates
          </button>
          <a
            href="/admin/reservations"
            className="flex items-center gap-2 bg-white text-charcoal border border-light-gray px-5 py-2.5 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition"
          >
            <Plus size={14} /> Add Reservation
          </a>
        </div>
      </div>

      {/* Property selector + Month nav */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1 block">
            Property
          </label>
          <select
            value={selectedListing}
            onChange={(e) => {
              setSelectedListing(e.target.value);
              setSelectedDate(null);
            }}
            className="border border-light-gray px-4 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:border-charcoal min-w-[200px]"
          >
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="text-warm-gray hover:text-charcoal transition p-2 border border-light-gray bg-white"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-charcoal min-w-[140px] text-center">
            {MONTHS[currentMonth]} {currentYear}
          </span>
          <button
            onClick={nextMonth}
            className="text-warm-gray hover:text-charcoal transition p-2 border border-light-gray bg-white"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Monthly stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          {
            label: "Total Revenue",
            value: `$${monthStats.revenue.toLocaleString()}`,
            icon: DollarSign,
            color: "text-emerald-600",
          },
          {
            label: "Occupancy",
            value: `${monthStats.occupancy}%`,
            icon: BarChart3,
            color: "text-blue-600",
          },
          {
            label: "ADR",
            value: `$${monthStats.adr}`,
            icon: TrendingUp,
            color: "text-charcoal",
          },
          {
            label: "Available Nights",
            value: String(monthStats.available),
            icon: CalendarDays,
            color: "text-blue-500",
          },
          {
            label: "Booked Nights",
            value: String(monthStats.booked),
            icon: CheckCircle,
            color: "text-emerald-600",
          },
          {
            label: "Blocked Days",
            value: String(monthStats.blocked),
            icon: Ban,
            color: "text-red-500",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-light-gray p-4 text-center"
          >
            <div className="flex justify-center mb-1.5">
              <s.icon size={16} className={`${s.color} opacity-60`} />
            </div>
            <p className={`text-xl font-light ${s.color}`}>{s.value}</p>
            <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mt-1">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Calendar + Side Panel */}
      <div className="flex gap-6 flex-col lg:flex-row mb-8">
        {/* Calendar */}
        <div className="flex-1 bg-white border border-light-gray">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-light-gray">
            {DAYS.map((d) => (
              <div
                key={d}
                className="py-2.5 text-center text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="aspect-square border-b border-r border-light-gray bg-cream/30 min-h-[80px]"
                  />
                );
              }

              const status = getDateStatus(day);
              const dateStr = formatDateStr(day);
              const isSelected = selectedDate === dateStr;
              const isToday = (() => {
                const today = new Date();
                return (
                  day === today.getDate() &&
                  currentMonth === today.getMonth() &&
                  currentYear === today.getFullYear()
                );
              })();

              let bgClass = "bg-white hover:bg-cream/50";
              let textClass = "text-charcoal";
              let rateColor = "text-warm-gray/60";

              if (status.type === "blocked") {
                bgClass = "bg-red-50 hover:bg-red-100";
              } else if (status.type === "booked") {
                bgClass = "bg-emerald-50 hover:bg-emerald-100";
              } else if (status.type === "past") {
                bgClass = "bg-gray-50";
                textClass = "text-warm-gray/40";
                rateColor = "text-warm-gray/30";
              }

              if (isSelected) {
                bgClass = "bg-charcoal";
                textClass = "text-white";
                rateColor = "text-white/60";
              }

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`border-b border-r border-light-gray ${bgClass} transition-colors relative flex flex-col items-start p-1.5 min-h-[80px] text-left`}
                >
                  {/* Day number */}
                  <span
                    className={`text-sm leading-none ${textClass} ${isToday ? "font-bold" : ""}`}
                  >
                    {isToday ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-charcoal text-white text-xs font-bold">
                        {day}
                      </span>
                    ) : (
                      day
                    )}
                  </span>

                  {/* Rate */}
                  {status.type !== "past" && (
                    <span
                      className={`text-[10px] mt-0.5 ${isSelected ? "text-white/60" : rateMap.has(formatDateStr(day)) ? "text-charcoal/70 font-medium" : "text-warm-gray/50"}`}
                    >
                      ${getRateForDate(day)}
                    </span>
                  )}

                  {/* Guest name for booked */}
                  {status.type === "booked" && !isSelected && (
                    <span className="text-[9px] text-emerald-700 font-medium mt-auto truncate w-full leading-tight">
                      {guestSnippet(status.reservation.guestName)}
                    </span>
                  )}

                  {/* Blocked indicator */}
                  {status.type === "blocked" && !isSelected && (
                    <span className="text-[9px] text-red-400 font-medium mt-auto truncate w-full leading-tight">
                      Blocked
                    </span>
                  )}

                  {/* Available future: predicted revenue */}
                  {status.type === "available" && !isSelected && (
                    <span className="text-[9px] text-blue-400/60 mt-auto leading-tight">
                      +${getRateForDate(day)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-6 py-3 border-t border-light-gray flex flex-wrap gap-5">
            {[
              { color: "bg-emerald-100 border-emerald-300", label: "Booked" },
              { color: "bg-red-50 border-red-300", label: "Blocked" },
              {
                color: "bg-white border-light-gray",
                label: "Available",
              },
              { color: "bg-gray-50 border-gray-300", label: "Past" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span
                  className={`w-4 h-3 border ${l.color}`}
                />
                <span className="text-[9px] tracking-[0.1em] uppercase text-warm-gray font-medium">
                  {l.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side panel */}
        <div className="lg:w-80 shrink-0 space-y-4">
          {selectedDate && selectedDateInfo ? (
            <>
              {/* Date detail card */}
              <div className="bg-white border border-light-gray p-5">
                <h3 className="text-sm font-medium text-charcoal mb-1">
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </h3>

                {/* Status badge */}
                <span
                  className={`inline-block text-[9px] tracking-[0.15em] uppercase font-medium px-2 py-0.5 mb-4 ${
                    selectedDateInfo.type === "booked"
                      ? "bg-emerald-50 text-emerald-700"
                      : selectedDateInfo.type === "blocked"
                        ? "bg-red-50 text-red-600"
                        : selectedDateInfo.type === "available"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-gray-50 text-gray-400"
                  }`}
                >
                  {selectedDateInfo.type === "booked"
                    ? "Booked"
                    : selectedDateInfo.type === "blocked"
                      ? "Blocked"
                      : selectedDateInfo.type === "available"
                        ? "Available"
                        : "Past"}
                </span>

                {/* Booked detail */}
                {selectedDateInfo.type === "booked" && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <p className="text-sm text-charcoal font-medium">
                        {selectedDateInfo.reservation.guestName}
                      </p>
                      <p className="text-xs text-warm-gray">
                        {selectedDateInfo.reservation.guestEmail}
                      </p>
                      <p className="text-xs text-warm-gray">
                        Check-in:{" "}
                        {new Date(
                          selectedDateInfo.reservation.checkIn
                        ).toLocaleDateString("en-US", { timeZone: "UTC" })}
                      </p>
                      <p className="text-xs text-warm-gray">
                        Check-out:{" "}
                        {new Date(
                          selectedDateInfo.reservation.checkOut
                        ).toLocaleDateString("en-US", { timeZone: "UTC" })}
                      </p>
                      <p className="text-xs text-warm-gray flex items-center gap-1">
                        <Users size={12} />{" "}
                        {selectedDateInfo.reservation.guests} guest
                        {selectedDateInfo.reservation.guests > 1 ? "s" : ""}
                      </p>
                      <p className="text-sm font-medium text-charcoal">
                        Total: ${selectedDateInfo.reservation.totalPrice}
                      </p>
                      <p className="text-xs text-warm-gray">
                        Status:{" "}
                        <span
                          className={`font-medium ${
                            selectedDateInfo.reservation.status === "confirmed"
                              ? "text-emerald-600"
                              : selectedDateInfo.reservation.status ===
                                  "pending"
                                ? "text-yellow-600"
                                : "text-warm-gray"
                          }`}
                        >
                          {selectedDateInfo.reservation.status
                            .charAt(0)
                            .toUpperCase() +
                            selectedDateInfo.reservation.status.slice(1)}
                        </span>
                      </p>
                      {selectedDateInfo.reservation.accessCode && (
                        <p className="text-xs text-warm-gray">
                          Access Code:{" "}
                          <span className="font-mono font-medium text-charcoal bg-cream px-1.5 py-0.5">
                            {selectedDateInfo.reservation.accessCode}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {selectedDateInfo.reservation.status === "pending" && (
                        <button
                          onClick={() =>
                            updateReservationStatus(
                              selectedDateInfo.reservation.id,
                              "confirmed"
                            )
                          }
                          className="flex items-center gap-1 text-accent border border-accent/30 hover:bg-accent/10 px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase font-medium transition"
                        >
                          <CheckCircle size={12} /> Confirm
                        </button>
                      )}
                      {(selectedDateInfo.reservation.status === "pending" ||
                        selectedDateInfo.reservation.status ===
                          "confirmed") && (
                        <button
                          onClick={() =>
                            updateReservationStatus(
                              selectedDateInfo.reservation.id,
                              "cancelled"
                            )
                          }
                          className="flex items-center gap-1 text-yellow-600 border border-yellow-200 hover:bg-yellow-50 px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase font-medium transition"
                        >
                          <XCircle size={12} /> Cancel
                        </button>
                      )}
                      <button
                        onClick={() =>
                          deleteReservation(selectedDateInfo.reservation.id)
                        }
                        className="flex items-center gap-1 text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase font-medium transition"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Blocked detail */}
                {selectedDateInfo.type === "blocked" && (
                  <div className="space-y-3">
                    {selectedDateInfo.reason && (
                      <p className="text-xs text-warm-gray">
                        Reason: {selectedDateInfo.reason}
                      </p>
                    )}
                    <button
                      onClick={() => {
                        unblockDate(selectedDateInfo.id);
                        setSelectedDate(null);
                      }}
                      className="flex items-center gap-1 text-[10px] tracking-[0.1em] uppercase text-red-500 border border-red-200 px-3 py-1.5 hover:bg-red-50 transition font-medium"
                    >
                      <Trash2 size={12} /> Unblock
                    </button>
                  </div>
                )}

                {/* Available detail */}
                {selectedDateInfo.type === "available" && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      {(() => {
                        const day = parseInt(selectedDate.split("-")[2]);
                        const dateRate = getRateForDate(day);
                        const dr = rateMap.get(selectedDate);
                        return (
                          <>
                            <p className="text-sm text-charcoal">
                              Current Rate:{" "}
                              <span className="font-medium">
                                ${dateRate}/night
                              </span>
                            </p>
                            {dr && (
                              <p className="text-[9px] text-warm-gray">
                                Source: {dr.rateSource}
                              </p>
                            )}
                            <p className="text-xs text-warm-gray flex items-center gap-1">
                              <TrendingUp size={12} /> Predicted Revenue: $
                              {dateRate}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                    <button
                      onClick={() => {
                        setBlockStart(selectedDate);
                        setBlockEnd(selectedDate);
                        setShowBlockModal(true);
                      }}
                      className="flex items-center gap-1 text-[10px] tracking-[0.1em] uppercase text-charcoal border border-light-gray px-3 py-1.5 hover:bg-cream transition font-medium"
                    >
                      <Ban size={12} /> Block This Date
                    </button>
                  </div>
                )}

                {/* Past */}
                {selectedDateInfo.type === "past" && (
                  <p className="text-xs text-warm-gray mt-2">
                    This date has already passed.
                  </p>
                )}
              </div>

              {/* Rate info card */}
              <div className="bg-white border border-light-gray p-5">
                <h4 className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-3">
                  Rate Info
                </h4>
                {(() => {
                  const day = parseInt(selectedDate.split("-")[2]);
                  const dateRate = getRateForDate(day);
                  const dr = rateMap.get(selectedDate);
                  return (
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-warm-gray">Base Rate</span>
                        <span className="text-charcoal font-medium">
                          ${nightlyRate}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-warm-gray">Effective Rate</span>
                        <span className={`font-medium ${dr ? "text-emerald-600" : "text-charcoal"}`}>
                          ${dateRate}
                          {dr && dateRate !== nightlyRate && (
                            <span className="text-[9px] text-emerald-500 ml-1">
                              {dateRate > nightlyRate ? "+" : ""}{Math.round(((dateRate - nightlyRate) / nightlyRate) * 100)}%
                            </span>
                          )}
                        </span>
                      </div>
                      {dr && (
                        <div className="flex justify-between text-xs">
                          <span className="text-warm-gray">Source</span>
                          <span className="text-charcoal">{dr.rateSource}</span>
                        </div>
                      )}
                      <a
                        href={`/admin/sales?listing=${selectedListing}`}
                        className="block text-[9px] text-center text-warm-gray hover:text-charcoal border border-light-gray px-3 py-1.5 mt-2 transition"
                      >
                        Manage in Sales Manager
                      </a>
                    </div>
                  );
                })()}
              </div>

              {/* Revenue forecast card */}
              <div className="bg-white border border-light-gray p-5">
                <h4 className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-3">
                  Revenue Forecast
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-warm-gray">This Month</span>
                    <span className="text-charcoal font-medium">
                      ${monthStats.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-warm-gray">Next 30 Days</span>
                    <span className="text-charcoal font-medium">
                      $
                      {(
                        monthStats.revenue +
                        monthStats.available * nightlyRate * 0.3
                      ).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <p className="text-[9px] text-warm-gray/60 mt-1 flex items-center gap-1">
                    <Info size={10} /> Estimates based on current rate &
                    occupancy
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-light-gray p-5 text-center">
              <CalendarDays
                size={32}
                className="text-warm-gray/30 mx-auto mb-3"
              />
              <p className="text-xs text-warm-gray">
                Select a date on the calendar to view details, manage
                reservations, or block availability.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Reservations table */}
      <div className="bg-white border border-light-gray p-5 mb-6">
        <h3 className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-4">
          Upcoming Reservations
        </h3>
        <DataTable
          rows={upcomingReservations}
          rowKey={(r) => r.id}
          searchPlaceholder="Search by guest name..."
          defaultPageSize={10}
          defaultSort={{ key: "checkIn", dir: "asc" }}
          emptyMessage="No upcoming reservations for this property."
          filters={[
            {
              key: "status",
              label: "Status",
              options: [
                { value: "pending", label: "Pending" },
                { value: "confirmed", label: "Confirmed" },
                { value: "cancelled", label: "Cancelled" },
                { value: "declined", label: "Declined" },
              ],
              match: (r, v) => r.status === v,
            },
          ]}
          columns={[
            {
              key: "guestName",
              label: "Guest",
              render: (r) => (
                <p className="text-sm text-charcoal font-medium">{r.guestName}</p>
              ),
            },
            {
              key: "checkIn",
              label: "Check-in",
              accessor: (r) => r.checkIn,
              render: (r) => (
                <span className="text-xs text-warm-gray">
                  {new Date(r.checkIn).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </span>
              ),
            },
            {
              key: "checkOut",
              label: "Check-out",
              accessor: (r) => r.checkOut,
              render: (r) => (
                <span className="text-xs text-warm-gray">
                  {new Date(r.checkOut).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </span>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (r) => (
                <span
                  className={`inline-block text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 ${statusColors[r.status] || "bg-gray-50 text-warm-gray"}`}
                >
                  {r.status}
                </span>
              ),
            },
            {
              key: "totalPrice",
              label: "Total",
              accessor: (r) => r.totalPrice,
              render: (r) => (
                <span className="text-sm text-charcoal font-medium">
                  ${r.totalPrice}
                </span>
              ),
            },
            {
              key: "actions",
              label: "",
              sortable: false,
              render: (r) => (
                <div className="flex gap-1.5">
                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateReservationStatus(r.id, "confirmed")}
                        className="text-accent hover:text-accent/80 transition"
                        title="Confirm"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => updateReservationStatus(r.id, "declined")}
                        className="text-red-400 hover:text-red-600 transition"
                        title="Decline"
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  )}
                  {r.status === "confirmed" && (
                    <button
                      onClick={() => updateReservationStatus(r.id, "cancelled")}
                      className="text-warm-gray hover:text-charcoal transition"
                      title="Cancel"
                    >
                      <Clock size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteReservation(r.id)}
                    className="text-red-300 hover:text-red-500 transition"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Block Dates Modal */}
      {showBlockModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
          onClick={() => setShowBlockModal(false)}
        >
          <div
            className="bg-white w-full max-w-md p-6 border border-light-gray"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-charcoal">
                Block Dates
              </h3>
              <button onClick={() => setShowBlockModal(false)}>
                <X size={18} className="text-warm-gray" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1 block">
                  Start Date
                </label>
                <input
                  type="date"
                  value={blockStart}
                  onChange={(e) => setBlockStart(e.target.value)}
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1 block">
                  End Date (optional -- leave blank for single day)
                </label>
                <input
                  type="date"
                  value={blockEnd}
                  onChange={(e) => setBlockEnd(e.target.value)}
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1 block">
                  Reason (optional)
                </label>
                <input
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Maintenance, Owner use, Holiday"
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <button
                onClick={blockDates}
                disabled={!blockStart || adding}
                className="w-full bg-charcoal text-white py-3 text-[11px] tracking-[0.2em] uppercase font-medium hover:bg-charcoal/90 transition disabled:opacity-30"
              >
                {adding ? "Blocking..." : "Block Dates"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAvailabilityPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><p className="text-warm-gray text-sm">Loading...</p></div>}>
      <AdminAvailabilityPageInner />
    </Suspense>
  );
}
