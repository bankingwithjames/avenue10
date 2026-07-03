"use client";

import { useState, useEffect } from "react";
import { Play, X, ChevronLeft, ChevronRight } from "lucide-react";

interface MediaItem {
  id: string;
  src: string;
  type: "video" | "image";
  label: string;
  room: string;
}

export function MediaGallery({ slug }: { slug: string }) {
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState("all");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/listing-media?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setAllMedia(data);
        setLoading(false);
      });
  }, [slug]);

  const rooms = [...new Set(allMedia.map((m) => m.room))];
  const filtered = activeRoom === "all" ? allMedia : allMedia.filter((m) => m.room === activeRoom);

  function openLightbox(idx: number) {
    setLightboxIdx(idx);
  }

  function closeLightbox() {
    setLightboxIdx(null);
  }

  function navigate(dir: number) {
    if (lightboxIdx === null) return;
    const next = lightboxIdx + dir;
    if (next >= 0 && next < filtered.length) setLightboxIdx(next);
  }

  if (loading) {
    return (
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-6 font-medium">Gallery</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/3] bg-light-gray animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (allMedia.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] tracking-[0.3em] uppercase text-warm-gray mb-6 font-medium">
        Gallery
      </p>

      {/* Room filters */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <button
          onClick={() => setActiveRoom("all")}
          className={`px-4 py-1.5 text-[10px] tracking-[0.12em] uppercase font-medium transition ${
            activeRoom === "all"
              ? "bg-charcoal text-white"
              : "bg-transparent text-charcoal border border-light-gray hover:bg-cream"
          }`}
        >
          All Rooms
        </button>
        {rooms.map((room) => (
          <button
            key={room}
            onClick={() => setActiveRoom(room)}
            className={`px-4 py-1.5 text-[10px] tracking-[0.12em] uppercase font-medium transition ${
              activeRoom === room
                ? "bg-charcoal text-white"
                : "bg-transparent text-charcoal border border-light-gray hover:bg-cream"
            }`}
          >
            {room}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => openLightbox(idx)}
            className="group relative aspect-[4/3] overflow-hidden bg-light-gray cursor-pointer"
          >
            {item.type === "video" ? (
              <>
                <video
                  muted
                  loop
                  playsInline
                  autoPlay
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                >
                  <source src={item.src} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <Play size={24} className="text-white/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </>
            ) : (
              <img
                src={item.src}
                alt={item.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
              <span className="text-white text-[10px] tracking-[0.1em] uppercase font-medium">
                {item.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && filtered[lightboxIdx] && (
        <div
          className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition z-10"
          >
            <X size={28} />
          </button>

          {lightboxIdx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(-1); }}
              className="absolute left-4 md:left-8 text-white/50 hover:text-white transition z-10"
            >
              <ChevronLeft size={36} />
            </button>
          )}

          {lightboxIdx < filtered.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(1); }}
              className="absolute right-4 md:right-8 text-white/50 hover:text-white transition z-10"
            >
              <ChevronRight size={36} />
            </button>
          )}

          <div className="max-w-5xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {filtered[lightboxIdx].type === "video" ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                controls
                className="w-full max-h-[80vh] object-contain"
              >
                <source src={filtered[lightboxIdx].src} type="video/mp4" />
              </video>
            ) : (
              <img
                src={filtered[lightboxIdx].src}
                alt={filtered[lightboxIdx].label}
                className="w-full max-h-[80vh] object-contain"
              />
            )}
            <p className="text-center text-white/60 text-xs tracking-[0.15em] uppercase mt-4">
              {filtered[lightboxIdx].label}
              <span className="text-white/30 ml-3">
                {lightboxIdx + 1} / {filtered.length}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
