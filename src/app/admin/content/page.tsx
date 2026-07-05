"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading,
  List,
  ListOrdered,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Settings,
  Eye,
  Send,
  Clock,
  ChevronRight,
  Copy,
  BookOpen,
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

interface FieldStyle {
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: string;
}

// --- Content usage map ---
const contentUsageMap: Record<string, string> = {
  homepage: "Homepage",
  amenities: "Homepage Amenities Section",
  footer: "Site Footer",
  seo: "All Pages (meta)",
  policies: "Booking Flow, Listing Pages",
  terms: "Check-in Portal, Booking Agreement",
  brand: "Global Site Styles",
};

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
  { key: "seo", label: "SEO & Meta", icon: Globe },
  { key: "policies", label: "Policies", icon: Shield },
  { key: "terms", label: "Terms & Conditions", icon: BookOpen },
  { key: "brand", label: "Brand & Text Styles", icon: Palette },
  { key: "page-media", label: "Page Media", icon: Film },
  { key: "listing-gallery", label: "Listing Gallery", icon: ImageIcon },
];

// --- SEO field definitions ---
const seoFields = [
  { key: "seo-meta-title", label: "Meta Title", placeholder: "Avenue10 — Short Term Rental Stays", type: "input" as const },
  { key: "seo-meta-description", label: "Meta Description", placeholder: "Luxury short-term rental accommodations...", type: "textarea" as const },
  { key: "seo-og-image", label: "OG Image URL", placeholder: "https://...", type: "input" as const },
  { key: "seo-canonical-url", label: "Canonical URL", placeholder: "https://avenue10.com", type: "input" as const },
  { key: "seo-analytics-id", label: "Google Analytics ID", placeholder: "G-XXXXXXXXXX", type: "input" as const },
  { key: "seo-robots", label: "Robots Setting", placeholder: "", type: "select" as const, options: ["index, follow", "noindex, follow", "index, nofollow", "noindex, nofollow"] },
];

// --- Policy field definitions ---
const policyFields = [
  { key: "policies-cancellation", label: "Cancellation Policy", placeholder: "Describe your cancellation policy..." },
  { key: "policies-house-rules", label: "House Rules", placeholder: "List your house rules..." },
  { key: "policies-checkin", label: "Check-in Instructions", placeholder: "Check-in instructions...", note: "Also managed in Check-In Portal" },
  { key: "policies-pet", label: "Pet Policy", placeholder: "Describe your pet policy..." },
  { key: "policies-smoking", label: "Smoking Policy", placeholder: "Describe your smoking policy..." },
  { key: "policies-noise", label: "Noise Policy", placeholder: "Describe your noise/quiet hours policy..." },
  { key: "policies-damage", label: "Damage Policy", placeholder: "Describe your damage/deposit policy..." },
];

// --- Terms field definitions ---
const termsFields = [
  { key: "terms-rental-agreement", label: "Rental Agreement Terms", placeholder: "Enter your full rental agreement terms...", rows: 8 },
  { key: "terms-liability-waiver", label: "Liability Waiver", placeholder: "Enter your liability waiver text...", rows: 6 },
  { key: "terms-payment", label: "Payment Terms", placeholder: "Enter your payment terms...", rows: 5 },
  { key: "terms-property-rules", label: "Property Rules Agreement", placeholder: "Enter your property rules agreement...", rows: 5 },
  { key: "terms-privacy", label: "Privacy Policy", placeholder: "Enter your privacy policy text...", rows: 6 },
];

// --- Brand field definitions ---
const brandColorFields = [
  { key: "brand-primary-color", label: "Primary Color", defaultVal: "#1a1a1a" },
  { key: "brand-secondary-color", label: "Secondary Color", defaultVal: "#6b7280" },
  { key: "brand-accent-color", label: "Accent Color", defaultVal: "#b8860b" },
  { key: "brand-text-color", label: "Text Color", defaultVal: "#1f2937" },
  { key: "brand-background-color", label: "Background Color", defaultVal: "#faf9f6" },
];

