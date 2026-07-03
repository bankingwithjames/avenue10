"use client";

import { useEffect, useState } from "react";
import { Home, ClipboardList, DollarSign, Calendar } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    listings: 0,
    pending: 0,
    confirmed: 0,
    revenue: 0,
  });

  useEffect(() => {
    async function load() {
      const [listingsRes, reservationsRes] = await Promise.all([
        fetch("/api/admin/listings"),
        fetch("/api/admin/reservations"),
      ]);
      const listings = await listingsRes.json();
      const reservations = await reservationsRes.json();

      const pending = reservations.filter(
        (r: { status: string }) => r.status === "pending"
      ).length;
      const confirmed = reservations.filter(
        (r: { status: string }) => r.status === "confirmed"
      ).length;
      const revenue = reservations
        .filter((r: { status: string }) => r.status === "confirmed")
        .reduce((sum: number, r: { totalPrice: number }) => sum + r.totalPrice, 0);

      setStats({ listings: listings.length, pending, confirmed, revenue });
    }
    load();
  }, []);

  const cards = [
    { label: "Active Listings", value: stats.listings, icon: Home },
    { label: "Pending Requests", value: stats.pending, icon: ClipboardList },
    { label: "Confirmed Bookings", value: stats.confirmed, icon: Calendar },
    { label: "Revenue", value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl text-charcoal font-light mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white border border-light-gray p-5">
            <div className="flex items-center gap-3">
              <card.icon size={20} className="text-warm-gray" />
              <span className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium">
                {card.label}
              </span>
            </div>
            <p className="text-2xl font-light text-charcoal mt-3 font-serif">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
