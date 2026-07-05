"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Wrench,
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Eye,
  Plus,
  X,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  CalendarDays,
  List,
  LayoutGrid,
  User,
  Phone,
  Mail,
  Globe,
  FileText,
  Camera,
  ClipboardCheck,
  BarChart3,
  Tag,
  Shield,
  Plug,
  Repeat,
  MapPin,
  MoreHorizontal,
  Trash2,
  Edit3,
  ArrowRight,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────

interface MaintenanceLogRecord {
  id: string;
  propertyId: string;
  unitId: string | null;
  listingId: string | null;
  roomId: string | null;
  bookingId: string | null;
  vendorId: string | null;
  inventoryItemId: string | null;
  guestRequestId: string | null;
  issueTitle: string | null;
  issueType: string;
  category: string | null;
  description: string;
  priority: string;
  status: string;
  reportedBy: string | null;
  scheduledDate: string | null;
  startTime: string | null;
  endTime: string | null;
  dueDate: string | null;
  completedDate: string | null;
  maintenanceDate: string;
  cost: number;
  estimatedCost: number;
  actualCost: number;
  laborCost: number;
  materialsCost: number;
  receiptUrl: string | null;
  beforePhotoUrl: string | null;
  afterPhotoUrl: string | null;
  notes: string | null;
  reportedByName?: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: VendorRecord | null;
  calendarEvents?: CalendarEventRecord[];
  files?: MaintenanceFileRecord[];
  activityLogs?: ActivityLogRecord[];
}

interface CalendarEventRecord {
  id: string;
  maintenanceLogId: string;
  propertyId: string;
  listingId: string | null;
  title: string;
  startDatetime: string;
  endDatetime: string | null;
  calendarViewStatus: string;
  colorStatus: string | null;
  isRecurring: boolean;
  maintenanceLog?: MaintenanceLogRecord;
}

interface RecurringTaskRecord {
  id: string;
  propertyId: string;
  listingId: string | null;
  roomId: string | null;
  taskName: string;
  category: string;
  frequency: string;
  nextDueDate: string | null;
  lastCompletedDate: string | null;
  vendorId: string | null;
  estimatedCost: number;
  reminderDaysBefore: number;
  autoCreateEvent: boolean;
  status: string;
  notes: string | null;
}

interface VendorRecord {
  id: string;
  vendorName: string;
  vendorType: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  notes: string | null;
  isActive: boolean;
}

interface ListingRecord {
  id: string;
  title: string;
}

interface MaintenanceFileRecord {
  id: string;
  fileUrl: string;
  fileType: string | null;
  fileName: string | null;
  fileCategory: string;
}

interface ActivityLogRecord {
  id: string;
  activityType: string;
  oldValue: string | null;
  newValue: string | null;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
}

// ─── Constants ──────────────────────────────────────────────────────────

const CATEGORIES = [
  "Plumbing", "Electrical", "HVAC", "Appliances", "Furniture", "Smart Home",
  "WiFi/Internet", "Exterior", "Lawn & Outdoor", "Safety", "Cleaning Issue",
  "Pest Control", "General Repair", "Preventive Maintenance", "Guest-Reported Issue",
];

const STATUSES = ["new", "scheduled", "in_progress", "waiting_on_vendor", "waiting_on_parts", "completed", "cancelled", "archived"];
const PRIORITIES = ["low", "medium", "high", "urgent"];
const VENDOR_TYPES = ["Plumber", "Electrician", "HVAC", "Cleaner", "Handyman", "Lawn care", "Pest control", "Appliance repair", "Locksmith", "Smart lock technician", "General contractor"];
const FREQUENCIES = ["daily", "weekly", "biweekly", "monthly", "quarterly", "biannually", "annually"];

const STATUS_COLORS: Record<string, string> = {
  new: "text-red-600 bg-red-50",
  scheduled: "text-blue-600 bg-blue-50",
  in_progress: "text-amber-600 bg-amber-50",
  waiting_on_vendor: "text-purple-600 bg-purple-50",
  waiting_on_parts: "text-orange-600 bg-orange-50",
  completed: "text-emerald-600 bg-emerald-50",
  cancelled: "text-gray-500 bg-gray-100",
  archived: "text-gray-400 bg-gray-50",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-gray-500 bg-gray-100",
  medium: "text-blue-600 bg-blue-50",
  high: "text-amber-600 bg-amber-50",
  urgent: "text-red-600 bg-red-50",
};

const CALENDAR_EVENT_COLORS: Record<string, string> = {
  new: "#ef4444",
  scheduled: "#3b82f6",
  in_progress: "#f59e0b",
  waiting_on_vendor: "#8b5cf6",
  waiting_on_parts: "#f97316",
  completed: "#10b981",
  cancelled: "#6b7280",
  urgent: "#dc2626",
  high: "#d97706",
  medium: "#2563eb",
  low: "#6b7280",
};

// ─── Helpers ────────────────────────────────────────────────────────────

const statusLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const formatCurrency = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0 });
const formatCurrencyDec = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatDateTime = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

const isCurrentMonth = (d: string | null) => {
  if (!d) return false;
  const dt = new Date(d);
  const now = new Date();
  return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
};

const isThisWeek = (d: string | null) => {
  if (!d) return false;
  const dt = new Date(d);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return dt >= weekStart && dt < weekEnd;
};

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

