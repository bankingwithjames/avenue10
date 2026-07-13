"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  Film,
  Info,
  X,
  Search,
  CheckCircle,
  Grid3X3,
  List,
  ChevronDown,
  ChevronUp,
  Copy,
  Archive,
  RotateCcw,
  Replace,
  Link2,
  Eye,
  Star,
  ArrowUp,
  ArrowDown,
  Check,
  AlertTriangle,
  XCircle,
  Layers,
  HardDrive,
  Ban,
  Bookmark,
  Download,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ListingMediaItem {
  id: string;
  listing: { id: string; title: string };
  room?: string;
  label?: string;
  displayOrder: number;
  isFeatured?: boolean;
}

interface PageMediaItem {
  id: string;
  location: string;
  mediaId: string;
}

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
  listingMedia: ListingMediaItem[];
  pageMedia: PageMediaItem[];
}

interface Listing {
  id: string;
  title: string;
  slug: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const pageLocationLabels: Record<string, string> = {
  "homepage-hero": "Homepage — Hero Background Video",
  "homepage-contact": "Homepage — Contact Section Video",
  "homepage-amenities-bg": "Homepage — Amenities Background Image",
  "main-home-hero": "Main Home — Detail Page Hero",
  "garage-apartment-hero": "Garage Apartment — Detail Page Hero",
  "main-home-thumbnail": "Main Home — Browse Page Thumbnail",
  "garage-apartment-thumbnail": "Garage Apartment — Browse Page Thumbnail",
};

const ROOM_OPTIONS = [
  "Exterior",
  "Front Entrance",
  "Living Room",
  "Kitchen",
  "Dining Room",
  "Master Suite",
  "Bedroom 1",
  "Bedroom 2",
  "Bedroom 3",
  "Bathroom 1",
  "Bathroom 2",
  "Patio",
  "Backyard",
  "Parking",
  "Laundry",
  "Entertainment",
  "Workspace",
  "Amenities",
  "Neighborhood",
  "Other",
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "size-desc", label: "Size Largest" },
  { value: "size-asc", label: "Size Smallest" },
];

const ARCHIVED_KEY = "avenue10-archived-media";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getArchivedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ARCHIVED_KEY) || "[]");
  } catch {
    return [];
  }
}

