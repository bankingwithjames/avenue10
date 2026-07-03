"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  Film,
  Info,
  X,
  Search,
  CheckCircle,
} from "lucide-react";

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
  listingMedia: { listing: { title: string } }[];
  pageMedia: { location: string }[];
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  const [showGuide, setShowGuide] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const loadMedia = useCallback(async () => {
    const res = await fetch("/api/admin/media");
    setMedia(await res.json());
  }, []);

  useEffect(() => { loadMedia(); }, [loadMedia]);

  async function handleUpload(files: FileList | File[]) {
    if (!files.length) return;
    setUploading(true);
    setUploadProgress(`Uploading ${files.length} file(s)...`);

    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append("files", file);
    }

    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: formData });
      if (res.ok) {
        setUploadProgress(`${files.length} file(s) uploaded successfully!`);
        loadMedia();
        setTimeout(() => setUploadProgress(null), 3000);
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

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will also remove it from any listing galleries or page assignments.`)) return;
    await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    loadMedia();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }

  const filtered = media.filter((m) => {
    if (typeFilter === "image" && !m.mimeType.startsWith("image/")) return false;
    if (typeFilter === "video" && !m.mimeType.startsWith("video/")) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.originalName.toLowerCase().includes(q) || m.url.toLowerCase().includes(q);
    }
    return true;
  });

  const imageCount = media.filter((m) => m.mimeType.startsWith("image/")).length;
  const videoCount = media.filter((m) => m.mimeType.startsWith("video/")).length;
  const totalSize = media.reduce((acc, m) => acc + m.size, 0);

  const inputClass = "w-full bg-transparent border border-light-gray text-charcoal text-sm px-3 py-2.5 outline-none focus:border-charcoal/40 transition-colors";
  const labelClass = "text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1 block";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-charcoal font-light">Media Library</h1>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-warm-gray hover:text-charcoal transition-colors font-medium"
        >
          <Info size={14} /> {showGuide ? "Hide" : "Photo"} Guide
        </button>
      </div>

      {/* Recommendations Panel */}
      {showGuide && (
        <div className="bg-white border border-light-gray p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-charcoal">Recommended Media Settings</h2>
            <button onClick={() => setShowGuide(false)}><X size={16} className="text-warm-gray" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-[10px] tracking-[0.15em] uppercase text-accent font-medium mb-3">Photos</h3>
              <ul className="space-y-2 text-xs text-charcoal/70">
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Format:</strong> JPG or WebP (best file size), PNG for graphics with transparency</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Hero/Banner:</strong> 1920 x 1080px minimum (16:9 ratio)</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Gallery Thumbnails:</strong> 1200 x 900px (4:3 ratio)</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>File Size:</strong> Under 500KB per photo (optimize with TinyPNG or Squoosh)</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Quality:</strong> 80-85% JPG quality is the sweet spot for web</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Lighting:</strong> Natural daylight or warm, well-lit interiors photograph best</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[10px] tracking-[0.15em] uppercase text-accent font-medium mb-3">Videos</h3>
              <ul className="space-y-2 text-xs text-charcoal/70">
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Format:</strong> MP4 (H.264 codec) — universally supported</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Resolution:</strong> 1920 x 1080 (1080p) for hero backgrounds</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Duration:</strong> 10-30 seconds for background loops, up to 60s for tours</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>File Size:</strong> Under 15MB for smooth loading (compress with HandBrake)</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Frame Rate:</strong> 24-30fps for cinematic feel</span></li>
                <li className="flex items-start gap-2"><CheckCircle size={12} className="text-accent shrink-0 mt-0.5" /> <span><strong>Tip:</strong> Steady, slow panning shots work best as background loops</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-cream text-xs text-charcoal/60">
            <strong>Pro Tips:</strong> Shoot in landscape orientation. Avoid harsh flash. Declutter rooms before photographing. Take multiple angles of each room. Golden hour (sunrise/sunset) gives the warmest exterior shots.
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-light-gray p-4">
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon size={14} className="text-warm-gray" />
            <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Photos</span>
          </div>
          <p className="text-lg font-medium text-charcoal">{imageCount}</p>
        </div>
        <div className="bg-white border border-light-gray p-4">
          <div className="flex items-center gap-2 mb-1">
            <Film size={14} className="text-warm-gray" />
            <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Videos</span>
          </div>
          <p className="text-lg font-medium text-charcoal">{videoCount}</p>
        </div>
        <div className="bg-white border border-light-gray p-4">
          <div className="flex items-center gap-2 mb-1">
            <Upload size={14} className="text-warm-gray" />
            <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Total Size</span>
          </div>
          <p className="text-lg font-medium text-charcoal">{formatBytes(totalSize)}</p>
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
        <p className="text-sm text-charcoal mb-1">Drag & drop files here</p>
        <p className="text-xs text-warm-gray mb-4">JPG, PNG, WebP, MP4 — up to 50MB per file</p>
        <label className="inline-block bg-charcoal text-white px-6 py-2.5 text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition cursor-pointer">
          {uploading ? "Uploading..." : "Browse Files"}
          <input
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
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename..."
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "image", "video"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 text-[10px] tracking-[0.12em] uppercase font-medium transition ${
                typeFilter === t
                  ? "bg-charcoal text-white"
                  : "bg-white text-charcoal border border-light-gray hover:bg-cream"
              }`}
            >
              {t === "all" ? "All" : t === "image" ? "Photos" : "Videos"}
              <span className="ml-1 opacity-50">
                ({t === "all" ? media.length : t === "image" ? imageCount : videoCount})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-warm-gray text-sm text-center py-12">No media files found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white border border-light-gray group">
              <div className="aspect-[4/3] overflow-hidden bg-light-gray relative">
                {item.mimeType.startsWith("video/") ? (
                  <video
                    muted
                    loop
                    playsInline
                    autoPlay
                    className="w-full h-full object-cover"
                  >
                    <source src={item.url} type={item.mimeType} />
                  </video>
                ) : (
                  <img src={item.url} alt={item.originalName} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-2 left-2">
                  <span className={`text-[8px] tracking-[0.1em] uppercase font-bold px-1.5 py-0.5 ${
                    item.mimeType.startsWith("video/") ? "bg-charcoal text-white" : "bg-white text-charcoal"
                  }`}>
                    {item.mimeType.startsWith("video/") ? "VIDEO" : "PHOTO"}
                  </span>
                </div>
                {/* Usage indicators */}
                {(item.listingMedia.length > 0 || item.pageMedia.length > 0) && (
                  <div className="absolute top-2 right-2">
                    <span className="text-[8px] tracking-[0.1em] uppercase font-bold px-1.5 py-0.5 bg-accent text-white">
                      IN USE
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-charcoal truncate font-medium" title={item.originalName}>
                  {item.originalName}
                </p>
                <p className="text-[10px] text-warm-gray mt-0.5">
                  {formatBytes(item.size)}
                </p>
                {item.listingMedia.length > 0 && (
                  <p className="text-[9px] text-accent mt-1 truncate">
                    {item.listingMedia.map((lm: { listing: { title: string } }) => lm.listing.title).join(", ")}
                  </p>
                )}
                {item.pageMedia.length > 0 && (
                  <p className="text-[9px] text-accent mt-0.5 truncate">
                    Page: {item.pageMedia.map((pm: { location: string }) => pm.location).join(", ")}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(item.url)}
                    className="flex-1 text-[9px] tracking-[0.1em] uppercase text-warm-gray border border-light-gray px-2 py-1.5 hover:bg-cream transition text-center"
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.originalName)}
                    className="text-red-400 hover:text-red-600 border border-red-200 hover:bg-red-50 px-2 py-1.5 transition"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