// ─── Sub-Components ─────────────────────────────────────────────────────

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 ${className}`}>{children}</span>;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Wrench }) {
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

export default function MaintenanceLogPage() {
  // ── State ──
  type MainTab = "calendar" | "work_orders" | "log" | "recurring" | "vendors" | "costs" | "guest_issues";
  const [mainTab, setMainTab] = useState<MainTab>("calendar");
  type CalView = "month" | "week" | "day" | "list";
  const [calView, setCalView] = useState<CalView>("month");

  // Data
  const [logs, setLogs] = useState<MaintenanceLogRecord[]>([]);
  const [calEvents, setCalEvents] = useState<CalendarEventRecord[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTaskRecord[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [listings, setListings] = useState<ListingRecord[]>([]);

  // Loading/error
  const [loading, setLoading] = useState(true);
  const [logsError, setLogsError] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Calendar state
  const [calDate, setCalDate] = useState(new Date());

  // Drawers
  const [selectedLog, setSelectedLog] = useState<MaintenanceLogRecord | null>(null);
  const [drawerTab, setDrawerTab] = useState("overview");
  const [showAddLog, setShowAddLog] = useState(false);
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [saving, setSaving] = useState(false);

  // Forms
  const [newLog, setNewLog] = useState({
    propertyId: "", listingId: "", roomId: "", issueTitle: "", issueType: "General Repair",
    category: "General Repair", description: "", priority: "medium", status: "new",
    reportedBy: "", bookingId: "", vendorId: "", scheduledDate: "", dueDate: "",
    estimatedCost: 0, notes: "",
  });

  const [newRecurring, setNewRecurring] = useState({
    propertyId: "", listingId: "", taskName: "", category: "Preventive Maintenance",
    frequency: "monthly", nextDueDate: "", vendorId: "", estimatedCost: 0,
    reminderDaysBefore: 7, autoCreateEvent: true, notes: "",
  });

  const [newVendor, setNewVendor] = useState({
    vendorName: "", vendorType: "Handyman", contactName: "", phone: "", email: "",
    website: "", notes: "",
  });

  // ── Data Fetching ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setLogsError(false);
    const results = await Promise.allSettled([
      fetch("/api/admin/maintenance-logs").then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/maintenance-calendar").then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/recurring-maintenance").then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/vendors").then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/admin/listings").then(r => r.ok ? r.json() : Promise.reject()),
    ]);

    if (results[0].status === "fulfilled") setLogs(Array.isArray(results[0].value) ? results[0].value : []);
    else setLogsError(true);

    if (results[1].status === "fulfilled") setCalEvents(Array.isArray(results[1].value) ? results[1].value : []);
    if (results[2].status === "fulfilled") setRecurringTasks(Array.isArray(results[2].value) ? results[2].value : []);
    if (results[3].status === "fulfilled") {
      const vd = results[3].value;
      setVendors(Array.isArray(vd) ? vd : vd.data || []);
    }
    if (results[4].status === "fulfilled") {
      const ld = results[4].value;
      setListings(Array.isArray(ld) ? ld : ld.data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filtered Logs ──
  const filteredLogs = useMemo(() => {
    let list = logs;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.issueTitle?.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.category?.toLowerCase().includes(q) ||
        l.vendor?.vendorName?.toLowerCase().includes(q) ||
        l.reportedBy?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter(l => l.status === statusFilter);
    if (priorityFilter !== "all") list = list.filter(l => l.priority === priorityFilter);
    if (categoryFilter !== "all") list = list.filter(l => l.category === categoryFilter);
    return list;
  }, [logs, search, statusFilter, priorityFilter, categoryFilter]);

  // ── KPI Stats ──
  const stats = useMemo(() => {
    const openLogs = logs.filter(l => l.status === "new" || l.status === "in_progress" || l.status === "waiting_on_vendor" || l.status === "waiting_on_parts");
    const scheduledWeek = logs.filter(l => l.status === "scheduled" && isThisWeek(l.scheduledDate));
    const completedMonth = logs.filter(l => l.status === "completed" && isCurrentMonth(l.completedDate || l.updatedAt));
    const urgentRepairs = logs.filter(l => l.priority === "urgent" && l.status !== "completed" && l.status !== "cancelled");
    const guestIssues = logs.filter(l => l.category === "Guest-Reported Issue" && l.status !== "completed" && l.status !== "cancelled");
    const costMTD = logs.filter(l => isCurrentMonth(l.completedDate || l.updatedAt) && l.status === "completed")
      .reduce((s, l) => s + (l.actualCost || l.cost || 0), 0);
    const vendorJobs = logs.filter(l => l.vendorId && l.status !== "completed" && l.status !== "cancelled").length;
    const recurringDue = recurringTasks.filter(t => {
      if (!t.nextDueDate || t.status !== "active") return false;
      return new Date(t.nextDueDate) <= new Date(Date.now() + 7 * 86400000);
    }).length;

    return {
      openIssues: openLogs.length,
      scheduledWeek: scheduledWeek.length,
      completedMonth: completedMonth.length,
      urgentRepairs: urgentRepairs.length,
      guestIssues: guestIssues.length,
      costMTD,
      vendorJobs,
      recurringDue,
    };
  }, [logs, recurringTasks]);

  // ── Vendor lookup ──
  const vendorName = (id: string | null) => {
    if (!id) return "—";
    return vendors.find(v => v.id === id)?.vendorName || "Unknown";
  };

  const listingName = (id: string | null) => {
    if (!id) return "—";
    return listings.find(l => l.id === id)?.title || "Unknown";
  };

  // ── Calendar helpers ──
  const calYear = calDate.getFullYear();
  const calMonth = calDate.getMonth();
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const monthName = calDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [firstDay, daysInMonth]);

  const eventsForDay = useCallback((day: number) => {
    const target = new Date(calYear, calMonth, day);
    return calEvents.filter(e => isSameDay(new Date(e.startDatetime), target));
  }, [calEvents, calYear, calMonth]);

  const logsForDay = useCallback((day: number) => {
    const target = new Date(calYear, calMonth, day);
    return logs.filter(l => {
      const sd = l.scheduledDate ? new Date(l.scheduledDate) : null;
      const md = new Date(l.maintenanceDate);
      return (sd && isSameDay(sd, target)) || isSameDay(md, target);
    });
  }, [logs, calYear, calMonth]);

  const prevMonth = () => setCalDate(new Date(calYear, calMonth - 1, 1));
  const nextMonth = () => setCalDate(new Date(calYear, calMonth + 1, 1));
  const today = () => setCalDate(new Date());

  // ── Week view helpers ──
  const weekStart = useMemo(() => {
    const d = new Date(calDate);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, [calDate]);

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStart]);

  // ── CRUD ──
  const addLog = async () => {
    if (!newLog.issueTitle || !newLog.propertyId) return;
    setSaving(true);
    try {
      const payload = {
        ...newLog,
        maintenanceDate: new Date().toISOString(),
        estimatedCost: Number(newLog.estimatedCost),
        cost: Number(newLog.estimatedCost),
        scheduledDate: newLog.scheduledDate || undefined,
        dueDate: newLog.dueDate || undefined,
        listingId: newLog.listingId || undefined,
        roomId: newLog.roomId || undefined,
        bookingId: newLog.bookingId || undefined,
        vendorId: newLog.vendorId || undefined,
      };
      const res = await fetch("/api/admin/maintenance-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        if (newLog.scheduledDate) {
          const created = await res.json();
          await fetch("/api/admin/maintenance-calendar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              maintenanceLogId: created.id,
              propertyId: newLog.propertyId,
              listingId: newLog.listingId || undefined,
              title: newLog.issueTitle,
              startDatetime: newLog.scheduledDate,
              calendarViewStatus: "scheduled",
              colorStatus: newLog.priority,
            }),
          });
        }
        setShowAddLog(false);
        setNewLog({ propertyId: "", listingId: "", roomId: "", issueTitle: "", issueType: "General Repair", category: "General Repair", description: "", priority: "medium", status: "new", reportedBy: "", bookingId: "", vendorId: "", scheduledDate: "", dueDate: "", estimatedCost: 0, notes: "" });
        await fetchAll();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const updateLog = async (id: string, data: Record<string, unknown>) => {
    try {
      await fetch("/api/admin/maintenance-logs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      await fetchAll();
      if (selectedLog?.id === id) {
        setSelectedLog(prev => prev ? { ...prev, ...data } as MaintenanceLogRecord : null);
      }
    } catch { /* ignore */ }
  };

  const addRecurringTask = async () => {
    if (!newRecurring.taskName || !newRecurring.propertyId) return;
    setSaving(true);
    try {
      const payload = {
        ...newRecurring,
        estimatedCost: Number(newRecurring.estimatedCost),
        reminderDaysBefore: Number(newRecurring.reminderDaysBefore),
        nextDueDate: newRecurring.nextDueDate || undefined,
        listingId: newRecurring.listingId || undefined,
        vendorId: newRecurring.vendorId || undefined,
      };
      const res = await fetch("/api/admin/recurring-maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowAddRecurring(false);
        setNewRecurring({ propertyId: "", listingId: "", taskName: "", category: "Preventive Maintenance", frequency: "monthly", nextDueDate: "", vendorId: "", estimatedCost: 0, reminderDaysBefore: 7, autoCreateEvent: true, notes: "" });
        await fetchAll();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const addVendorRecord = async () => {
    if (!newVendor.vendorName) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVendor),
      });
      if (res.ok) {
        setShowAddVendor(false);
        setNewVendor({ vendorName: "", vendorType: "Handyman", contactName: "", phone: "", email: "", website: "", notes: "" });
        await fetchAll();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const openLog = (log: MaintenanceLogRecord) => {
    setSelectedLog(log);
    setDrawerTab("overview");
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Wrench size={16} className="text-warm-gray animate-pulse mr-2" />
        <p className="text-warm-gray text-sm">Loading Maintenance...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="font-serif text-2xl text-charcoal font-light">Maintenance Log</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => { setNewLog(prev => ({ ...prev, propertyId: listings[0]?.id || "" })); setShowAddLog(true); }} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5">
            <Plus size={12} /> Add Log
          </button>
          <button onClick={() => { setNewLog(prev => ({ ...prev, propertyId: listings[0]?.id || "", status: "scheduled" })); setShowAddLog(true); }} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5">
            <Calendar size={12} /> Schedule
          </button>
          <button onClick={() => setShowAddVendor(true)} className="border border-light-gray text-charcoal text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition px-4 py-2.5 flex items-center gap-1.5">
            <User size={12} /> Add Vendor
          </button>
          <button onClick={() => alert("Export maintenance logs")} className="border border-light-gray text-charcoal text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition px-3 py-2.5">
            <Download size={12} />
          </button>
        </div>
      </div>

      {/* ─── Error Banner ────────────────────────────────────────────── */}
      {logsError && (
        <div className="bg-amber-50 border border-amber-200 p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-amber-800 font-medium mb-1">Unable to load maintenance logs</p>
              <p className="text-xs text-amber-700 mb-3">Data could not be fetched. You can still add logs manually or import from CSV.</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={fetchAll} className="bg-amber-600 text-white text-[10px] tracking-[0.15em] uppercase font-medium px-3 py-2 flex items-center gap-1.5 hover:bg-amber-700 transition"><RefreshCw size={11} /> Retry</button>
                <button onClick={() => setShowAddLog(true)} className="border border-amber-300 text-amber-800 text-[10px] tracking-[0.15em] uppercase font-medium px-3 py-2 flex items-center gap-1.5 hover:bg-amber-100 transition"><Plus size={11} /> Add Manually</button>
                <button onClick={() => alert("Import CSV")} className="border border-amber-300 text-amber-800 text-[10px] tracking-[0.15em] uppercase font-medium px-3 py-2 flex items-center gap-1.5 hover:bg-amber-100 transition"><Upload size={11} /> Import CSV</button>
                <button onClick={() => alert("Check connection")} className="border border-amber-300 text-amber-800 text-[10px] tracking-[0.15em] uppercase font-medium px-3 py-2 flex items-center gap-1.5 hover:bg-amber-100 transition"><Plug size={11} /> Check Connection</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── KPI Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Open Issues" value={stats.openIssues} icon={AlertTriangle} />
        <StatCard label="Scheduled This Week" value={stats.scheduledWeek} icon={Calendar} />
        <StatCard label="Completed This Month" value={stats.completedMonth} icon={CheckCircle} />
        <StatCard label="Urgent Repairs" value={stats.urgentRepairs} icon={Shield} />
        <StatCard label="Guest-Reported" value={stats.guestIssues} icon={User} />
        <StatCard label="Cost MTD" value={formatCurrency(stats.costMTD)} icon={DollarSign} />
        <StatCard label="Vendor Jobs" value={stats.vendorJobs} icon={Wrench} />
        <StatCard label="Recurring Due" value={stats.recurringDue} icon={Repeat} />
      </div>

      {/* ─── Main Tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center border border-light-gray bg-white mb-6 overflow-x-auto">
        {([
          ["calendar", "Calendar", CalendarDays],
          ["work_orders", "Work Orders", ClipboardCheck],
          ["log", "Log", List],
          ["recurring", "Recurring", Repeat],
          ["vendors", "Vendors", User],
          ["costs", "Costs", DollarSign],
          ["guest_issues", "Guest Issues", AlertTriangle],
        ] as [MainTab, string, typeof Wrench][]).map(([key, label, Icon]) => (
          <TabButton key={key} active={mainTab === key} onClick={() => setMainTab(key)}>
            <span className="flex items-center gap-1.5"><Icon size={12} /> {label}</span>
          </TabButton>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CALENDAR VIEW                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "calendar" && (
        <div className="space-y-4">
          {/* Calendar Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-1.5 border border-light-gray hover:bg-cream transition"><ChevronLeft size={14} /></button>
              <h2 className="font-serif text-lg text-charcoal min-w-[180px] text-center">{monthName}</h2>
              <button onClick={nextMonth} className="p-1.5 border border-light-gray hover:bg-cream transition"><ChevronRight size={14} /></button>
              <button onClick={today} className="text-[10px] tracking-[0.15em] uppercase text-charcoal border border-light-gray px-3 py-1.5 hover:bg-cream transition ml-2">Today</button>
            </div>
            <div className="flex items-center border border-light-gray bg-white">
              {([["month", "Month"], ["week", "Week"], ["day", "Day"], ["list", "List"]] as [CalView, string][]).map(([v, l]) => (
                <button key={v} onClick={() => setCalView(v)} className={`text-[10px] tracking-[0.15em] uppercase font-medium px-3 py-1.5 transition ${calView === v ? "bg-charcoal text-white" : "text-charcoal/60 hover:text-charcoal"}`}>{l}</button>
              ))}
            </div>
          </div>

          {/* Month View */}
          {calView === "month" && (
            <div className="bg-white border border-light-gray">
              <div className="grid grid-cols-7 border-b border-light-gray">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                  <div key={d} className="px-2 py-2 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium text-center">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays.map((day, i) => {
                  const isToday = day ? isSameDay(new Date(calYear, calMonth, day), new Date()) : false;
                  const dayLogs = day ? logsForDay(day) : [];
                  const dayEvents = day ? eventsForDay(day) : [];
                  const allItems = [...dayLogs, ...dayEvents.filter(e => !dayLogs.some(l => l.id === e.maintenanceLogId))];

                  return (
                    <div
                      key={i}
                      className={`min-h-[90px] border-b border-r border-light-gray/50 p-1 ${day ? "cursor-pointer hover:bg-cream/30 transition" : "bg-cream/20"} ${isToday ? "bg-blue-50/30" : ""}`}
                      onClick={() => {
                        if (day) {
                          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                          setNewLog(prev => ({ ...prev, propertyId: listings[0]?.id || "", scheduledDate: dateStr, status: "scheduled" }));
                          setShowAddLog(true);
                        }
                      }}
                    >
                      {day && (
                        <>
                          <p className={`text-[10px] font-medium mb-0.5 ${isToday ? "text-blue-600" : "text-charcoal"}`}>{day}</p>
                          <div className="space-y-0.5">
                            {allItems.slice(0, 3).map((item, idx) => {
                              const log = "description" in item ? item as MaintenanceLogRecord : (item as CalendarEventRecord).maintenanceLog;
                              const title = "issueTitle" in item ? (item as MaintenanceLogRecord).issueTitle || (item as MaintenanceLogRecord).description.slice(0, 30) : (item as CalendarEventRecord).title;
                              const priority = log?.priority || "medium";
                              const color = CALENDAR_EVENT_COLORS[priority] || "#6b7280";
                              return (
                                <div
                                  key={idx}
                                  className="text-[8px] leading-tight px-1 py-0.5 truncate cursor-pointer"
                                  style={{ backgroundColor: color + "15", color, borderLeft: `2px solid ${color}` }}
                                  onClick={e => { e.stopPropagation(); if (log && "description" in log) openLog(log as MaintenanceLogRecord); }}
                                >
                                  {title}
                                </div>
                              );
                            })}
                            {allItems.length > 3 && (
                              <p className="text-[8px] text-warm-gray pl-1">+{allItems.length - 3} more</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week View */}
          {calView === "week" && (
            <div className="bg-white border border-light-gray">
              <div className="grid grid-cols-7 border-b border-light-gray">
                {weekDays.map((d, i) => {
                  const isToday = isSameDay(d, new Date());
                  return (
                    <div key={i} className={`px-2 py-2 text-center ${isToday ? "bg-blue-50/30" : ""}`}>
                      <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">{d.toLocaleDateString("en-US", { weekday: "short" })}</p>
                      <p className={`text-sm font-medium ${isToday ? "text-blue-600" : "text-charcoal"}`}>{d.getDate()}</p>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-7 min-h-[300px]">
                {weekDays.map((d, i) => {
                  const dayLogs = logs.filter(l => {
                    const sd = l.scheduledDate ? new Date(l.scheduledDate) : null;
                    const md = new Date(l.maintenanceDate);
                    return (sd && isSameDay(sd, d)) || isSameDay(md, d);
                  });
                  return (
                    <div key={i} className="border-r border-light-gray/50 p-1 space-y-1">
                      {dayLogs.map(log => {
                        const color = CALENDAR_EVENT_COLORS[log.priority] || "#6b7280";
                        return (
                          <div
                            key={log.id}
                            className="text-[9px] px-1.5 py-1 cursor-pointer hover:opacity-80 transition"
                            style={{ backgroundColor: color + "15", color, borderLeft: `2px solid ${color}` }}
                            onClick={() => openLog(log)}
                          >
                            <p className="font-medium truncate">{log.issueTitle || log.description.slice(0, 25)}</p>
                            <p className="opacity-70 truncate">{vendorName(log.vendorId)}</p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Day View */}
          {calView === "day" && (
            <div className="bg-white border border-light-gray p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-charcoal">{calDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</h3>
                <div className="flex gap-1">
                  <button onClick={() => setCalDate(new Date(calDate.getTime() - 86400000))} className="p-1 border border-light-gray hover:bg-cream transition"><ChevronLeft size={12} /></button>
                  <button onClick={() => setCalDate(new Date(calDate.getTime() + 86400000))} className="p-1 border border-light-gray hover:bg-cream transition"><ChevronRight size={12} /></button>
                </div>
              </div>
              {(() => {
                const dayLogs = logs.filter(l => {
                  const sd = l.scheduledDate ? new Date(l.scheduledDate) : null;
                  const md = new Date(l.maintenanceDate);
                  return (sd && isSameDay(sd, calDate)) || isSameDay(md, calDate);
                });
                if (dayLogs.length === 0) return <p className="text-xs text-warm-gray text-center py-8">No maintenance scheduled for this day.</p>;
                return (
                  <div className="space-y-2">
                    {dayLogs.map(log => (
                      <div key={log.id} className="border border-light-gray p-3 hover:bg-cream/30 transition cursor-pointer flex items-center justify-between" onClick={() => openLog(log)}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={PRIORITY_COLORS[log.priority] || "text-gray-500 bg-gray-100"}>{log.priority}</Badge>
                            <Badge className={STATUS_COLORS[log.status] || "text-gray-500 bg-gray-100"}>{statusLabel(log.status)}</Badge>
                          </div>
                          <p className="text-xs text-charcoal font-medium">{log.issueTitle || log.description.slice(0, 60)}</p>
                          <p className="text-[10px] text-warm-gray mt-0.5">{log.category} · {vendorName(log.vendorId)} · {formatCurrency(log.estimatedCost || log.cost)}</p>
                        </div>
                        <Eye size={14} className="text-warm-gray shrink-0" />
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* List View */}
          {calView === "list" && (
            <div className="bg-white border border-light-gray">
              {(() => {
                const upcoming = logs
                  .filter(l => l.scheduledDate && new Date(l.scheduledDate) >= new Date() && l.status !== "completed" && l.status !== "cancelled")
                  .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime());
                if (upcoming.length === 0) return <p className="text-xs text-warm-gray text-center py-8">No upcoming scheduled maintenance.</p>;
                return upcoming.map(log => (
                  <div key={log.id} className="border-b border-light-gray/50 p-4 hover:bg-cream/30 transition cursor-pointer flex items-center justify-between" onClick={() => openLog(log)}>
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[48px]">
                        <p className="text-[9px] uppercase text-warm-gray">{new Date(log.scheduledDate!).toLocaleDateString("en-US", { month: "short" })}</p>
                        <p className="text-lg font-serif text-charcoal">{new Date(log.scheduledDate!).getDate()}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge className={PRIORITY_COLORS[log.priority]}>{log.priority}</Badge>
                          <Badge className={STATUS_COLORS[log.status]}>{statusLabel(log.status)}</Badge>
                        </div>
                        <p className="text-xs text-charcoal font-medium">{log.issueTitle || log.description.slice(0, 60)}</p>
                        <p className="text-[10px] text-warm-gray">{log.category} · {vendorName(log.vendorId)}</p>
                      </div>
                    </div>
                    <span className="text-xs text-charcoal font-medium">{formatCurrency(log.estimatedCost || log.cost)}</span>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* WORK ORDERS / LOG TABLE                                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {(mainTab === "work_orders" || mainTab === "log") && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
              <input type="text" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 pl-9 outline-none focus:border-charcoal/40 transition-colors" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
              <option value="all">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
              <option value="all">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{statusLabel(p)}</option>)}
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="bg-white border border-light-gray overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-light-gray">
                  <th className="text-left px-4 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Issue</th>
                  <th className="text-left px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden md:table-cell">Category</th>
                  <th className="text-left px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Priority</th>
                  <th className="text-left px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Status</th>
                  <th className="text-left px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden lg:table-cell">Vendor</th>
                  <th className="text-left px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden lg:table-cell">Scheduled</th>
                  <th className="text-right px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden md:table-cell">Est. Cost</th>
                  <th className="text-right px-4 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-warm-gray">No maintenance logs match your filters.</td></tr>
                ) : filteredLogs.map(log => (
                  <tr key={log.id} className="border-b border-light-gray/50 hover:bg-cream/30 transition cursor-pointer" onClick={() => openLog(log)}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-charcoal">{log.issueTitle || log.description.slice(0, 40)}</p>
                      <p className="text-[10px] text-warm-gray">{listingName(log.listingId || log.propertyId)}{log.reportedBy ? ` · ${log.reportedBy}` : ""}</p>
                    </td>
                    <td className="px-3 py-3 text-warm-gray hidden md:table-cell">{log.category || log.issueType}</td>
                    <td className="px-3 py-3"><Badge className={PRIORITY_COLORS[log.priority] || "text-gray-500 bg-gray-100"}>{log.priority}</Badge></td>
                    <td className="px-3 py-3"><Badge className={STATUS_COLORS[log.status] || "text-gray-500 bg-gray-100"}>{statusLabel(log.status)}</Badge></td>
                    <td className="px-3 py-3 text-warm-gray hidden lg:table-cell">{vendorName(log.vendorId)}</td>
                    <td className="px-3 py-3 text-warm-gray hidden lg:table-cell">{formatDate(log.scheduledDate)}</td>
                    <td className="px-3 py-3 text-right text-charcoal hidden md:table-cell">{formatCurrencyDec(log.estimatedCost || log.cost)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={e => { e.stopPropagation(); openLog(log); }} className="text-charcoal hover:bg-cream p-1 transition"><Eye size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-warm-gray mt-2">{filteredLogs.length} maintenance logs</p>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* RECURRING MAINTENANCE                                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "recurring" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-warm-gray">{recurringTasks.length} recurring tasks</p>
            <button onClick={() => { setNewRecurring(prev => ({ ...prev, propertyId: listings[0]?.id || "" })); setShowAddRecurring(true); }} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5"><Plus size={12} /> Add Recurring Task</button>
          </div>
          {recurringTasks.length === 0 ? (
            <div className="bg-white border border-light-gray p-12 text-center">
              <Repeat size={24} className="mx-auto mb-3 text-warm-gray/50" />
              <p className="text-sm text-charcoal mb-1">No recurring tasks</p>
              <p className="text-xs text-warm-gray mb-4">Set up recurring maintenance like HVAC filter changes, pest control, and safety inspections.</p>
              <button onClick={() => setShowAddRecurring(true)} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5">Add Recurring Task</button>
            </div>
          ) : (
            <div className="space-y-3">
              {recurringTasks.map(task => {
                const isDue = task.nextDueDate && new Date(task.nextDueDate) <= new Date(Date.now() + 7 * 86400000);
                const isOverdue = task.nextDueDate && new Date(task.nextDueDate) < new Date();
                return (
                  <div key={task.id} className={`bg-white border p-4 ${isOverdue ? "border-red-200" : isDue ? "border-amber-200" : "border-light-gray"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs text-charcoal font-medium">{task.taskName}</p>
                          <Badge className="text-warm-gray bg-cream">{task.category}</Badge>
                          <Badge className={`${task.status === "active" ? "text-emerald-600 bg-emerald-50" : "text-gray-500 bg-gray-100"}`}>{task.status}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-warm-gray">
                          <span className="flex items-center gap-1"><Repeat size={10} /> {statusLabel(task.frequency)}</span>
                          <span>Next: {formatDate(task.nextDueDate)}</span>
                          {task.lastCompletedDate && <span>Last: {formatDate(task.lastCompletedDate)}</span>}
                          <span>{vendorName(task.vendorId)}</span>
                          <span>{formatCurrency(task.estimatedCost)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOverdue && <Badge className="text-red-600 bg-red-50">Overdue</Badge>}
                        {isDue && !isOverdue && <Badge className="text-amber-600 bg-amber-50">Due Soon</Badge>}
                        <button onClick={() => {
                          setNewLog(prev => ({ ...prev, propertyId: task.propertyId, issueTitle: task.taskName, category: task.category, vendorId: task.vendorId || "", estimatedCost: task.estimatedCost }));
                          setShowAddLog(true);
                        }} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-3 py-1.5">Create Work Order</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* VENDORS                                                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "vendors" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-warm-gray">{vendors.length} vendors</p>
            <button onClick={() => setShowAddVendor(true)} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5"><Plus size={12} /> Add Vendor</button>
          </div>
          {vendors.length === 0 ? (
            <div className="bg-white border border-light-gray p-12 text-center">
              <User size={24} className="mx-auto mb-3 text-warm-gray/50" />
              <p className="text-sm text-charcoal mb-1">No vendors yet</p>
              <p className="text-xs text-warm-gray mb-4">Add your plumbers, electricians, handymen, and other service providers.</p>
              <button onClick={() => setShowAddVendor(true)} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5">Add Vendor</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {vendors.map(v => {
                const jobCount = logs.filter(l => l.vendorId === v.id && l.status !== "completed" && l.status !== "cancelled").length;
                return (
                  <div key={v.id} className="bg-white border border-light-gray p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-medium text-charcoal">{v.vendorName}</h3>
                      <Badge className={v.isActive ? "text-emerald-600 bg-emerald-50" : "text-gray-500 bg-gray-100"}>{v.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                    <Badge className="text-warm-gray bg-cream mb-2">{v.vendorType}</Badge>
                    <div className="space-y-1 mt-2">
                      {v.contactName && <p className="text-[10px] text-warm-gray flex items-center gap-1"><User size={10} /> {v.contactName}</p>}
                      {v.phone && <p className="text-[10px] text-warm-gray flex items-center gap-1"><Phone size={10} /> {v.phone}</p>}
                      {v.email && <p className="text-[10px] text-warm-gray flex items-center gap-1"><Mail size={10} /> {v.email}</p>}
                      {v.website && <p className="text-[10px] text-warm-gray flex items-center gap-1"><Globe size={10} /> {v.website}</p>}
                    </div>
                    {jobCount > 0 && <p className="text-[10px] text-charcoal mt-2 font-medium">{jobCount} active jobs</p>}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* COSTS VIEW                                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "costs" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="bg-white border border-light-gray p-4">
              <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">Total Estimated (Open)</p>
              <p className="text-xl font-serif text-charcoal">{formatCurrency(logs.filter(l => l.status !== "completed" && l.status !== "cancelled").reduce((s, l) => s + (l.estimatedCost || l.cost), 0))}</p>
            </div>
            <div className="bg-white border border-light-gray p-4">
              <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">Actual Cost MTD</p>
              <p className="text-xl font-serif text-charcoal">{formatCurrency(stats.costMTD)}</p>
            </div>
            <div className="bg-white border border-light-gray p-4">
              <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">Total All Time</p>
              <p className="text-xl font-serif text-charcoal">{formatCurrency(logs.filter(l => l.status === "completed").reduce((s, l) => s + (l.actualCost || l.cost), 0))}</p>
            </div>
          </div>

          <div className="bg-white border border-light-gray overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-light-gray">
                  <th className="text-left px-4 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Issue</th>
                  <th className="text-left px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Status</th>
                  <th className="text-left px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden md:table-cell">Vendor</th>
                  <th className="text-right px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Estimated</th>
                  <th className="text-right px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Actual</th>
                  <th className="text-right px-3 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden lg:table-cell">Labor</th>
                  <th className="text-right px-4 py-3 text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium hidden lg:table-cell">Materials</th>
                </tr>
              </thead>
              <tbody>
                {logs.filter(l => (l.estimatedCost || l.actualCost || l.cost) > 0).map(log => (
                  <tr key={log.id} className="border-b border-light-gray/50 hover:bg-cream/30 transition cursor-pointer" onClick={() => openLog(log)}>
                    <td className="px-4 py-3 text-charcoal font-medium">{log.issueTitle || log.description.slice(0, 40)}</td>
                    <td className="px-3 py-3"><Badge className={STATUS_COLORS[log.status]}>{statusLabel(log.status)}</Badge></td>
                    <td className="px-3 py-3 text-warm-gray hidden md:table-cell">{vendorName(log.vendorId)}</td>
                    <td className="px-3 py-3 text-right text-charcoal">{formatCurrencyDec(log.estimatedCost || log.cost)}</td>
                    <td className="px-3 py-3 text-right text-charcoal font-medium">{formatCurrencyDec(log.actualCost)}</td>
                    <td className="px-3 py-3 text-right text-warm-gray hidden lg:table-cell">{formatCurrencyDec(log.laborCost)}</td>
                    <td className="px-4 py-3 text-right text-warm-gray hidden lg:table-cell">{formatCurrencyDec(log.materialsCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* GUEST ISSUES                                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "guest_issues" && (
        <>
          {(() => {
            const guestLogs = logs.filter(l => l.category === "Guest-Reported Issue" || l.guestRequestId);
            if (guestLogs.length === 0) return (
              <div className="bg-white border border-light-gray p-12 text-center">
                <CheckCircle size={24} className="mx-auto mb-3 text-emerald-400" />
                <p className="text-sm text-charcoal mb-1">No guest-reported issues</p>
                <p className="text-xs text-warm-gray">Issues reported by guests through the Check-In Portal will appear here.</p>
              </div>
            );
            return (
              <div className="space-y-3">
                {guestLogs.map(log => (
                  <div key={log.id} className="bg-white border border-light-gray p-4 hover:bg-cream/30 transition cursor-pointer" onClick={() => openLog(log)}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={PRIORITY_COLORS[log.priority]}>{log.priority}</Badge>
                        <Badge className={STATUS_COLORS[log.status]}>{statusLabel(log.status)}</Badge>
                      </div>
                      <span className="text-[10px] text-warm-gray">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="text-xs text-charcoal font-medium mb-1">{log.issueTitle || log.description.slice(0, 60)}</p>
                    <p className="text-[10px] text-warm-gray">{log.reportedBy ? `Reported by ${log.reportedBy}` : ""} · {listingName(log.listingId || log.propertyId)} · {log.category}</p>
                  </div>
                ))}
              </div>
            );
          })()}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* WORK ORDER DETAIL DRAWER                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedLog(null)} />
          <div className="relative bg-white w-full max-w-2xl h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-light-gray z-10">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-lg text-charcoal">{selectedLog.issueTitle || selectedLog.description.slice(0, 50)}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={PRIORITY_COLORS[selectedLog.priority]}>{selectedLog.priority}</Badge>
                    <Badge className={STATUS_COLORS[selectedLog.status]}>{statusLabel(selectedLog.status)}</Badge>
                    <span className="text-[10px] text-warm-gray">{selectedLog.category || selectedLog.issueType}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
              </div>
              <div className="flex overflow-x-auto px-4 gap-1">
                {[
                  { key: "overview", label: "Overview" },
                  { key: "schedule", label: "Schedule" },
                  { key: "cost", label: "Cost" },
                  { key: "photos", label: "Photos" },
                  { key: "activity", label: "Activity" },
                ].map(tab => (
                  <DrawerTabButton key={tab.key} active={drawerTab === tab.key} onClick={() => setDrawerTab(tab.key)}>{tab.label}</DrawerTabButton>
                ))}
              </div>
            </div>

            <div className="p-4">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedLog.status !== "completed" && (
                  <>
                    {selectedLog.status === "new" && (
                      <button onClick={() => updateLog(selectedLog.id, { status: "scheduled" })} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-3 py-2 flex items-center gap-1.5"><Calendar size={11} /> Schedule</button>
                    )}
                    {(selectedLog.status === "scheduled" || selectedLog.status === "new") && (
                      <button onClick={() => updateLog(selectedLog.id, { status: "in_progress" })} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-3 py-2 flex items-center gap-1.5"><Wrench size={11} /> Start Work</button>
                    )}
                    <button onClick={() => updateLog(selectedLog.id, { status: "completed", completedDate: new Date().toISOString() })} className="bg-emerald-600 text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-emerald-700 transition px-3 py-2 flex items-center gap-1.5"><CheckCircle size={11} /> Complete</button>
                    <button onClick={() => updateLog(selectedLog.id, { status: "cancelled" })} className="border border-red-200 text-red-600 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-red-50 transition px-3 py-2 flex items-center gap-1.5"><XCircle size={11} /> Cancel</button>
                  </>
                )}
              </div>

              {/* Overview Tab */}
              {drawerTab === "overview" && (
                <div className="space-y-4">
                  <div className="bg-cream/50 border border-light-gray p-4 space-y-3">
                    <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-warm-gray">Property:</span> <span className="text-charcoal">{listingName(selectedLog.listingId || selectedLog.propertyId)}</span></div>
                      <div><span className="text-warm-gray">Category:</span> <span className="text-charcoal">{selectedLog.category || selectedLog.issueType}</span></div>
                      <div><span className="text-warm-gray">Reported By:</span> <span className="text-charcoal">{selectedLog.reportedBy || "—"}</span></div>
                      <div><span className="text-warm-gray">Vendor:</span> <span className="text-charcoal">{selectedLog.vendor?.vendorName || vendorName(selectedLog.vendorId)}</span></div>
                    </div>
                    <div className="text-xs text-charcoal mt-2">{selectedLog.description}</div>
                  </div>
                  {selectedLog.notes && (
                    <div className="bg-cream/50 border border-light-gray p-4">
                      <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-2">Notes</h3>
                      <p className="text-xs text-charcoal whitespace-pre-wrap">{selectedLog.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Schedule Tab */}
              {drawerTab === "schedule" && (
                <div className="space-y-4">
                  <div className="bg-cream/50 border border-light-gray p-4">
                    <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-3">Schedule</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-warm-gray">Created:</span> <span className="text-charcoal">{formatDate(selectedLog.createdAt)}</span></div>
                      <div><span className="text-warm-gray">Scheduled:</span> <span className="text-charcoal">{formatDate(selectedLog.scheduledDate)}</span></div>
                      <div><span className="text-warm-gray">Due Date:</span> <span className="text-charcoal">{formatDate(selectedLog.dueDate)}</span></div>
                      <div><span className="text-warm-gray">Completed:</span> <span className="text-charcoal">{formatDate(selectedLog.completedDate)}</span></div>
                      <div><span className="text-warm-gray">Start Time:</span> <span className="text-charcoal">{selectedLog.startTime ? formatDateTime(selectedLog.startTime) : "—"}</span></div>
                      <div><span className="text-warm-gray">End Time:</span> <span className="text-charcoal">{selectedLog.endTime ? formatDateTime(selectedLog.endTime) : "—"}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cost Tab */}
              {drawerTab === "cost" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-cream/50 border border-light-gray p-3 text-center">
                      <p className="text-[9px] uppercase tracking-wider text-warm-gray font-medium mb-1">Estimated</p>
                      <p className="text-lg font-serif text-charcoal">{formatCurrencyDec(selectedLog.estimatedCost || selectedLog.cost)}</p>
                    </div>
                    <div className="bg-cream/50 border border-light-gray p-3 text-center">
                      <p className="text-[9px] uppercase tracking-wider text-warm-gray font-medium mb-1">Actual</p>
                      <p className="text-lg font-serif text-charcoal">{formatCurrencyDec(selectedLog.actualCost)}</p>
                    </div>
                    <div className="bg-cream/50 border border-light-gray p-3 text-center">
                      <p className="text-[9px] uppercase tracking-wider text-warm-gray font-medium mb-1">Labor</p>
                      <p className="text-lg font-serif text-charcoal">{formatCurrencyDec(selectedLog.laborCost)}</p>
                    </div>
                    <div className="bg-cream/50 border border-light-gray p-3 text-center">
                      <p className="text-[9px] uppercase tracking-wider text-warm-gray font-medium mb-1">Materials</p>
                      <p className="text-lg font-serif text-charcoal">{formatCurrencyDec(selectedLog.materialsCost)}</p>
                    </div>
                  </div>
                  {selectedLog.receiptUrl && (
                    <div className="bg-cream/50 border border-light-gray p-4">
                      <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-2">Receipt / Invoice</h3>
                      <a href={selectedLog.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1"><FileText size={12} /> View Receipt</a>
                    </div>
                  )}
                </div>
              )}

              {/* Photos Tab */}
              {drawerTab === "photos" && (
                <div className="space-y-4">
                  {selectedLog.beforePhotoUrl && (
                    <div className="bg-cream/50 border border-light-gray p-4">
                      <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-2">Before Photo</h3>
                      <img src={selectedLog.beforePhotoUrl} alt="Before" className="max-w-full h-auto border border-light-gray" />
                    </div>
                  )}
                  {selectedLog.afterPhotoUrl && (
                    <div className="bg-cream/50 border border-light-gray p-4">
                      <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-2">After Photo</h3>
                      <img src={selectedLog.afterPhotoUrl} alt="After" className="max-w-full h-auto border border-light-gray" />
                    </div>
                  )}
                  {!selectedLog.beforePhotoUrl && !selectedLog.afterPhotoUrl && (
                    <div className="bg-cream/50 border border-light-gray p-8 text-center">
                      <Camera size={24} className="mx-auto mb-2 text-warm-gray/50" />
                      <p className="text-xs text-warm-gray">No photos attached.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Activity Tab */}
              {drawerTab === "activity" && (
                <div className="space-y-3">
                  <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Activity Log</h3>
                  {selectedLog.activityLogs && selectedLog.activityLogs.length > 0 ? (
                    selectedLog.activityLogs.map(a => (
                      <div key={a.id} className="bg-cream/50 border border-light-gray p-3">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className="text-warm-gray bg-cream">{a.activityType}</Badge>
                          <span className="text-[10px] text-warm-gray">{formatDateTime(a.createdAt)}</span>
                        </div>
                        {a.note && <p className="text-xs text-charcoal">{a.note}</p>}
                        {a.oldValue && a.newValue && <p className="text-[10px] text-warm-gray">{a.oldValue} → {a.newValue}</p>}
                      </div>
                    ))
                  ) : (
                    <div className="bg-cream/50 border border-light-gray p-3">
                      <p className="text-xs text-charcoal flex items-center gap-1"><Clock size={12} className="text-warm-gray" /> Created {formatDateTime(selectedLog.createdAt)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ADD MAINTENANCE LOG DRAWER                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showAddLog && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddLog(false)} />
          <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-light-gray p-4 flex items-center justify-between z-10">
              <h2 className="font-serif text-lg text-charcoal">Add Maintenance Log</h2>
              <button onClick={() => setShowAddLog(false)} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Property *</label>
                <select value={newLog.propertyId} onChange={e => setNewLog(p => ({ ...p, propertyId: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                  <option value="">Select property...</option>
                  {listings.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Issue Title *</label>
                <input value={newLog.issueTitle} onChange={e => setNewLog(p => ({ ...p, issueTitle: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" placeholder="e.g., Kitchen faucet leaking" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Category</label>
                  <select value={newLog.category} onChange={e => setNewLog(p => ({ ...p, category: e.target.value, issueType: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Priority</label>
                  <select value={newLog.priority} onChange={e => setNewLog(p => ({ ...p, priority: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                    {PRIORITIES.map(p => <option key={p} value={p}>{statusLabel(p)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Description</label>
                <textarea value={newLog.description} onChange={e => setNewLog(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Status</label>
                  <select value={newLog.status} onChange={e => setNewLog(p => ({ ...p, status: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                    {STATUSES.filter(s => s !== "archived").map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Reported By</label>
                  <input value={newLog.reportedBy} onChange={e => setNewLog(p => ({ ...p, reportedBy: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Vendor / Assignee</label>
                <select value={newLog.vendorId} onChange={e => setNewLog(p => ({ ...p, vendorId: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                  <option value="">No vendor assigned</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.vendorName} ({v.vendorType})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Scheduled Date</label>
                  <input type="date" value={newLog.scheduledDate} onChange={e => setNewLog(p => ({ ...p, scheduledDate: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Due Date</label>
                  <input type="date" value={newLog.dueDate} onChange={e => setNewLog(p => ({ ...p, dueDate: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Estimated Cost ($)</label>
                <input type="number" min={0} step="0.01" value={newLog.estimatedCost} onChange={e => setNewLog(p => ({ ...p, estimatedCost: Number(e.target.value) }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Notes</label>
                <textarea value={newLog.notes} onChange={e => setNewLog(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 resize-none" />
              </div>
              <button onClick={addLog} disabled={saving || !newLog.issueTitle || !newLog.propertyId} className="w-full bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-3 disabled:opacity-50">
                {saving ? "Saving..." : "Add Maintenance Log"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ADD RECURRING TASK DRAWER                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showAddRecurring && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddRecurring(false)} />
          <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-light-gray p-4 flex items-center justify-between z-10">
              <h2 className="font-serif text-lg text-charcoal">Add Recurring Task</h2>
              <button onClick={() => setShowAddRecurring(false)} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Property *</label>
                <select value={newRecurring.propertyId} onChange={e => setNewRecurring(p => ({ ...p, propertyId: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                  <option value="">Select property...</option>
                  {listings.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Task Name *</label>
                <input value={newRecurring.taskName} onChange={e => setNewRecurring(p => ({ ...p, taskName: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" placeholder="e.g., HVAC Filter Replacement" />
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Quick Add</label>
                <div className="flex flex-wrap gap-1.5">
                  {["HVAC filter replacement", "Pest control", "Smoke detector check", "Smart lock battery", "Deep cleaning", "Lawn care", "Gutter cleaning", "Water heater service", "Appliance inspection", "Fire extinguisher check", "WiFi/router check", "Exterior lighting check"].map(t => (
                    <button key={t} onClick={() => setNewRecurring(p => ({ ...p, taskName: t }))} className={`text-[9px] px-2 py-1 border transition ${newRecurring.taskName === t ? "bg-charcoal text-white border-charcoal" : "border-light-gray text-charcoal hover:bg-cream"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Category</label>
                  <select value={newRecurring.category} onChange={e => setNewRecurring(p => ({ ...p, category: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Frequency</label>
                  <select value={newRecurring.frequency} onChange={e => setNewRecurring(p => ({ ...p, frequency: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                    {FREQUENCIES.map(f => <option key={f} value={f}>{statusLabel(f)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Next Due Date</label>
                <input type="date" value={newRecurring.nextDueDate} onChange={e => setNewRecurring(p => ({ ...p, nextDueDate: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Vendor</label>
                <select value={newRecurring.vendorId} onChange={e => setNewRecurring(p => ({ ...p, vendorId: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                  <option value="">No vendor</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.vendorName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Estimated Cost ($)</label>
                  <input type="number" min={0} step="0.01" value={newRecurring.estimatedCost} onChange={e => setNewRecurring(p => ({ ...p, estimatedCost: Number(e.target.value) }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Reminder (days before)</label>
                  <input type="number" min={0} value={newRecurring.reminderDaysBefore} onChange={e => setNewRecurring(p => ({ ...p, reminderDaysBefore: Number(e.target.value) }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-charcoal cursor-pointer">
                <input type="checkbox" checked={newRecurring.autoCreateEvent} onChange={e => setNewRecurring(p => ({ ...p, autoCreateEvent: e.target.checked }))} className="accent-charcoal" />
                Auto-create calendar event
              </label>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Notes</label>
                <textarea value={newRecurring.notes} onChange={e => setNewRecurring(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 resize-none" />
              </div>
              <button onClick={addRecurringTask} disabled={saving || !newRecurring.taskName || !newRecurring.propertyId} className="w-full bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-3 disabled:opacity-50">
                {saving ? "Saving..." : "Add Recurring Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ADD VENDOR MODAL                                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showAddVendor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddVendor(false)} />
          <div className="relative bg-white w-full max-w-lg mx-4 shadow-xl">
            <div className="border-b border-light-gray p-4 flex items-center justify-between">
              <h3 className="font-serif text-lg text-charcoal">Add Vendor</h3>
              <button onClick={() => setShowAddVendor(false)} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Vendor Name *</label>
                <input value={newVendor.vendorName} onChange={e => setNewVendor(p => ({ ...p, vendorName: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Vendor Type</label>
                <select value={newVendor.vendorType} onChange={e => setNewVendor(p => ({ ...p, vendorType: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none bg-white">
                  {VENDOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Contact Name</label>
                  <input value={newVendor.contactName} onChange={e => setNewVendor(p => ({ ...p, contactName: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Phone</label>
                  <input value={newVendor.phone} onChange={e => setNewVendor(p => ({ ...p, phone: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Email</label>
                  <input value={newVendor.email} onChange={e => setNewVendor(p => ({ ...p, email: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Website</label>
                  <input value={newVendor.website} onChange={e => setNewVendor(p => ({ ...p, website: e.target.value }))} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40" />
                </div>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Notes</label>
                <textarea value={newVendor.notes} onChange={e => setNewVendor(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 resize-none" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAddVendor(false)} className="text-[10px] tracking-[0.15em] uppercase text-charcoal border border-light-gray px-4 py-2.5 hover:bg-cream transition">Cancel</button>
                <button onClick={addVendorRecord} disabled={saving || !newVendor.vendorName} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 disabled:opacity-50">
                  {saving ? "Saving..." : "Add Vendor"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
