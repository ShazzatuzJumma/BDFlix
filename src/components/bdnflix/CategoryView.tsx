"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { ContentCard } from "./ContentCard";
import { tmdbGet } from "@/lib/api-client";
import type { TMDBItem, TMDBPaged, TMDBGenre } from "@/lib/tmdb-types";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface CategoryViewProps {
  title: string;
  media: "movie" | "tv";
  endpoint: "popular" | "top_rated" | "now_playing" | "on_the_air" | "airing_today" | "upcoming" | "trending";
  isKids: boolean;
  initialGenreId?: number;
}

export function CategoryView({ title, media, endpoint, isKids, initialGenreId }: CategoryViewProps) {
  const [items, setItems] = useState<TMDBItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState<TMDBGenre[]>([]);
  const [genreFilter, setGenreFilter] = useState<string>(initialGenreId ? String(initialGenreId) : "all");
  const [sort, setSort] = useState<string>("popularity.desc");

  // Load genres
  useEffect(() => {
    tmdbGet<{ genres: TMDBGenre[] }>(`/genre/${media}/list`).then(({ genres }) => setGenres(genres)).catch(() => {});
  }, [media]);

  // Load items
  const loadPage = useCallback(async (p: number, reset = false) => {
    setLoading(true);
    try {
      let data: TMDBPaged<TMDBItem>;
      if (endpoint === "trending") {
        data = await tmdbGet<TMDBPaged<TMDBItem>>(`/trending/${media}/week`, { page: p });
      } else if (genreFilter !== "all") {
        data = await tmdbGet<TMDBPaged<TMDBItem>>(`/discover/${media}`, {
          page: p,
          with_genres: genreFilter,
          sort_by: sort,
        });
      } else {
        data = await tmdbGet<TMDBPaged<TMDBItem>>(`/${media}/${endpoint}`, { page: p });
      }
      let newItems = data.results || [];
      if (isKids) newItems = newItems.filter((i) => !i.adult && i.vote_average <= 7.5);
      setItems((prev) => (reset ? newItems : [...prev, ...newItems]));
      setTotalPages(data.total_pages);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [media, endpoint, genreFilter, sort, isKids]);

  useEffect(() => {
    setItems([]);
    setPage(1);
    loadPage(1, true);
  }, [loadPage]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    loadPage(next);
  };

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1>
          <div className="flex items-center gap-2">
            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent className="bg-[#16161d] border-white/10 text-white max-h-72">
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {genreFilter !== "all" && (
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#16161d] border-white/10 text-white">
                  <SelectItem value="popularity.desc">Most Popular</SelectItem>
                  <SelectItem value="vote_average.desc">Highest Rated</SelectItem>
                  <SelectItem value="primary_release_date.desc">Newest</SelectItem>
                  <SelectItem value="primary_release_date.asc">Oldest</SelectItem>
                  <SelectItem value="revenue.desc">Highest Grossing</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </motion.div>

        {items.length === 0 && loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-md skeleton-shimmer" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-white/50">No items found.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
              {items.map((item, idx) => (
                <ContentCard
                  key={`${item.id}-${idx}`}
                  item={{ ...item, media_type: media }}
                  className="w-full"
                />
              ))}
            </div>
            {page < totalPages && page < 10 && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={loadMore}
                  disabled={loading}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 hover:text-white"
                >
                  {loading ? "Loading…" : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
