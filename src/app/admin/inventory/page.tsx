"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Package,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Plus,
  X,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  Home,
  Layers,
  ShoppingCart,
  CheckCircle,
  XCircle,
  Wrench,
  Trash2,
  Edit3,
  Copy,
  Camera,
  FileText,
  ClipboardCheck,
  BarChart3,
  Clock,
  Tag,
  Star,
  Shield,
  Plug,
  ArrowRight,
  MoreHorizontal,
  Ban,
  Archive,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────

interface PropertyInventoryItem {
  id: string;
  propertyId: string;
  unitId: string | null;
  roomId: string | null;
  itemName: string;
  category: string;
  itemType: string;
  description: string | null;
  quantityExpected: number;
  quantityOnHand: number;
  quantityUsed: number;
  quantityMissing: number;
  reorderThreshold: number;
  unitCost: number;
  avgUnitCost: number;
  replacementCost: number;
  remainingValue: number;
  inventoryStatus: string;
  conditionStatus: string;
  vendorId: string | null;
  purchaseDate: string | null;
  lastCheckedAt: string | null;
  lastRestockedAt: string | null;
  guestVisible: boolean;
  cleanerCheckRequired: boolean;
  receiptUrl: string | null;
  photoUrl: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  room?: InventoryRoomRecord | null;
  vendor?: VendorRecord | null;
}

interface InventoryRoomRecord {
  id: string;
  propertyId: string;
  listingId: string | null;
  roomName: string;
  roomType: string;
  displayOrder: number;
  notes: string | null;
  isActive: boolean;
}

interface VendorRecord {
  id: string;
  vendorName: string;
  vendorType: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
}

interface ListingRecord {
  id: string;
  title: string;
  slug: string;
}

interface InventoryIssueRecord {
  id: string;
  propertyId: string;
  itemId: string | null;
  issueType: string;
  issueDescription: string;
  priority: string;
  status: string;
  reportedBy: string | null;
  replacementCost: number;
  createdAt: string;
  item?: PropertyInventoryItem | null;
}

interface InventoryUsageRecord {
  id: string;
  propertyId: string;
  itemId: string;
  bookingId: string | null;
  usageDate: string;
  quantityUsed: number;
  unitCostAtUsage: number;
  totalUsageCost: number;
  reason: string;
  notes: string | null;
  createdAt: string;
}

// ─── Constants ──────────────────────────────────────────────────────────

const CATEGORIES = [
  "Linens", "Towels", "Bathroom Supplies", "Kitchen Supplies", "Cleaning Supplies",
  "Guest Amenities", "Furniture", "Electronics", "Safety Items", "Maintenance Items",
  "Outdoor Items", "Consumables", "Reusable Items", "Fixed Assets", "Other",
];

const ITEM_TYPES = [
  "consumable", "reusable", "fixed_asset", "replacement", "guest_amenity", "cleaning_supply", "safety_item",
];

const ITEM_TYPE_LABELS: Record<string, string> = {
  consumable: "Consumable", reusable: "Reusable", fixed_asset: "Fixed Asset",
  replacement: "Replacement", guest_amenity: "Guest Amenity", cleaning_supply: "Cleaning Supply", safety_item: "Safety Item",
};

const STATUS_COLORS: Record<string, string> = {
  ok: "text-emerald-700 bg-emerald-50",
  low_stock: "text-amber-700 bg-amber-50",
  missing: "text-red-700 bg-red-50",
  damaged: "text-red-600 bg-red-50",
  replace_soon: "text-orange-700 bg-orange-50",
  restocked: "text-blue-700 bg-blue-50",
  archived: "text-gray-500 bg-gray-100",
};

const CONDITION_COLORS: Record<string, string> = {
  new: "text-emerald-700 bg-emerald-50",
  good: "text-emerald-600 bg-emerald-50",
  worn: "text-amber-700 bg-amber-50",
  damaged: "text-red-600 bg-red-50",
  missing: "text-red-700 bg-red-50",
  replaced: "text-blue-700 bg-blue-50",
};

const DEFAULT_ROOMS = [
  "Master Suite", "Bedroom 1", "Bedroom 2", "Bathroom 1", "Bathroom 2",
  "Kitchen", "Living Room", "Dining Room", "Laundry", "Patio / Backyard",
  "Parking / Exterior", "Cleaning Closet", "Safety", "Other",
];

const USAGE_REASONS = [
  "guest_stay", "cleaning", "damage", "missing", "maintenance", "replacement", "restock",
];

// ─── Helpers ────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 0 });

const formatCurrencyDecimal = (amount: number) =>
  "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

const statusLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

