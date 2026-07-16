"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Check, Edit3, Trash2 } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────

interface PersonalizationVar {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

const KEY_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*$/;

const BUILT_IN_VARS: { token: string; description: string }[] = [
  { token: "{{firstName}}", description: "Guest first name" },
  { token: "{{lastName}}", description: "Guest last name" },
  { token: "{{fullName}}", description: "Guest full name" },
  { token: "{{guestName}}", description: "Guest full name" },
  { token: "{{guestEmail}}", description: "Guest email address" },
  { token: "{{guestPhone}}", description: "Guest phone number" },
  { token: "{{propertyName}}", description: "Listing title" },
  { token: "{{listingTitle}}", description: "Listing title" },
  { token: "{{checkIn}}", description: "Check-in date (formatted)" },
  { token: "{{checkOut}}", description: "Check-out date (formatted)" },
  { token: "{{nights}}", description: "Number of nights" },
  { token: "{{guestCount}}", description: "Number of guests" },
  { token: "{{totalPrice}}", description: "Reservation total" },
  { token: "{{confirmationCode}}", description: "Booking confirmation code" },
  { token: "{{portalLink}}", description: "Guest portal URL" },
  { token: "{{accessCode}}", description: "Portal access code" },
  { token: "{{website}}", description: "Company website URL" },
  { token: "{{companyName}}", description: "Company name" },
  { token: "{{today}}", description: "Today's date" },
];

// ─── Component ──────────────────────────────────────────────────────────

export function PersonalizationVariablesPanel() {
  const [vars, setVars] = useState<PersonalizationVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ key: "", value: "", description: "" });
  const [addError, setAddError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit-in-place
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ key: "", value: "", description: "" });
  const [editError, setEditError] = useState<string | null>(null);

  const fetchVars = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/personalization-vars");
      if (r.ok) {
        const data = await r.json();
        setVars(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchVars(); }, [fetchVars]);

  const copyToken = (token: string) => {
    try {
      navigator.clipboard.writeText(token);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(prev => (prev === token ? null : prev)), 1200);
    } catch { /* ignore */ }
  };

  const addVar = async () => {
    const key = addForm.key.trim();
    if (!KEY_REGEX.test(key)) {
      setAddError("Key must start with a letter and contain only letters, numbers, and underscores.");
      return;
    }
    if (!addForm.value.trim()) {
      setAddError("Value is required.");
      return;
    }
    setAddError(null);
    setSaving(true);
    try {
      const r = await fetch("/api/admin/personalization-vars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: addForm.value, description: addForm.description || undefined }),
      });
      if (r.ok) {
        setAddForm({ key: "", value: "", description: "" });
        setShowAdd(false);
        await fetchVars();
      } else {
        const data = await r.json().catch(() => null);
        setAddError(data?.error || "Failed to save variable.");
      }
    } catch {
      setAddError("Failed to save variable.");
    }
    setSaving(false);
  };

  const startEdit = (v: PersonalizationVar) => {
    setEditingId(v.id);
    setEditForm({ key: v.key, value: v.value, description: v.description || "" });
    setEditError(null);
  };

  const saveEdit = async (id: string) => {
    const key = editForm.key.trim();
    if (!KEY_REGEX.test(key)) {
      setEditError("Key must start with a letter and contain only letters, numbers, and underscores.");
      return;
    }
    if (!editForm.value.trim()) {
      setEditError("Value is required.");
      return;
    }
    setEditError(null);
    setSaving(true);
    try {
      const r = await fetch("/api/admin/personalization-vars", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, key, value: editForm.value, description: editForm.description || null }),
      });
      if (r.ok) {
        setEditingId(null);
        await fetchVars();
      } else {
        const data = await r.json().catch(() => null);
        setEditError(data?.error || "Failed to update variable.");
      }
    } catch {
      setEditError("Failed to update variable.");
    }
    setSaving(false);
  };

  const deleteVar = async (v: PersonalizationVar) => {
    if (!window.confirm(`Delete the {{${v.key}}} variable? Templates using it will no longer substitute a value.`)) return;
    try {
      const r = await fetch(`/api/admin/personalization-vars?id=${encodeURIComponent(v.id)}`, { method: "DELETE" });
      if (r.ok) await fetchVars();
    } catch { /* ignore */ }
  };

  const chipClass = "inline-flex items-center gap-1 font-mono text-[10px] bg-cream px-2 py-1 text-charcoal border border-light-gray cursor-pointer hover:bg-light-gray transition whitespace-nowrap";
  const inputClass = "w-full border border-light-gray text-charcoal text-xs px-2.5 py-2 outline-none focus:border-charcoal/40 bg-white";
  const labelClass = "text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1";

  return (
    <div className="space-y-4 mb-6">
      {/* ── Built-in variables reference ── */}
      <div className="bg-white border border-light-gray p-5">
        <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">Built-In Variables</h3>
        <p className="text-xs text-warm-gray mb-3">Substituted automatically from the reservation and guest record. Click any variable to copy it.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
          {BUILT_IN_VARS.map(v => (
            <div key={v.token} className="flex items-center gap-2 min-w-0">
              <code className={chipClass} onClick={() => copyToken(v.token)} title="Click to copy">
                {copiedToken === v.token ? (
                  <span className="flex items-center gap-1 text-emerald-600"><Check size={10} /> Copied</span>
                ) : (
                  v.token
                )}
              </code>
              <span className="text-[11px] text-warm-gray truncate">{v.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Custom variables manager ── */}
      <div className="bg-white border border-light-gray p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Custom Variables</h3>
          {!showAdd && (
            <button
              onClick={() => { setShowAdd(true); setAddError(null); }}
              className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-3 py-1.5 flex items-center gap-1.5"
            >
              <Plus size={11} /> Add Variable
            </button>
          )}
        </div>
        <p className="text-xs text-warm-gray mb-3">Your own reusable values, available in every template alongside the built-ins.</p>

        {/* Add form */}
        {showAdd && (
          <div className="border border-light-gray bg-cream/50 p-4 mb-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Key *</label>
                <input
                  value={addForm.key}
                  onChange={e => setAddForm(p => ({ ...p, key: e.target.value }))}
                  placeholder="wifiNetwork"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Value *</label>
                <input
                  value={addForm.value}
                  onChange={e => setAddForm(p => ({ ...p, value: e.target.value }))}
                  placeholder="Avenue10-Guest"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <input
                  value={addForm.description}
                  onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Guest wifi network name"
                  className={inputClass}
                />
              </div>
            </div>
            {addError && <p className="text-[11px] text-red-600 mt-2">{addError}</p>}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={addVar}
                disabled={saving}
                className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-3 py-1.5 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => { setShowAdd(false); setAddForm({ key: "", value: "", description: "" }); setAddError(null); }}
                className="text-[10px] tracking-[0.15em] uppercase text-warm-gray hover:text-charcoal transition px-3 py-1.5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Custom var list */}
        {loading ? (
          <p className="text-xs text-warm-gray py-4 text-center">Loading variables...</p>
        ) : vars.length === 0 ? (
          <p className="text-xs text-warm-gray py-4 text-center">
            No custom variables yet. Add reusable values like wifi network, host name, or support phone.
          </p>
        ) : (
          <div className="divide-y divide-light-gray border border-light-gray">
            {vars.map(v => (
              <div key={v.id} className="p-3">
                {editingId === v.id ? (
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={labelClass}>Key *</label>
                        <input
                          value={editForm.key}
                          onChange={e => setEditForm(p => ({ ...p, key: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Value *</label>
                        <input
                          value={editForm.value}
                          onChange={e => setEditForm(p => ({ ...p, value: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Description</label>
                        <input
                          value={editForm.description}
                          onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    {editError && <p className="text-[11px] text-red-600 mt-2">{editError}</p>}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => saveEdit(v.id)}
                        disabled={saving}
                        className="bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-3 py-1.5 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditError(null); }}
                        className="text-[10px] tracking-[0.15em] uppercase text-warm-gray hover:text-charcoal transition px-3 py-1.5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 min-w-0">
                    <code className={`${chipClass} shrink-0`} onClick={() => copyToken(`{{${v.key}}}`)} title="Click to copy">
                      {copiedToken === `{{${v.key}}}` ? (
                        <span className="flex items-center gap-1 text-emerald-600"><Check size={10} /> Copied</span>
                      ) : (
                        `{{${v.key}}}`
                      )}
                    </code>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-charcoal truncate">{v.value}</p>
                      {v.description && <p className="text-[11px] text-warm-gray truncate">{v.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startEdit(v)} className="text-charcoal hover:bg-cream p-1.5 transition" title="Edit">
                        <Edit3 size={13} />
                      </button>
                      <button onClick={() => deleteVar(v)} className="text-warm-gray hover:text-red-600 hover:bg-cream p-1.5 transition" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
