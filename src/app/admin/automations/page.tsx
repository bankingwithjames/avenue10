"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Zap,
  Pause,
  Send,
  XCircle,
  FileText,
  Plug,
  Plus,
  Eye,
  Edit3,
  Trash2,
  X,
  Share2,
  RefreshCw,
  Clock,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { wrapEmailHtml, renderTemplateVars, SAMPLE_PREVIEW_VARS } from "@/lib/emailWrapper";
import { DataTable, DataTableColumn } from "@/components/admin/DataTable";
import { MessagingStatusBanner } from "@/components/admin/MessagingStatusBanner";
import { PersonalizationVariablesPanel } from "@/components/admin/PersonalizationVariables";
import SendCommunicationModal from "@/components/admin/SendCommunicationModal";

// ─── Types ──────────────────────────────────────────────────────────────

interface AutomationRecord {
  id: string;
  name: string;
  trigger: string;
  templateId: string | null;
  delay: string | null;
  isActive: boolean;
  conditions: string | null;
  sortOrder: number;
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

interface ActivityRecord {
  id: string;
  createdAt: string;
  guestName: string | null;
  automation: string | null;
  trigger: string | null;
  channel: string;
  to: string | null;
  subject: string | null;
  ok: boolean;
  error: string | null;
  provider: string | null;
}

interface MessagingStatus {
  emailConfigured: boolean;
  emailProvider: string | null;
  smsConfigured: boolean;
  smsProvider: string | null;
}

// ─── Constants ──────────────────────────────────────────────────────────

const TRIGGERS: { value: string; label: string; description: string }[] = [
  { value: "booking-confirmed", label: "Booking Confirmed", description: "When a booking is confirmed" },
  { value: "terms-unsigned", label: "Terms Unsigned", description: "If rental terms remain unsigned" },
  { value: "pre-arrival", label: "Pre-Arrival", description: "Before check-in" },
  { value: "access-unlocked", label: "Access Unlocked", description: "When the access window opens" },
  { value: "during-stay", label: "During Stay", description: "During the guest's stay" },
  { value: "checkout-day", label: "Checkout Day", description: "On checkout day" },
  { value: "post-checkout", label: "Post-Checkout", description: "After checkout" },
  { value: "win-back", label: "Win-Back", description: "Months after the last stay" },
];

const DELAY_OPTIONS: { value: string; label: string }[] = [
  { value: "0h", label: "Immediately" },
  { value: "15m", label: "15 minutes" },
  { value: "30m", label: "30 minutes" },
  { value: "1h", label: "1 hour" },
  { value: "2h", label: "2 hours" },
  { value: "4h", label: "4 hours" },
  { value: "6h", label: "6 hours" },
  { value: "12h", label: "12 hours" },
  { value: "24h", label: "24 hours" },
  { value: "48h", label: "48 hours" },
  { value: "72h", label: "3 days" },
  { value: "7d", label: "7 days" },
  { value: "14d", label: "14 days" },
  { value: "30d", label: "30 days" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
];

const TEMPLATE_CATEGORIES = [...TRIGGERS.map(t => t.value), "general"];

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, "");

const triggerDescription = (trigger: string) =>
  TRIGGERS.find(t => t.value === trigger)?.description || trigger;

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function scrollToContent(id: string) {
  // defer so the tab/filter state applies and content renders first
  setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "auto", block: "start" });
  }, 60);
}

