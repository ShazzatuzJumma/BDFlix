"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Film, Tv } from "lucide-react";
import { tmdbGet } from "@/lib/api-client";
import type { TMDBGenre } from "@/lib/tmdb-types";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

/**
 * Horizontal scrollable genre chips for quick navigation.
 * Shows a mix of movie + TV genres.
 */
export function GenreChips() {
  const navigate = useAppStore((s) => s.navigate);
  const [movieGenres, setMovieGenres] = useState<TMDBGenre[]>([]);
  const [tvGenres, setTvGenres] = useState<TMDBGenre[]>([]);
  const [mode, setMode] = useState<"movie" | "tv">("movie");

  useEffect(() => {
    Promise.all([
      tmdbGet<{ genres: TMDBGenre[] }>("/genre/movie/list").catch(() => ({ genres: [] })),
      tmdbGet<{ genres: TMDBGenre[] }>("/genre/tv/list").catch(() => ({ genres: [] })),
    ]).then(([m, t]) => {
      setMovieGenres(m.genres || []);
      setTvGenres(t.genres || []);
    });
  }, []);

  const genres = mode === "movie" ? movieGenres : tvGenres;
  if (genres.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="px-4 md:px-8 lg:px-12"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex bg-white/5 rounded-lg p-0.5">
          <button
            onClick={() => setMode("movie")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition",
              mode === "movie" ? "bg-white text-black" : "text-white/60 hover:text-white",
            )}
          >
            <Film className="w-3.5 h-3.5" /> Movies
          </button>
          <button
            onClick={() => setMode("tv")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition",
              mode === "tv" ? "bg-white text-black" : "text-white/60 hover:text-white",
            )}
          >
            <Tv className="w-3.5 h-3.5" /> TV
          </button>
        </div>
        <span className="text-xs text-white/40 ml-1">Browse by genre</span>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {genres.map((g) => (
          <button
            key={g.id}
            onClick={() => navigate({ name: "genre", media: mode, genreId: g.id, genreName: g.name })}
            className="shrink-0 px-4 py-1.5 rounded-full bg-white/8 hover:bg-bdnflix-red text-sm text-white/80 hover:text-white transition-colors border border-white/10 hover:border-bdnflix-red whitespace-nowrap"
          >
            {g.name}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
