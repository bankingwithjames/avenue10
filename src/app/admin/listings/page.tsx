"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";

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
}

const emptyListing: Omit<Listing, "id"> = {
  title: "",
  slug: "",
  description: "",
  type: "Entire Home",
  bedrooms: 1,
  bathrooms: 1,
  maxGuests: 2,
  pricePerNight: 100,
  cleaningFee: 0,
  amenities: [],
  photos: [],
  active: true,
};

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyListing);
  const [amenityInput, setAmenityInput] = useState("");
  const [photoInput, setPhotoInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadListings(); }, []);

  async function loadListings() {
    const res = await fetch("/api/admin/listings");
    setListings(await res.json());
  }

  function openCreate() {
    setForm({ ...emptyListing });
    setCreating(true);
    setEditing(null);
  }

  function openEdit(listing: Listing) {
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
    setEditing(listing);
    setCreating(false);
  }

  function closeForm() { setEditing(null); setCreating(false); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const url = editing ? `/api/admin/listings/${editing.id}` : "/api/admin/listings";
    const method = editing ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    closeForm();
    loadListings();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
    loadListings();
  }

  function addAmenity() {
    const val = amenityInput.trim();
    if (val && !form.amenities.includes(val)) {
      setForm({ ...form, amenities: [...form.amenities, val] });
    }
    setAmenityInput("");
  }

  function removeAmenity(a: string) {
    setForm({ ...form, amenities: form.amenities.filter((x) => x !== a) });
  }

  function addPhoto() {
    const val = photoInput.trim();
    if (val) setForm({ ...form, photos: [...form.photos, val] });
    setPhotoInput("");
  }

  function removePhoto(idx: number) {
    setForm({ ...form, photos: form.photos.filter((_, i) => i !== idx) });
  }

  const showForm = creating || editing;

  const inputClass = "w-full bg-transparent border border-light-gray text-charcoal text-sm px-3 py-2.5 outline-none focus:border-charcoal/40 transition-colors";
  const labelClass = "text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1 block";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-charcoal font-light">Manage Listings</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-charcoal text-white px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition"
        >
          <Plus size={14} /> Add Listing
        </button>
      </div>

      <div className="space-y-3 mb-8">
        {listings.map((listing) => (
          <div key={listing.id} className="bg-white border border-light-gray p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-charcoal text-sm">{listing.title}</h3>
              <p className="text-xs text-warm-gray mt-0.5">
                {listing.type} &middot; {listing.bedrooms} bed &middot; {listing.bathrooms} bath &middot; ${listing.pricePerNight}/night
              </p>
              <span className={`text-[9px] tracking-[0.1em] uppercase font-medium mt-1 inline-block ${listing.active ? "text-accent" : "text-warm-gray"}`}>
                {listing.active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(listing)} className="flex items-center gap-1 border border-light-gray text-charcoal hover:bg-cream px-3 py-1.5 text-xs transition">
                <Pencil size={12} /> Edit
              </button>
              <button onClick={() => handleDelete(listing.id)} className="flex items-center gap-1 border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 text-xs transition">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl p-8 mb-10 border border-light-gray">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-xl text-charcoal font-light">
                {editing ? "Edit Listing" : "New Listing"}
              </h2>
              <button onClick={closeForm}><X size={18} className="text-warm-gray" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Title</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>URL Slug</label>
                  <input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} placeholder="e.g. main-home" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} resize-none`} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>
                    <option>Entire Home</option>
                    <option>Private Room</option>
                    <option>Shared Room</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Bedrooms</label>
                  <input type="number" min={0} value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Bathrooms</label>
                  <input type="number" min={0} value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Max Guests</label>
                  <input type="number" min={1} value={form.maxGuests} onChange={(e) => setForm({ ...form, maxGuests: Number(e.target.value) })} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Price / Night ($)</label>
                  <input type="number" min={0} step={0.01} value={form.pricePerNight} onChange={(e) => setForm({ ...form, pricePerNight: Number(e.target.value) })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Cleaning Fee ($)</label>
                  <input type="number" min={0} step={0.01} value={form.cleaningFee} onChange={(e) => setForm({ ...form, cleaningFee: Number(e.target.value) })} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Amenities</label>
                <div className="flex gap-2 mb-2">
                  <input value={amenityInput} onChange={(e) => setAmenityInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAmenity(); } }} placeholder="Add amenity..." className={`flex-1 ${inputClass}`} />
                  <button type="button" onClick={addAmenity} className="bg-charcoal text-white px-3 py-2 text-xs">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.amenities.map((a) => (
                    <span key={a} className="bg-cream text-charcoal text-xs px-3 py-1 flex items-center gap-1">
                      {a}
                      <button type="button" onClick={() => removeAmenity(a)} className="text-warm-gray hover:text-red-500"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Photo URLs</label>
                <div className="flex gap-2 mb-2">
                  <input value={photoInput} onChange={(e) => setPhotoInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPhoto(); } }} placeholder="Paste image URL..." className={`flex-1 ${inputClass}`} />
                  <button type="button" onClick={addPhoto} className="bg-charcoal text-white px-3 py-2 text-xs">Add</button>
                </div>
                <div className="space-y-1">
                  {form.photos.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-cream px-3 py-2 text-xs">
                      <span className="flex-1 truncate text-warm-gray">{url}</span>
                      <button type="button" onClick={() => removePhoto(idx)} className="text-red-400 hover:text-red-600"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                <span className="text-xs text-charcoal">Active (visible to guests)</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-charcoal text-white text-[11px] tracking-[0.15em] uppercase py-3 hover:bg-stone transition disabled:opacity-40 font-medium">
                  {saving ? "Saving..." : editing ? "Update Listing" : "Create Listing"}
                </button>
                <button type="button" onClick={closeForm} className="px-6 py-3 border border-light-gray text-charcoal text-xs hover:bg-cream transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