// ─── Sub-Components ─────────────────────────────────────────────────────

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 ${className}`}>
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  onClick,
  active = false,
}: {
  label: string;
  value: string | number;
  icon: typeof Zap;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <div
      className={`bg-white border p-4 transition-colors ${active ? "border-charcoal" : "border-light-gray"}${onClick ? " hover:border-warm-gray cursor-pointer" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
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

function ChannelTabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-[9px] tracking-[0.15em] uppercase font-medium px-3 py-2 transition whitespace-nowrap ${
        active ? "bg-charcoal text-white" : "text-charcoal/60 hover:text-charcoal hover:bg-cream"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Delivery Monitoring (BCC) Card ─────────────────────────────────────

const EMAIL_RE = /\S+@\S+\.\S+/;

function DeliveryMonitoringCard() {
  const [input, setInput] = useState("");
  const [rowId, setRowId] = useState<string | null>(null);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/personalization-vars");
        if (!res.ok) return;
        const vars = await res.json();
        if (Array.isArray(vars)) {
          const row = vars.find((v: { key: string }) => v.key === "bccMonitorEmail");
          if (row) {
            setRowId(row.id);
            setSavedEmail(row.value);
            setInput(row.value);
          }
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const save = async () => {
    const value = input.trim();
    setError(null);

    if (!value) {
      // Clear monitoring
      if (rowId) {
        setSaving(true);
        try {
          const res = await fetch(`/api/admin/personalization-vars?id=${encodeURIComponent(rowId)}`, { method: "DELETE" });
          if (res.ok) {
            setRowId(null);
            setSavedEmail(null);
          }
        } catch { /* ignore */ }
        setSaving(false);
      }
      return;
    }

    if (!EMAIL_RE.test(value)) {
      setError("Enter a valid email address.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/personalization-vars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "bccMonitorEmail",
          value,
          description: "Delivery monitor — BCC'd on every outgoing email",
        }),
      });
      if (res.ok) {
        const row = await res.json();
        setRowId(row.id);
        setSavedEmail(value);
      } else {
        setError("Could not save. Try again.");
      }
    } catch {
      setError("Could not save. Try again.");
    }
    setSaving(false);
  };

  return (
    <div className="bg-white border border-light-gray p-6">
      <div className="flex items-center gap-2 mb-4">
        <Eye size={14} className="text-warm-gray" />
        <h2 className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium">Delivery Monitoring</h2>
      </div>
      <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">
        Monitor inbox (BCC on every email)
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          value={input}
          onChange={e => { setInput(e.target.value); setError(null); }}
          placeholder="monitor@yourdomain.com"
          className="flex-1 min-w-[220px] max-w-sm border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40"
        />
        <button
          onClick={save}
          disabled={saving}
          className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {error && <p className="text-[10px] text-red-600 mt-1.5">{error}</p>}
      <p className="text-[10px] text-warm-gray mt-2">
        This address is BCC&apos;d on every automation and campaign email so you can verify delivery.
      </p>
      {savedEmail && (
        <p className="text-[10px] text-emerald-600 font-medium mt-2">
          Monitoring active — {savedEmail}
        </p>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

type MainTab = "automations" | "activity" | "templates" | "variables" | "settings";

const EMPTY_AUTOMATION_FORM = { name: "", trigger: "booking-confirmed", delay: "0h", templateId: "", isActive: true };
const EMPTY_TEMPLATE_FORM = { name: "", type: "email", category: "general", subject: "", body: "" };

type ChannelTab = "email" | "sms" | "social";

export default function AutomationCenterPage() {
  const [mainTab, setMainTab] = useState<MainTab>("automations");
  const [channelTab, setChannelTab] = useState<ChannelTab>("email");

  // Data
  const [automations, setAutomations] = useState<AutomationRecord[]>([]);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [activity, setActivity] = useState<ActivityRecord[]>([]);
  const [messagingStatus, setMessagingStatus] = useState<MessagingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingActivity, setRefreshingActivity] = useState(false);

  // Automation editor
  const [showAutomationEditor, setShowAutomationEditor] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<AutomationRecord | null>(null);
  const [automationForm, setAutomationForm] = useState(EMPTY_AUTOMATION_FORM);

  // Template editor + preview
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateRecord | null>(null);
  const [templateForm, setTemplateForm] = useState(EMPTY_TEMPLATE_FORM);
  const [previewTemplate, setPreviewTemplate] = useState<{ name: string; type: string; subject: string; body: string } | null>(null);

  const [saving, setSaving] = useState(false);
  const [sendCommModalOpen, setSendCommModalOpen] = useState(false);

  // ── Data Fetching ──
  const fetchAll = useCallback(async () => {
    const results = await Promise.allSettled([
      fetch("/api/admin/automations").then(r => (r.ok ? r.json() : Promise.reject())),
      fetch("/api/admin/templates").then(r => (r.ok ? r.json() : Promise.reject())),
      fetch("/api/admin/messaging-activity?limit=200").then(r => (r.ok ? r.json() : Promise.reject())),
      fetch("/api/admin/messaging-status").then(r => (r.ok ? r.json() : Promise.reject())),
    ]);

    if (results[0].status === "fulfilled") setAutomations(Array.isArray(results[0].value) ? results[0].value : []);
    if (results[1].status === "fulfilled") setTemplates(Array.isArray(results[1].value) ? results[1].value : []);
    if (results[2].status === "fulfilled") setActivity(Array.isArray(results[2].value) ? results[2].value : []);
    if (results[3].status === "fulfilled") setMessagingStatus(results[3].value);

    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refreshActivity = async () => {
    setRefreshingActivity(true);
    try {
      const res = await fetch("/api/admin/messaging-activity?limit=200");
      if (res.ok) {
        const data = await res.json();
        setActivity(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
    setRefreshingActivity(false);
  };

  // ── Stats ──
  const stats = useMemo(() => ({
    active: automations.filter(a => a.isActive).length,
    paused: automations.filter(a => !a.isActive).length,
    sent: activity.filter(a => a.ok).length,
    failed: activity.filter(a => !a.ok).length,
    templates: templates.length,
  }), [automations, activity, templates]);

  const messagingConnected = !!messagingStatus && (messagingStatus.emailConfigured || messagingStatus.smsConfigured);

  // Channel of an automation is derived from its assigned template:
  // sms template → SMS; anything else (incl. default message) → Email.
  const automationChannel = useCallback(
    (auto: AutomationRecord): "email" | "sms" => {
      if (auto.templateId) {
        const t = templates.find(tpl => tpl.id === auto.templateId);
        if (t?.type === "sms") return "sms";
      }
      return "email";
    },
    [templates]
  );

  const channelAutomations = useMemo(
    () => automations.filter(a => automationChannel(a) === channelTab),
    [automations, automationChannel, channelTab]
  );

  // ── Automation CRUD ──
  const updateAutomation = async (id: string, data: Partial<AutomationRecord>) => {
    try {
      await fetch(`/api/admin/automations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await fetchAll();
    } catch { /* ignore */ }
  };

  const deleteAutomation = async (auto: AutomationRecord) => {
    if (!window.confirm(`Delete "${auto.name}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/admin/automations/${auto.id}`, { method: "DELETE" });
      await fetchAll();
    } catch { /* ignore */ }
  };

  const openAutomationEdit = (auto: AutomationRecord) => {
    setEditingAutomation(auto);
    setAutomationForm({
      name: auto.name,
      trigger: auto.trigger,
      delay: auto.delay || "0h",
      templateId: auto.templateId || "",
      isActive: auto.isActive,
    });
    setShowAutomationEditor(true);
  };

  const openAutomationNew = () => {
    setEditingAutomation(null);
    setAutomationForm(EMPTY_AUTOMATION_FORM);
    setShowAutomationEditor(true);
  };

  const saveAutomation = async () => {
    if (!automationForm.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: automationForm.name,
        trigger: automationForm.trigger,
        delay: automationForm.delay,
        templateId: automationForm.templateId || null,
        isActive: automationForm.isActive,
      };
      let res: Response;
      if (editingAutomation) {
        res = await fetch(`/api/admin/automations/${editingAutomation.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const maxOrder = automations.reduce((m, a) => Math.max(m, a.sortOrder), -1);
        res = await fetch("/api/admin/automations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, sortOrder: maxOrder + 1 }),
        });
      }
      if (res.ok) {
        setShowAutomationEditor(false);
        setEditingAutomation(null);
        setAutomationForm(EMPTY_AUTOMATION_FORM);
        await fetchAll();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  // ── Template CRUD ──
  const openTemplateEdit = (t: TemplateRecord) => {
    setEditingTemplate(t);
    setTemplateForm({ name: t.name, type: t.type, category: t.category, subject: t.subject || "", body: t.body });
    setShowTemplateEditor(true);
  };

  const openTemplateNew = () => {
    setEditingTemplate(null);
    setTemplateForm(EMPTY_TEMPLATE_FORM);
    setShowTemplateEditor(true);
  };

  const saveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.body.trim()) return;
    setSaving(true);
    try {
      const url = editingTemplate ? `/api/admin/templates/${editingTemplate.id}` : "/api/admin/templates";
      const method = editingTemplate ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateForm),
      });
      if (res.ok) {
        setShowTemplateEditor(false);
        setEditingTemplate(null);
        setTemplateForm(EMPTY_TEMPLATE_FORM);
        await fetchAll();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const openTemplatePreview = (t: { name: string; type: string; subject: string | null; body: string }) => {
    setPreviewTemplate({ name: t.name, type: t.type, subject: t.subject || "", body: t.body });
  };

  // ── Tab switch helper for stat tiles ──
  const goToTab = (tab: MainTab) => {
    setMainTab(tab);
    scrollToContent("admin-tab-content");
  };

  // ── Automation Table Columns ──
  const automationColumns: DataTableColumn<AutomationRecord>[] = [
    {
      key: "order",
      label: "Order",
      accessor: a => a.sortOrder,
      className: "w-14",
      render: a => (
        <div className="w-6 h-6 bg-cream border border-light-gray flex items-center justify-center text-[10px] font-medium text-warm-gray">
          {a.sortOrder + 1}
        </div>
      ),
    },
    {
      key: "rule",
      label: "Rule",
      accessor: a => a.name,
      render: a => (
        <div className="min-w-0 max-w-xs">
          <p className="text-sm font-medium text-charcoal truncate">{a.name}</p>
          <p className="text-[10px] text-warm-gray truncate">{triggerDescription(a.trigger)}</p>
        </div>
      ),
    },
    {
      key: "trigger",
      label: "Trigger",
      accessor: a => a.trigger,
      render: a => (
        <Badge className="text-warm-gray bg-cream whitespace-nowrap">
          {TRIGGERS.find(t => t.value === a.trigger)?.label || a.trigger}
        </Badge>
      ),
    },
    {
      key: "delay",
      label: "Delay",
      accessor: a => a.delay || "0h",
      render: a => (
        <select
          value={a.delay || "0h"}
          onClick={e => e.stopPropagation()}
          onChange={e => updateAutomation(a.id, { delay: e.target.value })}
          className="text-[10px] border border-light-gray bg-cream text-charcoal px-2 py-1.5 outline-none focus:border-charcoal/40 cursor-pointer max-w-full"
          title="Send delay"
        >
          {DELAY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ),
    },
    {
      key: "template",
      label: "Template",
      accessor: a => (a.templateId && templates.find(t => t.id === a.templateId)?.name) || "Default message",
      render: a => {
        const activeTemplates = templates.filter(t => t.isActive);
        const matching = activeTemplates.filter(t => t.category === a.trigger);
        const others = activeTemplates.filter(t => t.category !== a.trigger);
        return (
          <select
            value={a.templateId || ""}
            onClick={e => e.stopPropagation()}
            onChange={e => updateAutomation(a.id, { templateId: (e.target.value || null) as string | null })}
            className="text-[10px] border border-light-gray bg-cream text-charcoal px-2 py-1.5 outline-none focus:border-charcoal/40 cursor-pointer max-w-[220px] truncate"
            title="Message template"
          >
            <option value="">Default message</option>
            {matching.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
            {others.length > 0 && (
              <optgroup label="— Other templates —">
                {others.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </optgroup>
            )}
          </select>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      accessor: a => (a.isActive ? "Active" : "Paused"),
      render: a => (
        <button
          onClick={e => { e.stopPropagation(); updateAutomation(a.id, { isActive: !a.isActive }); }}
          title={a.isActive ? "Active — click to pause" : "Paused — click to activate"}
          className={`w-10 h-5 rounded-full transition relative shrink-0 ${a.isActive ? "bg-emerald-500" : "bg-gray-300"}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${a.isActive ? "left-5" : "left-0.5"}`} />
        </button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      className: "text-right",
      headerClassName: "text-right",
      render: a => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={e => { e.stopPropagation(); openAutomationEdit(a); }} title="Edit" className="text-charcoal hover:bg-cream p-1.5 transition"><Edit3 size={13} /></button>
          <button onClick={e => { e.stopPropagation(); deleteAutomation(a); }} title="Delete" className="text-warm-gray hover:text-red-600 hover:bg-red-50 p-1.5 transition"><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  // ── Activity Table Columns ──
  const activityColumns: DataTableColumn<ActivityRecord>[] = [
    {
      key: "time",
      label: "Time",
      accessor: a => new Date(a.createdAt).getTime(),
      className: "text-warm-gray whitespace-nowrap",
      render: a => formatDateTime(a.createdAt),
    },
    {
      key: "automation",
      label: "Automation / Campaign",
      accessor: a => `${a.automation || ""} ${a.trigger || ""}`,
      render: a => (
        <div className="min-w-0">
          <p className="text-xs font-medium text-charcoal truncate">{a.automation || "—"}</p>
          {a.trigger && <p className="text-[10px] text-warm-gray">{a.trigger}</p>}
        </div>
      ),
    },
    {
      key: "channel",
      label: "Channel",
      accessor: a => a.channel,
      render: a => (
        <Badge className={a.channel === "sms" ? "text-blue-700 bg-blue-50" : "text-warm-gray bg-cream"}>
          {a.channel}
        </Badge>
      ),
    },
    {
      key: "recipient",
      label: "Recipient",
      accessor: a => `${a.to || ""} ${a.guestName || ""}`,
      render: a => (
        <div className="min-w-0">
          <p className="text-xs text-charcoal truncate">{a.to || "—"}</p>
          {a.guestName && <p className="text-[10px] text-warm-gray truncate">{a.guestName}</p>}
        </div>
      ),
    },
    {
      key: "subject",
      label: "Subject",
      accessor: a => a.subject || "",
      responsiveClass: "hidden lg:table-cell",
      render: a => <span className="text-xs text-warm-gray truncate block max-w-xs">{a.subject || "—"}</span>,
    },
    {
      key: "status",
      label: "Status",
      accessor: a => (a.ok ? "Sent" : "Failed"),
      render: a =>
        a.ok ? (
          <Badge className="text-emerald-700 bg-emerald-50">Sent</Badge>
        ) : (
          <span title={a.error || "Send failed"}>
            <Badge className="text-red-700 bg-red-50">Failed</Badge>
          </span>
        ),
    },
    {
      key: "provider",
      label: "Provider",
      accessor: a => a.provider || "",
      responsiveClass: "hidden md:table-cell",
      className: "text-warm-gray",
      render: a => a.provider || "—",
    },
  ];

  // ── Template Table Columns ──
  const templateColumns: DataTableColumn<TemplateRecord>[] = [
    {
      key: "name",
      label: "Name",
      accessor: t => t.name,
      render: t => <span className="text-sm font-medium text-charcoal">{t.name}</span>,
    },
    {
      key: "type",
      label: "Type",
      accessor: t => t.type,
      render: t => <Badge className="text-warm-gray bg-cream">{t.type}</Badge>,
    },
    {
      key: "category",
      label: "Event",
      accessor: t => t.category,
      responsiveClass: "hidden md:table-cell",
      render: t => <Badge className="text-warm-gray bg-cream">{t.category}</Badge>,
    },
    {
      key: "subject",
      label: "Subject / Content",
      accessor: t => `${t.subject || ""} ${stripHtml(t.body)}`,
      render: t => (
        <div className="min-w-0 max-w-md">
          {t.subject && <p className="text-xs text-charcoal truncate">{t.subject}</p>}
          <p className="text-xs text-warm-gray truncate">{stripHtml(t.body).slice(0, 110)}</p>
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      className: "text-right",
      headerClassName: "text-right",
      render: t => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={e => { e.stopPropagation(); openTemplatePreview(t); }} title="Preview" className="text-charcoal hover:bg-cream p-1.5 transition"><Eye size={13} /></button>
          <button onClick={e => { e.stopPropagation(); openTemplateEdit(t); }} title="Edit" className="text-charcoal hover:bg-cream p-1.5 transition"><Edit3 size={13} /></button>
        </div>
      ),
    },
  ];

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-warm-gray text-sm">Loading...</p>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="relative">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl text-charcoal font-light">Automation Center</h1>
          <p className="text-xs text-warm-gray mt-1">Automated guest messaging — rules, templates, and delivery activity.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={() => setSendCommModalOpen(true)} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5">
            <Send size={12} /> Send Communication
          </button>
          <button onClick={openAutomationNew} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5">
            <Plus size={12} /> New Automation
          </button>
        </div>
      </div>

      {/* ─── Stat Tiles ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        <StatCard label="Active Automations" value={stats.active} icon={Zap} active={mainTab === "automations"} onClick={() => goToTab("automations")} />
        <StatCard label="Paused" value={stats.paused} icon={Pause} active={mainTab === "automations"} onClick={() => goToTab("automations")} />
        <StatCard label="Messages Sent" value={stats.sent} icon={Send} active={mainTab === "activity"} onClick={() => goToTab("activity")} />
        <StatCard label="Failed" value={stats.failed} icon={XCircle} active={mainTab === "activity"} onClick={() => goToTab("activity")} />
        <StatCard label="Templates" value={stats.templates} icon={FileText} active={mainTab === "templates"} onClick={() => goToTab("templates")} />
        <div
          className={`bg-white border p-4 transition-colors hover:border-warm-gray cursor-pointer ${mainTab === "settings" ? "border-charcoal" : "border-light-gray"}`}
          onClick={() => goToTab("settings")}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goToTab("settings"); } }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Email / SMS</span>
            <Plug size={14} className="text-warm-gray" />
          </div>
          <p className={`text-sm font-medium ${messagingConnected ? "text-emerald-600" : "text-amber-600"}`}>
            {messagingConnected ? "Connected" : "Setup needed"}
          </p>
        </div>
      </div>

      {/* ─── Main Tabs ───────────────────────────────────────────────── */}
      <div id="admin-tab-content" className="flex items-center border border-light-gray bg-white mb-6 overflow-x-auto">
        <TabButton active={mainTab === "automations"} onClick={() => setMainTab("automations")}>
          <span className="flex items-center gap-1.5"><Zap size={12} /> Automations</span>
        </TabButton>
        <TabButton active={mainTab === "activity"} onClick={() => setMainTab("activity")}>
          <span className="flex items-center gap-1.5"><Clock size={12} /> Activity Log</span>
        </TabButton>
        <TabButton active={mainTab === "templates"} onClick={() => setMainTab("templates")}>
          <span className="flex items-center gap-1.5"><FileText size={12} /> Templates</span>
        </TabButton>
        <TabButton active={mainTab === "variables"} onClick={() => setMainTab("variables")}>
          <span className="flex items-center gap-1.5"><Edit3 size={12} /> Variables</span>
        </TabButton>
        <TabButton active={mainTab === "settings"} onClick={() => setMainTab("settings")}>
          <span className="flex items-center gap-1.5"><Plug size={12} /> Settings</span>
        </TabButton>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* AUTOMATIONS TAB                                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "automations" && (
        <>
          {/* Channel sub-tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="inline-flex items-center border border-light-gray bg-white">
              <ChannelTabButton active={channelTab === "email"} onClick={() => setChannelTab("email")}>Email</ChannelTabButton>
              <ChannelTabButton active={channelTab === "sms"} onClick={() => setChannelTab("sms")}>SMS</ChannelTabButton>
              <ChannelTabButton active={channelTab === "social"} onClick={() => setChannelTab("social")}>Social Media</ChannelTabButton>
            </div>
            {channelTab !== "social" && (
              <p className="text-xs text-warm-gray">{channelAutomations.length} automation rules</p>
            )}
          </div>

          {channelTab === "social" ? (
            <div className="bg-white border border-light-gray p-12 text-center">
              <Share2 size={24} className="mx-auto mb-3 text-warm-gray/50" />
              <p className="text-sm text-charcoal mb-1">Social media automations coming soon</p>
              <p className="text-xs text-warm-gray mb-4">Connect social platforms in Integrations to automate posting and guest messaging.</p>
              <Link
                href="/admin/integrations"
                className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase font-medium text-charcoal border border-light-gray px-3 py-2 hover:bg-cream transition"
              >
                <ExternalLink size={11} /> Go to Integrations
              </Link>
            </div>
          ) : automations.length === 0 ? (
            <div className="bg-white border border-light-gray p-12 text-center">
              <Zap size={24} className="mx-auto mb-3 text-warm-gray/50" />
              <p className="text-sm text-charcoal mb-1">No automations yet</p>
              <p className="text-xs text-warm-gray mb-4">Create automated messages triggered by the guest journey — booking, arrival, checkout, and beyond.</p>
              <button onClick={openAutomationNew} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5">Create First Automation</button>
            </div>
          ) : (
            <DataTable
              columns={automationColumns}
              rows={channelAutomations}
              rowKey={a => a.id}
              searchPlaceholder="Search automations..."
              defaultPageSize={25}
              defaultSort={{ key: "order", dir: "asc" }}
              emptyMessage={channelTab === "sms"
                ? "No SMS automations. Assign an SMS template to an automation to see it here."
                : "No email automations."}
              filters={[
                {
                  key: "trigger",
                  label: "Trigger",
                  options: TRIGGERS.map(t => ({ value: t.value, label: t.label })),
                  match: (a, v) => a.trigger === v,
                },
                {
                  key: "status",
                  label: "Status",
                  options: [
                    { value: "active", label: "Active" },
                    { value: "paused", label: "Paused" },
                  ],
                  match: (a, v) => (v === "active" ? a.isActive : !a.isActive),
                },
              ]}
            />
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ACTIVITY LOG TAB                                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "activity" && (
        <DataTable
          columns={activityColumns}
          rows={activity}
          rowKey={a => a.id}
          searchPlaceholder="Search by recipient, automation, subject..."
          defaultPageSize={25}
          defaultSort={{ key: "time", dir: "desc" }}
          emptyMessage="No message activity yet. Sends from the automation and campaign engines will appear here."
          filters={[
            {
              key: "channel",
              label: "Channel",
              options: [
                { value: "email", label: "Email" },
                { value: "sms", label: "SMS" },
              ],
              match: (a, v) => a.channel === v,
            },
            {
              key: "status",
              label: "Status",
              options: [
                { value: "sent", label: "Sent" },
                { value: "failed", label: "Failed" },
              ],
              match: (a, v) => (v === "sent" ? a.ok : !a.ok),
            },
          ]}
          toolbar={
            <button
              onClick={refreshActivity}
              disabled={refreshingActivity}
              className="border border-light-gray bg-white text-charcoal text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw size={11} className={refreshingActivity ? "animate-spin" : ""} />
              {refreshingActivity ? "Refreshing..." : "Refresh"}
            </button>
          }
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TEMPLATES TAB                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "templates" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <p className="text-xs text-warm-gray">{templates.length} templates</p>
            <button onClick={openTemplateNew} className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5">
              <Plus size={12} /> New Template
            </button>
          </div>

          <DataTable
            columns={templateColumns}
            rows={templates}
            rowKey={t => t.id}
            searchPlaceholder="Search templates by name, subject, or content..."
            defaultPageSize={25}
            defaultSort={{ key: "name", dir: "asc" }}
            emptyMessage="No templates yet. Create reusable email and SMS templates for your automations."
            onRowClick={t => openTemplatePreview(t)}
            filters={[
              {
                key: "type",
                label: "Type",
                options: [
                  { value: "email", label: "Email" },
                  { value: "sms", label: "SMS" },
                ],
                match: (t, v) => t.type === v,
              },
              {
                key: "category",
                label: "Event",
                options: [...new Set(templates.map(t => t.category))].sort().map(c => ({
                  value: c,
                  label: c.replace(/-/g, " ").replace(/\b\w/g, ch => ch.toUpperCase()),
                })),
                match: (t, v) => t.category === v,
              },
            ]}
          />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* VARIABLES TAB                                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "variables" && <PersonalizationVariablesPanel />}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SETTINGS TAB                                                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {mainTab === "settings" && (
        <div className="space-y-4">
          <MessagingStatusBanner />

          <DeliveryMonitoringCard />

          <div className="bg-white border border-light-gray p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={14} className="text-warm-gray" />
              <h2 className="text-[10px] tracking-[0.15em] uppercase text-warm-gray font-medium">How the Engine Works</h2>
            </div>
            <div className="space-y-3 text-xs text-charcoal leading-relaxed">
              <p>
                The automation engine runs on a daily cron at 9:00 AM Central, and can be run on demand with
                the Run Now button above. Each run evaluates every active automation against upcoming and past
                reservations and sends any messages that are due.
              </p>
              <p>
                Sends are idempotent — each guest receives a given automation message at most once per
                reservation, so repeated runs never produce duplicates.
              </p>
              <p>
                Consent rules apply to every send: guests marked do-not-contact are always excluded, and
                marketing messages (like win-back offers) require an explicit marketing opt-in.
              </p>
            </div>
            <Link
              href="/admin/integrations"
              className="inline-flex items-center gap-1.5 mt-4 text-[10px] tracking-[0.15em] uppercase font-medium text-charcoal border border-light-gray px-3 py-2 hover:bg-cream transition"
            >
              <ExternalLink size={11} /> Configure Providers in Integrations
            </Link>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* AUTOMATION EDITOR DRAWER                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showAutomationEditor && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAutomationEditor(false)} />
          <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-light-gray p-4 flex items-center justify-between z-10">
              <h2 className="font-serif text-lg text-charcoal">{editingAutomation ? "Edit Automation" : "New Automation"}</h2>
              <button onClick={() => setShowAutomationEditor(false)} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Name *</label>
                <input
                  value={automationForm.name}
                  onChange={e => setAutomationForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Check-in instructions"
                  className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40"
                />
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Trigger</label>
                <select
                  value={automationForm.trigger}
                  onChange={e => setAutomationForm(p => ({ ...p, trigger: e.target.value }))}
                  className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 bg-white"
                >
                  {TRIGGERS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-warm-gray mt-1">{triggerDescription(automationForm.trigger)}</p>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Delay</label>
                <select
                  value={automationForm.delay}
                  onChange={e => setAutomationForm(p => ({ ...p, delay: e.target.value }))}
                  className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 bg-white"
                >
                  {DELAY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Template</label>
                {(() => {
                  const activeTemplates = templates.filter(t => t.isActive);
                  const matching = activeTemplates.filter(t => t.category === automationForm.trigger);
                  const others = activeTemplates.filter(t => t.category !== automationForm.trigger);
                  return (
                    <select
                      value={automationForm.templateId}
                      onChange={e => setAutomationForm(p => ({ ...p, templateId: e.target.value }))}
                      className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 bg-white"
                    >
                      <option value="">Default message</option>
                      {matching.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                      {others.length > 0 && (
                        <optgroup label="— Other templates —">
                          {others.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  );
                })()}
              </div>
              <div className="flex items-center justify-between border border-light-gray p-3">
                <div>
                  <p className="text-xs font-medium text-charcoal">Active</p>
                  <p className="text-[10px] text-warm-gray">Paused automations never send.</p>
                </div>
                <button
                  onClick={() => setAutomationForm(p => ({ ...p, isActive: !p.isActive }))}
                  className={`w-10 h-5 rounded-full transition relative shrink-0 ${automationForm.isActive ? "bg-emerald-500" : "bg-gray-300"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${automationForm.isActive ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
              <button
                onClick={saveAutomation}
                disabled={saving || !automationForm.name.trim()}
                className="w-full bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-3 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingAutomation ? "Save Changes" : "Create Automation"}
              </button>
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
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Name *</label>
                <input
                  value={templateForm.name}
                  onChange={e => setTemplateForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Type</label>
                  <select
                    value={templateForm.type}
                    onChange={e => setTemplateForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 bg-white"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Event</label>
                  <select
                    value={templateForm.category}
                    onChange={e => setTemplateForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 bg-white"
                  >
                    {TEMPLATE_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c.replace(/-/g, " ").replace(/\b\w/g, ch => ch.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
              </div>
              {templateForm.type === "email" && (
                <div>
                  <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Subject</label>
                  <input
                    value={templateForm.subject}
                    onChange={e => setTemplateForm(p => ({ ...p, subject: e.target.value }))}
                    className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40"
                  />
                </div>
              )}
              <div>
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Body *</label>
                <textarea
                  value={templateForm.body}
                  onChange={e => setTemplateForm(p => ({ ...p, body: e.target.value }))}
                  rows={12}
                  placeholder="Use {{guestName}}, {{propertyName}}, {{checkIn}} and other variables — see the Variables tab."
                  className="w-full border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openTemplatePreview({ name: templateForm.name || "Untitled", type: templateForm.type, subject: templateForm.subject, body: templateForm.body })}
                  disabled={!templateForm.body.trim()}
                  className="flex-1 border border-light-gray text-charcoal text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition px-4 py-3 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Eye size={12} /> Preview
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={saving || !templateForm.name.trim() || !templateForm.body.trim()}
                  className="flex-1 bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-3 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingTemplate ? "Save Changes" : "Create Template"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TEMPLATE PREVIEW MODAL                                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {previewTemplate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPreviewTemplate(null)} />
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-light-gray">
            <div className="sticky top-0 bg-white border-b border-light-gray p-4 flex items-center justify-between z-10">
              <div>
                <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">{previewTemplate.type === "sms" ? "SMS Preview" : "Email Preview"}</p>
                <h2 className="font-serif text-lg text-charcoal">{previewTemplate.name}</h2>
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
            </div>
            <div className="p-4">
              {previewTemplate.type === "sms" ? (
                <div className="border border-light-gray rounded-3xl p-4 max-w-sm mx-auto bg-white">
                  <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium text-center mb-3">Avenue10</p>
                  <div className="max-w-[280px] rounded-2xl bg-gray-200 text-charcoal text-sm p-3 whitespace-pre-wrap">
                    {stripHtml(renderTemplateVars(previewTemplate.body, SAMPLE_PREVIEW_VARS))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">Subject</p>
                    <p className="text-sm text-charcoal">{renderTemplateVars(previewTemplate.subject || "", SAMPLE_PREVIEW_VARS) || <span className="text-warm-gray">(no subject)</span>}</p>
                  </div>
                  <iframe
                    title="Email preview"
                    sandbox=""
                    srcDoc={wrapEmailHtml(renderTemplateVars(previewTemplate.body, SAMPLE_PREVIEW_VARS))}
                    className="w-full bg-white border border-light-gray h-[520px]"
                  />
                </>
              )}
              <p className="text-[10px] text-warm-gray mt-3">Preview uses sample guest data. Personalization variables fill in automatically at send time.</p>
            </div>
          </div>
        </div>
      )}

      {/* Send Communication Modal */}
      <SendCommunicationModal
        open={sendCommModalOpen}
        onClose={() => setSendCommModalOpen(false)}
        templates={templates}
      />
    </div>
  );
}
