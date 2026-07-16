"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Plus, X, Check, Trash2, Clock, AlertTriangle, Calendar, Filter } from "lucide-react";

interface Listing {
  id: string;
  title: string;
}

interface Task {
  id: string;
  type: "Cleaning" | "Maintenance" | "Inventory" | "Other";
  property: string;
  description: string;
  dueDate: string;
  priority: "Low" | "Normal" | "High" | "Urgent";
  status: "Not Started" | "In Progress" | "Completed";
  assignedTo: string;
  createdAt: string;
}

const STORAGE_KEY = "avenue10-admin-tasks";
const TASK_TYPES = ["Cleaning", "Maintenance", "Inventory", "Other"] as const;
const PRIORITIES = ["Low", "Normal", "High", "Urgent"] as const;
const TAB_FILTERS = ["All", ...TASK_TYPES] as const;

const typeBadge: Record<string, string> = {
  Cleaning: "text-blue-600 bg-blue-50",
  Maintenance: "text-amber-600 bg-amber-50",
  Inventory: "text-accent bg-emerald-50",
  Other: "text-warm-gray bg-stone-100",
};

const priorityBadge: Record<string, string> = {
  Low: "text-warm-gray bg-stone-100",
  Normal: "text-blue-600 bg-blue-50",
  High: "text-amber-600 bg-amber-50",
  Urgent: "text-red-600 bg-red-50",
};

