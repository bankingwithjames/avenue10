"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  Search,
  Download,
  Upload,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Star,
  Eye,
  Plus,
  Send,
  X,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Clock,
  Tag,
  Shield,
  ShieldOff,
  Heart,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plug,
  UserPlus,
  Filter,
  MoreHorizontal,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  ArrowRight,
  Megaphone,
  FileText,
  Zap,
  Settings,
  Globe,
  Smartphone,
  AtSign,
  Ban,
  Crown,
  Baby,
  PawPrint,
  Accessibility,
  SunMoon,
  Key,
  Wifi,
  Home,
  ClipboardList,
  Play,
  Pause,
  BarChart3,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────

interface GuestRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  guestType: string;
  isVip: boolean;
  doNotHost: boolean;
  doNotContact: boolean;
  emailOptIn: boolean;
  smsOptIn: boolean;
  marketingOptIn: boolean;
  preferredContact: string;
  source: string;
  lifetimeRevenue: number;
  totalBookings: number;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  accommodation?: GuestAccommodation | null;
  tags?: { tag: { id: string; name: string; color: string } }[];
  notes?: GuestNoteRecord[];
  messages?: GuestMessageRecord[];
  _count?: { messages: number; notes: number; campaignRecipients: number };
}

interface GuestAccommodation {
  id: string;
  accessibilityNeeds: string | null;
  familyNeeds: string | null;
  petNotes: string | null;
  parkingNeeds: string | null;
  sleepingPreferences: string | null;
  temperaturePreferences: string | null;
  allergies: string | null;
  specialOccasions: string | null;
  preferredCheckinTime: string | null;
  preferredCheckoutTime: string | null;
  preferredListing: string | null;
  favoriteAmenities: string[];
  hostNotes: string | null;
}

interface GuestNoteRecord {
  id: string;
  content: string;
  author: string | null;
  createdAt: string;
}

interface GuestMessageRecord {
  id: string;
  channel: string;
  messageType: string;
  direction: string;
  subject: string | null;
  body: string;
  deliveryStatus: string;
  openedAt: string | null;
  clickedAt: string | null;
  repliedAt: string | null;
  campaignId: string | null;
  createdAt: string;
}

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
  accessCode?: string;
  channel?: string;
  listing: { id: string; title: string; slug: string };
  agreement?: { id: string; signedAt: string } | null;
}

interface GuestRequestRecord {
  id: string;
  type: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  assignedStaff: string | null;
  adminReply: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  reservation: { guestName: string; listing: { title: string } };
}

interface ReviewRecord {
  id: string;
  overallRating: number;
  cleanlinessRating: number | null;
  accuracyRating: number | null;
  communicationRating: number | null;
  locationRating: number | null;
  valueRating: number | null;
  comments: string | null;
  adminResponse: string | null;
  publishToWebsite: boolean;
  featured: boolean;
  source: string;
  approvalStatus: string;
  createdAt: string;
  reservation: {
    guestName: string;
    guestEmail?: string;
    checkIn: string;
    checkOut: string;
    listing: { id: string; title: string };
  };
}

interface CampaignRecord {
  id: string;
  name: string;
  type: string;
  status: string;
  segment: string;
  listingFilter: string | null;
  subject: string | null;
  body: string;
  ctaText: string | null;
  ctaLink: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  totalRecipients: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  createdAt: string;
}

interface TemplateRecord {
  id: string;
  name: string;
  type: string;
  category: string;
  subject: string | null;
  body: string;
  isActive: boolean;
}

interface AutomationRecord {
  id: string;
  name: string;
  trigger: string;
  templateId: string | null;
  delay: string | null;
  isActive: boolean;
  conditions: string | null;
}

interface TagRecord {
  id: string;
  name: string;
  color: string;
}

interface DoorCode {
  id: string;
  listingId: string;
  category: string;
  title: string;
  value: string;
  sensitive: boolean;
  visibleBeforeHours: number;
}

// Merged guest view combining CRM Guest record + reservation-derived data
interface MergedGuest {
  id: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  guestType: string;
  isVip: boolean;
  doNotHost: boolean;
  doNotContact: boolean;
  emailOptIn: boolean;
  smsOptIn: boolean;
  marketingOptIn: boolean;
  preferredContact: string;
  source: string;
  lifetimeRevenue: number;
  totalBookings: number;
  internalNotes: string | null;
  tags: { id: string; name: string; color: string }[];
  lastStay: string | null;
  nextStay: string | null;
  currentStay: boolean;
  preferredProperty: string | null;
  portalStatus: string;
  lastMessage: string | null;
  reservations: Reservation[];
  accommodation?: GuestAccommodation | null;
  messageCount: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 0 });

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const nightsBetween = (a: string, b: string) => {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
};

