"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  BarChart3,
  Percent,
  Moon,
  CreditCard,
  Clock,
  Target,
  Zap,
  Brain,
  MapPin,
  Wallet,
  Receipt,
  LineChart,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Sparkles,
  Building2,
  Star,
  CalendarDays,
  Filter,
  Info,
  Settings,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Plug,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Reservation {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: string;
  listing: { title: string };
}

interface Listing {
  id: string;
  title: string;
  pricePerNight: number;
}

type Tab =
  | "overview"
  | "charts"
  | "sources"
  | "pricing"
  | "ai"
  | "comps"
  | "payouts"
  | "expenses"
  | "forecast"
  | "integrations";

type TimeRange = "month" | "quarter" | "year" | "all" | "custom";

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MONTHLY_REVENUE = [
  { month: "Aug 2025", revenue: 9800, expenses: 4200 },
  { month: "Sep 2025", revenue: 8500, expenses: 3900 },
  { month: "Oct 2025", revenue: 10200, expenses: 4100 },
  { month: "Nov 2025", revenue: 7600, expenses: 3800 },
  { month: "Dec 2025", revenue: 11400, expenses: 4500 },
  { month: "Jan 2026", revenue: 6200, expenses: 3700 },
  { month: "Feb 2026", revenue: 7800, expenses: 3600 },
  { month: "Mar 2026", revenue: 9400, expenses: 4000 },
  { month: "Apr 2026", revenue: 10800, expenses: 4300 },
  { month: "May 2026", revenue: 12100, expenses: 4600 },
  { month: "Jun 2026", revenue: 13500, expenses: 4800 },
  { month: "Jul 2026", revenue: 12450, expenses: 5210 },
];

const BOOKING_SOURCES = [
  { name: "Airbnb", revenue: 5200, bookings: 12, share: 45, color: "#FF5A5F", fee: 3 },
  { name: "VRBO", revenue: 3100, bookings: 7, share: 27, color: "#3B5FC0", fee: 5 },
  { name: "Booking.com", revenue: 1800, bookings: 4, share: 15, color: "#003580", fee: 15 },
  { name: "Direct Website", revenue: 1200, bookings: 3, share: 10, color: "#2D6A4F", fee: 2.9 },
  { name: "Manual/Offline", revenue: 350, bookings: 1, share: 3, color: "#6B7280", fee: 0 },
];

const PAYOUT_ROWS = [
  { date: "2026-07-02", channel: "Airbnb", ref: "ABB-29471", guest: "Sarah M.", expected: 620, actual: 601.40, status: "Matched" as const },
  { date: "2026-07-01", channel: "VRBO", ref: "VRB-18234", guest: "James K.", expected: 485, actual: 460.75, status: "Discrepancy" as const },
  { date: "2026-06-29", channel: "Airbnb", ref: "ABB-29385", guest: "Chen W.", expected: 840, actual: 840, status: "Matched" as const },
  { date: "2026-06-27", channel: "Direct", ref: "DIR-00142", guest: "Amanda L.", expected: 390, actual: 390, status: "Matched" as const },
  { date: "2026-06-25", channel: "Booking.com", ref: "BKG-77291", guest: "Robert F.", expected: 720, actual: null, status: "Pending" as const },
  { date: "2026-06-23", channel: "Airbnb", ref: "ABB-29210", guest: "Maria G.", expected: 555, actual: 538.35, status: "Matched" as const },
  { date: "2026-06-20", channel: "VRBO", ref: "VRB-18102", guest: "David P.", expected: 410, actual: 389.50, status: "Discrepancy" as const },
  { date: "2026-06-18", channel: "Airbnb", ref: "ABB-29088", guest: "Lisa T.", expected: 930, actual: 930, status: "Matched" as const },
  { date: "2026-06-15", channel: "Manual", ref: "MAN-0031", guest: "Kevin R.", expected: 350, actual: 350, status: "Matched" as const },
  { date: "2026-06-12", channel: "Booking.com", ref: "BKG-77105", guest: "Priya S.", expected: 680, actual: 578, status: "Discrepancy" as const },
];

const EXPENSE_CATEGORIES = [
  { name: "Cleaning", amount: 800, icon: "🧹" },
  { name: "Laundry", amount: 200, icon: "👕" },
  { name: "Supplies", amount: 150, icon: "🧴" },
  { name: "Utilities", amount: 350, icon: "💡" },
  { name: "Repairs", amount: 0, icon: "🔧" },
  { name: "Maintenance", amount: 125, icon: "🛠" },
  { name: "Lawn Care", amount: 100, icon: "🌿" },
  { name: "Pest Control", amount: 50, icon: "🐛" },
  { name: "Internet", amount: 80, icon: "📡" },
  { name: "Insurance", amount: 200, icon: "🛡" },
  { name: "Mortgage", amount: 1500, icon: "🏠" },
  { name: "Property Tax", amount: 400, icon: "📋" },
  { name: "Software", amount: 75, icon: "💻" },
  { name: "Payment Processing", amount: 180, icon: "💳" },
];

const AI_RECOMMENDATIONS = [
  {
    dateRange: "Jul 11 - Jul 13",
    currentRate: 185,
    suggestedRate: 245,
    reason: "AT&T Byron Nelson tournament nearby — demand spike expected in DFW area",
    confidence: 92,
    impact: 360,
    risk: "Low" as const,
  },
  {
    dateRange: "Jul 18 - Jul 20",
    currentRate: 185,
    suggestedRate: 210,
    reason: "Weekend demand trending 15% above historical average for mid-July",
    confidence: 85,
    impact: 150,
    risk: "Low" as const,
  },
  {
    dateRange: "Jul 22 - Jul 24",
    currentRate: 185,
    suggestedRate: 155,
    reason: "3-night gap between bookings — reduce rate to fill vacancy",
    confidence: 78,
    impact: -90,
    risk: "Medium" as const,
  },
  {
    dateRange: "Aug 1 - Aug 7",
    currentRate: 185,
    suggestedRate: 225,
    reason: "Back-to-school week historically high demand in DFW suburbs",
    confidence: 70,
    impact: 240,
    risk: "Medium" as const,
  },
];

const COMPETITORS = [
  { name: "Modern Ranch in Southlake", rate: 210, occupancy: 75, rating: 4.9 },
  { name: "Cozy Cottage - Grapevine", rate: 175, occupancy: 80, rating: 4.7 },
  { name: "Lakeside Retreat - DFW", rate: 195, occupancy: 68, rating: 4.8 },
  { name: "Urban Loft - Fort Worth", rate: 160, occupancy: 82, rating: 4.6 },
  { name: "Family Home - Arlington", rate: 190, occupancy: 70, rating: 4.5 },
];

const NEARBY_EVENTS = [
  { name: "AT&T Byron Nelson", dates: "Jul 10 - 13", impact: "High", type: "Sports" },
  { name: "Fort Worth Food + Wine Festival", dates: "Jul 18 - 20", impact: "Medium", type: "Festival" },
  { name: "Texas Rangers Home Series", dates: "Jul 25 - 27", impact: "Medium", type: "Sports" },
  { name: "DFW Auto Show", dates: "Aug 2 - 5", impact: "Low", type: "Convention" },
];

const FORECAST_DATES = [
  { date: "Jul 5", day: "Sat", status: "High Demand" as const },
  { date: "Jul 6", day: "Sun", status: "High Demand" as const },
  { date: "Jul 9", day: "Wed", status: "Needs Promotion" as const },
  { date: "Jul 10", day: "Thu", status: "High Demand" as const },
  { date: "Jul 11", day: "Fri", status: "High Demand" as const },
  { date: "Jul 14", day: "Mon", status: "Low Demand" as const },
  { date: "Jul 15", day: "Tue", status: "Low Demand" as const },
  { date: "Jul 16", day: "Wed", status: "Needs Price Adjustment" as const },
  { date: "Jul 19", day: "Sat", status: "High Demand" as const },
  { date: "Jul 22", day: "Tue", status: "Needs Promotion" as const },
  { date: "Jul 23", day: "Wed", status: "Low Demand" as const },
  { date: "Jul 28", day: "Mon", status: "Needs Price Adjustment" as const },
  { date: "Jul 30", day: "Wed", status: "Needs Promotion" as const },
  { date: "Aug 1", day: "Fri", status: "High Demand" as const },
  { date: "Aug 2", day: "Sat", status: "High Demand" as const },
];

// ─── Shared Components ──────────────────────────────────────────────────────

function Badge({ children, variant }: { children: React.ReactNode; variant: "green" | "yellow" | "red" | "blue" | "gray" | "orange" }) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    gray: "bg-gray-50 text-gray-500 border-gray-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] tracking-[0.1em] uppercase font-medium border ${colors[variant]}`}>
      {children}
    </span>
  );
}

function IntegrationBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] tracking-[0.1em] uppercase font-medium bg-amber-50 text-amber-600 border border-amber-200">
      <AlertCircle size={10} />
      Integration Required
    </span>
  );
}

function ComingSoonBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] tracking-[0.1em] uppercase font-medium bg-gray-50 text-gray-400 border border-gray-200">
      Coming Soon
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-3">
      {children}
    </h3>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border border-light-gray p-5 ${className}`}>{children}</div>;
}

function KPICard({ label, value, sub, icon: Icon, accent = "text-charcoal" }: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-warm-gray" />
        <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-light ${accent}`}>{value}</p>
      {sub && <p className="text-[10px] text-warm-gray mt-1">{sub}</p>}
    </Card>
  );
}