const brandTypographyFields = [
  { key: "brand-heading-font", label: "Heading Font Family", type: "select" as const, options: ["Playfair Display", "Georgia", "Times New Roman", "serif"] },
  { key: "brand-body-font", label: "Body Font Family", type: "select" as const, options: ["Inter", "system-ui", "sans-serif", "Lato", "Open Sans"] },
  { key: "brand-base-font-size", label: "Base Font Size", type: "input" as const, placeholder: "16px" },
  { key: "brand-line-height", label: "Line Height", type: "input" as const, placeholder: "1.6" },
];

const brandSpacingFields = [
  { key: "brand-section-padding", label: "Section Padding", placeholder: "64px" },
  { key: "brand-content-max-width", label: "Content Max Width", placeholder: "1200px" },
  { key: "brand-letter-spacing", label: "Letter Spacing", placeholder: "0.02em" },
];

// --- Sync mapping from policies to terms ---
const policySyncMap: Record<string, string> = {
  "policies-house-rules": "terms-property-rules",
  "policies-cancellation": "terms-payment",
  "policies-damage": "terms-liability-waiver",
};

// --- Font size / weight options ---
const fontSizeOptions = ["12px", "14px", "16px", "18px", "20px", "24px", "32px", "48px"];
const fontWeightOptions = [
  { label: "Light", value: "300" },
  { label: "Normal", value: "400" },
  { label: "Medium", value: "500" },
  { label: "Semi-Bold", value: "600" },
  { label: "Bold", value: "700" },
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
  const [expandedStyles, setExpandedStyles] = useState<Record<string, boolean>>({});
  const [showAiDropdown, setShowAiDropdown] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"draft" | "published">("draft");
  const [lastPublishedAt, setLastPublishedAt] = useState<Date | null>(null);

  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // Unsaved changes tracking
  const unsavedChanges = useMemo(() => {
    return Object.entries(editedValues).filter(
      ([key, value]) => originalValues[key] !== value
    );
  }, [editedValues, originalValues]);

  const hasUnsavedChanges = unsavedChanges.length > 0;

  // Stats
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

    // Load publish status
    if (vals["cms-publish-status"]) {
      setPublishStatus(vals["cms-publish-status"] as "draft" | "published");
    }
    if (vals["cms-last-published"]) {
      setLastPublishedAt(new Date(vals["cms-last-published"]));
    }

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

  async function saveContent(markPublished = false) {
    setSavingContent(true);

    const updatedValues = { ...editedValues };

    if (markPublished) {
      updatedValues["cms-publish-status"] = "published";
      updatedValues["cms-last-published"] = new Date().toISOString();
    } else if (hasUnsavedChanges) {
      updatedValues["cms-publish-status"] = "draft";
    }

    const items = Object.entries(updatedValues).map(([key, value]) => ({ key, value }));
    await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    setSavingContent(false);
    setSavedContent(true);
    setLastSavedAt(new Date());
    setEditedValues(updatedValues);
    setOriginalValues({ ...updatedValues });

    if (markPublished) {
      setPublishStatus("published");
      setLastPublishedAt(new Date());
    } else if (hasUnsavedChanges) {
      setPublishStatus("draft");
    }

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

  function updateValue(key: string, value: string) {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  }

  function getFieldStyle(key: string): FieldStyle {
    const styleKey = `${key}-style`;
    const raw = editedValues[styleKey];
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    return {};
  }

  function setFieldStyle(key: string, style: FieldStyle) {
    const styleKey = `${key}-style`;
    updateValue(styleKey, JSON.stringify(style));
  }

  function toggleStylePanel(key: string) {
    setExpandedStyles((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // --- Rich text formatting helpers ---
  function insertFormatting(fieldKey: string, prefix: string, suffix: string) {
    const textarea = textareaRefs.current[fieldKey];
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = editedValues[fieldKey] || "";
    const selectedText = val.substring(start, end);
    const newVal = val.substring(0, start) + prefix + selectedText + suffix + val.substring(end);
    updateValue(fieldKey, newVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  }

  function insertLinePrefix(fieldKey: string, prefix: string) {
    const textarea = textareaRefs.current[fieldKey];
    if (!textarea) return;
    const start = textarea.selectionStart;
    const val = editedValues[fieldKey] || "";
    const lineStart = val.lastIndexOf("\n", start - 1) + 1;
    const newVal = val.substring(0, lineStart) + prefix + val.substring(lineStart);
    updateValue(fieldKey, newVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  }

  // --- Usage badge for a field ---
  function getUsageBadge(key: string): string | null {
    const section = key.split("-")[0];
    return contentUsageMap[section] || null;
  }

  // --- SEO score helpers ---
  function getSeoTitleScore(len: number): { label: string; color: string } {
    if (len === 0) return { label: "Empty", color: "text-warm-gray" };
    if (len >= 50 && len <= 60) return { label: "Optimal", color: "text-green-600" };
    if (len >= 40 && len <= 70) return { label: "Acceptable", color: "text-amber-600" };
    return { label: len < 40 ? "Too Short" : "Too Long", color: "text-red-500" };
  }

  function getSeoDescScore(len: number): { label: string; color: string } {
    if (len === 0) return { label: "Empty", color: "text-warm-gray" };
    if (len >= 150 && len <= 160) return { label: "Optimal", color: "text-green-600" };
    if (len >= 120 && len <= 180) return { label: "Acceptable", color: "text-amber-600" };
    return { label: len < 120 ? "Too Short" : "Too Long", color: "text-red-500" };
  }

  const inputClass =
    "w-full bg-transparent border border-light-gray text-charcoal text-sm px-3 py-2.5 outline-none focus:border-charcoal/40 transition-colors";
  const labelClass = "text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1 block";

  // =============================================
  // RICH TEXT TOOLBAR
  // =============================================
  function RichTextToolbar({ fieldKey }: { fieldKey: string }) {
    const btnClass = "p-1.5 text-warm-gray hover:text-charcoal hover:bg-cream border border-transparent hover:border-light-gray transition rounded-sm";
    return (
      <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 bg-cream/50 border border-light-gray border-b-0">
        <button type="button" title="Bold" className={btnClass} onClick={() => insertFormatting(fieldKey, "**", "**")}>
          <Bold size={13} />
        </button>
        <button type="button" title="Italic" className={btnClass} onClick={() => insertFormatting(fieldKey, "*", "*")}>
          <Italic size={13} />
        </button>
        <button type="button" title="Underline" className={btnClass} onClick={() => insertFormatting(fieldKey, "<u>", "</u>")}>
          <Underline size={13} />
        </button>
        <button type="button" title="Strikethrough" className={btnClass} onClick={() => insertFormatting(fieldKey, "~~", "~~")}>
          <Strikethrough size={13} />
        </button>
        <span className="w-px h-4 bg-light-gray mx-1" />
        <button type="button" title="Heading" className={btnClass} onClick={() => insertLinePrefix(fieldKey, "## ")}>
          <Heading size={13} />
        </button>
        <button type="button" title="Bullet List" className={btnClass} onClick={() => insertLinePrefix(fieldKey, "- ")}>
          <List size={13} />
        </button>
        <button type="button" title="Numbered List" className={btnClass} onClick={() => insertLinePrefix(fieldKey, "1. ")}>
          <ListOrdered size={13} />
        </button>
        <button type="button" title="Link" className={btnClass} onClick={() => insertFormatting(fieldKey, "[", "](url)")}>
          <Link size={13} />
        </button>
        <span className="w-px h-4 bg-light-gray mx-1" />
        <button type="button" title="Align Left" className={btnClass} onClick={() => insertLinePrefix(fieldKey, "{: .text-left} ")}>
          <AlignLeft size={13} />
        </button>
        <button type="button" title="Align Center" className={btnClass} onClick={() => insertLinePrefix(fieldKey, "{: .text-center} ")}>
          <AlignCenter size={13} />
        </button>
        <button type="button" title="Align Right" className={btnClass} onClick={() => insertLinePrefix(fieldKey, "{: .text-right} ")}>
          <AlignRight size={13} />
        </button>
      </div>
    );
  }

  // =============================================
  // FIELD STYLE CONTROLS
  // =============================================
  function FieldStyleControls({ fieldKey }: { fieldKey: string }) {
    const style = getFieldStyle(fieldKey);
    const isOpen = expandedStyles[fieldKey] || false;

    function update(patch: Partial<FieldStyle>) {
      setFieldStyle(fieldKey, { ...style, ...patch });
    }

    return (
      <div className="mt-1">
        <button
          type="button"
          onClick={() => toggleStylePanel(fieldKey)}
          className="flex items-center gap-1 text-[8px] tracking-[0.1em] uppercase text-warm-gray hover:text-charcoal transition"
        >
          <Settings size={10} />
          Style
          {isOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
        {isOpen && (
          <div className="mt-2 p-3 bg-cream/50 border border-light-gray grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={labelClass}>Font Size</label>
              <select
                value={style.fontSize || ""}
                onChange={(e) => update({ fontSize: e.target.value })}
                className="w-full bg-white border border-light-gray text-xs px-2 py-1.5 outline-none focus:border-charcoal/40"
              >
                <option value="">Default</option>
                {fontSizeOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Font Weight</label>
              <select
                value={style.fontWeight || ""}
                onChange={(e) => update({ fontWeight: e.target.value })}
                className="w-full bg-white border border-light-gray text-xs px-2 py-1.5 outline-none focus:border-charcoal/40"
              >
                <option value="">Default</option>
                {fontWeightOptions.map((w) => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Text Color</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={style.color || "#1a1a1a"}
                  onChange={(e) => update({ color: e.target.value })}
                  className="w-8 h-8 border border-light-gray cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={style.color || ""}
                  onChange={(e) => update({ color: e.target.value })}
                  placeholder="#1a1a1a"
                  className="flex-1 bg-white border border-light-gray text-xs px-2 py-1.5 outline-none focus:border-charcoal/40"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Text Align</label>
              <div className="flex gap-1">
                {(["left", "center", "right", "justify"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => update({ textAlign: a })}
                    className={`flex-1 text-[9px] uppercase py-1.5 border transition ${
                      style.textAlign === a
                        ? "bg-charcoal text-white border-charcoal"
                        : "bg-white text-warm-gray border-light-gray hover:border-charcoal/40"
                    }`}
                  >
                    {a.charAt(0).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =============================================
  // MEDIA PICKER MODAL (unchanged)
  // =============================================
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

  // =============================================
  // CONTENT SECTION TAB RENDERER (enhanced)
  // =============================================
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
          {sectionItems.map((item) => {
            const isTextarea =
              (editedValues[item.key] || "").includes("\n") ||
              (editedValues[item.key] || "").length > 100;
            const usage = getUsageBadge(item.key);

            return (
              <div key={item.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <label className={labelClass}>{item.label}</label>
                    {usage && (
                      <span className="text-[7px] tracking-[0.08em] uppercase bg-cream text-warm-gray border border-light-gray px-1.5 py-0.5">
                        Used on: {usage}
                      </span>
                    )}
                  </div>
                  <span className="text-[8px] text-warm-gray/50 tabular-nums">
                    {(editedValues[item.key] || "").length} chars
                  </span>
                </div>
                {isTextarea ? (
                  <>
                    <RichTextToolbar fieldKey={item.key} />
                    <textarea
                      ref={(el) => { textareaRefs.current[item.key] = el; }}
                      rows={3}
                      value={editedValues[item.key] || ""}
                      onChange={(e) => updateValue(item.key, e.target.value)}
                      className={`${inputClass} resize-none`}
                    />
                  </>
                ) : (
                  <input
                    value={editedValues[item.key] || ""}
                    onChange={(e) => updateValue(item.key, e.target.value)}
                    className={inputClass}
                  />
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-warm-gray/60 mt-0.5 block">Key: {item.key}</span>
                </div>
                <FieldStyleControls fieldKey={item.key} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =============================================
  // PAGE MEDIA TAB (unchanged)
  // =============================================
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

  // =============================================
  // LISTING GALLERY TAB (unchanged)
  // =============================================
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

  // =============================================
  // SEO & META TAB (activated)
  // =============================================
  function renderSeoTab() {
    const titleLen = (editedValues["seo-meta-title"] || "").length;
    const descLen = (editedValues["seo-meta-description"] || "").length;
    const titleScore = getSeoTitleScore(titleLen);
    const descScore = getSeoDescScore(descLen);

    // Compute overall SEO score
    let seoPoints = 0;
    if (titleLen >= 50 && titleLen <= 60) seoPoints += 25;
    else if (titleLen >= 40 && titleLen <= 70) seoPoints += 15;
    if (descLen >= 150 && descLen <= 160) seoPoints += 25;
    else if (descLen >= 120 && descLen <= 180) seoPoints += 15;
    if ((editedValues["seo-og-image"] || "").length > 0) seoPoints += 15;
    if ((editedValues["seo-canonical-url"] || "").length > 0) seoPoints += 15;
    if ((editedValues["seo-analytics-id"] || "").length > 0) seoPoints += 10;
    if ((editedValues["seo-robots"] || "").length > 0) seoPoints += 10;

    const seoScoreColor = seoPoints >= 80 ? "text-green-600" : seoPoints >= 50 ? "text-amber-600" : "text-red-500";

    return (
      <div className="bg-white border border-light-gray">
        <div className="px-5 py-4 border-b border-light-gray flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search size={14} className="text-warm-gray" />
            <span className="text-xs font-medium text-charcoal">SEO & Meta Settings</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[7px] tracking-[0.08em] uppercase bg-cream text-warm-gray border border-light-gray px-1.5 py-0.5">
              Used on: All Pages (meta)
            </span>
            <span className={`text-xs font-medium ${seoScoreColor}`}>
              SEO Score: {seoPoints}/100
            </span>
          </div>
        </div>
        <div className="px-5 pb-5 pt-4 space-y-5">
          {seoFields.map((field) => {
            const val = editedValues[field.key] || "";
            const len = val.length;

            return (
              <div key={field.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClass}>{field.label}</label>
                  <div className="flex items-center gap-2">
                    {field.key === "seo-meta-title" && (
                      <span className={`text-[8px] font-medium ${titleScore.color}`}>
                        {titleScore.label} ({len}/60)
                      </span>
                    )}
                    {field.key === "seo-meta-description" && (
                      <span className={`text-[8px] font-medium ${descScore.color}`}>
                        {descScore.label} ({len}/160)
                      </span>
                    )}
                    {field.key !== "seo-meta-title" && field.key !== "seo-meta-description" && (
                      <span className="text-[8px] text-warm-gray/50 tabular-nums">{len} chars</span>
                    )}
                  </div>
                </div>

                {field.type === "textarea" ? (
                  <>
                    <RichTextToolbar fieldKey={field.key} />
                    <textarea
                      ref={(el) => { textareaRefs.current[field.key] = el; }}
                      rows={3}
                      value={val}
                      onChange={(e) => updateValue(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={`${inputClass} resize-none`}
                    />
                  </>
                ) : field.type === "select" ? (
                  <select
                    value={val}
                    onChange={(e) => updateValue(field.key, e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={val}
                    onChange={(e) => updateValue(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={inputClass}
                  />
                )}

                {/* SEO title character bar */}
                {field.key === "seo-meta-title" && (
                  <div className="mt-1.5 h-1.5 bg-light-gray overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        len >= 50 && len <= 60 ? "bg-green-500" : len >= 40 && len <= 70 ? "bg-amber-400" : "bg-red-400"
                      }`}
                      style={{ width: `${Math.min((len / 70) * 100, 100)}%` }}
                    />
                  </div>
                )}
                {field.key === "seo-meta-description" && (
                  <div className="mt-1.5 h-1.5 bg-light-gray overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        len >= 150 && len <= 160 ? "bg-green-500" : len >= 120 && len <= 180 ? "bg-amber-400" : "bg-red-400"
                      }`}
                      style={{ width: `${Math.min((len / 200) * 100, 100)}%` }}
                    />
                  </div>
                )}

                <span className="text-[8px] text-warm-gray/60 mt-0.5 block">Key: {field.key}</span>
                <FieldStyleControls fieldKey={field.key} />
              </div>
            );
          })}

          <div className="border-t border-light-gray pt-4 mt-4">
            <p className="text-[10px] text-warm-gray leading-relaxed">
              SEO settings are applied to all public pages. Aim for green indicators on title and description length for best search performance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // POLICIES TAB (activated)
  // =============================================
  function renderPoliciesTab() {
    return (
      <div className="bg-white border border-light-gray">
        <div className="px-5 py-4 border-b border-light-gray flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-warm-gray" />
            <span className="text-xs font-medium text-charcoal">Property Policies</span>
          </div>
          <span className="text-[7px] tracking-[0.08em] uppercase bg-cream text-warm-gray border border-light-gray px-1.5 py-0.5">
            Used on: Booking Flow, Listing Pages
          </span>
        </div>
        <div className="px-5 pb-5 pt-4 space-y-5">
          {policyFields.map((policy) => {
            const val = editedValues[policy.key] || "";
            return (
              <div key={policy.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClass}>{policy.label}</label>
                  <span className="text-[8px] text-warm-gray/50 tabular-nums">{val.length} chars</span>
                </div>
                <RichTextToolbar fieldKey={policy.key} />
                <textarea
                  ref={(el) => { textareaRefs.current[policy.key] = el; }}
                  rows={4}
                  value={val}
                  onChange={(e) => updateValue(policy.key, e.target.value)}
                  placeholder={policy.placeholder}
                  className={`${inputClass} resize-none`}
                />
                {policy.note && (
                  <span className="text-[8px] text-warm-gray/60 mt-0.5 block italic">
                    {policy.note}
                  </span>
                )}
                <span className="text-[8px] text-warm-gray/60 mt-0.5 block">Key: {policy.key}</span>
                <FieldStyleControls fieldKey={policy.key} />
              </div>
            );
          })}
          <div className="border-t border-light-gray pt-4 mt-4">
            <p className="text-[10px] text-warm-gray leading-relaxed">
              Policy content displays on listing pages and booking confirmations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // TERMS & CONDITIONS TAB (new)
  // =============================================
  function renderTermsTab() {
    function syncFromPolicies() {
      if (!confirm("This will copy content from matching Policies fields into Terms & Conditions fields. Existing Terms content will be overwritten. Continue?")) {
        return;
      }
      const updated = { ...editedValues };
      Object.entries(policySyncMap).forEach(([policyKey, termsKey]) => {
        if (updated[policyKey]) {
          updated[termsKey] = updated[policyKey];
        }
      });
      setEditedValues(updated);
    }

    return (
      <div className="bg-white border border-light-gray">
        <div className="px-5 py-4 border-b border-light-gray flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-warm-gray" />
            <span className="text-xs font-medium text-charcoal">Terms & Conditions</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[7px] tracking-[0.08em] uppercase bg-cream text-warm-gray border border-light-gray px-1.5 py-0.5">
              Used on: Check-in Portal, Booking Agreement
            </span>
            <button
              onClick={syncFromPolicies}
              className="flex items-center gap-1.5 text-[9px] tracking-[0.1em] uppercase text-charcoal border border-light-gray px-3 py-1.5 hover:bg-cream transition font-medium"
            >
              <Copy size={11} /> Sync from Policies
            </button>
          </div>
        </div>
        <div className="px-5 pb-5 pt-4 space-y-5">
          {termsFields.map((field) => {
            const val = editedValues[field.key] || "";
            return (
              <div key={field.key}>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClass}>{field.label}</label>
                  <span className="text-[8px] text-warm-gray/50 tabular-nums">{val.length} chars</span>
                </div>
                <RichTextToolbar fieldKey={field.key} />
                <textarea
                  ref={(el) => { textareaRefs.current[field.key] = el; }}
                  rows={field.rows}
                  value={val}
                  onChange={(e) => updateValue(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={`${inputClass} resize-none`}
                />
                <span className="text-[8px] text-warm-gray/60 mt-0.5 block">Key: {field.key}</span>
                <FieldStyleControls fieldKey={field.key} />
              </div>
            );
          })}
          <div className="border-t border-light-gray pt-4 mt-4">
            <p className="text-[10px] text-warm-gray leading-relaxed">
              Terms content is shown during the booking agreement flow and in the check-in portal. Use &quot;Sync from Policies&quot; to pre-populate from your policy content.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // BRAND & TEXT STYLES TAB (new)
  // =============================================
  function renderBrandTab() {
    return (
      <div className="space-y-5">
        {/* Brand Colors */}
        <div className="bg-white border border-light-gray">
          <div className="px-5 py-4 border-b border-light-gray flex items-center gap-2">
            <Palette size={14} className="text-warm-gray" />
            <span className="text-xs font-medium text-charcoal">Brand Colors</span>
          </div>
          <div className="px-5 pb-5 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brandColorFields.map((field) => {
              const val = editedValues[field.key] || field.defaultVal;
              return (
                <div key={field.key}>
                  <label className={labelClass}>{field.label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={val}
                      onChange={(e) => updateValue(field.key, e.target.value)}
                      className="w-10 h-10 border border-light-gray cursor-pointer p-0 shrink-0"
                    />
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => updateValue(field.key, e.target.value)}
                      className={`${inputClass} flex-1`}
                    />
                  </div>
                  <div
                    className="mt-1.5 h-6 border border-light-gray"
                    style={{ backgroundColor: val }}
                  />
                  <span className="text-[8px] text-warm-gray/60 mt-0.5 block">Key: {field.key}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white border border-light-gray">
          <div className="px-5 py-4 border-b border-light-gray flex items-center gap-2">
            <Type size={14} className="text-warm-gray" />
            <span className="text-xs font-medium text-charcoal">Typography</span>
          </div>
          <div className="px-5 pb-5 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {brandTypographyFields.map((field) => {
              const val = editedValues[field.key] || "";
              return (
                <div key={field.key}>
                  <label className={labelClass}>{field.label}</label>
                  {field.type === "select" ? (
                    <select
                      value={val}
                      onChange={(e) => updateValue(field.key, e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Default</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={val}
                      onChange={(e) => updateValue(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  )}
                  <span className="text-[8px] text-warm-gray/60 mt-0.5 block">Key: {field.key}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spacing */}
        <div className="bg-white border border-light-gray">
          <div className="px-5 py-4 border-b border-light-gray flex items-center gap-2">
            <Settings size={14} className="text-warm-gray" />
            <span className="text-xs font-medium text-charcoal">Spacing Presets</span>
          </div>
          <div className="px-5 pb-5 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {brandSpacingFields.map((field) => {
              const val = editedValues[field.key] || "";
              return (
                <div key={field.key}>
                  <label className={labelClass}>{field.label}</label>
                  <input
                    value={val}
                    onChange={(e) => updateValue(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={inputClass}
                  />
                  <span className="text-[8px] text-warm-gray/60 mt-0.5 block">Key: {field.key}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-white border border-light-gray">
          <div className="px-5 py-4 border-b border-light-gray flex items-center gap-2">
            <Eye size={14} className="text-warm-gray" />
            <span className="text-xs font-medium text-charcoal">Live Preview</span>
          </div>
          <div className="p-5">
            <div
              className="p-8 border border-light-gray"
              style={{
                backgroundColor: editedValues["brand-background-color"] || "#faf9f6",
                color: editedValues["brand-text-color"] || "#1f2937",
                maxWidth: editedValues["brand-content-max-width"] || "100%",
                letterSpacing: editedValues["brand-letter-spacing"] || "normal",
              }}
            >
              <h2
                style={{
                  fontFamily: editedValues["brand-heading-font"] || "Playfair Display, serif",
                  fontSize: "28px",
                  fontWeight: 400,
                  color: editedValues["brand-primary-color"] || "#1a1a1a",
                  marginBottom: "12px",
                }}
              >
                Sample Heading Text
              </h2>
              <p
                style={{
                  fontFamily: editedValues["brand-body-font"] || "Inter, system-ui, sans-serif",
                  fontSize: editedValues["brand-base-font-size"] || "16px",
                  lineHeight: editedValues["brand-line-height"] || "1.6",
                  color: editedValues["brand-secondary-color"] || "#6b7280",
                }}
              >
                This is a preview of your body text with the current brand settings applied.
                Adjust the colors, fonts, and spacing above to see changes reflected here in real time.
              </p>
              <span
                style={{
                  display: "inline-block",
                  marginTop: "16px",
                  padding: "8px 20px",
                  backgroundColor: editedValues["brand-accent-color"] || "#b8860b",
                  color: "#ffffff",
                  fontFamily: editedValues["brand-body-font"] || "Inter, system-ui, sans-serif",
                  fontSize: "12px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                }}
              >
                Sample Button
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // RENDER ACTIVE TAB
  // =============================================
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
      case "terms":
        return renderTermsTab();
      case "brand":
        return renderBrandTab();
      default:
        return null;
    }
  }

  // =============================================
  // MAIN RETURN
  // =============================================
  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl text-charcoal font-light">Website Content</h1>
          {/* Publish status badge */}
          <span
            className={`flex items-center gap-1.5 text-[9px] tracking-[0.1em] uppercase font-medium px-2.5 py-1 border ${
              publishStatus === "published"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                publishStatus === "published" ? "bg-green-500" : "bg-amber-400"
              }`}
            />
            {publishStatus === "published" ? "Published" : "Draft"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* AI Assist Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAiDropdown(!showAiDropdown)}
              className="flex items-center gap-1.5 border border-light-gray text-charcoal px-4 py-2.5 text-[10px] tracking-[0.12em] uppercase font-medium hover:bg-cream transition"
            >
              <Sparkles size={13} /> AI Assist <ChevronDown size={11} />
            </button>
            {showAiDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAiDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-light-gray shadow-lg z-50 w-52">
                  <button
                    onClick={() => {
                      setShowAiDropdown(false);
                      alert("AI generation coming soon — will auto-write listing descriptions based on property details.");
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-charcoal hover:bg-cream transition flex items-center gap-2"
                  >
                    <Sparkles size={12} /> Generate Description
                  </button>
                  <button
                    onClick={() => {
                      setShowAiDropdown(false);
                      alert("AI text improvement coming soon — will enhance readability and SEO of selected content.");
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-charcoal hover:bg-cream transition flex items-center gap-2"
                  >
                    <Type size={12} /> Improve Text
                  </button>
                  <button
                    onClick={() => {
                      setShowAiDropdown(false);
                      alert("AI SEO optimization coming soon — will suggest keyword improvements and meta tag updates.");
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-charcoal hover:bg-cream transition flex items-center gap-2"
                  >
                    <Search size={12} /> SEO Optimize
                  </button>
                  <button
                    onClick={() => {
                      setShowAiDropdown(false);
                      alert("AI translation coming soon — will translate content to multiple languages.");
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-charcoal hover:bg-cream transition flex items-center gap-2"
                  >
                    <Globe size={12} /> Translate
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Preview Site Button */}
          <a
            href="/?preview=true"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 border border-light-gray text-charcoal px-4 py-2.5 text-[10px] tracking-[0.12em] uppercase font-medium hover:bg-cream transition"
          >
            <Eye size={13} /> Preview
          </a>

          {/* Save as Draft */}
          <div className="relative flex items-center">
            {hasUnsavedChanges && (
              <span className="absolute -left-2 -top-1 w-2.5 h-2.5 bg-amber-400 rounded-full z-10" />
            )}
            <button
              onClick={() => saveContent(false)}
              disabled={savingContent}
              className="flex items-center gap-2 border border-charcoal text-charcoal px-4 py-2.5 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition disabled:opacity-40"
            >
              <Save size={14} />
              {savingContent
                ? "Saving..."
                : savedContent
                ? "Saved!"
                : hasUnsavedChanges
                ? `Save Draft (${unsavedChanges.length})`
                : "Save Draft"}
            </button>
          </div>

          {/* Publish Button */}
          <button
            onClick={() => saveContent(true)}
            disabled={savingContent}
            className="flex items-center gap-2 bg-charcoal text-white px-5 py-2.5 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition disabled:opacity-40"
          >
            <Send size={14} /> Publish
          </button>
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
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
          <span className={labelClass}>Publish Status</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-2 h-2 rounded-full ${
                publishStatus === "published" ? "bg-green-500" : "bg-amber-400"
              }`}
            />
            <p className="text-sm text-charcoal font-light capitalize">{publishStatus}</p>
          </div>
        </div>
        <div className="bg-white border border-light-gray px-4 py-3">
          <span className={labelClass}>Last Published</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock size={12} className="text-warm-gray" />
            <p className="text-sm text-charcoal font-light">
              {lastPublishedAt
                ? lastPublishedAt.toLocaleDateString([], { month: "short", day: "numeric" }) +
                  " " +
                  lastPublishedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Never"}
            </p>
          </div>
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