// ─── Sub-Components ─────────────────────────────────────────────────────

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 ${className}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Users }) {
  return (
    <div className="bg-white border border-light-gray p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">{label}</span>
        <Icon size={14} className="text-warm-gray" />
      </div>
      <p className="text-xl font-serif text-charcoal font-light">{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] tracking-[0.15em] uppercase font-medium px-4 py-2.5 transition whitespace-nowrap ${
        active ? "bg-charcoal text-white" : "text-charcoal/60 hover:text-charcoal hover:bg-cream"
      }`}
    >
      {children}
    </button>
  );
}

function DrawerTabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-[9px] tracking-[0.1em] uppercase font-medium px-3 py-2 transition whitespace-nowrap border-b-2 ${
        active ? "border-charcoal text-charcoal" : "border-transparent text-warm-gray hover:text-charcoal"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function GuestsCRMPage() {
  // ── State ──
  const [mainTab, setMainTab] = useState<"guests" | "campaigns" | "templates" | "automations">("guests");

  // Data
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [requests, setRequests] = useState<GuestRequestRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [automations, setAutomations] = useState<AutomationRecord[]>([]);
  const [allTags, setAllTags] = useState<TagRecord[]>([]);
  const [doorCodes, setDoorCodes] = useState<DoorCode[]>([]);

  // Loading/error
  const [loading, setLoading] = useState(true);
  const [guestsError, setGuestsError] = useState(false);
  const [reservationsError, setReservationsError] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Search/filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Drawers
  const [selectedGuest, setSelectedGuest] = useState<MergedGuest | null>(null);
  const [drawerTab, setDrawerTab] = useState("profile");
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignRecord | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TemplateRecord | null>(null);
  const [showMessageComposer, setShowMessageComposer] = useState(false);

  // Forms
  const [newGuest, setNewGuest] = useState({ firstName: "", lastName: "", email: "", phone: "", source: "direct" });
  const [newNote, setNewNote] = useState("");
  const [messageForm, setMessageForm] = useState({ channel: "email", subject: "", body: "", messageType: "manual" });
  const [campaignForm, setCampaignForm] = useState({ name: "", type: "email", segment: "all", listingFilter: "", subject: "", body: "", ctaText: "", ctaLink: "", scheduledAt: "" });
  const [templateForm, setTemplateForm] = useState({ name: "", type: "email", category: "general", subject: "", body: "" });
  const [accommodationForm, setAccommodationForm] = useState<Partial<GuestAccommodation>>({});
  const [saving, setSaving] = useState(false);

  // ── Data Fetching ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      fetch("/api/admin/guests").then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/reservations").then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/guest-requests").then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/reviews").then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/campaigns").then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/templates").then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/automations").then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/guest-tags").then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/instructions").then(r => r.ok ? r.json() : Promise.reject()),
    ]);

    if (results[0].status === "fulfilled") setGuests(results[0].value);
    else setGuestsError(true);

    if (results[1].status === "fulfilled") setReservations(results[1].value);
    else setReservationsError(true);

    if (results[2].status === "fulfilled") setRequests(Array.isArray(results[2].value) ? results[2].value : []);
    if (results[3].status === "fulfilled") setReviews(Array.isArray(results[3].value) ? results[3].value : []);
    if (results[4].status === "fulfilled") setCampaigns(Array.isArray(results[4].value) ? results[4].value : []);
    if (results[5].status === "fulfilled") setTemplates(Array.isArray(results[5].value) ? results[5].value : []);
    if (results[6].status === "fulfilled") setAutomations(Array.isArray(results[6].value) ? results[6].value : []);
    if (results[7].status === "fulfilled") setAllTags(Array.isArray(results[7].value) ? results[7].value : []);
    if (results[8].status === "fulfilled") setDoorCodes(Array.isArray(results[8].value) ? results[8].value : []);

    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Sync Guests from Reservations ──
  const syncGuests = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/guests/sync", { method: "POST" });
      if (res.ok) {
        setLastSyncTime(new Date().toISOString());
        await fetchAll();
      }
    } catch { /* ignore */ }
    setSyncing(false);
  };

  // ── Merged Guest List ──
  const mergedGuests = useMemo((): MergedGuest[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const guestMap = new Map<string, MergedGuest>();

    // Start with CRM guests
    for (const g of guests) {
      const resos = reservations.filter(r => r.guestEmail.toLowerCase() === g.email.toLowerCase());
      const sorted = [...resos].sort((a, b) => new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime());
      const upcoming = resos.filter(r => new Date(r.checkIn) > today).sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
      const current = resos.some(r => new Date(r.checkIn) <= today && new Date(r.checkOut) >= today);
      const props = [...new Set(resos.map(r => r.listing.title))];

      guestMap.set(g.email.toLowerCase(), {
        id: g.id,
        firstName: g.firstName,
        lastName: g.lastName,
        email: g.email,
        phone: g.phone,
        status: g.status,
        guestType: g.guestType,
        isVip: g.isVip,
        doNotHost: g.doNotHost,
        doNotContact: g.doNotContact,
        emailOptIn: g.emailOptIn,
        smsOptIn: g.smsOptIn,
        marketingOptIn: g.marketingOptIn,
        preferredContact: g.preferredContact,
        source: g.source,
        lifetimeRevenue: g.lifetimeRevenue || resos.reduce((s, r) => s + r.totalPrice, 0),
        totalBookings: g.totalBookings || resos.length,
        internalNotes: g.internalNotes,
        tags: g.tags?.map(t => t.tag) || [],
        lastStay: sorted.length > 0 ? sorted[0].checkOut : null,
        nextStay: upcoming.length > 0 ? upcoming[0].checkIn : null,
        currentStay: current,
        preferredProperty: props.length > 0 ? props[0] : null,
        portalStatus: resos.some(r => r.agreement) ? "signed" : resos.length > 0 ? "pending" : "none",
        lastMessage: null,
        reservations: resos,
        accommodation: g.accommodation,
        messageCount: g._count?.messages || 0,
      });
    }

    // Add reservation-only guests not in CRM
    for (const r of reservations) {
      const key = r.guestEmail.toLowerCase();
      if (guestMap.has(key)) continue;

      const resos = reservations.filter(res => res.guestEmail.toLowerCase() === key);
      const sorted = [...resos].sort((a, b) => new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime());
      const upcoming = resos.filter(res => new Date(res.checkIn) > today).sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());
      const current = resos.some(res => new Date(res.checkIn) <= today && new Date(res.checkOut) >= today);
      const nameParts = r.guestName.trim().split(/\s+/);
      const props = [...new Set(resos.map(res => res.listing.title))];

      guestMap.set(key, {
        id: null,
        firstName: nameParts.slice(0, -1).join(" ") || nameParts[0],
        lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : "",
        email: r.guestEmail,
        phone: r.guestPhone,
        status: "active",
        guestType: "leisure",
        isVip: false,
        doNotHost: false,
        doNotContact: false,
        emailOptIn: true,
        smsOptIn: false,
        marketingOptIn: true,
        preferredContact: "email",
        source: r.channel || "direct",
        lifetimeRevenue: resos.reduce((s, res) => s + res.totalPrice, 0),
        totalBookings: resos.length,
        internalNotes: null,
        tags: [],
        lastStay: sorted.length > 0 ? sorted[0].checkOut : null,
        nextStay: upcoming.length > 0 ? upcoming[0].checkIn : null,
        currentStay: current,
        preferredProperty: props.length > 0 ? props[0] : null,
        portalStatus: resos.some(res => res.agreement) ? "signed" : "pending",
        lastMessage: null,
        reservations: resos,
        accommodation: null,
        messageCount: 0,
      });
    }

    return Array.from(guestMap.values()).sort((a, b) => b.totalBookings - a.totalBookings);
  }, [guests, reservations]);

  // ── Filtered Guests ──
  const filteredGuests = useMemo(() => {
    let list = mergedGuests;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(g =>
        `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone?.includes(q) ||
        g.tags.some(t => t.name.toLowerCase().includes(q)) ||
        g.preferredProperty?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      switch (statusFilter) {
        case "upcoming": list = list.filter(g => g.nextStay); break;
        case "current": list = list.filter(g => g.currentStay); break;
        case "past": list = list.filter(g => !g.currentStay && !g.nextStay && g.lastStay); break;
        case "repeat": list = list.filter(g => g.totalBookings >= 2); break;
        case "vip": list = list.filter(g => g.isVip); break;
        case "donothost": list = list.filter(g => g.doNotHost); break;
        case "email-optin": list = list.filter(g => g.emailOptIn && g.marketingOptIn); break;
        case "sms-optin": list = list.filter(g => g.smsOptIn); break;
        case "unsubscribed": list = list.filter(g => !g.marketingOptIn); break;
      }
    }

    return list;
  }, [mergedGuests, search, statusFilter]);

  // ── KPI Stats ──
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      total: mergedGuests.length,
      upcoming: mergedGuests.filter(g => g.nextStay).length,
      current: mergedGuests.filter(g => g.currentStay).length,
      past: mergedGuests.filter(g => !g.currentStay && !g.nextStay && g.lastStay).length,
      repeat: mergedGuests.filter(g => g.totalBookings >= 2).length,
      vip: mergedGuests.filter(g => g.isVip).length,
      openRequests: requests.filter(r => !["resolved", "closed"].includes(r.status)).length,
      subscribers: mergedGuests.filter(g => g.emailOptIn && g.marketingOptIn).length,
      pendingReviews: reviews.filter(r => r.approvalStatus === "pending").length,
      doNotHost: mergedGuests.filter(g => g.doNotHost).length,
    };
  }, [mergedGuests, requests, reviews]);

  // ── CRUD Actions ──
  const addGuest = async () => {
    if (!newGuest.firstName || !newGuest.lastName || !newGuest.email) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGuest),
      });
      if (res.ok) {
        setShowAddGuest(false);
        setNewGuest({ firstName: "", lastName: "", email: "", phone: "", source: "direct" });
        await fetchAll();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const updateGuest = async (id: string, data: Partial<GuestRecord>) => {
    try {
      await fetch(`/api/admin/guests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await fetchAll();
    } catch { /* ignore */ }
  };

  const addNote = async (guestId: string) => {
    if (!newNote.trim()) return;
    try {
      await fetch(`/api/admin/guests/${guestId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });
      setNewNote("");
      // Refresh guest detail
      const res = await fetch(`/api/admin/guests/${guestId}`);
      if (res.ok) {
        const updated = await res.json();
        setSelectedGuest(prev => prev ? { ...prev, ...buildMergedFromDetail(updated) } : null);
      }
    } catch { /* ignore */ }
  };

  const sendMessage = async (guestId: string) => {
    if (!messageForm.body.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/guests/${guestId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageForm),
      });
      setShowMessageComposer(false);
      setMessageForm({ channel: "email", subject: "", body: "", messageType: "manual" });
    } catch { /* ignore */ }
    setSaving(false);
  };

  const saveCampaign = async () => {
    if (!campaignForm.name || !campaignForm.body) return;
    setSaving(true);
    try {
      const url = editingCampaign ? `/api/admin/campaigns/${editingCampaign.id}` : "/api/admin/campaigns";
      const method = editingCampaign ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(campaignForm) });
      if (res.ok) {
        setShowCampaignBuilder(false);
        setEditingCampaign(null);
        setCampaignForm({ name: "", type: "email", segment: "all", listingFilter: "", subject: "", body: "", ctaText: "", ctaLink: "", scheduledAt: "" });
        await fetchAll();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const saveTemplate = async () => {
    if (!templateForm.name || !templateForm.body) return;
    setSaving(true);
    try {
      const url = editingTemplate ? `/api/admin/templates/${editingTemplate.id}` : "/api/admin/templates";
      const method = editingTemplate ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(templateForm) });
      if (res.ok) {
        setShowTemplateEditor(false);
        setEditingTemplate(null);
        setTemplateForm({ name: "", type: "email", category: "general", subject: "", body: "" });
        await fetchAll();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const toggleAutomation = async (auto: AutomationRecord) => {
    try {
      await fetch(`/api/admin/automations/${auto.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !auto.isActive }),
      });
      await fetchAll();
    } catch { /* ignore */ }
  };

  const saveAccommodation = async (guestId: string) => {
    setSaving(true);
    try {
      await fetch(`/api/admin/guests/${guestId}/accommodation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accommodationForm),
      });
      await fetchAll();
    } catch { /* ignore */ }
    setSaving(false);
  };

  // Helper to build merged guest from detail API
  const buildMergedFromDetail = (g: GuestRecord): Partial<MergedGuest> => ({
    id: g.id,
    firstName: g.firstName,
    lastName: g.lastName,
    email: g.email,
    phone: g.phone,
    status: g.status,
    isVip: g.isVip,
    doNotHost: g.doNotHost,
    internalNotes: g.internalNotes,
    accommodation: g.accommodation,
    tags: g.tags?.map(t => t.tag) || [],
  });

  // Open guest profile
  const openGuest = (guest: MergedGuest) => {
    setSelectedGuest(guest);
    setDrawerTab("profile");
    if (guest.accommodation) {
      setAccommodationForm(guest.accommodation);
    } else {
      setAccommodationForm({});
    }

    // Fetch full detail if CRM guest exists
    if (guest.id) {
      fetch(`/api/admin/guests/${guest.id}`).then(r => r.ok ? r.json() : null).then(data => {
        if (data) {
          setSelectedGuest(prev => prev ? {
            ...prev,
            ...buildMergedFromDetail(data),
          } : null);
          if (data.accommodation) setAccommodationForm(data.accommodation);
        }
      });
    }
  };

  // Get door codes for a listing
  const getDoorsForListing = (listingId: string) =>
    doorCodes.filter(dc => dc.listingId === listingId && dc.category === "Door Codes");

  // Get requests for a guest email
  const getRequestsForGuest = (email: string) =>
    requests.filter(r => {
      const matchingResos = reservations.filter(res => res.guestEmail.toLowerCase() === email.toLowerCase());
      return matchingResos.some(res => r.reservation?.guestName === res.guestName);
    });

  // Get reviews for a guest email
  const getReviewsForGuest = (email: string) =>
    reviews.filter(r => {
      return r.reservation?.guestEmail?.toLowerCase() === email.toLowerCase() ||
        reservations.some(res => res.guestEmail.toLowerCase() === email.toLowerCase() && res.guestName === r.reservation?.guestName);
    });

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-warm-gray text-sm">Loading Guest CRM...</p>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="relative">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="font-serif text-2xl text-charcoal font-light">Guests CRM</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowAddGuest(true)} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5">
            <UserPlus size={12} /> Add Guest
          </button>
          <button onClick={() => { setEditingCampaign(null); setCampaignForm({ name: "", type: "email", segment: "all", listingFilter: "", subject: "", body: "", ctaText: "", ctaLink: "", scheduledAt: "" }); setShowCampaignBuilder(true); }} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5">
            <Send size={12} /> Send Campaign
          </button>
          <button onClick={() => alert("Import CSV — connect to integrations to enable")} className="border border-light-gray text-charcoal text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition px-4 py-2.5 flex items-center gap-1.5">
            <Upload size={12} /> Import
          </button>
          <button onClick={() => alert("Export will download guest CSV")} className="border border-light-gray text-charcoal text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition px-4 py-2.5 flex items-center gap-1.5">
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* ─── Error/Fallback Banner ───────────────────────────────────── */}
      {(guestsError || reservationsError) && (
        <div className="bg-amber-50 border border-amber-200 p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-amber-800 font-medium mb-1">Some data sources could not be loaded</p>
              <p className="text-xs text-amber-700 mb-3">
                {guestsError && "Guest CRM records failed to load. "}
                {reservationsError && "Reservation data failed to load. "}
                You can still add guests manually or import from CSV.
              </p>
              <div className="flex flex-wrap gap-2">
                <button onClick={fetchAll} className="bg-amber-600 text-white text-[10px] tracking-[0.15em] uppercase font-medium px-3 py-2 flex items-center gap-1.5 hover:bg-amber-700 transition">
                  <RefreshCw size={11} /> Retry
                </button>
                <button onClick={() => setShowAddGuest(true)} className="border border-amber-300 text-amber-800 text-[10px] tracking-[0.15em] uppercase font-medium px-3 py-2 flex items-center gap-1.5 hover:bg-amber-100 transition">
                  <UserPlus size={11} /> Add Manually
                </button>
                <button onClick={() => alert("Import CSV")} className="border border-amber-300 text-amber-800 text-[10px] tracking-[0.15em] uppercase font-medium px-3 py-2 flex items-center gap-1.5 hover:bg-amber-100 transition">
                  <Upload size={11} /> Import CSV
                </button>
                <button onClick={() => alert("Check Settings > Integrations")} className="border border-amber-300 text-amber-800 text-[10px] tracking-[0.15em] uppercase font-medium px-3 py-2 flex items-center gap-1.5 hover:bg-amber-100 transition">
                  <Plug size={11} /> Check Integrations
                </button>
              </div>
              {lastSyncTime && <p className="text-[10px] text-amber-600 mt-2">Last sync: {formatDateTime(lastSyncTime)}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ─── KPI Dashboard Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total Guests" value={stats.total} icon={Users} />
        <StatCard label="Upcoming" value={stats.upcoming} icon={Calendar} />
        <StatCard label="Current" value={stats.current} icon={Home} />
        <StatCard label="Repeat Guests" value={stats.repeat} icon={Star} />
        <StatCard label="VIP Guests" value={stats.vip} icon={Crown} />
        <StatCard label="Open Requests" value={stats.openRequests} icon={MessageSquare} />
        <StatCard label="Subscribers" value={stats.subscribers} icon={Mail} />
        <StatCard label="Reviews Pending" value={stats.pendingReviews} icon={ClipboardList} />
        <StatCard label="Past Guests" value={stats.past} icon={Clock} />
        <StatCard label="Do Not Host" value={stats.doNotHost} icon={Ban} />
      </div>

      {/* ─── Sync Button ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={syncGuests}
          disabled={syncing}
          className="border border-light-gray text-charcoal text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw size={11} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Syncing..." : "Sync from Reservations"}
        </button>
        {lastSyncTime && <span className="text-[10px] text-warm-gray">Last: {formatDateTime(lastSyncTime)}</span>}
      </div>

      {/* ─── Main Tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center border border-light-gray bg-white mb-6 overflow-x-auto">
        <TabButton active={mainTab === "guests"} onClick={() => setMainTab("guests")}>
          <span className="flex items-center gap-1.5"><Users size={12} /> Guests</span>
        </TabButton>
        <TabButton active={mainTab === "campaigns"} onClick={() => setMainTab("campaigns")}>
          <span className="flex items-center gap-1.5"><Megaphone size={12} /> Campaigns</span>
        </TabButton>
        <TabButton active={mainTab === "templates"} onClick={() => setMainTab("templates")}>
          <span className="flex items-center gap-1.5"><FileText size={12} /> Templates</span>
        </TabButton>
        <TabButton active={mainTab === "automations"} onClick={() => setMainTab("automations")}>
          <span className="flex items-center gap-1.5"><Zap size={12} /> Automations</span>
        </TabButton>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* GUESTS TAB                                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "guests" && (
        <>
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
              <input
                type="text"
                placeholder="Search by name, email, phone, tag, or property..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 pl-9 outline-none focus:border-charcoal/40 transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 bg-white"
            >
              <option value="all">All Guests</option>
              <option value="upcoming">Upcoming</option>
              <option value="current">Currently Staying</option>
              <option value="past">Past Guests</option>
              <option value="repeat">Repeat Guests</option>
              <option value="vip">VIP Guests</option>
              <option value="donothost">Do Not Host</option>
              <option value="email-optin">Email Subscribers</option>
              <option value="sms-optin">SMS Opt-In</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
          </div>

          {/* Guest Table */}
          <div className="bg-white border border-light-gray overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-light-gray">
                  <th className="text-left px-4 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Guest</th>
                  <th className="text-left px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden lg:table-cell">Contact</th>
                  <th className="text-left px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden md:table-cell">Status</th>
                  <th className="text-left px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden lg:table-cell">Last Stay</th>
                  <th className="text-left px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden xl:table-cell">Next Stay</th>
                  <th className="text-right px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Bookings</th>
                  <th className="text-right px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden md:table-cell">Revenue</th>
                  <th className="text-left px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden xl:table-cell">Tags</th>
                  <th className="text-right px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-warm-gray">
                      {mergedGuests.length === 0 ? (
                        <div>
                          <Users size={24} className="mx-auto mb-2 text-warm-gray/50" />
                          <p className="mb-1">No guests yet</p>
                          <p className="text-[10px]">Add guests manually, import from CSV, or sync from reservations.</p>
                        </div>
                      ) : "No guests match your filters."}
                    </td>
                  </tr>
                ) : filteredGuests.map(guest => (
                  <tr key={guest.email} className="border-b border-light-gray/50 hover:bg-cream/50 transition cursor-pointer" onClick={() => openGuest(guest)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-cream border border-light-gray flex items-center justify-center text-[10px] font-medium text-charcoal shrink-0">
                          {guest.firstName[0]}{guest.lastName[0] || ""}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-charcoal truncate">{guest.firstName} {guest.lastName}</span>
                            {guest.isVip && <Crown size={10} className="text-amber-500 shrink-0" />}
                            {guest.doNotHost && <Ban size={10} className="text-red-500 shrink-0" />}
                            {guest.totalBookings >= 2 && <Badge className="text-emerald-700 bg-emerald-50">Repeat</Badge>}
                          </div>
                          <p className="text-warm-gray truncate text-[11px]">{guest.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <div className="text-warm-gray">
                        {guest.phone && <div className="flex items-center gap-1"><Phone size={10} />{guest.phone}</div>}
                        <div className="flex items-center gap-1"><Mail size={10} />{guest.emailOptIn ? "Opted in" : "No"}</div>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      {guest.currentStay ? (
                        <Badge className="text-emerald-700 bg-emerald-50">Current</Badge>
                      ) : guest.nextStay ? (
                        <Badge className="text-blue-700 bg-blue-50">Upcoming</Badge>
                      ) : (
                        <Badge className="text-gray-500 bg-gray-100">Past</Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 text-warm-gray hidden lg:table-cell">
                      {guest.lastStay ? formatDate(guest.lastStay) : "—"}
                    </td>
                    <td className="px-3 py-3 text-warm-gray hidden xl:table-cell">
                      {guest.nextStay ? formatDate(guest.nextStay) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right text-charcoal font-medium">{guest.totalBookings}</td>
                    <td className="px-3 py-3 text-right text-charcoal font-medium hidden md:table-cell">{formatCurrency(guest.lifetimeRevenue)}</td>
                    <td className="px-3 py-3 hidden xl:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {guest.tags.slice(0, 3).map(t => (
                          <span key={t.id} className="text-[8px] px-1.5 py-0.5 rounded" style={{ backgroundColor: t.color + "20", color: t.color }}>{t.name}</span>
                        ))}
                        {guest.tags.length > 3 && <span className="text-[8px] text-warm-gray">+{guest.tags.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={e => { e.stopPropagation(); openGuest(guest); }} className="text-charcoal hover:bg-cream p-1.5 transition" title="View Profile">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-warm-gray mt-2">{filteredGuests.length} of {mergedGuests.length} guests</p>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CAMPAIGNS TAB                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "campaigns" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-warm-gray">{campaigns.length} campaigns</p>
            <button onClick={() => { setEditingCampaign(null); setCampaignForm({ name: "", type: "email", segment: "all", listingFilter: "", subject: "", body: "", ctaText: "", ctaLink: "", scheduledAt: "" }); setShowCampaignBuilder(true); }} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5">
              <Plus size={12} /> New Campaign
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div className="bg-white border border-light-gray p-12 text-center">
              <Megaphone size={24} className="mx-auto mb-3 text-warm-gray/50" />
              <p className="text-sm text-charcoal mb-1">No campaigns yet</p>
              <p className="text-xs text-warm-gray mb-4">Create email or SMS campaigns to engage your guests.</p>
              <button onClick={() => setShowCampaignBuilder(true)} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5">Create First Campaign</button>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(c => (
                <div key={c.id} className="bg-white border border-light-gray p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-charcoal truncate">{c.name}</h3>
                        <Badge className={c.status === "sent" ? "text-emerald-700 bg-emerald-50" : c.status === "draft" ? "text-gray-500 bg-gray-100" : c.status === "scheduled" ? "text-blue-700 bg-blue-50" : c.status === "sending" ? "text-amber-700 bg-amber-50" : "text-gray-500 bg-gray-100"}>
                          {c.status}
                        </Badge>
                        <Badge className="text-warm-gray bg-cream">{c.type}</Badge>
                      </div>
                      <p className="text-xs text-warm-gray">{c.segment} segment{c.listingFilter ? ` · ${c.listingFilter}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-warm-gray shrink-0">
                      <div className="text-center"><p className="text-[9px] uppercase tracking-wider font-medium mb-0.5">Sent</p><p className="text-sm text-charcoal font-medium">{c.totalSent}</p></div>
                      <div className="text-center"><p className="text-[9px] uppercase tracking-wider font-medium mb-0.5">Opened</p><p className="text-sm text-charcoal font-medium">{c.totalOpened}</p></div>
                      <div className="text-center"><p className="text-[9px] uppercase tracking-wider font-medium mb-0.5">Clicked</p><p className="text-sm text-charcoal font-medium">{c.totalClicked}</p></div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => { setEditingCampaign(c); setCampaignForm({ name: c.name, type: c.type, segment: c.segment, listingFilter: c.listingFilter || "", subject: c.subject || "", body: c.body, ctaText: c.ctaText || "", ctaLink: c.ctaLink || "", scheduledAt: c.scheduledAt || "" }); setShowCampaignBuilder(true); }} className="text-charcoal hover:bg-cream p-1.5 transition"><Edit3 size={14} /></button>
                      <button onClick={() => { setCampaignForm({ name: c.name + " (copy)", type: c.type, segment: c.segment, listingFilter: c.listingFilter || "", subject: c.subject || "", body: c.body, ctaText: c.ctaText || "", ctaLink: c.ctaLink || "", scheduledAt: "" }); setEditingCampaign(null); setShowCampaignBuilder(true); }} className="text-charcoal hover:bg-cream p-1.5 transition"><Copy size={14} /></button>
                    </div>
                  </div>
                  {c.sentAt && <p className="text-[10px] text-warm-gray mt-2">Sent {formatDateTime(c.sentAt)}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TEMPLATES TAB                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "templates" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-warm-gray">{templates.length} templates</p>
            <button onClick={() => { setEditingTemplate(null); setTemplateForm({ name: "", type: "email", category: "general", subject: "", body: "" }); setShowTemplateEditor(true); }} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5">
              <Plus size={12} /> New Template
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="bg-white border border-light-gray p-12 text-center">
              <FileText size={24} className="mx-auto mb-3 text-warm-gray/50" />
              <p className="text-sm text-charcoal mb-1">No message templates</p>
              <p className="text-xs text-warm-gray mb-4">Create reusable templates for booking confirmations, check-in instructions, review requests, and more.</p>
              <button onClick={() => setShowTemplateEditor(true)} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5">Create Template</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.map(t => (
                <div key={t.id} className="bg-white border border-light-gray p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-charcoal truncate">{t.name}</h3>
                    <div className="flex items-center gap-1">
                      <Badge className="text-warm-gray bg-cream">{t.type}</Badge>
                      <Badge className="text-warm-gray bg-cream">{t.category}</Badge>
                    </div>
                  </div>
                  {t.subject && <p className="text-xs text-warm-gray mb-2 truncate">Subject: {t.subject}</p>}
                  <p className="text-xs text-warm-gray line-clamp-2 mb-3">{t.body}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingTemplate(t); setTemplateForm({ name: t.name, type: t.type, category: t.category, subject: t.subject || "", body: t.body }); setShowTemplateEditor(true); }} className="text-charcoal hover:bg-cream p-1.5 transition"><Edit3 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Personalization Variables Reference */}
          <div className="bg-white border border-light-gray p-4 mt-6">
            <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-3">Personalization Variables</h3>
            <div className="flex flex-wrap gap-2">
              {["{{guest_first_name}}", "{{guest_full_name}}", "{{property_name}}", "{{listing_name}}", "{{checkin_date}}", "{{checkout_date}}", "{{portal_link}}", "{{review_link}}", "{{direct_booking_link}}", "{{discount_code}}"].map(v => (
                <code key={v} className="text-[10px] bg-cream px-2 py-1 text-charcoal border border-light-gray cursor-pointer hover:bg-light-gray transition" onClick={() => navigator.clipboard.writeText(v)}>{v}</code>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* AUTOMATIONS TAB                                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "automations" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-warm-gray">{automations.length} automation rules</p>
          </div>

          {/* Default Automations */}
          {(() => {
            const defaultAutomations = [
              { trigger: "booking-confirmed", name: "Send booking confirmation", delay: "0h", description: "Immediately after booking is confirmed" },
              { trigger: "booking-confirmed", name: "Send portal link", delay: "1h", description: "1 hour after booking confirmation" },
              { trigger: "terms-unsigned", name: "Terms reminder", delay: "48h", description: "If terms unsigned after 48 hours" },
              { trigger: "pre-arrival", name: "Check-in instructions", delay: "24h", description: "24 hours before check-in" },
              { trigger: "access-unlocked", name: "Door code available", delay: "0h", description: "When access window opens" },
              { trigger: "during-stay", name: "During-stay check-in", delay: "24h", description: "After first night of stay" },
              { trigger: "checkout-day", name: "Checkout reminder", delay: "0h", description: "Morning of checkout day" },
              { trigger: "post-checkout", name: "Review request", delay: "24h", description: "24 hours after checkout" },
              { trigger: "post-checkout", name: "Repeat guest offer", delay: "14d", description: "14 days after checkout" },
              { trigger: "win-back", name: "Win-back campaign", delay: "6m", description: "6 months after last stay" },
            ];

            const existingTriggers = new Set(automations.map(a => `${a.trigger}-${a.name}`));

            return (
              <div className="space-y-2">
                {defaultAutomations.map((da, i) => {
                  const existing = automations.find(a => a.trigger === da.trigger && a.name === da.name);
                  return (
                    <div key={i} className="bg-white border border-light-gray p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${existing?.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-warm-gray"}`}>
                          <Zap size={14} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium text-charcoal">{da.name}</h3>
                          <p className="text-xs text-warm-gray">{da.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge className="text-warm-gray bg-cream">{da.delay}</Badge>
                        {existing ? (
                          <button
                            onClick={() => toggleAutomation(existing)}
                            className={`w-10 h-5 rounded-full transition relative ${existing.isActive ? "bg-emerald-500" : "bg-gray-300"}`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${existing.isActive ? "left-5" : "left-0.5"}`} />
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              await fetch("/api/admin/automations", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name: da.name, trigger: da.trigger, delay: da.delay, isActive: false }),
                              });
                              await fetchAll();
                            }}
                            className="text-[10px] text-charcoal border border-light-gray px-2 py-1 hover:bg-cream transition"
                          >
                            Enable
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <div className="bg-amber-50 border border-amber-200 p-4 mt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-amber-800 font-medium">Email/SMS sending requires integration</p>
                <p className="text-xs text-amber-700 mt-1">Connect SendGrid, Mailgun, or Twilio in Settings &gt; Integrations to enable automated message delivery. Until then, automations will log actions but not send messages.</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ADD GUEST DRAWER                                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showAddGuest && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddGuest(false)} />
          <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-light-gray p-4 flex items-center justify-between z-10">
              <h2 className="font-serif text-lg text-charcoal">Add Guest</h2>
              <button onClick={() => setShowAddGuest(false)} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">First Name *</label>
                  <input value={newGuest.firstName} onChange={e => setNewGuest(p => ({ ...p, firstName: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Last Name *</label>
                  <input value={newGuest.lastName} onChange={e => setNewGuest(p => ({ ...p, lastName: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Email *</label>
                <input type="email" value={newGuest.email} onChange={e => setNewGuest(p => ({ ...p, email: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Phone</label>
                <input value={newGuest.phone} onChange={e => setNewGuest(p => ({ ...p, phone: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Source</label>
                <select value={newGuest.source} onChange={e => setNewGuest(p => ({ ...p, source: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 bg-white">
                  <option value="direct">Direct</option>
                  <option value="airbnb">Airbnb</option>
                  <option value="vrbo">VRBO</option>
                  <option value="booking">Booking.com</option>
                  <option value="referral">Referral</option>
                  <option value="website">Website</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button onClick={addGuest} disabled={saving || !newGuest.firstName || !newGuest.lastName || !newGuest.email} className="w-full bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-3 disabled:opacity-50">
                {saving ? "Saving..." : "Add Guest"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* GUEST PROFILE DRAWER                                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {selectedGuest && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedGuest(null)} />
          <div className="relative bg-white w-full max-w-2xl h-full overflow-y-auto shadow-xl">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-white border-b border-light-gray z-10">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cream border border-light-gray flex items-center justify-center text-sm font-medium text-charcoal">
                    {selectedGuest.firstName[0]}{selectedGuest.lastName[0] || ""}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-serif text-lg text-charcoal">{selectedGuest.firstName} {selectedGuest.lastName}</h2>
                      {selectedGuest.isVip && <Crown size={14} className="text-amber-500" />}
                      {selectedGuest.doNotHost && <Badge className="text-red-700 bg-red-50">Do Not Host</Badge>}
                    </div>
                    <p className="text-xs text-warm-gray">{selectedGuest.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedGuest(null)} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex overflow-x-auto px-4 gap-1">
                {[
                  { key: "profile", label: "Profile" },
                  { key: "bookings", label: "Bookings" },
                  { key: "accommodations", label: "Accommodations" },
                  { key: "timeline", label: "Timeline" },
                  { key: "requests", label: "Requests" },
                  { key: "reviews", label: "Reviews" },
                  { key: "doorcodes", label: "Door Codes" },
                ].map(tab => (
                  <DrawerTabButton key={tab.key} active={drawerTab === tab.key} onClick={() => setDrawerTab(tab.key)}>{tab.label}</DrawerTabButton>
                ))}
              </div>
            </div>

            <div className="p-4">
              {/* ── Profile Tab ── */}
              {drawerTab === "profile" && (
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => { setMessageForm({ channel: "email", subject: "", body: "", messageType: "manual" }); setShowMessageComposer(true); }} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-3 py-2 flex items-center gap-1.5"><Mail size={11} /> Email</button>
                    <button onClick={() => { setMessageForm({ channel: "sms", subject: "", body: "", messageType: "manual" }); setShowMessageComposer(true); }} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-3 py-2 flex items-center gap-1.5"><Smartphone size={11} /> SMS</button>
                    {selectedGuest.id && !selectedGuest.isVip && (
                      <button onClick={() => updateGuest(selectedGuest.id!, { isVip: true } as Partial<GuestRecord>)} className="border border-light-gray text-charcoal text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition px-3 py-2 flex items-center gap-1.5"><Crown size={11} /> Mark VIP</button>
                    )}
                    {selectedGuest.id && selectedGuest.isVip && (
                      <button onClick={() => updateGuest(selectedGuest.id!, { isVip: false } as Partial<GuestRecord>)} className="border border-amber-300 text-amber-700 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-amber-50 transition px-3 py-2 flex items-center gap-1.5"><Crown size={11} /> Remove VIP</button>
                    )}
                    {selectedGuest.id && !selectedGuest.doNotHost && (
                      <button onClick={() => { if (confirm("Mark this guest as Do Not Host?")) updateGuest(selectedGuest.id!, { doNotHost: true } as Partial<GuestRecord>); }} className="border border-red-200 text-red-600 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-red-50 transition px-3 py-2 flex items-center gap-1.5"><Ban size={11} /> Do Not Host</button>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="bg-cream/50 border border-light-gray p-4 space-y-3">
                    <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-warm-gray">Email:</span> <span className="text-charcoal">{selectedGuest.email}</span></div>
                      <div><span className="text-warm-gray">Phone:</span> <span className="text-charcoal">{selectedGuest.phone || "—"}</span></div>
                      <div><span className="text-warm-gray">Preferred:</span> <span className="text-charcoal capitalize">{selectedGuest.preferredContact}</span></div>
                      <div><span className="text-warm-gray">Source:</span> <span className="text-charcoal capitalize">{selectedGuest.source}</span></div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-cream/50 border border-light-gray p-3 text-center">
                      <p className="text-[9px] uppercase tracking-wider text-warm-gray font-medium mb-1">Bookings</p>
                      <p className="text-lg font-serif text-charcoal">{selectedGuest.totalBookings}</p>
                    </div>
                    <div className="bg-cream/50 border border-light-gray p-3 text-center">
                      <p className="text-[9px] uppercase tracking-wider text-warm-gray font-medium mb-1">Revenue</p>
                      <p className="text-lg font-serif text-charcoal">{formatCurrency(selectedGuest.lifetimeRevenue)}</p>
                    </div>
                    <div className="bg-cream/50 border border-light-gray p-3 text-center">
                      <p className="text-[9px] uppercase tracking-wider text-warm-gray font-medium mb-1">Messages</p>
                      <p className="text-lg font-serif text-charcoal">{selectedGuest.messageCount}</p>
                    </div>
                  </div>

                  {/* Marketing Preferences */}
                  <div className="bg-cream/50 border border-light-gray p-4 space-y-2">
                    <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Marketing Preferences</h3>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className={`flex items-center gap-1 ${selectedGuest.emailOptIn ? "text-emerald-600" : "text-red-500"}`}>
                        {selectedGuest.emailOptIn ? <CheckCircle size={12} /> : <XCircle size={12} />} Email
                      </span>
                      <span className={`flex items-center gap-1 ${selectedGuest.smsOptIn ? "text-emerald-600" : "text-red-500"}`}>
                        {selectedGuest.smsOptIn ? <CheckCircle size={12} /> : <XCircle size={12} />} SMS
                      </span>
                      <span className={`flex items-center gap-1 ${selectedGuest.marketingOptIn ? "text-emerald-600" : "text-red-500"}`}>
                        {selectedGuest.marketingOptIn ? <CheckCircle size={12} /> : <XCircle size={12} />} Marketing
                      </span>
                      {selectedGuest.doNotContact && <span className="flex items-center gap-1 text-red-500"><Ban size={12} /> Do Not Contact</span>}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="bg-cream/50 border border-light-gray p-4">
                    <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedGuest.tags.map(t => (
                        <span key={t.id} className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: t.color + "20", color: t.color }}>{t.name}</span>
                      ))}
                      {selectedGuest.tags.length === 0 && <span className="text-xs text-warm-gray">No tags</span>}
                    </div>
                  </div>

                  {/* Internal Notes */}
                  <div className="bg-cream/50 border border-light-gray p-4">
                    <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-2">Internal Notes</h3>
                    <p className="text-xs text-charcoal whitespace-pre-wrap mb-3">{selectedGuest.internalNotes || "No notes yet."}</p>
                    {selectedGuest.id && (
                      <div className="flex gap-2">
                        <input
                          value={newNote}
                          onChange={e => setNewNote(e.target.value)}
                          placeholder="Add a note..."
                          className="flex-1 border border-light-gray text-charcoal text-xs px-3 py-2 outline-none focus:border-charcoal/40"
                          onKeyDown={e => e.key === "Enter" && addNote(selectedGuest.id!)}
                        />
                        <button onClick={() => addNote(selectedGuest.id!)} className="bg-charcoal text-white text-[10px] px-3 py-2 hover:bg-stone transition">Add</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Bookings Tab ── */}
              {drawerTab === "bookings" && (
                <div className="space-y-3">
                  <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Booking History ({selectedGuest.reservations.length})</h3>
                  {selectedGuest.reservations.length === 0 ? (
                    <p className="text-xs text-warm-gray py-8 text-center">No bookings found for this guest.</p>
                  ) : (
                    selectedGuest.reservations.sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()).map(r => {
                      const nights = nightsBetween(r.checkIn, r.checkOut);
                      const codes = getDoorsForListing(r.listing.id);
                      return (
                        <div key={r.id} className="bg-cream/50 border border-light-gray p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium text-charcoal">{r.listing.title}</h4>
                              <Badge className={r.status === "confirmed" ? "text-emerald-700 bg-emerald-50" : r.status === "pending" ? "text-amber-700 bg-amber-50" : r.status === "completed" ? "text-blue-700 bg-blue-50" : "text-gray-500 bg-gray-100"}>
                                {r.status}
                              </Badge>
                            </div>
                            <span className="text-sm font-medium text-charcoal">{formatCurrency(r.totalPrice)}</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-warm-gray mb-2">
                            <div><span className="block text-[9px] uppercase tracking-wider font-medium mb-0.5">Check-in</span>{formatDate(r.checkIn)}</div>
                            <div><span className="block text-[9px] uppercase tracking-wider font-medium mb-0.5">Checkout</span>{formatDate(r.checkOut)}</div>
                            <div><span className="block text-[9px] uppercase tracking-wider font-medium mb-0.5">Nights</span>{nights}</div>
                            <div><span className="block text-[9px] uppercase tracking-wider font-medium mb-0.5">Guests</span>{r.guests}</div>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-warm-gray">
                            {r.accessCode && <span className="flex items-center gap-1"><Key size={10} /> Portal: {r.accessCode}</span>}
                            {r.channel && <span className="flex items-center gap-1"><Globe size={10} /> {r.channel}</span>}
                            {r.agreement ? <Badge className="text-emerald-700 bg-emerald-50">Terms Signed</Badge> : <Badge className="text-amber-700 bg-amber-50">Terms Pending</Badge>}
                          </div>
                          {/* Door Codes for this booking */}
                          {codes.length > 0 && (
                            <div className="mt-3 border-t border-light-gray pt-3">
                              <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-2">Door Codes</p>
                              <div className="space-y-1">
                                {codes.map(dc => (
                                  <div key={dc.id} className="flex items-center justify-between bg-white border border-light-gray px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <Key size={12} className="text-warm-gray" />
                                      <span className="text-xs text-charcoal">{dc.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <code className="text-xs font-mono text-charcoal bg-cream px-2 py-0.5">{dc.value}</code>
                                      <button onClick={() => navigator.clipboard.writeText(dc.value)} className="text-warm-gray hover:text-charcoal"><Copy size={12} /></button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {codes.some(c => c.sensitive) && <p className="text-[10px] text-warm-gray mt-1">Sensitive codes shown only within check-in window in guest portal</p>}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ── Accommodations Tab ── */}
              {drawerTab === "accommodations" && (
                <div className="space-y-4">
                  <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Accommodations & Preferences</h3>

                  {/* Accommodation Badges */}
                  <div className="flex flex-wrap gap-2">
                    {selectedGuest.accommodation?.accessibilityNeeds && <Badge className="text-blue-700 bg-blue-50"><Accessibility size={10} className="inline mr-1" />Accessibility</Badge>}
                    {selectedGuest.accommodation?.petNotes && <Badge className="text-amber-700 bg-amber-50"><PawPrint size={10} className="inline mr-1" />Pet Guest</Badge>}
                    {selectedGuest.accommodation?.familyNeeds && <Badge className="text-purple-700 bg-purple-50"><Baby size={10} className="inline mr-1" />Family</Badge>}
                    {selectedGuest.isVip && <Badge className="text-amber-700 bg-amber-50"><Crown size={10} className="inline mr-1" />VIP</Badge>}
                  </div>

                  {!selectedGuest.id ? (
                    <div className="bg-amber-50 border border-amber-200 p-4 text-xs text-amber-700">
                      Sync this guest from reservations first to save accommodations.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        { key: "accessibilityNeeds", label: "Accessibility Needs", icon: Accessibility },
                        { key: "familyNeeds", label: "Family Needs", icon: Baby },
                        { key: "petNotes", label: "Pet Notes", icon: PawPrint },
                        { key: "parkingNeeds", label: "Parking Needs", icon: Home },
                        { key: "sleepingPreferences", label: "Sleeping Preferences", icon: SunMoon },
                        { key: "temperaturePreferences", label: "Temperature Preferences", icon: SunMoon },
                        { key: "allergies", label: "Allergies / Sensitivities", icon: AlertTriangle },
                        { key: "specialOccasions", label: "Special Occasions", icon: Heart },
                        { key: "preferredCheckinTime", label: "Preferred Check-in Time", icon: Clock },
                        { key: "preferredCheckoutTime", label: "Preferred Checkout Time", icon: Clock },
                        { key: "hostNotes", label: "Host Notes", icon: Edit3 },
                      ].map(field => (
                        <div key={field.key}>
                          <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1 flex items-center gap-1.5">
                            <field.icon size={11} /> {field.label}
                          </label>
                          <input
                            value={(accommodationForm as Record<string, string | undefined>)[field.key] || ""}
                            onChange={e => setAccommodationForm(p => ({ ...p, [field.key]: e.target.value }))}
                            className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40"
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => saveAccommodation(selectedGuest.id!)}
                        disabled={saving}
                        className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save Accommodations"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Timeline Tab ── */}
              {drawerTab === "timeline" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Communication Timeline</h3>
                    <button onClick={() => { setMessageForm({ channel: "email", subject: "", body: "", messageType: "manual" }); setShowMessageComposer(true); }} className="text-[10px] text-charcoal border border-light-gray px-2 py-1 hover:bg-cream transition flex items-center gap-1"><Plus size={10} /> New Message</button>
                  </div>

                  {/* Build timeline from reservations and messages */}
                  {(() => {
                    const items: { date: string; type: string; content: string; channel: string; status?: string }[] = [];

                    // Add booking events
                    for (const r of selectedGuest.reservations) {
                      items.push({ date: r.checkIn, type: "booking", content: `Check-in at ${r.listing.title}`, channel: "system" });
                      items.push({ date: r.checkOut, type: "booking", content: `Checkout from ${r.listing.title}`, channel: "system" });
                      if (r.agreement) {
                        items.push({ date: r.agreement.signedAt, type: "agreement", content: `Signed terms for ${r.listing.title}`, channel: "portal" });
                      }
                    }

                    // Add requests
                    const guestRequests = getRequestsForGuest(selectedGuest.email);
                    for (const req of guestRequests) {
                      items.push({ date: req.createdAt, type: "request", content: `${req.category}: ${req.message.slice(0, 80)}`, channel: "portal", status: req.status });
                    }

                    // Sort by date descending
                    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    if (items.length === 0) {
                      return <p className="text-xs text-warm-gray py-8 text-center">No communication history yet.</p>;
                    }

                    return (
                      <div className="space-y-2">
                        {items.map((item, i) => (
                          <div key={i} className="flex gap-3 bg-cream/50 border border-light-gray p-3">
                            <div className={`w-7 h-7 flex items-center justify-center shrink-0 ${
                              item.type === "booking" ? "bg-blue-50 text-blue-600" :
                              item.type === "agreement" ? "bg-emerald-50 text-emerald-600" :
                              item.type === "request" ? "bg-amber-50 text-amber-600" :
                              item.channel === "email" ? "bg-purple-50 text-purple-600" :
                              item.channel === "sms" ? "bg-green-50 text-green-600" :
                              "bg-gray-100 text-warm-gray"
                            }`}>
                              {item.type === "booking" ? <Calendar size={12} /> :
                               item.type === "agreement" ? <CheckCircle size={12} /> :
                               item.type === "request" ? <MessageSquare size={12} /> :
                               item.channel === "email" ? <Mail size={12} /> :
                               item.channel === "sms" ? <Smartphone size={12} /> :
                               <Globe size={12} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-charcoal">{item.content}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-warm-gray">{formatDateTime(item.date)}</span>
                                <Badge className="text-warm-gray bg-white">{item.channel}</Badge>
                                {item.status && <Badge className={item.status === "resolved" ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"}>{item.status}</Badge>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ── Requests Tab ── */}
              {drawerTab === "requests" && (
                <div className="space-y-3">
                  <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Guest Requests</h3>
                  {(() => {
                    const guestRequests = getRequestsForGuest(selectedGuest.email);
                    if (guestRequests.length === 0) return <p className="text-xs text-warm-gray py-8 text-center">No requests from this guest.</p>;
                    return guestRequests.map(req => (
                      <div key={req.id} className="bg-cream/50 border border-light-gray p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={
                              req.priority === "urgent" ? "text-red-700 bg-red-50" :
                              req.priority === "high" ? "text-amber-700 bg-amber-50" :
                              "text-gray-500 bg-gray-100"
                            }>{req.priority}</Badge>
                            <Badge className="text-warm-gray bg-white">{req.category}</Badge>
                          </div>
                          <Badge className={
                            req.status === "resolved" || req.status === "closed" ? "text-emerald-700 bg-emerald-50" :
                            req.status === "in-progress" ? "text-blue-700 bg-blue-50" :
                            "text-amber-700 bg-amber-50"
                          }>{req.status}</Badge>
                        </div>
                        <p className="text-xs text-charcoal mb-2">{req.message}</p>
                        {req.adminReply && (
                          <div className="bg-white border border-light-gray p-2 mt-2">
                            <p className="text-[9px] uppercase tracking-wider text-warm-gray font-medium mb-1">Admin Reply</p>
                            <p className="text-xs text-charcoal">{req.adminReply}</p>
                          </div>
                        )}
                        <p className="text-[10px] text-warm-gray mt-2">{formatDateTime(req.createdAt)} · {req.reservation?.listing?.title}</p>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* ── Reviews Tab ── */}
              {drawerTab === "reviews" && (
                <div className="space-y-3">
                  <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Guest Reviews</h3>
                  {(() => {
                    const guestReviews = getReviewsForGuest(selectedGuest.email);
                    if (guestReviews.length === 0) return <p className="text-xs text-warm-gray py-8 text-center">No reviews from this guest.</p>;
                    return guestReviews.map(rev => (
                      <div key={rev.id} className="bg-cream/50 border border-light-gray p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={14} className={i < rev.overallRating ? "text-amber-400 fill-amber-400" : "text-gray-300"} />
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="text-warm-gray bg-white">{rev.source}</Badge>
                            <Badge className={rev.approvalStatus === "approved" ? "text-emerald-700 bg-emerald-50" : rev.approvalStatus === "rejected" ? "text-red-700 bg-red-50" : "text-amber-700 bg-amber-50"}>{rev.approvalStatus}</Badge>
                          </div>
                        </div>
                        {rev.comments && <p className="text-xs text-charcoal mb-2">{rev.comments}</p>}
                        {rev.adminResponse && (
                          <div className="bg-white border border-light-gray p-2 mt-2">
                            <p className="text-[9px] uppercase tracking-wider text-warm-gray font-medium mb-1">Admin Response</p>
                            <p className="text-xs text-charcoal">{rev.adminResponse}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-warm-gray">
                          <span>{formatDate(rev.createdAt)}</span>
                          <span>{rev.reservation?.listing?.title}</span>
                          {rev.publishToWebsite && <Badge className="text-emerald-700 bg-emerald-50">Published</Badge>}
                          {rev.featured && <Badge className="text-amber-700 bg-amber-50">Featured</Badge>}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* ── Door Codes Tab ── */}
              {drawerTab === "doorcodes" && (
                <div className="space-y-4">
                  <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Door Codes & Access</h3>
                  <p className="text-xs text-warm-gray">Door codes for each property this guest has booked. These codes are shared with the guest through the Check-In Portal based on timing and terms-signing rules.</p>

                  {selectedGuest.reservations.length === 0 ? (
                    <p className="text-xs text-warm-gray py-8 text-center">No bookings — no door codes to display.</p>
                  ) : (
                    selectedGuest.reservations.map(r => {
                      const codes = getDoorsForListing(r.listing.id);
                      const allInstructions = doorCodes.filter(dc => dc.listingId === r.listing.id);
                      return (
                        <div key={r.id} className="bg-cream/50 border border-light-gray p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-charcoal">{r.listing.title}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-warm-gray">{formatDate(r.checkIn)} – {formatDate(r.checkOut)}</span>
                              {r.agreement ? <Badge className="text-emerald-700 bg-emerald-50">Signed</Badge> : <Badge className="text-amber-700 bg-amber-50">Unsigned</Badge>}
                            </div>
                          </div>

                          {allInstructions.length === 0 ? (
                            <p className="text-xs text-warm-gray">No instructions configured for this property.</p>
                          ) : (
                            <div className="space-y-2">
                              {allInstructions.map(dc => (
                                <div key={dc.id} className="flex items-center justify-between bg-white border border-light-gray px-3 py-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {dc.category === "Door Codes" ? <Key size={12} className="text-warm-gray shrink-0" /> :
                                     dc.category === "WiFi" ? <Wifi size={12} className="text-warm-gray shrink-0" /> :
                                     <Home size={12} className="text-warm-gray shrink-0" />}
                                    <div className="min-w-0">
                                      <span className="text-xs text-charcoal block truncate">{dc.title}</span>
                                      <span className="text-[10px] text-warm-gray">{dc.category}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <code className="text-xs font-mono text-charcoal bg-cream px-2 py-0.5">{dc.value}</code>
                                    <button onClick={() => navigator.clipboard.writeText(dc.value)} className="text-warm-gray hover:text-charcoal transition"><Copy size={12} /></button>
                                    {dc.sensitive && <Badge className="text-amber-700 bg-amber-50">Sensitive</Badge>}
                                    {dc.visibleBeforeHours > 0 && <span className="text-[10px] text-warm-gray">{dc.visibleBeforeHours}h before</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {r.accessCode && (
                            <div className="mt-3 pt-3 border-t border-light-gray flex items-center justify-between">
                              <span className="text-xs text-warm-gray">Portal Access Code</span>
                              <div className="flex items-center gap-2">
                                <code className="text-xs font-mono text-charcoal bg-cream px-2 py-0.5">{r.accessCode}</code>
                                <button onClick={() => navigator.clipboard.writeText(r.accessCode!)} className="text-warm-gray hover:text-charcoal transition"><Copy size={12} /></button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MESSAGE COMPOSER MODAL                                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showMessageComposer && selectedGuest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMessageComposer(false)} />
          <div className="relative bg-white w-full max-w-lg mx-4 shadow-xl">
            <div className="border-b border-light-gray p-4 flex items-center justify-between">
              <h3 className="font-serif text-lg text-charcoal">Send {messageForm.channel === "email" ? "Email" : "SMS"}</h3>
              <button onClick={() => setShowMessageComposer(false)} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">To</label>
                <p className="text-xs text-charcoal">{selectedGuest.firstName} {selectedGuest.lastName} ({messageForm.channel === "email" ? selectedGuest.email : selectedGuest.phone || "No phone"})</p>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Channel</label>
                <div className="flex gap-2">
                  <button onClick={() => setMessageForm(p => ({ ...p, channel: "email" }))} className={`text-[10px] px-3 py-1.5 border transition ${messageForm.channel === "email" ? "bg-charcoal text-white border-charcoal" : "border-light-gray text-charcoal hover:bg-cream"}`}>Email</button>
                  <button onClick={() => setMessageForm(p => ({ ...p, channel: "sms" }))} className={`text-[10px] px-3 py-1.5 border transition ${messageForm.channel === "sms" ? "bg-charcoal text-white border-charcoal" : "border-light-gray text-charcoal hover:bg-cream"}`}>SMS</button>
                </div>
              </div>
              {messageForm.channel === "email" && (
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Subject</label>
                  <input value={messageForm.subject} onChange={e => setMessageForm(p => ({ ...p, subject: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
              )}
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Message</label>
                <textarea value={messageForm.body} onChange={e => setMessageForm(p => ({ ...p, body: e.target.value }))} rows={6} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 resize-none" />
              </div>
              <div className="bg-cream/50 border border-light-gray p-3">
                <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">Personalization</p>
                <div className="flex flex-wrap gap-1">
                  {["{{guest_first_name}}", "{{guest_full_name}}", "{{property_name}}", "{{checkin_date}}", "{{checkout_date}}"].map(v => (
                    <button key={v} onClick={() => setMessageForm(p => ({ ...p, body: p.body + " " + v }))} className="text-[9px] bg-white border border-light-gray px-1.5 py-0.5 hover:bg-cream transition">{v}</button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowMessageComposer(false)} className="text-[10px] tracking-[0.15em] uppercase text-charcoal border border-light-gray px-4 py-2.5 hover:bg-cream transition">Cancel</button>
                <button onClick={() => selectedGuest.id && sendMessage(selectedGuest.id)} disabled={saving || !messageForm.body} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 disabled:opacity-50 flex items-center gap-1.5">
                  <Send size={11} /> {saving ? "Sending..." : "Send"}
                </button>
              </div>
              <p className="text-[10px] text-warm-gray">Note: Message will be logged in CRM. Actual delivery requires email/SMS integration in Settings.</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CAMPAIGN BUILDER DRAWER                                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showCampaignBuilder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowCampaignBuilder(false)} />
          <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-light-gray p-4 flex items-center justify-between z-10">
              <h2 className="font-serif text-lg text-charcoal">{editingCampaign ? "Edit Campaign" : "New Campaign"}</h2>
              <button onClick={() => setShowCampaignBuilder(false)} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Campaign Name *</label>
                <input value={campaignForm.name} onChange={e => setCampaignForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" placeholder="e.g., Summer Return Offer" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Type</label>
                  <select value={campaignForm.type} onChange={e => setCampaignForm(p => ({ ...p, type: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="email_sms">Email + SMS</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Audience Segment</label>
                  <select value={campaignForm.segment} onChange={e => setCampaignForm(p => ({ ...p, segment: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                    <option value="all">All Guests</option>
                    <option value="past">Past Guests</option>
                    <option value="upcoming">Upcoming Guests</option>
                    <option value="current">Current Guests</option>
                    <option value="repeat">Repeat Guests</option>
                    <option value="vip">VIP Guests</option>
                    <option value="with-kids">Guests with Kids</option>
                    <option value="pet-guests">Pet Guests</option>
                    <option value="reviewed">Left a Review</option>
                    <option value="no-review">No Review Yet</option>
                    <option value="direct-booking">Direct Booking Leads</option>
                    <option value="holiday">Holiday Guests</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Property Filter (optional)</label>
                <input value={campaignForm.listingFilter} onChange={e => setCampaignForm(p => ({ ...p, listingFilter: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" placeholder="e.g., The Main Home" />
              </div>
              {(campaignForm.type === "email" || campaignForm.type === "email_sms") && (
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Subject Line</label>
                  <input value={campaignForm.subject} onChange={e => setCampaignForm(p => ({ ...p, subject: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" placeholder="e.g., We'd love to host you again, {{guest_first_name}}" />
                </div>
              )}
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Message Body *</label>
                <textarea value={campaignForm.body} onChange={e => setCampaignForm(p => ({ ...p, body: e.target.value }))} rows={8} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">CTA Button Text</label>
                  <input value={campaignForm.ctaText} onChange={e => setCampaignForm(p => ({ ...p, ctaText: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" placeholder="e.g., Book Now" />
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">CTA Link</label>
                  <input value={campaignForm.ctaLink} onChange={e => setCampaignForm(p => ({ ...p, ctaLink: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" placeholder="https://..." />
                </div>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Schedule (leave blank to send now)</label>
                <input type="datetime-local" value={campaignForm.scheduledAt} onChange={e => setCampaignForm(p => ({ ...p, scheduledAt: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
              </div>

              {/* Personalization */}
              <div className="bg-cream/50 border border-light-gray p-3">
                <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-2">Insert Variable</p>
                <div className="flex flex-wrap gap-1">
                  {["{{guest_first_name}}", "{{guest_full_name}}", "{{property_name}}", "{{listing_name}}", "{{checkin_date}}", "{{checkout_date}}", "{{portal_link}}", "{{review_link}}", "{{direct_booking_link}}", "{{discount_code}}"].map(v => (
                    <button key={v} onClick={() => setCampaignForm(p => ({ ...p, body: p.body + " " + v }))} className="text-[9px] bg-white border border-light-gray px-1.5 py-0.5 hover:bg-cream transition">{v}</button>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                <p className="font-medium mb-1">Exclusions Applied</p>
                <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                  <li>Unsubscribed guests will be excluded</li>
                  <li>Do-not-contact guests will be excluded</li>
                  <li>Do-not-host guests will be excluded</li>
                  {campaignForm.type === "sms" && <li>Guests without SMS opt-in will be excluded</li>}
                </ul>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowCampaignBuilder(false)} className="flex-1 text-[10px] tracking-[0.15em] uppercase text-charcoal border border-light-gray px-4 py-2.5 hover:bg-cream transition">Cancel</button>
                <button onClick={saveCampaign} disabled={saving || !campaignForm.name || !campaignForm.body} className="flex-1 bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 disabled:opacity-50">
                  {saving ? "Saving..." : editingCampaign ? "Update Campaign" : campaignForm.scheduledAt ? "Schedule Campaign" : "Save as Draft"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TEMPLATE EDITOR DRAWER                                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showTemplateEditor && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowTemplateEditor(false)} />
          <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-light-gray p-4 flex items-center justify-between z-10">
              <h2 className="font-serif text-lg text-charcoal">{editingTemplate ? "Edit Template" : "New Template"}</h2>
              <button onClick={() => setShowTemplateEditor(false)} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Template Name *</label>
                <input value={templateForm.name} onChange={e => setTemplateForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Type</label>
                  <select value={templateForm.type} onChange={e => setTemplateForm(p => ({ ...p, type: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Category</label>
                  <select value={templateForm.category} onChange={e => setTemplateForm(p => ({ ...p, category: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                    <option value="booking-confirmation">Booking Confirmation</option>
                    <option value="pre-arrival">Pre-Arrival</option>
                    <option value="terms-reminder">Terms Reminder</option>
                    <option value="check-in">Check-In Instructions</option>
                    <option value="door-code">Door Code Available</option>
                    <option value="during-stay">During-Stay Check-in</option>
                    <option value="checkout">Checkout Reminder</option>
                    <option value="review-request">Review Request</option>
                    <option value="repeat-offer">Repeat Guest Offer</option>
                    <option value="holiday-promo">Holiday Promo</option>
                    <option value="discount">Last-Minute Discount</option>
                    <option value="maintenance-followup">Maintenance Follow-up</option>
                    <option value="thank-you">Thank You</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>
              {templateForm.type === "email" && (
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Subject Line</label>
                  <input value={templateForm.subject} onChange={e => setTemplateForm(p => ({ ...p, subject: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
              )}
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Message Body *</label>
                <textarea value={templateForm.body} onChange={e => setTemplateForm(p => ({ ...p, body: e.target.value }))} rows={12} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 resize-none" />
              </div>

              <div className="bg-cream/50 border border-light-gray p-3">
                <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-2">Insert Variable</p>
                <div className="flex flex-wrap gap-1">
                  {["{{guest_first_name}}", "{{guest_full_name}}", "{{property_name}}", "{{listing_name}}", "{{checkin_date}}", "{{checkout_date}}", "{{portal_link}}", "{{review_link}}", "{{direct_booking_link}}", "{{discount_code}}"].map(v => (
                    <button key={v} onClick={() => setTemplateForm(p => ({ ...p, body: p.body + " " + v }))} className="text-[9px] bg-white border border-light-gray px-1.5 py-0.5 hover:bg-cream transition">{v}</button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowTemplateEditor(false)} className="flex-1 text-[10px] tracking-[0.15em] uppercase text-charcoal border border-light-gray px-4 py-2.5 hover:bg-cream transition">Cancel</button>
                <button onClick={saveTemplate} disabled={saving || !templateForm.name || !templateForm.body} className="flex-1 bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 disabled:opacity-50">
                  {saving ? "Saving..." : editingTemplate ? "Update Template" : "Save Template"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