// ─── Sub-Components ─────────────────────────────────────────────────────

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 ${className}`}>{children}</span>;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Package }) {
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
    <button onClick={onClick} className={`text-[10px] tracking-[0.15em] uppercase font-medium px-4 py-2.5 transition whitespace-nowrap ${active ? "bg-charcoal text-white" : "text-charcoal/60 hover:text-charcoal hover:bg-cream"}`}>
      {children}
    </button>
  );
}

function DrawerTabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`text-[9px] tracking-[0.1em] uppercase font-medium px-3 py-2 transition whitespace-nowrap border-b-2 ${active ? "border-charcoal text-charcoal" : "border-transparent text-warm-gray hover:text-charcoal"}`}>
      {children}
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function InventoryManagementPage() {
  // ── State ──
  const [mainTab, setMainTab] = useState<"rooms" | "all" | "restock" | "issues">("rooms");

  // Data
  const [items, setItems] = useState<PropertyInventoryItem[]>([]);
  const [rooms, setRooms] = useState<InventoryRoomRecord[]>([]);
  const [listings, setListings] = useState<ListingRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [issues, setIssues] = useState<InventoryIssueRecord[]>([]);
  const [usageHistory, setUsageHistory] = useState<InventoryUsageRecord[]>([]);

  // Loading/error
  const [loading, setLoading] = useState(true);
  const [itemsError, setItemsError] = useState(false);

  // Search/filter
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");

  // Collapsed rooms
  const [collapsedRooms, setCollapsedRooms] = useState<Set<string>>(new Set());

  // Drawers
  const [selectedItem, setSelectedItem] = useState<PropertyInventoryItem | null>(null);
  const [drawerTab, setDrawerTab] = useState("basic");
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showRecordUsage, setShowRecordUsage] = useState(false);
  const [showRestock, setShowRestock] = useState(false);

  // Forms
  const [newItem, setNewItem] = useState({
    propertyId: "", roomId: "", itemName: "", category: "Other", itemType: "reusable",
    description: "", quantityExpected: 1, quantityOnHand: 1, reorderThreshold: 0,
    unitCost: 0, replacementCost: 0, vendorId: "", conditionStatus: "new",
    guestVisible: false, cleanerCheckRequired: false, notes: "",
  });
  const [newRoom, setNewRoom] = useState({ propertyId: "", roomName: "", roomType: "other", notes: "" });
  const [usageForm, setUsageForm] = useState({ itemId: "", quantityUsed: 1, reason: "guest_stay", bookingId: "", notes: "" });
  const [restockForm, setRestockForm] = useState({ itemId: "", quantityAdded: 1, unitCost: 0, vendorId: "", receiptUrl: "", notes: "" });
  const [saving, setSaving] = useState(false);

  // ── Data Fetching ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setItemsError(false);
    const results = await Promise.allSettled([
      fetch("/api/admin/property-inventory").then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/inventory-rooms").then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/listings").then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/inventory-vendors").then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/inventory-issues").then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/inventory-usage").then(r => r.ok ? r.json() : Promise.reject()),
    ]);

    if (results[0].status === "fulfilled") setItems(Array.isArray(results[0].value) ? results[0].value : []);
    else setItemsError(true);

    if (results[1].status === "fulfilled") setRooms(Array.isArray(results[1].value) ? results[1].value : []);
    if (results[2].status === "fulfilled") setListings(Array.isArray(results[2].value) ? results[2].value : []);
    if (results[3].status === "fulfilled") setVendors(Array.isArray(results[3].value) ? results[3].value : []);
    if (results[4].status === "fulfilled") setIssues(Array.isArray(results[4].value) ? results[4].value : []);
    if (results[5].status === "fulfilled") setUsageHistory(Array.isArray(results[5].value) ? results[5].value : []);

    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filtered Items ──
  const filteredItems = useMemo(() => {
    let list = items.filter(i => !i.archivedAt);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.itemName.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.room?.roomName?.toLowerCase().includes(q) ||
        i.vendor?.vendorName?.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "all") list = list.filter(i => i.category === categoryFilter);
    if (statusFilter !== "all") list = list.filter(i => i.inventoryStatus === statusFilter);
    if (roomFilter !== "all") list = list.filter(i => i.roomId === roomFilter || (!i.roomId && roomFilter === "unassigned"));

    return list;
  }, [items, search, categoryFilter, statusFilter, roomFilter]);

  // ── Items grouped by room ──
  const itemsByRoom = useMemo(() => {
    const map = new Map<string, PropertyInventoryItem[]>();
    for (const item of filteredItems) {
      const key = item.roomId || "unassigned";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [filteredItems]);

  // ── Room display order ──
  const sortedRoomKeys = useMemo(() => {
    const roomOrder = new Map(rooms.map(r => [r.id, r.displayOrder]));
    const keys = Array.from(itemsByRoom.keys());
    return keys.sort((a, b) => {
      if (a === "unassigned") return 1;
      if (b === "unassigned") return -1;
      return (roomOrder.get(a) ?? 999) - (roomOrder.get(b) ?? 999);
    });
  }, [itemsByRoom, rooms]);

  // ── Low stock items ──
  const lowStockItems = useMemo(() =>
    items.filter(i => !i.archivedAt && i.quantityOnHand <= i.reorderThreshold && i.reorderThreshold > 0),
    [items]
  );

  // ── KPI Stats ──
  const stats = useMemo(() => {
    const active = items.filter(i => !i.archivedAt);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthUsage = usageHistory.filter(u => new Date(u.usageDate) >= monthStart);
    const totalUsedThisMonth = monthUsage.reduce((s, u) => s + u.totalUsageCost, 0);

    const needsReplace = active.filter(i => i.inventoryStatus === "replace_soon" || i.conditionStatus === "damaged" || i.conditionStatus === "missing");
    const restockCost = lowStockItems.reduce((s, i) => {
      const needed = Math.max(0, i.reorderThreshold - i.quantityOnHand + 1);
      return s + needed * (i.replacementCost || i.unitCost);
    }, 0);

    const openIssues = issues.filter(i => i.status === "open" || i.status === "in_progress");

    return {
      totalItems: active.length,
      roomsTracked: new Set(active.map(i => i.roomId).filter(Boolean)).size,
      totalValue: active.reduce((s, i) => s + (i.quantityOnHand * (i.avgUnitCost || i.unitCost)), 0),
      lowStock: lowStockItems.length,
      needsReplacement: needsReplace.length,
      usedThisMonth: totalUsedThisMonth,
      restockCost,
      openIssues: openIssues.length,
    };
  }, [items, lowStockItems, usageHistory, issues]);

  // ── Room name lookup ──
  const roomName = (roomId: string | null) => {
    if (!roomId) return "Unassigned";
    const r = rooms.find(rm => rm.id === roomId);
    return r?.roomName || "Unknown Room";
  };

  // ── Toggle room collapse ──
  const toggleRoom = (roomId: string) => {
    setCollapsedRooms(prev => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  };

  // ── CRUD Actions ──
  const addItem = async () => {
    if (!newItem.itemName || !newItem.propertyId) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        ...newItem,
        quantityExpected: Number(newItem.quantityExpected),
        quantityOnHand: Number(newItem.quantityOnHand),
        reorderThreshold: Number(newItem.reorderThreshold),
        unitCost: Number(newItem.unitCost),
        replacementCost: Number(newItem.replacementCost),
        remainingValue: Number(newItem.quantityOnHand) * Number(newItem.unitCost),
      };
      if (!payload.roomId) delete payload.roomId;
      if (!payload.vendorId) delete payload.vendorId;

      const res = await fetch("/api/admin/property-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowAddItem(false);
        setNewItem({ propertyId: "", roomId: "", itemName: "", category: "Other", itemType: "reusable", description: "", quantityExpected: 1, quantityOnHand: 1, reorderThreshold: 0, unitCost: 0, replacementCost: 0, vendorId: "", conditionStatus: "new", guestVisible: false, cleanerCheckRequired: false, notes: "" });
        await fetchAll();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const updateItem = async (id: string, data: Record<string, unknown>) => {
    try {
      await fetch("/api/admin/property-inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      await fetchAll();
    } catch { /* ignore */ }
  };

  const archiveItem = async (id: string) => {
    await updateItem(id, { archivedAt: new Date().toISOString(), inventoryStatus: "archived" });
    setSelectedItem(null);
  };

  const addRoom = async () => {
    if (!newRoom.roomName || !newRoom.propertyId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/inventory-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoom),
      });
      if (res.ok) {
        setShowAddRoom(false);
        setNewRoom({ propertyId: "", roomName: "", roomType: "other", notes: "" });
        await fetchAll();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const recordUsage = async () => {
    if (!usageForm.itemId) return;
    setSaving(true);
    try {
      const item = items.find(i => i.id === usageForm.itemId);
      const payload = {
        propertyId: item?.propertyId || "",
        itemId: usageForm.itemId,
        usageDate: new Date().toISOString(),
        quantityUsed: Number(usageForm.quantityUsed),
        unitCostAtUsage: item?.unitCost || 0,
        totalUsageCost: Number(usageForm.quantityUsed) * (item?.unitCost || 0),
        reason: usageForm.reason,
        bookingId: usageForm.bookingId || undefined,
        notes: usageForm.notes || undefined,
      };
      const res = await fetch("/api/admin/inventory-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok && item) {
        const newQty = Math.max(0, item.quantityOnHand - Number(usageForm.quantityUsed));
        await updateItem(item.id, {
          quantityOnHand: newQty,
          quantityUsed: item.quantityUsed + Number(usageForm.quantityUsed),
          inventoryStatus: newQty <= item.reorderThreshold && item.reorderThreshold > 0 ? "low_stock" : newQty === 0 ? "missing" : "ok",
        });
        setShowRecordUsage(false);
        setUsageForm({ itemId: "", quantityUsed: 1, reason: "guest_stay", bookingId: "", notes: "" });
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const restockItem = async () => {
    if (!restockForm.itemId) return;
    setSaving(true);
    try {
      const item = items.find(i => i.id === restockForm.itemId);
      const payload = {
        propertyId: item?.propertyId || "",
        itemId: restockForm.itemId,
        restockDate: new Date().toISOString(),
        quantityAdded: Number(restockForm.quantityAdded),
        unitCost: Number(restockForm.unitCost) || item?.unitCost || 0,
        totalCost: Number(restockForm.quantityAdded) * (Number(restockForm.unitCost) || item?.unitCost || 0),
        vendorId: restockForm.vendorId || undefined,
        receiptUrl: restockForm.receiptUrl || undefined,
        notes: restockForm.notes || undefined,
      };
      const res = await fetch("/api/admin/inventory-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok && item) {
        const newQty = item.quantityOnHand + Number(restockForm.quantityAdded);
        await updateItem(item.id, {
          quantityOnHand: newQty,
          lastRestockedAt: new Date().toISOString(),
          inventoryStatus: newQty > item.reorderThreshold ? "ok" : "low_stock",
        });
        setShowRestock(false);
        setRestockForm({ itemId: "", quantityAdded: 1, unitCost: 0, vendorId: "", receiptUrl: "", notes: "" });
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  // ── Open item drawer ──
  const openItem = (item: PropertyInventoryItem) => {
    setSelectedItem(item);
    setDrawerTab("basic");
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Package size={16} className="text-warm-gray animate-pulse mr-2" />
        <p className="text-warm-gray text-sm">Loading Inventory...</p>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="relative">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="font-serif text-2xl text-charcoal font-light">Inventory Management</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => { setNewItem(prev => ({ ...prev, propertyId: listings[0]?.id || "" })); setShowAddItem(true); }} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5">
            <Plus size={12} /> Add Item
          </button>
          <button onClick={() => { setNewRoom(prev => ({ ...prev, propertyId: listings[0]?.id || "" })); setShowAddRoom(true); }} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5">
            <Home size={12} /> Add Room
          </button>
          <button onClick={() => setShowRecordUsage(true)} className="border border-light-gray text-charcoal text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition px-4 py-2.5 flex items-center gap-1.5">
            <ClipboardCheck size={12} /> Record Usage
          </button>
          <button onClick={() => setShowRestock(true)} className="border border-light-gray text-charcoal text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition px-4 py-2.5 flex items-center gap-1.5">
            <ShoppingCart size={12} /> Restock
          </button>
          <button onClick={() => alert("Import CSV")} className="border border-light-gray text-charcoal text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition px-3 py-2.5">
            <Upload size={12} />
          </button>
          <button onClick={() => alert("Export Inventory")} className="border border-light-gray text-charcoal text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition px-3 py-2.5">
            <Download size={12} />
          </button>
        </div>
      </div>

      {/* ─── Error/Fallback Banner ───────────────────────────────────── */}
      {itemsError && (
        <div className="bg-amber-50 border border-amber-200 p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-amber-800 font-medium mb-1">Unable to load inventory</p>
              <p className="text-xs text-amber-700 mb-3">Inventory data could not be fetched. You can still add items manually or import from CSV.</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={fetchAll} className="bg-amber-600 text-white text-[10px] tracking-[0.15em] uppercase font-medium px-3 py-2 flex items-center gap-1.5 hover:bg-amber-700 transition">
                  <RefreshCw size={11} /> Retry
                </button>
                <button onClick={() => setShowAddItem(true)} className="border border-amber-300 text-amber-800 text-[10px] tracking-[0.15em] uppercase font-medium px-3 py-2 flex items-center gap-1.5 hover:bg-amber-100 transition">
                  <Plus size={11} /> Add Manually
                </button>
                <button onClick={() => alert("Import CSV")} className="border border-amber-300 text-amber-800 text-[10px] tracking-[0.15em] uppercase font-medium px-3 py-2 flex items-center gap-1.5 hover:bg-amber-100 transition">
                  <Upload size={11} /> Import CSV
                </button>
                <button onClick={() => alert("Check Settings > Database")} className="border border-amber-300 text-amber-800 text-[10px] tracking-[0.15em] uppercase font-medium px-3 py-2 flex items-center gap-1.5 hover:bg-amber-100 transition">
                  <Plug size={11} /> Check Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── KPI Dashboard Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Items" value={stats.totalItems} icon={Package} />
        <StatCard label="Rooms Tracked" value={stats.roomsTracked} icon={Home} />
        <StatCard label="Inventory Value" value={formatCurrency(stats.totalValue)} icon={DollarSign} />
        <StatCard label="Low Stock" value={stats.lowStock} icon={AlertTriangle} />
        <StatCard label="Replace Needed" value={stats.needsReplacement} icon={Wrench} />
        <StatCard label="Used This Month" value={formatCurrency(stats.usedThisMonth)} icon={BarChart3} />
        <StatCard label="Restock Cost" value={formatCurrency(stats.restockCost)} icon={ShoppingCart} />
        <StatCard label="Open Issues" value={stats.openIssues} icon={Shield} />
      </div>

      {/* ─── Main Tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center border border-light-gray bg-white mb-6 overflow-x-auto">
        <TabButton active={mainTab === "rooms"} onClick={() => setMainTab("rooms")}>
          <span className="flex items-center gap-1.5"><Home size={12} /> By Room</span>
        </TabButton>
        <TabButton active={mainTab === "all"} onClick={() => setMainTab("all")}>
          <span className="flex items-center gap-1.5"><Layers size={12} /> All Items</span>
        </TabButton>
        <TabButton active={mainTab === "restock"} onClick={() => setMainTab("restock")}>
          <span className="flex items-center gap-1.5"><ShoppingCart size={12} /> Restock ({lowStockItems.length})</span>
        </TabButton>
        <TabButton active={mainTab === "issues"} onClick={() => setMainTab("issues")}>
          <span className="flex items-center gap-1.5"><AlertTriangle size={12} /> Issues ({stats.openIssues})</span>
        </TabButton>
      </div>

      {/* ─── Search & Filters ────────────────────────────────────────── */}
      {(mainTab === "rooms" || mainTab === "all") && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
            <input
              type="text"
              placeholder="Search items by name, category, room, or vendor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 pl-9 outline-none focus:border-charcoal/40 transition-colors"
            />
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
            <option value="all">All Statuses</option>
            <option value="ok">OK</option>
            <option value="low_stock">Low Stock</option>
            <option value="missing">Missing</option>
            <option value="damaged">Damaged</option>
            <option value="replace_soon">Replace Soon</option>
          </select>
          {mainTab === "all" && (
            <select value={roomFilter} onChange={e => setRoomFilter(e.target.value)} className="border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
              <option value="all">All Rooms</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.roomName}</option>)}
              <option value="unassigned">Unassigned</option>
            </select>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROOM-BASED VIEW                                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "rooms" && (
        <>
          {sortedRoomKeys.length === 0 && filteredItems.length === 0 ? (
            <div className="bg-white border border-light-gray p-12 text-center">
              <Package size={24} className="mx-auto mb-3 text-warm-gray/50" />
              <p className="text-sm text-charcoal mb-1">No inventory items yet</p>
              <p className="text-xs text-warm-gray mb-4">Start by adding rooms and inventory items to track supplies across your properties.</p>
              <div className="flex justify-center gap-2">
                <button onClick={() => setShowAddRoom(true)} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5">Add Room</button>
                <button onClick={() => setShowAddItem(true)} className="border border-light-gray text-charcoal text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition px-4 py-2.5">Add Item</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedRoomKeys.map(roomId => {
                const roomItems = itemsByRoom.get(roomId) || [];
                const rName = roomId === "unassigned" ? "Unassigned" : roomName(roomId);
                const roomValue = roomItems.reduce((s, i) => s + i.quantityOnHand * (i.avgUnitCost || i.unitCost), 0);
                const roomLow = roomItems.filter(i => i.inventoryStatus === "low_stock" || i.inventoryStatus === "missing").length;
                const isCollapsed = collapsedRooms.has(roomId);

                return (
                  <div key={roomId} className="bg-white border border-light-gray">
                    {/* Room Header */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-cream/30 transition"
                      onClick={() => toggleRoom(roomId)}
                    >
                      <div className="flex items-center gap-3">
                        {isCollapsed ? <ChevronRight size={14} className="text-warm-gray" /> : <ChevronDown size={14} className="text-warm-gray" />}
                        <div>
                          <h3 className="text-sm font-medium text-charcoal">{rName}</h3>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] text-warm-gray">{roomItems.length} items</span>
                            <span className="text-[10px] text-warm-gray">{formatCurrency(roomValue)}</span>
                            {roomLow > 0 && <Badge className="text-amber-700 bg-amber-50">{roomLow} low</Badge>}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setNewItem(prev => ({ ...prev, propertyId: listings[0]?.id || "", roomId: roomId === "unassigned" ? "" : roomId })); setShowAddItem(true); }}
                        className="text-[10px] text-charcoal border border-light-gray px-2 py-1 hover:bg-cream transition flex items-center gap-1"
                      >
                        <Plus size={10} /> Add
                      </button>
                    </div>

                    {/* Room Items Table */}
                    {!isCollapsed && roomItems.length > 0 && (
                      <div className="overflow-x-auto border-t border-light-gray">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-light-gray/50">
                              <th className="text-left px-4 py-2.5 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Item</th>
                              <th className="text-left px-3 py-2.5 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden md:table-cell">Category</th>
                              <th className="text-center px-3 py-2.5 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Expected</th>
                              <th className="text-center px-3 py-2.5 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">On Hand</th>
                              <th className="text-center px-3 py-2.5 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden lg:table-cell">Reorder</th>
                              <th className="text-left px-3 py-2.5 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden md:table-cell">Condition</th>
                              <th className="text-left px-3 py-2.5 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Status</th>
                              <th className="text-right px-3 py-2.5 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden lg:table-cell">Unit Cost</th>
                              <th className="text-right px-3 py-2.5 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden xl:table-cell">Value</th>
                              <th className="text-left px-3 py-2.5 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden xl:table-cell">Checked</th>
                              <th className="text-right px-4 py-2.5 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {roomItems.map(item => (
                              <tr key={item.id} className="border-b border-light-gray/30 hover:bg-cream/30 transition cursor-pointer" onClick={() => openItem(item)}>
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-charcoal">{item.itemName}</span>
                                    {item.guestVisible && <Eye size={10} className="text-warm-gray shrink-0" />}
                                    {item.cleanerCheckRequired && <ClipboardCheck size={10} className="text-warm-gray shrink-0" />}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-warm-gray hidden md:table-cell">{item.category}</td>
                                <td className="px-3 py-2.5 text-center text-charcoal">{item.quantityExpected}</td>
                                <td className={`px-3 py-2.5 text-center font-medium ${item.quantityOnHand < item.quantityExpected ? "text-red-600" : "text-charcoal"}`}>
                                  {item.quantityOnHand}
                                </td>
                                <td className="px-3 py-2.5 text-center text-warm-gray hidden lg:table-cell">{item.reorderThreshold}</td>
                                <td className="px-3 py-2.5 hidden md:table-cell">
                                  <Badge className={CONDITION_COLORS[item.conditionStatus] || "text-gray-500 bg-gray-100"}>{item.conditionStatus}</Badge>
                                </td>
                                <td className="px-3 py-2.5">
                                  <Badge className={STATUS_COLORS[item.inventoryStatus] || "text-gray-500 bg-gray-100"}>{statusLabel(item.inventoryStatus)}</Badge>
                                </td>
                                <td className="px-3 py-2.5 text-right text-charcoal hidden lg:table-cell">{formatCurrencyDecimal(item.unitCost)}</td>
                                <td className="px-3 py-2.5 text-right text-charcoal hidden xl:table-cell">{formatCurrency(item.quantityOnHand * (item.avgUnitCost || item.unitCost))}</td>
                                <td className="px-3 py-2.5 text-warm-gray hidden xl:table-cell">{formatDate(item.lastCheckedAt)}</td>
                                <td className="px-4 py-2.5 text-right">
                                  <button onClick={e => { e.stopPropagation(); openItem(item); }} className="text-charcoal hover:bg-cream p-1 transition" title="View Details">
                                    <Eye size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[10px] text-warm-gray mt-2">{filteredItems.length} items across {sortedRoomKeys.length} rooms</p>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ALL ITEMS VIEW                                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "all" && (
        <>
          <div className="bg-white border border-light-gray overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-light-gray">
                  <th className="text-left px-4 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Item</th>
                  <th className="text-left px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden md:table-cell">Room</th>
                  <th className="text-left px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden md:table-cell">Category</th>
                  <th className="text-center px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Qty</th>
                  <th className="text-left px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Status</th>
                  <th className="text-left px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden lg:table-cell">Condition</th>
                  <th className="text-right px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden lg:table-cell">Cost</th>
                  <th className="text-right px-4 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-warm-gray">No items match your filters.</td></tr>
                ) : filteredItems.map(item => (
                  <tr key={item.id} className="border-b border-light-gray/50 hover:bg-cream/30 transition cursor-pointer" onClick={() => openItem(item)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-charcoal">{item.itemName}</span>
                        {item.guestVisible && <Eye size={10} className="text-warm-gray" />}
                      </div>
                      <p className="text-[10px] text-warm-gray">{ITEM_TYPE_LABELS[item.itemType] || item.itemType}</p>
                    </td>
                    <td className="px-3 py-3 text-warm-gray hidden md:table-cell">{roomName(item.roomId)}</td>
                    <td className="px-3 py-3 text-warm-gray hidden md:table-cell">{item.category}</td>
                    <td className={`px-3 py-3 text-center font-medium ${item.quantityOnHand < item.quantityExpected ? "text-red-600" : "text-charcoal"}`}>
                      {item.quantityOnHand}/{item.quantityExpected}
                    </td>
                    <td className="px-3 py-3"><Badge className={STATUS_COLORS[item.inventoryStatus] || "text-gray-500 bg-gray-100"}>{statusLabel(item.inventoryStatus)}</Badge></td>
                    <td className="px-3 py-3 hidden lg:table-cell"><Badge className={CONDITION_COLORS[item.conditionStatus] || "text-gray-500 bg-gray-100"}>{item.conditionStatus}</Badge></td>
                    <td className="px-3 py-3 text-right text-charcoal hidden lg:table-cell">{formatCurrencyDecimal(item.unitCost)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={e => { e.stopPropagation(); openItem(item); }} className="text-charcoal hover:bg-cream p-1 transition"><Eye size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-warm-gray mt-2">{filteredItems.length} items</p>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RESTOCK CENTER                                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "restock" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-warm-gray">{lowStockItems.length} items below reorder threshold</p>
            <button onClick={() => alert("Export shopping list")} className="border border-light-gray text-charcoal text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition px-3 py-2 flex items-center gap-1.5">
              <Download size={11} /> Export List
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="bg-white border border-light-gray p-12 text-center">
              <CheckCircle size={24} className="mx-auto mb-3 text-emerald-400" />
              <p className="text-sm text-charcoal mb-1">All stocked up!</p>
              <p className="text-xs text-warm-gray">No items are below their reorder threshold.</p>
            </div>
          ) : (
            <div className="bg-white border border-light-gray overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-light-gray">
                    <th className="text-left px-4 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Item</th>
                    <th className="text-left px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden md:table-cell">Room</th>
                    <th className="text-center px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Current</th>
                    <th className="text-center px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Reorder At</th>
                    <th className="text-center px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Needed</th>
                    <th className="text-right px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden lg:table-cell">Est. Cost</th>
                    <th className="text-left px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden lg:table-cell">Vendor</th>
                    <th className="text-right px-4 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map(item => {
                    const needed = Math.max(1, item.quantityExpected - item.quantityOnHand);
                    const estCost = needed * (item.replacementCost || item.unitCost);
                    return (
                      <tr key={item.id} className="border-b border-light-gray/50 hover:bg-cream/30 transition">
                        <td className="px-4 py-3">
                          <span className="font-medium text-charcoal">{item.itemName}</span>
                          <p className="text-[10px] text-warm-gray">{item.category}</p>
                        </td>
                        <td className="px-3 py-3 text-warm-gray hidden md:table-cell">{roomName(item.roomId)}</td>
                        <td className="px-3 py-3 text-center text-red-600 font-medium">{item.quantityOnHand}</td>
                        <td className="px-3 py-3 text-center text-warm-gray">{item.reorderThreshold}</td>
                        <td className="px-3 py-3 text-center text-charcoal font-medium">{needed}</td>
                        <td className="px-3 py-3 text-right text-charcoal hidden lg:table-cell">{formatCurrencyDecimal(estCost)}</td>
                        <td className="px-3 py-3 text-warm-gray hidden lg:table-cell">{item.vendor?.vendorName || "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => { setRestockForm({ itemId: item.id, quantityAdded: needed, unitCost: item.replacementCost || item.unitCost, vendorId: item.vendorId || "", receiptUrl: "", notes: "" }); setShowRestock(true); }}
                            className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-3 py-1.5"
                          >
                            Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {lowStockItems.length > 0 && (
            <div className="bg-cream/50 border border-light-gray p-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">Total Restock Cost Estimate</p>
                  <p className="text-xl font-serif text-charcoal">{formatCurrency(stats.restockCost)}</p>
                </div>
                <button onClick={() => alert("Create purchase order")} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5">Create Purchase Order</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ISSUES TAB                                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "issues" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-warm-gray">{issues.length} issues</p>
          </div>

          {issues.length === 0 ? (
            <div className="bg-white border border-light-gray p-12 text-center">
              <CheckCircle size={24} className="mx-auto mb-3 text-emerald-400" />
              <p className="text-sm text-charcoal mb-1">No inventory issues</p>
              <p className="text-xs text-warm-gray">All items are in good condition.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map(issue => (
                <div key={issue.id} className="bg-white border border-light-gray p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={issue.priority === "urgent" ? "text-red-700 bg-red-50" : issue.priority === "high" ? "text-amber-700 bg-amber-50" : "text-gray-500 bg-gray-100"}>
                        {issue.priority}
                      </Badge>
                      <Badge className="text-warm-gray bg-cream">{issue.issueType}</Badge>
                    </div>
                    <Badge className={issue.status === "resolved" || issue.status === "closed" ? "text-emerald-700 bg-emerald-50" : issue.status === "in_progress" ? "text-blue-700 bg-blue-50" : "text-amber-700 bg-amber-50"}>
                      {issue.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-charcoal mb-1">{issue.issueDescription}</p>
                  <div className="flex items-center gap-3 text-[10px] text-warm-gray">
                    {issue.item && <span>{issue.item.itemName}</span>}
                    {issue.reportedBy && <span>by {issue.reportedBy}</span>}
                    <span>{formatDate(issue.createdAt)}</span>
                    {issue.replacementCost > 0 && <span className="text-charcoal font-medium">{formatCurrencyDecimal(issue.replacementCost)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ITEM DETAIL DRAWER                                             */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedItem(null)} />
          <div className="relative bg-white w-full max-w-2xl h-full overflow-y-auto shadow-xl">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-white border-b border-light-gray z-10">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-lg text-charcoal">{selectedItem.itemName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={STATUS_COLORS[selectedItem.inventoryStatus] || "text-gray-500 bg-gray-100"}>{statusLabel(selectedItem.inventoryStatus)}</Badge>
                    <Badge className={CONDITION_COLORS[selectedItem.conditionStatus] || "text-gray-500 bg-gray-100"}>{selectedItem.conditionStatus}</Badge>
                    <span className="text-[10px] text-warm-gray">{roomName(selectedItem.roomId)} · {selectedItem.category}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedItem(null)} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
              </div>
              <div className="flex overflow-x-auto px-4 gap-1">
                {[
                  { key: "basic", label: "Basic Info" },
                  { key: "quantity", label: "Quantity & Status" },
                  { key: "cost", label: "Cost Tracking" },
                  { key: "usage", label: "Usage History" },
                  { key: "notes", label: "Notes" },
                ].map(tab => (
                  <DrawerTabButton key={tab.key} active={drawerTab === tab.key} onClick={() => setDrawerTab(tab.key)}>{tab.label}</DrawerTabButton>
                ))}
              </div>
            </div>

            <div className="p-4">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button onClick={() => { setUsageForm({ itemId: selectedItem.id, quantityUsed: 1, reason: "guest_stay", bookingId: "", notes: "" }); setShowRecordUsage(true); }} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-3 py-2 flex items-center gap-1.5"><ClipboardCheck size={11} /> Record Usage</button>
                <button onClick={() => { setRestockForm({ itemId: selectedItem.id, quantityAdded: 1, unitCost: selectedItem.replacementCost || selectedItem.unitCost, vendorId: selectedItem.vendorId || "", receiptUrl: "", notes: "" }); setShowRestock(true); }} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-3 py-2 flex items-center gap-1.5"><ShoppingCart size={11} /> Restock</button>
                <button onClick={() => updateItem(selectedItem.id, { conditionStatus: "damaged", inventoryStatus: "damaged" })} className="border border-red-200 text-red-600 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-red-50 transition px-3 py-2 flex items-center gap-1.5"><AlertTriangle size={11} /> Mark Damaged</button>
                <button onClick={() => updateItem(selectedItem.id, { conditionStatus: "missing", inventoryStatus: "missing", quantityOnHand: 0 })} className="border border-red-200 text-red-600 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-red-50 transition px-3 py-2 flex items-center gap-1.5"><XCircle size={11} /> Mark Missing</button>
                <button onClick={() => updateItem(selectedItem.id, { lastCheckedAt: new Date().toISOString() })} className="border border-light-gray text-charcoal text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition px-3 py-2 flex items-center gap-1.5"><CheckCircle size={11} /> Mark Checked</button>
                <button onClick={() => { if (confirm("Archive this item?")) archiveItem(selectedItem.id); }} className="border border-light-gray text-warm-gray text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition px-3 py-2 flex items-center gap-1.5"><Archive size={11} /> Archive</button>
              </div>

              {/* ── Basic Info Tab ── */}
              {drawerTab === "basic" && (
                <div className="space-y-4">
                  <div className="bg-cream/50 border border-light-gray p-4 space-y-3">
                    <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Item Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-warm-gray">Name:</span> <span className="text-charcoal">{selectedItem.itemName}</span></div>
                      <div><span className="text-warm-gray">Category:</span> <span className="text-charcoal">{selectedItem.category}</span></div>
                      <div><span className="text-warm-gray">Type:</span> <span className="text-charcoal">{ITEM_TYPE_LABELS[selectedItem.itemType] || selectedItem.itemType}</span></div>
                      <div><span className="text-warm-gray">Room:</span> <span className="text-charcoal">{roomName(selectedItem.roomId)}</span></div>
                      <div><span className="text-warm-gray">Vendor:</span> <span className="text-charcoal">{selectedItem.vendor?.vendorName || "—"}</span></div>
                      <div><span className="text-warm-gray">SKU:</span> <span className="text-charcoal">{"—"}</span></div>
                    </div>
                    {selectedItem.description && <p className="text-xs text-charcoal">{selectedItem.description}</p>}
                  </div>

                  <div className="bg-cream/50 border border-light-gray p-4 space-y-2">
                    <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Visibility</h3>
                    <div className="flex items-center gap-4 text-xs">
                      <span className={`flex items-center gap-1 ${selectedItem.guestVisible ? "text-emerald-600" : "text-warm-gray"}`}>
                        {selectedItem.guestVisible ? <Eye size={12} /> : <EyeOff size={12} />} Guest Visible
                      </span>
                      <span className={`flex items-center gap-1 ${selectedItem.cleanerCheckRequired ? "text-emerald-600" : "text-warm-gray"}`}>
                        {selectedItem.cleanerCheckRequired ? <CheckCircle size={12} /> : <XCircle size={12} />} Cleaner Checklist
                      </span>
                    </div>
                  </div>

                  <div className="bg-cream/50 border border-light-gray p-4 space-y-2">
                    <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Dates</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-warm-gray">Purchased:</span> <span className="text-charcoal">{formatDate(selectedItem.purchaseDate)}</span></div>
                      <div><span className="text-warm-gray">Last Checked:</span> <span className="text-charcoal">{formatDate(selectedItem.lastCheckedAt)}</span></div>
                      <div><span className="text-warm-gray">Last Restocked:</span> <span className="text-charcoal">{formatDate(selectedItem.lastRestockedAt)}</span></div>
                      <div><span className="text-warm-gray">Added:</span> <span className="text-charcoal">{formatDate(selectedItem.createdAt)}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Quantity & Status Tab ── */}
              {drawerTab === "quantity" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-cream/50 border border-light-gray p-3 text-center">
                      <p className="text-[9px] uppercase tracking-wider text-warm-gray font-medium mb-1">Expected</p>
                      <p className="text-lg font-serif text-charcoal">{selectedItem.quantityExpected}</p>
                    </div>
                    <div className="bg-cream/50 border border-light-gray p-3 text-center">
                      <p className="text-[9px] uppercase tracking-wider text-warm-gray font-medium mb-1">On Hand</p>
                      <p className={`text-lg font-serif ${selectedItem.quantityOnHand < selectedItem.quantityExpected ? "text-red-600" : "text-charcoal"}`}>{selectedItem.quantityOnHand}</p>
                    </div>
                    <div className="bg-cream/50 border border-light-gray p-3 text-center">
                      <p className="text-[9px] uppercase tracking-wider text-warm-gray font-medium mb-1">Used</p>
                      <p className="text-lg font-serif text-charcoal">{selectedItem.quantityUsed}</p>
                    </div>
                    <div className="bg-cream/50 border border-light-gray p-3 text-center">
                      <p className="text-[9px] uppercase tracking-wider text-warm-gray font-medium mb-1">Missing</p>
                      <p className={`text-lg font-serif ${selectedItem.quantityMissing > 0 ? "text-red-600" : "text-charcoal"}`}>{selectedItem.quantityMissing}</p>
                    </div>
                  </div>

                  <div className="bg-cream/50 border border-light-gray p-4 space-y-2">
                    <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Reorder Threshold</h3>
                    <p className="text-xs text-charcoal">Reorder when quantity falls to <strong>{selectedItem.reorderThreshold}</strong> or below.</p>
                    {selectedItem.quantityOnHand <= selectedItem.reorderThreshold && selectedItem.reorderThreshold > 0 && (
                      <div className="bg-amber-50 border border-amber-200 p-2 mt-2">
                        <p className="text-xs text-amber-700 flex items-center gap-1"><AlertTriangle size={12} /> Below reorder threshold — restock needed</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Cost Tracking Tab ── */}
              {drawerTab === "cost" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-cream/50 border border-light-gray p-3 text-center">
                      <p className="text-[9px] uppercase tracking-wider text-warm-gray font-medium mb-1">Unit Cost</p>
                      <p className="text-lg font-serif text-charcoal">{formatCurrencyDecimal(selectedItem.unitCost)}</p>
                    </div>
                    <div className="bg-cream/50 border border-light-gray p-3 text-center">
                      <p className="text-[9px] uppercase tracking-wider text-warm-gray font-medium mb-1">Avg Unit Cost</p>
                      <p className="text-lg font-serif text-charcoal">{formatCurrencyDecimal(selectedItem.avgUnitCost)}</p>
                    </div>
                    <div className="bg-cream/50 border border-light-gray p-3 text-center">
                      <p className="text-[9px] uppercase tracking-wider text-warm-gray font-medium mb-1">Replacement</p>
                      <p className="text-lg font-serif text-charcoal">{formatCurrencyDecimal(selectedItem.replacementCost)}</p>
                    </div>
                  </div>
                  <div className="bg-cream/50 border border-light-gray p-4">
                    <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-2">Remaining Inventory Value</h3>
                    <p className="text-xl font-serif text-charcoal">{formatCurrency(selectedItem.quantityOnHand * (selectedItem.avgUnitCost || selectedItem.unitCost))}</p>
                    <p className="text-[10px] text-warm-gray mt-1">{selectedItem.quantityOnHand} × {formatCurrencyDecimal(selectedItem.avgUnitCost || selectedItem.unitCost)}</p>
                  </div>
                  {selectedItem.receiptUrl && (
                    <div className="bg-cream/50 border border-light-gray p-4">
                      <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-2">Receipt</h3>
                      <a href={selectedItem.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1"><FileText size={12} /> View Receipt</a>
                    </div>
                  )}
                </div>
              )}

              {/* ── Usage History Tab ── */}
              {drawerTab === "usage" && (
                <div className="space-y-3">
                  <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Usage History</h3>
                  {(() => {
                    const itemUsage = usageHistory.filter(u => u.itemId === selectedItem.id).sort((a, b) => new Date(b.usageDate).getTime() - new Date(a.usageDate).getTime());
                    if (itemUsage.length === 0) return <p className="text-xs text-warm-gray py-8 text-center">No usage recorded for this item.</p>;
                    return itemUsage.map(u => (
                      <div key={u.id} className="bg-cream/50 border border-light-gray p-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-charcoal">Used <strong>{u.quantityUsed}</strong> — {statusLabel(u.reason)}</p>
                          <p className="text-[10px] text-warm-gray">{formatDateTime(u.usageDate)}{u.notes ? ` · ${u.notes}` : ""}</p>
                        </div>
                        <span className="text-xs text-charcoal font-medium">{formatCurrencyDecimal(u.totalUsageCost)}</span>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {/* ── Notes Tab ── */}
              {drawerTab === "notes" && (
                <div className="space-y-4">
                  <div className="bg-cream/50 border border-light-gray p-4">
                    <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-2">Notes</h3>
                    <p className="text-xs text-charcoal whitespace-pre-wrap">{selectedItem.notes || "No notes."}</p>
                  </div>
                  {selectedItem.photoUrl && (
                    <div className="bg-cream/50 border border-light-gray p-4">
                      <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-2">Photo</h3>
                      <img src={selectedItem.photoUrl} alt={selectedItem.itemName} className="max-w-full h-auto border border-light-gray" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ADD ITEM DRAWER                                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddItem(false)} />
          <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-light-gray p-4 flex items-center justify-between z-10">
              <h2 className="font-serif text-lg text-charcoal">Add Inventory Item</h2>
              <button onClick={() => setShowAddItem(false)} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Property *</label>
                <select value={newItem.propertyId} onChange={e => setNewItem(p => ({ ...p, propertyId: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                  <option value="">Select property...</option>
                  {listings.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Room</label>
                <select value={newItem.roomId} onChange={e => setNewItem(p => ({ ...p, roomId: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                  <option value="">No room assigned</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.roomName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Item Name *</label>
                <input value={newItem.itemName} onChange={e => setNewItem(p => ({ ...p, itemName: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Category</label>
                  <select value={newItem.category} onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Item Type</label>
                  <select value={newItem.itemType} onChange={e => setNewItem(p => ({ ...p, itemType: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                    {ITEM_TYPES.map(t => <option key={t} value={t}>{ITEM_TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Description</label>
                <textarea value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Qty Expected</label>
                  <input type="number" min={0} value={newItem.quantityExpected} onChange={e => setNewItem(p => ({ ...p, quantityExpected: Number(e.target.value) }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Qty On Hand</label>
                  <input type="number" min={0} value={newItem.quantityOnHand} onChange={e => setNewItem(p => ({ ...p, quantityOnHand: Number(e.target.value) }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Reorder At</label>
                  <input type="number" min={0} value={newItem.reorderThreshold} onChange={e => setNewItem(p => ({ ...p, reorderThreshold: Number(e.target.value) }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Unit Cost ($)</label>
                  <input type="number" min={0} step="0.01" value={newItem.unitCost} onChange={e => setNewItem(p => ({ ...p, unitCost: Number(e.target.value) }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Replacement Cost ($)</label>
                  <input type="number" min={0} step="0.01" value={newItem.replacementCost} onChange={e => setNewItem(p => ({ ...p, replacementCost: Number(e.target.value) }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Vendor</label>
                <select value={newItem.vendorId} onChange={e => setNewItem(p => ({ ...p, vendorId: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                  <option value="">No vendor</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.vendorName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Condition</label>
                <select value={newItem.conditionStatus} onChange={e => setNewItem(p => ({ ...p, conditionStatus: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="worn">Worn</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-charcoal cursor-pointer">
                  <input type="checkbox" checked={newItem.guestVisible} onChange={e => setNewItem(p => ({ ...p, guestVisible: e.target.checked }))} className="accent-charcoal" />
                  Guest Visible
                </label>
                <label className="flex items-center gap-2 text-xs text-charcoal cursor-pointer">
                  <input type="checkbox" checked={newItem.cleanerCheckRequired} onChange={e => setNewItem(p => ({ ...p, cleanerCheckRequired: e.target.checked }))} className="accent-charcoal" />
                  Cleaner Checklist
                </label>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Notes</label>
                <textarea value={newItem.notes} onChange={e => setNewItem(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 resize-none" />
              </div>
              <button onClick={addItem} disabled={saving || !newItem.itemName || !newItem.propertyId} className="w-full bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-3 disabled:opacity-50">
                {saving ? "Saving..." : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ADD ROOM DRAWER                                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showAddRoom && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddRoom(false)} />
          <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-light-gray p-4 flex items-center justify-between z-10">
              <h2 className="font-serif text-lg text-charcoal">Add Room</h2>
              <button onClick={() => setShowAddRoom(false)} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Property *</label>
                <select value={newRoom.propertyId} onChange={e => setNewRoom(p => ({ ...p, propertyId: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                  <option value="">Select property...</option>
                  {listings.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Room Name *</label>
                <input value={newRoom.roomName} onChange={e => setNewRoom(p => ({ ...p, roomName: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" placeholder="e.g., Master Suite" />
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Quick Add</label>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_ROOMS.map(r => (
                    <button key={r} onClick={() => setNewRoom(p => ({ ...p, roomName: r }))} className={`text-[9px] px-2 py-1 border transition ${newRoom.roomName === r ? "bg-charcoal text-white border-charcoal" : "border-light-gray text-charcoal hover:bg-cream"}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Room Type</label>
                <select value={newRoom.roomType} onChange={e => setNewRoom(p => ({ ...p, roomType: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                  <option value="bedroom">Bedroom</option>
                  <option value="bathroom">Bathroom</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="living">Living Area</option>
                  <option value="dining">Dining</option>
                  <option value="laundry">Laundry</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="storage">Storage</option>
                  <option value="safety">Safety</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Notes</label>
                <textarea value={newRoom.notes} onChange={e => setNewRoom(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 resize-none" />
              </div>
              <button onClick={addRoom} disabled={saving || !newRoom.roomName || !newRoom.propertyId} className="w-full bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-3 disabled:opacity-50">
                {saving ? "Saving..." : "Add Room"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RECORD USAGE MODAL                                             */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showRecordUsage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRecordUsage(false)} />
          <div className="relative bg-white w-full max-w-lg mx-4 shadow-xl">
            <div className="border-b border-light-gray p-4 flex items-center justify-between">
              <h3 className="font-serif text-lg text-charcoal">Record Usage</h3>
              <button onClick={() => setShowRecordUsage(false)} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Item *</label>
                <select value={usageForm.itemId} onChange={e => setUsageForm(p => ({ ...p, itemId: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                  <option value="">Select item...</option>
                  {items.filter(i => !i.archivedAt).map(i => <option key={i.id} value={i.id}>{i.itemName} ({roomName(i.roomId)}) — {i.quantityOnHand} on hand</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Quantity Used</label>
                  <input type="number" min={1} value={usageForm.quantityUsed} onChange={e => setUsageForm(p => ({ ...p, quantityUsed: Number(e.target.value) }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Reason</label>
                  <select value={usageForm.reason} onChange={e => setUsageForm(p => ({ ...p, reason: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                    {USAGE_REASONS.map(r => <option key={r} value={r}>{statusLabel(r)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Notes</label>
                <input value={usageForm.notes} onChange={e => setUsageForm(p => ({ ...p, notes: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowRecordUsage(false)} className="text-[10px] tracking-[0.15em] uppercase text-charcoal border border-light-gray px-4 py-2.5 hover:bg-cream transition">Cancel</button>
                <button onClick={recordUsage} disabled={saving || !usageForm.itemId} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 disabled:opacity-50">
                  {saving ? "Saving..." : "Record Usage"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RESTOCK MODAL                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showRestock && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRestock(false)} />
          <div className="relative bg-white w-full max-w-lg mx-4 shadow-xl">
            <div className="border-b border-light-gray p-4 flex items-center justify-between">
              <h3 className="font-serif text-lg text-charcoal">Restock Inventory</h3>
              <button onClick={() => setShowRestock(false)} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Item *</label>
                <select value={restockForm.itemId} onChange={e => setRestockForm(p => ({ ...p, itemId: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                  <option value="">Select item...</option>
                  {items.filter(i => !i.archivedAt).map(i => <option key={i.id} value={i.id}>{i.itemName} ({roomName(i.roomId)}) — {i.quantityOnHand} on hand</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Quantity to Add</label>
                  <input type="number" min={1} value={restockForm.quantityAdded} onChange={e => setRestockForm(p => ({ ...p, quantityAdded: Number(e.target.value) }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Unit Cost ($)</label>
                  <input type="number" min={0} step="0.01" value={restockForm.unitCost} onChange={e => setRestockForm(p => ({ ...p, unitCost: Number(e.target.value) }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Vendor</label>
                <select value={restockForm.vendorId} onChange={e => setRestockForm(p => ({ ...p, vendorId: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                  <option value="">No vendor</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.vendorName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Receipt URL</label>
                <input value={restockForm.receiptUrl} onChange={e => setRestockForm(p => ({ ...p, receiptUrl: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" placeholder="https://..." />
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Notes</label>
                <input value={restockForm.notes} onChange={e => setRestockForm(p => ({ ...p, notes: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
              </div>
              <div className="bg-cream/50 border border-light-gray p-3">
                <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">Total Cost</p>
                <p className="text-lg font-serif text-charcoal">{formatCurrencyDecimal(restockForm.quantityAdded * restockForm.unitCost)}</p>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowRestock(false)} className="text-[10px] tracking-[0.15em] uppercase text-charcoal border border-light-gray px-4 py-2.5 hover:bg-cream transition">Cancel</button>
                <button onClick={restockItem} disabled={saving || !restockForm.itemId} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 disabled:opacity-50">
                  {saving ? "Saving..." : "Restock"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
