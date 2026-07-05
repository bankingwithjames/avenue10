"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Save,
  Type,
  Image as ImageIcon,
  Film,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  X,
  GripVertical,
  Check,
  Sparkles,
  ExternalLink,
  Globe,
  FileText,
  Shield,
  Search,
  LayoutGrid,
} from "lucide-react";

interface SiteContent {
  id: string;
  key: string;
  value: string;
  section: string;
  label: string;
}

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
}

interface PageMediaAssignment {
  id: string;
  location: string;
  mediaId: string;
  media: MediaItem;
}

interface Listing {
  id: string;
  title: string;
  slug: string;
}

interface ListingMediaItem {
  id: string;
  room: string;
  label: string;
  sortOrder: number;
  media: MediaItem;
}

const pageLocationLabels: Record<string, string> = {
  "homepage-hero": "Homepage — Hero Background Video",
  "homepage-contact": "Homepage — Contact Section Video",
  "homepage-amenities-bg": "Homepage — Amenities Background Image",
  "main-home-hero": "Main Home — Detail Page Hero",
  "garage-apartment-hero": "Garage Apartment — Detail Page Hero",
  "main-home-thumbnail": "Main Home — Browse Page Thumbnail",
  "garage-apartment-thumbnail": "Garage Apartment — Browse Page Thumbnail",
};

const tabs = [
  { key: "homepage", label: "Homepage", icon: Type },
  { key: "amenities", label: "Amenities", icon: LayoutGrid },
  { key: "footer", label: "Footer", icon: FileText },
  { key: "page-media", label: "Page Media", icon: Film },
  { key: "listing-gallery", label: "Listing Gallery", icon: ImageIcon },
  { key: "seo", label: "SEO & Meta", icon: Globe },
  { key: "policies", label: "Policies", icon: Shield },
];

