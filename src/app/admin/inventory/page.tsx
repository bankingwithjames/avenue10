"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Package,
  Search,
  Filter,
  ChevronDown,
  Eye,
  EyeOff,
  Pencil,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Plus,
} from "lucide-react";

interface InventoryItem {
  id: string;
  listingId: string;
  name: string;
  category: string;
  room: string;
  quantity: number;
  quantityExpected: number;
  condition: string;
  replacementCost: number | null;
  lastChecked: string | null;
  guestVisible: boolean;
  notes: string | null;
}

interface Listing {
  id: string;
  title: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [invRes, listRes] = await Promise.all([
          fetch("/api/admin/inventory"),
          fetch("/api/admin/listings"),
        ]);
        if (!invRes.ok) throw new Error("Failed to fetch inventory");
        if (!listRes.ok) throw new Error("Failed to fetch listings");
        const invData = await invRes.json();
        const listData = await listRes.json();
        setItems(Array.isArray(invData) ? invData : invData.items ?? []);
        setListings(Array.isArray(listData) ? listData : listData.listings ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const listingMap = useMemo(() => {
    const map: Record<string, string> = {};
    listings.forEach((l) => (map[l.id] = l.title));
    return map;
  }, [listings]);

  const rooms = useMemo(
    () => [...new Set(items.map((i) => i.room).filter(Boolean))].sort(),
    [items]
  );

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (propertyFilter && item.listingId !== propertyFilter) return false;
      if (roomFilter && item.room !== roomFilter) return false;
      if (conditionFilter && item.condition !== conditionFilter) return false;
      return true;
    });
  }, [items, search, propertyFilter, roomFilter, conditionFilter]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const lowStock = items.filter((i) => i.quantity < i.quantityExpected).length;
    const needsReplacement = items.filter(
      (i) => i.condition === "Poor" || i.condition === "Replace"
    ).length;
    const totalValue = items.reduce(
      (sum, i) => sum + (i.replacementCost || 0) * (i.quantity || 0),
      0
    );
    return { totalItems, lowStock, needsReplacement, totalValue };
  }, [items]);

  const formatCurrency = (val: number) =>
    "$" + val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const formatCost = (val: number | null) =>
    val != null
      ? "$" + val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "--";

  const formatDate = (d: string | null) => {
    if (!d) return "Never";
    try {
      return new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Never";
    }
  };

  function ConditionBadge({ condition }: { condition: string }) {
    let classes = "text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 ";
    switch (condition) {
      case "Good":
        classes += "text-accent bg-emerald-50";
        break;
      case "Fair":
        classes += "text-amber-600 bg-amber-50";
        break;
      case "Poor":
        classes += "text-red-500 bg-red-50";
        break;
      case "Replace":
        classes += "text-red-500 border border-red-200 bg-white";
        break;
      default:
        classes += "text-warm-gray bg-gray-50";
    }
    return <span className={classes}>{condition}</span>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Package className="w-5 h-5 text-warm-gray animate-pulse mr-2" />
        <span className="text-warm-gray text-xs tracking-wide">Loading inventory...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        <span className="text-red-500 text-xs">{error}</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-charcoal font-light">Inventory</h1>
        <button
          onClick={() => alert("Add inventory item coming soon")}
          className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5"
        >
          <Plus className="w-3 h-3" />
          Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Items", value: stats.totalItems.toString(), icon: Package },
          { label: "Low Stock", value: stats.lowStock.toString(), icon: AlertTriangle },
          { label: "Needs Replacement", value: stats.needsReplacement.toString(), icon: Filter },
          { label: "Total Value", value: formatCurrency(stats.totalValue), icon: DollarSign },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-light-gray p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
                {stat.label}
              </span>
              <stat.icon className="w-3.5 h-3.5 text-warm-gray" />
            </div>
            <div className="text-xl font-serif text-charcoal">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-warm-gray" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 pl-9 outline-none focus:border-charcoal/40 transition-colors"
          />
        </div>
        <div className="relative">
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 pr-8 outline-none focus:border-charcoal/40 transition-colors appearance-none min-w-[160px]"
          >
            <option value="">All Properties</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-warm-gray pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 pr-8 outline-none focus:border-charcoal/40 transition-colors appearance-none min-w-[140px]"
          >
            <option value="">All Rooms</option>
            {rooms.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-warm-gray pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 pr-8 outline-none focus:border-charcoal/40 transition-colors appearance-none min-w-[130px]"
          >
            <option value="">All Conditions</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
            <option value="Replace">Replace</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-warm-gray pointer-events-none" />
        </div>
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-light-gray p-5 text-center">
          <Package className="w-5 h-5 text-warm-gray mx-auto mb-2" />
          <p className="text-xs text-warm-gray">No inventory items found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white border border-light-gray p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-medium text-charcoal text-sm">{item.name}</span>
                    <ConditionBadge condition={item.condition} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
                      {listingMap[item.listingId] || "Unknown Property"}
                    </span>
                    <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
                      {item.room}
                    </span>
                    <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="text-center">
                    <div className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">
                      Qty
                    </div>
                    <span
                      className={
                        item.quantity < item.quantityExpected
                          ? "text-red-500 font-medium"
                          : "text-charcoal"
                      }
                    >
                      {item.quantity} / {item.quantityExpected}
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">
                      Cost
                    </div>
                    <span className="text-charcoal">{formatCost(item.replacementCost)}</span>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">
                      Checked
                    </div>
                    <span className="text-charcoal">{formatDate(item.lastChecked)}</span>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">
                      Guest
                    </div>
                    {item.guestVisible ? (
                      <Eye className="w-3.5 h-3.5 text-accent mx-auto" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-warm-gray mx-auto" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      onClick={() => alert("Edit item coming soon")}
                      className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => alert("Check item coming soon")}
                      className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Check
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
