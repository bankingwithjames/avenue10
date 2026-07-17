"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Package,
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
  Settings,
} from "lucide-react";
import { DataTable, DataTableColumn, DataTableFilter } from "@/components/admin/DataTable";

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
  floor: number;
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

function StatCard({ label, value, icon: Icon, onClick }: { label: string; value: string | number; icon: typeof Package; onClick?: () => void }) {
  return (
    <div
      className={`bg-white border border-light-gray p-4${onClick ? " hover:border-warm-gray cursor-pointer transition-colors" : ""}`}
      onClick={onClick}
    >
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

function scrollToContent(id: string) {
  // defer so the tab/filter state applies and content renders first
  setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "auto", block: "start" });
  }, 60);
}

export default function InventoryManagementPage() {
  // ── State ──
  const [mainTab, setMainTab] = useState<"rooms" | "all" | "restock" | "issues" | "manage-rooms">("rooms");
  const [editingRoom, setEditingRoom] = useState<InventoryRoomRecord | null>(null);
  const [editRoomForm, setEditRoomForm] = useState({ roomName: "", roomType: "other", floor: 1, notes: "" });
  const [roomPropertyTab, setRoomPropertyTab] = useState("");

  // Items view state
  const [itemPropertyTab, setItemPropertyTab] = useState("");
  const [itemRoomTab, setItemRoomTab] = useState("all");

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
  const [newRoom, setNewRoom] = useState({ propertyId: "", roomName: "", roomType: "other", floor: 1, notes: "" });
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

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetch effect; intended side effect, not a derived-state cascade
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Active (non-archived) Items ──
  const filteredItems = useMemo(() => items.filter(i => !i.archivedAt), [items]);

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
      totalValue: active.reduce((s, i) => s + (i.quantityOnHand * i.unitCost), 0),
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
        setNewRoom({ propertyId: "", roomName: "", roomType: "other", floor: 1, notes: "" });
        await fetchAll();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const updateRoom = async (roomId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/inventory-rooms/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editRoomForm),
      });
      if (res.ok) {
        setEditingRoom(null);
        await fetchAll();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const deleteRoom = async (room: InventoryRoomRecord) => {
    const roomItems = items.filter(i => i.roomId === room.id);
    const msg = roomItems.length > 0
      ? `Delete "${room.roomName}"? ${roomItems.length} item(s) in this room will become unassigned.`
      : `Delete "${room.roomName}"?`;
    if (!confirm(msg)) return;
    try {
      await fetch(`/api/admin/inventory-rooms/${room.id}`, { method: "DELETE" });
      await fetchAll();
    } catch { /* ignore */ }
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
      if (res.ok) {
        setShowRecordUsage(false);
        setUsageForm({ itemId: "", quantityUsed: 1, reason: "guest_stay", bookingId: "", notes: "" });
        await fetchAll();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const restockItem = async () => {
    if (!restockForm.itemId) return;
    setSaving(true);
    try {
      const item = items.find(i => i.id === restockForm.itemId);
      const qty = Number(restockForm.quantityAdded);
      const cost = Number(restockForm.unitCost) || item?.unitCost || 0;
      const payload = {
        propertyId: item?.propertyId || "",
        itemId: restockForm.itemId,
        purchaseDate: new Date().toISOString(),
        quantityPurchased: qty,
        unitCost: cost,
        totalCost: qty * cost,
        vendorId: restockForm.vendorId || undefined,
        receiptUrl: restockForm.receiptUrl || undefined,
        notes: restockForm.notes || undefined,
      };
      const res = await fetch("/api/admin/inventory-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowRestock(false);
        setRestockForm({ itemId: "", quantityAdded: 1, unitCost: 0, vendorId: "", receiptUrl: "", notes: "" });
        await fetchAll();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  // ── Open item drawer ──
  const openItem = (item: PropertyInventoryItem) => {
    setSelectedItem(item);
    setDrawerTab("basic");
  };

  // ── Shared DataTable filters for item tables ──
  const itemFilters: DataTableFilter<PropertyInventoryItem>[] = [
    {
      key: "category",
      label: "Category",
      options: CATEGORIES.map(c => ({ value: c, label: c })),
      match: (r, v) => r.category === v,
    },
    {
      key: "status",
      label: "Status",
      options: ["ok", "low_stock", "missing", "damaged", "replace_soon"].map(s => ({ value: s, label: statusLabel(s) })),
      match: (r, v) => r.inventoryStatus === v,
    },
  ];

  const roomFilterDef: DataTableFilter<PropertyInventoryItem> = {
    key: "room",
    label: "Room",
    options: [
      ...rooms.map(r => ({ value: r.id, label: r.roomName })),
      { value: "unassigned", label: "Unassigned" },
    ],
    match: (r, v) => (v === "unassigned" ? !r.roomId : r.roomId === v),
  };

  // ── All Items table columns ──
  const allItemsColumns: DataTableColumn<PropertyInventoryItem>[] = [
    {
      key: "itemName",
      label: "Item",
      accessor: i => i.itemName,
      render: i => (
        <>
          <div className="flex items-center gap-2">
            <span className="font-medium text-charcoal">{i.itemName}</span>
            {i.guestVisible && <Eye size={10} className="text-warm-gray" />}
          </div>
          <p className="text-[10px] text-warm-gray">{ITEM_TYPE_LABELS[i.itemType] || i.itemType}</p>
        </>
      ),
    },
    {
      key: "room",
      label: "Room",
      accessor: i => roomName(i.roomId),
      render: i => <span className="text-warm-gray">{roomName(i.roomId)}</span>,
      responsiveClass: "hidden md:table-cell",
    },
    {
      key: "category",
      label: "Category",
      accessor: i => i.category,
      render: i => <span className="text-warm-gray">{i.category}</span>,
      responsiveClass: "hidden md:table-cell",
    },
    {
      key: "qty",
      label: "Qty",
      accessor: i => i.quantityOnHand,
      className: "text-center",
      render: i => (
        <span className={`font-medium ${i.quantityOnHand < i.quantityExpected ? "text-red-600" : "text-charcoal"}`}>
          {i.quantityOnHand}/{i.quantityExpected}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      accessor: i => i.inventoryStatus,
      render: i => <Badge className={STATUS_COLORS[i.inventoryStatus] || "text-gray-500 bg-gray-100"}>{statusLabel(i.inventoryStatus)}</Badge>,
    },
    {
      key: "condition",
      label: "Condition",
      accessor: i => i.conditionStatus,
      render: i => <Badge className={CONDITION_COLORS[i.conditionStatus] || "text-gray-500 bg-gray-100"}>{i.conditionStatus}</Badge>,
      responsiveClass: "hidden lg:table-cell",
    },
    {
      key: "unitCost",
      label: "Cost",
      accessor: i => i.unitCost,
      className: "text-right",
      render: i => <span className="text-charcoal">{formatCurrencyDecimal(i.unitCost)}</span>,
      responsiveClass: "hidden lg:table-cell",
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      className: "text-right",
      headerClassName: "text-right",
      render: i => (
        <button onClick={e => { e.stopPropagation(); openItem(i); }} className="text-charcoal hover:bg-cream p-1 transition" title="View Details">
          <Eye size={14} />
        </button>
      ),
    },
  ];

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
        <StatCard label="Total Items" value={stats.totalItems} icon={Package} onClick={() => { setMainTab("all"); scrollToContent("admin-tab-content"); }} />
        <StatCard label="Rooms Tracked" value={stats.roomsTracked} icon={Home} onClick={() => { setMainTab("manage-rooms"); scrollToContent("admin-tab-content"); }} />
        <StatCard label="Inventory Value" value={formatCurrency(stats.totalValue)} icon={DollarSign} onClick={() => { setMainTab("all"); scrollToContent("admin-tab-content"); }} />
        <StatCard label="Low Stock" value={stats.lowStock} icon={AlertTriangle} onClick={() => { setMainTab("all"); scrollToContent("admin-tab-content"); }} />
        <StatCard label="Replace Needed" value={stats.needsReplacement} icon={Wrench} onClick={() => { setMainTab("all"); scrollToContent("admin-tab-content"); }} />
        <StatCard label="Used This Month" value={formatCurrency(stats.usedThisMonth)} icon={BarChart3} />
        <StatCard label="Restock Cost" value={formatCurrency(stats.restockCost)} icon={ShoppingCart} onClick={() => { setMainTab("restock"); scrollToContent("admin-tab-content"); }} />
        <StatCard label="Open Issues" value={stats.openIssues} icon={Shield} onClick={() => { setMainTab("issues"); scrollToContent("admin-tab-content"); }} />
      </div>

      {/* ─── Main Tabs ───────────────────────────────────────────────── */}
      <div id="admin-tab-content" className="flex items-center border border-light-gray bg-white mb-6 overflow-x-auto">
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
        <TabButton active={mainTab === "manage-rooms"} onClick={() => setMainTab("manage-rooms")}>
          <span className="flex items-center gap-1.5"><Settings size={12} /> Rooms ({rooms.length})</span>
        </TabButton>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROOM-BASED VIEW                                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "rooms" && (() => {
        const FLOOR_LABELS_ITEMS: Record<number, string> = { 1: "1st Floor", 2: "2nd Floor", 3: "3rd Floor" };
        const floorLabelItems = (f: number) => FLOOR_LABELS_ITEMS[f] || `${f}th Floor`;

        const activeItemPropertyId = itemPropertyTab || (listings.length > 0 ? listings[0].id : "");
        const activeItemListing = listings.find(l => l.id === activeItemPropertyId);

        const propertyRoomsForItems = rooms.filter(r => r.propertyId === activeItemPropertyId && r.isActive);
        const propertyFloors = [...new Set(propertyRoomsForItems.map(r => r.floor ?? 1))].sort((a, b) => a - b);

        const allPropertyItems = filteredItems.filter(i => i.propertyId === activeItemPropertyId);
        const selectedRoomItems = itemRoomTab === "all"
          ? allPropertyItems
          : itemRoomTab === "unassigned"
            ? allPropertyItems.filter(i => !i.roomId)
            : allPropertyItems.filter(i => i.roomId === itemRoomTab);

        const selectedRoomValue = selectedRoomItems.reduce((s, i) => s + i.quantityOnHand * i.unitCost, 0);
        const selectedRoomRecord = itemRoomTab !== "all" && itemRoomTab !== "unassigned" ? rooms.find(r => r.id === itemRoomTab) : null;
        const unassignedCount = allPropertyItems.filter(i => !i.roomId).length;

        const roomViewColumns: DataTableColumn<PropertyInventoryItem>[] = [
          {
            key: "itemName",
            label: "Item",
            accessor: i => i.itemName,
            render: i => (
              <div className="flex items-center gap-2">
                <span className="font-medium text-charcoal">{i.itemName}</span>
                {i.guestVisible && <Eye size={10} className="text-warm-gray shrink-0" />}
                {i.cleanerCheckRequired && <ClipboardCheck size={10} className="text-warm-gray shrink-0" />}
              </div>
            ),
          },
          // Room column only in All Rooms view
          ...(itemRoomTab === "all"
            ? [{
                key: "room",
                label: "Room",
                accessor: (i: PropertyInventoryItem) => roomName(i.roomId),
                render: (i: PropertyInventoryItem) => <span className="text-warm-gray">{roomName(i.roomId)}</span>,
                responsiveClass: "hidden md:table-cell",
              } as DataTableColumn<PropertyInventoryItem>]
            : []),
          {
            key: "category",
            label: "Category",
            accessor: i => i.category,
            render: i => <span className="text-warm-gray">{i.category}</span>,
            responsiveClass: "hidden md:table-cell",
          },
          {
            key: "quantityExpected",
            label: "Expected",
            accessor: i => i.quantityExpected,
            className: "text-center",
            render: i => <span className="text-charcoal">{i.quantityExpected}</span>,
          },
          {
            key: "quantityOnHand",
            label: "On Hand",
            accessor: i => i.quantityOnHand,
            className: "text-center",
            render: i => (
              <span className={`font-medium ${i.quantityOnHand < i.quantityExpected ? "text-red-600" : "text-charcoal"}`}>{i.quantityOnHand}</span>
            ),
          },
          {
            key: "reorderThreshold",
            label: "Reorder",
            accessor: i => i.reorderThreshold,
            className: "text-center",
            render: i => <span className="text-warm-gray">{i.reorderThreshold}</span>,
            responsiveClass: "hidden lg:table-cell",
          },
          {
            key: "conditionStatus",
            label: "Condition",
            accessor: i => i.conditionStatus,
            render: i => <Badge className={CONDITION_COLORS[i.conditionStatus] || "text-gray-500 bg-gray-100"}>{i.conditionStatus}</Badge>,
            responsiveClass: "hidden md:table-cell",
          },
          {
            key: "inventoryStatus",
            label: "Status",
            accessor: i => i.inventoryStatus,
            render: i => <Badge className={STATUS_COLORS[i.inventoryStatus] || "text-gray-500 bg-gray-100"}>{statusLabel(i.inventoryStatus)}</Badge>,
          },
          {
            key: "unitCost",
            label: "Unit Cost",
            accessor: i => i.unitCost,
            className: "text-right",
            render: i => <span className="text-charcoal">{formatCurrencyDecimal(i.unitCost)}</span>,
            responsiveClass: "hidden lg:table-cell",
          },
          {
            key: "value",
            label: "Value",
            accessor: i => i.quantityOnHand * i.unitCost,
            className: "text-right",
            render: i => <span className="text-charcoal">{formatCurrency(i.quantityOnHand * i.unitCost)}</span>,
            responsiveClass: "hidden xl:table-cell",
          },
          {
            key: "actions",
            label: "Actions",
            sortable: false,
            className: "text-right",
            headerClassName: "text-right",
            render: i => (
              <button onClick={e => { e.stopPropagation(); openItem(i); }} className="text-charcoal hover:bg-cream p-1 transition" title="View Details">
                <Eye size={14} />
              </button>
            ),
          },
        ];

        return (
        <>
          {/* Property sub-tabs */}
          <div className="flex items-center gap-0 border-b border-light-gray mb-4">
            {listings.map(listing => {
              const count = items.filter(i => !i.archivedAt && i.propertyId === listing.id).length;
              const isActive = listing.id === activeItemPropertyId;
              return (
                <button
                  key={listing.id}
                  onClick={() => { setItemPropertyTab(listing.id); setItemRoomTab("all"); }}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-medium transition border-b-2 -mb-px ${isActive ? "border-charcoal text-charcoal" : "border-transparent text-warm-gray hover:text-charcoal hover:border-warm-gray/30"}`}
                >
                  <Home size={13} />
                  <span>{listing.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-charcoal text-white" : "bg-light-gray text-warm-gray"}`}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Room pills grouped by floor */}
          <div className="bg-white border border-light-gray p-3 mb-4 space-y-2">
            {propertyFloors.map(floor => {
              const floorRooms = propertyRoomsForItems
                .filter(r => (r.floor ?? 1) === floor)
                .sort((a, b) => a.displayOrder - b.displayOrder || a.roomName.localeCompare(b.roomName));
              return (
                <div key={floor} className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] tracking-[0.12em] uppercase text-warm-gray font-medium w-16 shrink-0 flex items-center gap-1">
                    <Layers size={10} /> {floorLabelItems(floor)}
                  </span>
                  {floor === propertyFloors[0] && (
                    <button
                      onClick={() => setItemRoomTab("all")}
                      className={`text-[10px] px-3 py-1.5 border transition font-medium ${itemRoomTab === "all" ? "bg-charcoal text-white border-charcoal" : "border-light-gray text-charcoal hover:bg-cream"}`}
                    >
                      All Rooms ({allPropertyItems.length})
                    </button>
                  )}
                  {floorRooms.map(r => {
                    const count = allPropertyItems.filter(i => i.roomId === r.id).length;
                    const isActive = itemRoomTab === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setItemRoomTab(r.id)}
                        className={`text-[10px] px-3 py-1.5 border transition ${isActive ? "bg-charcoal text-white border-charcoal" : "border-light-gray text-charcoal/70 hover:bg-cream hover:text-charcoal"}`}
                      >
                        {r.roomName} {count > 0 && <span className={`ml-1 ${isActive ? "text-white/70" : "text-warm-gray"}`}>({count})</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {unassignedCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-16 shrink-0" />
                <button
                  onClick={() => setItemRoomTab("unassigned")}
                  className={`text-[10px] px-3 py-1.5 border transition ${itemRoomTab === "unassigned" ? "bg-charcoal text-white border-charcoal" : "border-light-gray text-warm-gray hover:bg-cream"}`}
                >
                  Unassigned ({unassignedCount})
                </button>
              </div>
            )}
          </div>

          {/* Room summary bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-charcoal">
                {itemRoomTab === "all" ? `All Items — ${activeItemListing?.title || ""}` : itemRoomTab === "unassigned" ? "Unassigned Items" : selectedRoomRecord?.roomName || ""}
              </h3>
              {selectedRoomRecord && (
                <span className="text-[10px] text-warm-gray">{selectedRoomRecord.roomType} · {floorLabelItems(selectedRoomRecord.floor ?? 1)}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-warm-gray">{selectedRoomItems.length} items · {formatCurrency(selectedRoomValue)}</span>
              <button
                onClick={e => { e.stopPropagation(); setNewItem(prev => ({ ...prev, propertyId: activeItemPropertyId, roomId: itemRoomTab === "all" || itemRoomTab === "unassigned" ? "" : itemRoomTab })); setShowAddItem(true); }}
                className="text-[10px] text-charcoal border border-light-gray px-2.5 py-1.5 hover:bg-cream transition flex items-center gap-1"
              >
                <Plus size={10} /> Add Item
              </button>
            </div>
          </div>

          {/* Single items table */}
          {selectedRoomItems.length === 0 ? (
            <div className="bg-white border border-light-gray p-12 text-center">
              <Package size={24} className="mx-auto mb-3 text-warm-gray/50" />
              <p className="text-sm text-charcoal mb-1">{itemRoomTab === "all" ? "No inventory items yet" : "No items in this room"}</p>
              <p className="text-xs text-warm-gray mb-4">{itemRoomTab === "all" ? "Start by adding inventory items to track supplies." : "Add items to this room to start tracking."}</p>
              <button onClick={() => { setNewItem(prev => ({ ...prev, propertyId: activeItemPropertyId, roomId: itemRoomTab === "all" || itemRoomTab === "unassigned" ? "" : itemRoomTab })); setShowAddItem(true); }} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5">Add Item</button>
            </div>
          ) : (
            <DataTable
              columns={roomViewColumns}
              rows={selectedRoomItems}
              rowKey={i => i.id}
              filters={itemFilters}
              searchPlaceholder="Search items by name, category, or room..."
              onRowClick={openItem}
              defaultSort={{ key: "itemName", dir: "asc" }}
              emptyMessage="No items match your filters."
            />
          )}
        </>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ALL ITEMS VIEW                                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "all" && (
        <DataTable
          columns={allItemsColumns}
          rows={filteredItems}
          rowKey={i => i.id}
          filters={[...itemFilters, roomFilterDef]}
          searchPlaceholder="Search items by name, category, or room..."
          onRowClick={openItem}
          defaultSort={{ key: "itemName", dir: "asc" }}
          emptyMessage="No items match your filters."
        />
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
            <DataTable
              columns={[
                {
                  key: "itemName",
                  label: "Item",
                  accessor: i => i.itemName,
                  render: i => (
                    <>
                      <span className="font-medium text-charcoal">{i.itemName}</span>
                      <p className="text-[10px] text-warm-gray">{i.category}</p>
                    </>
                  ),
                },
                {
                  key: "room",
                  label: "Room",
                  accessor: i => roomName(i.roomId),
                  render: i => <span className="text-warm-gray">{roomName(i.roomId)}</span>,
                  responsiveClass: "hidden md:table-cell",
                },
                {
                  key: "current",
                  label: "Current",
                  accessor: i => i.quantityOnHand,
                  className: "text-center",
                  render: i => <span className="text-red-600 font-medium">{i.quantityOnHand}</span>,
                },
                {
                  key: "reorderThreshold",
                  label: "Reorder At",
                  accessor: i => i.reorderThreshold,
                  className: "text-center",
                  render: i => <span className="text-warm-gray">{i.reorderThreshold}</span>,
                },
                {
                  key: "needed",
                  label: "Needed",
                  accessor: i => Math.max(1, i.quantityExpected - i.quantityOnHand),
                  className: "text-center",
                  render: i => <span className="text-charcoal font-medium">{Math.max(1, i.quantityExpected - i.quantityOnHand)}</span>,
                },
                {
                  key: "estCost",
                  label: "Est. Cost",
                  accessor: i => Math.max(1, i.quantityExpected - i.quantityOnHand) * (i.replacementCost || i.unitCost),
                  className: "text-right",
                  render: i => <span className="text-charcoal">{formatCurrencyDecimal(Math.max(1, i.quantityExpected - i.quantityOnHand) * (i.replacementCost || i.unitCost))}</span>,
                  responsiveClass: "hidden lg:table-cell",
                },
                {
                  key: "vendor",
                  label: "Vendor",
                  accessor: i => i.vendor?.vendorName || "—",
                  render: i => <span className="text-warm-gray">{i.vendor?.vendorName || "—"}</span>,
                  responsiveClass: "hidden lg:table-cell",
                },
                {
                  key: "action",
                  label: "Action",
                  sortable: false,
                  className: "text-right",
                  headerClassName: "text-right",
                  render: i => {
                    const needed = Math.max(1, i.quantityExpected - i.quantityOnHand);
                    return (
                      <button
                        onClick={e => { e.stopPropagation(); setRestockForm({ itemId: i.id, quantityAdded: needed, unitCost: i.replacementCost || i.unitCost, vendorId: i.vendorId || "", receiptUrl: "", notes: "" }); setShowRestock(true); }}
                        className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-3 py-1.5"
                      >
                        Restock
                      </button>
                    );
                  },
                },
              ] satisfies DataTableColumn<PropertyInventoryItem>[]}
              rows={lowStockItems}
              rowKey={i => i.id}
              searchPlaceholder="Search restock items..."
              defaultSort={{ key: "itemName", dir: "asc" }}
              emptyMessage="No items are below their reorder threshold."
            />
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
      {/* MANAGE ROOMS TAB                                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "manage-rooms" && (() => {
        const FLOOR_LABELS: Record<number, string> = { 1: "1st Floor", 2: "2nd Floor", 3: "3rd Floor" };
        const floorLabel = (f: number) => FLOOR_LABELS[f] || `${f}th Floor`;
        const ROOM_TYPES = ["bedroom", "bathroom", "kitchen", "living", "dining", "laundry", "outdoor", "storage", "safety", "other"];

        const activePropertyId = roomPropertyTab || (listings.length > 0 ? listings[0].id : "");
        const activeListing = listings.find(l => l.id === activePropertyId);

        const propertyRooms = rooms.filter(r => r.propertyId === activePropertyId);
        const allFloors = [...new Set(propertyRooms.map(r => r.floor ?? 1))].sort((a, b) => a - b);

        const roomColumns: DataTableColumn<InventoryRoomRecord>[] = [
          {
            key: "roomName",
            label: "Room Name",
            accessor: r => r.roomName,
            render: r => editingRoom?.id === r.id ? (
              <input
                value={editRoomForm.roomName}
                onChange={e => setEditRoomForm(p => ({ ...p, roomName: e.target.value }))}
                onClick={e => e.stopPropagation()}
                className="w-full border border-light-gray text-charcoal text-xs px-2 py-1.5 outline-none focus:border-charcoal/40"
              />
            ) : <span className="text-charcoal font-medium">{r.roomName}</span>,
          },
          {
            key: "roomType",
            label: "Type",
            accessor: r => r.roomType,
            render: r => editingRoom?.id === r.id ? (
              <select
                value={editRoomForm.roomType}
                onChange={e => setEditRoomForm(p => ({ ...p, roomType: e.target.value }))}
                onClick={e => e.stopPropagation()}
                className="border border-light-gray text-charcoal text-xs px-2 py-1.5 outline-none bg-white"
              >
                {ROOM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            ) : <span className="text-warm-gray capitalize">{r.roomType}</span>,
          },
          {
            key: "floor",
            label: "Floor",
            accessor: r => r.floor ?? 1,
            render: r => editingRoom?.id === r.id ? (
              <select
                value={editRoomForm.floor}
                onChange={e => setEditRoomForm(p => ({ ...p, floor: Number(e.target.value) }))}
                onClick={e => e.stopPropagation()}
                className="border border-light-gray text-charcoal text-xs px-2 py-1.5 outline-none bg-white w-16"
              >
                {[1, 2, 3, 4, 5].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            ) : <span className="text-warm-gray">{floorLabel(r.floor ?? 1)}</span>,
          },
          {
            key: "items",
            label: "Items",
            accessor: r => items.filter(i => i.roomId === r.id).length,
            render: r => {
              const count = items.filter(i => i.roomId === r.id).length;
              return count > 0 ? <span className="text-charcoal">{count}</span> : <span className="text-warm-gray/50">0</span>;
            },
          },
          {
            key: "notes",
            label: "Notes",
            accessor: r => r.notes || "",
            responsiveClass: "hidden sm:table-cell",
            render: r => editingRoom?.id === r.id ? (
              <input
                value={editRoomForm.notes}
                onChange={e => setEditRoomForm(p => ({ ...p, notes: e.target.value }))}
                onClick={e => e.stopPropagation()}
                className="w-full border border-light-gray text-charcoal text-xs px-2 py-1.5 outline-none focus:border-charcoal/40"
                placeholder="Notes..."
              />
            ) : <span className="text-warm-gray block truncate max-w-[200px]">{r.notes || "—"}</span>,
          },
          {
            key: "status",
            label: "Status",
            accessor: r => (r.isActive ? "Active" : "Inactive"),
            responsiveClass: "hidden md:table-cell",
            render: r => (
              <Badge className={r.isActive ? "text-emerald-700 bg-emerald-50" : "text-warm-gray bg-gray-100"}>
                {r.isActive ? "Active" : "Inactive"}
              </Badge>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            sortable: false,
            className: "text-right",
            headerClassName: "text-right",
            render: r => editingRoom?.id === r.id ? (
              <div className="flex items-center justify-end gap-1">
                <button onClick={e => { e.stopPropagation(); updateRoom(r.id); }} disabled={saving || !editRoomForm.roomName} className="text-emerald-600 hover:bg-emerald-50 p-1.5 transition disabled:opacity-50" title="Save">
                  <CheckCircle size={14} />
                </button>
                <button onClick={e => { e.stopPropagation(); setEditingRoom(null); }} className="text-warm-gray hover:bg-cream p-1.5 transition" title="Cancel">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setEditingRoom(r);
                    setEditRoomForm({ roomName: r.roomName, roomType: r.roomType, floor: r.floor ?? 1, notes: r.notes || "" });
                  }}
                  className="text-charcoal hover:bg-cream p-1.5 transition"
                  title="Edit"
                >
                  <Edit3 size={13} />
                </button>
                <button onClick={e => { e.stopPropagation(); deleteRoom(r); }} className="text-red-500 hover:bg-red-50 p-1.5 transition" title="Delete">
                  <Trash2 size={13} />
                </button>
              </div>
            ),
          },
        ];

        const roomTableFilters: DataTableFilter<InventoryRoomRecord>[] = [
          {
            key: "type",
            label: "Type",
            options: ROOM_TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) })),
            match: (r, v) => r.roomType === v,
          },
          {
            key: "floor",
            label: "Floor",
            options: allFloors.map(f => ({ value: String(f), label: floorLabel(f) })),
            match: (r, v) => (r.floor ?? 1) === Number(v),
          },
        ];

        return (
        <>
          {/* Property sub-tabs */}
          <div className="flex items-center gap-0 border-b border-light-gray mb-5">
            {listings.map(listing => {
              const count = rooms.filter(r => r.propertyId === listing.id).length;
              const isActive = listing.id === activePropertyId;
              return (
                <button
                  key={listing.id}
                  onClick={() => { setRoomPropertyTab(listing.id); setEditingRoom(null); }}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-medium transition border-b-2 -mb-px ${isActive ? "border-charcoal text-charcoal" : "border-transparent text-warm-gray hover:text-charcoal hover:border-warm-gray/30"}`}
                >
                  <Home size={13} />
                  <span>{listing.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-charcoal text-white" : "bg-light-gray text-warm-gray"}`}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Property summary line */}
          {activeListing && (
            <p className="text-xs text-warm-gray mb-4">
              {propertyRooms.length} rooms · {allFloors.length} {allFloors.length === 1 ? "floor" : "floors"}
            </p>
          )}

          {propertyRooms.length === 0 ? (
            <div className="bg-white border border-light-gray p-12 text-center">
              <Home size={24} className="mx-auto mb-3 text-warm-gray/50" />
              <p className="text-sm text-charcoal mb-1">No rooms configured for {activeListing?.title || "this property"}</p>
              <p className="text-xs text-warm-gray mb-4">Add rooms to organize inventory by location within this property.</p>
              <button onClick={() => setShowAddRoom(true)} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5">Add Room</button>
            </div>
          ) : (
            <DataTable
              columns={roomColumns}
              rows={propertyRooms}
              rowKey={r => r.id}
              filters={roomTableFilters}
              searchPlaceholder="Search rooms by name, type, or notes..."
              defaultSort={{ key: "floor", dir: "asc" }}
              emptyMessage="No rooms match your search or filters."
              toolbar={
                <button onClick={() => setShowAddRoom(true)} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-3 py-2 flex items-center gap-1.5">
                  <Plus size={11} /> Add Room
                </button>
              }
            />
          )}
        </>
        );
      })()}

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
                    <p className="text-xl font-serif text-charcoal">{formatCurrency(selectedItem.quantityOnHand * selectedItem.unitCost)}</p>
                    <p className="text-[10px] text-warm-gray mt-1">{selectedItem.quantityOnHand} × {formatCurrencyDecimal(selectedItem.unitCost)}</p>
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
                <select value={newItem.propertyId} onChange={e => setNewItem(p => ({ ...p, propertyId: e.target.value, roomId: "" }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                  <option value="">Select property...</option>
                  {listings.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Room</label>
                <select value={newItem.roomId} onChange={e => setNewItem(p => ({ ...p, roomId: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                  <option value="">No room assigned</option>
                  {(() => {
                    const FLOOR_LABELS: Record<number, string> = { 1: "1st Floor", 2: "2nd Floor", 3: "3rd Floor" };
                    const floorLabel = (f: number) => FLOOR_LABELS[f] || `${f}th Floor`;
                    const propertyRooms = rooms.filter(r => r.propertyId === newItem.propertyId);
                    const floors = [...new Set(propertyRooms.map(r => r.floor ?? 1))].sort((a, b) => a - b);
                    return floors.map(f => {
                      const floorRooms = propertyRooms.filter(r => (r.floor ?? 1) === f).sort((a, b) => a.displayOrder - b.displayOrder);
                      return (
                        <optgroup key={f} label={floorLabel(f)}>
                          {floorRooms.map(r => <option key={r.id} value={r.id}>{r.roomName}</option>)}
                        </optgroup>
                      );
                    });
                  })()}
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
                  <input type="number" min={0} step="0.01" value={newItem.unitCost || ""} onChange={e => setNewItem(p => ({ ...p, unitCost: Number(e.target.value) }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Replacement Cost ($)</label>
                  <input type="number" min={0} step="0.01" value={newItem.replacementCost || ""} onChange={e => setNewItem(p => ({ ...p, replacementCost: Number(e.target.value) }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" placeholder="0.00" />
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
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Floor</label>
                <select value={newRoom.floor} onChange={e => setNewRoom(p => ({ ...p, floor: Number(e.target.value) }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                  <option value={1}>1st Floor</option>
                  <option value={2}>2nd Floor</option>
                  <option value={3}>3rd Floor</option>
                  <option value={4}>4th Floor</option>
                  <option value={5}>5th Floor</option>
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
                  <input type="number" min={0} step="0.01" value={restockForm.unitCost || ""} onChange={e => setRestockForm(p => ({ ...p, unitCost: Number(e.target.value) }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" placeholder="0.00" />
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
