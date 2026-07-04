"use client";

import { useEffect, useState } from "react";
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
  | "forecast";

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
              <button className="flex items-center gap-1.5 bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90 transition" disabled>
                <ThumbsUp size={10} />
                Approve
              </button>
              <button className="flex items-center gap-1.5 bg-white text-charcoal border border-light-gray px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition" disabled>
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
  const totalExpenses = EXPENSE_CATEGORIES.reduce((s, e) => s + e.amount, 0);
  const grossRevenue = 12450;
  const platformFees = 485;
  const netRevenue = grossRevenue - platformFees;
  const netProfit = netRevenue - totalExpenses;

  const threeMonthExpenses = [
    { month: "May", total: 3950 },
    { month: "Jun", total: 4080 },
    { month: "Jul", total: totalExpenses },
  ];
  const maxExp = Math.max(...threeMonthExpenses.map((m) => m.total));

  return (
    <div className="space-y-6">
      {/* Expense Grid */}
      <Card>
        <SectionLabel>Monthly Expense Breakdown</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {EXPENSE_CATEGORIES.map((e) => (
            <div key={e.name} className="flex items-center justify-between py-2 px-3 bg-cream border border-light-gray">
              <div className="flex items-center gap-2">
                <span className="text-sm">{e.icon}</span>
                <span className="text-[10px] text-charcoal">{e.name}</span>
              </div>
              <span className={`text-xs font-medium ${e.amount === 0 ? "text-warm-gray" : "text-charcoal"}`}>
                ${e.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-light-gray flex justify-between items-center">
          <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Total Monthly Expenses</span>
          <span className="text-xl font-light text-red-500">${totalExpenses.toLocaleString()}</span>
        </div>
      </Card>

      {/* P&L Summary */}
      <Card>
        <SectionLabel>Monthly Profit & Loss</SectionLabel>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-xs text-charcoal">Gross Revenue</span>
            <span className="text-sm font-medium text-charcoal">${grossRevenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-light-gray">
            <span className="text-xs text-warm-gray pl-4">Platform Fees</span>
            <span className="text-sm text-red-500">-${platformFees.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-xs text-charcoal font-medium">Net Revenue</span>
            <span className="text-sm font-medium text-charcoal">${netRevenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-light-gray">
            <span className="text-xs text-warm-gray pl-4">Operating Expenses</span>
            <span className="text-sm text-red-500">-${totalExpenses.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center py-2 bg-cream px-3 -mx-1">
            <span className="text-xs text-charcoal font-medium">Net Profit</span>
            <span className={`text-lg font-light ${netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              ${netProfit.toLocaleString()}
            </span>
          </div>
        </div>
      </Card>

      {/* Financial Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPICard icon={TrendingUp} label="Net Operating Income" value={`$${netProfit.toLocaleString()}`} accent="text-emerald-600" />
        <KPICard icon={Moon} label="Cost/Occupied Night" value="$205" accent="text-charcoal" sub="21 nights occupied" />
        <KPICard icon={Receipt} label="Cleaning/Stay" value="$67" accent="text-charcoal" sub="12 stays this month" />
        <KPICard icon={Percent} label="Expense Ratio" value={`${Math.round((totalExpenses / grossRevenue) * 100)}%`} accent="text-amber-600" />
        <KPICard icon={TrendingUp} label="Profit Margin" value={`${Math.round((netProfit / grossRevenue) * 100)}%`} accent={netProfit >= 0 ? "text-emerald-600" : "text-red-500"} />
      </div>

      {/* Expense Trend */}
      <Card>
        <SectionLabel>3-Month Expense Trend</SectionLabel>
        <div className="flex items-end gap-4 h-32">
          {threeMonthExpenses.map((m) => {
            const height = (m.total / maxExp) * 100;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-charcoal font-medium">${m.total.toLocaleString()}</span>
                <div
                  className="w-full bg-red-400/60 hover:bg-red-400/80 transition-colors"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">{m.month}</span>
              </div>
            );
          })}
        </div>
      </Card>
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
];

export default function AdminRevenuePage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
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
      <div className="mb-6 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
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
    </div>
  );
}
