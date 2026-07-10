"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, BedDouble, Bath, Users, Loader2 } from "lucide-react";

interface ListingData {
  id: string;
  title: string;
  slug: string;
  pricePerNight: number;
  cleaningFee: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  type: string;
  closedDates: string[];
  bookedRanges: { checkIn: string; checkOut: string }[];
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string) {
  return Math.ceil(
    (new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

export function ReservationsCalendar({ listings }: { listings: ListingData[] }) {
  const router = useRouter();
  const today = new Date();
  const todayKey = toDateKey(today);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedListing, setSelectedListing] = useState<string>(listings[0]?.id ?? "");
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [guests, setGuests] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const listing = listings.find((l) => l.id === selectedListing) ?? listings[0];

  const bookedSet = useMemo(() => {
    if (!listing) return new Set<string>();
    const set = new Set<string>();
    for (const r of listing.bookedRanges) {
      const start = new Date(r.checkIn + "T00:00:00");
      const end = new Date(r.checkOut + "T00:00:00");
      const d = new Date(start);
      while (d < end) {
        set.add(toDateKey(d));
        d.setDate(d.getDate() + 1);
      }
    }
    return set;
  }, [listing]);

  const closedSet = useMemo(() => {
    if (!listing) return new Set<string>();
    return new Set(listing.closedDates);
  }, [listing]);

  function getDateStatus(dateKey: string) {
    if (dateKey < todayKey) return "past";
    if (bookedSet.has(dateKey)) return "booked";
    if (closedSet.has(dateKey)) return "blocked";
    return "available";
  }

  function isInSelectedRange(dateKey: string) {
    if (!checkIn) return false;
    const end = checkOut || hoverDate;
    if (!end) return dateKey === checkIn;
    const rangeStart = checkIn < end ? checkIn : end;
    const rangeEnd = checkIn < end ? end : checkIn;
    return dateKey >= rangeStart && dateKey <= rangeEnd;
  }

  function hasBlockedInRange(start: string, end: string) {
    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T00:00:00");
    const d = new Date(s);
    while (d < e) {
      const key = toDateKey(d);
      const status = getDateStatus(key);
      if (status === "booked" || status === "blocked") return true;
      d.setDate(d.getDate() + 1);
    }
    return false;
  }

  function handleDateClick(dateKey: string) {
    const status = getDateStatus(dateKey);
    if (status !== "available") return;

    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(dateKey);
      setCheckOut(null);
      setError("");
    } else {
      if (dateKey === checkIn) {
        setCheckIn(null);
        return;
      }
      const start = dateKey > checkIn ? checkIn : dateKey;
      const end = dateKey > checkIn ? dateKey : checkIn;

      if (hasBlockedInRange(start, end)) {
        setError("Your selected range includes unavailable dates. Please choose different dates.");
        return;
      }

      if (start === checkIn) {
        setCheckOut(end);
      } else {
        setCheckIn(start);
        setCheckOut(end);
      }
      setError("");
    }
  }

  const nights = checkIn && checkOut ? daysBetween(checkIn, checkOut) : 0;
  const estimatedTotal = nights > 0 ? nights * listing.pricePerNight + listing.cleaningFee : 0;

  async function handleBookNow() {
    if (!checkIn || !checkOut || !listing) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/booking/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          checkIn,
          checkOut,
          guests,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create quote");
        setSubmitting(false);
        return;
      }
      router.push(`/checkout/${data.quote.id}`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const firstDay = new Date(currentYear, currentMonth, 1);
  const startDow = firstDay.getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthLabel = firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }

  const availableCount = useMemo(() => {
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = toDateKey(new Date(currentYear, currentMonth, d));
      if (getDateStatus(key) === "available") count++;
    }
    return count;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, currentYear, daysInMonth, bookedSet, closedSet]);

  if (!listing) {
    return <p className="text-sm text-warm-gray">No properties available.</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Calendar */}
      <div className="lg:col-span-2 space-y-6">
        {/* Property Selector */}
        {listings.length > 1 && (
          <div>
            <label className="text-[9px] tracking-[0.2em] uppercase text-warm-gray font-medium mb-2 block">
              Select Property
            </label>
            <select
              value={selectedListing}
              onChange={(e) => {
                setSelectedListing(e.target.value);
                setCheckIn(null);
                setCheckOut(null);
                setGuests(1);
                setError("");
              }}
              className="bg-white border border-light-gray text-charcoal text-sm px-4 py-2.5 w-full max-w-sm outline-none focus:border-charcoal/40 transition"
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Selection Instructions */}
        <div className="bg-white border border-light-gray px-5 py-3">
          <p className="text-xs text-charcoal/60">
            {!checkIn
              ? "Select your check-in date on the calendar"
              : !checkOut
              ? "Now select your check-out date"
              : `${nights} night${nights > 1 ? "s" : ""} selected — ${new Date(checkIn + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} to ${new Date(checkOut + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
          </p>
        </div>

        {/* Month Nav */}
        <div className="bg-white border border-light-gray">
          <div className="flex items-center justify-between px-6 py-4 border-b border-light-gray">
            <button onClick={prevMonth} className="p-1.5 hover:bg-cream transition rounded">
              <ChevronLeft size={18} className="text-charcoal" />
            </button>
            <h2 className="text-sm tracking-[0.15em] uppercase font-medium text-charcoal">
              {monthLabel}
            </h2>
            <button onClick={nextMonth} className="p-1.5 hover:bg-cream transition rounded">
              <ChevronRight size={18} className="text-charcoal" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-light-gray">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-2.5 text-center text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="aspect-square border-b border-r border-light-gray/50" />;
              }

              const dateKey = toDateKey(new Date(currentYear, currentMonth, day));
              const status = getDateStatus(dateKey);
              const isToday = dateKey === todayKey;
              const isCheckIn = dateKey === checkIn;
              const isCheckOut = dateKey === checkOut;
              const inRange = isInSelectedRange(dateKey);
              const isEndpoint = isCheckIn || isCheckOut;

              let bgClass = "bg-white hover:bg-cream";
              let textClass = "text-charcoal";
              let priceColor = "text-emerald-600";

              if (status === "past") {
                bgClass = "bg-gray-50";
                textClass = "text-gray-300";
                priceColor = "text-gray-300";
              } else if (status === "booked") {
                bgClass = "bg-charcoal/5";
                textClass = "text-warm-gray";
                priceColor = "text-warm-gray";
              } else if (status === "blocked") {
                bgClass = "bg-red-50/50";
                textClass = "text-red-300";
                priceColor = "text-red-300";
              } else if (isEndpoint) {
                bgClass = "bg-charcoal";
                textClass = "text-white";
                priceColor = "text-white/70";
              } else if (inRange) {
                bgClass = "bg-charcoal/10";
                textClass = "text-charcoal";
                priceColor = "text-emerald-700";
              }

              return (
                <button
                  key={dateKey}
                  onClick={() => handleDateClick(dateKey)}
                  onMouseEnter={() => {
                    if (checkIn && !checkOut && status === "available") {
                      setHoverDate(dateKey);
                    }
                  }}
                  onMouseLeave={() => setHoverDate(null)}
                  disabled={status === "past"}
                  className={`aspect-square border-b border-r border-light-gray/50 flex flex-col items-center justify-center gap-0.5 transition relative ${bgClass} ${status === "past" ? "cursor-default" : status === "booked" || status === "blocked" ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {isToday && !isEndpoint && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-charcoal" />
                  )}
                  {isCheckIn && (
                    <div className="absolute top-0.5 left-0 right-0 text-[7px] tracking-wider uppercase text-white/80 font-medium">In</div>
                  )}
                  {isCheckOut && (
                    <div className="absolute top-0.5 left-0 right-0 text-[7px] tracking-wider uppercase text-white/80 font-medium">Out</div>
                  )}
                  <span className={`text-sm font-light ${textClass}`}>{day}</span>
                  {status === "available" && (
                    <span className={`text-[9px] font-medium ${priceColor}`}>
                      ${listing.pricePerNight}
                    </span>
                  )}
                  {status === "booked" && (
                    <span className="text-[8px] text-warm-gray/60 uppercase tracking-wider">Booked</span>
                  )}
                  {status === "blocked" && (
                    <span className="text-[8px] text-red-300 uppercase tracking-wider">N/A</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 text-[10px] text-warm-gray">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white border border-light-gray" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-charcoal/10 border border-light-gray" />
            <span>Selected Range</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-charcoal/5 border border-light-gray" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-50 border border-red-200" />
            <span>Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-charcoal" />
            <span>Check-in / Check-out</span>
          </div>
        </div>

        {/* Month Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-light-gray p-4 text-center">
            <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">Available Nights</p>
            <p className="text-2xl font-light text-charcoal">{availableCount}</p>
          </div>
          <div className="bg-white border border-light-gray p-4 text-center">
            <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">Nightly Rate</p>
            <p className="text-2xl font-light text-charcoal">${listing.pricePerNight}</p>
          </div>
          <div className="bg-white border border-light-gray p-4 text-center">
            <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">Cleaning Fee</p>
            <p className="text-2xl font-light text-charcoal">${listing.cleaningFee}</p>
          </div>
        </div>
      </div>

      {/* Right: Booking Panel */}
      <div className="space-y-6">
        {/* Property Card */}
        <div className="bg-white border border-light-gray p-6">
          <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">
            {listing.type}
          </p>
          <h3 className="font-serif text-xl text-charcoal font-light mb-4">{listing.title}</h3>
          <div className="flex flex-wrap items-center gap-4 text-xs text-warm-gray mb-5">
            <span className="flex items-center gap-1.5">
              <BedDouble size={14} /> {listing.bedrooms} Bed{listing.bedrooms > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Bath size={14} /> {listing.bathrooms} Bath
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} /> Up to {listing.maxGuests}
            </span>
          </div>
          <div className="border-t border-light-gray pt-4">
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-3xl text-charcoal">${listing.pricePerNight}</span>
              <span className="text-sm text-warm-gray">/ night</span>
            </div>
            {listing.cleaningFee > 0 && (
              <p className="text-xs text-warm-gray mt-1">+ ${listing.cleaningFee} cleaning fee</p>
            )}
          </div>
        </div>

        {/* Booking Summary */}
        <div className="bg-white border border-light-gray p-6">
          <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-4">
            Your Reservation
          </p>

          {/* Date display */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className={`border px-3 py-2.5 ${checkIn ? "border-charcoal/30" : "border-light-gray"}`}>
              <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">Check-in</p>
              <p className="text-sm text-charcoal">
                {checkIn
                  ? new Date(checkIn + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : "—"}
              </p>
            </div>
            <div className={`border px-3 py-2.5 ${checkOut ? "border-charcoal/30" : "border-light-gray"}`}>
              <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">Check-out</p>
              <p className="text-sm text-charcoal">
                {checkOut
                  ? new Date(checkOut + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>

          {/* Guest selector */}
          <div className="mb-5">
            <label className="text-[9px] tracking-[0.2em] uppercase text-warm-gray font-medium mb-1.5 block">
              Guests
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full border border-light-gray text-charcoal text-sm px-3 py-2.5 outline-none focus:border-charcoal/40 transition bg-white"
            >
              {Array.from({ length: listing.maxGuests }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} guest{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Price breakdown */}
          {nights > 0 && (
            <div className="space-y-2 text-sm border-t border-light-gray pt-4 mb-5">
              <div className="flex justify-between text-charcoal/60">
                <span>${listing.pricePerNight} &times; {nights} night{nights > 1 ? "s" : ""}</span>
                <span>${nights * listing.pricePerNight}</span>
              </div>
              {listing.cleaningFee > 0 && (
                <div className="flex justify-between text-charcoal/60">
                  <span>Cleaning fee</span>
                  <span>${listing.cleaningFee}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-charcoal border-t border-light-gray pt-2">
                <span>Estimated Total</span>
                <span>${estimatedTotal}</span>
              </div>
              <p className="text-[10px] text-warm-gray/70">
                Final pricing calculated at checkout
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 mb-4">{error}</p>
          )}

          <button
            onClick={handleBookNow}
            disabled={!checkIn || !checkOut || submitting}
            className="w-full bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase py-3.5 hover:bg-stone transition-all duration-300 font-medium disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Creating Quote...
              </span>
            ) : !checkIn ? (
              "Select Dates to Book"
            ) : !checkOut ? (
              "Select Check-out Date"
            ) : (
              "Continue to Checkout"
            )}
          </button>

          {checkIn && (
            <button
              onClick={() => {
                setCheckIn(null);
                setCheckOut(null);
                setError("");
              }}
              className="w-full text-center text-[10px] text-warm-gray hover:text-charcoal transition mt-3 uppercase tracking-[0.1em]"
            >
              Clear Dates
            </button>
          )}
        </div>

        {/* Quick Estimate */}
        {!checkIn && (
          <div className="bg-white border border-light-gray p-6">
            <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-3">
              Quick Estimate
            </p>
            <div className="space-y-2 text-sm">
              {[2, 3, 5, 7].map((n) => (
                <div key={n} className="flex justify-between">
                  <span className="text-warm-gray">{n} nights</span>
                  <span className="text-charcoal">${n * listing.pricePerNight + listing.cleaningFee}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-warm-gray mt-3">
              Estimates include ${listing.cleaningFee} cleaning fee
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
