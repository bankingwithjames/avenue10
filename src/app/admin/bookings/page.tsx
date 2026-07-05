"use client";

import { useEffect, useState, useMemo } from "react";
import {
  CalendarCheck,
  Search,
  Filter,
  ChevronDown,
  Eye,
  ExternalLink,
  DollarSign,
  Users,
  Clock,
  Plus,
} from "lucide-react";

interface Reservation {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: string;
  notes: string | null;
  channel?: string;
  listing: { title: string; slug: string };
}

export default function BookingsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [dateRange, setDateRange] = useState("");

  useEffect(() => {
    fetch("/api/admin/reservations")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch reservations");
        return res.json();
      })
      .then((data) => {
        const sorted = (data as Reservation[]).sort(
          (a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()
        );
        setReservations(sorted);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const properties = useMemo(() => {
    const titles = reservations.map((r) => r.listing.title);
    return Array.from(new Set(titles)).sort();
  }, [reservations]);

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (searchQuery && !r.guestName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (propertyFilter !== "all" && r.listing.title !== propertyFilter) return false;
      return true;
    });
  }, [reservations, searchQuery, statusFilter, propertyFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const confirmed = reservations.filter((r) => r.status === "confirmed").length;
    const pending = reservations.filter((r) => r.status === "pending").length;
    const revenueMTD = reservations
      .filter((r) => {
        const d = new Date(r.checkIn);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, r) => sum + r.totalPrice, 0);

    return { total: reservations.length, confirmed, pending, revenueMTD };
  }, [reservations]);

  function getNights(checkIn: string, checkOut: string): number {
    const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
  }

  function statusBadge(status: string) {
    const base = "text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5";
    switch (status) {
      case "pending":
        return `${base} text-amber-600 bg-amber-50`;
      case "confirmed":
        return `${base} text-accent bg-emerald-50`;
      case "completed":
        return `${base} text-warm-gray bg-stone-100`;
      case "cancelled":
        return `${base} text-red-500 bg-red-50`;
      default:
        return `${base} text-warm-gray bg-stone-100`;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-warm-gray text-sm">Loading bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-charcoal font-light">Bookings</h1>
        <button
          onClick={() => alert("Manual booking form coming soon")}
          className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-2"
        >
          <Plus size={12} />
          Add Booking
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-light-gray p-5">
          <div className="flex items-center gap-2 mb-2">
            <CalendarCheck size={14} className="text-warm-gray" />
            <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
              Total Bookings
            </span>
          </div>
          <p className="text-xl font-serif text-charcoal">{stats.total}</p>
        </div>

        <div className="bg-white border border-light-gray p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-warm-gray" />
            <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
              Confirmed
            </span>
          </div>
          <p className="text-xl font-serif text-charcoal">{stats.confirmed}</p>
        </div>

        <div className="bg-white border border-light-gray p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-warm-gray" />
            <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
              Pending
            </span>
          </div>
          <p className="text-xl font-serif text-charcoal">{stats.pending}</p>
        </div>

        <div className="bg-white border border-light-gray p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-warm-gray" />
            <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
              Revenue MTD
            </span>
          </div>
          <p className="text-xl font-serif text-charcoal">
            ${stats.revenueMTD.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
          <input
            type="text"
            placeholder="Search by guest name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 pl-9 outline-none focus:border-charcoal/40 transition-colors"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 pr-8 outline-none focus:border-charcoal/40 transition-colors appearance-none"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 pr-8 outline-none focus:border-charcoal/40 transition-colors appearance-none"
          >
            <option value="all">All Properties</option>
            {properties.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray pointer-events-none" />
        </div>

        <input
          type="text"
          placeholder="Date range..."
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="w-full sm:w-40 bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 transition-colors"
        />
      </div>

      {/* Reservation rows */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-warm-gray text-sm">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-light-gray p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6"
            >
              {/* Guest & property */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal text-sm truncate">{r.guestName}</p>
                <p className="text-xs text-warm-gray truncate">{r.listing.title}</p>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-1.5 text-xs text-charcoal">
                <CalendarCheck size={12} className="text-warm-gray shrink-0" />
                <span>{new Date(r.checkIn).toLocaleDateString()}</span>
                <span className="text-warm-gray">-</span>
                <span>{new Date(r.checkOut).toLocaleDateString()}</span>
              </div>

              {/* Nights */}
              <div className="text-xs text-warm-gray whitespace-nowrap">
                {getNights(r.checkIn, r.checkOut)} nights
              </div>

              {/* Status */}
              <span className={statusBadge(r.status)}>{r.status}</span>

              {/* Price */}
              <p className="text-sm font-medium text-charcoal whitespace-nowrap">
                ${r.totalPrice.toLocaleString()}
              </p>

              {/* Channel */}
              {r.channel && (
                <span className="text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 text-warm-gray bg-stone-100">
                  {r.channel}
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => alert(`Viewing reservation ${r.id}`)}
                  className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5"
                >
                  <Eye size={11} />
                  View
                </button>
                <button
                  onClick={() => alert(`Opening guest portal for ${r.guestName}`)}
                  className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5"
                >
                  <ExternalLink size={11} />
                  Portal
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
