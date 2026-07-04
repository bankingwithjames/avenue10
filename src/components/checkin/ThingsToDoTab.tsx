"use client";

import { useState, useEffect } from "react";
import { MapPin, ExternalLink, Utensils, Music, Trophy, Calendar, Star } from "lucide-react";

interface Recommendation {
  id: string;
  category: string;
  name: string;
  description: string;
  address?: string;
  link?: string;
  imageUrl?: string;
}

const CATEGORY_ICONS: Record<string, typeof MapPin> = {
  Restaurants: Utensils,
  Sports: Trophy,
  Lounges: Music,
  Events: Calendar,
  Festivals: Star,
};

export function ThingsToDoTab({ token }: { token: string }) {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/checkin/recommendations", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setItems(data);
        if (data.length > 0) {
          setActiveCategory(null);
        }
        setLoading(false);
      });
  }, [token]);

  if (loading) return <p className="text-sm text-warm-gray">Loading recommendations...</p>;

  if (items.length === 0) {
    return (
      <div className="bg-white border border-light-gray p-8 text-center">
        <MapPin size={32} className="mx-auto text-warm-gray/40 mb-3" />
        <p className="text-sm text-warm-gray">Recommendations have not been added yet.</p>
      </div>
    );
  }

  const categories = [...new Set(items.map((i) => i.category))];
  const filtered = activeCategory
    ? items.filter((i) => i.category === activeCategory)
    : items;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-light-gray p-6">
        <h2 className="text-lg font-medium text-charcoal mb-1">Things to Do in DFW</h2>
        <p className="text-xs text-warm-gray">
          Curated recommendations for dining, entertainment, and experiences near you.
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 text-[10px] tracking-[0.1em] uppercase font-medium border transition-colors ${
            !activeCategory
              ? "bg-charcoal text-white border-charcoal"
              : "bg-white text-warm-gray border-light-gray hover:border-charcoal hover:text-charcoal"
          }`}
        >
          All
        </button>
        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat] || MapPin;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 text-[10px] tracking-[0.1em] uppercase font-medium border transition-colors ${
                activeCategory === cat
                  ? "bg-charcoal text-white border-charcoal"
                  : "bg-white text-warm-gray border-light-gray hover:border-charcoal hover:text-charcoal"
              }`}
            >
              <Icon size={12} />
              {cat}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const Icon = CATEGORY_ICONS[item.category] || MapPin;
          return (
            <div
              key={item.id}
              className="bg-white border border-light-gray hover:border-charcoal/30 transition-colors"
            >
              {item.imageUrl && (
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={12} className="text-warm-gray" />
                  <span className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-charcoal mb-1">{item.name}</h3>
                <p className="text-xs text-warm-gray leading-relaxed">{item.description}</p>
                {item.address && (
                  <p className="text-xs text-warm-gray/70 mt-2 flex items-center gap-1">
                    <MapPin size={10} /> {item.address}
                  </p>
                )}
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] tracking-[0.1em] uppercase text-charcoal font-medium mt-3 hover:text-warm-gray transition-colors"
                  >
                    Visit <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