// ─── Tab Content Components ─────────────────────────────────────────────────

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPICard icon={DollarSign} label="Gross Revenue" value="$12,450" accent="text-emerald-600" />
        <KPICard icon={DollarSign} label="Net Revenue" value="$10,890" sub="After platform fees" accent="text-emerald-600" />
        <KPICard icon={TrendingUp} label="Net Profit" value="$7,230" sub="After all expenses" accent="text-accent" />
        <KPICard icon={Percent} label="Occupancy" value="68%" sub="This month" accent="text-blue-600" />
        <KPICard icon={BarChart3} label="ADR" value="$185" sub="Avg Daily Rate" accent="text-purple-600" />
        <KPICard icon={Target} label="RevPAR" value="$126" sub="Rev per available room" accent="text-indigo-600" />
        <KPICard icon={Wallet} label="Upcoming Payouts" value="$3,200" sub="Next 7 days" accent="text-charcoal" />
        <KPICard icon={Clock} label="Pending Payouts" value="$1,850" sub="Awaiting processing" accent="text-amber-600" />
        <KPICard icon={Moon} label="Open Nights" value="10" sub="This month" accent="text-warm-gray" />
        <KPICard icon={CreditCard} label="Avg Payout" value="$485" sub="Per booking" accent="text-charcoal" />
      </div>

      {/* Forecast Row */}
      <div>
        <SectionLabel>Revenue Forecast</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Next 30 Days", value: "$8,500", trend: "+12%" },
            { label: "Next 60 Days", value: "$15,200", trend: "+8%" },
            { label: "Next 90 Days", value: "$22,800", trend: "+5%" },
          ].map((f) => (
            <Card key={f.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">{f.label}</span>
                <span className="flex items-center gap-0.5 text-[10px] text-emerald-600">
                  <ArrowUpRight size={10} />
                  {f.trend}
                </span>
              </div>
              <p className="text-2xl font-light text-charcoal">{f.value}</p>
              <div className="flex items-center gap-1 mt-2">
                <ComingSoonBadge />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Revenue Chart */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Monthly Revenue Trend</SectionLabel>
          <IntegrationBadge />
        </div>
        <div className="flex items-end gap-1 h-40">
          {MONTHLY_REVENUE.map((d) => {
            const maxRev = Math.max(...MONTHLY_REVENUE.map((m) => m.revenue));
            const height = (d.revenue / maxRev) * 100;
            const label = d.month.split(" ")[0].slice(0, 3);
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[8px] text-warm-gray">${(d.revenue / 1000).toFixed(1)}k</span>
                <div
                  className="w-full bg-charcoal/80 hover:bg-charcoal transition-colors min-h-[2px]"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[8px] text-warm-gray">{label}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function RevenueChartsTab() {
  const maxRev = Math.max(...MONTHLY_REVENUE.map((m) => m.revenue));
  const totalYTD = MONTHLY_REVENUE.slice(5).reduce((s, m) => s + m.revenue, 0); // Jan-Jul 2026
  const totalExpYTD = MONTHLY_REVENUE.slice(5).reduce((s, m) => s + m.expenses, 0);

  return (
    <div className="space-y-6">
      {/* Monthly Revenue */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Monthly Revenue (Last 12 Months)</SectionLabel>
          <IntegrationBadge />
        </div>
        <div className="flex items-end gap-1.5 h-48">
          {MONTHLY_REVENUE.map((d) => {
            const height = (d.revenue / maxRev) * 100;
            const label = d.month.split(" ")[0].slice(0, 3);
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[8px] text-warm-gray">${(d.revenue / 1000).toFixed(1)}k</span>
                <div
                  className="w-full bg-charcoal/80 hover:bg-charcoal transition-colors min-h-[2px]"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[8px] text-warm-gray">{label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Revenue by Channel */}
      <Card>
        <SectionLabel>Revenue by Booking Channel</SectionLabel>
        <div className="space-y-3">
          {BOOKING_SOURCES.map((s) => (
            <div key={s.name}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-charcoal">{s.name}</span>
                <span className="text-xs text-charcoal font-medium">${s.revenue.toLocaleString()} ({s.share}%)</span>
              </div>
              <div className="w-full h-5 bg-cream">
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${s.share}%`, backgroundColor: s.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Gross vs Net */}
      <Card>
        <SectionLabel>Gross Revenue vs Net Profit</SectionLabel>
        <div className="flex items-end gap-2 h-48">
          {MONTHLY_REVENUE.map((d) => {
            const grossH = (d.revenue / maxRev) * 100;
            const netProfit = d.revenue - d.expenses;
            const netH = (netProfit / maxRev) * 100;
            const label = d.month.split(" ")[0].slice(0, 3);
            return (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex gap-px w-full items-end" style={{ height: "160px" }}>
                  <div className="flex-1 flex flex-col justify-end h-full">
                    <div
                      className="w-full bg-charcoal/70"
                      style={{ height: `${grossH}%` }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-end h-full">
                    <div
                      className="w-full bg-emerald-500/70"
                      style={{ height: `${Math.max(netH, 1)}%` }}
                    />
                  </div>
                </div>
                <span className="text-[8px] text-warm-gray">{label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-charcoal/70" />
            <span className="text-[9px] text-warm-gray">Gross Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-emerald-500/70" />
            <span className="text-[9px] text-warm-gray">Net Profit</span>
          </div>
        </div>
      </Card>

      {/* YTD Summary */}
      <Card>
        <SectionLabel>Year-to-Date Summary (2026)</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">Gross Revenue</p>
            <p className="text-xl font-light text-charcoal">${totalYTD.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">Total Expenses</p>
            <p className="text-xl font-light text-charcoal">${totalExpYTD.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">Net Profit</p>
            <p className="text-xl font-light text-emerald-600">${(totalYTD - totalExpYTD).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">Profit Margin</p>
            <p className="text-xl font-light text-charcoal">{Math.round(((totalYTD - totalExpYTD) / totalYTD) * 100)}%</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function BookingSourcesTab() {
  const totalRevenue = BOOKING_SOURCES.reduce((s, b) => s + b.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Source Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {BOOKING_SOURCES.map((s) => (
          <Card key={s.name}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">{s.name}</span>
            </div>
            <p className="text-xl font-light text-charcoal">${s.revenue.toLocaleString()}</p>
            <div className="mt-2 space-y-1">
              <p className="text-[10px] text-warm-gray">{s.bookings} bookings</p>
              <p className="text-[10px] text-warm-gray">{s.share}% of revenue</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Channel Mix */}
      <Card>
        <SectionLabel>Channel Mix</SectionLabel>
        <div className="w-full h-8 flex overflow-hidden">
          {BOOKING_SOURCES.map((s) => (
            <div
              key={s.name}
              className="h-full flex items-center justify-center text-white text-[9px] font-medium"
              style={{ width: `${s.share}%`, backgroundColor: s.color }}
              title={`${s.name}: ${s.share}%`}
            >
              {s.share >= 10 ? `${s.share}%` : ""}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {BOOKING_SOURCES.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[10px] text-warm-gray">{s.name}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Average Payout by Channel */}
      <Card>
        <SectionLabel>Average Payout by Channel</SectionLabel>
        <div className="space-y-3">
          {BOOKING_SOURCES.map((s) => {
            const avgPayout = Math.round(s.revenue / s.bookings);
            const maxPayout = Math.max(...BOOKING_SOURCES.map((b) => b.revenue / b.bookings));
            return (
              <div key={s.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-charcoal">{s.name}</span>
                  <span className="text-xs text-charcoal font-medium">${avgPayout}</span>
                </div>
                <div className="w-full h-3 bg-cream">
                  <div
                    className="h-full"
                    style={{ width: `${(avgPayout / maxPayout) * 100}%`, backgroundColor: s.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Platform Fee Comparison */}
      <Card>
        <SectionLabel>Platform Fee Comparison</SectionLabel>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-light-gray">
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Platform</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Host Fee</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Revenue</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Fees Paid</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Net Revenue</th>
              </tr>
            </thead>
            <tbody>
              {BOOKING_SOURCES.map((s) => {
                const fees = Math.round(s.revenue * (s.fee / 100));
                return (
                  <tr key={s.name} className="border-b border-light-gray last:border-0">
                    <td className="py-2.5 text-xs text-charcoal">{s.name}</td>
                    <td className="py-2.5 text-xs text-charcoal">{s.fee}%</td>
                    <td className="py-2.5 text-xs text-charcoal">${s.revenue.toLocaleString()}</td>
                    <td className="py-2.5 text-xs text-red-500">${fees.toLocaleString()}</td>
                    <td className="py-2.5 text-xs text-emerald-600 font-medium">${(s.revenue - fees).toLocaleString()}</td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-charcoal/20">
                <td className="py-2.5 text-xs text-charcoal font-medium">Total</td>
                <td className="py-2.5 text-xs text-charcoal">—</td>
                <td className="py-2.5 text-xs text-charcoal font-medium">${totalRevenue.toLocaleString()}</td>
                <td className="py-2.5 text-xs text-red-500 font-medium">
                  ${BOOKING_SOURCES.reduce((s, b) => s + Math.round(b.revenue * (b.fee / 100)), 0).toLocaleString()}
                </td>
                <td className="py-2.5 text-xs text-emerald-600 font-medium">
                  ${BOOKING_SOURCES.reduce((s, b) => s + b.revenue - Math.round(b.revenue * (b.fee / 100)), 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function DynamicPricingTab() {
  const today = new Date(2026, 6, 4); // Jul 4, 2026
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const isWeekend = d.getDay() === 0 || d.getDay() === 5 || d.getDay() === 6;
    const baseRate = 185;
    const currentRate = isWeekend ? Math.round(baseRate * 1.2) : baseRate;
    const suggested = currentRate + Math.round((Math.random() - 0.3) * 30);
    const occupied = Math.random() > 0.32;
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      day: dayName,
      currentRate,
      suggestedRate: suggested,
      occupied,
    };
  });

  const pricingSettings = [
    { label: "Base Rate", value: "$185" },
    { label: "Min Rate", value: "$120" },
    { label: "Max Rate", value: "$350" },
    { label: "Weekend Premium", value: "20%" },
    { label: "Holiday Premium", value: "35%" },
    { label: "Last-Minute Discount", value: "15%" },
    { label: "Gap Night Discount", value: "10%" },
    { label: "Far-Out Premium", value: "8%" },
  ];

  const priceRules = [
    { rule: "Weekend (Fri-Sun)", adjustment: "+20%", status: "Active" },
    { rule: "Holiday / Major Event", adjustment: "+35%", status: "Active" },
    { rule: "Last 3 Days Before Check-in", adjustment: "-15%", status: "Active" },
    { rule: "Gap Night (1-2 night gap)", adjustment: "-10%", status: "Active" },
    { rule: "30+ Days Out", adjustment: "+8%", status: "Active" },
    { rule: "Low Season (Jan-Feb)", adjustment: "-12%", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      {/* Calendar Grid */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>30-Day Rate Calendar</SectionLabel>
          <IntegrationBadge />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-light-gray">
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Date</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Day</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Current Rate</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Suggested</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Status</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Occupancy</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d, i) => (
                <tr key={i} className="border-b border-light-gray last:border-0 hover:bg-cream/50">
                  <td className="py-1.5 text-xs text-charcoal">{d.date}</td>
                  <td className="py-1.5 text-xs text-warm-gray">{d.day}</td>
                  <td className="py-1.5 text-xs text-charcoal">${d.currentRate}</td>
                  <td className={`py-1.5 text-xs font-medium ${d.suggestedRate > d.currentRate ? "text-emerald-600" : d.suggestedRate < d.currentRate ? "text-red-500" : "text-charcoal"}`}>
                    ${d.suggestedRate}
                    {d.suggestedRate !== d.currentRate && (
                      <span className="ml-1 text-[9px]">
                        ({d.suggestedRate > d.currentRate ? "+" : ""}{d.suggestedRate - d.currentRate})
                      </span>
                    )}
                  </td>
                  <td className="py-1.5">
                    {d.occupied ? (
                      <Badge variant="green">Booked</Badge>
                    ) : (
                      <Badge variant="gray">Open</Badge>
                    )}
                  </td>
                  <td className="py-1.5">
                    <div className={`w-3 h-3 rounded-full ${d.occupied ? "bg-emerald-400" : "bg-gray-200"}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>Pricing Settings</SectionLabel>
            <ComingSoonBadge />
          </div>
          <div className="space-y-3">
            {pricingSettings.map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs text-charcoal">{s.label}</span>
                <input
                  type="text"
                  value={s.value}
                  disabled
                  className="w-24 text-right text-xs bg-cream border border-light-gray px-2 py-1.5 text-warm-gray cursor-not-allowed"
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => alert("Connect a pricing tool like PriceLabs or Wheelhouse from the Integrations tab to enable editing.")}
            className="mt-3 w-full flex items-center justify-center gap-1.5 bg-cream border border-light-gray px-4 py-2 text-[10px] tracking-[0.1em] uppercase font-medium text-warm-gray hover:text-charcoal hover:border-charcoal/30 transition"
          >
            <Plug size={10} />
            Connect a pricing tool to enable
          </button>
          <div className="mt-4">
            <SectionLabel>Minimum Stay Rules</SectionLabel>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-charcoal">Weekday Minimum</span>
                <span className="text-warm-gray">2 nights</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-charcoal">Weekend Minimum</span>
                <span className="text-warm-gray">2 nights</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-charcoal">Holiday Minimum</span>
                <span className="text-warm-gray">3 nights</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Price Rules */}
        <Card>
          <SectionLabel>Active Price Rules</SectionLabel>
          <div className="space-y-2">
            {priceRules.map((r) => (
              <div key={r.rule} className="flex items-center justify-between py-2 border-b border-light-gray last:border-0">
                <span className="text-xs text-charcoal">{r.rule}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${r.adjustment.startsWith("+") ? "text-emerald-600" : "text-red-500"}`}>
                    {r.adjustment}
                  </span>
                  <Badge variant="green">{r.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function AIPricingTab() {
  const factors = [
    "Current Occupancy",
    "Nearby Events",
    "Booking Pace",
    "Open Gaps",
    "Competitor Rates",
    "Historical Revenue",
    "Day of Week",
    "Seasonality",
    "Lead Time",
    "Current ADR",
  ];

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="flex items-center gap-3">
        <Badge variant="yellow">AI Pricing is in Approval-Only Mode</Badge>
        <IntegrationBadge />
      </div>

      {/* Recommendation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {AI_RECOMMENDATIONS.map((rec, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-purple-500" />
                <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
                  AI Recommendation
                </span>
              </div>
              <Badge variant={rec.risk === "Low" ? "green" : rec.risk === "Medium" ? "yellow" : "red"}>
                {rec.risk} Risk
              </Badge>
            </div>
            <p className="text-xs text-charcoal font-medium mb-2">{rec.dateRange}</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">Current Rate</p>
                <p className="text-lg font-light text-charcoal">${rec.currentRate}</p>
              </div>
              <div>
                <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">Suggested Rate</p>
                <p className={`text-lg font-light ${rec.suggestedRate > rec.currentRate ? "text-emerald-600" : "text-red-500"}`}>
                  ${rec.suggestedRate}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-warm-gray mb-3">{rec.reason}</p>
            <div className="flex items-center gap-4 mb-4">
              <div>
                <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Confidence</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-20 h-1.5 bg-cream">
                    <div className="h-full bg-purple-500" style={{ width: `${rec.confidence}%` }} />
                  </div>
                  <span className="text-[10px] text-charcoal">{rec.confidence}%</span>
                </div>
              </div>
              <div>
                <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Revenue Impact</span>
                <p className={`text-xs font-medium mt-0.5 ${rec.impact > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {rec.impact > 0 ? "+" : ""}${rec.impact}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90 transition" onClick={() => alert("AI pricing approved. Rate will be updated when integration is connected.")}>
                <ThumbsUp size={10} />
                Approve
              </button>
              <button className="flex items-center gap-1.5 bg-white text-charcoal border border-light-gray px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition" onClick={() => alert("AI pricing recommendation rejected.")}>
                <ThumbsDown size={10} />
                Reject
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* AI Factors */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Brain size={14} className="text-purple-500" />
          <SectionLabel>Factors Considered by AI</SectionLabel>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {factors.map((f) => (
            <div key={f} className="flex items-center gap-2 py-2 px-3 bg-cream border border-light-gray">
              <CheckCircle size={12} className="text-emerald-500 shrink-0" />
              <span className="text-[10px] text-charcoal">{f}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MarketCompsTab() {
  const myADR = 185;
  const myOccupancy = 68;
  const marketADR = 195;
  const marketOccupancy = 72;
  const marketRevPAR = 140;

  return (
    <div className="space-y-6">
      {/* Integration Banner */}
      <div className="bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
        <ExternalLink size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-charcoal font-medium mb-1">Connect to Market Data</p>
          <p className="text-[10px] text-warm-gray">
            Connect to AirDNA, PriceLabs, or Wheelhouse for live market data, competitor tracking, and automated rate suggestions.
          </p>
        </div>
      </div>

      {/* Local Market Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KPICard icon={BarChart3} label="Market ADR" value={`$${marketADR}`} accent="text-charcoal" sub="DFW Metro Area" />
        <KPICard icon={Percent} label="Market Occupancy" value={`${marketOccupancy}%`} accent="text-charcoal" sub="DFW Metro Area" />
        <KPICard icon={Target} label="Market RevPAR" value={`$${marketRevPAR}`} accent="text-charcoal" sub="DFW Metro Area" />
      </div>

      {/* My Property vs Market */}
      <Card>
        <SectionLabel>Your Property vs Market Average</SectionLabel>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-charcoal">ADR</span>
              <span className="text-xs text-warm-gray">You: ${myADR} | Market: ${marketADR}</span>
            </div>
            <div className="relative h-6 bg-cream">
              <div className="absolute inset-y-0 left-0 bg-charcoal/70 flex items-center justify-end pr-2" style={{ width: `${(myADR / marketADR) * 80}%` }}>
                <span className="text-[9px] text-white font-medium">${myADR}</span>
              </div>
              <div className="absolute top-0 h-full border-r-2 border-red-400 border-dashed" style={{ left: "80%" }} />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-warm-gray">Market: ${marketADR}</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-charcoal">Occupancy</span>
              <span className="text-xs text-warm-gray">You: {myOccupancy}% | Market: {marketOccupancy}%</span>
            </div>
            <div className="relative h-6 bg-cream">
              <div className="absolute inset-y-0 left-0 bg-blue-500/70 flex items-center justify-end pr-2" style={{ width: `${myOccupancy}%` }}>
                <span className="text-[9px] text-white font-medium">{myOccupancy}%</span>
              </div>
              <div className="absolute top-0 h-full border-r-2 border-red-400 border-dashed" style={{ left: `${marketOccupancy}%` }} />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-warm-gray">Market: {marketOccupancy}%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Competitor Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Comparable Properties</SectionLabel>
          <IntegrationBadge />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead>
              <tr className="border-b border-light-gray">
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Property</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Nightly Rate</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Occupancy</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Rating</th>
              </tr>
            </thead>
            <tbody>
              {COMPETITORS.map((c) => (
                <tr key={c.name} className="border-b border-light-gray last:border-0 hover:bg-cream/50">
                  <td className="py-2.5 text-xs text-charcoal flex items-center gap-1.5">
                    <Building2 size={12} className="text-warm-gray" />
                    {c.name}
                  </td>
                  <td className="py-2.5 text-xs text-charcoal">${c.rate}</td>
                  <td className="py-2.5 text-xs text-charcoal">{c.occupancy}%</td>
                  <td className="py-2.5 text-xs text-charcoal flex items-center gap-1">
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                    {c.rating}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Nearby Events */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays size={14} className="text-warm-gray" />
          <SectionLabel>Nearby Events</SectionLabel>
        </div>
        <div className="space-y-2">
          {NEARBY_EVENTS.map((e) => (
            <div key={e.name} className="flex items-center justify-between py-2 border-b border-light-gray last:border-0">
              <div>
                <p className="text-xs text-charcoal font-medium">{e.name}</p>
                <p className="text-[10px] text-warm-gray">{e.dates}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="gray">{e.type}</Badge>
                <Badge variant={e.impact === "High" ? "red" : e.impact === "Medium" ? "yellow" : "blue"}>
                  {e.impact} Impact
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PayoutsTab() {
  const totalExpected = PAYOUT_ROWS.reduce((s, r) => s + r.expected, 0);
  const totalActual = PAYOUT_ROWS.reduce((s, r) => s + (r.actual || 0), 0);
  const pendingCount = PAYOUT_ROWS.filter((r) => r.status === "Pending").length;
  const discrepancyCount = PAYOUT_ROWS.filter((r) => r.status === "Discrepancy").length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={DollarSign} label="Expected" value={`$${totalExpected.toLocaleString()}`} accent="text-charcoal" />
        <KPICard icon={CheckCircle} label="Received" value={`$${totalActual.toLocaleString()}`} accent="text-emerald-600" />
        <KPICard icon={Clock} label="Pending" value={`$${PAYOUT_ROWS.filter((r) => r.status === "Pending").reduce((s, r) => s + r.expected, 0).toLocaleString()}`} accent="text-amber-600" />
        <KPICard
          icon={AlertCircle}
          label="Difference"
          value={`-$${(totalExpected - totalActual).toLocaleString()}`}
          accent="text-red-500"
          sub={`${discrepancyCount} discrepancies, ${pendingCount} pending`}
        />
      </div>

      {/* Filters (display only) */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-light-gray text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium">
          <Filter size={10} />
          All Channels
          <ChevronDown size={10} />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-light-gray text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium">
          <Filter size={10} />
          All Statuses
          <ChevronDown size={10} />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-light-gray text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium">
          <Calendar size={10} />
          Last 30 Days
          <ChevronDown size={10} />
        </div>
      </div>

      {/* Reconciliation Table */}
      <Card>
        <SectionLabel>Payout Reconciliation</SectionLabel>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-light-gray">
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Date</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Channel</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Booking Ref</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Guest</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2 text-right">Expected</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2 text-right">Actual</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2 text-right">Diff</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {PAYOUT_ROWS.map((r, i) => {
                const diff = r.actual !== null ? r.actual - r.expected : null;
                return (
                  <tr key={i} className="border-b border-light-gray last:border-0 hover:bg-cream/50">
                    <td className="py-2 text-xs text-charcoal">{r.date}</td>
                    <td className="py-2 text-xs text-charcoal">{r.channel}</td>
                    <td className="py-2 text-[10px] text-warm-gray font-mono">{r.ref}</td>
                    <td className="py-2 text-xs text-charcoal">{r.guest}</td>
                    <td className="py-2 text-xs text-charcoal text-right">${r.expected.toFixed(2)}</td>
                    <td className="py-2 text-xs text-charcoal text-right">{r.actual !== null ? `$${r.actual.toFixed(2)}` : "—"}</td>
                    <td className={`py-2 text-xs text-right font-medium ${diff === null ? "text-warm-gray" : diff < 0 ? "text-red-500" : diff === 0 ? "text-emerald-600" : "text-charcoal"}`}>
                      {diff !== null ? (diff === 0 ? "$0.00" : `-$${Math.abs(diff).toFixed(2)}`) : "—"}
                    </td>
                    <td className="py-2">
                      <Badge variant={r.status === "Matched" ? "green" : r.status === "Pending" ? "yellow" : "red"}>
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Fee Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Cleaning Fees Collected", value: "$1,620", icon: Receipt },
          { label: "Platform Fees Paid", value: "$485", icon: CreditCard },
          { label: "Taxes Collected", value: "$1,120", icon: Receipt },
          { label: "Refunds Issued", value: "$240", icon: ArrowDownRight },
        ].map((item) => (
          <Card key={item.label}>
            <div className="flex items-center gap-2 mb-2">
              <item.icon size={12} className="text-warm-gray" />
              <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">{item.label}</span>
            </div>
            <p className="text-lg font-light text-charcoal">{item.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ExpensesPLTab() {
  const [subTab, setSubTab] = useState("overview");
  const [expandedBooking, setExpandedBooking] = useState<number>(0);

  const subTabs = [
    { id: "overview", label: "Overview" },
    { id: "all-expenses", label: "All Expenses" },
    { id: "booking-costs", label: "Booking Costs" },
    { id: "recurring-bills", label: "Recurring Bills" },
    { id: "inventory", label: "Inventory" },
    { id: "inventory-usage", label: "Inventory Usage" },
    { id: "replacement-reserve", label: "Replacement Reserve" },
    { id: "weekly-summary", label: "Weekly Summary" },
    { id: "monthly-pl", label: "Monthly P&L" },
    { id: "reports", label: "Reports" },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-1.5 min-w-max pb-1">
          {subTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase font-medium whitespace-nowrap transition-colors ${
                subTab === t.id
                  ? "bg-charcoal text-white"
                  : "bg-cream border border-light-gray text-warm-gray hover:text-charcoal"
              }`}
              style={{ borderRadius: "9999px" }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ──── OVERVIEW ──── */}
      {subTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Gross Revenue", value: "$12,450", accent: "text-emerald-600", icon: DollarSign },
              { label: "Platform Fees", value: "-$1,560", accent: "text-red-500", icon: CreditCard },
              { label: "Net Revenue", value: "$10,890", accent: "text-charcoal", icon: TrendingUp },
              { label: "Total Operating Expenses", value: "-$5,210", accent: "text-red-500", icon: Receipt },
              { label: "Fixed Expenses", value: "$3,430", accent: "text-charcoal", icon: Building2 },
              { label: "Variable Expenses", value: "$1,780", accent: "text-charcoal", icon: BarChart3 },
              { label: "Inventory Purchased", value: "$485", accent: "text-charcoal", icon: Wallet },
              { label: "Inventory Used", value: "$340", accent: "text-charcoal", icon: Receipt },
              { label: "Remaining Inventory Value", value: "$1,240", accent: "text-charcoal", icon: Shield },
              { label: "Replacement Reserve Needed", value: "$680", accent: "text-amber-600", icon: AlertCircle },
              { label: "Net Profit", value: "$7,230", accent: "text-emerald-600 font-medium", icon: TrendingUp },
              { label: "Profit Margin", value: "58.1%", accent: "text-emerald-600", icon: Percent },
              { label: "Cost Per Occupied Night", value: "$74.43", accent: "text-charcoal", icon: Moon },
              { label: "Cost Per Booking", value: "$189.62", accent: "text-charcoal", icon: Target },
              { label: "Cleaning Cost Per Stay", value: "$95", accent: "text-charcoal", icon: Sparkles },
              { label: "Supplies Cost Per Stay", value: "$22.50", accent: "text-charcoal", icon: Receipt },
            ].map((kpi) => (
              <KPICard key={kpi.label} icon={kpi.icon} label={kpi.label} value={kpi.value} accent={kpi.accent} />
            ))}
          </div>

          {/* Monthly Comparison */}
          <SectionLabel>Monthly Comparison</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { month: "May 2026", revenue: 11200, expenses: 4850, net: 6350 },
              { month: "Jun 2026", revenue: 13100, expenses: 5420, net: 7680 },
              { month: "Jul 2026", revenue: 12450, expenses: 5210, net: 7240 },
            ].map((m) => (
              <Card key={m.month}>
                <SectionLabel>{m.month}</SectionLabel>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[10px] text-warm-gray">Revenue</span>
                    <span className="text-xs text-charcoal">${m.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-warm-gray">Expenses</span>
                    <span className="text-xs text-red-500">-${m.expenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-light-gray">
                    <span className="text-[10px] text-charcoal font-medium">Net Profit</span>
                    <span className="text-sm font-medium text-emerald-600">${m.net.toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ──── ALL EXPENSES ──── */}
      {subTab === "all-expenses" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <SectionLabel>All Expenses</SectionLabel>
            <button onClick={() => alert("Feature coming soon — connect expense tracking to enable.")} className="bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90 transition">Add Expense</button>
          </div>
          {/* Filter row */}
          <div className="flex flex-wrap gap-2">
            {["Property", "Category", "Date Range", "Status"].map((f) => (
              <div key={f} className="flex items-center gap-1 px-3 py-1.5 bg-cream border border-light-gray text-[10px] text-warm-gray">
                <Filter size={10} />
                <span>{f}</span>
                <ChevronDown size={10} />
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-light-gray">
                  {["Date", "Category", "Subcategory", "Vendor", "Amount", "Payment", "Status", "Frequency", "Booking"].map((h) => (
                    <th key={h} className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2 px-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { date: "Jul 3", cat: "Cleaning", sub: "Deep Clean", vendor: "Maria's Cleaning Co", amount: 150, payment: "Zelle", status: "Paid", freq: "Per Stay", booking: "BK-1042" },
                  { date: "Jul 3", cat: "Laundry", sub: "Linens", vendor: "Fresh Fold Laundry", amount: 45, payment: "Card", status: "Paid", freq: "Per Stay", booking: "BK-1042" },
                  { date: "Jul 2", cat: "Supplies", sub: "Toiletries", vendor: "Amazon", amount: 62, payment: "Card", status: "Paid", freq: "Monthly", booking: "-" },
                  { date: "Jul 1", cat: "Utilities", sub: "Electricity", vendor: "Oncor/TXU", amount: 180, payment: "Auto-Pay", status: "Paid", freq: "Monthly", booking: "-" },
                  { date: "Jul 1", cat: "Utilities", sub: "Water", vendor: "City of Arlington", amount: 85, payment: "Auto-Pay", status: "Paid", freq: "Monthly", booking: "-" },
                  { date: "Jul 1", cat: "Utilities", sub: "Gas", vendor: "Atmos Energy", amount: 45, payment: "Auto-Pay", status: "Paid", freq: "Monthly", booking: "-" },
                  { date: "Jul 1", cat: "Utilities", sub: "Internet", vendor: "AT&T Fiber", amount: 80, payment: "Auto-Pay", status: "Paid", freq: "Monthly", booking: "-" },
                  { date: "Jul 1", cat: "Insurance", sub: "STR Policy", vendor: "Proper Insurance", amount: 200, payment: "Auto-Pay", status: "Paid", freq: "Monthly", booking: "-" },
                  { date: "Jul 1", cat: "Mortgage", sub: "Principal + Interest", vendor: "Wells Fargo", amount: 1500, payment: "Auto-Pay", status: "Paid", freq: "Monthly", booking: "-" },
                  { date: "Jun 30", cat: "Cleaning", sub: "Turnover Clean", vendor: "Maria's Cleaning Co", amount: 95, payment: "Zelle", status: "Paid", freq: "Per Stay", booking: "BK-1041" },
                  { date: "Jun 28", cat: "Repairs", sub: "Plumbing", vendor: "DFW Plumbing Pros", amount: 275, payment: "Check", status: "Paid", freq: "One-time", booking: "-" },
                  { date: "Jun 25", cat: "Supplies", sub: "Kitchen", vendor: "Costco", amount: 48, payment: "Card", status: "Paid", freq: "As Needed", booking: "-" },
                  { date: "Jun 22", cat: "Lawn Care", sub: "Mowing", vendor: "Green Lawns DFW", amount: 100, payment: "Venmo", status: "Paid", freq: "Bi-weekly", booking: "-" },
                  { date: "Jun 20", cat: "Software", sub: "PMS", vendor: "Hospitable", amount: 25, payment: "Card", status: "Paid", freq: "Monthly", booking: "-" },
                  { date: "Jun 18", cat: "Supplies", sub: "Cleaning", vendor: "Home Depot", amount: 34, payment: "Card", status: "Paid", freq: "As Needed", booking: "-" },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-light-gray hover:bg-cream/50">
                    <td className="text-[10px] text-charcoal py-2 px-2 whitespace-nowrap">{row.date}</td>
                    <td className="text-[10px] text-charcoal py-2 px-2">{row.cat}</td>
                    <td className="text-[10px] text-warm-gray py-2 px-2">{row.sub}</td>
                    <td className="text-[10px] text-charcoal py-2 px-2">{row.vendor}</td>
                    <td className="text-[10px] text-red-500 py-2 px-2 font-medium">${row.amount}</td>
                    <td className="text-[10px] text-warm-gray py-2 px-2">{row.payment}</td>
                    <td className="py-2 px-2"><Badge variant={row.status === "Paid" ? "green" : row.status === "Due" ? "yellow" : "red"}>{row.status}</Badge></td>
                    <td className="text-[10px] text-warm-gray py-2 px-2">{row.freq}</td>
                    <td className="text-[10px] text-charcoal py-2 px-2">{row.booking}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──── BOOKING COSTS ──── */}
      {subTab === "booking-costs" && (
        <div className="space-y-4">
          <SectionLabel>Booking Profit & Loss</SectionLabel>
          {[
            { guest: "Sarah Mitchell", dates: "Jul 1-4", property: "Modern Ranch in Arlington", nights: 3, nightlyRate: 185, cleaningCollected: 125, platformFee: 83, processing: 18, cleanerCost: 150, laundry: 45, supplies: 22, inventoryUsed: 15, utilities: 54, fixedCosts: 120 },
            { guest: "James & Kim Park", dates: "Jun 27-Jul 1", property: "Modern Ranch in Arlington", nights: 4, nightlyRate: 175, cleaningCollected: 125, platformFee: 105, processing: 23, cleanerCost: 95, laundry: 45, supplies: 18, inventoryUsed: 12, utilities: 72, fixedCosts: 160 },
            { guest: "Carlos Rodriguez", dates: "Jun 22-26", property: "Modern Ranch in Arlington", nights: 4, nightlyRate: 195, cleaningCollected: 125, platformFee: 117, processing: 25, cleanerCost: 95, laundry: 45, supplies: 25, inventoryUsed: 18, utilities: 72, fixedCosts: 160 },
            { guest: "Emily Watson", dates: "Jun 18-21", property: "Modern Ranch in Arlington", nights: 3, nightlyRate: 170, cleaningCollected: 125, platformFee: 77, processing: 16, cleanerCost: 95, laundry: 45, supplies: 20, inventoryUsed: 10, utilities: 54, fixedCosts: 120 },
            { guest: "The Nguyen Family", dates: "Jun 13-17", property: "Modern Ranch in Arlington", nights: 4, nightlyRate: 190, cleaningCollected: 125, platformFee: 114, processing: 24, cleanerCost: 150, laundry: 55, supplies: 28, inventoryUsed: 20, utilities: 72, fixedCosts: 160 },
          ].map((b, idx) => {
            const totalRevenue = b.nights * b.nightlyRate + b.cleaningCollected;
            const totalExpenses = b.platformFee + b.processing + b.cleanerCost + b.laundry + b.supplies + b.inventoryUsed + b.utilities + b.fixedCosts;
            const netProfit = totalRevenue - totalExpenses;
            const margin = ((netProfit / totalRevenue) * 100).toFixed(1);
            const isExpanded = expandedBooking === idx;
            return (
              <Card key={idx}>
                <button className="w-full flex justify-between items-center" onClick={() => setExpandedBooking(isExpanded ? -1 : idx)}>
                  <div className="text-left">
                    <p className="text-xs text-charcoal font-medium">{b.guest}</p>
                    <p className="text-[10px] text-warm-gray">{b.dates} &middot; {b.property}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>${netProfit}</span>
                    <ChevronDown size={14} className={`text-warm-gray transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-light-gray grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Revenue</span>
                      <div className="mt-2 space-y-1.5">
                        <div className="flex justify-between"><span className="text-[10px] text-charcoal">Nightly Revenue ({b.nights} x ${b.nightlyRate})</span><span className="text-[10px] text-charcoal">${b.nights * b.nightlyRate}</span></div>
                        <div className="flex justify-between"><span className="text-[10px] text-charcoal">Cleaning Fee Collected</span><span className="text-[10px] text-charcoal">${b.cleaningCollected}</span></div>
                        <div className="flex justify-between pt-1.5 border-t border-light-gray"><span className="text-[10px] text-charcoal font-medium">Total Revenue</span><span className="text-[10px] text-charcoal font-medium">${totalRevenue}</span></div>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Expenses</span>
                      <div className="mt-2 space-y-1.5">
                        {[
                          ["Platform Fee", b.platformFee],
                          ["Payment Processing", b.processing],
                          ["Cleaner Cost", b.cleanerCost],
                          ["Laundry", b.laundry],
                          ["Supplies Used", b.supplies],
                          ["Inventory Used", b.inventoryUsed],
                          ["Allocated Utilities", b.utilities],
                          ["Allocated Fixed Costs", b.fixedCosts],
                        ].map(([name, val]) => (
                          <div key={name as string} className="flex justify-between"><span className="text-[10px] text-warm-gray">{name}</span><span className="text-[10px] text-red-500">-${val}</span></div>
                        ))}
                        <div className="flex justify-between pt-1.5 border-t border-light-gray"><span className="text-[10px] text-charcoal font-medium">Total Expenses</span><span className="text-[10px] text-red-500 font-medium">-${totalExpenses}</span></div>
                      </div>
                    </div>
                    <div className="sm:col-span-2 bg-cream px-4 py-3 flex justify-between items-center">
                      <div className="flex gap-6">
                        <div><span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block">Net Booking Profit</span><span className={`text-lg font-light ${netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>${netProfit}</span></div>
                        <div><span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block">Profit Margin</span><span className={`text-lg font-light ${Number(margin) >= 40 ? "text-emerald-600" : "text-amber-600"}`}>{margin}%</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ──── RECURRING BILLS ──── */}
      {subTab === "recurring-bills" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <SectionLabel>Recurring Bills</SectionLabel>
            <button onClick={() => alert("Feature coming soon — connect expense tracking to enable.")} className="bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90 transition">Add Bill</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-light-gray">
                  {["Name", "Provider", "Amount", "Frequency", "Due Date", "Status", "Auto-Pay"].map((h) => (
                    <th key={h} className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2 px-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Mortgage", provider: "Wells Fargo", amount: 1500, freq: "Monthly", due: "1st", status: "Paid", auto: true },
                  { name: "Water", provider: "City of Arlington", amount: 85, freq: "Monthly", due: "15th", status: "Paid", auto: true },
                  { name: "Electricity", provider: "Oncor/TXU", amount: 180, freq: "Monthly", due: "10th", status: "Paid", auto: true },
                  { name: "Gas", provider: "Atmos Energy", amount: 45, freq: "Monthly", due: "12th", status: "Paid", auto: true },
                  { name: "Internet", provider: "AT&T Fiber", amount: 80, freq: "Monthly", due: "5th", status: "Paid", auto: true },
                  { name: "Insurance", provider: "Proper Insurance", amount: 200, freq: "Monthly", due: "1st", status: "Paid", auto: true },
                  { name: "Property Tax", provider: "Tarrant County", amount: 400, freq: "Monthly", due: "1st", status: "Paid", auto: false },
                  { name: "Trash", provider: "Republic Services", amount: 35, freq: "Monthly", due: "20th", status: "Due", auto: false },
                  { name: "Lawn Care", provider: "Green Lawns DFW", amount: 100, freq: "Bi-weekly", due: "Every other Fri", status: "Paid", auto: false },
                  { name: "Pest Control", provider: "ABC Home & Commercial", amount: 50, freq: "Quarterly", due: "Jul 15", status: "Due", auto: false },
                  { name: "Security", provider: "Ring/SimpliSafe", amount: 25, freq: "Monthly", due: "8th", status: "Paid", auto: true },
                  { name: "Software", provider: "Hospitable + PriceLabs", amount: 75, freq: "Monthly", due: "1st", status: "Paid", auto: true },
                  { name: "HOA", provider: "Arlington HOA", amount: 150, freq: "Monthly", due: "1st", status: "Overdue", auto: false },
                ].map((bill, i) => (
                  <tr key={i} className="border-b border-light-gray hover:bg-cream/50">
                    <td className="text-[10px] text-charcoal py-2 px-2 font-medium">{bill.name}</td>
                    <td className="text-[10px] text-warm-gray py-2 px-2">{bill.provider}</td>
                    <td className="text-[10px] text-charcoal py-2 px-2">${bill.amount}</td>
                    <td className="text-[10px] text-warm-gray py-2 px-2">{bill.freq}</td>
                    <td className="text-[10px] text-warm-gray py-2 px-2">{bill.due}</td>
                    <td className="py-2 px-2"><Badge variant={bill.status === "Paid" ? "green" : bill.status === "Due" ? "yellow" : "red"}>{bill.status}</Badge></td>
                    <td className="text-[10px] py-2 px-2">{bill.auto ? <CheckCircle size={12} className="text-emerald-500" /> : <XCircle size={12} className="text-warm-gray" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──── INVENTORY ──── */}
      {subTab === "inventory" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <SectionLabel>Inventory</SectionLabel>
            <div className="flex gap-2">
              <button onClick={() => alert("Feature coming soon — connect expense tracking to enable.")} className="bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90 transition">Add Item</button>
              <button onClick={() => alert("Feature coming soon — connect expense tracking to enable.")} className="bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90 transition">Record Purchase</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-light-gray">
                  {["Item", "Category", "Qty", "Reorder Lvl", "Unit Cost", "Total Value", "Condition", "Last Purchased"].map((h) => (
                    <th key={h} className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2 px-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { item: "Queen Sheet Sets", cat: "Linens", qty: 6, reorder: 4, cost: 45, condition: "Good", lastPurchased: "Jun 10" },
                  { item: "Bath Towel Sets", cat: "Linens", qty: 8, reorder: 6, cost: 28, condition: "Good", lastPurchased: "May 22" },
                  { item: "Pillow Protectors", cat: "Linens", qty: 10, reorder: 8, cost: 12, condition: "Fair", lastPurchased: "Apr 15" },
                  { item: "Duvet Inserts", cat: "Linens", qty: 3, reorder: 3, cost: 65, condition: "Fair", lastPurchased: "Mar 1" },
                  { item: "Shampoo (bulk)", cat: "Toiletries", qty: 2, reorder: 3, cost: 18, condition: "N/A", lastPurchased: "Jun 28" },
                  { item: "Body Wash (bulk)", cat: "Toiletries", qty: 2, reorder: 3, cost: 16, condition: "N/A", lastPurchased: "Jun 28" },
                  { item: "Hand Soap Refills", cat: "Toiletries", qty: 4, reorder: 4, cost: 8, condition: "N/A", lastPurchased: "Jun 15" },
                  { item: "Toilet Paper (case)", cat: "Toiletries", qty: 1, reorder: 2, cost: 32, condition: "N/A", lastPurchased: "Jun 5" },
                  { item: "Coffee Pods (box)", cat: "Kitchen", qty: 3, reorder: 2, cost: 22, condition: "N/A", lastPurchased: "Jun 20" },
                  { item: "Dish Soap", cat: "Kitchen", qty: 3, reorder: 2, cost: 6, condition: "N/A", lastPurchased: "May 30" },
                  { item: "Dishwasher Pods", cat: "Kitchen", qty: 1, reorder: 2, cost: 18, condition: "N/A", lastPurchased: "Jun 1" },
                  { item: "Sponges (pack)", cat: "Kitchen", qty: 5, reorder: 3, cost: 4, condition: "N/A", lastPurchased: "Jun 10" },
                  { item: "All-Purpose Cleaner", cat: "Cleaning", qty: 4, reorder: 3, cost: 8, condition: "N/A", lastPurchased: "Jun 15" },
                  { item: "Laundry Detergent", cat: "Cleaning", qty: 1, reorder: 2, cost: 24, condition: "N/A", lastPurchased: "Jun 1" },
                  { item: "Trash Bags (roll)", cat: "Cleaning", qty: 2, reorder: 3, cost: 14, condition: "N/A", lastPurchased: "Jun 10" },
                  { item: "Smoke Detectors", cat: "Safety", qty: 4, reorder: 4, cost: 25, condition: "Good", lastPurchased: "Jan 15" },
                  { item: "Fire Extinguisher", cat: "Safety", qty: 2, reorder: 2, cost: 35, condition: "Good", lastPurchased: "Feb 1" },
                  { item: "First Aid Kit", cat: "Safety", qty: 1, reorder: 1, cost: 28, condition: "Good", lastPurchased: "Mar 10" },
                  { item: "Smart Lock Batteries", cat: "Electronics", qty: 2, reorder: 4, cost: 12, condition: "N/A", lastPurchased: "May 1" },
                  { item: "Light Bulbs (LED)", cat: "Electronics", qty: 3, reorder: 4, cost: 8, condition: "N/A", lastPurchased: "Apr 20" },
                ].map((row, i) => {
                  const atOrBelowReorder = row.qty <= row.reorder;
                  return (
                    <tr key={i} className={`border-b border-light-gray ${atOrBelowReorder ? "bg-amber-50" : "hover:bg-cream/50"}`}>
                      <td className="text-[10px] text-charcoal py-2 px-2 font-medium">{row.item}</td>
                      <td className="text-[10px] text-warm-gray py-2 px-2">{row.cat}</td>
                      <td className={`text-[10px] py-2 px-2 font-medium ${atOrBelowReorder ? "text-amber-700" : "text-charcoal"}`}>{row.qty}</td>
                      <td className="text-[10px] text-warm-gray py-2 px-2">{row.reorder}</td>
                      <td className="text-[10px] text-charcoal py-2 px-2">${row.cost}</td>
                      <td className="text-[10px] text-charcoal py-2 px-2">${row.qty * row.cost}</td>
                      <td className="text-[10px] text-warm-gray py-2 px-2">{row.condition}</td>
                      <td className="text-[10px] text-warm-gray py-2 px-2">{row.lastPurchased}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──── INVENTORY USAGE ──── */}
      {subTab === "inventory-usage" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <SectionLabel>Inventory Usage Log</SectionLabel>
            <button onClick={() => alert("Feature coming soon — connect expense tracking to enable.")} className="bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90 transition">Record Usage</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KPICard icon={DollarSign} label="Total Used This Month" value="$340" accent="text-charcoal" />
            <KPICard icon={Star} label="Top Used Item" value="Bath Towels" accent="text-charcoal" sub="14 units this month" />
            <KPICard icon={BarChart3} label="Avg Usage Per Booking" value="$24.30" accent="text-charcoal" sub="Across 14 bookings" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-light-gray">
                  {["Date", "Item", "Qty Used", "Cost", "Reason", "Booking", "Notes"].map((h) => (
                    <th key={h} className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2 px-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { date: "Jul 3", item: "Bath Towel Sets", qty: 2, cost: 56, reason: "Guest Stay", booking: "BK-1042", notes: "Full set replaced" },
                  { date: "Jul 3", item: "Shampoo (bulk)", qty: 1, cost: 18, reason: "Guest Stay", booking: "BK-1042", notes: "Dispenser refilled" },
                  { date: "Jul 3", item: "Coffee Pods", qty: 1, cost: 22, reason: "Guest Stay", booking: "BK-1042", notes: "Box restocked" },
                  { date: "Jul 3", item: "Trash Bags", qty: 1, cost: 14, reason: "Cleaning", booking: "BK-1042", notes: "" },
                  { date: "Jul 1", item: "Queen Sheet Sets", qty: 1, cost: 45, reason: "Damage", booking: "BK-1041", notes: "Stain - unrepairable" },
                  { date: "Jun 30", item: "Bath Towel Sets", qty: 2, cost: 56, reason: "Guest Stay", booking: "BK-1041", notes: "" },
                  { date: "Jun 30", item: "All-Purpose Cleaner", qty: 1, cost: 8, reason: "Cleaning", booking: "BK-1041", notes: "" },
                  { date: "Jun 30", item: "Toilet Paper", qty: 1, cost: 32, reason: "Guest Stay", booking: "BK-1041", notes: "Case used" },
                  { date: "Jun 28", item: "Sponges", qty: 1, cost: 4, reason: "Cleaning", booking: "-", notes: "Routine replacement" },
                  { date: "Jun 26", item: "Light Bulbs (LED)", qty: 2, cost: 16, reason: "Maintenance", booking: "-", notes: "Porch + bedroom" },
                  { date: "Jun 25", item: "Hand Soap Refills", qty: 2, cost: 16, reason: "Guest Stay", booking: "BK-1040", notes: "" },
                  { date: "Jun 22", item: "Dishwasher Pods", qty: 1, cost: 18, reason: "Guest Stay", booking: "BK-1039", notes: "Box restocked" },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-light-gray hover:bg-cream/50">
                    <td className="text-[10px] text-charcoal py-2 px-2">{row.date}</td>
                    <td className="text-[10px] text-charcoal py-2 px-2 font-medium">{row.item}</td>
                    <td className="text-[10px] text-charcoal py-2 px-2">{row.qty}</td>
                    <td className="text-[10px] text-red-500 py-2 px-2">${row.cost}</td>
                    <td className="py-2 px-2"><Badge variant={row.reason === "Damage" ? "red" : row.reason === "Maintenance" ? "yellow" : "gray"}>{row.reason}</Badge></td>
                    <td className="text-[10px] text-charcoal py-2 px-2">{row.booking}</td>
                    <td className="text-[10px] text-warm-gray py-2 px-2">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──── REPLACEMENT RESERVE ──── */}
      {subTab === "replacement-reserve" && (
        <div className="space-y-4">
          <SectionLabel>Replacement Reserve</SectionLabel>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard icon={DollarSign} label="Total Reserve Needed" value="$680" accent="text-amber-600" />
            <KPICard icon={AlertCircle} label="Items Needing Now" value="3" accent="text-red-500" />
            <KPICard icon={Target} label="Below Reorder" value="5" accent="text-amber-600" />
            <KPICard icon={Calendar} label="Projected 30/60/90 Day" value="$680 / $920 / $1,450" accent="text-charcoal" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-light-gray">
                  {["Item", "Current Qty", "Condition", "Expected Replace", "Cost/Item", "Total Cost", "Priority", "Status"].map((h) => (
                    <th key={h} className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2 px-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { item: "Toilet Paper (case)", qty: 1, condition: "Low Stock", replace: "Now", costPer: 32, total: 64, priority: "urgent" as const, status: "Order Needed" },
                  { item: "Shampoo (bulk)", qty: 2, condition: "Low Stock", replace: "Now", costPer: 18, total: 36, priority: "urgent" as const, status: "Order Needed" },
                  { item: "Body Wash (bulk)", qty: 2, condition: "Low Stock", replace: "Now", costPer: 16, total: 32, priority: "urgent" as const, status: "Order Needed" },
                  { item: "Smart Lock Batteries", qty: 2, condition: "Low", replace: "Jul 15", costPer: 12, total: 24, priority: "high" as const, status: "Monitor" },
                  { item: "Laundry Detergent", qty: 1, condition: "Low Stock", replace: "Jul 10", costPer: 24, total: 48, priority: "high" as const, status: "Order Soon" },
                  { item: "Trash Bags (roll)", qty: 2, condition: "Low", replace: "Jul 20", costPer: 14, total: 42, priority: "high" as const, status: "Monitor" },
                  { item: "Duvet Inserts", qty: 3, condition: "Fair", replace: "Aug 15", costPer: 65, total: 195, priority: "medium" as const, status: "Plan Replacement" },
                  { item: "Pillow Protectors", qty: 10, condition: "Fair", replace: "Sep 1", costPer: 12, total: 144, priority: "medium" as const, status: "Plan Replacement" },
                  { item: "Light Bulbs (LED)", qty: 3, condition: "N/A", replace: "Jul 25", costPer: 8, total: 24, priority: "low" as const, status: "Stock Up" },
                  { item: "Dishwasher Pods", qty: 1, condition: "Low", replace: "Jul 15", costPer: 18, total: 36, priority: "high" as const, status: "Order Soon" },
                ].map((row, i) => {
                  const priorityVariant = { urgent: "red" as const, high: "orange" as const, medium: "yellow" as const, low: "green" as const };
                  return (
                    <tr key={i} className="border-b border-light-gray hover:bg-cream/50">
                      <td className="text-[10px] text-charcoal py-2 px-2 font-medium">{row.item}</td>
                      <td className="text-[10px] text-charcoal py-2 px-2">{row.qty}</td>
                      <td className="text-[10px] text-warm-gray py-2 px-2">{row.condition}</td>
                      <td className="text-[10px] text-charcoal py-2 px-2">{row.replace}</td>
                      <td className="text-[10px] text-charcoal py-2 px-2">${row.costPer}</td>
                      <td className="text-[10px] text-charcoal py-2 px-2">${row.total}</td>
                      <td className="py-2 px-2"><Badge variant={priorityVariant[row.priority]}>{row.priority}</Badge></td>
                      <td className="text-[10px] text-warm-gray py-2 px-2">{row.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──── WEEKLY SUMMARY ──── */}
      {subTab === "weekly-summary" && (
        <div className="space-y-4">
          <SectionLabel>Weekly Summaries</SectionLabel>
          {[
            { week: "Jun 30 - Jul 6", bookings: 3, nights: 10, revenue: 3250, cleaning: 340, laundry: 135, supplies: 84, utilities: 98, repairs: 0, maintenance: 0, inventory: 96 },
            { week: "Jun 23 - Jun 29", bookings: 2, nights: 8, revenue: 2680, cleaning: 190, laundry: 90, supplies: 48, utilities: 78, repairs: 275, maintenance: 0, inventory: 72 },
            { week: "Jun 16 - Jun 22", bookings: 3, nights: 11, revenue: 3520, cleaning: 285, laundry: 135, supplies: 75, utilities: 108, repairs: 0, maintenance: 50, inventory: 84 },
            { week: "Jun 9 - Jun 15", bookings: 2, nights: 7, revenue: 2400, cleaning: 190, laundry: 90, supplies: 56, utilities: 68, repairs: 0, maintenance: 0, inventory: 60 },
          ].map((w) => {
            const totalExp = w.cleaning + w.laundry + w.supplies + w.utilities + w.repairs + w.maintenance + w.inventory;
            const netProfit = w.revenue - totalExp;
            const margin = ((netProfit / w.revenue) * 100).toFixed(1);
            return (
              <Card key={w.week}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">{w.week}</span>
                  <div className="flex gap-3">
                    <span className="text-[10px] text-warm-gray">{w.bookings} bookings</span>
                    <span className="text-[10px] text-warm-gray">{w.nights} nights</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5">
                  <div className="flex justify-between"><span className="text-[10px] text-charcoal">Revenue</span><span className="text-[10px] text-charcoal font-medium">${w.revenue.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] text-warm-gray">Cleaning</span><span className="text-[10px] text-red-500">-${w.cleaning}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] text-warm-gray">Laundry</span><span className="text-[10px] text-red-500">-${w.laundry}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] text-warm-gray">Supplies</span><span className="text-[10px] text-red-500">-${w.supplies}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] text-warm-gray">Utilities</span><span className="text-[10px] text-red-500">-${w.utilities}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] text-warm-gray">Repairs</span><span className="text-[10px] text-red-500">{w.repairs > 0 ? `-$${w.repairs}` : "$0"}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] text-warm-gray">Maintenance</span><span className="text-[10px] text-red-500">{w.maintenance > 0 ? `-$${w.maintenance}` : "$0"}</span></div>
                  <div className="flex justify-between"><span className="text-[10px] text-warm-gray">Inventory</span><span className="text-[10px] text-red-500">-${w.inventory}</span></div>
                </div>
                <div className="mt-3 pt-3 border-t border-light-gray flex justify-between items-center">
                  <div className="flex gap-4">
                    <div><span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Total Expenses</span><span className="text-sm text-red-500 ml-2">-${totalExp.toLocaleString()}</span></div>
                    <div><span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Net Profit</span><span className="text-sm text-emerald-600 ml-2">${netProfit.toLocaleString()}</span></div>
                  </div>
                  <Badge variant={Number(margin) >= 60 ? "green" : Number(margin) >= 40 ? "yellow" : "red"}>{margin}% margin</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ──── MONTHLY P&L ──── */}
      {subTab === "monthly-pl" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <SectionLabel>Monthly Profit & Loss Statement - July 2026</SectionLabel>
            <div className="flex gap-2">
              <button onClick={() => alert("CSV export coming soon.")} className="bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90 transition">Export CSV</button>
              <button onClick={() => alert("PDF export coming soon.")} className="bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90 transition">Export PDF</button>
            </div>
          </div>
          <Card>
            <div className="space-y-1">
              {/* Revenue Section */}
              <div className="py-2 border-b-2 border-charcoal">
                <span className="text-[10px] tracking-[0.15em] uppercase text-charcoal font-medium">Revenue</span>
              </div>
              {[
                { label: "Gross Booking Revenue", value: "$12,450", indent: false, bold: false },
                { label: "Platform Fees (Airbnb, VRBO)", value: "-$1,560", indent: true, bold: false, red: true },
                { label: "Payment Processing Fees", value: "-$186", indent: true, bold: false, red: true },
              ].map((line, i) => (
                <div key={i} className={`flex justify-between py-1.5 ${line.indent ? "pl-6" : ""}`}>
                  <span className={`text-[10px] ${line.bold ? "text-charcoal font-medium" : "text-warm-gray"}`}>{line.label}</span>
                  <span className={`text-[10px] ${line.red ? "text-red-500" : "text-charcoal"} ${line.bold ? "font-medium" : ""}`}>{line.value}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 border-t border-light-gray bg-cream px-3 -mx-1">
                <span className="text-[10px] text-charcoal font-medium">Net Revenue</span>
                <span className="text-[10px] text-charcoal font-medium">$10,704</span>
              </div>

              {/* Operating Expenses Section */}
              <div className="py-2 border-b-2 border-charcoal mt-4">
                <span className="text-[10px] tracking-[0.15em] uppercase text-charcoal font-medium">Operating Expenses</span>
              </div>
              {[
                { label: "Mortgage (Principal + Interest)", value: "$1,500" },
                { label: "Cleaning Services", value: "$530" },
                { label: "Utilities (Electric, Water, Gas, Internet)", value: "$390" },
                { label: "Insurance", value: "$200" },
                { label: "Property Tax (Monthly Allocation)", value: "$400" },
                { label: "Laundry Services", value: "$270" },
                { label: "Supplies (Toiletries, Kitchen, Cleaning)", value: "$144" },
                { label: "Lawn Care", value: "$100" },
                { label: "Pest Control (Monthly Allocation)", value: "$17" },
                { label: "Software & Subscriptions", value: "$75" },
                { label: "Security Monitoring", value: "$25" },
                { label: "HOA Fees", value: "$150" },
                { label: "Repairs & Maintenance", value: "$275" },
                { label: "Trash Collection", value: "$35" },
              ].map((line, i) => (
                <div key={i} className="flex justify-between py-1.5 pl-6">
                  <span className="text-[10px] text-warm-gray">{line.label}</span>
                  <span className="text-[10px] text-red-500">{line.value}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 border-t border-light-gray">
                <span className="text-[10px] text-charcoal font-medium">Total Operating Expenses</span>
                <span className="text-[10px] text-red-500 font-medium">-$4,111</span>
              </div>

              {/* Inventory Section */}
              <div className="py-2 border-b-2 border-charcoal mt-4">
                <span className="text-[10px] tracking-[0.15em] uppercase text-charcoal font-medium">Inventory</span>
              </div>
              {[
                { label: "Inventory Purchased", value: "$485" },
                { label: "Inventory Used / Consumed", value: "$340" },
                { label: "Replacement Reserve Allocation", value: "$680" },
              ].map((line, i) => (
                <div key={i} className="flex justify-between py-1.5 pl-6">
                  <span className="text-[10px] text-warm-gray">{line.label}</span>
                  <span className="text-[10px] text-red-500">{line.value}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 border-t border-light-gray">
                <span className="text-[10px] text-charcoal font-medium">Total Inventory Costs</span>
                <span className="text-[10px] text-red-500 font-medium">-$1,505</span>
              </div>

              {/* Total Expenses */}
              <div className="flex justify-between py-2 mt-2 border-t-2 border-charcoal">
                <span className="text-[10px] text-charcoal font-medium tracking-[0.1em] uppercase">Total Expenses</span>
                <span className="text-[10px] text-red-500 font-medium">-$5,616</span>
              </div>

              {/* Bottom Line */}
              <div className="mt-4 bg-cream px-4 py-3 -mx-1 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[10px] text-charcoal font-medium">Net Operating Income</span>
                  <span className="text-sm text-charcoal font-medium">$5,088</span>
                </div>
                <div className="flex justify-between border-t border-light-gray pt-2">
                  <span className="text-xs text-charcoal font-medium">Net Profit</span>
                  <span className="text-lg font-light text-emerald-600">$5,088</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-warm-gray">Profit Margin</span>
                  <span className="text-sm text-emerald-600">40.9%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ──── REPORTS ──── */}
      {subTab === "reports" && (
        <div className="space-y-4">
          <SectionLabel>Reports & Exports</SectionLabel>
          <div className="bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2">
            <Info size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-700">Report generation will be available once expense data is connected. These reports will auto-populate from your tracked expenses, inventory, and booking costs.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: LineChart, title: "Monthly P&L", desc: "Complete profit & loss statement with all revenue and expense categories.", formats: "CSV / PDF" },
              { icon: Receipt, title: "Expense Report", desc: "Detailed list of all expenses with categories, vendors, and payment methods.", formats: "CSV" },
              { icon: Shield, title: "Inventory Report", desc: "Current inventory levels, values, and reorder status across all categories.", formats: "CSV" },
              { icon: DollarSign, title: "Booking Cost Report", desc: "Per-booking revenue and expense breakdown with profit margins.", formats: "CSV" },
              { icon: Building2, title: "Vendor Expense Report", desc: "Expenses grouped by vendor with totals and payment history.", formats: "CSV" },
              { icon: Percent, title: "Tax Category Report", desc: "Expenses organized by tax-deductible categories for filing.", formats: "CSV / PDF" },
            ].map((report) => (
              <Card key={report.title}>
                <div className="flex items-center gap-2 mb-2">
                  <report.icon size={16} className="text-warm-gray" />
                  <span className="text-xs text-charcoal font-medium">{report.title}</span>
                </div>
                <p className="text-[10px] text-warm-gray mb-3 leading-relaxed">{report.desc}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-warm-gray">{report.formats}</span>
                  <button onClick={() => alert("Report generation coming soon.")} className="px-3 py-1.5 bg-charcoal text-white text-[10px] tracking-[0.1em] uppercase font-medium hover:bg-charcoal/90 transition">
                    Generate
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ForecastingTab() {
  const demandTrend = [65, 70, 68, 72, 78, 82, 85, 80, 75, 68, 62, 58, 55, 60];

  const statusColors: Record<string, { bg: string; text: string; variant: "red" | "blue" | "yellow" | "orange" }> = {
    "High Demand": { bg: "bg-red-50", text: "text-red-700", variant: "red" },
    "Low Demand": { bg: "bg-blue-50", text: "text-blue-700", variant: "blue" },
    "Needs Price Adjustment": { bg: "bg-amber-50", text: "text-amber-700", variant: "yellow" },
    "Needs Promotion": { bg: "bg-orange-50", text: "text-orange-700", variant: "orange" },
  };

  return (
    <div className="space-y-6">
      {/* Forecast Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Next 30 Days", revenue: "$8,500", occupancy: "72%", payouts: "$6,200" },
          { label: "Next 60 Days", revenue: "$15,200", occupancy: "65%", payouts: "$11,800" },
          { label: "Next 90 Days", revenue: "$22,800", occupancy: "58%", payouts: "$17,500" },
        ].map((f) => (
          <Card key={f.label}>
            <SectionLabel>{f.label}</SectionLabel>
            <p className="text-2xl font-light text-charcoal mb-3">{f.revenue}</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-warm-gray">Expected Occupancy</span>
                <span className="text-charcoal font-medium">{f.occupancy}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-warm-gray">Expected Payouts</span>
                <span className="text-charcoal font-medium">{f.payouts}</span>
              </div>
            </div>
            <div className="mt-2">
              <ComingSoonBadge />
            </div>
          </Card>
        ))}
      </div>

      {/* Demand Forecast (CSS line) */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Demand Forecast (Next 14 Weeks)</SectionLabel>
          <IntegrationBadge />
        </div>
        <div className="relative h-32">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <div
              key={pct}
              className="absolute left-0 right-0 border-b border-light-gray"
              style={{ bottom: `${pct}%` }}
            >
              <span className="absolute -left-1 -translate-x-full text-[8px] text-warm-gray">{pct}%</span>
            </div>
          ))}
          {/* Data points connected with CSS */}
          <div className="absolute inset-0 flex items-end">
            {demandTrend.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="relative w-full flex justify-center" style={{ marginBottom: `${val}%` }}>
                  <div className="w-2 h-2 rounded-full bg-blue-500 relative z-10" />
                </div>
              </div>
            ))}
          </div>
          {/* Bar fill */}
          <div className="absolute inset-0 flex items-end gap-px">
            {demandTrend.map((val, i) => (
              <div key={i} className="flex-1">
                <div
                  className="w-full bg-blue-100 hover:bg-blue-200 transition-colors"
                  style={{ height: `${val}%` }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[8px] text-warm-gray">Week 1</span>
          <span className="text-[8px] text-warm-gray">Week 14</span>
        </div>
      </Card>

      {/* Date Status Table */}
      <Card>
        <SectionLabel>Upcoming Date Analysis</SectionLabel>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-light-gray">
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Date</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Day</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Status</th>
                <th className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium py-2">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {FORECAST_DATES.map((d) => {
                const sc = statusColors[d.status];
                const recommendations: Record<string, string> = {
                  "High Demand": "Consider increasing rate 15-25%",
                  "Low Demand": "Enable last-minute discount",
                  "Needs Price Adjustment": "Rate may be too high — review competitors",
                  "Needs Promotion": "Create special offer or reduce minimum stay",
                };
                return (
                  <tr key={d.date} className="border-b border-light-gray last:border-0 hover:bg-cream/50">
                    <td className="py-2 text-xs text-charcoal">{d.date}</td>
                    <td className="py-2 text-xs text-warm-gray">{d.day}</td>
                    <td className="py-2">
                      <Badge variant={sc.variant}>{d.status}</Badge>
                    </td>
                    <td className="py-2 text-[10px] text-warm-gray">{recommendations[d.status]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Integrations Tab ──────────────────────────────────────────────────────

function IntegrationsTab() {
  const bookingPlatforms = [
    { name: "Airbnb", color: "#FF5A5F", status: "Not Connected" as const, desc: "Sync reservations, revenue, guest data, and reviews from Airbnb", alert: "Airbnb integration coming soon — requires approved PMS/channel manager" },
    { name: "VRBO", color: "#3B5FC0", status: "Not Connected" as const, desc: "Sync bookings, payouts, and calendar from VRBO", alert: "VRBO integration coming soon — requires approved PMS/channel manager" },
    { name: "Booking.com", color: "#003580", status: "Not Connected" as const, desc: "Connect via Booking.com Connectivity API or channel manager", alert: "Booking.com integration coming soon — requires approved PMS/channel manager" },
    { name: "Direct Website", color: "#2D6A4F", status: "Active" as const, desc: "Revenue from avenue10.vercel.app direct bookings", alert: "" },
  ];

  const pmsTools = [
    { name: "Hostaway", color: "#4F46E5", desc: "All-in-one PMS with channel management, automation, and accounting" },
    { name: "Guesty", color: "#1E3A5F", desc: "Enterprise property management and distribution platform" },
    { name: "OwnerRez", color: "#D97706", desc: "Direct booking management with channel distribution" },
    { name: "Hospitable", color: "#059669", desc: "Automated guest messaging and operations platform" },
  ];

  const pricingTools = [
    { name: "PriceLabs", color: "#7C3AED", desc: "AI-powered dynamic pricing and market analytics" },
    { name: "Beyond (formerly Beyond Pricing)", color: "#2563EB", desc: "Revenue management and dynamic pricing" },
    { name: "Wheelhouse", color: "#0891B2", desc: "Data-driven pricing recommendations and market insights" },
    { name: "AirDNA", color: "#DC2626", desc: "Short-term rental market data and analytics" },
  ];

  const financialTools = [
    { name: "Stripe", color: "#635BFF", desc: "Payment processing for direct bookings" },
    { name: "QuickBooks", color: "#2CA01C", desc: "Accounting software integration for expense tracking" },
    { name: "Xero", color: "#13B5EA", desc: "Cloud accounting and bookkeeping integration" },
  ];

  const dataProviders = [
    { name: "KeyData", color: "#1F2937", desc: "STR performance data and benchmarking" },
    { name: "Transparent", color: "#6366F1", desc: "Vacation rental market intelligence" },
  ];

  const apiKeys = [
    { label: "Airbnb API Key", placeholder: "airbnb_api_key_..." },
    { label: "VRBO API Key", placeholder: "vrbo_api_key_..." },
    { label: "PriceLabs API Key", placeholder: "pricelabs_api_key_..." },
    { label: "Stripe API Key", placeholder: "sk_live_..." },
    { label: "AirDNA API Key", placeholder: "airdna_api_key_..." },
  ];

  return (
    <div className="space-y-8">
      {/* Booking Platforms */}
      <div>
        <SectionLabel>Booking Platforms</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {bookingPlatforms.map((p) => (
            <Card key={p.name}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-xs text-charcoal font-medium">{p.name}</span>
              </div>
              <p className="text-[10px] text-warm-gray mb-3 leading-relaxed">{p.desc}</p>
              <div className="flex items-center justify-between">
                {p.status === "Active" ? (
                  <Badge variant="green">Connected</Badge>
                ) : (
                  <Badge variant="gray">Not Connected</Badge>
                )}
                {p.status === "Active" ? (
                  <button
                    onClick={() => alert("Direct website integration is managed through your site settings.")}
                    className="px-3 py-1.5 bg-white text-charcoal border border-light-gray text-[10px] tracking-[0.1em] uppercase font-medium hover:bg-cream transition"
                  >
                    Manage
                  </button>
                ) : (
                  <button
                    onClick={() => alert(p.alert)}
                    className="px-3 py-1.5 bg-charcoal text-white text-[10px] tracking-[0.1em] uppercase font-medium hover:bg-charcoal/90 transition"
                  >
                    Connect
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* PMS / Channel Manager */}
      <div>
        <SectionLabel>PMS / Channel Manager</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {pmsTools.map((t) => (
            <Card key={t.name}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-xs text-charcoal font-medium">{t.name}</span>
              </div>
              <p className="text-[10px] text-warm-gray mb-3 leading-relaxed">{t.desc}</p>
              <div className="flex items-center justify-between">
                <ComingSoonBadge />
                <button
                  onClick={() => alert(`${t.name} integration coming soon.`)}
                  className="px-3 py-1.5 bg-charcoal text-white text-[10px] tracking-[0.1em] uppercase font-medium hover:bg-charcoal/90 transition"
                >
                  Connect
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Pricing Tools */}
      <div>
        <SectionLabel>Pricing Tools</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {pricingTools.map((t) => (
            <Card key={t.name}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-xs text-charcoal font-medium">{t.name}</span>
              </div>
              <p className="text-[10px] text-warm-gray mb-3 leading-relaxed">{t.desc}</p>
              <div className="flex items-center justify-between">
                <ComingSoonBadge />
                <button
                  onClick={() => alert(`${t.name} integration coming soon.`)}
                  className="px-3 py-1.5 bg-charcoal text-white text-[10px] tracking-[0.1em] uppercase font-medium hover:bg-charcoal/90 transition"
                >
                  Connect
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Financial Tools */}
      <div>
        <SectionLabel>Financial Tools</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {financialTools.map((t) => (
            <Card key={t.name}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-xs text-charcoal font-medium">{t.name}</span>
              </div>
              <p className="text-[10px] text-warm-gray mb-3 leading-relaxed">{t.desc}</p>
              <div className="flex items-center justify-between">
                <ComingSoonBadge />
                <button
                  onClick={() => alert(`${t.name} integration coming soon.`)}
                  className="px-3 py-1.5 bg-charcoal text-white text-[10px] tracking-[0.1em] uppercase font-medium hover:bg-charcoal/90 transition"
                >
                  Connect
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Data Providers */}
      <div>
        <SectionLabel>Data Providers</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dataProviders.map((t) => (
            <Card key={t.name}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-xs text-charcoal font-medium">{t.name}</span>
              </div>
              <p className="text-[10px] text-warm-gray mb-3 leading-relaxed">{t.desc}</p>
              <div className="flex items-center justify-between">
                <ComingSoonBadge />
                <button
                  onClick={() => alert(`${t.name} integration coming soon.`)}
                  className="px-3 py-1.5 bg-charcoal text-white text-[10px] tracking-[0.1em] uppercase font-medium hover:bg-charcoal/90 transition"
                >
                  Connect
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div>
        <SectionLabel>API Keys</SectionLabel>
        <Card>
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div key={key.label} className="flex items-center gap-3">
                <label className="text-xs text-charcoal w-36 shrink-0">{key.label}</label>
                <input
                  type="password"
                  placeholder={key.placeholder}
                  disabled
                  className="flex-1 text-xs bg-cream border border-light-gray px-3 py-2 text-warm-gray cursor-not-allowed"
                />
                <button
                  disabled
                  className="px-3 py-1.5 bg-gray-100 text-gray-400 text-[10px] tracking-[0.1em] uppercase font-medium cursor-not-allowed"
                >
                  Save
                </button>
                <span className="text-[9px] text-warm-gray whitespace-nowrap">Coming Soon</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 bg-cream border border-light-gray px-4 py-3">
            <Shield size={14} className="text-warm-gray mt-0.5 shrink-0" />
            <p className="text-[10px] text-warm-gray leading-relaxed">
              API keys are stored securely in environment variables and never exposed to the frontend.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "charts", label: "Revenue Charts", icon: LineChart },
  { key: "sources", label: "Booking Sources", icon: MapPin },
  { key: "pricing", label: "Dynamic Pricing", icon: DollarSign },
  { key: "ai", label: "AI Pricing", icon: Brain },
  { key: "comps", label: "Market Comps", icon: Building2 },
  { key: "payouts", label: "Payouts", icon: Wallet },
  { key: "expenses", label: "Expenses & P&L", icon: Receipt },
  { key: "forecast", label: "Forecasting", icon: TrendingUp },
  { key: "integrations", label: "Integrations", icon: Settings },
];

const VALID_TABS = TABS.map((t) => t.key);

function AdminRevenuePageInner() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<Tab>(
    initialTab && VALID_TABS.includes(initialTab as Tab) ? (initialTab as Tab) : "overview"
  );
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<string>("all");

  useEffect(() => {
    fetch("/api/admin/listings")
      .then((r) => r.json())
      .then((data: Listing[]) => setListings(data))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="font-serif text-2xl text-charcoal font-light">Revenue & Analytics</h1>
        <div className="flex flex-wrap items-center gap-2">
          {/* Property Filter */}
          <div className="relative">
            <select
              value={selectedListing}
              onChange={(e) => setSelectedListing(e.target.value)}
              className="appearance-none bg-white border border-light-gray pl-3 pr-8 py-1.5 text-[10px] tracking-[0.15em] uppercase font-medium text-charcoal cursor-pointer"
            >
              <option value="all">All Properties</option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
            <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warm-gray pointer-events-none" />
          </div>

          {/* Date Range */}
          <div className="flex gap-px">
            {([
              ["month", "Month"],
              ["quarter", "Quarter"],
              ["year", "Year"],
              ["all", "All Time"],
            ] as [TimeRange, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTimeRange(key)}
                className={`px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase font-medium transition ${
                  timeRange === key
                    ? "bg-charcoal text-white"
                    : "bg-white text-charcoal border border-light-gray hover:bg-cream"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation — icon grid */}
      <div className="mb-6 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`group relative flex flex-col items-center gap-1.5 px-2 py-3.5 transition-all ${
                isActive
                  ? "bg-charcoal text-white shadow-md"
                  : "bg-white text-warm-gray border border-light-gray hover:border-charcoal/30 hover:text-charcoal hover:shadow-sm"
              }`}
            >
              <Icon size={18} className={isActive ? "text-white" : "text-warm-gray/60 group-hover:text-charcoal"} />
              <span className="text-[8px] tracking-[0.12em] uppercase font-medium leading-tight text-center">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-charcoal rotate-45" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "charts" && <RevenueChartsTab />}
      {activeTab === "sources" && <BookingSourcesTab />}
      {activeTab === "pricing" && <DynamicPricingTab />}
      {activeTab === "ai" && <AIPricingTab />}
      {activeTab === "comps" && <MarketCompsTab />}
      {activeTab === "payouts" && <PayoutsTab />}
      {activeTab === "expenses" && <ExpensesPLTab />}
      {activeTab === "forecast" && <ForecastingTab />}
      {activeTab === "integrations" && <IntegrationsTab />}
    </div>
  );
}

export default function AdminRevenuePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <p className="text-warm-gray text-sm">Loading...</p>
        </div>
      }
    >
      <AdminRevenuePageInner />
    </Suspense>
  );
}
