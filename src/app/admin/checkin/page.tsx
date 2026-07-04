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
} from "lucide-react";

interface Listing {
  id: string;
  title: string;
  slug: string;
}

export default function AdminCheckInPage() {
  const [activeSection, setActiveSection] = useState("terms");
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState("");

  useEffect(() => {
    fetch("/api/admin/listings")
      .then((r) => r.json())
      .then((data) => {
        setListings(data);
        if (data.length > 0) setSelectedListing(data[0].id);
      });
  }, []);

  return (
    <div>
      <h1 className="text-xl font-light text-charcoal mb-6">Check-In Portal</h1>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "terms", label: "Terms & Conditions", icon: FileCheck },
          { key: "inventory", label: "Inventory", icon: ClipboardList },
          { key: "instructions", label: "Instructions & Codes", icon: KeyRound },
          { key: "recommendations", label: "Things to Do", icon: MapPin },
          { key: "reviews", label: "Guest Reviews", icon: Star },
          { key: "requests", label: "Guest Requests", icon: MessageSquare },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[10px] tracking-[0.1em] uppercase font-medium border transition-colors ${
              activeSection === s.key
                ? "bg-charcoal text-white border-charcoal"
                : "bg-white text-warm-gray border-light-gray hover:border-charcoal hover:text-charcoal"
            }`}
          >
            <s.icon size={14} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Listing selector for listing-specific sections */}
      {["inventory", "instructions"].includes(activeSection) && (
        <div className="mb-6">
          <label className="block text-[10px] tracking-[0.15em] uppercase text-warm-gray mb-2 font-medium">
            Select Property
          </label>
          <select
            value={selectedListing}
            onChange={(e) => setSelectedListing(e.target.value)}
            className="border border-light-gray px-4 py-2.5 text-sm text-charcoal bg-white focus:outline-none focus:border-charcoal"
          >
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {activeSection === "terms" && <TermsEditor />}
      {activeSection === "inventory" && selectedListing && (
        <InventoryEditor listingId={selectedListing} />
      )}
      {activeSection === "instructions" && selectedListing && (
        <InstructionsEditor listingId={selectedListing} />
      )}
      {activeSection === "recommendations" && <RecommendationsEditor />}
      {activeSection === "reviews" && <GuestRequestsManager filterType="review" />}
      {activeSection === "requests" && <GuestRequestsManager filterType="request" />}
    </div>
  );
}

/* ─── Terms Editor ─── */
function TermsEditor() {
  const [terms, setTerms] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then((data) => {
        const item = data.find((c: any) => c.key === "checkin-terms");
        if (item) setTerms(item.value);
      });
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ key: "checkin-terms", value: terms, section: "checkin", label: "Terms & Conditions" }],
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-white border border-light-gray p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-charcoal">Terms, Rules & Conditions</h2>
          <p className="text-xs text-warm-gray mt-0.5">
            This document must be signed by guests before they can access check-in details.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90 disabled:opacity-50"
        >
          {saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saved ? "Saved" : saving ? "Saving..." : "Save"}
        </button>
      </div>
      <textarea
        value={terms}
        onChange={(e) => setTerms(e.target.value)}
        rows={20}
        className="w-full border border-light-gray px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-charcoal resize-y font-mono leading-relaxed"
        placeholder="Enter your property terms, rules, and conditions here..."
      />
    </div>
  );
}

/* ─── Inventory Editor ─── */
function InventoryEditor({ listingId }: { listingId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [newRoom, setNewRoom] = useState("");
  const [newItem, setNewItem] = useState("");
  const [newQty, setNewQty] = useState(1);

  const load = useCallback(() => {
    fetch(`/api/admin/inventory?listingId=${listingId}`)
      .then((r) => r.json())
      .then(setItems);
  }, [listingId]);

  useEffect(() => { load(); }, [load]);

  async function addItem() {
    if (!newRoom.trim() || !newItem.trim()) return;
    await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        room: newRoom.trim(),
        itemName: newItem.trim(),
        quantity: newQty,
      }),
    });
    setNewItem("");
    setNewQty(1);
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

  const rooms = items.reduce<Record<string, any[]>>((acc, item) => {
    (acc[item.room] ||= []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="bg-white border border-light-gray p-6">
        <h3 className="text-sm font-medium text-charcoal mb-4">Add Inventory Item</h3>
        <div className="flex flex-wrap gap-3">
          <input
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
            placeholder="Room (e.g. Master Bedroom)"
            className="border border-light-gray px-3 py-2 text-sm flex-1 min-w-[180px] focus:outline-none focus:border-charcoal"
          />
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Item (e.g. Bath Towels)"
            className="border border-light-gray px-3 py-2 text-sm flex-1 min-w-[180px] focus:outline-none focus:border-charcoal"
          />
          <input
            type="number"
            value={newQty}
            onChange={(e) => setNewQty(parseInt(e.target.value) || 1)}
            min={1}
            className="border border-light-gray px-3 py-2 text-sm w-20 focus:outline-none focus:border-charcoal"
          />
          <button
            onClick={addItem}
            className="flex items-center gap-1 bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Items by room */}
      {Object.entries(rooms).map(([room, roomItems]) => (
        <div key={room} className="bg-white border border-light-gray">
          <div className="px-6 py-3 border-b border-light-gray bg-cream/50">
            <h3 className="text-[10px] tracking-[0.15em] uppercase font-medium text-charcoal">
              {room}
            </h3>
          </div>
          <div className="divide-y divide-light-gray">
            {roomItems.map((item: any) => (
              <div key={item.id} className="px-6 py-2.5 flex items-center justify-between">
                <span className="text-sm text-charcoal">{item.itemName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-warm-gray">Qty: {item.quantity}</span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-warm-gray hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(rooms).length === 0 && (
        <p className="text-sm text-warm-gray text-center py-8">
          No inventory items yet. Add items above.
        </p>
      )}
    </div>
  );
}

/* ─── Instructions Editor ─── */
function InstructionsEditor({ listingId }: { listingId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [newCat, setNewCat] = useState("Door Codes");
  const [newTitle, setNewTitle] = useState("");
  const [newValue, setNewValue] = useState("");

  const categories = ["Door Codes", "Wi-Fi", "Streaming", "Check-In", "Check-Out", "Other"];

  const load = useCallback(() => {
    fetch(`/api/admin/instructions?listingId=${listingId}`)
      .then((r) => r.json())
      .then(setItems);
  }, [listingId]);

  useEffect(() => { load(); }, [load]);

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
      }),
    });
    setNewTitle("");
    setNewValue("");
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

  return (
    <div className="space-y-4">
      <div className="bg-white border border-light-gray p-6">
        <h3 className="text-sm font-medium text-charcoal mb-4">Add Instruction / Code</h3>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <select
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              className="border border-light-gray px-3 py-2 text-sm bg-white focus:outline-none focus:border-charcoal"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Label (e.g. Front Door Code)"
              className="border border-light-gray px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:border-charcoal"
            />
          </div>
          <div className="flex gap-3">
            <textarea
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Value / Instructions"
              rows={2}
              className="border border-light-gray px-3 py-2 text-sm flex-1 focus:outline-none focus:border-charcoal resize-none"
            />
            <button
              onClick={addItem}
              className="flex items-center gap-1 bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90 self-end"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
      </div>

      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} className="bg-white border border-light-gray">
          <div className="px-6 py-3 border-b border-light-gray bg-cream/50">
            <h3 className="text-[10px] tracking-[0.15em] uppercase font-medium text-charcoal">
              {cat}
            </h3>
          </div>
          <div className="divide-y divide-light-gray">
            {catItems.map((item: any) => (
              <div key={item.id} className="px-6 py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-warm-gray">{item.title}</p>
                  <p className="text-sm text-charcoal font-medium whitespace-pre-line">{item.value}</p>
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
    </div>
  );
}

/* ─── Recommendations Editor ─── */
function RecommendationsEditor() {
  const [items, setItems] = useState<any[]>([]);
  const [newCat, setNewCat] = useState("Restaurants");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAddr, setNewAddr] = useState("");
  const [newLink, setNewLink] = useState("");

  const categories = ["Restaurants", "Sports", "Lounges", "Events", "Festivals"];

  function load() {
    fetch("/api/admin/recommendations").then((r) => r.json()).then(setItems);
  }

  useEffect(() => { load(); }, []);

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
      }),
    });
    setNewName("");
    setNewDesc("");
    setNewAddr("");
    setNewLink("");
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
      <div className="bg-white border border-light-gray p-6">
        <h3 className="text-sm font-medium text-charcoal mb-4">Add Recommendation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            className="border border-light-gray px-3 py-2 text-sm bg-white focus:outline-none focus:border-charcoal"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="border border-light-gray px-3 py-2 text-sm focus:outline-none focus:border-charcoal"
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description"
            className="border border-light-gray px-3 py-2 text-sm md:col-span-2 focus:outline-none focus:border-charcoal"
          />
          <input
            value={newAddr}
            onChange={(e) => setNewAddr(e.target.value)}
            placeholder="Address (optional)"
            className="border border-light-gray px-3 py-2 text-sm focus:outline-none focus:border-charcoal"
          />
          <div className="flex gap-3">
            <input
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="Website URL (optional)"
              className="border border-light-gray px-3 py-2 text-sm flex-1 focus:outline-none focus:border-charcoal"
            />
            <button
              onClick={addItem}
              className="flex items-center gap-1 bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
      </div>

      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} className="bg-white border border-light-gray">
          <div className="px-6 py-3 border-b border-light-gray bg-cream/50">
            <h3 className="text-[10px] tracking-[0.15em] uppercase font-medium text-charcoal">
              {cat} ({catItems.length})
            </h3>
          </div>
          <div className="divide-y divide-light-gray">
            {catItems.map((item: any) => (
              <div key={item.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-charcoal">{item.name}</p>
                  <p className="text-xs text-warm-gray">{item.description}</p>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-warm-gray hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Guest Requests Manager ─── */
function GuestRequestsManager({ filterType }: { filterType: "review" | "request" }) {
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  function load() {
    fetch("/api/admin/guest-requests").then((r) => r.json()).then(setAllRequests);
  }

  useEffect(() => { load(); }, []);

  async function updateRequest(id: string, status: string, adminReply?: string) {
    await fetch("/api/admin/guest-requests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, adminReply }),
    });
    setReplyingTo(null);
    setReplyText("");
    load();
  }

  const requests = allRequests.filter((r) => r.type === filterType);

  if (requests.length === 0) {
    const Icon = filterType === "review" ? Star : MessageSquare;
    return (
      <div className="bg-white border border-light-gray p-8 text-center">
        <Icon size={32} className="mx-auto text-warm-gray/40 mb-3" />
        <p className="text-sm text-warm-gray">
          No guest {filterType === "review" ? "reviews" : "requests"} yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-light-gray divide-y divide-light-gray">
      {requests.map((req) => (
        <div key={req.id} className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className={`text-[9px] tracking-[0.15em] uppercase font-medium px-2 py-0.5 ${
                req.type === "review" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
              }`}>
                {req.type}
              </span>
              <span className="text-xs text-charcoal font-medium">
                {req.reservation?.guestName}
              </span>
              <span className="text-xs text-warm-gray">
                — {req.reservation?.listing?.title}
              </span>
            </div>
            <span className={`text-[10px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 ${
              req.status === "resolved" ? "bg-green-50 text-green-700" :
              req.status === "acknowledged" ? "bg-yellow-50 text-yellow-700" :
              "bg-gray-50 text-gray-600"
            }`}>
              {req.status}
            </span>
          </div>

          <p className="text-sm text-charcoal mb-3">{req.message}</p>

          {req.adminReply && (
            <div className="bg-cream p-3 border-l-2 border-charcoal mb-3">
              <p className="text-[10px] tracking-[0.1em] uppercase text-warm-gray mb-1 font-medium">
                Your Reply
              </p>
              <p className="text-sm text-charcoal">{req.adminReply}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            {req.status === "pending" && (
              <button
                onClick={() => updateRequest(req.id, "acknowledged")}
                className="text-[10px] tracking-[0.1em] uppercase font-medium px-3 py-1.5 border border-light-gray text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors"
              >
                Acknowledge
              </button>
            )}
            {req.status !== "resolved" && (
              <>
                <button
                  onClick={() => updateRequest(req.id, "resolved")}
                  className="text-[10px] tracking-[0.1em] uppercase font-medium px-3 py-1.5 border border-light-gray text-warm-gray hover:border-green-600 hover:text-green-600 transition-colors"
                >
                  Resolve
                </button>
                <button
                  onClick={() => setReplyingTo(replyingTo === req.id ? null : req.id)}
                  className="flex items-center gap-1 text-[10px] tracking-[0.1em] uppercase font-medium px-3 py-1.5 border border-light-gray text-warm-gray hover:border-charcoal hover:text-charcoal transition-colors"
                >
                  <Reply size={12} /> Reply
                </button>
              </>
            )}
          </div>

          {replyingTo === req.id && (
            <div className="mt-3 flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="flex-1 border border-light-gray px-3 py-2 text-sm focus:outline-none focus:border-charcoal"
              />
              <button
                onClick={() => updateRequest(req.id, "acknowledged", replyText)}
                className="bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-charcoal/90"
              >
                Send
              </button>
            </div>
          )}

          <p className="text-[10px] text-warm-gray/60 mt-2">
            {new Date(req.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
