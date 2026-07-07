"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { ContentCard } from "./ContentCard";
import { tmdbGet } from "@/lib/api-client";
import type { TMDBItem, TMDBPaged } from "@/lib/tmdb-types";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
];

interface LanguageBrowseProps {
  isKids: boolean;
}

export function LanguageBrowse({ isKids }: LanguageBrowseProps) {
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [items, setItems] = useState<TMDBItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    // Discover movies + TV in the selected language, sorted by popularity
    Promise.all([
      tmdbGet<TMDBPaged<TMDBItem>>("/discover/movie", {
        with_original_language: selectedLang,
        sort_by: "popularity.desc",
        "vote_count.gte": 50,
      }).catch(() => ({ results: [] })),
      tmdbGet<TMDBPaged<TMDBItem>>("/discover/tv", {
        with_original_language: selectedLang,
        sort_by: "popularity.desc",
        "vote_count.gte": 30,
      }).catch(() => ({ results: [] })),
    ]).then(([movies, tv]) => {
      if (cancelled) return;
      const combined = [
        ...(movies.results || []).map((m) => ({ ...m, media_type: "movie" })),
        ...(tv.results || []).map((t) => ({ ...t, media_type: "tv" })),
      ]
        .filter((i) => i.poster_path || i.backdrop_path)
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 18);
      setItems(isKids ? combined.filter((i) => !i.adult) : combined);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedLang, isKids]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="px-4 md:px-8 lg:px-12"
    >
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 bdnflix-red" />
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white">Browse by Language</h2>
      </div>

      {/* Language chips */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-3 mb-4">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setSelectedLang(l.code)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap",
              selectedLang === l.code
                ? "bg-bdnflix-red border-bdnflix-red text-white"
                : "bg-white/8 border-white/10 text-white/70 hover:bg-white/15 hover:text-white",
            )}
          >
            <span>{l.flag}</span>
            {l.name}
          </button>
        ))}
      </div>

      {/* Content grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-md skeleton-shimmer" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-white/40 text-sm py-8 text-center">No content found for this language.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-3">
          {items.map((item) => (
            <ContentCard
              key={`${item.media_type}-${item.id}`}
              item={item}
              className="w-full"
            />
          ))}
        </div>
      )}
    </motion.section>
  );
}
