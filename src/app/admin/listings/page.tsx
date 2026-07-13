"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Plus, Pencil, X, Search, Filter, ChevronDown, ChevronRight, Camera,
  Calendar, DollarSign, Eye, MoreHorizontal, Check, AlertTriangle,
  ExternalLink, Copy, Archive, Trash2, Image, Wifi, Car, Home, Tv,
  Waves, Shield, Star, TrendingUp, BarChart3, Users, BedDouble, Bath,
  Clock, Settings, Link as LinkIcon, RefreshCw, Zap, Upload, ChevronUp,
  ArrowUp, ArrowDown, ArrowUpRight, ImagePlus, History
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Listing {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  pricePerNight: number;
  cleaningFee: number;
  amenities: string[];
  photos: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { reservations: number; galleryItems: number };
  galleryItems?: { media: { url: string; mimeType: string } }[];
  channelUrls?: Record<string, string> | null;
}

interface Media {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
  listingMedia: ListingMedia[];
  pageMedia: unknown[];
}

interface ListingMedia {
  id: string;
  listingId: string;
  mediaId: string;
  room: string | null;
  label: string | null;
  sortOrder: number;
  media: Media;
}

interface PricingConfig {
  id: string;
  listingId: string;
  baseNightlyRate: number | null;
  cleaningFee: number | null;
  weekendRate: number | null;
  minRate: number | null;
  maxRate: number | null;
  petFee: number | null;
  extraGuestFee: number | null;
  securityDeposit: number | null;
  minimumStay: number | null;
  dynamicPricingEnabled: boolean;
  pricingProvider: string | null;
  updatedAt: string;
}

interface PricingChangeLog {
  id: string;
  listingId: string;
  changedField: string;
  oldValue: string | null;
  newValue: string | null;
  changedFromPage: string | null;
  changedBy: string | null;
  affectsFinalPricing: boolean;
  createdAt: string;
}

type DrawerTab = "basic" | "photos" | "amenities" | "pricing" | "availability" | "channels" | "performance" | "advanced";

const LISTING_TYPES = ["Entire Home", "Private Room", "Shared Room", "Guest Suite", "Studio", "Loft"];

const ROOM_TYPES = [
  "Living Room", "Kitchen", "Master Bedroom", "Bedroom 2", "Bedroom 3",
  "Bathroom", "Master Bathroom", "Exterior", "Pool", "Patio",
  "Dining Room", "Backyard", "Front", "Other"
];

const AMENITY_CATEGORIES: Record<string, string[]> = {
  Essentials: ["WiFi", "Air Conditioning", "Heating", "Towels", "Linens", "Hot Water"],
  Kitchen: ["Kitchen", "Coffee Maker", "Refrigerator", "Microwave", "Dishwasher", "Cooking Basics"],
  Entertainment: ["TV", "Streaming Services", "Books", "Board Games"],
  Facilities: ["Washer", "Dryer", "Iron", "Hair Dryer", "Dedicated Workspace"],
  Outdoor: ["Patio", "Backyard", "Grill", "Outdoor Furniture", "Fire Pit"],
  Safety: ["Smoke Detector", "Carbon Monoxide Detector", "Fire Extinguisher", "First Aid Kit", "Security Cameras"],
  Parking: ["Free Parking", "Garage", "Street Parking"],
  Policies: ["Pets Allowed", "Self Check-in", "Smart Lock"],
};

const CHANNEL_LIST = [
  { name: "Direct Website", color: "bg-emerald-500", status: "Active", desc: "Bookings from your own website are automatically tracked.", url: "https://www.avenue10.net/listings" },
  { name: "Manual Booking", color: "bg-blue-500", status: "Active", desc: "Manually entered reservations and owner blocks.", url: "/admin/reservations" },
  { name: "Airbnb", color: "bg-rose-500", status: "Coming Soon", desc: "Sync listings, calendar, and pricing with Airbnb.", url: "https://www.airbnb.com/hosting" },
  { name: "VRBO", color: "bg-sky-500", status: "Coming Soon", desc: "Connect your VRBO account for unified management.", url: "https://www.vrbo.com/owner" },
  { name: "Booking.com", color: "bg-indigo-500", status: "Coming Soon", desc: "Manage Booking.com listings from one dashboard.", url: "https://admin.booking.com" },
];

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  type: "Entire Home",
  bedrooms: 1,
  bathrooms: 1,
  maxGuests: 2,
  pricePerNight: 100,
  cleaningFee: 0,
  amenities: [] as string[],
  photos: [] as string[],
  active: true,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function ComingSoonBadge() {
  return (
    <span className="text-[8px] tracking-[0.12em] uppercase bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 font-medium">
      Coming Soon
    </span>
  );
}

