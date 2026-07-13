"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileCheck,
  ClipboardList,
  KeyRound,
  MapPin,
  MessageSquare,
  Star,
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Clock,
  Reply,
  LayoutDashboard,
  Zap,
  Lock,
  Unlock,
  AlertTriangle,
  Search,
  Eye,
  EyeOff,
  Shield,
  Wifi,
  Car,
  Thermometer,
  Tv,
  Trash,
  WashingMachine,
  Phone,
  BookOpen,
  Volume2,
  AlertCircle,
  Coffee,
  UtensilsCrossed,
  Music,
  ShoppingBag,
  Bus,
  Stethoscope,
  Heart,
  Sparkles,
  RefreshCw,
  ExternalLink,
  DollarSign,
  Globe,
  ChevronUp,
  Edit3,
  X,
  ToggleLeft,
  ToggleRight,
  Link,
  CalendarCheck,
  Users,
  Mail,
  Bell,
  Send,
  Flag,
  Plug,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Listing {
  id: string;
  title: string;
  slug: string;
}

interface Reservation {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: string;
  notes?: string;
  listingId: string;
  channel?: string;
  accessCode?: string;
  portalToken?: string;
  portalExpires?: string;
  portalRevoked: boolean;
  listing: { title: string; slug: string };
  agreement?: {
    id: string;
    signedName: string;
    signedAt: string;
    ipAddress?: string;
    documentHash: string;
  };
  guestRequests?: any[];
  guestReviews?: any[];
}

type Tab =
  | "overview"
  | "terms"
  | "inventory"
  | "instructions"
  | "recommendations"
  | "reviews"
  | "requests"
  | "automations"
  | "smartlocks";

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AdminCheckInPage() {
  const [activeSection, setActiveSection] = useState<Tab>("overview");
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [guestRequests, setGuestRequests] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [bookingFilter, setBookingFilter] = useState("all");
  const [guestSearch, setGuestSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/listings").then((r) => r.json()).catch(() => []),
      fetch("/api/admin/reservations").then((r) => r.json()).catch(() => []),
      fetch("/api/admin/guest-requests").then((r) => r.json()).catch(() => []),
      fetch("/api/admin/reviews").then((r) => r.json()).catch(() => []),
    ]).then(([listingsData, reservationsData, requestsData, reviewsData]) => {
      setListings(listingsData);
      if (listingsData.length > 0) setSelectedListing(listingsData[0].id);
      setReservations(reservationsData);
      setGuestRequests(requestsData);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      setLoading(false);
    });
  }, []);

  function reloadReservations() {
    fetch("/api/admin/reservations").then((r) => r.json()).then(setReservations).catch(() => {});
  }

  function reloadRequests() {
    fetch("/api/admin/guest-requests").then((r) => r.json()).then(setGuestRequests).catch(() => {});
  }

  function reloadReviews() {
    fetch("/api/admin/reviews").then((r) => r.json()).then((d) => setReviews(Array.isArray(d) ? d : [])).catch(() => {});
  }

  // ─── Status Card Computations ─────────────────────────────────────────

  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcomingCheckins = reservations.filter((r) => {
    const ci = new Date(r.checkIn);
    return ci >= now && ci <= in7days && r.status === "confirmed";
  }).length;

  const termsSigned = reservations.filter((r) => r.agreement).length;

  const accessUnlocked = reservations.filter((r) => {
    if (!r.agreement) return false;
    const ci = new Date(r.checkIn);
    const co = new Date(r.checkOut);
    return ci <= now && co >= now;
  }).length;

  const pendingSignatures = reservations.filter(
    (r) => r.status === "confirmed" && !r.agreement
  ).length;

  const openRequests = guestRequests.filter(
    (r) => r.status !== "resolved" && r.status !== "closed"
  ).length;

  const pendingReviews = reviews.filter(
    (r) => r.approvalStatus === "pending"
  ).length;

  const statusCards = [
    { label: "Upcoming Check-ins", value: upcomingCheckins, icon: CalendarCheck },
    { label: "Terms Signed", value: termsSigned, icon: FileCheck },
    { label: "Access Unlocked", value: accessUnlocked, icon: Unlock },
    { label: "Pending Signatures", value: pendingSignatures, icon: Clock },
    { label: "Open Requests", value: openRequests, icon: MessageSquare },
    { label: "Inventory Issues", value: 0, icon: AlertTriangle },
    { label: "Pending Reviews", value: pendingReviews, icon: Star },
  ];

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "terms", label: "Terms & Conditions", icon: FileCheck },
    { key: "inventory", label: "Inventory", icon: ClipboardList },
    { key: "instructions", label: "Instructions & Codes", icon: KeyRound },
    { key: "recommendations", label: "Things to Do", icon: MapPin },
    { key: "reviews", label: "Guest Reviews", icon: Star },
    { key: "requests", label: "Guest Requests", icon: MessageSquare },
    { key: "automations", label: "Automations", icon: Zap },
    { key: "smartlocks", label: "Smart Locks", icon: Lock },
  ];

  return (
    <div>
      <h1 className="text-xl font-light text-charcoal mb-6">
        Guest Portal & Operations
      </h1>

      {/* ─── Status Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
        {statusCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-light-gray px-4 py-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <card.icon size={12} className="text-warm-gray" />
              <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
                {card.label}
              </span>
            </div>
            <p className="text-lg font-serif text-charcoal">
              {loading ? "..." : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* ─── Booking / Property Selector Bar ──────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <div>
          <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
            Property
          </label>
          <select
            value={selectedListing}
            onChange={(e) => setSelectedListing(e.target.value)}
            className="border border-light-gray px-3 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:border-charcoal min-w-[200px]"
          >
            <option value="">All Properties</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
            Booking Filter
          </label>
          <select
            value={bookingFilter}
            onChange={(e) => setBookingFilter(e.target.value)}
            className="border border-light-gray px-3 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:border-charcoal min-w-[160px]"
          >
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="past">Past</option>
            <option value="pending-signature">Pending Signature</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
            Guest Search
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray"
            />
            <input
              value={guestSearch}
              onChange={(e) => setGuestSearch(e.target.value)}
              placeholder="Search by guest name or email..."
              className="w-full border border-light-gray pl-9 pr-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
            />
          </div>
        </div>
      </div>

      {/* ─── Tab Navigation ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveSection(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[10px] tracking-[0.1em] uppercase font-medium border transition-colors ${
              activeSection === t.key
                ? "bg-charcoal text-white border-charcoal"
                : "bg-white text-warm-gray border-light-gray hover:border-charcoal hover:text-charcoal"
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ──────────────────────────────────────────────── */}
      {activeSection === "overview" && (
        <OverviewTab
          reservations={reservations}
          listings={listings}
          selectedListing={selectedListing}
          bookingFilter={bookingFilter}
          guestSearch={guestSearch}
        />
      )}
      {activeSection === "terms" && (
        <TermsTab reservations={reservations} />
      )}
      {activeSection === "inventory" && (
        <InventoryTab
          listingId={selectedListing}
          listings={listings}
          onSelectListing={setSelectedListing}
        />
      )}
      {activeSection === "instructions" && (
        <InstructionsTab
          listingId={selectedListing}
          listings={listings}
          onSelectListing={setSelectedListing}
        />
      )}
      {activeSection === "recommendations" && <RecommendationsTab />}
      {activeSection === "reviews" && (
        <ReviewsTab
          reviews={reviews}
          reservations={reservations}
          onReload={reloadReviews}
        />
      )}
      {activeSection === "requests" && (
        <RequestsTab
          requests={guestRequests}
          onReload={reloadRequests}
        />
      )}
      {activeSection === "automations" && <AutomationsTab />}
      {activeSection === "smartlocks" && <SmartLocksTab />}
    </div>
  );
}

