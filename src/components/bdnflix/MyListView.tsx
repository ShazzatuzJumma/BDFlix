"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Heart, Trash2, ArrowDownUp, Film, Tv, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContentCard } from "./ContentCard";
import { getWatchlist, removeFromWatchlist, type WatchlistItem } from "@/lib/api-client";
import { posterUrl, type TMDBItem } from "@/lib/tmdb-types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MyListViewProps {
  profileId: string;
}

type SortBy = "recent" | "title" | "type";
type FilterBy = "all" | "movie" | "tv";

export function MyListView({ profileId }: MyListViewProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("recent");
  const [filterBy, setFilterBy] = useState<FilterBy>("all");

  const load = useCallback(() => {
    setLoading(true);
    getWatchlist(profileId)
      .then(({ items }) => setItems(items))
      .finally(() => setLoading(false));
  }, [profileId]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getWatchlist(profileId)
      .then(({ items }) => { if (!cancelled) setItems(items); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [profileId]);

  const handleRemove = async (item: WatchlistItem) => {
    await removeFromWatchlist(profileId, item.tmdbId, item.mediaType as "movie" | "tv");
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    toast.success("Removed from My List");
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...items];
    if (filterBy !== "all") {
      result = result.filter((i) => i.mediaType === filterBy);
    }
    if (sortBy === "recent") {
      result.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    } else if (sortBy === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "type") {
      result.sort((a, b) => a.mediaType.localeCompare(b.mediaType) || a.title.localeCompare(b.title));
    }
    return result;
  }, [items, sortBy, filterBy]);

  const movieCount = items.filter((i) => i.mediaType === "movie").length;
  const tvCount = items.filter((i) => i.mediaType === "tv").length;

  // Convert watchlist items to TMDBItem-like shape for ContentCard
  const cards: TMDBItem[] = filteredAndSorted.map((i) => ({
    id: i.tmdbId,
    title: i.mediaType === "movie" ? i.title : undefined,
    name: i.mediaType === "tv" ? i.title : undefined,
    poster_path: i.poster,
    backdrop_path: i.backdrop,
    overview: "",
    vote_average: 0,
    vote_count: 0,
    media_type: i.mediaType,
  }));

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <Heart className="w-7 h-7 bdnflix-red fill-bdnflix-red" />
            <h1 className="text-2xl md:text-3xl font-bold text-white">My List</h1>
            {items.length > 0 && (
              <span className="text-white/50 text-sm">({items.length})</span>
            )}
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-2">
              {/* Type filter */}
              <div className="flex bg-white/5 rounded-lg p-0.5">
                {([
                  { id: "all", label: "All", icon: null, count: items.length },
                  { id: "movie", label: "Movies", icon: Film, count: movieCount },
                  { id: "tv", label: "TV", icon: Tv, count: tvCount },
                ] as const).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterBy(f.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition",
                      filterBy === f.id ? "bg-white text-black" : "text-white/60 hover:text-white",
                    )}
                  >
                    {f.icon && <f.icon className="w-3.5 h-3.5" />}
                    {f.label}
                    <span className={cn("text-[10px]", filterBy === f.id ? "text-black/60" : "text-white/40")}>{f.count}</span>
                  </button>
                ))}
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white h-9">
                  <div className="flex items-center gap-1.5">
                    <ArrowDownUp className="w-3.5 h-3.5" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#16161d] border-white/10 text-white">
                  <SelectItem value="recent"><span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Recently Added</span></SelectItem>
                  <SelectItem value="title"><span className="flex items-center gap-2">A → Z</span></SelectItem>
                  <SelectItem value="type"><span className="flex items-center gap-2">By Type</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <Heart className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium text-white/70">Your list is empty</p>
            <p className="text-sm mt-1">Add movies and shows to watch later.</p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-20 text-white/50">
            <p className="text-lg font-medium text-white/70">No {filterBy === "movie" ? "movies" : "TV shows"} in your list</p>
            <p className="text-sm mt-1">Try a different filter.</p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4"
          >
            {cards.map((item, idx) => (
              <motion.div
                key={`${filteredAndSorted[idx].tmdbId}-${filteredAndSorted[idx].mediaType}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group"
              >
                <ContentCard item={item} className="w-full" />
                <button
                  onClick={() => handleRemove(filteredAndSorted[idx])}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center hover:bg-bdnflix-red"
                  aria-label="Remove from list"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