function IntegrationBadge() {
  return (
    <span className="text-[8px] tracking-[0.12em] uppercase bg-blue-50 text-blue-500 border border-blue-200 px-1.5 py-0.5 font-medium">
      Integration
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminListingsPage() {
  /* --- data state ------------------------------------------------- */
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  /* --- search / filter / sort ------------------------------------- */
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<string>("name-asc");

  /* --- bulk actions ----------------------------------------------- */
  const [selected, setSelected] = useState<Set<string>>(new Set());

  /* --- drawer state ----------------------------------------------- */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"edit" | "create">("edit");
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("basic");
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  /* --- create wizard step ----------------------------------------- */
  const [createStep, setCreateStep] = useState(0);

  /* --- inline edit state ------------------------------------------ */
  const [inlineEdit, setInlineEdit] = useState<{ id: string; field: "pricePerNight" | "cleaningFee" } | null>(null);
  const [inlineValue, setInlineValue] = useState("");
  const [inlineSaved, setInlineSaved] = useState<string | null>(null);
  const inlineRef = useRef<HTMLInputElement>(null);

  /* --- more dropdown ---------------------------------------------- */
  const [moreOpenId, setMoreOpenId] = useState<string | null>(null);

  /* --- delete confirmation ---------------------------------------- */
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  /* --- photos tab state ------------------------------------------- */
  const [galleryItems, setGalleryItems] = useState<ListingMedia[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [allMedia, setAllMedia] = useState<Media[]>([]);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaRoomFilter, setMediaRoomFilter] = useState("");
  const [mediaSelected, setMediaSelected] = useState<Set<string>>(new Set());
  const [assignRoom, setAssignRoom] = useState("");
  const [assignLabel, setAssignLabel] = useState("");
  const [editingGalleryItem, setEditingGalleryItem] = useState<string | null>(null);
  const [editRoom, setEditRoom] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* --- pricing tab state ------------------------------------------ */
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingForm, setPricingForm] = useState({
    baseNightlyRate: 0,
    cleaningFee: 0,
    weekendRate: null as number | null,
    minRate: null as number | null,
    maxRate: null as number | null,
    petFee: null as number | null,
    extraGuestFee: null as number | null,
    securityDeposit: null as number | null,
    minimumStay: null as number | null,
    dynamicPricingEnabled: false,
    pricingProvider: "",
  });
  const [pricingLogs, setPricingLogs] = useState<PricingChangeLog[]>([]);
  const [showPricingHistory, setShowPricingHistory] = useState(false);
  const [pricingHistoryLoading, setPricingHistoryLoading] = useState(false);

  /* --- channel urls state ------------------------------------------ */
  const [channelUrls, setChannelUrls] = useState<Record<string, string>>({});
  const [channelSaving, setChannelSaving] = useState(false);

  /* --- integrations state ------------------------------------------ */
  const [globalIntegrations, setGlobalIntegrations] = useState<Record<string, { status: string; connectionUrl: string | null }>>({});

  /* --- availability / stay rules state ----------------------------- */
  interface SalesConfigStayRules {
    minimumStay: number;
    maximumStay: number;
    sameDayBookingAllowed: boolean;
    advanceNoticeHours: number;
  }
  const [stayRules, setStayRules] = useState<SalesConfigStayRules | null>(null);
  const [stayRulesLoading, setStayRulesLoading] = useState(false);
  const [stayRulesSaving, setStayRulesSaving] = useState(false);

  /* --- load listings ---------------------------------------------- */
  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/listings");
      const data = await res.json();
      setListings(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadListings(); }, [loadListings]);

  useEffect(() => {
    fetch("/api/admin/integrations").then(r => r.json()).then(data => {
      if (!Array.isArray(data)) return;
      const map: Record<string, { status: string; connectionUrl: string | null }> = {};
      for (const i of data) map[i.name] = { status: i.status, connectionUrl: i.connectionUrl };
      setGlobalIntegrations(map);
    }).catch(() => {});
  }, []);

  /* --- close more dropdown on outside click ----------------------- */
  useEffect(() => {
    if (!moreOpenId) return;
    const handler = () => setMoreOpenId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [moreOpenId]);

  /* --- focus inline input ----------------------------------------- */
  useEffect(() => {
    if (inlineEdit && inlineRef.current) inlineRef.current.focus();
  }, [inlineEdit]);

  /* --- load gallery items when photos tab opens ------------------- */
  const loadGalleryItems = useCallback(async (listingId: string) => {
    setGalleryLoading(true);
    try {
      const res = await fetch(`/api/admin/listing-media?listingId=${listingId}`);
      const data = await res.json();
      setGalleryItems(Array.isArray(data) ? data.sort((a: ListingMedia, b: ListingMedia) => a.sortOrder - b.sortOrder) : []);
    } catch { setGalleryItems([]); }
    setGalleryLoading(false);
  }, []);

  const loadAllMedia = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/media");
      const data = await res.json();
      setAllMedia(Array.isArray(data) ? data : []);
    } catch { setAllMedia([]); }
  }, []);

  /* --- load pricing config ---------------------------------------- */
  const loadPricingConfig = useCallback(async (listingId: string) => {
    setPricingLoading(true);
    try {
      const res = await fetch(`/api/admin/pricing-config?listingId=${listingId}`);
      if (res.ok) {
        const data = await res.json();
        setPricingConfig(data);
        setPricingForm({
          baseNightlyRate: data.baseNightlyRate ?? 0,
          cleaningFee: data.cleaningFee ?? 0,
          weekendRate: data.weekendRate,
          minRate: data.minRate,
          maxRate: data.maxRate,
          petFee: data.petFee,
          extraGuestFee: data.extraGuestFee,
          securityDeposit: data.securityDeposit,
          minimumStay: data.minimumStay,
          dynamicPricingEnabled: data.dynamicPricingEnabled ?? false,
          pricingProvider: data.pricingProvider ?? "",
        });
      } else {
        setPricingConfig(null);
      }
    } catch { setPricingConfig(null); }
    setPricingLoading(false);
  }, []);

  const loadPricingLogs = useCallback(async (listingId: string) => {
    setPricingHistoryLoading(true);
    try {
      const res = await fetch(`/api/admin/pricing-logs?listingId=${listingId}`);
      if (res.ok) {
        const data = await res.json();
        setPricingLogs(Array.isArray(data) ? data : []);
      } else {
        setPricingLogs([]);
      }
    } catch { setPricingLogs([]); }
    setPricingHistoryLoading(false);
  }, []);

  /* --- load / save stay rules from SalesConfig -------------------- */
  const loadStayRules = useCallback(async (listingId: string) => {
    setStayRulesLoading(true);
    try {
      const res = await fetch(`/api/admin/sales?listingId=${listingId}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setStayRules({
            minimumStay: data.minimumStay ?? 1,
            maximumStay: data.maximumStay ?? 30,
            sameDayBookingAllowed: data.sameDayBookingAllowed ?? false,
            advanceNoticeHours: data.advanceNoticeHours ?? 24,
          });
        } else {
          setStayRules(null);
        }
      }
    } catch { setStayRules(null); }
    setStayRulesLoading(false);
  }, []);

  async function saveStayRules() {
    if (!editingListing || !stayRules) return;
    setStayRulesSaving(true);
    try {
      await fetch("/api/admin/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: editingListing.id,
          ...stayRules,
        }),
      });
    } catch { /* ignore */ }
    setStayRulesSaving(false);
  }

  /* ---------------------------------------------------------------- */
  /*  Derived data                                                     */
  /* ---------------------------------------------------------------- */

  const totalListings = listings.length;
  const activeListings = listings.filter(l => l.active).length;
  const inactiveListings = totalListings - activeListings;
  const avgRate = totalListings > 0 ? Math.round(listings.reduce((s, l) => s + l.pricePerNight, 0) / totalListings) : 0;
  const totalReservations = listings.reduce((s, l) => s + (l._count?.reservations ?? 0), 0);
  const needsAttention = listings.filter(l =>
    (l._count?.galleryItems ?? l.photos.length) === 0 || l.amenities.length === 0 || l.pricePerNight === 0
  ).length;

  /* --- filtered + sorted ------------------------------------------ */
  let filtered = listings.filter(l => {
    if (searchQuery && !l.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter === "active" && !l.active) return false;
    if (statusFilter === "inactive" && l.active) return false;
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "name-asc": return a.title.localeCompare(b.title);
      case "name-desc": return b.title.localeCompare(a.title);
      case "price-asc": return a.pricePerNight - b.pricePerNight;
      case "price-desc": return b.pricePerNight - a.pricePerNight;
      case "newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      default: return 0;
    }
  });

  /* ---------------------------------------------------------------- */
  /*  Actions                                                          */
  /* ---------------------------------------------------------------- */

  function openEditDrawer(listing: Listing) {
    setEditingListing(listing);
    setForm({
      title: listing.title,
      slug: listing.slug,
      description: listing.description,
      type: listing.type,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      maxGuests: listing.maxGuests,
      pricePerNight: listing.pricePerNight,
      cleaningFee: listing.cleaningFee,
      amenities: [...listing.amenities],
      photos: [...listing.photos],
      active: listing.active,
    });
    setDrawerMode("edit");
    setDrawerTab("basic");
    setDeleteConfirmText("");
    setGalleryItems([]);
    setPricingConfig(null);
    setShowPricingHistory(false);
    setPricingLogs([]);
    setStayRules(null);
    setChannelUrls({});
    setMediaLibraryOpen(false);
    setMediaSelected(new Set());
    setDrawerOpen(true);
  }

  function openCreateDrawer() {
    setEditingListing(null);
    setForm({ ...emptyForm, amenities: [], photos: [] });
    setDrawerMode("create");
    setCreateStep(0);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingListing(null);
  }

  async function saveTab() {
    if (!editingListing) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/listings/${editingListing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await loadListings();
      const updated = listings.find(l => l.id === editingListing.id);
      if (updated) setEditingListing({ ...updated, ...form } as Listing);
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function createListing(active: boolean) {
    setSaving(true);
    try {
      await fetch("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, active }),
      });
      await loadListings();
      closeDrawer();
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function deleteListing(id: string) {
    await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
    await loadListings();
    closeDrawer();
  }

  async function toggleActive(listing: Listing) {
    await fetch(`/api/admin/listings/${listing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !listing.active }),
    });
    await loadListings();
  }

  async function bulkSetActive(active: boolean) {
    const promises = Array.from(selected).map(id =>
      fetch(`/api/admin/listings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      })
    );
    await Promise.all(promises);
    setSelected(new Set());
    await loadListings();
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(l => l.id)));
    }
  }

  async function inlineSave(listing: Listing, field: "pricePerNight" | "cleaningFee") {
    const val = parseFloat(inlineValue);
    if (isNaN(val)) { setInlineEdit(null); return; }
    await fetch(`/api/admin/listings/${listing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: val }),
    });
    setInlineEdit(null);
    setInlineSaved(listing.id + field);
    setTimeout(() => setInlineSaved(null), 1500);
    await loadListings();
  }

  /* --- Photo actions ---------------------------------------------- */

  async function removeGalleryItem(itemId: string) {
    if (!editingListing) return;
    try {
      await fetch("/api/admin/listing-media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId }),
      });
      await loadGalleryItems(editingListing.id);
    } catch { /* ignore */ }
  }

  async function updateGalleryItem(itemId: string, data: { room?: string; label?: string; sortOrder?: number }) {
    if (!editingListing) return;
    try {
      await fetch("/api/admin/listing-media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, ...data }),
      });
      await loadGalleryItems(editingListing.id);
    } catch { /* ignore */ }
  }

  async function moveGalleryItem(itemId: string, direction: "up" | "down") {
    const idx = galleryItems.findIndex(g => g.id === itemId);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= galleryItems.length) return;

    const current = galleryItems[idx];
    const target = galleryItems[targetIdx];

    await Promise.all([
      updateGalleryItem(current.id, { sortOrder: target.sortOrder }),
      updateGalleryItem(target.id, { sortOrder: current.sortOrder }),
    ]);
  }

  async function setAsCover(itemId: string) {
    if (!editingListing) return;
    // Set this item to sortOrder 0, shift others
    const sorted = [...galleryItems].sort((a, b) => a.sortOrder - b.sortOrder);
    const updates: Promise<void>[] = [];
    let order = 1;
    for (const item of sorted) {
      if (item.id === itemId) {
        updates.push(updateGalleryItem(item.id, { sortOrder: 0 }));
      } else {
        updates.push(updateGalleryItem(item.id, { sortOrder: order }));
        order++;
      }
    }
    await Promise.all(updates);
  }

  async function addMediaToListing(mediaIds: string[]) {
    if (!editingListing) return;
    const currentMax = galleryItems.length > 0 ? Math.max(...galleryItems.map(g => g.sortOrder)) : -1;
    let nextOrder = currentMax + 1;

    for (const mediaId of mediaIds) {
      try {
        await fetch("/api/admin/listing-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: editingListing.id,
            mediaId,
            room: assignRoom || null,
            label: assignLabel || null,
          }),
        });
        nextOrder++;
      } catch { /* ignore */ }
    }
    setMediaSelected(new Set());
    setAssignRoom("");
    setAssignLabel("");
    await loadGalleryItems(editingListing.id);
  }

  async function uploadAndAssignPhoto(files: FileList) {
    if (!editingListing || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const uploaded = await res.json();
        const mediaIds = Array.isArray(uploaded)
          ? uploaded.map((m: Media) => m.id)
          : [uploaded.id];
        await addMediaToListing(mediaIds);
        await loadAllMedia();
      }
    } catch { /* ignore */ }
    setUploading(false);
  }

  /* --- Pricing actions -------------------------------------------- */

  async function savePricing() {
    if (!editingListing) return;
    setSaving(true);
    try {
      await fetch("/api/admin/pricing-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: editingListing.id,
          baseNightlyRate: pricingForm.baseNightlyRate,
          cleaningFee: pricingForm.cleaningFee,
          weekendRate: pricingForm.weekendRate,
          minRate: pricingForm.minRate,
          maxRate: pricingForm.maxRate,
          petFee: pricingForm.petFee,
          extraGuestFee: pricingForm.extraGuestFee,
          securityDeposit: pricingForm.securityDeposit,
          minimumStay: pricingForm.minimumStay,
          dynamicPricingEnabled: pricingForm.dynamicPricingEnabled,
          pricingProvider: pricingForm.pricingProvider || null,
          changedFromPage: "listings",
        }),
      });
      await loadPricingConfig(editingListing.id);
    } catch { /* ignore */ }
    setSaving(false);
  }

  /* ---------------------------------------------------------------- */
  /*  Amenity helpers                                                  */
  /* ---------------------------------------------------------------- */

  function toggleAmenity(name: string) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(name)
        ? f.amenities.filter(a => a !== name)
        : [...f.amenities, name],
    }));
  }

  /* ---------------------------------------------------------------- */
  /*  Tab change handler                                               */
  /* ---------------------------------------------------------------- */

  function handleTabChange(tab: DrawerTab) {
    setDrawerTab(tab);
    if (!editingListing) return;

    if (tab === "photos") {
      loadGalleryItems(editingListing.id);
      loadAllMedia();
    }
    if (tab === "pricing") {
      loadPricingConfig(editingListing.id);
      setShowPricingHistory(false);
    }
    if (tab === "availability") {
      loadStayRules(editingListing.id);
    }
    if (tab === "channels") {
      setChannelUrls((editingListing.channelUrls as Record<string, string>) ?? {});
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Style constants                                                  */
  /* ---------------------------------------------------------------- */

  const inputClass = "w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 transition-colors";
  const labelClass = "text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1 block";
  const btnPrimary = "bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 disabled:opacity-40";
  const btnOutline = "border border-light-gray text-charcoal text-xs hover:bg-cream transition px-3 py-2";

  /* ---------------------------------------------------------------- */
  /*  Render helpers                                                   */
  /* ---------------------------------------------------------------- */

  const CREATE_STEPS = ["Basic Info", "Rooms & Guests", "Pricing", "Amenities", "Review & Create"];

  function renderCreateWizard() {
    return (
      <div>
        {/* Step indicators */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
          {CREATE_STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-1 shrink-0">
              <div className={`w-6 h-6 flex items-center justify-center text-[10px] font-medium border ${
                i <= createStep ? "bg-charcoal text-white border-charcoal" : "border-light-gray text-warm-gray"
              }`}>
                {i < createStep ? <Check size={12} /> : i + 1}
              </div>
              <span className={`text-[9px] tracking-[0.1em] uppercase ${i <= createStep ? "text-charcoal" : "text-warm-gray"}`}>
                {label}
              </span>
              {i < CREATE_STEPS.length - 1 && <ChevronRight size={12} className="text-warm-gray mx-1" />}
            </div>
          ))}
        </div>

        {createStep === 0 && (
          <div className="space-y-4">
            <div><label className={labelClass}>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>URL Slug</label><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className={inputClass} placeholder="e.g. beach-house" /></div>
            <div><label className={labelClass}>Description</label><textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputClass} resize-none`} /></div>
            <div>
              <label className={labelClass}>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inputClass}>
                {LISTING_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        )}

        {createStep === 1 && (
          <div className="space-y-4">
            <div><label className={labelClass}>Bedrooms</label><input type="number" min={0} value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: Number(e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Bathrooms</label><input type="number" min={0} value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: Number(e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Max Guests</label><input type="number" min={1} value={form.maxGuests} onChange={e => setForm({ ...form, maxGuests: Number(e.target.value) })} className={inputClass} /></div>
          </div>
        )}

        {createStep === 2 && (
          <div className="space-y-4">
            <div><label className={labelClass}>Price Per Night ($)</label><input type="number" min={0} step={0.01} value={form.pricePerNight} onChange={e => setForm({ ...form, pricePerNight: Number(e.target.value) })} className={inputClass} /></div>
            <div><label className={labelClass}>Cleaning Fee ($)</label><input type="number" min={0} step={0.01} value={form.cleaningFee} onChange={e => setForm({ ...form, cleaningFee: Number(e.target.value) })} className={inputClass} /></div>
          </div>
        )}

        {createStep === 3 && renderAmenitiesChecklist()}

        {createStep === 4 && (
          <div className="space-y-3">
            <p className={labelClass}>Review Your Listing</p>
            <div className="border border-light-gray p-4 space-y-2">
              <div className="text-sm font-medium text-charcoal">{form.title || "(No title)"}</div>
              <div className="text-xs text-warm-gray">/{form.slug || "..."}</div>
              <div className="text-xs text-warm-gray">{form.type} &middot; {form.bedrooms} bed &middot; {form.bathrooms} bath &middot; {form.maxGuests} guests</div>
              <div className="text-xs text-charcoal">${form.pricePerNight}/night &middot; ${form.cleaningFee} cleaning fee</div>
              <div className="text-xs text-warm-gray">{form.amenities.length} amenities selected</div>
              {form.description && <p className="text-xs text-warm-gray line-clamp-3">{form.description}</p>}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {createStep > 0 && (
            <button type="button" onClick={() => setCreateStep(createStep - 1)} className={btnOutline}>Back</button>
          )}
          <div className="flex-1" />
          {createStep < 4 && (
            <button type="button" onClick={() => setCreateStep(createStep + 1)} className={btnPrimary}>Next</button>
          )}
          {createStep === 4 && (
            <>
              <button type="button" onClick={() => createListing(false)} disabled={saving} className={btnOutline}>
                {saving ? "Saving..." : "Save as Draft"}
              </button>
              <button type="button" onClick={() => createListing(true)} disabled={saving} className={btnPrimary}>
                {saving ? "Creating..." : "Create Listing"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  function renderAmenitiesChecklist() {
    return (
      <div className="space-y-5">
        {Object.entries(AMENITY_CATEGORIES).map(([cat, items]) => (
          <div key={cat}>
            <p className={`${labelClass} mb-2`}>{cat}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {items.map(item => (
                <label key={item} className="flex items-center gap-2 cursor-pointer px-2 py-1.5 hover:bg-cream/60 transition">
                  <input
                    type="checkbox"
                    checked={form.amenities.includes(item)}
                    onChange={() => toggleAmenity(item)}
                    className="accent-charcoal"
                  />
                  <span className="text-xs text-charcoal">{item}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* --- Photos tab ------------------------------------------------- */

  function renderPhotosTab() {
    if (!editingListing) return null;

    const filteredMedia = allMedia.filter(m => {
      if (mediaSearch && !m.filename.toLowerCase().includes(mediaSearch.toLowerCase()) && !m.originalName.toLowerCase().includes(mediaSearch.toLowerCase())) return false;
      if (mediaRoomFilter) {
        const assignedRooms = m.listingMedia?.map(lm => lm.room).filter(Boolean) ?? [];
        if (!assignedRooms.includes(mediaRoomFilter)) return false;
      }
      return true;
    });

    return (
      <div className="space-y-5">
        {/* Current Listing Photos */}
        <div>
          <p className={labelClass}>Listing Gallery ({galleryItems.length} photos)</p>
          {galleryLoading ? (
            <div className="text-xs text-warm-gray py-4 text-center">Loading photos...</div>
          ) : galleryItems.length === 0 ? (
            <div className="border border-dashed border-light-gray p-6 text-center">
              <Camera size={24} className="text-warm-gray mx-auto mb-2" />
              <p className="text-xs text-warm-gray">No photos assigned to this listing yet.</p>
              <p className="text-[9px] text-warm-gray mt-1">Add photos from the Media Library below.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {galleryItems.map((item, idx) => (
                <div key={item.id} className="border border-light-gray bg-white p-2 flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 bg-cream border border-light-gray overflow-hidden shrink-0">
                    {item.media.mimeType?.startsWith("video/") ? (
                      <video src={item.media.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={item.media.url} alt={item.label || ""} className="w-full h-full object-cover" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.sortOrder === 0 && (
                        <span className="text-[8px] tracking-[0.12em] uppercase bg-emerald-50 text-accent border border-emerald-200 px-1.5 py-0.5 font-medium">
                          Cover
                        </span>
                      )}
                      {item.room && (
                        <span className="text-[8px] tracking-[0.12em] uppercase bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 font-medium">
                          {item.room}
                        </span>
                      )}
                      <span className="text-[9px] text-warm-gray">#{item.sortOrder}</span>
                    </div>
                    {editingGalleryItem === item.id ? (
                      <div className="mt-1.5 space-y-1.5">
                        <select
                          value={editRoom}
                          onChange={e => setEditRoom(e.target.value)}
                          className={`${inputClass} py-1.5 text-[10px]`}
                        >
                          <option value="">No Room</option>
                          {ROOM_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <input
                          value={editLabel}
                          onChange={e => setEditLabel(e.target.value)}
                          placeholder="Caption / label"
                          className={`${inputClass} py-1.5 text-[10px]`}
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={async () => {
                              await updateGalleryItem(item.id, { room: editRoom || undefined, label: editLabel || undefined });
                              setEditingGalleryItem(null);
                            }}
                            className={`${btnPrimary} py-1 px-2 text-[8px]`}
                          >
                            Save
                          </button>
                          <button onClick={() => setEditingGalleryItem(null)} className={`${btnOutline} py-1 px-2 text-[9px]`}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-warm-gray mt-0.5 truncate">{item.label || item.media.originalName || item.media.filename}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => moveGalleryItem(item.id, "up")}
                      disabled={idx === 0}
                      className={`${btnOutline} p-1 disabled:opacity-20`}
                      title="Move up"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={() => moveGalleryItem(item.id, "down")}
                      disabled={idx === galleryItems.length - 1}
                      className={`${btnOutline} p-1 disabled:opacity-20`}
                      title="Move down"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingGalleryItem(item.id);
                        setEditRoom(item.room || "");
                        setEditLabel(item.label || "");
                      }}
                      className={`${btnOutline} p-1`}
                      title="Edit room/label"
                    >
                      <Pencil size={12} />
                    </button>
                    {item.sortOrder !== 0 && (
                      <button
                        onClick={() => setAsCover(item.id)}
                        className={`${btnOutline} p-1`}
                        title="Set as cover"
                      >
                        <Star size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => removeGalleryItem(item.id)}
                      className="border border-red-200 text-red-500 hover:bg-red-50 transition p-1"
                      title="Remove from listing"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Open Full Media Library link */}
        <a href="/admin/media" className={`flex items-center gap-2 ${btnOutline} w-full justify-center text-[10px]`}>
          <ExternalLink size={12} /> Open Full Media Library
        </a>

        {/* Mini Media Library Panel */}
        <div className="border border-light-gray">
          <button
            onClick={() => {
              setMediaLibraryOpen(!mediaLibraryOpen);
              if (!mediaLibraryOpen) loadAllMedia();
            }}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-cream/50 transition"
          >
            <span className={labelClass + " mb-0"}>Add From Media Library</span>
            {mediaLibraryOpen ? <ChevronUp size={14} className="text-warm-gray" /> : <ChevronDown size={14} className="text-warm-gray" />}
          </button>

          {mediaLibraryOpen && (
            <div className="px-4 pb-4 space-y-3 border-t border-light-gray pt-3">
              {/* Search & filter */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-warm-gray" />
                  <input
                    value={mediaSearch}
                    onChange={e => setMediaSearch(e.target.value)}
                    placeholder="Search by filename..."
                    className={`${inputClass} pl-7 py-1.5 text-[10px]`}
                  />
                </div>
                <select
                  value={mediaRoomFilter}
                  onChange={e => setMediaRoomFilter(e.target.value)}
                  className={`${inputClass} w-auto py-1.5 text-[10px]`}
                >
                  <option value="">All Rooms</option>
                  {ROOM_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Media grid */}
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {filteredMedia.map(m => {
                  const isSelected = mediaSelected.has(m.id);
                  const alreadyAssigned = galleryItems.some(g => g.mediaId === m.id);
                  return (
                    <button
                      key={m.id}
                      disabled={alreadyAssigned}
                      onClick={() => {
                        if (alreadyAssigned) return;
                        setMediaSelected(prev => {
                          const next = new Set(prev);
                          if (next.has(m.id)) next.delete(m.id); else next.add(m.id);
                          return next;
                        });
                      }}
                      className={`relative aspect-square bg-cream border overflow-hidden transition ${
                        alreadyAssigned
                          ? "border-light-gray opacity-40 cursor-not-allowed"
                          : isSelected
                            ? "border-charcoal ring-2 ring-charcoal/30"
                            : "border-light-gray hover:border-charcoal/40"
                      }`}
                    >
                      {m.mimeType?.startsWith("video/") ? (
                        <video src={m.url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={m.url} alt={m.originalName} className="w-full h-full object-cover" />
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-charcoal text-white w-5 h-5 flex items-center justify-center">
                          <Check size={12} />
                        </div>
                      )}
                      {alreadyAssigned && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                          <span className="text-[8px] tracking-[0.1em] uppercase font-medium text-warm-gray">Added</span>
                        </div>
                      )}
                    </button>
                  );
                })}
                {filteredMedia.length === 0 && (
                  <div className="col-span-3 text-center py-4 text-xs text-warm-gray">No media found.</div>
                )}
              </div>

              {/* Assignment fields */}
              {mediaSelected.size > 0 && (
                <div className="border border-light-gray p-3 space-y-2 bg-cream/30">
                  <p className="text-[9px] tracking-[0.1em] uppercase text-charcoal font-medium">{mediaSelected.size} photo{mediaSelected.size !== 1 ? "s" : ""} selected</p>
                  <div className="flex gap-2">
                    <select
                      value={assignRoom}
                      onChange={e => setAssignRoom(e.target.value)}
                      className={`${inputClass} flex-1 py-1.5 text-[10px]`}
                    >
                      <option value="">Room (optional)</option>
                      {ROOM_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <input
                      value={assignLabel}
                      onChange={e => setAssignLabel(e.target.value)}
                      placeholder="Label (optional)"
                      className={`${inputClass} flex-1 py-1.5 text-[10px]`}
                    />
                  </div>
                  <button
                    onClick={() => addMediaToListing(Array.from(mediaSelected))}
                    className={`w-full ${btnPrimary} py-2`}
                  >
                    Add Selected to Listing
                  </button>
                </div>
              )}

              {/* Upload new */}
              <div className="border-t border-light-gray pt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => { if (e.target.files) uploadAndAssignPhoto(e.target.files); }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={`w-full ${btnOutline} flex items-center justify-center gap-2 text-[10px]`}
                >
                  <Upload size={12} />
                  {uploading ? "Uploading..." : "Upload New Photo"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* --- Pricing tab ------------------------------------------------ */

  function renderPricingTab() {
    if (!editingListing) return null;

    return (
      <div className="space-y-5">
        {/* Pricing Source Display */}
        <div className="border border-light-gray p-4 bg-cream/30 space-y-2">
          <p className={labelClass}>Pricing Overview</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[9px] text-warm-gray uppercase tracking-wide">Current Rate</span>
              <p className="text-lg font-serif text-charcoal">${pricingForm.baseNightlyRate || editingListing.pricePerNight}</p>
            </div>
            <div>
              <span className="text-[9px] text-warm-gray uppercase tracking-wide">Source</span>
              <p className="text-xs text-charcoal mt-0.5">Sales Manager</p>
            </div>
            <div>
              <span className="text-[9px] text-warm-gray uppercase tracking-wide">Cleaning Fee</span>
              <p className="text-xs text-charcoal mt-0.5">${pricingForm.cleaningFee || editingListing.cleaningFee || 0}</p>
            </div>
            <div>
              <span className="text-[9px] text-warm-gray uppercase tracking-wide">Dynamic Pricing</span>
              <p className="text-xs text-charcoal mt-0.5">
                {pricingForm.dynamicPricingEnabled ? (
                  <span className="text-accent">On</span>
                ) : (
                  <span className="text-warm-gray">Off</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Sales Manager redirect */}
        <div className="flex items-start gap-2 border border-blue-200 bg-blue-50 px-3 py-2.5">
          <DollarSign size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-blue-700 leading-relaxed">
            All pricing is managed through the Sales Manager. Board rates, fees, add-ons, dynamic pricing, promos, and booking rules are configured in one place.
          </p>
        </div>

        <a
          href={`/admin/sales?listing=${editingListing?.id || ""}`}
          className={`w-full ${btnPrimary} flex items-center justify-center gap-2`}
        >
          <DollarSign size={14} /> Open Sales Manager
        </a>

        <div className="flex flex-wrap gap-2">
          <a href={`/admin/availability?listing=${editingListing?.id || ""}`} className={`${btnOutline} flex items-center gap-1.5 text-[10px]`}>
            <Calendar size={12} /> View Calendar
          </a>
        </div>
      </div>
    );
  }

  /* --- Drawer content --------------------------------------------- */

  function renderDrawerContent() {
    if (drawerMode === "create") return renderCreateWizard();

    const tabs: { key: DrawerTab; label: string }[] = [
      { key: "basic", label: "Basic Info" },
      { key: "photos", label: "Photos" },
      { key: "amenities", label: "Amenities" },
      { key: "pricing", label: "Pricing" },
      { key: "availability", label: "Availability" },
      { key: "channels", label: "Channels" },
      { key: "performance", label: "Performance" },
      { key: "advanced", label: "Advanced" },
    ];

    return (
      <div>
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-3 mb-5 border-b border-light-gray">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`text-[9px] tracking-[0.12em] uppercase font-medium px-3 py-1.5 whitespace-nowrap transition ${
                drawerTab === t.key ? "bg-charcoal text-white" : "text-warm-gray hover:text-charcoal hover:bg-cream"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {drawerTab === "basic" && (
          <div className="space-y-4">
            <div><label className={labelClass}>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>URL Slug</label><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Description</label><textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputClass} resize-none`} /></div>
            <div>
              <label className={labelClass}>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inputClass}>
                {LISTING_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelClass}>Bedrooms</label><input type="number" min={0} value={form.bedrooms} onChange={e => setForm({ ...form, bedrooms: Number(e.target.value) })} className={inputClass} /></div>
              <div><label className={labelClass}>Bathrooms</label><input type="number" min={0} value={form.bathrooms} onChange={e => setForm({ ...form, bathrooms: Number(e.target.value) })} className={inputClass} /></div>
              <div><label className={labelClass}>Max Guests</label><input type="number" min={1} value={form.maxGuests} onChange={e => setForm({ ...form, maxGuests: Number(e.target.value) })} className={inputClass} /></div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="accent-charcoal" />
              <span className="text-xs text-charcoal">Active (visible to guests)</span>
            </label>
            <button onClick={saveTab} disabled={saving} className={`w-full ${btnPrimary}`}>{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        )}

        {drawerTab === "photos" && renderPhotosTab()}

        {drawerTab === "amenities" && (
          <div className="space-y-4">
            {renderAmenitiesChecklist()}
            <button onClick={saveTab} disabled={saving} className={`w-full ${btnPrimary}`}>{saving ? "Saving..." : "Save Amenities"}</button>
          </div>
        )}

        {drawerTab === "pricing" && renderPricingTab()}

        {drawerTab === "availability" && (
          <div className="space-y-4">
            <a href={`/admin/availability?listing=${editingListing?.id || ""}`} className={`flex items-center gap-2 ${btnOutline} w-full justify-center`}>
              <Calendar size={14} /> Open Calendar Manager
            </a>

            {stayRulesLoading ? (
              <div className="text-xs text-warm-gray py-4 text-center">Loading stay rules...</div>
            ) : stayRules ? (
              <div className="space-y-4">
                <div className="border border-light-gray p-4 bg-cream/30">
                  <p className={labelClass}>Stay Rules</p>
                  <p className="text-[9px] text-warm-gray mt-0.5 mb-3">Per-listing rules synced with Sales Manager</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Minimum Stay (nights)</label>
                      <input
                        type="number" min={1} step={1}
                        value={stayRules.minimumStay}
                        onChange={e => setStayRules({ ...stayRules, minimumStay: Number(e.target.value) || 1 })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Maximum Stay (nights)</label>
                      <input
                        type="number" min={1} step={1}
                        value={stayRules.maximumStay}
                        onChange={e => setStayRules({ ...stayRules, maximumStay: Number(e.target.value) || 30 })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className={labelClass}>Advance Notice (hours)</label>
                    <input
                      type="number" min={0} step={1}
                      value={stayRules.advanceNoticeHours}
                      onChange={e => setStayRules({ ...stayRules, advanceNoticeHours: Number(e.target.value) || 0 })}
                      className={inputClass}
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer py-3 mt-2">
                    <div
                      onClick={() => setStayRules({ ...stayRules, sameDayBookingAllowed: !stayRules.sameDayBookingAllowed })}
                      className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${stayRules.sameDayBookingAllowed ? "bg-charcoal" : "bg-stone-300"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${stayRules.sameDayBookingAllowed ? "translate-x-4" : "translate-x-0.5"}`} />
                    </div>
                    <div>
                      <span className="text-xs text-charcoal">Allow Same-Day Booking</span>
                      <p className="text-[9px] text-warm-gray">Guests can book for today if advance notice window has passed</p>
                    </div>
                  </label>
                </div>
                <button onClick={saveStayRules} disabled={stayRulesSaving} className={`w-full ${btnPrimary}`}>
                  {stayRulesSaving ? "Saving..." : "Save Stay Rules"}
                </button>
              </div>
            ) : (
              <div className="border border-light-gray p-4 text-center">
                <p className="text-xs text-warm-gray mb-2">No Sales Config found for this listing.</p>
                <a href={`/admin/sales?listing=${editingListing?.id || ""}`} className={`${btnPrimary} inline-flex items-center gap-2`}>
                  <DollarSign size={12} /> Set Up in Sales Manager
                </a>
              </div>
            )}

            <p className="text-[9px] tracking-[0.1em] uppercase text-warm-gray">Manage blocked dates and calendar in the Calendar tab</p>
          </div>
        )}

        {drawerTab === "channels" && (
          <div className="space-y-3">
            {CHANNEL_LIST.map(ch => {
              const key = ch.name.toLowerCase().replace(/[^a-z]/g, "");
              const savedUrl = channelUrls[key] || "";
              const isInternal = ch.status === "Active";
              const globalInt = globalIntegrations[ch.name];
              const isGlobalConnected = globalInt?.status === "connected";
              const globalUrl = globalInt?.connectionUrl || "";
              const displayUrl = savedUrl || globalUrl || ch.url;
              const isLinked = isInternal || savedUrl || isGlobalConnected;

              let statusLabel = "Not Linked";
              let statusClass = "bg-amber-50 text-amber-600 border border-amber-200";
              if (isInternal) {
                statusLabel = "Active";
                statusClass = "bg-emerald-50 text-accent border border-emerald-200";
              } else if (savedUrl) {
                statusLabel = "Linked";
                statusClass = "bg-emerald-50 text-accent border border-emerald-200";
              } else if (isGlobalConnected) {
                statusLabel = "Connected";
                statusClass = "bg-blue-50 text-blue-600 border border-blue-200";
              }

              return (
                <div key={ch.name} className="border border-light-gray p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${ch.color}`} />
                    <span className="text-sm font-medium text-charcoal">{ch.name}</span>
                    <span className={`ml-auto text-[8px] tracking-[0.12em] uppercase font-medium px-1.5 py-0.5 ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-xs text-warm-gray mb-2">{ch.desc}</p>
                  {!isInternal && (
                    <div className="mb-2">
                      <input
                        value={savedUrl}
                        onChange={e => setChannelUrls(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={isGlobalConnected && !savedUrl ? `Connected via Integrations — add listing-specific URL` : `Paste your ${ch.name} listing URL`}
                        className={inputClass}
                      />
                      {isGlobalConnected && !savedUrl && globalUrl && (
                        <p className="text-[10px] text-blue-500 mt-1">
                          Using integration URL: {globalUrl.replace(/^https?:\/\//, "").substring(0, 50)}
                        </p>
                      )}
                    </div>
                  )}
                  <a
                    href={displayUrl}
                    target={displayUrl.startsWith("/") ? "_self" : "_blank"}
                    rel={displayUrl.startsWith("/") ? undefined : "noopener noreferrer"}
                    className={`inline-flex items-center gap-1.5 ${isLinked ? "text-accent border-emerald-200" : "text-warm-gray border-light-gray hover:text-charcoal hover:border-charcoal/30"} border text-[9px] tracking-[0.12em] uppercase font-medium px-3 py-1.5 transition-colors`}
                  >
                    {isLinked ? "Open" : "Visit"} {ch.name} <ArrowUpRight size={10} />
                  </a>
                </div>
              );
            })}
            <button
              onClick={async () => {
                if (!editingListing) return;
                setChannelSaving(true);
                try {
                  await fetch(`/api/admin/listings/${editingListing.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ channelUrls }),
                  });
                  setListings(prev => prev.map(l => l.id === editingListing.id ? { ...l, channelUrls } : l));
                  setEditingListing({ ...editingListing, channelUrls });
                } catch { /* ignore */ }
                setChannelSaving(false);
              }}
              disabled={channelSaving}
              className={`w-full ${btnPrimary}`}
            >
              {channelSaving ? "Saving..." : "Save Channel Links"}
            </button>
            <a
              href="/admin/integrations"
              className="block text-center text-[10px] tracking-[0.12em] uppercase text-warm-gray hover:text-charcoal transition-colors mt-1"
            >
              Manage Integrations →
            </a>
          </div>
        )}

        {drawerTab === "performance" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-light-gray p-4">
                <p className={labelClass}>Monthly Revenue</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-serif text-charcoal">$0</span>
                  <IntegrationBadge />
                </div>
              </div>
              <div className="border border-light-gray p-4">
                <p className={labelClass}>Occupancy</p>
                <span className="text-lg font-serif text-charcoal">&mdash;</span>
              </div>
              <div className="border border-light-gray p-4">
                <p className={labelClass}>ADR</p>
                <span className="text-lg font-serif text-charcoal">${editingListing?.pricePerNight ?? 0}</span>
              </div>
              <div className="border border-light-gray p-4">
                <p className={labelClass}>Reservations</p>
                <span className="text-lg font-serif text-charcoal">{editingListing?._count?.reservations ?? 0}</span>
              </div>
            </div>
            <p className="text-[9px] tracking-[0.1em] uppercase text-warm-gray">Connect integrations for live performance data</p>
          </div>
        )}

        {drawerTab === "advanced" && editingListing && (
          <div className="space-y-4">
            <button
              onClick={async () => { await toggleActive(editingListing); await loadListings(); closeDrawer(); }}
              className={`w-full ${btnOutline}`}
            >
              {editingListing.active ? "Deactivate Listing" : "Activate Listing"}
            </button>
            <button onClick={() => alert("Archive functionality coming soon.")} className={`w-full ${btnOutline}`}>
              <span className="flex items-center justify-center gap-2"><Archive size={14} /> Archive Listing</span>
            </button>
            <button onClick={() => alert("Duplicate functionality coming soon.")} className={`w-full ${btnOutline}`}>
              <span className="flex items-center justify-center gap-2"><Copy size={14} /> Duplicate Listing</span>
            </button>

            <div className="border-t border-light-gray pt-4 mt-4">
              <p className="text-[9px] tracking-[0.15em] uppercase text-red-500 font-medium mb-2">Danger Zone</p>
              <p className="text-xs text-warm-gray mb-3">Type DELETE to permanently remove this listing.</p>
              <input
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder='Type "DELETE" to confirm'
                className={`${inputClass} border-red-200 focus:border-red-400 mb-3`}
              />
              <button
                disabled={deleteConfirmText !== "DELETE"}
                onClick={() => deleteListing(editingListing.id)}
                className="w-full bg-red-600 text-white text-[10px] tracking-[0.15em] uppercase font-medium py-2.5 hover:bg-red-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2"><Trash2 size={14} /> Permanently Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Main render                                                      */
  /* ---------------------------------------------------------------- */

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-charcoal font-light">Manage Listings</h1>
        <button onClick={openCreateDrawer} className={`flex items-center gap-2 ${btnPrimary}`}>
          <Plus size={14} /> Add Listing
        </button>
      </div>

      {/* ============================================================ */}
      {/*  1. Summary Cards                                             */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Listings", value: totalListings, icon: Home, href: "/admin/listings" },
          { label: "Active", value: activeListings, icon: Check, color: "text-accent", href: "/admin/listings" },
          { label: "Inactive", value: inactiveListings, icon: Clock, color: "text-warm-gray", href: "/admin/listings" },
          { label: "Avg Nightly Rate", value: `$${avgRate}`, icon: DollarSign, href: "/admin/sales" },
          { label: "Total Reservations", value: totalReservations, icon: Calendar, href: "/admin/reservations" },
          { label: "Needs Attention", value: needsAttention, icon: AlertTriangle, color: needsAttention > 0 ? "text-amber-500" : "text-warm-gray", href: "/admin/listings" },
        ].map(card => (
          <a key={card.label} href={card.href} className="bg-white border border-light-gray p-4 hover:border-charcoal/30 hover:shadow-sm transition-all cursor-pointer block">
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={14} className="text-warm-gray" />
              <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">{card.label}</span>
            </div>
            <span className={`text-xl font-serif ${card.color ?? "text-charcoal"}`}>{card.value}</span>
          </a>
        ))}
      </div>

      {/* ============================================================ */}
      {/*  2. Search & Filter Bar                                       */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search listings..."
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              className={`${inputClass} w-auto pr-8 appearance-none`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Filter size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className={`${inputClass} w-auto pr-8 appearance-none`}
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price-asc">Price Low-High</option>
              <option value="price-desc">Price High-Low</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-gray pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  3. Bulk Actions Bar                                          */}
      {/* ============================================================ */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-cream border border-light-gray px-4 py-2.5 mb-4">
          <span className="text-xs text-charcoal font-medium">{selected.size} selected</span>
          <button onClick={() => bulkSetActive(true)} className="text-[9px] tracking-[0.12em] uppercase font-medium text-accent hover:underline">Activate Selected</button>
          <button onClick={() => bulkSetActive(false)} className="text-[9px] tracking-[0.12em] uppercase font-medium text-warm-gray hover:underline">Deactivate Selected</button>
          <button onClick={() => setSelected(new Set())} className="text-[9px] tracking-[0.12em] uppercase font-medium text-warm-gray hover:underline ml-auto">Clear</button>
        </div>
      )}

      {/* Select all checkbox */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <input
            type="checkbox"
            checked={selected.size === filtered.length && filtered.length > 0}
            onChange={toggleSelectAll}
            className="accent-charcoal"
          />
          <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Select All</span>
        </div>
      )}

      {/* ============================================================ */}
      {/*  4. Listing Cards                                             */}
      {/* ============================================================ */}
      {loading ? (
        <div className="text-center py-12 text-warm-gray text-xs">Loading listings...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-warm-gray text-xs">No listings found.</div>
      ) : (
        <div className="space-y-3 mb-8">
          {filtered.map(listing => (
            <div key={listing.id} className="bg-white border border-light-gray p-4 flex flex-col md:flex-row gap-4">
              {/* Left: checkbox + photo */}
              <div className="flex items-start gap-3 shrink-0">
                <input
                  type="checkbox"
                  checked={selected.has(listing.id)}
                  onChange={() => toggleSelect(listing.id)}
                  className="accent-charcoal mt-1"
                />
                <div className="w-20 h-20 bg-cream border border-light-gray flex items-center justify-center overflow-hidden shrink-0">
                  {(() => {
                    const imageItem = listing.galleryItems?.find(g => !g.media.mimeType?.startsWith("video/"));
                    const coverUrl = imageItem?.media.url ?? null;
                    const photoUrl = listing.photos.length > 0 ? listing.photos[0] : null;
                    const src = coverUrl || photoUrl;
                    return src ? (
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={20} className="text-warm-gray" />
                    );
                  })()}
                </div>
              </div>

              {/* Center: details */}
              <div className="flex-1 min-w-0">
                <button onClick={() => openEditDrawer(listing)} className="text-sm font-medium text-charcoal hover:underline text-left">
                  {listing.title}
                </button>
                <p className="text-xs text-warm-gray mt-0.5">
                  {listing.type} &middot; {listing.bedrooms} bed &middot; {listing.bathrooms} bath &middot; {listing.maxGuests} guests
                </p>

                {/* Inline-editable pricing */}
                <div className="flex items-center gap-3 mt-1 text-xs text-charcoal">
                  {inlineEdit?.id === listing.id && inlineEdit.field === "pricePerNight" ? (
                    <span className="flex items-center gap-1">
                      $<input
                        ref={inlineRef}
                        value={inlineValue}
                        onChange={e => setInlineValue(e.target.value)}
                        onBlur={() => inlineSave(listing, "pricePerNight")}
                        onKeyDown={e => { if (e.key === "Enter") inlineSave(listing, "pricePerNight"); if (e.key === "Escape") setInlineEdit(null); }}
                        className="w-16 border border-charcoal/30 px-1 py-0.5 text-xs outline-none"
                      />/night
                    </span>
                  ) : (
                    <button
                      onClick={() => { setInlineEdit({ id: listing.id, field: "pricePerNight" }); setInlineValue(String(listing.pricePerNight)); }}
                      className="hover:bg-cream px-1 py-0.5 transition cursor-text"
                      title="Click to edit"
                    >
                      ${listing.pricePerNight}/night
                      {inlineSaved === listing.id + "pricePerNight" && <Check size={12} className="inline ml-1 text-accent" />}
                    </button>
                  )}
                  <span className="text-warm-gray">&middot;</span>
                  {inlineEdit?.id === listing.id && inlineEdit.field === "cleaningFee" ? (
                    <span className="flex items-center gap-1">
                      $<input
                        ref={inlineRef}
                        value={inlineValue}
                        onChange={e => setInlineValue(e.target.value)}
                        onBlur={() => inlineSave(listing, "cleaningFee")}
                        onKeyDown={e => { if (e.key === "Enter") inlineSave(listing, "cleaningFee"); if (e.key === "Escape") setInlineEdit(null); }}
                        className="w-16 border border-charcoal/30 px-1 py-0.5 text-xs outline-none"
                      /> cleaning
                    </span>
                  ) : (
                    <button
                      onClick={() => { setInlineEdit({ id: listing.id, field: "cleaningFee" }); setInlineValue(String(listing.cleaningFee)); }}
                      className="hover:bg-cream px-1 py-0.5 transition cursor-text"
                      title="Click to edit"
                    >
                      ${listing.cleaningFee} cleaning fee
                      {inlineSaved === listing.id + "cleaningFee" && <Check size={12} className="inline ml-1 text-accent" />}
                    </button>
                  )}
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[9px] tracking-[0.1em] uppercase font-medium bg-cream px-2 py-0.5 text-charcoal">
                    {listing.amenities.length} amenities
                  </span>
                  <button
                    onClick={() => { openEditDrawer(listing); setTimeout(() => handleTabChange("photos"), 100); }}
                    className="text-[9px] tracking-[0.1em] uppercase font-medium bg-cream px-2 py-0.5 text-charcoal flex items-center gap-1 hover:bg-light-gray transition-colors cursor-pointer"
                  >
                    <Image size={10} /> {listing._count?.galleryItems ?? listing.photos.length} photos
                  </button>
                  <span className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 ${
                    listing.active ? "bg-emerald-50 text-accent" : "bg-stone-100 text-warm-gray"
                  }`}>
                    {listing.active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Channel badges */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <a href={`/listings/${listing.slug}`} target="_blank" rel="noopener noreferrer" className="text-[8px] tracking-[0.1em] uppercase font-medium bg-emerald-50 text-accent border border-emerald-200 px-1.5 py-0.5 hover:bg-emerald-100 transition-colors cursor-pointer">Direct</a>
                  {CHANNEL_LIST.filter(ch => ch.status !== "Active").map(ch => {
                    const key = ch.name.toLowerCase().replace(/[^a-z]/g, "");
                    const listingUrl = (listing.channelUrls as Record<string, string> | null)?.[key];
                    const globalInt = globalIntegrations[ch.name];
                    const isConnected = !!listingUrl || globalInt?.status === "connected";
                    const linkUrl = listingUrl || globalInt?.connectionUrl || ch.url;
                    return (
                      <a
                        key={ch.name}
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-[8px] tracking-[0.1em] uppercase font-medium px-1.5 py-0.5 flex items-center gap-1 transition-colors cursor-pointer ${
                          isConnected
                            ? "bg-emerald-50 text-accent border border-emerald-200 hover:bg-emerald-100"
                            : "bg-stone-50 text-warm-gray border border-light-gray hover:bg-stone-100"
                        }`}
                      >
                        {ch.name} {!isConnected && <span className="text-[7px] opacity-60">Soon</span>}
                      </a>
                    );
                  })}
                </div>

                {/* Last updated */}
                <p className="text-[9px] text-warm-gray mt-2 flex items-center gap-1">
                  <Clock size={10} /> Updated {relativeTime(listing.updatedAt)}
                </p>
              </div>

              {/* Right: action buttons */}
              <div className="flex md:flex-col items-start gap-1.5 shrink-0">
                <button onClick={() => openEditDrawer(listing)} className={`${btnOutline} flex items-center gap-1.5 text-[10px]`}>
                  <Pencil size={12} /> Edit
                </button>
                <a href={`/admin/availability?listing=${listing.id}`} className={`${btnOutline} flex items-center gap-1.5 text-[10px]`}>
                  <Calendar size={12} /> Calendar
                </a>
                <a href={`/admin/sales?listing=${listing.id}`} className={`${btnOutline} flex items-center gap-1.5 text-[10px]`}>
                  <DollarSign size={12} /> Pricing
                </a>
                <a href={`/listings/${listing.slug}`} target="_blank" rel="noopener noreferrer" className={`${btnOutline} flex items-center gap-1.5 text-[10px]`}>
                  <Eye size={12} /> Preview
                </a>

                {/* More dropdown */}
                <div className="relative">
                  <button
                    onClick={e => { e.stopPropagation(); setMoreOpenId(moreOpenId === listing.id ? null : listing.id); }}
                    className={`${btnOutline} flex items-center gap-1.5 text-[10px]`}
                  >
                    <MoreHorizontal size={12} />
                  </button>
                  {moreOpenId === listing.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-light-gray shadow-lg z-40 min-w-[160px]">
                      <button
                        onClick={() => { toggleActive(listing); setMoreOpenId(null); }}
                        className="w-full text-left px-4 py-2 text-xs text-charcoal hover:bg-cream transition"
                      >
                        {listing.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => { alert("Archive functionality coming soon."); setMoreOpenId(null); }}
                        className="w-full text-left px-4 py-2 text-xs text-charcoal hover:bg-cream transition flex items-center gap-2"
                      >
                        <Archive size={12} /> Archive
                      </button>
                      <button
                        onClick={() => { alert("Duplicate functionality coming soon."); setMoreOpenId(null); }}
                        className="w-full text-left px-4 py-2 text-xs text-charcoal hover:bg-cream transition flex items-center gap-2"
                      >
                        <Copy size={12} /> Duplicate
                      </button>
                      <button
                        onClick={() => {
                          setMoreOpenId(null);
                          if (confirm("Are you sure you want to delete this listing?")) {
                            if (confirm("This action is permanent and cannot be undone. Continue?")) {
                              deleteListing(listing.id);
                            }
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition flex items-center gap-2"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/*  5/6. Drawer (Edit + Create)                                  */}
      {/* ============================================================ */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeDrawer}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xl bg-white border-l border-light-gray z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6">
          {/* Drawer header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl text-charcoal font-light">
              {drawerMode === "create" ? "New Listing" : (editingListing?.title ?? "Edit Listing")}
            </h2>
            <button onClick={closeDrawer} className="p-1 hover:bg-cream transition">
              <X size={18} className="text-warm-gray" />
            </button>
          </div>

          {renderDrawerContent()}
        </div>
      </div>
    </div>
  );
}