// ─── Helper: Format Date ────────────────────────────────────────────────────

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function fmtFull(d: string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Helper: Badge ──────────────────────────────────────────────────────────

function Badge({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: "gray" | "green" | "red" | "amber" | "blue" | "purple" | "emerald";
}) {
  const colors = {
    gray: "bg-gray-50 text-gray-600",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span
      className={`text-[9px] tracking-[0.15em] uppercase font-medium px-2 py-0.5 ${colors[color]}`}
    >
      {children}
    </span>
  );
}

// ─── Helper: Star Rating ────────────────────────────────────────────────────

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={12}
          className={
            i < rating
              ? "text-amber-400 fill-amber-400"
              : "text-gray-200"
          }
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1: OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════

function OverviewTab({
  reservations,
  listings,
  selectedListing,
  bookingFilter,
  guestSearch,
}: {
  reservations: Reservation[];
  listings: Listing[];
  selectedListing: string;
  bookingFilter: string;
  guestSearch: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const now = new Date();

  let filtered = reservations;

  if (selectedListing) {
    filtered = filtered.filter((r) => r.listingId === selectedListing);
  }

  if (guestSearch.trim()) {
    const q = guestSearch.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.guestName.toLowerCase().includes(q) ||
        r.guestEmail.toLowerCase().includes(q)
    );
  }

  if (bookingFilter === "upcoming") {
    filtered = filtered.filter((r) => new Date(r.checkIn) > now);
  } else if (bookingFilter === "active") {
    filtered = filtered.filter(
      (r) => new Date(r.checkIn) <= now && new Date(r.checkOut) >= now
    );
  } else if (bookingFilter === "past") {
    filtered = filtered.filter((r) => new Date(r.checkOut) < now);
  } else if (bookingFilter === "pending-signature") {
    filtered = filtered.filter(
      (r) => r.status === "confirmed" && !r.agreement
    );
  }

  return (
    <div className="bg-white border border-light-gray">
      <div className="px-6 py-3 border-b border-light-gray bg-cream/50 flex items-center justify-between">
        <h3 className="text-[10px] tracking-[0.15em] uppercase font-medium text-charcoal">
          Bookings ({filtered.length})
        </h3>
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Users size={32} className="mx-auto text-warm-gray/30 mb-3" />
          <p className="text-sm text-warm-gray">No bookings match your filters.</p>
        </div>
      ) : (
        <div className="divide-y divide-light-gray">
          {filtered.map((res) => {
            const isExpanded = expandedId === res.id;
            const channelColor =
              res.channel === "airbnb"
                ? "red"
                : res.channel === "vrbo"
                ? "blue"
                : res.channel === "booking"
                ? "blue"
                : "gray";

            return (
              <div key={res.id}>
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : res.id)
                  }
                  className="w-full px-6 py-3 flex items-center gap-4 text-left hover:bg-cream/30 transition-colors"
                >
                  <div className="shrink-0">
                    {isExpanded ? (
                      <ChevronDown size={14} className="text-warm-gray" />
                    ) : (
                      <ChevronRight size={14} className="text-warm-gray" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-charcoal">
                        {res.guestName}
                      </span>
                      {res.channel && (
                        <Badge color={channelColor}>{res.channel}</Badge>
                      )}
                      {res.agreement ? (
                        <Badge color="green">Signed</Badge>
                      ) : (
                        <Badge color="amber">Unsigned</Badge>
                      )}
                      <Badge
                        color={
                          res.status === "confirmed"
                            ? "green"
                            : res.status === "cancelled"
                            ? "red"
                            : "gray"
                        }
                      >
                        {res.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-warm-gray mt-0.5">
                      {res.listing?.title} &middot; {fmt(res.checkIn)} &ndash;{" "}
                      {fmt(res.checkOut)} &middot; {res.guests} guest
                      {res.guests !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-sm font-serif text-charcoal shrink-0">
                    ${res.totalPrice.toLocaleString()}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-4 pl-14 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">
                          Email
                        </p>
                        <p className="text-sm text-charcoal">{res.guestEmail}</p>
                      </div>
                      <div>
                        <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">
                          Phone
                        </p>
                        <p className="text-sm text-charcoal">
                          {res.guestPhone || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">
                          Access Code
                        </p>
                        <p className="text-sm text-charcoal font-mono">
                          {res.accessCode || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">
                          Portal Status
                        </p>
                        <p className="text-sm text-charcoal">
                          {res.portalRevoked
                            ? "Revoked"
                            : res.portalToken
                            ? "Active"
                            : "Not sent"}
                        </p>
                      </div>
                    </div>
                    {res.agreement && (
                      <div className="bg-green-50/50 border border-green-100 px-4 py-2">
                        <p className="text-[9px] tracking-[0.15em] uppercase text-green-700 font-medium mb-0.5">
                          Agreement Signed
                        </p>
                        <p className="text-xs text-charcoal">
                          Signed by {res.agreement.signedName} on{" "}
                          {fmtFull(res.agreement.signedAt)}
                          {res.agreement.ipAddress &&
                            ` from ${res.agreement.ipAddress}`}
                        </p>
                      </div>
                    )}
                    {res.notes && (
                      <div>
                        <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">
                          Notes
                        </p>
                        <p className="text-sm text-charcoal">{res.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2: TERMS & CONDITIONS
// ═══════════════════════════════════════════════════════════════════════════

function TermsTab({ reservations }: { reservations: Reservation[] }) {
  const [terms, setTerms] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((data) => {
        const item = data.find((c: any) => c.key === "checkin-terms");
        if (item) setTerms(item.value);
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            key: "checkin-terms",
            value: terms,
            section: "checkin",
            label: "Terms & Conditions",
          },
        ],
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function syncFromContent() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/content");
      const data = await res.json();
      const policies = data.find(
        (c: any) => c.key === "policies-terms" || c.key === "terms-and-conditions"
      );
      if (policies) {
        setTerms(policies.value);
      } else {
        alert("No policies/terms content found in website content to sync.");
      }
    } catch {
      alert("Failed to fetch content.");
    }
    setSyncing(false);
  }

  const signedAgreements = reservations.filter((r) => r.agreement);

  return (
    <div className="space-y-4">
      {/* Terms Editor */}
      <div className="bg-white border border-light-gray p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-medium text-charcoal">
              Terms, Rules & Conditions
            </h2>
            <p className="text-xs text-warm-gray mt-0.5">
              This document must be signed by guests before they can access
              check-in details.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={syncFromContent}
              disabled={syncing}
              className="flex items-center gap-2 border border-light-gray text-warm-gray px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:border-charcoal hover:text-charcoal disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing..." : "Sync from Website Content"}
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90 disabled:opacity-50"
            >
              {saved ? <CheckCircle size={14} /> : <Save size={14} />}
              {saved ? "Saved" : saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
        <textarea
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={20}
          className="w-full border border-light-gray px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-charcoal resize-y font-mono leading-relaxed"
          placeholder="Enter your property terms, rules, and conditions here..."
        />
      </div>

      {/* Signed Agreements Table */}
      <div className="bg-white border border-light-gray">
        <div className="px-6 py-3 border-b border-light-gray bg-cream/50">
          <h3 className="text-[10px] tracking-[0.15em] uppercase font-medium text-charcoal">
            Signed Agreements ({signedAgreements.length})
          </h3>
        </div>
        {signedAgreements.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <FileCheck size={24} className="mx-auto text-warm-gray/30 mb-2" />
            <p className="text-sm text-warm-gray">
              No signed agreements yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-light-gray">
            <div className="px-6 py-2 grid grid-cols-5 gap-4 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
              <span>Guest</span>
              <span>Property</span>
              <span>Signed At</span>
              <span>IP Address</span>
              <span>Document Hash</span>
            </div>
            {signedAgreements.map((r) => (
              <div
                key={r.id}
                className="px-6 py-2.5 grid grid-cols-5 gap-4 items-center"
              >
                <span className="text-sm text-charcoal">
                  {r.agreement!.signedName}
                </span>
                <span className="text-xs text-warm-gray">
                  {r.listing?.title}
                </span>
                <span className="text-xs text-warm-gray">
                  {fmtFull(r.agreement!.signedAt)}
                </span>
                <span className="text-xs text-warm-gray font-mono">
                  {r.agreement!.ipAddress || "N/A"}
                </span>
                <span className="text-xs text-warm-gray font-mono truncate">
                  {r.agreement!.documentHash.substring(0, 16)}...
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3: INVENTORY
// ═══════════════════════════════════════════════════════════════════════════

function InventoryTab({
  listingId,
  listings,
  onSelectListing,
}: {
  listingId: string;
  listings: Listing[];
  onSelectListing: (id: string) => void;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newRoom, setNewRoom] = useState("");
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newQty, setNewQty] = useState(1);
  const [newExpected, setNewExpected] = useState(1);
  const [newCondition, setNewCondition] = useState("good");
  const [newCost, setNewCost] = useState(0);
  const [newVisible, setNewVisible] = useState(true);
  const [newNotes, setNewNotes] = useState("");

  const categories = [
    "General",
    "Linens",
    "Toiletries",
    "Kitchen",
    "Electronics",
    "Furniture",
    "Cleaning",
    "Safety",
  ];
  const conditions = ["New", "Good", "Fair", "Poor", "Replace"];

  const load = useCallback(() => {
    if (!listingId) return;
    fetch(`/api/admin/inventory?listingId=${listingId}`)
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, [listingId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addItem() {
    if (!newRoom.trim() || !newItem.trim()) return;
    await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        room: newRoom.trim(),
        itemName: newItem.trim(),
        category: newCategory,
        quantity: newQty,
        quantityExpected: newExpected,
        condition: newCondition.toLowerCase(),
        replacementCost: newCost,
        guestVisible: newVisible,
        notes: newNotes.trim() || null,
      }),
    });
    setNewItem("");
    setNewQty(1);
    setNewExpected(1);
    setNewCondition("good");
    setNewCost(0);
    setNewNotes("");
    setShowForm(false);
    load();
  }

  async function deleteItem(id: string) {
    await fetch("/api/admin/inventory", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  async function markChecked(id: string) {
    await fetch("/api/admin/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, lastChecked: new Date().toISOString() }),
    });
    load();
  }

  const rooms = items.reduce<Record<string, any[]>>((acc, item) => {
    (acc[item.room] ||= []).push(item);
    return acc;
  }, {});

  if (!listingId) {
    return (
      <div className="bg-white border border-light-gray p-8 text-center">
        <ClipboardList size={32} className="mx-auto text-warm-gray/30 mb-3" />
        <p className="text-sm text-warm-gray">
          Select a property from the dropdown above to manage inventory.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Form Toggle */}
      <div className="bg-white border border-light-gray">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full px-6 py-3 flex items-center justify-between hover:bg-cream/30 transition-colors"
        >
          <span className="text-sm font-medium text-charcoal flex items-center gap-2">
            <Plus size={14} /> Add Inventory Item
          </span>
          {showForm ? (
            <ChevronUp size={14} className="text-warm-gray" />
          ) : (
            <ChevronDown size={14} className="text-warm-gray" />
          )}
        </button>

        {showForm && (
          <div className="px-6 pb-6 border-t border-light-gray pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Room
                </label>
                <input
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  placeholder="e.g. Master Bedroom"
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Item Name
                </label>
                <input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="e.g. Bath Towels"
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:border-charcoal"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Quantity
                </label>
                <input
                  type="number"
                  value={newQty}
                  onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Expected Qty
                </label>
                <input
                  type="number"
                  value={newExpected}
                  onChange={(e) => setNewExpected(parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Condition
                </label>
                <select
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:border-charcoal"
                >
                  {conditions.map((c) => (
                    <option key={c} value={c.toLowerCase()}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Replacement Cost ($)
                </label>
                <input
                  type="number"
                  value={newCost}
                  onChange={(e) => setNewCost(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.01}
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setNewVisible(!newVisible)}
                    className="text-charcoal"
                  >
                    {newVisible ? (
                      <ToggleRight size={24} className="text-charcoal" />
                    ) : (
                      <ToggleLeft size={24} className="text-warm-gray" />
                    )}
                  </button>
                  <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
                    Guest Visible
                  </span>
                </label>
              </div>
              <div className="md:col-span-3">
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Notes (optional)
                </label>
                <input
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Any notes about this item..."
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={addItem}
                className="flex items-center gap-2 bg-charcoal text-white px-6 py-2.5 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Items by Room */}
      {Object.entries(rooms).map(([room, roomItems]) => (
        <div key={room} className="bg-white border border-light-gray">
          <div className="px-6 py-3 border-b border-light-gray bg-cream/50 flex items-center justify-between">
            <h3 className="text-[10px] tracking-[0.15em] uppercase font-medium text-charcoal">
              {room} ({roomItems.length} items)
            </h3>
          </div>
          <div className="divide-y divide-light-gray">
            {roomItems.map((item: any) => {
              const conditionColor =
                item.condition === "new"
                  ? "green"
                  : item.condition === "good"
                  ? "emerald"
                  : item.condition === "fair"
                  ? "amber"
                  : item.condition === "poor"
                  ? "red"
                  : item.condition === "replace"
                  ? "red"
                  : "gray";
              const qtyMismatch = item.quantity < item.quantityExpected;

              return (
                <div key={item.id} className="px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-medium text-charcoal">
                        {item.itemName}
                      </span>
                      <Badge color="gray">{item.category}</Badge>
                      <Badge color={conditionColor}>{item.condition}</Badge>
                      {!item.guestVisible && (
                        <EyeOff size={12} className="text-warm-gray" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => markChecked(item.id)}
                        className="text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-1 border border-light-gray text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors"
                        title="Mark as checked"
                      >
                        <CheckCircle size={12} />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-warm-gray hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-warm-gray">
                    <span className={qtyMismatch ? "text-red-600 font-medium" : ""}>
                      Qty: {item.quantity}/{item.quantityExpected}
                    </span>
                    {item.replacementCost > 0 && (
                      <span>Cost: ${item.replacementCost.toFixed(2)}</span>
                    )}
                    {item.lastChecked && (
                      <span>Checked: {fmt(item.lastChecked)}</span>
                    )}
                    {item.notes && (
                      <span className="italic">{item.notes}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {Object.keys(rooms).length === 0 && (
        <div className="bg-white border border-light-gray p-8 text-center">
          <ClipboardList size={24} className="mx-auto text-warm-gray/30 mb-2" />
          <p className="text-sm text-warm-gray">
            No inventory items yet. Add items above.
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 4: INSTRUCTIONS & CODES
// ═══════════════════════════════════════════════════════════════════════════

function InstructionsTab({
  listingId,
  listings,
  onSelectListing,
}: {
  listingId: string;
  listings: Listing[];
  onSelectListing: (id: string) => void;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newCat, setNewCat] = useState("Check-In");
  const [newTitle, setNewTitle] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newSensitive, setNewSensitive] = useState(false);
  const [newVisibleHours, setNewVisibleHours] = useState(0);
  const [newAdminNotes, setNewAdminNotes] = useState("");

  const categories = [
    "Check-In",
    "Check-Out",
    "Door Codes",
    "WiFi",
    "Parking",
    "Smart Lock",
    "Thermostat",
    "TV/Remote",
    "Trash",
    "Laundry",
    "Emergency",
    "House Manual",
    "Quiet Hours",
    "Damage Reporting",
  ];

  const load = useCallback(() => {
    if (!listingId) return;
    fetch(`/api/admin/instructions?listingId=${listingId}`)
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, [listingId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addItem() {
    if (!newTitle.trim() || !newValue.trim()) return;
    await fetch("/api/admin/instructions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        category: newCat,
        title: newTitle.trim(),
        value: newValue.trim(),
        sensitive: newSensitive,
        visibleBeforeHours: newVisibleHours,
        adminNotes: newAdminNotes.trim() || null,
      }),
    });
    setNewTitle("");
    setNewValue("");
    setNewSensitive(false);
    setNewVisibleHours(0);
    setNewAdminNotes("");
    setShowForm(false);
    load();
  }

  async function deleteItem(id: string) {
    await fetch("/api/admin/instructions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  const grouped = items.reduce<Record<string, any[]>>((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  if (!listingId) {
    return (
      <div className="bg-white border border-light-gray p-8 text-center">
        <KeyRound size={32} className="mx-auto text-warm-gray/30 mb-3" />
        <p className="text-sm text-warm-gray">
          Select a property from the dropdown above to manage instructions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Form */}
      <div className="bg-white border border-light-gray">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full px-6 py-3 flex items-center justify-between hover:bg-cream/30 transition-colors"
        >
          <span className="text-sm font-medium text-charcoal flex items-center gap-2">
            <Plus size={14} /> Add Instruction / Code
          </span>
          {showForm ? (
            <ChevronUp size={14} className="text-warm-gray" />
          ) : (
            <ChevronDown size={14} className="text-warm-gray" />
          )}
        </button>

        {showForm && (
          <div className="px-6 pb-6 border-t border-light-gray pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Category
                </label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="w-full border border-light-gray px-3 py-2.5 text-sm bg-white text-charcoal focus:outline-none focus:border-charcoal"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Title
                </label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Front Door Code"
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Value / Instructions
                </label>
                <textarea
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Enter the instruction details..."
                  rows={3}
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal resize-none"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setNewSensitive(!newSensitive)}
                    className="text-charcoal"
                  >
                    {newSensitive ? (
                      <ToggleRight size={24} className="text-charcoal" />
                    ) : (
                      <ToggleLeft size={24} className="text-warm-gray" />
                    )}
                  </button>
                  <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
                    Sensitive (hidden until signed)
                  </span>
                </label>
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Show X Hours Before Check-in
                </label>
                <input
                  type="number"
                  value={newVisibleHours}
                  onChange={(e) =>
                    setNewVisibleHours(parseInt(e.target.value) || 0)
                  }
                  min={0}
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Admin Notes (optional)
                </label>
                <input
                  value={newAdminNotes}
                  onChange={(e) => setNewAdminNotes(e.target.value)}
                  placeholder="Internal notes, not shown to guests..."
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={addItem}
                className="flex items-center gap-2 bg-charcoal text-white px-6 py-2.5 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90"
              >
                <Plus size={14} /> Add Instruction
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Items by Category */}
      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} className="bg-white border border-light-gray">
          <div className="px-6 py-3 border-b border-light-gray bg-cream/50">
            <h3 className="text-[10px] tracking-[0.15em] uppercase font-medium text-charcoal">
              {cat} ({catItems.length})
            </h3>
          </div>
          <div className="divide-y divide-light-gray">
            {catItems.map((item: any) => (
              <div
                key={item.id}
                className="px-6 py-3 flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    {item.sensitive && (
                      <Lock size={12} className="text-amber-500" />
                    )}
                    <p className="text-xs text-warm-gray">{item.title}</p>
                    {item.visibleBeforeHours > 0 && (
                      <span className="text-[9px] text-warm-gray/60">
                        (shows {item.visibleBeforeHours}h before)
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-charcoal font-medium whitespace-pre-line">
                    {item.value}
                  </p>
                  {item.adminNotes && (
                    <p className="text-[10px] text-warm-gray/60 mt-1 italic">
                      Admin: {item.adminNotes}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-warm-gray hover:text-red-500 transition-colors shrink-0 mt-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(grouped).length === 0 && (
        <div className="bg-white border border-light-gray p-8 text-center">
          <KeyRound size={24} className="mx-auto text-warm-gray/30 mb-2" />
          <p className="text-sm text-warm-gray">
            No instructions added yet.
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 5: THINGS TO DO (Recommendations)
// ═══════════════════════════════════════════════════════════════════════════

function RecommendationsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newCat, setNewCat] = useState("Restaurants");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAddr, setNewAddr] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDistance, setNewDistance] = useState("");
  const [newMapLink, setNewMapLink] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newBestFor, setNewBestFor] = useState("");
  const [newVisible, setNewVisible] = useState(true);
  const [newFeatured, setNewFeatured] = useState(false);

  const categories = [
    "Restaurants",
    "Coffee Shops",
    "Lounges",
    "Nightlife",
    "Grocery",
    "Events",
    "Festivals",
    "Museums",
    "Family Activities",
    "Shopping",
    "Transportation",
    "Parking",
    "Emergency/Pharmacy",
    "Host Favorites",
  ];

  const priceRanges = ["", "$", "$$", "$$$", "$$$$"];

  function load() {
    fetch("/api/admin/recommendations")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }

  useEffect(() => {
    load();
  }, []);

  async function addItem() {
    if (!newName.trim()) return;
    await fetch("/api/admin/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: newCat,
        name: newName.trim(),
        description: newDesc.trim(),
        address: newAddr.trim() || null,
        link: newLink.trim() || null,
        phone: newPhone.trim() || null,
        distance: newDistance.trim() || null,
        mapLink: newMapLink.trim() || null,
        priceRange: newPrice || null,
        bestFor: newBestFor.trim() || null,
        guestVisible: newVisible,
        featured: newFeatured,
      }),
    });
    setNewName("");
    setNewDesc("");
    setNewAddr("");
    setNewLink("");
    setNewPhone("");
    setNewDistance("");
    setNewMapLink("");
    setNewPrice("");
    setNewBestFor("");
    setNewVisible(true);
    setNewFeatured(false);
    setShowForm(false);
    load();
  }

  async function deleteItem(id: string) {
    await fetch("/api/admin/recommendations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  const grouped = items.reduce<Record<string, any[]>>((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* AI Itinerary Button */}
      <div className="flex justify-end">
        <button
          onClick={() =>
            alert("AI itinerary builder coming soon")
          }
          className="flex items-center gap-2 border border-light-gray text-warm-gray px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:border-charcoal hover:text-charcoal transition-colors"
        >
          <Sparkles size={14} /> AI Itinerary
        </button>
      </div>

      {/* Add Form */}
      <div className="bg-white border border-light-gray">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full px-6 py-3 flex items-center justify-between hover:bg-cream/30 transition-colors"
        >
          <span className="text-sm font-medium text-charcoal flex items-center gap-2">
            <Plus size={14} /> Add Recommendation
          </span>
          {showForm ? (
            <ChevronUp size={14} className="text-warm-gray" />
          ) : (
            <ChevronDown size={14} className="text-warm-gray" />
          )}
        </button>

        {showForm && (
          <div className="px-6 pb-6 border-t border-light-gray pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Category
                </label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="w-full border border-light-gray px-3 py-2.5 text-sm bg-white text-charcoal focus:outline-none focus:border-charcoal"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Name
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Joe's Bistro"
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Price Range
                </label>
                <select
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full border border-light-gray px-3 py-2.5 text-sm bg-white text-charcoal focus:outline-none focus:border-charcoal"
                >
                  {priceRanges.map((p) => (
                    <option key={p} value={p}>
                      {p || "Select..."}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Description
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brief description..."
                  rows={2}
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal resize-none"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Address
                </label>
                <input
                  value={newAddr}
                  onChange={(e) => setNewAddr(e.target.value)}
                  placeholder="123 Main St"
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Website URL
                </label>
                <input
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Phone
                </label>
                <input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Distance
                </label>
                <input
                  value={newDistance}
                  onChange={(e) => setNewDistance(e.target.value)}
                  placeholder="e.g. 0.5 mi"
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Map Link
                </label>
                <input
                  value={newMapLink}
                  onChange={(e) => setNewMapLink(e.target.value)}
                  placeholder="Google Maps URL"
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Best For
                </label>
                <input
                  value={newBestFor}
                  onChange={(e) => setNewBestFor(e.target.value)}
                  placeholder="e.g. Date night, Families"
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div className="flex items-end gap-6 pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setNewVisible(!newVisible)}
                  >
                    {newVisible ? (
                      <ToggleRight size={24} className="text-charcoal" />
                    ) : (
                      <ToggleLeft size={24} className="text-warm-gray" />
                    )}
                  </button>
                  <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
                    Visible
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setNewFeatured(!newFeatured)}
                  >
                    {newFeatured ? (
                      <ToggleRight size={24} className="text-charcoal" />
                    ) : (
                      <ToggleLeft size={24} className="text-warm-gray" />
                    )}
                  </button>
                  <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
                    Featured
                  </span>
                </label>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={addItem}
                className="flex items-center gap-2 bg-charcoal text-white px-6 py-2.5 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90"
              >
                <Plus size={14} /> Add Recommendation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Items by Category */}
      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} className="bg-white border border-light-gray">
          <div className="px-6 py-3 border-b border-light-gray bg-cream/50">
            <h3 className="text-[10px] tracking-[0.15em] uppercase font-medium text-charcoal">
              {cat} ({catItems.length})
            </h3>
          </div>
          <div className="divide-y divide-light-gray">
            {catItems.map((item: any) => (
              <div key={item.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-charcoal">
                        {item.name}
                      </span>
                      {item.featured && (
                        <Star
                          size={12}
                          className="text-amber-400 fill-amber-400"
                        />
                      )}
                      {item.priceRange && (
                        <Badge color="gray">{item.priceRange}</Badge>
                      )}
                      {!item.guestVisible && (
                        <EyeOff size={12} className="text-warm-gray" />
                      )}
                    </div>
                    <p className="text-xs text-warm-gray mb-1">
                      {item.description}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-warm-gray/70">
                      {item.address && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} /> {item.address}
                        </span>
                      )}
                      {item.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={10} /> {item.phone}
                        </span>
                      )}
                      {item.distance && <span>{item.distance}</span>}
                      {item.bestFor && <span>Best for: {item.bestFor}</span>}
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-charcoal/60 hover:text-charcoal"
                        >
                          <ExternalLink size={10} /> Website
                        </a>
                      )}
                      {item.mapLink && (
                        <a
                          href={item.mapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-charcoal/60 hover:text-charcoal"
                        >
                          <MapPin size={10} /> Map
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-warm-gray hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(grouped).length === 0 && (
        <div className="bg-white border border-light-gray p-8 text-center">
          <MapPin size={24} className="mx-auto text-warm-gray/30 mb-2" />
          <p className="text-sm text-warm-gray">
            No recommendations yet. Add some above.
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 6: GUEST REVIEWS
// ═══════════════════════════════════════════════════════════════════════════

function ReviewsTab({
  reviews,
  reservations,
  onReload,
}: {
  reviews: any[];
  reservations: Reservation[];
  onReload: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [responseText, setResponseText] = useState<Record<string, string>>({});
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  // Add manual review form state
  const [newResId, setNewResId] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newComments, setNewComments] = useState("");
  const [newSource, setNewSource] = useState("direct");
  const [newClean, setNewClean] = useState<number | "">("");
  const [newAccuracy, setNewAccuracy] = useState<number | "">("");
  const [newComm, setNewComm] = useState<number | "">("");
  const [newLocation, setNewLocation] = useState<number | "">("");
  const [newValue, setNewValue] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  const sources = ["direct", "airbnb", "vrbo", "booking.com", "google"];

  async function addReview() {
    if (!newResId) return;
    setSaving(true);
    try {
      await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: newResId,
          overallRating: newRating,
          comments: newComments.trim() || null,
          source: newSource,
          cleanlinessRating: newClean || null,
          accuracyRating: newAccuracy || null,
          communicationRating: newComm || null,
          locationRating: newLocation || null,
          valueRating: newValue || null,
        }),
      });
      setShowAddForm(false);
      setNewResId("");
      setNewRating(5);
      setNewComments("");
      setNewSource("direct");
      setNewClean("");
      setNewAccuracy("");
      setNewComm("");
      setNewLocation("");
      setNewValue("");
      onReload();
    } catch {
      alert("Failed to add review. The API endpoint may not exist yet.");
    }
    setSaving(false);
  }

  async function updateReview(id: string, data: Record<string, any>) {
    try {
      await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      onReload();
    } catch {
      alert("Failed to update review.");
    }
  }

  async function submitResponse(id: string) {
    const text = responseText[id];
    if (!text?.trim()) return;
    await updateReview(id, { adminResponse: text.trim() });
    setRespondingTo(null);
    setResponseText((prev) => ({ ...prev, [id]: "" }));
  }

  const sourceColors: Record<string, "red" | "blue" | "purple" | "green" | "gray"> = {
    airbnb: "red",
    vrbo: "blue",
    "booking.com": "blue",
    google: "green",
    direct: "gray",
  };

  return (
    <div className="space-y-4">
      {/* Add Manual Review */}
      <div className="bg-white border border-light-gray">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full px-6 py-3 flex items-center justify-between hover:bg-cream/30 transition-colors"
        >
          <span className="text-sm font-medium text-charcoal flex items-center gap-2">
            <Plus size={14} /> Add Manual Review
          </span>
          {showAddForm ? (
            <ChevronUp size={14} className="text-warm-gray" />
          ) : (
            <ChevronDown size={14} className="text-warm-gray" />
          )}
        </button>

        {showAddForm && (
          <div className="px-6 pb-6 border-t border-light-gray pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Reservation
                </label>
                <select
                  value={newResId}
                  onChange={(e) => setNewResId(e.target.value)}
                  className="w-full border border-light-gray px-3 py-2.5 text-sm bg-white text-charcoal focus:outline-none focus:border-charcoal"
                >
                  <option value="">Select reservation...</option>
                  {reservations.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.guestName} - {r.listing?.title} ({fmt(r.checkIn)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Source
                </label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full border border-light-gray px-3 py-2.5 text-sm bg-white text-charcoal focus:outline-none focus:border-charcoal"
                >
                  {sources.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Overall Rating (1-5)
                </label>
                <input
                  type="number"
                  value={newRating}
                  onChange={(e) => setNewRating(parseInt(e.target.value) || 5)}
                  min={1}
                  max={5}
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Cleanliness
                </label>
                <input
                  type="number"
                  value={newClean}
                  onChange={(e) =>
                    setNewClean(e.target.value ? parseInt(e.target.value) : "")
                  }
                  min={1}
                  max={5}
                  placeholder="1-5"
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Accuracy
                </label>
                <input
                  type="number"
                  value={newAccuracy}
                  onChange={(e) =>
                    setNewAccuracy(
                      e.target.value ? parseInt(e.target.value) : ""
                    )
                  }
                  min={1}
                  max={5}
                  placeholder="1-5"
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Communication
                </label>
                <input
                  type="number"
                  value={newComm}
                  onChange={(e) =>
                    setNewComm(e.target.value ? parseInt(e.target.value) : "")
                  }
                  min={1}
                  max={5}
                  placeholder="1-5"
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Location
                </label>
                <input
                  type="number"
                  value={newLocation}
                  onChange={(e) =>
                    setNewLocation(
                      e.target.value ? parseInt(e.target.value) : ""
                    )
                  }
                  min={1}
                  max={5}
                  placeholder="1-5"
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div>
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Value
                </label>
                <input
                  type="number"
                  value={newValue}
                  onChange={(e) =>
                    setNewValue(e.target.value ? parseInt(e.target.value) : "")
                  }
                  min={1}
                  max={5}
                  placeholder="1-5"
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[9px] tracking-[0.15em] uppercase text-warm-gray mb-1.5 font-medium">
                  Comments
                </label>
                <textarea
                  value={newComments}
                  onChange={(e) => setNewComments(e.target.value)}
                  rows={3}
                  placeholder="Guest review comments..."
                  className="w-full border border-light-gray px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={addReview}
                disabled={saving || !newResId}
                className="flex items-center gap-2 bg-charcoal text-white px-6 py-2.5 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90 disabled:opacity-50"
              >
                <Plus size={14} /> {saving ? "Saving..." : "Add Review"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reviews Table */}
      <div className="bg-white border border-light-gray">
        <div className="px-6 py-3 border-b border-light-gray bg-cream/50">
          <h3 className="text-[10px] tracking-[0.15em] uppercase font-medium text-charcoal">
            Reviews ({reviews.length})
          </h3>
        </div>

        {reviews.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Star size={24} className="mx-auto text-warm-gray/30 mb-2" />
            <p className="text-sm text-warm-gray">
              No guest reviews yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-light-gray">
            {reviews.map((review: any) => {
              const isExpanded = expandedId === review.id;
              const guestName =
                review.reservation?.guestName || "Unknown Guest";
              const property =
                review.reservation?.listing?.title || "Unknown Property";

              return (
                <div key={review.id}>
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : review.id)
                    }
                    className="w-full px-6 py-3 flex items-center gap-4 text-left hover:bg-cream/30 transition-colors"
                  >
                    <div className="shrink-0">
                      {isExpanded ? (
                        <ChevronDown size={14} className="text-warm-gray" />
                      ) : (
                        <ChevronRight size={14} className="text-warm-gray" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-charcoal">
                          {guestName}
                        </span>
                        <StarRating rating={review.overallRating} />
                        <Badge
                          color={sourceColors[review.source] || "gray"}
                        >
                          {review.source}
                        </Badge>
                        <Badge
                          color={
                            review.approvalStatus === "approved"
                              ? "green"
                              : review.approvalStatus === "rejected"
                              ? "red"
                              : "amber"
                          }
                        >
                          {review.approvalStatus}
                        </Badge>
                        {review.featured && (
                          <Star
                            size={12}
                            className="text-amber-400 fill-amber-400"
                          />
                        )}
                        {review.publishToWebsite && (
                          <Badge color="purple">Published</Badge>
                        )}
                      </div>
                      <p className="text-xs text-warm-gray mt-0.5">
                        {property} &middot; {fmt(review.createdAt)}
                      </p>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-4 pl-14 space-y-3">
                      {/* Sub-ratings */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                          {
                            label: "Cleanliness",
                            val: review.cleanlinessRating,
                          },
                          { label: "Accuracy", val: review.accuracyRating },
                          {
                            label: "Communication",
                            val: review.communicationRating,
                          },
                          { label: "Location", val: review.locationRating },
                          { label: "Value", val: review.valueRating },
                        ].map((sub) =>
                          sub.val ? (
                            <div key={sub.label}>
                              <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">
                                {sub.label}
                              </p>
                              <StarRating rating={sub.val} />
                            </div>
                          ) : null
                        )}
                      </div>

                      {/* Comments */}
                      {review.comments && (
                        <div>
                          <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">
                            Comments
                          </p>
                          <p className="text-sm text-charcoal">
                            {review.comments}
                          </p>
                        </div>
                      )}

                      {/* Admin Response */}
                      {review.adminResponse && (
                        <div className="bg-cream p-3 border-l-2 border-charcoal">
                          <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">
                            Your Response
                          </p>
                          <p className="text-sm text-charcoal">
                            {review.adminResponse}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {review.approvalStatus !== "approved" && (
                          <button
                            onClick={() =>
                              updateReview(review.id, {
                                approvalStatus: "approved",
                              })
                            }
                            className="text-[10px] tracking-[0.1em] uppercase font-medium px-3 py-1.5 border border-light-gray text-warm-gray hover:border-green-600 hover:text-green-600 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {review.approvalStatus !== "rejected" && (
                          <button
                            onClick={() =>
                              updateReview(review.id, {
                                approvalStatus: "rejected",
                              })
                            }
                            className="text-[10px] tracking-[0.1em] uppercase font-medium px-3 py-1.5 border border-light-gray text-warm-gray hover:border-red-600 hover:text-red-600 transition-colors"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() =>
                            updateReview(review.id, {
                              featured: !review.featured,
                            })
                          }
                          className="text-[10px] tracking-[0.1em] uppercase font-medium px-3 py-1.5 border border-light-gray text-warm-gray hover:border-amber-600 hover:text-amber-600 transition-colors"
                        >
                          {review.featured ? "Unfeature" : "Feature"}
                        </button>
                        <button
                          onClick={() =>
                            updateReview(review.id, {
                              publishToWebsite: !review.publishToWebsite,
                            })
                          }
                          className="text-[10px] tracking-[0.1em] uppercase font-medium px-3 py-1.5 border border-light-gray text-warm-gray hover:border-purple-600 hover:text-purple-600 transition-colors"
                        >
                          {review.publishToWebsite ? "Unpublish" : "Publish to Website"}
                        </button>
                        <button
                          onClick={() =>
                            setRespondingTo(
                              respondingTo === review.id ? null : review.id
                            )
                          }
                          className="flex items-center gap-1 text-[10px] tracking-[0.1em] uppercase font-medium px-3 py-1.5 border border-light-gray text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors"
                        >
                          <Reply size={12} /> Respond
                        </button>
                      </div>

                      {/* Response Form */}
                      {respondingTo === review.id && (
                        <div className="flex gap-2">
                          <input
                            value={responseText[review.id] || ""}
                            onChange={(e) =>
                              setResponseText((prev) => ({
                                ...prev,
                                [review.id]: e.target.value,
                              }))
                            }
                            placeholder="Write your response..."
                            className="flex-1 border border-light-gray px-3 py-2 text-sm focus:outline-none focus:border-charcoal"
                          />
                          <button
                            onClick={() => submitResponse(review.id)}
                            className="bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90"
                          >
                            Send
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 7: GUEST REQUESTS
// ═══════════════════════════════════════════════════════════════════════════

function RequestsTab({
  requests,
  onReload,
}: {
  requests: any[];
  onReload: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [internalNotes, setInternalNotes] = useState<Record<string, string>>(
    {}
  );

  const requestCategories = [
    "all",
    "general",
    "maintenance",
    "cleaning",
    "supplies",
    "noise",
    "amenities",
    "checkout",
    "other",
  ];

  async function updateRequest(id: string, updates: Record<string, any>) {
    await fetch("/api/admin/guest-requests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    onReload();
  }

  async function sendReply(id: string) {
    const text = replyText[id];
    if (!text?.trim()) return;
    await updateRequest(id, { adminReply: text.trim(), status: "open" });
    setReplyingTo(null);
    setReplyText((prev) => ({ ...prev, [id]: "" }));
  }

  async function saveInternalNotes(id: string) {
    const notes = internalNotes[id];
    if (notes === undefined) return;
    await updateRequest(id, { internalNotes: notes.trim() });
  }

  const filtered =
    categoryFilter === "all"
      ? requests
      : requests.filter((r) => r.category === categoryFilter);

  const priorityColors: Record<string, "gray" | "blue" | "amber" | "red"> = {
    low: "gray",
    normal: "blue",
    high: "amber",
    urgent: "red",
  };

  const statusColors: Record<string, "gray" | "blue" | "amber" | "green" | "purple"> = {
    new: "blue",
    open: "blue",
    "in-progress": "amber",
    "waiting-on-guest": "purple",
    resolved: "green",
    closed: "gray",
    pending: "amber",
    acknowledged: "amber",
  };

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex items-center gap-3">
        <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
          Filter:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {requestCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase font-medium border transition-colors ${
                categoryFilter === cat
                  ? "bg-charcoal text-white border-charcoal"
                  : "bg-white text-warm-gray border-light-gray hover:border-charcoal hover:text-charcoal"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-light-gray">
        <div className="px-6 py-3 border-b border-light-gray bg-cream/50">
          <h3 className="text-[10px] tracking-[0.15em] uppercase font-medium text-charcoal">
            Requests ({filtered.length})
          </h3>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <MessageSquare
              size={24}
              className="mx-auto text-warm-gray/30 mb-2"
            />
            <p className="text-sm text-warm-gray">No requests found.</p>
          </div>
        ) : (
          <div className="divide-y divide-light-gray">
            {filtered.map((req: any) => {
              const isExpanded = expandedId === req.id;
              const guestName =
                req.reservation?.guestName || "Unknown Guest";
              const property =
                req.reservation?.listing?.title || "";

              return (
                <div key={req.id}>
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : req.id)
                    }
                    className="w-full px-6 py-3 flex items-center gap-4 text-left hover:bg-cream/30 transition-colors"
                  >
                    <div className="shrink-0">
                      {isExpanded ? (
                        <ChevronDown size={14} className="text-warm-gray" />
                      ) : (
                        <ChevronRight size={14} className="text-warm-gray" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-charcoal">
                          {guestName}
                        </span>
                        <Badge color={priorityColors[req.priority] || "gray"}>
                          {req.priority}
                        </Badge>
                        <Badge color={statusColors[req.status] || "gray"}>
                          {req.status}
                        </Badge>
                        <Badge color="gray">{req.category}</Badge>
                      </div>
                      <p className="text-xs text-warm-gray mt-0.5 truncate">
                        {property && `${property} · `}
                        {req.message.substring(0, 100)}
                        {req.message.length > 100 ? "..." : ""}
                      </p>
                    </div>
                    <span className="text-[10px] text-warm-gray/60 shrink-0">
                      {fmt(req.createdAt)}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-4 pl-14 space-y-3">
                      {/* Full Message */}
                      <div>
                        <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">
                          Message
                        </p>
                        <p className="text-sm text-charcoal whitespace-pre-line">
                          {req.message}
                        </p>
                      </div>

                      {/* Photos */}
                      {req.photos && req.photos.length > 0 && (
                        <div>
                          <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">
                            Photos ({req.photos.length})
                          </p>
                          <div className="flex gap-2">
                            {req.photos.map((url: string, i: number) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-charcoal/60 hover:text-charcoal flex items-center gap-1 border border-light-gray px-2 py-1"
                              >
                                <ExternalLink size={10} /> Photo {i + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Admin Reply */}
                      {req.adminReply && (
                        <div className="bg-cream p-3 border-l-2 border-charcoal">
                          <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-0.5">
                            Your Reply
                          </p>
                          <p className="text-sm text-charcoal">
                            {req.adminReply}
                          </p>
                        </div>
                      )}

                      {/* Internal Notes */}
                      <div>
                        <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">
                          Internal Notes (not visible to guest)
                        </p>
                        <div className="flex gap-2">
                          <input
                            value={
                              internalNotes[req.id] !== undefined
                                ? internalNotes[req.id]
                                : req.internalNotes || ""
                            }
                            onChange={(e) =>
                              setInternalNotes((prev) => ({
                                ...prev,
                                [req.id]: e.target.value,
                              }))
                            }
                            placeholder="Add internal notes..."
                            className="flex-1 border border-light-gray px-3 py-2 text-sm focus:outline-none focus:border-charcoal"
                          />
                          <button
                            onClick={() => saveInternalNotes(req.id)}
                            className="text-[10px] tracking-[0.1em] uppercase font-medium px-3 py-1.5 border border-light-gray text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors"
                          >
                            <Save size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Status Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {["new", "open", "in-progress", "waiting-on-guest", "resolved", "closed"].map(
                          (s) =>
                            req.status !== s ? (
                              <button
                                key={s}
                                onClick={() =>
                                  updateRequest(req.id, { status: s })
                                }
                                className="text-[10px] tracking-[0.1em] uppercase font-medium px-3 py-1.5 border border-light-gray text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors"
                              >
                                {s.replace(/-/g, " ")}
                              </button>
                            ) : null
                        )}
                        <button
                          onClick={() =>
                            setReplyingTo(
                              replyingTo === req.id ? null : req.id
                            )
                          }
                          className="flex items-center gap-1 text-[10px] tracking-[0.1em] uppercase font-medium px-3 py-1.5 border border-light-gray text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors"
                        >
                          <Reply size={12} /> Reply
                        </button>
                      </div>

                      {/* Reply Form */}
                      {replyingTo === req.id && (
                        <div className="flex gap-2">
                          <input
                            value={replyText[req.id] || ""}
                            onChange={(e) =>
                              setReplyText((prev) => ({
                                ...prev,
                                [req.id]: e.target.value,
                              }))
                            }
                            placeholder="Type your reply..."
                            className="flex-1 border border-light-gray px-3 py-2 text-sm focus:outline-none focus:border-charcoal"
                          />
                          <button
                            onClick={() => sendReply(req.id)}
                            className="bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90"
                          >
                            Send
                          </button>
                        </div>
                      )}

                      <p className="text-[10px] text-warm-gray/60">
                        Created: {fmtFull(req.createdAt)} &middot; Updated:{" "}
                        {fmtFull(req.updatedAt)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 8: AUTOMATIONS
// ═══════════════════════════════════════════════════════════════════════════

function AutomationsTab() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("avenue10-automations");
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return {};
  });

  function toggle(key: string) {
    setToggles((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("avenue10-automations", JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  const automations = [
    {
      key: "portal-link",
      title: "Send portal link after booking",
      description:
        "Automatically sends a guest portal link via email when a new reservation is confirmed.",
      icon: Send,
    },
    {
      key: "remind-terms",
      title: "Remind guest to sign terms (24h before)",
      description:
        "Sends a reminder email 24 hours before check-in if the guest has not yet signed the terms agreement.",
      icon: Bell,
    },
    {
      key: "unlock-codes",
      title: "Unlock codes after terms signed",
      description:
        "Automatically reveals sensitive check-in instructions (door codes, etc.) after the guest signs the terms agreement.",
      icon: Unlock,
    },
    {
      key: "checkout-reminder",
      title: "Send checkout reminder",
      description:
        "Sends checkout instructions and a reminder the morning of the guest's departure.",
      icon: CalendarCheck,
    },
    {
      key: "review-request",
      title: "Send review request after checkout",
      description:
        "Sends a follow-up email requesting a review 24 hours after the guest's check-out date.",
      icon: Star,
    },
    {
      key: "notify-request",
      title: "Notify admin on guest request",
      description:
        "Sends an immediate notification to the admin when a guest submits a new request through the portal.",
      icon: AlertCircle,
    },
    {
      key: "notify-cleaner",
      title: "Notify cleaner after checkout",
      description:
        "Sends an automated notification to the assigned cleaning staff when a guest checks out.",
      icon: Mail,
    },
    {
      key: "flag-inventory",
      title: "Flag inventory issue on guest report",
      description:
        "Automatically creates an inventory issue flag when a guest reports a damaged or missing item.",
      icon: Flag,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-sm font-medium text-charcoal">
            Automation Rules
          </h2>
          <p className="text-xs text-warm-gray mt-0.5">
            Configure automated workflows for your guest portal operations.
          </p>
        </div>
      </div>

      {automations.map((auto) => (
        <div
          key={auto.key}
          className="bg-white border border-light-gray px-6 py-4 flex items-center gap-4"
        >
          <div className="shrink-0 w-10 h-10 bg-cream/70 border border-light-gray flex items-center justify-center">
            <auto.icon size={18} className="text-charcoal/60" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-medium text-charcoal">
                {auto.title}
              </h3>
              <Badge color="amber">Coming Soon</Badge>
            </div>
            <p className="text-xs text-warm-gray">{auto.description}</p>
          </div>
          <button
            onClick={() => toggle(auto.key)}
            className="shrink-0"
          >
            {toggles[auto.key] ? (
              <ToggleRight size={28} className="text-charcoal" />
            ) : (
              <ToggleLeft size={28} className="text-warm-gray" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 9: SMART LOCKS
// ═══════════════════════════════════════════════════════════════════════════

function SmartLocksTab() {
  const integrations = [
    {
      name: "August",
      letter: "A",
      description:
        "Connect your August smart locks for automatic guest access code generation and management.",
    },
    {
      name: "Yale",
      letter: "Y",
      description:
        "Integrate Yale smart locks to auto-create temporary codes tied to reservation dates.",
    },
    {
      name: "Schlage",
      letter: "S",
      description:
        "Manage Schlage Encode locks with automatic code provisioning for each booking.",
    },
    {
      name: "RemoteLock",
      letter: "R",
      description:
        "Universal access control platform supporting multiple lock brands and access methods.",
    },
    {
      name: "SmartThings",
      letter: "S",
      description:
        "Samsung SmartThings hub integration for managing connected locks and home devices.",
    },
    {
      name: "Hospitable",
      letter: "H",
      description:
        "Sync bookings and automate guest messaging through Hospitable (formerly Smartbnb).",
    },
    {
      name: "Guesty",
      letter: "G",
      description:
        "Full property management integration with Guesty for bookings, messaging, and access.",
    },
    {
      name: "Hostaway",
      letter: "H",
      description:
        "Hostaway channel manager integration for centralized booking and lock management.",
    },
    {
      name: "OwnerRez",
      letter: "O",
      description:
        "OwnerRez property management sync for automated check-in workflows and access codes.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Integration Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-medium text-charcoal">
              Smart Lock Integrations
            </h2>
            <p className="text-xs text-warm-gray mt-0.5">
              Connect your smart lock provider to enable automated access code
              management.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {integrations.map((int) => (
            <div
              key={int.name}
              className="bg-white border border-light-gray px-5 py-4"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 bg-cream border border-light-gray flex items-center justify-center text-sm font-serif text-charcoal">
                  {int.letter}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-charcoal">
                      {int.name}
                    </h3>
                    <Badge color="gray">Not Connected</Badge>
                  </div>
                  <p className="text-xs text-warm-gray mb-3">
                    {int.description}
                  </p>
                  <button
                    onClick={() =>
                      alert(
                        `${int.name} integration coming soon. Contact support for early access.`
                      )
                    }
                    className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase font-medium px-3 py-1.5 border border-light-gray text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors"
                  >
                    <Plug size={12} /> Connect
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Diagram */}
      <div className="bg-white border border-light-gray p-6">
        <h3 className="text-[10px] tracking-[0.15em] uppercase font-medium text-charcoal mb-4">
          Automated Access Workflow
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            "Booking Confirmed",
            "Temp Code Generated",
            "Guest Signs Terms",
            "Code Activates",
            "Code Expires After Checkout",
          ].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <div className="bg-cream border border-light-gray px-4 py-2">
                <span className="text-[10px] tracking-[0.1em] uppercase font-medium text-charcoal">
                  {step}
                </span>
              </div>
              {i < arr.length - 1 && (
                <ChevronRight size={16} className="text-warm-gray shrink-0" />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-warm-gray mt-4">
          This workflow will be fully automated once you connect a smart lock
          provider above. Door codes will be generated, delivered to guests only
          after they sign the terms agreement, and automatically expired after
          checkout.
        </p>
      </div>
    </div>
  );
}
