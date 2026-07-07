"use client";

import { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { ContentCard } from "./ContentCard";
import { getRatings, removeRating, type Rating } from "@/lib/api-client";
import { tmdbGet } from "@/lib/api-client";
import type { TMDBItem } from "@/lib/tmdb-types";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface RatingsViewProps {
  profileId: string;
}

export function RatingsView({ profileId }: RatingsViewProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [items, setItems] = useState<TMDBItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getRatings(profileId)
      .then(async ({ items: rItems }) => {
        if (cancelled) return;
        setRatings(rItems);
        // Fetch details for each rated item
        const details = await Promise.all(
          rItems.map(async (r) => {
            try {
              const d = await tmdbGet<TMDBItem>(`/${r.mediaType}/${r.tmdbId}`);
              return { ...d, media_type: r.mediaType } as TMDBItem;
            } catch {
              return null;
            }
          }),
        );
        if (!cancelled) {
          setItems(details.filter((d): d is TMDBItem => d !== null));
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [profileId]);

  const handleRemove = async (rating: Rating) => {
    await removeRating(profileId, rating.tmdbId, rating.mediaType as "movie" | "tv");
    setRatings((prev) => prev.filter((r) => r.id !== rating.id));
    setItems((prev) => prev.filter((i) => i.id !== rating.tmdbId));
    toast.success("Rating removed");
  };

  const ratingMap = new Map(ratings.map((r) => [`${r.mediaType}-${r.tmdbId}`, r.value]));

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <Star className="w-7 h-7 bdnflix-red fill-bdnflix-red" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">My Ratings</h1>
          {ratings.length > 0 && (
            <span className="text-white/50 text-sm">({ratings.length})</span>
          )}
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-md skeleton-shimmer" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-white/50">
            <Star className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium text-white/70">No ratings yet</p>
            <p className="text-sm mt-1">Rate movies and shows to see them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
            {items.map((item) => {
              const key = `${item.media_type}-${item.id}`;
              const value = ratingMap.get(key);
              return (
                <div key={key} className="relative group">
                  <ContentCard item={item} className="w-full" />
                  {value != null && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/80 backdrop-blur-sm rounded-full px-2 py-0.5">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-bold text-white">{value}</span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      const r = ratings.find((rt) => rt.tmdbId === item.id);
                      if (r) handleRemove(r);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center hover:bg-bdnflix-red"
                    aria-label="Remove rating"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
