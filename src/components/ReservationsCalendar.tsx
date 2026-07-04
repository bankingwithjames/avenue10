"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BedDouble, Bath, Users } from "lucide-react";

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

function isDateInRange(dateKey: string, checkIn: string, checkOut: string) {
  return dateKey >= checkIn && dateKey < checkOut;
}

export function ReservationsCalendar({ listings }: { listings: ListingData[] }) {
  const today = new Date();
  const todayKey = toDateKey(today);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedListing, setSelectedListing] = useState<string>(listings[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  const selectedStatus = selectedDate ? getDateStatus(selectedDate) : null;

  // Count available nights this month
  const availableCount = useMemo(() => {
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = toDateKey(new Date(currentYear, currentMonth, d));
      if (getDateStatus(key) === "available") count++;
    }
    return count;
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
              onChange={(e) => { setSelectedListing(e.target.value); setSelectedDate(null); }}
              className="bg-white border border-light-gray text-charcoal text-sm px-4 py-2.5 w-full max-w-sm outline-none focus:border-charcoal/40 transition"
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Month Nav */}
        <div className="bg-white border border-light-gray">
          <div className="flex items-center justify-between px-6 py-4 border-b border-light-gray">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-cream transition rounded"
            >
              <ChevronLeft size={18} className="text-charcoal" />
            </button>
            <h2 className="text-sm tracking-[0.15em] uppercase font-medium text-charcoal">
              {monthLabel}
            </h2>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-cream transition rounded"
            >
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
              const isSelected = selectedDate === dateKey;
              const isToday = dateKey === todayKey;

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
              } else if (isSelected) {
                bgClass = "bg-charcoal";
                textClass = "text-white";
                priceColor = "text-white/70";
              }

              return (
                <button
                  key={dateKey}
                  onClick={() => status !== "past" ? setSelectedDate(isSelected ? null : dateKey) : undefined}
                  disabled={status === "past"}
                  className={`aspect-square border-b border-r border-light-gray/50 flex flex-col items-center justify-center gap-0.5 transition relative ${bgClass} ${status === "past" ? "cursor-default" : "cursor-pointer"}`}
                >
                  {isToday && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-charcoal" />
                  )}
                  <span className={`text-sm font-light ${textClass}`}>{day}</span>
                  {status === "available" && !isSelected && (
                    <span className={`text-[9px] font-medium ${priceColor}`}>
                      ${listing.pricePerNight}
                    </span>
                  )}
                  {status === "available" && isSelected && (
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
            <div className="w-3 h-3 bg-charcoal/5 border border-light-gray" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-50 border border-red-200" />
            <span>Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-50 border border-light-gray" />
            <span>Past</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-charcoal" />
            <span>Today</span>
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

      {/* Right: Property Info & Selected Date */}
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

        {/* Selected Date Panel */}
        {selectedDate && (
          <div className="bg-white border border-light-gray p-6">
            <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-3">
              Selected Date
            </p>
            <p className="font-serif text-lg text-charcoal mb-3">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            {selectedStatus === "available" && (
              <>
                <div className="space-y-2 text-sm border-t border-light-gray pt-3">
                  <div className="flex justify-between">
                    <span className="text-warm-gray">Nightly Rate</span>
                    <span className="text-charcoal font-medium">${listing.pricePerNight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-gray">Cleaning Fee</span>
                    <span className="text-charcoal font-medium">${listing.cleaningFee}</span>
                  </div>
                  <div className="flex justify-between border-t border-light-gray pt-2">
                    <span className="text-charcoal font-medium">Est. 1-Night Total</span>
                    <span className="text-charcoal font-medium">${listing.pricePerNight + listing.cleaningFee}</span>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-600 mt-3 font-medium uppercase tracking-wider">
                  &#10003; Available
                </p>
              </>
            )}
            {selectedStatus === "booked" && (
              <p className="text-xs text-warm-gray mt-1">
                This date is currently booked. Please select another date.
              </p>
            )}
            {selectedStatus === "blocked" && (
              <p className="text-xs text-warm-gray mt-1">
                This date is not available. Please select another date.
              </p>
            )}
          </div>
        )}

        {/* Book Now CTA */}
        <Link
          href={`/listings/${listing.slug}`}
          className="block w-full border border-charcoal text-charcoal text-center text-[11px] tracking-[0.2em] uppercase py-3.5 hover:bg-charcoal hover:text-white transition-all duration-300 font-medium"
        >
          View Details & Book
        </Link>

        {/* Quick Estimate */}
        <div className="bg-white border border-light-gray p-6">
          <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-3">
            Quick Estimate
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-warm-gray">2 nights</span>
              <span className="text-charcoal">${listing.pricePerNight * 2 + listing.cleaningFee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-gray">3 nights</span>
              <span className="text-charcoal">${listing.pricePerNight * 3 + listing.cleaningFee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-gray">5 nights</span>
              <span className="text-charcoal">${listing.pricePerNight * 5 + listing.cleaningFee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-gray">7 nights</span>
              <span className="text-charcoal">${listing.pricePerNight * 7 + listing.cleaningFee}</span>
            </div>
          </div>
          <p className="text-[10px] text-warm-gray mt-3">
            Estimates include ${listing.cleaningFee} cleaning fee
          </p>
        </div>
      </div>
    </div>
  );
}
