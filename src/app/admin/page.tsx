"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Home,
  ClipboardList,
  DollarSign,
  Calendar,
  Clock,
  CalendarCheck,
  MessageSquare,
  Globe,
  Plug,
  BarChart3,
  LogIn,
  LogOut,
  AlertCircle,
  Star,
  FileText,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Listing {
  id: string;
  title: string;
  slug: string;
  pricePerNight: number;
  active: boolean;
  [key: string]: unknown;
}

interface Reservation {
  id: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: string;
  accessCode?: string;
  channel?: string;
  listing: { title: string; slug: string };
  [key: string]: unknown;
}

interface GuestRequest {
  id: string;
  type: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  createdAt?: string;
  reservation: {
    guestName: string;
    listing: { title: string };
  };
  [key: string]: unknown;
}

interface Review {
  id: string;
  approvalStatus?: string;
  [key: string]: unknown;
}

interface SiteContent {
  id: string;
  section?: string;
  page?: string;
  [key: string]: unknown;
}

interface MediaItem {
  id: string;
  listingMedia?: unknown[];
  pageMedia?: unknown[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatCurrency(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function truncate(s: string, len: number) {
  return s.length > len ? s.slice(0, len) + "…" : s;
}

function parseDate(s: string) {
  return new Date(s + (s.includes("T") ? "" : "T00:00:00"));
}

// ---------------------------------------------------------------------------
// Dot indicator
// ---------------------------------------------------------------------------

function Dot({ color }: { color: "green" | "amber" | "red" | "gray" | "blue" | "purple" | "orange" }) {
  const map: Record<string, string> = {
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    gray: "bg-stone-400",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
  };
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${map[color]}`} />;
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-charcoal" />
          <h2 className="text-sm font-medium text-charcoal">{title}</h2>
        </div>
        {action && (
          <Link
            href={action.href}
            className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium hover:text-charcoal transition-colors flex items-center gap-1"
          >
            {action.label} <ArrowRight size={10} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AdminDashboard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [guestRequests, setGuestRequests] = useState<GuestRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [content, setContent] = useState<SiteContent[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [listingsRes, reservationsRes, requestsRes, reviewsRes, contentRes, mediaRes] =
          await Promise.all([
            fetch("/api/admin/listings").then((r) => (r.ok ? r.json() : [])),
            fetch("/api/admin/reservations").then((r) => (r.ok ? r.json() : [])),
            fetch("/api/admin/guest-requests").then((r) => (r.ok ? r.json() : [])),
            fetch("/api/admin/reviews").then((r) => (r.ok ? r.json() : [])).catch(() => []),
            fetch("/api/admin/content").then((r) => (r.ok ? r.json() : [])),
            fetch("/api/admin/media").then((r) => (r.ok ? r.json() : [])),
          ]);

        setListings(Array.isArray(listingsRes) ? listingsRes : []);
        setReservations(Array.isArray(reservationsRes) ? reservationsRes : []);
        setGuestRequests(Array.isArray(requestsRes) ? requestsRes : []);
        setReviews(Array.isArray(reviewsRes) ? reviewsRes : []);
        setContent(Array.isArray(contentRes) ? contentRes : []);
        setMedia(Array.isArray(mediaRes) ? mediaRes : []);
      } catch {
        // silently handle network errors
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // -------------------------------------------------------------------------
  // Derived metrics
  // -------------------------------------------------------------------------

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDaysInMonth = daysInMonth(year, month);
  const daysElapsed = now.getDate();

  const activeListings = listings.filter((l) => l.active);
  const confirmedReservations = reservations.filter((r) => r.status === "confirmed");
  const completedReservations = reservations.filter((r) => r.status === "completed");

  // Bookings this month (checkIn in current month)
  const bookingsThisMonth = confirmedReservations.filter((r) => {
    const d = parseDate(r.checkIn);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  // Nights booked this month across all listings
  const bookedNightsThisMonth = confirmedReservations.reduce((sum, r) => {
    const ci = parseDate(r.checkIn);
    const co = parseDate(r.checkOut);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const overlapStart = ci < monthStart ? monthStart : ci;
    const overlapEnd = co > monthEnd ? monthEnd : co;
    const nights = Math.max(0, Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / 86400000));
    return sum + nights;
  }, 0);

  const totalPossibleNights = activeListings.length * totalDaysInMonth;
  const occupancyRate = totalPossibleNights > 0 ? Math.round((bookedNightsThisMonth / totalPossibleNights) * 100) : 0;

  const monthlyRevenue = bookingsThisMonth.reduce((s, r) => s + (r.totalPrice || 0), 0);
  // Also count confirmed bookings that overlap this month for gross revenue
  const grossRevenueMTD = confirmedReservations.reduce((s, r) => {
    const ci = parseDate(r.checkIn);
    const co = parseDate(r.checkOut);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    if (co >= monthStart && ci <= monthEnd) {
      return s + (r.totalPrice || 0);
    }
    return s;
  }, 0);

  const pendingRequests = guestRequests.filter(
    (r) => r.status !== "resolved" && r.status !== "closed"
  );

  const checkInsToday = confirmedReservations.filter((r) => isSameDay(parseDate(r.checkIn), today));
  const checkOutsToday = confirmedReservations.filter((r) => isSameDay(parseDate(r.checkOut), today));
  const currentlyStaying = confirmedReservations.filter((r) => {
    const ci = parseDate(r.checkIn);
    const co = parseDate(r.checkOut);
    return ci <= today && today < co;
  });

  const pendingReviews = reviews.filter((r) => r.approvalStatus === "pending");

  // Revenue metrics
  const avgDailyRate = bookedNightsThisMonth > 0 ? grossRevenueMTD / bookedNightsThisMonth : 0;
  const revPAR = activeListings.length > 0 && daysElapsed > 0 ? grossRevenueMTD / (activeListings.length * daysElapsed) : 0;
  const totalBookingsMTD = bookingsThisMonth.length;
  const avgBookingValue = totalBookingsMTD > 0 ? grossRevenueMTD / totalBookingsMTD : 0;

  // Booking pipeline
  const pendingBookings = reservations.filter((r) => r.status === "pending");
  const threeDaysFromNow = new Date(today.getTime() + 3 * 86400000);
  const checkInReady = confirmedReservations.filter((r) => {
    const ci = parseDate(r.checkIn);
    return ci >= today && ci <= threeDaysFromNow && r.accessCode;
  });
  const tomorrow = new Date(today.getTime() + 86400000);
  const checkoutPending = confirmedReservations.filter((r) => {
    const co = parseDate(r.checkOut);
    return isSameDay(co, today) || isSameDay(co, tomorrow);
  });
  const completedBookings = reservations.filter((r) => {
    if (r.status === "completed") return true;
    const co = parseDate(r.checkOut);
    return r.status === "confirmed" && co < today;
  });

  // Website readiness
  const hasListings = activeListings.length > 0;
  const hasMedia = media.length > 0;
  const hasHomepageContent = content.some(
    (c) => c.section === "homepage" || c.page === "homepage" || c.section === "hero"
  );
  const hasTermsContent = content.some(
    (c) => c.section === "checkin-terms" || c.page === "checkin-terms" || c.section === "terms"
  );
  const hasPageMedia = media.some(
    (m) => m.pageMedia && Array.isArray(m.pageMedia) && m.pageMedia.length > 0
  );
  const readinessItems = [
    { label: "Active listings", ok: hasListings },
    { label: "Media uploaded", ok: hasMedia },
    { label: "Homepage content", ok: hasHomepageContent },
    { label: "Terms content", ok: hasTermsContent },
    { label: "Page media assigned", ok: hasPageMedia },
  ];
  const readinessScore = readinessItems.filter((i) => i.ok).length;
  const readinessPercent = Math.round((readinessScore / readinessItems.length) * 100);

  // Mini calendar: next 7 days
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  function getListingDayStatus(listing: Listing, day: Date): "booked" | "available" | "blocked" {
    for (const r of confirmedReservations) {
      if (r.listing?.slug === listing.slug || r.listing?.title === listing.title) {
        const ci = parseDate(r.checkIn);
        const co = parseDate(r.checkOut);
        if (day >= ci && day < co) return "booked";
      }
    }
    return "available";
  }

  // Integrations (all static for now)
  const integrations = [
    { name: "Airbnb", connected: false },
    { name: "VRBO", connected: false },
    { name: "Booking.com", connected: false },
    { name: "PriceLabs", connected: false },
    { name: "Smart Locks", connected: false },
    { name: "Stripe", connected: false },
  ];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-warm-gray text-sm">Loading command center&hellip;</div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Page title */}
      <h1 className="font-serif text-2xl text-charcoal font-light mb-6">Command Center</h1>

      {/* ================================================================= */}
      {/* KPI CARDS ROW 1                                                   */}
      {/* ================================================================= */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        <KPICard icon={Home} label="Active Listings" value={activeListings.length} />
        <KPICard
          icon={BarChart3}
          label="Occupancy This Month"
          value={`${occupancyRate}%`}
          dot={occupancyRate >= 70 ? "green" : occupancyRate >= 40 ? "amber" : "red"}
        />
        <KPICard icon={CalendarCheck} label="Confirmed Bookings" value={confirmedReservations.length} dot="green" />
        <KPICard icon={DollarSign} label="Monthly Revenue" value={formatCurrency(monthlyRevenue)} />
        <KPICard
          icon={ClipboardList}
          label="Pending Requests"
          value={pendingRequests.length}
          dot={pendingRequests.length > 0 ? "amber" : "green"}
        />
      </div>

      {/* KPI CARDS ROW 2 */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 mt-3">
        <KPICard
          icon={LogIn}
          label="Check-ins Today"
          value={checkInsToday.length}
          dot={checkInsToday.length > 0 ? "green" : "gray"}
        />
        <KPICard
          icon={LogOut}
          label="Check-outs Today"
          value={checkOutsToday.length}
          dot={checkOutsToday.length > 0 ? "amber" : "gray"}
        />
        <KPICard
          icon={AlertCircle}
          label="Open Requests"
          value={pendingRequests.length}
          dot={pendingRequests.length > 0 ? "amber" : "green"}
        />
        <KPICard
          icon={Star}
          label="Pending Reviews"
          value={pendingReviews.length}
          dot={pendingReviews.length > 0 ? "amber" : "gray"}
        />
        <KPICard
          icon={FileText}
          label="Terms Unsigned"
          value={confirmedReservations.filter((r) => !r.accessCode).length}
          dot={confirmedReservations.filter((r) => !r.accessCode).length > 0 ? "red" : "green"}
        />
      </div>

      {/* ================================================================= */}
      {/* TODAY'S OPERATIONS                                                */}
      {/* ================================================================= */}
      <Section title="Today's Operations" icon={Clock} action={{ label: "Open Portal", href: "/admin/checkin" }}>
        {checkInsToday.length === 0 && checkOutsToday.length === 0 && currentlyStaying.length === 0 ? (
          <div className="bg-white border border-light-gray p-8 text-center">
            <p className="text-sm text-warm-gray">No operations scheduled today.</p>
          </div>
        ) : (
          <div className="bg-white border border-light-gray divide-y divide-light-gray">
            {checkInsToday.map((r) => (
              <OperationRow
                key={`ci-${r.id}`}
                type="Check-in"
                typeColor="green"
                guest={r.guestName}
                property={r.listing?.title || ""}
                status={r.status}
              />
            ))}
            {checkOutsToday.map((r) => (
              <OperationRow
                key={`co-${r.id}`}
                type="Check-out"
                typeColor="amber"
                guest={r.guestName}
                property={r.listing?.title || ""}
                status={r.status}
              />
            ))}
            {currentlyStaying
              .filter(
                (r) =>
                  !checkInsToday.some((ci) => ci.id === r.id) &&
                  !checkOutsToday.some((co) => co.id === r.id)
              )
              .map((r) => (
                <OperationRow
                  key={`stay-${r.id}`}
                  type="Staying"
                  typeColor="blue"
                  guest={r.guestName}
                  property={r.listing?.title || ""}
                  status={r.status}
                />
              ))}
          </div>
        )}
      </Section>

      {/* ================================================================= */}
      {/* REVENUE SNAPSHOT                                                  */}
      {/* ================================================================= */}
      <Section title="Revenue Snapshot" icon={DollarSign} action={{ label: "View Revenue", href: "/admin/revenue" }}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Gross Revenue (MTD)" value={formatCurrency(grossRevenueMTD)} />
          <StatCard label="Avg Daily Rate" value={formatCurrency(Math.round(avgDailyRate))} />
          <StatCard label="RevPAR" value={formatCurrency(Math.round(revPAR))} />
          <StatCard label="Occupancy Rate" value={`${occupancyRate}%`} />
          <StatCard label="Total Bookings (MTD)" value={totalBookingsMTD} />
          <StatCard label="Avg Booking Value" value={formatCurrency(Math.round(avgBookingValue))} />
        </div>
      </Section>

      {/* ================================================================= */}
      {/* BOOKING PIPELINE                                                  */}
      {/* ================================================================= */}
      <Section title="Booking Pipeline" icon={CalendarCheck} action={{ label: "View Bookings", href: "/admin/bookings" }}>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          <PipelineStage label="Pending" count={pendingBookings.length} color="amber" />
          <PipelineStage label="Confirmed" count={confirmedReservations.length} color="blue" />
          <PipelineStage label="Check-in Ready" count={checkInReady.length} color="green" />
          <PipelineStage label="Currently Staying" count={currentlyStaying.length} color="purple" />
          <PipelineStage label="Checkout Pending" count={checkoutPending.length} color="orange" />
          <PipelineStage label="Completed" count={completedBookings.length} color="gray" />
        </div>
      </Section>

      {/* ================================================================= */}
      {/* GUEST REQUESTS                                                    */}
      {/* ================================================================= */}
      <Section title="Guest Requests" icon={MessageSquare} action={{ label: "View All", href: "/admin/checkin" }}>
        {guestRequests.length === 0 ? (
          <div className="bg-white border border-light-gray p-8 text-center">
            <p className="text-sm text-warm-gray">No guest requests yet.</p>
          </div>
        ) : (
          <div className="bg-white border border-light-gray divide-y divide-light-gray">
            {guestRequests.slice(0, 5).map((req) => (
              <div key={req.id} className="px-4 py-3 flex items-start gap-3 text-sm">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                  <CategoryBadge category={req.category} />
                  <PriorityBadge priority={req.priority} />
                  <span className="text-charcoal font-medium">{req.reservation?.guestName || "Guest"}</span>
                  <span className="text-warm-gray">&middot;</span>
                  <span className="text-warm-gray text-xs">{req.reservation?.listing?.title || ""}</span>
                </div>
                <div className="hidden md:block text-xs text-warm-gray max-w-[200px] truncate flex-shrink-0">
                  {truncate(req.message || "", 60)}
                </div>
                <StatusBadge status={req.status} />
                <span className="text-[10px] text-warm-gray whitespace-nowrap flex-shrink-0">
                  {timeAgo(req.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ================================================================= */}
      {/* AVAILABILITY PREVIEW (Mini Calendar)                              */}
      {/* ================================================================= */}
      <Section title="Availability Preview" icon={Calendar} action={{ label: "Open Calendar", href: "/admin/availability" }}>
        {activeListings.length === 0 ? (
          <div className="bg-white border border-light-gray p-8 text-center">
            <p className="text-sm text-warm-gray">No active listings to display.</p>
          </div>
        ) : (
          <div className="bg-white border border-light-gray overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-light-gray">
                  <th className="text-left p-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium whitespace-nowrap">
                    Listing
                  </th>
                  {next7Days.map((d) => (
                    <th
                      key={d.toISOString()}
                      className={`p-3 text-center text-[9px] tracking-[0.15em] uppercase font-medium whitespace-nowrap ${
                        isSameDay(d, today) ? "text-charcoal" : "text-warm-gray"
                      }`}
                    >
                      {d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeListings.map((listing) => (
                  <tr key={listing.id} className="border-b border-light-gray last:border-b-0">
                    <td className="p-3 text-charcoal font-medium whitespace-nowrap">{listing.title}</td>
                    {next7Days.map((d) => {
                      const status = getListingDayStatus(listing, d);
                      return (
                        <td key={d.toISOString()} className="p-3 text-center">
                          {status === "booked" ? (
                            <span className="inline-block w-5 h-5 rounded bg-emerald-100 border border-emerald-300" title="Booked" />
                          ) : status === "blocked" ? (
                            <span className="inline-block w-5 h-5 rounded bg-stone-200 border border-stone-300" title="Blocked" />
                          ) : (
                            <span className="inline-block w-5 h-5 rounded border border-light-gray" title="Available" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ================================================================= */}
      {/* WEBSITE READINESS                                                 */}
      {/* ================================================================= */}
      <Section title="Website Readiness" icon={Globe} action={{ label: "Open Content Manager", href: "/admin/content" }}>
        <div className="bg-white border border-light-gray p-5">
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${readinessPercent}%` }}
              />
            </div>
            <span className="text-sm font-serif font-light text-charcoal">
              {readinessScore}/{readinessItems.length}
            </span>
          </div>
          {/* Checklist */}
          <div className="space-y-2">
            {readinessItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                {item.ok ? (
                  <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle size={14} className="text-stone-300 flex-shrink-0" />
                )}
                <span className={item.ok ? "text-charcoal" : "text-warm-gray"}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ================================================================= */}
      {/* INTEGRATIONS                                                      */}
      {/* ================================================================= */}
      <Section
        title="Integrations"
        icon={Plug}
        action={{ label: "Manage Integrations", href: "/admin/revenue?tab=integrations" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {integrations.map((intg) => (
            <div
              key={intg.name}
              className="bg-white border border-light-gray p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Plug size={14} className="text-warm-gray" />
                <span className="text-sm text-charcoal font-medium">{intg.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {intg.connected ? (
                  <span className="text-[9px] tracking-[0.15em] uppercase text-emerald-600 font-medium flex items-center gap-1">
                    <Dot color="green" /> Connected
                  </span>
                ) : (
                  <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium flex items-center gap-1">
                    <Dot color="gray" /> Not Connected
                  </span>
                )}
                <button className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium border border-light-gray px-2.5 py-1 hover:text-charcoal hover:border-stone transition-colors">
                  Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KPICard({
  icon: Icon,
  label,
  value,
  dot,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  dot?: "green" | "amber" | "red" | "gray";
}) {
  return (
    <div className="bg-white border border-light-gray p-4 min-w-[160px] flex-shrink-0">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-warm-gray" />
        <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium whitespace-nowrap">
          {label}
        </span>
        {dot && <Dot color={dot} />}
      </div>
      <p className="text-xl font-light text-charcoal mt-2 font-serif">{value}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-light-gray p-4">
      <div className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">{label}</div>
      <div className="text-lg font-serif font-light text-charcoal">{value}</div>
    </div>
  );
}

function PipelineStage({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "amber" | "blue" | "green" | "purple" | "orange" | "gray";
}) {
  const bgMap: Record<string, string> = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    gray: "bg-stone-50 text-stone-600 border-stone-200",
  };
  return (
    <div
      className={`border rounded px-4 py-3 min-w-[130px] flex-shrink-0 text-center ${bgMap[color]}`}
    >
      <div className="text-xl font-serif font-light">{count}</div>
      <div className="text-[9px] tracking-[0.15em] uppercase font-medium mt-0.5 whitespace-nowrap">{label}</div>
    </div>
  );
}

function OperationRow({
  type,
  typeColor,
  guest,
  property,
  status,
}: {
  type: string;
  typeColor: "green" | "amber" | "blue";
  guest: string;
  property: string;
  status: string;
}) {
  const colorMap: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <div className="px-4 py-3 flex items-center gap-3 text-sm">
      <span className={`text-[9px] tracking-[0.15em] uppercase font-medium px-2 py-0.5 rounded ${colorMap[typeColor]}`}>
        {type}
      </span>
      <span className="text-charcoal font-medium flex-1 min-w-0 truncate">{guest}</span>
      <span className="text-warm-gray text-xs hidden sm:block flex-shrink-0">{property}</span>
      <StatusBadge status={status} />
      <div className="flex gap-1 flex-shrink-0">
        <Link
          href="/admin/checkin"
          className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium border border-light-gray px-2 py-1 hover:text-charcoal hover:border-stone transition-colors whitespace-nowrap"
        >
          Portal
        </Link>
        <Link
          href="/admin/bookings"
          className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium border border-light-gray px-2 py-1 hover:text-charcoal hover:border-stone transition-colors whitespace-nowrap"
        >
          Booking
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    resolved: "bg-stone-100 text-stone-600",
    closed: "bg-stone-100 text-stone-600",
    completed: "bg-stone-100 text-stone-600",
    cancelled: "bg-red-50 text-red-600",
  };
  const cls = map[status] || "bg-stone-100 text-stone-600";
  return (
    <span className={`text-[9px] tracking-[0.15em] uppercase font-medium px-2 py-0.5 rounded flex-shrink-0 ${cls}`}>
      {status}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    maintenance: "bg-orange-50 text-orange-700",
    housekeeping: "bg-blue-50 text-blue-700",
    amenity: "bg-purple-50 text-purple-700",
    question: "bg-stone-100 text-stone-600",
    complaint: "bg-red-50 text-red-600",
    request: "bg-amber-50 text-amber-700",
  };
  const cls = colors[category?.toLowerCase()] || "bg-stone-100 text-stone-600";
  return (
    <span className={`text-[9px] tracking-[0.15em] uppercase font-medium px-2 py-0.5 rounded flex-shrink-0 ${cls}`}>
      {category || "other"}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    low: "text-stone-500",
    normal: "text-blue-600",
    high: "text-amber-600",
    urgent: "text-red-600",
  };
  const dotColors: Record<string, "gray" | "blue" | "amber" | "red"> = {
    low: "gray",
    normal: "blue",
    high: "amber",
    urgent: "red",
  };
  const p = priority?.toLowerCase() || "normal";
  return (
    <span className={`text-[9px] tracking-[0.15em] uppercase font-medium flex items-center gap-1 ${colors[p] || "text-stone-500"}`}>
      <Dot color={dotColors[p] || "gray"} />
      {priority || "normal"}
    </span>
  );
}