function setArchivedIds(ids: string[]) {
  localStorage.setItem(ARCHIVED_KEY, JSON.stringify(ids));
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminMediaPage() {
  // Core state
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [pageMediaAssignments, setPageMediaAssignments] = useState<PageMediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  // Filters & view
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState<"all" | "in-use" | "not-used" | "archived" | "cover">("all");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);

  // Selection
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk actions
  const [showBulkAssignListing, setShowBulkAssignListing] = useState(false);
  const [showBulkSetRoom, setShowBulkSetRoom] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Archive
  const [archivedIds, setArchivedIdsState] = useState<string[]>([]);

  // Drawers
  const [replaceDrawer, setReplaceDrawer] = useState<MediaItem | null>(null);
  const [assignDrawer, setAssignDrawer] = useState<MediaItem | null>(null);
  const [usageDrawer, setUsageDrawer] = useState<MediaItem | null>(null);

  // Panels
  const [showGuide, setShowGuide] = useState(false);
  const [showCoverManager, setShowCoverManager] = useState(false);
  const [showQualityChecklist, setShowQualityChecklist] = useState(false);
  const [showGalleryOrder, setShowGalleryOrder] = useState(false);
  const [qualityChecklistListing, setQualityChecklistListing] = useState("");
  const [galleryOrderListing, setGalleryOrderListing] = useState("");
  const [galleryItems, setGalleryItems] = useState<ListingMediaItem[]>([]);

  // Replace drawer state
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceScope, setReplaceScope] = useState<"file" | "everywhere" | "selected">("file");
  const [replaceArchiveOld, setReplaceArchiveOld] = useState(true);
  const [replaceSelectedLocations, setReplaceSelectedLocations] = useState<Set<string>>(new Set());

  // Assign drawer state
  const [assignListing, setAssignListing] = useState("");
  const [assignRoom, setAssignRoom] = useState("");
  const [assignPageLocation, setAssignPageLocation] = useState("");
  const [assignUsageType, setAssignUsageType] = useState("gallery");
  const [assignDisplayOrder, setAssignDisplayOrder] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // ─── Data Loading ─────────────────────────────────────────────────────────

  const loadMedia = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/media");
      if (res.ok) setMedia(await res.json());
    } catch { /* silent */ }
  }, []);

  const loadListings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/listings");
      if (res.ok) {
        const data = await res.json();
        setListings(Array.isArray(data) ? data : data.listings || []);
      }
    } catch { /* silent */ }
  }, []);

  const loadPageMedia = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/page-media");
      if (res.ok) {
        const data = await res.json();
        setPageMediaAssignments(Array.isArray(data) ? data : []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadMedia();
    loadListings();
    loadPageMedia();
    setArchivedIdsState(getArchivedIds());
  }, [loadMedia, loadListings, loadPageMedia]);

  // ─── Upload ───────────────────────────────────────────────────────────────

  async function handleUpload(files: FileList | File[]) {
    if (!files.length) return;
    setUploading(true);
    setUploadErrors([]);

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 50 * 1024 * 1024) {
        errors.push(`${file.name}: exceeds 50MB limit`);
        continue;
      }
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"];
      if (!validTypes.includes(file.type)) {
        errors.push(`${file.name}: unsupported format (${file.type || "unknown"})`);
        continue;
      }
      validFiles.push(file);
    }

    if (errors.length) setUploadErrors(errors);

    if (validFiles.length === 0) {
      setUploading(false);
      setUploadProgress(errors.length ? "Some files were rejected." : null);
      setTimeout(() => setUploadProgress(null), 3000);
      return;
    }

    setUploadProgress(`Uploading ${validFiles.length} file(s)...`);

    const formData = new FormData();
    for (const file of validFiles) {
      formData.append("files", file);
    }

    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: formData });
      if (res.ok) {
        setUploadProgress(`${validFiles.length} file(s) uploaded successfully!`);
        loadMedia();
        setTimeout(() => { setUploadProgress(null); setUploadErrors([]); }, 3000);
      } else {
        setUploadProgress("Upload failed. Please try again.");
        setTimeout(() => setUploadProgress(null), 3000);
      }
    } catch {
      setUploadProgress("Upload failed. Please try again.");
      setTimeout(() => setUploadProgress(null), 3000);
    }
    setUploading(false);
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will also remove it from any listing galleries or page assignments.`)) return;
    await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    loadMedia();
  }

  async function handleBulkDelete() {
    if (deleteConfirmText !== "DELETE") return;
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    }
    setSelectedIds(new Set());
    loadMedia();
  }

  // ─── Archive ──────────────────────────────────────────────────────────────

  function archiveItem(id: string) {
    const updated = [...archivedIds, id];
    setArchivedIdsState(updated);
    setArchivedIds(updated);
  }

  function restoreItem(id: string) {
    const updated = archivedIds.filter((i) => i !== id);
    setArchivedIdsState(updated);
    setArchivedIds(updated);
  }

  function handleBulkArchive() {
    const updated = [...new Set([...archivedIds, ...selectedIds])];
    setArchivedIdsState(updated);
    setArchivedIds(updated);
    setSelectedIds(new Set());
  }

  // ─── Selection ────────────────────────────────────────────────────────────

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  // ─── Assign Actions ───────────────────────────────────────────────────────

  async function handleAssignToListing(mediaId: string, listingId: string, room?: string) {
    try {
      await fetch("/api/admin/listing-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, listingId, room: room || undefined, displayOrder: assignDisplayOrder }),
      });
      loadMedia();
    } catch { /* silent */ }
  }

  async function handleAssignToPage(mediaId: string, location: string) {
    try {
      await fetch("/api/admin/page-media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, mediaId }),
      });
      loadMedia();
      loadPageMedia();
    } catch { /* silent */ }
  }

  async function handleRemoveListingMedia(listingMediaId: string) {
    try {
      await fetch(`/api/admin/listing-media?id=${listingMediaId}`, { method: "DELETE" });
      loadMedia();
    } catch { /* silent */ }
  }

  async function handleRemovePageMedia(location: string) {
    try {
      await fetch("/api/admin/page-media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, mediaId: null }),
      });
      loadMedia();
      loadPageMedia();
    } catch { /* silent */ }
  }

  // ─── Bulk Assign ──────────────────────────────────────────────────────────

  async function handleBulkAssignListing(listingId: string) {
    for (const mediaId of selectedIds) {
      await handleAssignToListing(mediaId, listingId);
    }
    setShowBulkAssignListing(false);
    setSelectedIds(new Set());
  }

  async function handleBulkSetRoom(room: string) {
    // For bulk room set, we'd need to update existing listing media entries
    // For now, we'll just assign to the first listing if there's a property filter
    setShowBulkSetRoom(false);
    setSelectedIds(new Set());
  }

  // ─── Gallery Order ────────────────────────────────────────────────────────

  async function loadGalleryForListing(listingId: string) {
    if (!listingId) { setGalleryItems([]); return; }
    try {
      const res = await fetch(`/api/admin/listing-media?listingId=${listingId}`);
      if (res.ok) {
        const data = await res.json();
        setGalleryItems(Array.isArray(data) ? data : []);
      }
    } catch { /* silent */ }
  }

  async function handleReorderGallery(itemId: string, direction: "up" | "down") {
    const idx = galleryItems.findIndex((i) => i.id === itemId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= galleryItems.length) return;

    const updated = [...galleryItems];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    updated.forEach((item, i) => { item.displayOrder = i; });
    setGalleryItems(updated);

    // Save order
    try {
      await fetch("/api/admin/listing-media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: updated[idx].id, displayOrder: updated[idx].displayOrder }),
      });
      await fetch("/api/admin/listing-media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: updated[swapIdx].id, displayOrder: updated[swapIdx].displayOrder }),
      });
    } catch { /* silent */ }
  }

  // ─── Replace ──────────────────────────────────────────────────────────────

  async function handleReplace() {
    if (!replaceDrawer || !replaceFile) return;
    const formData = new FormData();
    formData.append("files", replaceFile);

    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: formData });
      if (res.ok) {
        if (replaceArchiveOld) archiveItem(replaceDrawer.id);
        setReplaceDrawer(null);
        setReplaceFile(null);
        loadMedia();
        alert("New file uploaded successfully. The old file has been archived.");
      }
    } catch {
      alert("Replace failed. Please try again.");
    }
  }

  // ─── Download ─────────────────────────────────────────────────────────────

  function handleDownload(url: string, filename: string) {
    const downloadUrl = `/api/admin/media/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    window.open(downloadUrl, "_blank");
  }

  // ─── Drop Handler ─────────────────────────────────────────────────────────

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }

  // ─── Filtering & Sorting ──────────────────────────────────────────────────

  const isArchived = (id: string) => archivedIds.includes(id);
  const isInUse = (m: MediaItem) => m.listingMedia.length > 0 || m.pageMedia.length > 0;
  const isCoverPhoto = (m: MediaItem) => m.pageMedia.some((pm) => pageLocationLabels[pm.location]);

  const filtered = media
    .filter((m) => {
      // Type filter
      if (typeFilter === "image" && !m.mimeType.startsWith("image/")) return false;
      if (typeFilter === "video" && !m.mimeType.startsWith("video/")) return false;

      // Status filter
      if (statusFilter === "archived") return isArchived(m.id);
      if (statusFilter !== "all" && isArchived(m.id)) return false;
      if (statusFilter === "in-use" && !isInUse(m)) return false;
      if (statusFilter === "not-used" && isInUse(m)) return false;
      if (statusFilter === "cover" && !isCoverPhoto(m)) return false;


      // Property filter
      if (propertyFilter) {
        const hasListing = m.listingMedia.some((lm) => lm.listing.id === propertyFilter);
        if (!hasListing) return false;
      }

      // Room filter
      if (roomFilter) {
        const hasRoom = m.listingMedia.some((lm) => lm.room === roomFilter);
        if (!hasRoom) return false;
      }

      // Search
      if (search) {
        const q = search.toLowerCase();
        return m.originalName.toLowerCase().includes(q) || m.filename.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "name-asc": return a.originalName.localeCompare(b.originalName);
        case "name-desc": return b.originalName.localeCompare(a.originalName);
        case "size-desc": return b.size - a.size;
        case "size-asc": return a.size - b.size;
        default: return 0;
      }
    });

  // ─── Stats ────────────────────────────────────────────────────────────────

  const imageCount = media.filter((m) => m.mimeType.startsWith("image/")).length;
  const videoCount = media.filter((m) => m.mimeType.startsWith("video/")).length;
  const totalSize = media.reduce((acc, m) => acc + m.size, 0);
  const inUseCount = media.filter((m) => isInUse(m)).length;
  const notUsedCount = media.filter((m) => !isInUse(m) && !isArchived(m.id)).length;
  const archivedCount = archivedIds.length;

  // ─── Styles ───────────────────────────────────────────────────────────────

  const inputClass = "w-full bg-transparent border border-light-gray text-charcoal text-sm px-3 py-2.5 outline-none focus:border-charcoal/40 transition-colors";
  const labelClass = "text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1 block";
  const btnPrimary = "bg-charcoal text-white px-5 py-2.5 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition-colors";
  const btnSecondary = "bg-white text-charcoal border border-light-gray px-4 py-2.5 text-[10px] tracking-[0.12em] uppercase font-medium hover:bg-cream transition-colors";
  const pillActive = "bg-charcoal text-white px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase font-medium transition-colors";
  const pillInactive = "bg-white text-charcoal border border-light-gray px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase font-medium hover:bg-cream transition-colors";

  // ─── Quality Checklist Logic ──────────────────────────────────────────────

  function getQualityChecklist(listingId: string) {
    const listingMedia = media.filter((m) => m.listingMedia.some((lm) => lm.listing.id === listingId));
    const rooms = listingMedia.flatMap((m) => m.listingMedia.filter((lm) => lm.listing.id === listingId).map((lm) => lm.room));
    const hasCover = media.some((m) => m.listingMedia.some((lm) => lm.listing.id === listingId && lm.displayOrder === 0));

    return [
      { label: "Has cover photo", passed: hasCover },
      { label: "Has exterior photo", passed: rooms.includes("Exterior") },
      { label: "Has kitchen photo", passed: rooms.includes("Kitchen") },
      { label: "Has living room photo", passed: rooms.includes("Living Room") },
      { label: "Has bedroom photos", passed: rooms.some((r) => r?.startsWith("Bedroom") || r === "Master Suite") },
      { label: "Has bathroom photos", passed: rooms.some((r) => r?.startsWith("Bathroom")) },
      { label: "Has 15+ photos", passed: listingMedia.length >= 15 },
      { label: "All photos have alt text", passed: false },
    ];
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-charcoal font-light">Photo &amp; Video Control Center</h1>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-warm-gray hover:text-charcoal transition-colors font-medium"
        >
          <Info size={14} /> {showGuide ? "Hide" : "Media"} Requirements
        </button>
      </div>

      {/* Media Requirements Panel */}
      {showGuide && (
        <div className="bg-white border border-light-gray p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-charcoal">Media Requirements</h2>
            <button onClick={() => setShowGuide(false)}><X size={16} className="text-warm-gray" /></button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-[10px] tracking-[0.15em] uppercase text-accent font-medium mb-3">Recommended Dimensions</h3>
              <ul className="space-y-2 text-xs text-charcoal/70">
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Hero/Banner:</strong> 1920 x 1080px (16:9)</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Gallery:</strong> 1200 x 900px (4:3)</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Thumbnail:</strong> 800 x 600px (4:3)</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>SEO Images:</strong> 1200 x 630px (OG)</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[10px] tracking-[0.15em] uppercase text-accent font-medium mb-3">Photos</h3>
              <ul className="space-y-2 text-xs text-charcoal/70">
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Format:</strong> JPG or WebP, PNG for graphics</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>File Size:</strong> Under 500KB per photo</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Quality:</strong> 80-85% JPG quality</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Lighting:</strong> Natural daylight preferred</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[10px] tracking-[0.15em] uppercase text-accent font-medium mb-3">Videos</h3>
              <ul className="space-y-2 text-xs text-charcoal/70">
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Format:</strong> MP4 (H.264 codec)</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Resolution:</strong> 1920 x 1080 (1080p)</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Duration:</strong> 10-30s for backgrounds</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>File Size:</strong> Under 15MB</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-cream text-xs text-charcoal/60">
            <strong>Pro Tips:</strong> Shoot in landscape orientation. Avoid harsh flash. Declutter rooms before photographing. Take multiple angles of each room. Golden hour gives warmest exterior shots. Steady, slow panning shots work best as background loops.
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-white border border-light-gray p-4">
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon size={14} className="text-warm-gray" />
            <span className={labelClass}>Photos</span>
          </div>
          <p className="text-lg font-medium text-charcoal">{imageCount}</p>
        </div>
        <div className="bg-white border border-light-gray p-4">
          <div className="flex items-center gap-2 mb-1">
            <Film size={14} className="text-warm-gray" />
            <span className={labelClass}>Videos</span>
          </div>
          <p className="text-lg font-medium text-charcoal">{videoCount}</p>
        </div>
        <div className="bg-white border border-light-gray p-4">
          <div className="flex items-center gap-2 mb-1">
            <HardDrive size={14} className="text-warm-gray" />
            <span className={labelClass}>Total Size</span>
          </div>
          <p className="text-lg font-medium text-charcoal">{formatBytes(totalSize)}</p>
        </div>
        <div className="bg-white border border-light-gray p-4">
          <div className="flex items-center gap-2 mb-1">
            <Link2 size={14} className="text-warm-gray" />
            <span className={labelClass}>In Use</span>
          </div>
          <p className="text-lg font-medium text-charcoal">{inUseCount}</p>
        </div>
        <div className="bg-white border border-light-gray p-4">
          <div className="flex items-center gap-2 mb-1">
            <Ban size={14} className="text-warm-gray" />
            <span className={labelClass}>Not Used</span>
          </div>
          <p className="text-lg font-medium text-charcoal">{notUsedCount}</p>
        </div>
        <div className="bg-white border border-light-gray p-4">
          <div className="flex items-center gap-2 mb-1">
            <Archive size={14} className="text-warm-gray" />
            <span className={labelClass}>Archived</span>
          </div>
          <p className="text-lg font-medium text-charcoal">{archivedCount}</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed p-8 mb-6 text-center transition-colors ${
          dragOver ? "border-accent bg-accent/5" : "border-light-gray bg-white hover:border-warm-gray"
        }`}
      >
        <Upload size={28} className="mx-auto text-warm-gray mb-3" />
        <p className="text-sm text-charcoal mb-1">Drag &amp; drop files here</p>
        <p className="text-xs text-warm-gray mb-4">JPG, PNG, WebP, MP4, WebM — up to 50MB per file</p>
        <label className={`inline-block ${btnPrimary} cursor-pointer`}>
          {uploading ? "Uploading..." : "Browse Files"}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/mp4,video/webm"
            className="hidden"
            disabled={uploading}
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
        </label>
        {uploadProgress && (
          <p className="text-xs text-accent mt-3">{uploadProgress}</p>
        )}
        {uploadErrors.length > 0 && (
          <div className="mt-3 text-left max-w-md mx-auto">
            {uploadErrors.map((err, i) => (
              <p key={i} className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle size={10} /> {err}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-light-gray p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by filename..."
              className={`${inputClass} pl-9`}
            />
          </div>

          {/* Type filters */}
          <div className="flex gap-1">
            {(["all", "image", "video"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={typeFilter === t ? pillActive : pillInactive}
              >
                {t === "all" ? "All" : t === "image" ? "Photos" : "Videos"}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex gap-1 border border-light-gray">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${viewMode === "grid" ? "bg-charcoal text-white" : "text-warm-gray hover:text-charcoal"}`}
            >
              <Grid3X3 size={14} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${viewMode === "list" ? "bg-charcoal text-white" : "text-warm-gray hover:text-charcoal"}`}
            >
              <List size={14} />
            </button>
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className={btnSecondary + " flex items-center gap-1"}
            >
              Sort <ChevronDown size={10} />
            </button>
            {showSortDropdown && (
              <div className="absolute top-full mt-1 right-0 bg-white border border-light-gray shadow-lg z-20 min-w-[160px]">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setShowSortDropdown(false); }}
                    className={`block w-full text-left px-4 py-2 text-xs hover:bg-cream transition-colors ${sortBy === opt.value ? "text-charcoal font-medium" : "text-warm-gray"}`}
                  >
                    {opt.label} {sortBy === opt.value && <Check size={10} className="inline ml-1" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Select toggle */}
          <button
            onClick={() => { setSelectMode(!selectMode); if (selectMode) deselectAll(); }}
            className={selectMode ? pillActive : pillInactive}
          >
            {selectMode ? "Cancel" : "Select"}
          </button>
        </div>

        {/* Second row: advanced filters */}
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-light-gray">
          {/* Property filter */}
          <div className="relative">
            <button
              onClick={() => setShowPropertyDropdown(!showPropertyDropdown)}
              className={`${btnSecondary} flex items-center gap-1 ${propertyFilter ? "border-charcoal" : ""}`}
            >
              {propertyFilter ? listings.find((l) => l.id === propertyFilter)?.title || "Property" : "Property"} <ChevronDown size={10} />
            </button>
            {showPropertyDropdown && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-light-gray shadow-lg z-20 min-w-[200px] max-h-[200px] overflow-y-auto">
                <button
                  onClick={() => { setPropertyFilter(""); setShowPropertyDropdown(false); }}
                  className="block w-full text-left px-4 py-2 text-xs text-warm-gray hover:bg-cream"
                >
                  All Properties
                </button>
                {listings.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => { setPropertyFilter(l.id); setShowPropertyDropdown(false); }}
                    className={`block w-full text-left px-4 py-2 text-xs hover:bg-cream ${propertyFilter === l.id ? "text-charcoal font-medium" : "text-warm-gray"}`}
                  >
                    {l.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Room filter */}
          <div className="relative">
            <button
              onClick={() => setShowRoomDropdown(!showRoomDropdown)}
              className={`${btnSecondary} flex items-center gap-1 ${roomFilter ? "border-charcoal" : ""}`}
            >
              {roomFilter || "Room"} <ChevronDown size={10} />
            </button>
            {showRoomDropdown && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-light-gray shadow-lg z-20 min-w-[180px] max-h-[250px] overflow-y-auto">
                <button
                  onClick={() => { setRoomFilter(""); setShowRoomDropdown(false); }}
                  className="block w-full text-left px-4 py-2 text-xs text-warm-gray hover:bg-cream"
                >
                  All Rooms
                </button>
                {ROOM_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setRoomFilter(r); setShowRoomDropdown(false); }}
                    className={`block w-full text-left px-4 py-2 text-xs hover:bg-cream ${roomFilter === r ? "text-charcoal font-medium" : "text-warm-gray"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status filter */}
          <div className="flex gap-1">
            {([
              { value: "all", label: "All" },
              { value: "in-use", label: "In Use" },
              { value: "not-used", label: "Not Used" },
              { value: "archived", label: "Archived" },
              { value: "cover", label: "Cover Photos" },
            ] as const).map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={statusFilter === s.value ? pillActive : pillInactive}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Media Grid / List */}
      {filtered.length === 0 ? (
        <p className="text-warm-gray text-sm text-center py-12">No media files found.</p>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              selectMode={selectMode}
              isSelected={selectedIds.has(item.id)}
              isArchived={isArchived(item.id)}
              isCover={isCoverPhoto(item)}
              isInUse={isInUse(item)}
              onToggleSelect={() => toggleSelect(item.id)}
              onReplace={() => { setReplaceDrawer(item); setReplaceFile(null); }}
              onAssign={() => { setAssignDrawer(item); setAssignListing(""); setAssignRoom(""); setAssignPageLocation(""); }}
              onViewUsage={() => setUsageDrawer(item)}
              onArchive={() => archiveItem(item.id)}
              onRestore={() => restoreItem(item.id)}
              onDownload={() => handleDownload(item.url, item.originalName)}
              onCopyUrl={() => navigator.clipboard.writeText(item.url)}
              onDelete={() => handleDelete(item.id, item.originalName)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-light-gray">
          {/* List header */}
          <div className="grid grid-cols-[40px_60px_1fr_80px_80px_100px_1fr_120px] gap-2 px-4 py-2 border-b border-light-gray text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
            <span></span>
            <span>Preview</span>
            <span>Filename</span>
            <span>Type</span>
            <span>Size</span>
            <span>Room</span>
            <span>Usage</span>
            <span>Actions</span>
          </div>
          {filtered.map((item) => (
            <div key={item.id} className="grid grid-cols-[40px_60px_1fr_80px_80px_100px_1fr_120px] gap-2 px-4 py-2 border-b border-light-gray items-center hover:bg-cream/50 transition-colors">
              {/* Checkbox */}
              <div>
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="w-3.5 h-3.5"
                  />
                )}
              </div>
              {/* Thumbnail */}
              <div className="w-[50px] h-[38px] bg-light-gray overflow-hidden">
                {item.mimeType.startsWith("video/") ? (
                  <video muted className="w-full h-full object-cover"><source src={item.url} type={item.mimeType} /></video>
                ) : (
                  <img src={item.url} alt={item.originalName} className="w-full h-full object-cover" />
                )}
              </div>
              {/* Filename */}
              <div className="truncate">
                <p className="text-xs text-charcoal truncate">{item.originalName}</p>
                <div className="flex gap-1 mt-0.5">
                  {isInUse(item) && <span className="text-[7px] tracking-[0.1em] uppercase font-bold px-1 py-0.5 bg-green-50 text-green-700 border border-green-200">IN USE</span>}
                  {isCoverPhoto(item) && <span className="text-[7px] tracking-[0.1em] uppercase font-bold px-1 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">COVER</span>}
                  {isArchived(item.id) && <span className="text-[7px] tracking-[0.1em] uppercase font-bold px-1 py-0.5 bg-gray-100 text-gray-500 border border-gray-200">ARCHIVED</span>}
                  {!isInUse(item) && !isArchived(item.id) && <span className="text-[7px] tracking-[0.1em] uppercase font-bold px-1 py-0.5 text-red-500 border border-red-200">NOT USED</span>}
                </div>
              </div>
              {/* Type */}
              <span className="text-[9px] tracking-[0.1em] uppercase text-warm-gray">
                {item.mimeType.startsWith("video/") ? "Video" : "Photo"}
              </span>
              {/* Size */}
              <span className="text-xs text-warm-gray">{formatBytes(item.size)}</span>
              {/* Room */}
              <span className="text-[9px] text-warm-gray truncate">
                {item.listingMedia[0]?.room || "—"}
              </span>
              {/* Usage */}
              <div className="text-[9px] text-warm-gray truncate">
                {item.listingMedia.length > 0 && <span>Listing: {item.listingMedia.map((lm) => lm.listing.title).join(", ")}</span>}
                {item.pageMedia.length > 0 && <span>{item.listingMedia.length > 0 ? " | " : ""}Page: {item.pageMedia.map((pm) => pm.location).join(", ")}</span>}
                {!isInUse(item) && "—"}
              </div>
              {/* Actions */}
              <div className="flex gap-1">
                <button onClick={() => { setAssignDrawer(item); setAssignListing(""); setAssignRoom(""); setAssignPageLocation(""); }} className="text-warm-gray hover:text-charcoal p-1" title="Assign"><Link2 size={12} /></button>
                <button onClick={() => setUsageDrawer(item)} className="text-warm-gray hover:text-charcoal p-1" title="View Usage"><Eye size={12} /></button>
                <button onClick={() => handleDownload(item.url, item.originalName)} className="text-warm-gray hover:text-charcoal p-1" title="Download"><Download size={12} /></button>
                <button onClick={() => navigator.clipboard.writeText(item.url)} className="text-warm-gray hover:text-charcoal p-1" title="Copy URL"><Copy size={12} /></button>
                <button onClick={() => handleDelete(item.id, item.originalName)} className="text-warm-gray hover:text-red-500 p-1" title="Delete"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cover Photo Manager */}
      <div className="mt-8">
        <button
          onClick={() => setShowCoverManager(!showCoverManager)}
          className="flex items-center gap-2 text-sm font-medium text-charcoal mb-3"
        >
          {showCoverManager ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Cover Photos
        </button>
        {showCoverManager && (
          <div className="bg-white border border-light-gray p-6">
            <p className={labelClass + " mb-4"}>Page Location Assignments</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(pageLocationLabels).map(([location, label]) => {
                const assigned = pageMediaAssignments.find((pm) => pm.location === location);
                const assignedMedia = assigned ? media.find((m) => m.id === assigned.mediaId) : null;
                return (
                  <div key={location} className="border border-light-gray p-3">
                    <p className="text-[9px] tracking-[0.12em] uppercase text-warm-gray font-medium mb-2">{label}</p>
                    <div className="aspect-video bg-light-gray mb-2 overflow-hidden">
                      {assignedMedia ? (
                        assignedMedia.mimeType.startsWith("video/") ? (
                          <video muted loop playsInline autoPlay className="w-full h-full object-cover"><source src={assignedMedia.url} type={assignedMedia.mimeType} /></video>
                        ) : (
                          <img src={assignedMedia.url} alt={assignedMedia.originalName} className="w-full h-full object-cover" />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-warm-gray">
                          <ImageIcon size={24} />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-charcoal truncate mb-2">{assignedMedia?.originalName || "Not assigned"}</p>
                    <button
                      onClick={() => {
                        // Open assign drawer to set page media
                        const dummyMedia = assignedMedia || media[0];
                        if (dummyMedia) {
                          setAssignDrawer(dummyMedia);
                          setAssignPageLocation(location);
                        }
                      }}
                      className={btnSecondary + " w-full text-center"}
                    >
                      {assignedMedia ? "Change" : "Assign"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Photo Quality Checklist */}
      <div className="mt-6">
        <button
          onClick={() => setShowQualityChecklist(!showQualityChecklist)}
          className="flex items-center gap-2 text-sm font-medium text-charcoal mb-3"
        >
          {showQualityChecklist ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Photo Quality Checklist
        </button>
        {showQualityChecklist && (
          <div className="bg-white border border-light-gray p-6">
            <div className="mb-4">
              <label className={labelClass}>Select Listing</label>
              <select
                value={qualityChecklistListing}
                onChange={(e) => setQualityChecklistListing(e.target.value)}
                className={inputClass}
              >
                <option value="">Choose a listing...</option>
                {listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </div>
            {qualityChecklistListing && (
              <div className="space-y-2">
                {getQualityChecklist(qualityChecklistListing).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {item.passed ? (
                      <CheckCircle size={14} className="text-green-600" />
                    ) : (
                      <XCircle size={14} className="text-red-400" />
                    )}
                    <span className={item.passed ? "text-charcoal" : "text-warm-gray"}>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gallery Order Manager */}
      <div className="mt-6">
        <button
          onClick={() => setShowGalleryOrder(!showGalleryOrder)}
          className="flex items-center gap-2 text-sm font-medium text-charcoal mb-3"
        >
          {showGalleryOrder ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Gallery Order Manager
        </button>
        {showGalleryOrder && (
          <div className="bg-white border border-light-gray p-6">
            <div className="mb-4">
              <label className={labelClass}>Select Listing</label>
              <select
                value={galleryOrderListing}
                onChange={(e) => { setGalleryOrderListing(e.target.value); loadGalleryForListing(e.target.value); }}
                className={inputClass}
              >
                <option value="">Choose a listing...</option>
                {listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </div>
            {galleryOrderListing && galleryItems.length > 0 && (
              <div>
                <p className="text-xs text-warm-gray mb-3">{galleryItems.length} items in gallery</p>
                <div className="space-y-2">
                  {galleryItems.sort((a, b) => a.displayOrder - b.displayOrder).map((item, idx) => {
                    const mediaItem = media.find((m) => m.listingMedia.some((lm) => lm.id === item.id));
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-2 border border-light-gray">
                        <span className="text-[10px] text-warm-gray w-6 text-center">{idx + 1}</span>
                        <div className="w-[50px] h-[38px] bg-light-gray overflow-hidden shrink-0">
                          {mediaItem && (mediaItem.mimeType?.startsWith("video/") ? (
                            <video src={mediaItem.url} className="w-full h-full object-cover" muted />
                          ) : (
                            <img src={mediaItem.url} alt="" className="w-full h-full object-cover" />
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-charcoal truncate">{mediaItem?.originalName || "Unknown"}</p>
                          {item.room && <p className="text-[9px] text-warm-gray">{item.room}</p>}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleReorderGallery(item.id, "up")}
                            disabled={idx === 0}
                            className="p-1 text-warm-gray hover:text-charcoal disabled:opacity-30"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={() => handleReorderGallery(item.id, "down")}
                            disabled={idx === galleryItems.length - 1}
                            className="p-1 text-warm-gray hover:text-charcoal disabled:opacity-30"
                          >
                            <ArrowDown size={12} />
                          </button>
                          {idx === 0 && (
                            <span className="text-[7px] tracking-[0.1em] uppercase font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 self-center">COVER</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {galleryOrderListing && galleryItems.length === 0 && (
              <p className="text-xs text-warm-gray">No gallery items for this listing.</p>
            )}
          </div>
        )}
      </div>

      {/* ═══ Bulk Actions Bar ═══ */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-charcoal text-white px-6 py-4 flex items-center gap-4 z-40 shadow-xl">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="flex-1 flex items-center gap-2 flex-wrap">
            {/* Assign to Listing */}
            <div className="relative">
              <button onClick={() => setShowBulkAssignListing(!showBulkAssignListing)} className="px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase font-medium bg-white/10 hover:bg-white/20 transition-colors">
                Assign to Listing
              </button>
              {showBulkAssignListing && (
                <div className="absolute bottom-full mb-2 left-0 bg-white border border-light-gray shadow-lg min-w-[200px] max-h-[200px] overflow-y-auto">
                  {listings.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => handleBulkAssignListing(l.id)}
                      className="block w-full text-left px-4 py-2 text-xs text-charcoal hover:bg-cream"
                    >
                      {l.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Set Room */}
            <div className="relative">
              <button onClick={() => setShowBulkSetRoom(!showBulkSetRoom)} className="px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase font-medium bg-white/10 hover:bg-white/20 transition-colors">
                Set Room
              </button>
              {showBulkSetRoom && (
                <div className="absolute bottom-full mb-2 left-0 bg-white border border-light-gray shadow-lg min-w-[180px] max-h-[250px] overflow-y-auto">
                  {ROOM_OPTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => handleBulkSetRoom(r)}
                      className="block w-full text-left px-4 py-2 text-xs text-charcoal hover:bg-cream"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Archive */}
            <button onClick={handleBulkArchive} className="px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase font-medium bg-white/10 hover:bg-white/20 transition-colors">
              Archive
            </button>

            {/* Delete */}
            <button onClick={() => setShowDeleteConfirm(true)} className="px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase font-medium bg-red-500/80 hover:bg-red-500 transition-colors">
              Delete
            </button>

            {/* Set as Cover */}
            <button
              onClick={() => {
                if (selectedIds.size === 1) {
                  const mediaId = Array.from(selectedIds)[0];
                  const item = media.find((m) => m.id === mediaId);
                  if (item) { setAssignDrawer(item); setAssignPageLocation(""); }
                }
              }}
              className="px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase font-medium bg-white/10 hover:bg-white/20 transition-colors"
            >
              Set as Cover
            </button>
          </div>

          <button onClick={deselectAll} className="px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase font-medium border border-white/30 hover:bg-white/10 transition-colors">
            Deselect All
          </button>
        </div>
      )}

      {/* ═══ Delete Confirmation Modal ═══ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-light-gray p-6 max-w-sm w-full">
            <h3 className="text-sm font-medium text-charcoal mb-2">Confirm Deletion</h3>
            <p className="text-xs text-warm-gray mb-4">
              You are about to delete {selectedIds.size} file(s). This action cannot be undone. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className={inputClass + " mb-4"}
            />
            <div className="flex gap-2">
              <button onClick={handleBulkDelete} disabled={deleteConfirmText !== "DELETE"} className={`${btnPrimary} ${deleteConfirmText !== "DELETE" ? "opacity-40 cursor-not-allowed" : ""}`}>
                Delete {selectedIds.size} Files
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }} className={btnSecondary}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Replace Drawer ═══ */}
      {replaceDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setReplaceDrawer(null)} />
          <div className="w-[480px] bg-white border-l border-light-gray h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-charcoal">Replace Media</h2>
              <button onClick={() => setReplaceDrawer(null)}><X size={16} className="text-warm-gray" /></button>
            </div>

            {/* Current photo */}
            <div className="mb-6">
              <p className={labelClass}>Current File</p>
              <div className="aspect-video bg-light-gray overflow-hidden mb-2">
                {replaceDrawer.mimeType.startsWith("video/") ? (
                  <video muted loop playsInline autoPlay className="w-full h-full object-cover"><source src={replaceDrawer.url} type={replaceDrawer.mimeType} /></video>
                ) : (
                  <img src={replaceDrawer.url} alt={replaceDrawer.originalName} className="w-full h-full object-cover" />
                )}
              </div>
              <p className="text-xs text-charcoal">{replaceDrawer.originalName}</p>
              <p className="text-[10px] text-warm-gray">{formatBytes(replaceDrawer.size)}</p>
            </div>

            {/* Upload new */}
            <div className="mb-6">
              <p className={labelClass}>Upload Replacement</p>
              <div className="border-2 border-dashed border-light-gray p-4 text-center">
                {replaceFile ? (
                  <div>
                    <p className="text-xs text-charcoal">{replaceFile.name}</p>
                    <p className="text-[10px] text-warm-gray">{formatBytes(replaceFile.size)}</p>
                    <button onClick={() => setReplaceFile(null)} className="text-[10px] text-red-400 mt-1">Remove</button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload size={20} className="mx-auto text-warm-gray mb-2" />
                    <p className="text-xs text-warm-gray">Click to select file</p>
                    <input
                      ref={replaceFileInputRef}
                      type="file"
                      accept="image/*,video/mp4,video/webm"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && setReplaceFile(e.target.files[0])}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Where is this used */}
            <div className="mb-6">
              <p className={labelClass}>Where Is This Used?</p>
              <div className="space-y-2">
                {replaceDrawer.listingMedia.map((lm) => (
                  <div key={lm.id} className="flex items-center justify-between p-2 border border-light-gray text-xs">
                    <span className="text-charcoal">Listing: {lm.listing.title}{lm.room ? ` (${lm.room})` : ""}</span>
                  </div>
                ))}
                {replaceDrawer.pageMedia.map((pm) => (
                  <div key={pm.id} className="flex items-center justify-between p-2 border border-light-gray text-xs">
                    <span className="text-charcoal">Page: {pageLocationLabels[pm.location] || pm.location}</span>
                  </div>
                ))}
                {replaceDrawer.listingMedia.length === 0 && replaceDrawer.pageMedia.length === 0 && (
                  <p className="text-xs text-warm-gray">Not currently assigned anywhere.</p>
                )}
              </div>
            </div>

            {/* Replacement scope */}
            <div className="mb-6">
              <p className={labelClass}>Replacement Scope</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-charcoal cursor-pointer">
                  <input type="radio" name="replaceScope" checked={replaceScope === "file"} onChange={() => setReplaceScope("file")} className="w-3.5 h-3.5" />
                  Replace file only (all usages update automatically)
                </label>
                <label className="flex items-center gap-2 text-xs text-charcoal cursor-pointer">
                  <input type="radio" name="replaceScope" checked={replaceScope === "everywhere"} onChange={() => setReplaceScope("everywhere")} className="w-3.5 h-3.5" />
                  Replace everywhere
                </label>
                <label className="flex items-center gap-2 text-xs text-charcoal cursor-pointer">
                  <input type="radio" name="replaceScope" checked={replaceScope === "selected"} onChange={() => setReplaceScope("selected")} className="w-3.5 h-3.5" />
                  Replace only selected locations
                </label>
              </div>
            </div>

            {/* Archive old */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-xs text-charcoal cursor-pointer">
                <input type="checkbox" checked={replaceArchiveOld} onChange={(e) => setReplaceArchiveOld(e.target.checked)} className="w-3.5 h-3.5" />
                Archive old version
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={handleReplace} disabled={!replaceFile} className={`${btnPrimary} ${!replaceFile ? "opacity-40 cursor-not-allowed" : ""}`}>
                Replace
              </button>
              <button onClick={() => setReplaceDrawer(null)} className={btnSecondary}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Assign Drawer ═══ */}
      {assignDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setAssignDrawer(null)} />
          <div className="w-[480px] bg-white border-l border-light-gray h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-charcoal">Assign Media</h2>
              <button onClick={() => setAssignDrawer(null)}><X size={16} className="text-warm-gray" /></button>
            </div>

            {/* Preview */}
            <div className="aspect-video bg-light-gray overflow-hidden mb-4">
              {assignDrawer.mimeType.startsWith("video/") ? (
                <video muted loop playsInline autoPlay className="w-full h-full object-cover"><source src={assignDrawer.url} type={assignDrawer.mimeType} /></video>
              ) : (
                <img src={assignDrawer.url} alt={assignDrawer.originalName} className="w-full h-full object-cover" />
              )}
            </div>
            <p className="text-xs text-charcoal mb-4">{assignDrawer.originalName}</p>

            {/* Current assignments */}
            {(assignDrawer.listingMedia.length > 0 || assignDrawer.pageMedia.length > 0) && (
              <div className="mb-6">
                <p className={labelClass}>Current Assignments</p>
                <div className="space-y-1">
                  {assignDrawer.listingMedia.map((lm) => (
                    <div key={lm.id} className="flex items-center justify-between p-2 border border-light-gray text-xs">
                      <span>Listing: {lm.listing.title}{lm.room ? ` — ${lm.room}` : ""}</span>
                      <button onClick={() => handleRemoveListingMedia(lm.id)} className="text-red-400 hover:text-red-600"><X size={12} /></button>
                    </div>
                  ))}
                  {assignDrawer.pageMedia.map((pm) => (
                    <div key={pm.id} className="flex items-center justify-between p-2 border border-light-gray text-xs">
                      <span>Page: {pageLocationLabels[pm.location] || pm.location}</span>
                      <button onClick={() => handleRemovePageMedia(pm.location)} className="text-red-400 hover:text-red-600"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assign to section */}
            <div className="space-y-4 mb-6">
              <p className={labelClass}>Assign To</p>

              {/* Property/Listing */}
              <div>
                <label className={labelClass}>Property / Listing</label>
                <select value={assignListing} onChange={(e) => setAssignListing(e.target.value)} className={inputClass}>
                  <option value="">Select listing...</option>
                  {listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                </select>
              </div>

              {/* Room */}
              <div>
                <label className={labelClass}>Room</label>
                <select value={assignRoom} onChange={(e) => setAssignRoom(e.target.value)} className={inputClass}>
                  <option value="">Select room...</option>
                  {ROOM_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Page Location */}
              <div>
                <label className={labelClass}>Page Location</label>
                <select value={assignPageLocation} onChange={(e) => setAssignPageLocation(e.target.value)} className={inputClass}>
                  <option value="">Select location...</option>
                  {Object.entries(pageLocationLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Usage Type */}
              <div>
                <label className={labelClass}>Usage Type</label>
                <select value={assignUsageType} onChange={(e) => setAssignUsageType(e.target.value)} className={inputClass}>
                  <option value="gallery">Gallery Item</option>
                  <option value="cover">Cover Photo</option>
                  <option value="page-bg">Page Background</option>
                  <option value="seo">SEO Image</option>
                </select>
              </div>

              {/* Display Order */}
              <div>
                <label className={labelClass}>Display Order</label>
                <input type="number" value={assignDisplayOrder} onChange={(e) => setAssignDisplayOrder(parseInt(e.target.value) || 0)} className={inputClass} min={0} />
              </div>
            </div>

            {/* Quick Assign buttons */}
            <div className="mb-6">
              <p className={labelClass}>Quick Assign</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAssignToPage(assignDrawer.id, "homepage-hero")}
                  className={btnSecondary + " text-center"}
                >
                  Homepage Hero
                </button>
                <button
                  onClick={() => {
                    if (assignListing || listings[0]?.id) {
                      handleAssignToListing(assignDrawer.id, assignListing || listings[0]?.id);
                    }
                  }}
                  className={btnSecondary + " text-center"}
                >
                  Listing Cover
                </button>
                <button
                  onClick={() => handleAssignToPage(assignDrawer.id, "homepage-amenities-bg")}
                  className={btnSecondary + " text-center"}
                >
                  SEO Image
                </button>
                <button
                  onClick={() => {
                    if (assignListing || listings[0]?.id) {
                      handleAssignToListing(assignDrawer.id, assignListing || listings[0]?.id, assignRoom);
                    }
                  }}
                  className={btnSecondary + " text-center"}
                >
                  Add to Gallery
                </button>
              </div>
            </div>

            {/* Assign button */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (assignPageLocation) {
                    handleAssignToPage(assignDrawer.id, assignPageLocation);
                  } else if (assignListing) {
                    handleAssignToListing(assignDrawer.id, assignListing, assignRoom);
                  }
                  setAssignDrawer(null);
                }}
                disabled={!assignListing && !assignPageLocation}
                className={`${btnPrimary} ${!assignListing && !assignPageLocation ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                Assign
              </button>
              <button onClick={() => setAssignDrawer(null)} className={btnSecondary}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Usage Drawer ═══ */}
      {usageDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setUsageDrawer(null)} />
          <div className="w-[480px] bg-white border-l border-light-gray h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-medium text-charcoal">View Usage</h2>
              <button onClick={() => setUsageDrawer(null)}><X size={16} className="text-warm-gray" /></button>
            </div>

            {/* Preview */}
            <div className="aspect-video bg-light-gray overflow-hidden mb-2">
              {usageDrawer.mimeType.startsWith("video/") ? (
                <video muted loop playsInline autoPlay className="w-full h-full object-cover"><source src={usageDrawer.url} type={usageDrawer.mimeType} /></video>
              ) : (
                <img src={usageDrawer.url} alt={usageDrawer.originalName} className="w-full h-full object-cover" />
              )}
            </div>
            <p className="text-xs text-charcoal mb-1">{usageDrawer.originalName}</p>
            <p className="text-[10px] text-warm-gray mb-6">{formatBytes(usageDrawer.size)}</p>

            {/* Page Media usages */}
            {usageDrawer.pageMedia.length > 0 && (
              <div className="mb-6">
                <p className={labelClass}>Page Assignments</p>
                <div className="space-y-2">
                  {usageDrawer.pageMedia.map((pm) => (
                    <div key={pm.id} className="flex items-center justify-between p-3 border border-light-gray">
                      <div>
                        <p className="text-xs text-charcoal">{pageLocationLabels[pm.location] || pm.location}</p>
                        <p className="text-[9px] text-warm-gray">Location: {pm.location}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setReplaceDrawer(usageDrawer); setUsageDrawer(null); }}
                          className="text-[9px] tracking-[0.1em] uppercase text-warm-gray border border-light-gray px-2 py-1 hover:bg-cream"
                        >
                          Replace
                        </button>
                        <button
                          onClick={() => handleRemovePageMedia(pm.location)}
                          className="text-[9px] tracking-[0.1em] uppercase text-red-400 border border-red-200 px-2 py-1 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Listing Media usages */}
            {usageDrawer.listingMedia.length > 0 && (
              <div className="mb-6">
                <p className={labelClass}>Listing Gallery</p>
                <div className="space-y-2">
                  {usageDrawer.listingMedia.map((lm) => (
                    <div key={lm.id} className="flex items-center justify-between p-3 border border-light-gray">
                      <div>
                        <p className="text-xs text-charcoal">{lm.listing.title}</p>
                        <p className="text-[9px] text-warm-gray">
                          {lm.room && `Room: ${lm.room}`}
                          {lm.label && ` — ${lm.label}`}
                          {` — Order: ${lm.displayOrder}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setReplaceDrawer(usageDrawer); setUsageDrawer(null); }}
                          className="text-[9px] tracking-[0.1em] uppercase text-warm-gray border border-light-gray px-2 py-1 hover:bg-cream"
                        >
                          Replace
                        </button>
                        <button
                          onClick={() => handleRemoveListingMedia(lm.id)}
                          className="text-[9px] tracking-[0.1em] uppercase text-red-400 border border-red-200 px-2 py-1 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No usage */}
            {usageDrawer.listingMedia.length === 0 && usageDrawer.pageMedia.length === 0 && (
              <div className="text-center py-8">
                <Ban size={24} className="mx-auto text-warm-gray mb-2" />
                <p className="text-xs text-warm-gray">This file is not assigned anywhere.</p>
              </div>
            )}

            {/* Bottom actions */}
            <div className="border-t border-light-gray pt-4 mt-6 space-y-2">
              <button
                onClick={() => { setReplaceDrawer(usageDrawer); setUsageDrawer(null); }}
                className={btnSecondary + " w-full text-center"}
              >
                Replace Everywhere
              </button>
              {(usageDrawer.listingMedia.length > 0 || usageDrawer.pageMedia.length > 0) && (
                <button
                  onClick={async () => {
                    for (const lm of usageDrawer.listingMedia) {
                      await handleRemoveListingMedia(lm.id);
                    }
                    for (const pm of usageDrawer.pageMedia) {
                      await handleRemovePageMedia(pm.location);
                    }
                    setUsageDrawer(null);
                    loadMedia();
                  }}
                  className="w-full text-center text-[10px] tracking-[0.12em] uppercase font-medium text-red-500 border border-red-200 px-4 py-2.5 hover:bg-red-50 transition-colors"
                >
                  Remove from All Locations
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MediaCard Component ────────────────────────────────────────────────────

function MediaCard({
  item,
  selectMode,
  isSelected,
  isArchived,
  isCover,
  isInUse,
  onToggleSelect,
  onReplace,
  onAssign,
  onViewUsage,
  onArchive,
  onRestore,
  onDownload,
  onCopyUrl,
  onDelete,
}: {
  item: MediaItem;
  selectMode: boolean;
  isSelected: boolean;
  isArchived: boolean;
  isCover: boolean;
  isInUse: boolean;
  onToggleSelect: () => void;
  onReplace: () => void;
  onAssign: () => void;
  onViewUsage: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDownload: () => void;
  onCopyUrl: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className={`bg-white border border-light-gray group relative ${isArchived ? "opacity-60" : ""} ${isSelected ? "ring-2 ring-charcoal" : ""}`}>
      {/* Thumbnail */}
      <div className="aspect-[4/3] overflow-hidden bg-light-gray relative">
        {item.mimeType.startsWith("video/") ? (
          <video muted loop playsInline autoPlay className="w-full h-full object-cover">
            <source src={item.url} type={item.mimeType} />
          </video>
        ) : (
          <img src={item.url} alt={item.originalName} className="w-full h-full object-cover" />
        )}

        {/* Archived overlay */}
        {isArchived && <div className="absolute inset-0 bg-gray-500/30" />}

        {/* Checkbox */}
        {selectMode && (
          <div className="absolute top-2 left-2 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="w-4 h-4 cursor-pointer"
            />
          </div>
        )}

        {/* Type badge */}
        <div className={`absolute ${selectMode ? "top-2 left-8" : "top-2 left-2"}`}>
          <span className={`text-[8px] tracking-[0.1em] uppercase font-bold px-1.5 py-0.5 ${
            item.mimeType.startsWith("video/") ? "bg-charcoal text-white" : "bg-white text-charcoal"
          }`}>
            {item.mimeType.startsWith("video/") ? "VIDEO" : "PHOTO"}
          </span>
        </div>

        {/* Status badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {isInUse && !isArchived && (
            <span className="text-[7px] tracking-[0.1em] uppercase font-bold px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-200">IN USE</span>
          )}
          {isCover && (
            <span className="text-[7px] tracking-[0.1em] uppercase font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">COVER</span>
          )}
          {isArchived && (
            <span className="text-[7px] tracking-[0.1em] uppercase font-bold px-1.5 py-0.5 bg-gray-100 text-gray-500 border border-gray-200">ARCHIVED</span>
          )}
          {!isInUse && !isArchived && (
            <span className="text-[7px] tracking-[0.1em] uppercase font-bold px-1.5 py-0.5 bg-white text-red-500 border border-red-200">NOT USED</span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-charcoal truncate font-medium" title={item.originalName}>
          {item.originalName}
        </p>
        <p className="text-[10px] text-warm-gray mt-0.5">{formatBytes(item.size)}</p>

        {/* Usage summary */}
        {item.listingMedia.length > 0 && (
          <p className="text-[9px] text-accent mt-1 truncate">
            Listing: {item.listingMedia.map((lm) => lm.listing.title).join(", ")}
          </p>
        )}
        {item.pageMedia.length > 0 && (
          <p className="text-[9px] text-accent mt-0.5 truncate">
            Page: {item.pageMedia.map((pm) => pm.location).join(", ")}
          </p>
        )}
        {item.listingMedia[0]?.room && (
          <span className="inline-block mt-1 text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5 bg-cream text-warm-gray border border-light-gray">
            {item.listingMedia[0].room}
          </span>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-1 mt-2">
          <button onClick={onReplace} className="text-[8px] tracking-[0.08em] uppercase text-warm-gray border border-light-gray px-1.5 py-1 hover:bg-cream transition" title="Replace">
            <Replace size={10} className="inline mr-0.5" /> Replace
          </button>
          <button onClick={onAssign} className="text-[8px] tracking-[0.08em] uppercase text-warm-gray border border-light-gray px-1.5 py-1 hover:bg-cream transition" title="Assign">
            <Link2 size={10} className="inline mr-0.5" /> Assign
          </button>
          <button onClick={onViewUsage} className="text-[8px] tracking-[0.08em] uppercase text-warm-gray border border-light-gray px-1.5 py-1 hover:bg-cream transition" title="View Usage">
            <Eye size={10} className="inline mr-0.5" /> Usage
          </button>
          <button onClick={onDownload} className="text-[8px] tracking-[0.08em] uppercase text-warm-gray border border-light-gray px-1.5 py-1 hover:bg-cream transition" title="Download">
            <Download size={10} className="inline mr-0.5" /> Download
          </button>
          {isArchived ? (
            <button onClick={onRestore} className="text-[8px] tracking-[0.08em] uppercase text-warm-gray border border-light-gray px-1.5 py-1 hover:bg-cream transition" title="Restore">
              <RotateCcw size={10} className="inline mr-0.5" /> Restore
            </button>
          ) : (
            <button onClick={onArchive} className="text-[8px] tracking-[0.08em] uppercase text-warm-gray border border-light-gray px-1.5 py-1 hover:bg-cream transition" title="Archive">
              <Archive size={10} className="inline mr-0.5" /> Archive
            </button>
          )}
          <button onClick={onCopyUrl} className="text-[8px] tracking-[0.08em] uppercase text-warm-gray border border-light-gray px-1.5 py-1 hover:bg-cream transition" title="Copy URL">
            <Copy size={10} />
          </button>
          <button onClick={onDelete} className="text-[8px] tracking-[0.08em] uppercase text-red-400 border border-red-200 px-1.5 py-1 hover:bg-red-50 transition" title="Delete">
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
