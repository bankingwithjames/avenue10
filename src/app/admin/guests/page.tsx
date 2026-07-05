"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Download,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Star,
  Eye,
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
  listing: { title: string; slug: string };
}

interface Guest {
  name: string;
  email: string;
  phone: string | null;
  bookings: number;
  totalSpent: number;
  lastStay: string;
  isRepeat: boolean;
  status: "active" | "upcoming" | "past";
  properties: string[];
}

function buildGuests(reservations: Reservation[]): Guest[] {
  const grouped = new Map<string, Reservation[]>();
  for (const r of reservations) {
    const key = r.guestEmail;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const guests: Guest[] = [];
  for (const [email, resos] of grouped) {
    const name = resos.reduce(
      (longest, r) => (r.guestName.length > longest.length ? r.guestName : longest),
      ""
    );
    const phone = resos.find((r) => r.guestPhone)?.guestPhone ?? null;
    const totalSpent = resos.reduce((sum, r) => sum + r.totalPrice, 0);
    const sorted = [...resos].sort(
      (a, b) => new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime()
    );
    const lastStay = sorted[0].checkOut;

    const isActive = resos.some((r) => {
      const ci = new Date(r.checkIn);
      const co = new Date(r.checkOut);
      return today >= ci && today <= co;
    });
    const hasUpcoming = resos.some((r) => new Date(r.checkIn) > today);

    const status: Guest["status"] = isActive
      ? "active"
      : hasUpcoming
      ? "upcoming"
      : "past";

    const properties = [...new Set(resos.map((r) => r.listing.title))];

    guests.push({
      name,
      email,
      phone,
      bookings: resos.length,
      totalSpent,
      lastStay,
      isRepeat: resos.length >= 2,
      status,
      properties,
    });
  }

  return guests.sort((a, b) => b.bookings - a.bookings);
}

export default function GuestsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/reservations")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch reservations");
        return res.json();
      })
      .then((data) => setReservations(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const guests = useMemo(() => buildGuests(reservations), [reservations]);

  const filtered = useMemo(() => {
    if (!search.trim()) return guests;
    const q = search.toLowerCase();
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.properties.some((p) => p.toLowerCase().includes(q))
    );
  }, [guests, search]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalGuests = guests.length;
    const repeatGuests = guests.filter((g) => g.isRepeat).length;
    const activeStays = reservations.filter((r) => {
      const ci = new Date(r.checkIn);
      const co = new Date(r.checkOut);
      return today >= ci && today <= co;
    }).length;
    const pendingReviews = reservations.filter(
      (r) => r.status === "completed" || r.status === "declined"
    ).length;

    return { totalGuests, repeatGuests, activeStays, pendingReviews };
  }, [guests, reservations]);

  const formatCurrency = (amount: number) =>
    "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 0 });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const statusStyles: Record<Guest["status"], string> = {
    active: "text-emerald-700 bg-emerald-50",
    upcoming: "text-blue-700 bg-blue-50",
    past: "text-gray-500 bg-gray-100",
  };

  const statusLabels: Record<Guest["status"], string> = {
    active: "Active",
    upcoming: "Upcoming",
    past: "Past",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-warm-gray text-sm">Loading guests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-charcoal font-light">Guests</h1>
        <button
          onClick={() => alert("Export coming soon")}
          className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-2"
        >
          <Download size={12} />
          Export Guests
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Guests", value: stats.totalGuests, icon: Users },
          { label: "Repeat Guests", value: stats.repeatGuests, icon: Star },
          { label: "Active Stays", value: stats.activeStays, icon: Calendar },
          { label: "Pending Reviews", value: stats.pendingReviews, icon: Mail },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-light-gray p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
                {stat.label}
              </span>
              <stat.icon size={14} className="text-warm-gray" />
            </div>
            <p className="text-xl font-serif text-charcoal">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray"
        />
        <input
          type="text"
          placeholder="Search by name, email, or property..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 pl-9 outline-none focus:border-charcoal/40 transition-colors"
        />
      </div>

      {/* Guest List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-warm-gray text-sm">No guests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((guest) => (
            <div
              key={guest.email}
              className="bg-white border border-light-gray p-4 flex flex-col md:flex-row md:items-center gap-4"
            >
              {/* Guest Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-sm font-medium text-charcoal truncate">
                    {guest.name}
                  </h3>
                  {guest.isRepeat && (
                    <span className="text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 text-accent bg-emerald-50">
                      Repeat
                    </span>
                  )}
                  <span
                    className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 ${statusStyles[guest.status]}`}
                  >
                    {statusLabels[guest.status]}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1 text-warm-gray text-xs">
                    <Mail size={11} />
                    {guest.email}
                  </span>
                  {guest.phone && (
                    <span className="flex items-center gap-1 text-warm-gray text-xs">
                      <Phone size={11} />
                      {guest.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-6 text-xs text-warm-gray shrink-0">
                <div className="text-center">
                  <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">
                    Bookings
                  </p>
                  <p className="text-sm text-charcoal font-medium">{guest.bookings}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">
                    Total Spent
                  </p>
                  <p className="text-sm text-charcoal font-medium flex items-center gap-0.5">
                    <DollarSign size={11} />
                    {formatCurrency(guest.totalSpent).slice(1)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">
                    Last Stay
                  </p>
                  <p className="text-sm text-charcoal font-medium">
                    {formatDate(guest.lastStay)}
                  </p>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => alert(`Viewing guest: ${guest.name}`)}
                className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5 shrink-0"
              >
                <Eye size={12} />
                View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
