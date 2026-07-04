"use client";

import { useEffect, useState, useCallback } from "react";
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

export default function AdminContentPage() {
  const [content, setContent] = useState<SiteContent[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [pageMedia, setPageMedia] = useState<PageMediaAssignment[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState("");
  const [listingGallery, setListingGallery] = useState<ListingMediaItem[]>([]);
  const [savingContent, setSavingContent] = useState(false);
  const [savedContent, setSavedContent] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    homepage: true,
    amenities: false,
    "page-media": true,
    "listing-gallery": true,
  });
  const [showMediaPicker, setShowMediaPicker] = useState<string | null>(null);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [newRoom, setNewRoom] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const loadAll = useCallback(async () => {
    const [contentRes, mediaRes, pageMediaRes, listingsRes] = await Promise.all([
      fetch("/api/admin/content"),
      fetch("/api/admin/media"),
      fetch("/api/admin/page-media"),
      fetch("/api/admin/listings"),
    ]);
    const contentData = await contentRes.json();
    setContent(contentData);
    setEditedValues(Object.fromEntries(contentData.map((c: SiteContent) => [c.key, c.value])));
    setAllMedia(await mediaRes.json());
    setPageMedia(await pageMediaRes.json());
    const listingsData = await listingsRes.json();
    setListings(listingsData);
    if (listingsData.length > 0 && !selectedListing) {
      setSelectedListing(listingsData[0].id);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

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

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const sections = [...new Set(content.map((c) => c.section))].filter((s) => s !== "checkin");

  const inputClass = "w-full bg-transparent border border-light-gray text-charcoal text-sm px-3 py-2.5 outline-none focus:border-charcoal/40 transition-colors";
  const labelClass = "text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1 block";

  function MediaPickerModal({ onSelect, onClose, filterType }: { onSelect: (id: string) => void; onClose: () => void; filterType?: "image" | "video" }) {
    const [pickerSearch, setPickerSearch] = useState("");
    const filtered = allMedia.filter((m) => {
      if (filterType === "video" && !m.mimeType.startsWith("video/")) return false;
      if (filterType === "image" && !m.mimeType.startsWith("image/")) return false;
      if (pickerSearch) return m.originalName.toLowerCase().includes(pickerSearch.toLowerCase());
      return true;
    });

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto" onClick={onClose}>
        <div className="bg-white w-full max-w-4xl p-6 mb-10 border border-light-gray" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg text-charcoal font-light">Select Media</h3>
            <button onClick={onClose}><X size={18} className="text-warm-gray" /></button>
          </div>
          <input
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            placeholder="Search files..."
            className={`${inputClass} mb-4`}
          />
          {filtered.length === 0 ? (
            <p className="text-warm-gray text-sm text-center py-8">No matching media. Upload files in the Media Library first.</p>
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-charcoal font-light">Pages & Content</h1>
        <button
          onClick={saveContent}
          disabled={savingContent}
          className="flex items-center gap-2 bg-charcoal text-white px-5 py-2.5 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition disabled:opacity-40"
        >
          <Save size={14} /> {savingContent ? "Saving..." : savedContent ? "Saved!" : "Save All Text"}
        </button>
      </div>

      {/* TEXT CONTENT SECTIONS */}
      {sections.map((section) => (
        <div key={section} className="bg-white border border-light-gray mb-4">
          <button
            onClick={() => toggleSection(section)}
            className="w-full flex items-center justify-between p-5 hover:bg-cream/50 transition"
          >
            <div className="flex items-center gap-2">
              <Type size={16} className="text-warm-gray" />
              <h2 className="text-sm font-medium text-charcoal capitalize">{section} Text</h2>
              <span className="text-[9px] text-warm-gray">({content.filter((c) => c.section === section).length} fields)</span>
            </div>
            {expandedSections[section] ? <ChevronUp size={16} className="text-warm-gray" /> : <ChevronDown size={16} className="text-warm-gray" />}
          </button>
          {expandedSections[section] && (
            <div className="px-5 pb-5 space-y-4 border-t border-light-gray pt-4">
              {content
                .filter((c) => c.section === section)
                .map((item) => (
                  <div key={item.key}>
                    <label className={labelClass}>{item.label}</label>
                    {(editedValues[item.key] || "").includes("\n") || (editedValues[item.key] || "").length > 100 ? (
                      <textarea
                        rows={3}
                        value={editedValues[item.key] || ""}
                        onChange={(e) => setEditedValues({ ...editedValues, [item.key]: e.target.value })}
                        className={`${inputClass} resize-none`}
                      />
                    ) : (
                      <input
                        value={editedValues[item.key] || ""}
                        onChange={(e) => setEditedValues({ ...editedValues, [item.key]: e.target.value })}
                        className={inputClass}
                      />
                    )}
                    <span className="text-[8px] text-warm-gray/60 mt-0.5 block">Key: {item.key}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}

      {/* PAGE MEDIA ASSIGNMENTS */}
      <div className="bg-white border border-light-gray mb-4">
        <button
          onClick={() => toggleSection("page-media")}
          className="w-full flex items-center justify-between p-5 hover:bg-cream/50 transition"
        >
          <div className="flex items-center gap-2">
            <Film size={16} className="text-warm-gray" />
            <h2 className="text-sm font-medium text-charcoal">Page Media Assignments</h2>
            <span className="text-[9px] text-warm-gray">Hero videos, backgrounds, thumbnails</span>
          </div>
          {expandedSections["page-media"] ? <ChevronUp size={16} className="text-warm-gray" /> : <ChevronDown size={16} className="text-warm-gray" />}
        </button>
        {expandedSections["page-media"] && (
          <div className="px-5 pb-5 border-t border-light-gray pt-4 space-y-3">
            {Object.entries(pageLocationLabels).map(([location, displayLabel]) => {
              const assignment = pageMedia.find((pm) => pm.location === location);
              return (
                <div key={location} className="flex items-center gap-4 bg-cream p-3">
                  <div className="w-20 h-14 bg-light-gray shrink-0 overflow-hidden">
                    {assignment?.media ? (
                      assignment.media.mimeType.startsWith("video/") ? (
                        <video muted playsInline className="w-full h-full object-cover">
                          <source src={assignment.media.url} type={assignment.media.mimeType} />
                        </video>
                      ) : (
                        <img src={assignment.media.url} alt="" className="w-full h-full object-cover" />
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
        )}
      </div>

      {/* LISTING GALLERY MANAGER */}
      <div className="bg-white border border-light-gray mb-4">
        <button
          onClick={() => toggleSection("listing-gallery")}
          className="w-full flex items-center justify-between p-5 hover:bg-cream/50 transition"
        >
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-warm-gray" />
            <h2 className="text-sm font-medium text-charcoal">Listing Gallery</h2>
            <span className="text-[9px] text-warm-gray">Room-by-room photos & videos per property</span>
          </div>
          {expandedSections["listing-gallery"] ? <ChevronUp size={16} className="text-warm-gray" /> : <ChevronDown size={16} className="text-warm-gray" />}
        </button>
        {expandedSections["listing-gallery"] && (
          <div className="px-5 pb-5 border-t border-light-gray pt-4">
            {/* Listing selector */}
            <div className="flex items-center gap-3 mb-4">
              <label className={labelClass}>Property</label>
              <select
                value={selectedListing}
                onChange={(e) => setSelectedListing(e.target.value)}
                className={`${inputClass} max-w-xs`}
              >
                {listings.map((l) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
              <button
                onClick={() => setShowGalleryPicker(true)}
                className="flex items-center gap-1 bg-charcoal text-white px-4 py-2.5 text-[10px] tracking-[0.12em] uppercase font-medium hover:bg-stone transition shrink-0"
              >
                <Plus size={14} /> Add Media
              </button>
            </div>

            {/* Gallery items */}
            {listingGallery.length === 0 ? (
              <p className="text-warm-gray text-xs text-center py-6">No gallery items. Click &quot;Add Media&quot; to get started.</p>
            ) : (
              <div className="space-y-2">
                {listingGallery.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3 bg-cream p-3">
                    <GripVertical size={14} className="text-warm-gray/40 shrink-0" />
                    <div className="w-16 h-12 bg-light-gray shrink-0 overflow-hidden">
                      {item.media.mimeType.startsWith("video/") ? (
                        <video muted playsInline className="w-full h-full object-cover">
                          <source src={item.media.url} type={item.media.mimeType} />
                        </video>
                      ) : (
                        <img src={item.media.url} alt={item.label} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <input
                      value={item.room}
                      onChange={(e) => updateGalleryItem(item.id, { room: e.target.value, label: item.label, sortOrder: item.sortOrder })}
                      placeholder="Room"
                      className="bg-transparent border border-light-gray text-xs px-2 py-1.5 w-28 outline-none focus:border-charcoal/40"
                    />
                    <input
                      value={item.label}
                      onChange={(e) => updateGalleryItem(item.id, { room: item.room, label: e.target.value, sortOrder: item.sortOrder })}
                      placeholder="Label"
                      className="bg-transparent border border-light-gray text-xs px-2 py-1.5 flex-1 outline-none focus:border-charcoal/40"
                    />
                    <div className="flex gap-1 shrink-0">
                      {idx > 0 && (
                        <button
                          onClick={() => {
                            const prev = listingGallery[idx - 1];
                            updateGalleryItem(item.id, { room: item.room, label: item.label, sortOrder: prev.sortOrder });
                            updateGalleryItem(prev.id, { room: prev.room, label: prev.label, sortOrder: item.sortOrder });
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
                            updateGalleryItem(item.id, { room: item.room, label: item.label, sortOrder: next.sortOrder });
                            updateGalleryItem(next.id, { room: next.room, label: next.label, sortOrder: item.sortOrder });
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
        )}
      </div>

      {/* Media picker for page assignments */}
      {showMediaPicker && (
        <MediaPickerModal
          onSelect={(mediaId) => updatePageMedia(showMediaPicker, mediaId)}
          onClose={() => setShowMediaPicker(null)}
        />
      )}

      {/* Media picker for gallery items */}
      {showGalleryPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto" onClick={() => setShowGalleryPicker(false)}>
          <div className="bg-white w-full max-w-4xl p-6 mb-10 border border-light-gray" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-charcoal font-light">Add to Gallery</h3>
              <button onClick={() => setShowGalleryPicker(false)}><X size={18} className="text-warm-gray" /></button>
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
              <p className="text-warm-gray text-sm text-center py-8">No media uploaded yet. Go to Media Library to upload files first.</p>
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
                      <img src={m.url} alt={m.originalName} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                      <Plus size={20} className="text-white opacity-0 group-hover:opacity-100 transition" />
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