export default function AdminContentPage() {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [originalValues, setOriginalValues] = useState<Record<string, string>>({});
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [pageMedia, setPageMedia] = useState<PageMediaAssignment[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState("");
  const [listingGallery, setListingGallery] = useState<ListingMediaItem[]>([]);
  const [savingContent, setSavingContent] = useState(false);
  const [savedContent, setSavedContent] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("homepage");
  const [showMediaPicker, setShowMediaPicker] = useState<string | null>(null);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [newRoom, setNewRoom] = useState("");
  const [newLabel, setNewLabel] = useState("");

  // Unsaved changes tracking
  const unsavedChanges = useMemo(() => {
    return Object.entries(editedValues).filter(
      ([key, value]) => originalValues[key] !== value
    );
  }, [editedValues, originalValues]);

  const hasUnsavedChanges = unsavedChanges.length > 0;

  // Stats
  const uniqueSections = useMemo(
    () => [...new Set(content.map((c) => c.section))].filter((s) => s !== "checkin"),
    [content]
  );

  const sectionFieldCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    content.forEach((c) => {
      if (c.section !== "checkin") {
        counts[c.section] = (counts[c.section] || 0) + 1;
      }
    });
    return counts;
  }, [content]);

  const loadAll = useCallback(async () => {
    const [contentRes, mediaRes, pageMediaRes, listingsRes] = await Promise.all([
      fetch("/api/admin/content"),
      fetch("/api/admin/media"),
      fetch("/api/admin/page-media"),
      fetch("/api/admin/listings"),
    ]);
    const contentData = await contentRes.json();
    setContent(contentData);
    const vals = Object.fromEntries(contentData.map((c: SiteContent) => [c.key, c.value]));
    setEditedValues(vals);
    setOriginalValues({ ...vals });
    setAllMedia(await mediaRes.json());
    setPageMedia(await pageMediaRes.json());
    const listingsData = await listingsRes.json();
    setListings(listingsData);
    if (listingsData.length > 0 && !selectedListing) {
      setSelectedListing(listingsData[0].id);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (selectedListing) loadListingGallery();
  }, [selectedListing]);

  async function loadListingGallery() {
    const res = await fetch(`/api/admin/listing-media?listingId=${selectedListing}`);
    setListingGallery(await res.json());
  }

  async function saveContent() {
    setSavingContent(true);
    const items = Object.entries(editedValues).map(([key, value]) => ({ key, value }));
    await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    setSavingContent(false);
    setSavedContent(true);
    setLastSavedAt(new Date());
    setOriginalValues({ ...editedValues });
    setTimeout(() => setSavedContent(false), 3000);
  }

  async function updatePageMedia(location: string, mediaId: string) {
    await fetch("/api/admin/page-media", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, mediaId }),
    });
    setShowMediaPicker(null);
    const res = await fetch("/api/admin/page-media");
    setPageMedia(await res.json());
  }

  async function addGalleryItem(mediaId: string) {
    await fetch("/api/admin/listing-media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: selectedListing,
        mediaId,
        room: newRoom || "General",
        label: newLabel || "Untitled",
      }),
    });
    setShowGalleryPicker(false);
    setNewRoom("");
    setNewLabel("");
    loadListingGallery();
  }

  async function updateGalleryItem(id: string, data: { room?: string; label?: string; sortOrder?: number }) {
    await fetch("/api/admin/listing-media", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    loadListingGallery();
  }

  async function removeGalleryItem(id: string) {
    await fetch("/api/admin/listing-media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadListingGallery();
  }

  const inputClass =
    "w-full bg-transparent border border-light-gray text-charcoal text-sm px-3 py-2.5 outline-none focus:border-charcoal/40 transition-colors";
  const labelClass = "text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1 block";

  function MediaPickerModal({
    onSelect,
    onClose,
    filterType,
  }: {
    onSelect: (id: string) => void;
    onClose: () => void;
    filterType?: "image" | "video";
  }) {
    const [pickerSearch, setPickerSearch] = useState("");
    const filtered = allMedia.filter((m) => {
      if (filterType === "video" && !m.mimeType.startsWith("video/")) return false;
      if (filterType === "image" && !m.mimeType.startsWith("image/")) return false;
      if (pickerSearch) return m.originalName.toLowerCase().includes(pickerSearch.toLowerCase());
      return true;
    });

    return (
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-white w-full max-w-4xl p-6 mb-10 border border-light-gray"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg text-charcoal font-light">Select Media</h3>
            <button onClick={onClose}>
              <X size={18} className="text-warm-gray" />
            </button>
          </div>
          <input
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            placeholder="Search files..."
            className={`${inputClass} mb-4`}
          />
          {filtered.length === 0 ? (
            <p className="text-warm-gray text-sm text-center py-8">
              No matching media. Upload files in the Media Library first.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto">
              {filtered.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onSelect(m.id)}
                  className="group relative aspect-[4/3] overflow-hidden bg-light-gray border border-transparent hover:border-accent transition"
                >
                  {m.mimeType.startsWith("video/") ? (
                    <video muted playsInline className="w-full h-full object-cover">
                      <source src={m.url} type={m.mimeType} />
                    </video>
                  ) : (
                    <img src={m.url} alt={m.originalName} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                    <Check size={20} className="text-white opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1.5 py-1 truncate">
                    {m.originalName}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Content Section Tab Renderer ---
  function renderContentSection(sectionName: string) {
    const sectionItems = content.filter((c) => c.section === sectionName);
    if (sectionItems.length === 0) {
      return (
        <div className="bg-white border border-light-gray p-8 text-center">
          <Type size={24} className="text-warm-gray/40 mx-auto mb-3" />
          <p className="text-warm-gray text-sm">No content fields found for this section.</p>
        </div>
      );
    }
    return (
      <div className="bg-white border border-light-gray">
        <div className="px-5 py-4 border-b border-light-gray flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type size={14} className="text-warm-gray" />
            <span className="text-xs font-medium text-charcoal capitalize">{sectionName} Content</span>
          </div>
          <span className="text-[9px] tracking-[0.1em] uppercase text-warm-gray">
            {sectionItems.length} {sectionItems.length === 1 ? "field" : "fields"}
          </span>
        </div>
        <div className="px-5 pb-5 pt-4 space-y-5">
          {sectionItems.map((item) => (
            <div key={item.key}>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>{item.label}</label>
                <span className="text-[8px] text-warm-gray/50 tabular-nums">
                  {(editedValues[item.key] || "").length} chars
                </span>
              </div>
              {(editedValues[item.key] || "").includes("\n") ||
              (editedValues[item.key] || "").length > 100 ? (
                <textarea
                  rows={3}
                  value={editedValues[item.key] || ""}
                  onChange={(e) =>
                    setEditedValues({ ...editedValues, [item.key]: e.target.value })
                  }
                  className={`${inputClass} resize-none`}
                />
              ) : (
                <input
                  value={editedValues[item.key] || ""}
                  onChange={(e) =>
                    setEditedValues({ ...editedValues, [item.key]: e.target.value })
                  }
                  className={inputClass}
                />
              )}
              <span className="text-[8px] text-warm-gray/60 mt-0.5 block">Key: {item.key}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Page Media Tab ---
  function renderPageMediaTab() {
    return (
      <div className="bg-white border border-light-gray">
        <div className="px-5 py-4 border-b border-light-gray flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film size={14} className="text-warm-gray" />
            <span className="text-xs font-medium text-charcoal">Page Media Assignments</span>
          </div>
          <span className="text-[9px] tracking-[0.1em] uppercase text-warm-gray">
            Hero videos, backgrounds, thumbnails
          </span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(pageLocationLabels).map(([location, displayLabel]) => {
              const assignment = pageMedia.find((pm) => pm.location === location);
              return (
                <div
                  key={location}
                  className="flex items-center gap-4 bg-cream p-3 border border-light-gray/50"
                >
                  <div className="w-20 h-14 bg-light-gray shrink-0 overflow-hidden">
                    {assignment?.media ? (
                      assignment.media.mimeType.startsWith("video/") ? (
                        <video muted playsInline className="w-full h-full object-cover">
                          <source src={assignment.media.url} type={assignment.media.mimeType} />
                        </video>
                      ) : (
                        <img
                          src={assignment.media.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={16} className="text-warm-gray" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-charcoal">{displayLabel}</p>
                    <p className="text-[10px] text-warm-gray truncate">
                      {assignment?.media?.originalName || "Not assigned"}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowMediaPicker(location)}
                    className="text-[9px] tracking-[0.1em] uppercase text-charcoal border border-light-gray px-3 py-1.5 hover:bg-white transition font-medium shrink-0"
                  >
                    Change
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- Listing Gallery Tab ---
  function renderListingGalleryTab() {
    return (
      <div className="bg-white border border-light-gray">
        <div className="px-5 py-4 border-b border-light-gray flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon size={14} className="text-warm-gray" />
            <span className="text-xs font-medium text-charcoal">Listing Gallery</span>
          </div>
          <span className="text-[9px] tracking-[0.1em] uppercase text-warm-gray">
            Room-by-room photos & videos per property
          </span>
        </div>
        <div className="p-5">
          {/* Listing selector */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="flex items-center gap-2">
              <label className={labelClass}>Property</label>
              <select
                value={selectedListing}
                onChange={(e) => setSelectedListing(e.target.value)}
                className={`${inputClass} max-w-xs`}
              >
                {listings.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowGalleryPicker(true)}
              className="flex items-center gap-1 bg-charcoal text-white px-4 py-2.5 text-[10px] tracking-[0.12em] uppercase font-medium hover:bg-stone transition shrink-0"
            >
              <Plus size={14} /> Add Media
            </button>
          </div>

          {/* Gallery items */}
          {listingGallery.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-light-gray">
              <ImageIcon size={24} className="text-warm-gray/40 mx-auto mb-3" />
              <p className="text-warm-gray text-xs">
                No gallery items. Click &quot;Add Media&quot; to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {listingGallery.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 bg-cream p-3 border border-light-gray/50">
                  <GripVertical size={14} className="text-warm-gray/40 shrink-0" />
                  <div className="w-16 h-12 bg-light-gray shrink-0 overflow-hidden">
                    {item.media.mimeType.startsWith("video/") ? (
                      <video muted playsInline className="w-full h-full object-cover">
                        <source src={item.media.url} type={item.media.mimeType} />
                      </video>
                    ) : (
                      <img
                        src={item.media.url}
                        alt={item.label}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <input
                    value={item.room}
                    onChange={(e) =>
                      updateGalleryItem(item.id, {
                        room: e.target.value,
                        label: item.label,
                        sortOrder: item.sortOrder,
                      })
                    }
                    placeholder="Room"
                    className="bg-transparent border border-light-gray text-xs px-2 py-1.5 w-28 outline-none focus:border-charcoal/40"
                  />
                  <input
                    value={item.label}
                    onChange={(e) =>
                      updateGalleryItem(item.id, {
                        room: item.room,
                        label: e.target.value,
                        sortOrder: item.sortOrder,
                      })
                    }
                    placeholder="Label"
                    className="bg-transparent border border-light-gray text-xs px-2 py-1.5 flex-1 outline-none focus:border-charcoal/40"
                  />
                  <div className="flex gap-1 shrink-0">
                    {idx > 0 && (
                      <button
                        onClick={() => {
                          const prev = listingGallery[idx - 1];
                          updateGalleryItem(item.id, {
                            room: item.room,
                            label: item.label,
                            sortOrder: prev.sortOrder,
                          });
                          updateGalleryItem(prev.id, {
                            room: prev.room,
                            label: prev.label,
                            sortOrder: item.sortOrder,
                          });
                        }}
                        className="text-warm-gray hover:text-charcoal border border-light-gray px-1.5 py-1 transition"
                      >
                        <ChevronUp size={12} />
                      </button>
                    )}
                    {idx < listingGallery.length - 1 && (
                      <button
                        onClick={() => {
                          const next = listingGallery[idx + 1];
                          updateGalleryItem(item.id, {
                            room: item.room,
                            label: item.label,
                            sortOrder: next.sortOrder,
                          });
                          updateGalleryItem(next.id, {
                            room: next.room,
                            label: next.label,
                            sortOrder: item.sortOrder,
                          });
                        }}
                        className="text-warm-gray hover:text-charcoal border border-light-gray px-1.5 py-1 transition"
                      >
                        <ChevronDown size={12} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => removeGalleryItem(item.id)}
                    className="text-red-400 hover:text-red-600 border border-red-200 px-1.5 py-1 transition shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- SEO & Meta Tab ---
  function renderSeoTab() {
    const comingSoonBadge = (
      <span className="text-[8px] tracking-[0.1em] uppercase bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 font-medium">
        Coming Soon
      </span>
    );

    return (
      <div className="bg-white border border-light-gray">
        <div className="px-5 py-4 border-b border-light-gray flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search size={14} className="text-warm-gray" />
            <span className="text-xs font-medium text-charcoal">SEO & Meta Settings</span>
          </div>
          {comingSoonBadge}
        </div>
        <div className="px-5 pb-5 pt-4 space-y-5">
          {/* Meta Title */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className={labelClass}>Meta Title</label>
              {comingSoonBadge}
            </div>
            <input
              placeholder="Avenue10 — Short Term Rental Stays"
              className={`${inputClass} opacity-60`}
              disabled
            />
          </div>

          {/* Meta Description */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className={labelClass}>Meta Description</label>
              {comingSoonBadge}
            </div>
            <textarea
              rows={3}
              placeholder="Luxury short-term rental accommodations..."
              className={`${inputClass} resize-none opacity-60`}
              disabled
            />
          </div>

          {/* OG Image */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className={labelClass}>OG Image URL</label>
              {comingSoonBadge}
            </div>
            <input placeholder="https://..." className={`${inputClass} opacity-60`} disabled />
          </div>

          {/* Canonical URL */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className={labelClass}>Canonical URL</label>
              {comingSoonBadge}
            </div>
            <input
              placeholder="https://avenue10.com"
              className={`${inputClass} opacity-60`}
              disabled
            />
          </div>

          {/* Google Analytics */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className={labelClass}>Google Analytics ID</label>
              {comingSoonBadge}
            </div>
            <input
              placeholder="G-XXXXXXXXXX"
              className={`${inputClass} opacity-60`}
              disabled
            />
          </div>

          {/* Robots */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className={labelClass}>Robots.txt Setting</label>
              {comingSoonBadge}
            </div>
            <select className={`${inputClass} opacity-60`} disabled>
              <option>Index & Follow</option>
              <option>Noindex</option>
              <option>Nofollow</option>
            </select>
          </div>

          {/* Sitemap */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className={labelClass}>Sitemap Enabled</label>
              {comingSoonBadge}
            </div>
            <label className="flex items-center gap-2 opacity-60">
              <input type="checkbox" checked disabled className="accent-charcoal" />
              <span className="text-sm text-charcoal">Generate sitemap.xml</span>
            </label>
          </div>

          <div className="border-t border-light-gray pt-4 mt-4">
            <p className="text-[10px] text-warm-gray leading-relaxed">
              SEO settings will be applied to all public pages when connected.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Policies Tab ---
  function renderPoliciesTab() {
    const comingSoonBadge = (
      <span className="text-[8px] tracking-[0.1em] uppercase bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 font-medium">
        Coming Soon
      </span>
    );

    const policies = [
      { label: "Cancellation Policy", placeholder: "Describe your cancellation policy..." },
      { label: "House Rules", placeholder: "List your house rules..." },
      {
        label: "Check-in Instructions",
        placeholder: "Check-in instructions...",
        note: "Managed in Check-In Portal",
      },
      { label: "Pet Policy", placeholder: "Describe your pet policy..." },
      { label: "Smoking Policy", placeholder: "Describe your smoking policy..." },
      { label: "Noise Policy", placeholder: "Describe your noise/quiet hours policy..." },
      { label: "Damage Policy", placeholder: "Describe your damage/deposit policy..." },
    ];

    return (
      <div className="bg-white border border-light-gray">
        <div className="px-5 py-4 border-b border-light-gray flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-warm-gray" />
            <span className="text-xs font-medium text-charcoal">Property Policies</span>
          </div>
          {comingSoonBadge}
        </div>
        <div className="px-5 pb-5 pt-4 space-y-5">
          {policies.map((policy) => (
            <div key={policy.label}>
              <div className="flex items-center gap-2 mb-1">
                <label className={labelClass}>{policy.label}</label>
                {comingSoonBadge}
              </div>
              <textarea
                rows={3}
                placeholder={policy.placeholder}
                className={`${inputClass} resize-none opacity-60`}
                disabled
              />
              {policy.note && (
                <span className="text-[8px] text-warm-gray/60 mt-0.5 block italic">
                  {policy.note}
                </span>
              )}
            </div>
          ))}
          <div className="border-t border-light-gray pt-4 mt-4">
            <p className="text-[10px] text-warm-gray leading-relaxed">
              Policy content will display on listing pages and booking confirmations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Render active tab content ---
  function renderTabContent() {
    switch (activeTab) {
      case "homepage":
        return renderContentSection("homepage");
      case "amenities":
        return renderContentSection("amenities");
      case "footer":
        return renderContentSection("footer");
      case "page-media":
        return renderPageMediaTab();
      case "listing-gallery":
        return renderListingGalleryTab();
      case "seo":
        return renderSeoTab();
      case "policies":
        return renderPoliciesTab();
      default:
        return null;
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="font-serif text-2xl text-charcoal font-light">Website Content</h1>
        <div className="flex items-center gap-2">
          {/* AI Assist Button */}
          <button
            onClick={() =>
              alert(
                "AI copy assistant coming soon — will help generate listing descriptions, amenity highlights, and SEO content."
              )
            }
            className="flex items-center gap-1.5 border border-light-gray text-charcoal px-4 py-2.5 text-[10px] tracking-[0.12em] uppercase font-medium hover:bg-cream transition"
          >
            <Sparkles size={13} /> AI Assist
          </button>

          {/* Preview Site Button */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 border border-light-gray text-charcoal px-4 py-2.5 text-[10px] tracking-[0.12em] uppercase font-medium hover:bg-cream transition"
          >
            <ExternalLink size={13} /> Preview Site
          </a>

          {/* Save Button */}
          <div className="relative flex items-center">
            {hasUnsavedChanges && (
              <span className="absolute -left-2 -top-1 w-2.5 h-2.5 bg-amber-400 rounded-full z-10" />
            )}
            <button
              onClick={saveContent}
              disabled={savingContent}
              className="flex items-center gap-2 bg-charcoal text-white px-5 py-2.5 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition disabled:opacity-40"
            >
              <Save size={14} />
              {savingContent
                ? "Saving..."
                : savedContent
                ? "Saved!"
                : hasUnsavedChanges
                ? `Save Changes (${unsavedChanges.length})`
                : "Save All Text"}
            </button>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] tracking-[0.1em] uppercase font-medium">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
          Unsaved changes in {unsavedChanges.length} {unsavedChanges.length === 1 ? "field" : "fields"}
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-light-gray px-4 py-3">
          <span className={labelClass}>Total Fields</span>
          <p className="text-lg font-serif text-charcoal font-light">
            {content.filter((c) => c.section !== "checkin").length}
          </p>
        </div>
        <div className="bg-white border border-light-gray px-4 py-3">
          <span className={labelClass}>Media Assigned</span>
          <p className="text-lg font-serif text-charcoal font-light">{pageMedia.length}</p>
        </div>
        <div className="bg-white border border-light-gray px-4 py-3">
          <span className={labelClass}>Gallery Items</span>
          <p className="text-lg font-serif text-charcoal font-light">{listingGallery.length}</p>
        </div>
        <div className="bg-white border border-light-gray px-4 py-3">
          <span className={labelClass}>Last Saved</span>
          <p className="text-sm text-charcoal font-light mt-0.5">
            {lastSavedAt
              ? lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "---"}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-light-gray mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const count =
            tab.key === "homepage" || tab.key === "amenities" || tab.key === "footer"
              ? sectionFieldCounts[tab.key] || 0
              : null;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-[10px] tracking-[0.15em] uppercase font-medium whitespace-nowrap transition border-b-2 ${
                activeTab === tab.key
                  ? "border-charcoal text-charcoal"
                  : "border-transparent text-warm-gray hover:text-charcoal"
              }`}
            >
              {tab.label}
              {count !== null && count > 0 && (
                <span className="ml-1.5 text-[8px] bg-cream border border-light-gray px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Media picker for page assignments */}
      {showMediaPicker && (
        <MediaPickerModal
          onSelect={(mediaId) => updatePageMedia(showMediaPicker, mediaId)}
          onClose={() => setShowMediaPicker(null)}
        />
      )}

      {/* Media picker for gallery items */}
      {showGalleryPicker && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto"
          onClick={() => setShowGalleryPicker(false)}
        >
          <div
            className="bg-white w-full max-w-4xl p-6 mb-10 border border-light-gray"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-charcoal font-light">Add to Gallery</h3>
              <button onClick={() => setShowGalleryPicker(false)}>
                <X size={18} className="text-warm-gray" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className={labelClass}>Room / Category</label>
                <input
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  placeholder="e.g. Master Suite, Kitchen, Exterior"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Label</label>
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Master Bedroom — Styled"
                  className={inputClass}
                />
              </div>
            </div>
            <p className={`${labelClass} mb-3`}>Select a file from your media library:</p>
            {allMedia.length === 0 ? (
              <p className="text-warm-gray text-sm text-center py-8">
                No media uploaded yet. Go to Media Library to upload files first.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto">
                {allMedia.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => addGalleryItem(m.id)}
                    className="group relative aspect-[4/3] overflow-hidden bg-light-gray border border-transparent hover:border-accent transition"
                  >
                    {m.mimeType.startsWith("video/") ? (
                      <video muted playsInline className="w-full h-full object-cover">
                        <source src={m.url} type={m.mimeType} />
                      </video>
                    ) : (
                      <img
                        src={m.url}
                        alt={m.originalName}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                      <Plus
                        size={20}
                        className="text-white opacity-0 group-hover:opacity-100 transition"
                      />
                    </div>
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1.5 py-1 truncate">
                      {m.originalName}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