function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function scrollToContent(id: string) {
  // defer so the tab/filter state applies and content renders first
  setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "auto", block: "start" });
  }, 60);
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: "Cleaning" as Task["type"],
    property: "",
    description: "",
    dueDate: todayStr(),
    priority: "Normal" as Task["priority"],
    assignedTo: "",
  });

  useEffect(() => {
    setTasks(loadTasks());
    fetch("/api/admin/listings")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load listings");
        return r.json();
      })
      .then((data) => {
        const items = Array.isArray(data) ? data : data.listings ?? [];
        setListings(items.map((l: any) => ({ id: l.id, title: l.title })));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const updateTasks = useCallback((next: Task[]) => {
    setTasks(next);
    saveTasks(next);
  }, []);

  const today = todayStr();
  const todayCount = tasks.filter((t) => t.dueDate === today).length;
  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;
  const overdueCount = tasks.filter(
    (t) => t.dueDate < today && t.status !== "Completed"
  ).length;

  const filtered = tasks.filter((t) => {
    if (activeTab !== "All" && t.type !== activeTab) return false;
    if (statusFilter === "today") return t.dueDate === today;
    if (statusFilter === "completed") return t.status === "Completed";
    if (statusFilter === "in-progress") return t.status === "In Progress";
    if (statusFilter === "overdue") return t.dueDate < today && t.status !== "Completed";
    return true;
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) return;
    const task: Task = {
      id: typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(),
      ...form,
      status: "Not Started",
      createdAt: new Date().toISOString(),
    };
    updateTasks([task, ...tasks]);
    setForm({
      type: "Cleaning",
      property: "",
      description: "",
      dueDate: todayStr(),
      priority: "Normal",
      assignedTo: "",
    });
    setShowForm(false);
  }

  function completeTask(id: string) {
    updateTasks(tasks.map((t) => (t.id === id ? { ...t, status: "Completed" as const } : t)));
  }

  function deleteTask(id: string) {
    updateTasks(tasks.filter((t) => t.id !== id));
  }

  const inputCls =
    "w-full bg-transparent border border-light-gray text-charcoal text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 transition-colors";
  const labelCls =
    "text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-charcoal font-light">
          Tasks &amp; Cleaning
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5"
        >
          {showForm ? <X size={12} /> : <Plus size={12} />}
          {showForm ? "Close" : "Add Task"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Today's Tasks", value: todayCount, icon: Calendar, filter: "today" },
          { label: "Completed", value: completedCount, icon: Check, filter: "completed" },
          { label: "In Progress", value: inProgressCount, icon: Clock, filter: "in-progress" },
          { label: "Overdue", value: overdueCount, icon: AlertTriangle, filter: "overdue" },
        ].map((s) => (
          <div
            key={s.label}
            onClick={() => { setStatusFilter(statusFilter === s.filter ? "all" : s.filter); scrollToContent("admin-tab-content"); }}
            className={`bg-white border p-5 cursor-pointer transition-colors ${statusFilter === s.filter ? "border-charcoal" : "border-light-gray hover:border-warm-gray"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={labelCls}>{s.label}</span>
              <s.icon size={14} className="text-warm-gray" />
            </div>
            <p className="text-xl font-serif text-charcoal">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add Task Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-light-gray p-5 mb-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className={labelCls}>Type</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as Task["type"] })
                }
                className={inputCls + " mt-1"}
              >
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Property</label>
              <select
                value={form.property}
                onChange={(e) => setForm({ ...form, property: e.target.value })}
                className={inputCls + " mt-1"}
              >
                <option value="">Select property</option>
                {listings.map((l) => (
                  <option key={l.id} value={l.title}>{l.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Task description"
                className={inputCls + " mt-1"}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className={inputCls + " mt-1"}
              />
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priority: e.target.value as Task["priority"],
                  })
                }
                className={inputCls + " mt-1"}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Assigned To</label>
              <input
                type="text"
                value={form.assignedTo}
                onChange={(e) =>
                  setForm({ ...form, assignedTo: e.target.value })
                }
                placeholder="Name"
                className={inputCls + " mt-1"}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-2.5 flex items-center gap-1.5"
            >
              <Plus size={12} /> Add Task
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-light-gray text-charcoal text-xs hover:bg-cream transition px-3 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TAB_FILTERS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-[10px] tracking-[0.15em] uppercase font-medium transition rounded-full ${
              activeTab === tab
                ? "bg-charcoal text-white"
                : "bg-white text-warm-gray border border-light-gray hover:bg-cream"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Error / Loading */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 mb-4">
          {error}
        </div>
      )}
      {loading && (
        <p className="text-warm-gray text-xs mb-4">Loading listings...</p>
      )}

      {/* Task List */}
      <div id="admin-tab-content" className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white border border-light-gray p-8 text-center">
            <Sparkles size={20} className="mx-auto text-warm-gray mb-2" />
            <p className="text-warm-gray text-xs">No tasks found</p>
          </div>
        )}
        {filtered.map((task) => (
          <div
            key={task.id}
            className="bg-white border border-light-gray p-4 flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 ${typeBadge[task.type]}`}
                >
                  {task.type}
                </span>
                <span
                  className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 ${priorityBadge[task.priority]}`}
                >
                  {task.priority}
                </span>
                <span
                  className={`text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 ${
                    task.status === "Completed"
                      ? "text-accent bg-emerald-50"
                      : task.status === "In Progress"
                      ? "text-blue-600 bg-blue-50"
                      : "text-warm-gray bg-stone-100"
                  }`}
                >
                  {task.status}
                </span>
              </div>
              <p className="text-charcoal text-sm">{task.description}</p>
              <div className="flex flex-wrap gap-3 text-[10px] text-warm-gray">
                {task.property && <span>Property: {task.property}</span>}
                <span className="flex items-center gap-1">
                  <Calendar size={10} /> {formatDate(task.dueDate)}
                </span>
                {task.assignedTo && <span>Assigned: {task.assignedTo}</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {task.status !== "Completed" && (
                <button
                  onClick={() => completeTask(task.id)}
                  className="border border-light-gray text-charcoal text-xs hover:bg-cream transition px-3 py-2 flex items-center gap-1"
                >
                  <Check size={12} /> Complete
                </button>
              )}
              <button
                onClick={() => deleteTask(task.id)}
                className="border border-light-gray text-charcoal text-xs hover:bg-cream transition px-3 py-2 flex items-center gap-1"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
