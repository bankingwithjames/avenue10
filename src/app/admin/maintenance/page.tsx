"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Wrench,
  Search,
  Filter,
  ChevronDown,
  Eye,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  Clock,
  Plus,
  Calendar,
} from "lucide-react";

interface MaintenanceLog {
  id: string;
  listingId?: string;
  listing?: { id: string; title: string };
  description: string;
  issueType?: string;
  status: string;
  priority?: string;
  cost?: number;
  vendorId?: string;
  vendor?: { id: string; name: string };
  date?: string;
  createdAt: string;
  completedAt?: string;
}

interface Vendor {
  id: string;
  name: string;
}

interface Listing {
  id: string;
  title: string;
}

function getStatusBadge(status: string) {
  const s = status.toLowerCase().replace(/_/g, " ");
  if (s.includes("open") || s === "new")
    return { classes: "text-red-500 bg-red-50", label: status };
  if (s.includes("scheduled"))
    return { classes: "text-amber-600 bg-amber-50", label: status };
  if (s.includes("progress"))
    return { classes: "text-blue-600 bg-blue-50", label: status };
  if (s.includes("complete"))
    return { classes: "text-accent bg-emerald-50", label: status };
  if (s.includes("cancel"))
    return { classes: "text-warm-gray bg-stone-100", label: status };
  return { classes: "text-warm-gray bg-stone-100", label: status };
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isCurrentMonth(dateStr?: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export default function MaintenancePage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [propertyFilter, setPropertyFilter] = useState("All");

  useEffect(() => {
    async function fetchData() {
      try {
        const [logsRes, vendorsRes, listingsRes] = await Promise.all([
          fetch("/api/admin/maintenance-logs"),
          fetch("/api/admin/vendors"),
          fetch("/api/admin/listings"),
        ]);
        if (!logsRes.ok) throw new Error("Failed to fetch maintenance logs");
        const logsData = await logsRes.json();
        setLogs(Array.isArray(logsData) ? logsData : logsData.data || []);
        if (vendorsRes.ok) {
          const vData = await vendorsRes.json();
          setVendors(Array.isArray(vData) ? vData : vData.data || []);
        }
        if (listingsRes.ok) {
          const lData = await listingsRes.json();
          setListings(Array.isArray(lData) ? lData : lData.data || []);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const vendorMap = useMemo(() => {
    const m = new Map<string, string>();
    vendors.forEach((v) => m.set(v.id, v.name));
    return m;
  }, [vendors]);

  const listingMap = useMemo(() => {
    const m = new Map<string, string>();
    listings.forEach((l) => m.set(l.id, l.title));
    return m;
  }, [listings]);

  const uniqueProperties = useMemo(() => {
    const names = new Set<string>();
    logs.forEach((log) => {
      const name = log.listing?.title || (log.listingId && listingMap.get(log.listingId));
      if (name) names.add(name);
    });
    return Array.from(names).sort();
  }, [logs, listingMap]);

  const getPropertyName = (log: MaintenanceLog) =>
    log.listing?.title || (log.listingId && listingMap.get(log.listingId)) || "—";

  const getVendorName = (log: MaintenanceLog) =>
    log.vendor?.name || (log.vendorId && vendorMap.get(log.vendorId)) || "—";

  const getLogDate = (log: MaintenanceLog) => log.date || log.createdAt;

  const stats = useMemo(() => {
    const open = logs.filter((l) => /open|new/i.test(l.status)).length;
    const inProgress = logs.filter((l) => /progress/i.test(l.status)).length;
    const completedThisMonth = logs.filter(
      (l) => /complete/i.test(l.status) && isCurrentMonth(getLogDate(l))
    ).length;
    const costMTD = logs
      .filter((l) => isCurrentMonth(getLogDate(l)))
      .reduce((sum, l) => sum + (l.cost || 0), 0);
    return { open, inProgress, completedThisMonth, costMTD };
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (statusFilter !== "All") {
        const s = log.status.toLowerCase().replace(/_/g, " ");
        const f = statusFilter.toLowerCase().replace(/_/g, " ");
        if (!s.includes(f)) return false;
      }
      if (priorityFilter !== "All") {
        if (!log.priority || log.priority.toLowerCase() !== priorityFilter.toLowerCase())
          return false;
      }
      if (propertyFilter !== "All") {
        if (getPropertyName(log) !== propertyFilter) return false;
      }
      return true;
    });
  }, [logs, statusFilter, priorityFilter, propertyFilter, listingMap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-5 h-5 text-warm-gray animate-spin" />
        <span className="ml-2 text-sm text-warm-gray">Loading maintenance data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-red-500 text-sm">
        <AlertTriangle className="w-4 h-4 mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-charcoal font-light">Maintenance</h1>
        <button
          onClick={() => alert("Work order form coming soon")}
          className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5"
        >
          <Plus className="w-3 h-3" />
          New Work Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Open Orders", value: stats.open, icon: AlertTriangle },
          { label: "In Progress", value: stats.inProgress, icon: Clock },
          { label: "Completed This Month", value: stats.completedThisMonth, icon: Wrench },
          {
            label: "Total Cost MTD",
            value: `$${stats.costMTD.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
            icon: DollarSign,
          },
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 transition-colors appearance-none"
          >
            {["All", "New", "Scheduled", "In Progress", "Completed", "Cancelled"].map((s) => (
              <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-warm-gray pointer-events-none" />
        </div>
        <div className="relative flex-1">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 transition-colors appearance-none"
          >
            {["All", "Low", "Normal", "High", "Urgent"].map((p) => (
              <option key={p} value={p}>{p === "All" ? "All Priorities" : p}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-warm-gray pointer-events-none" />
        </div>
        <div className="relative flex-1">
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 transition-colors appearance-none"
          >
            <option value="All">All Properties</option>
            {uniqueProperties.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-warm-gray pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-light-gray p-5 text-center">
          <Search className="w-5 h-5 text-warm-gray mx-auto mb-2" />
          <p className="text-sm text-warm-gray">No maintenance records found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => {
            const badge = getStatusBadge(log.status);
            return (
              <div key={log.id} className="bg-white border border-light-gray p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(getLogDate(log))}
                      </span>
                      <span className="text-xs text-charcoal font-medium">{getPropertyName(log)}</span>
                      {log.issueType && (
                        <span className="text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 text-blue-600 bg-blue-50">
                          {log.issueType}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-charcoal/80 mb-1.5">
                      {log.description.length > 100
                        ? log.description.slice(0, 100) + "..."
                        : log.description}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
                        Vendor: {getVendorName(log)}
                      </span>
                      <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
                        Cost: ${(log.cost || 0).toFixed(2)}
                      </span>
                      {log.priority && (
                        <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
                          Priority: {log.priority}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 ${badge.classes}`}
                    >
                      {badge.label}
                    </span>
                    <button
                      onClick={() => alert(`Viewing work order ${log.id}`)}
                      className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                    <button
                      onClick={() => alert(`Update status for work order ${log.id}`)}
                      className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Update Status
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
