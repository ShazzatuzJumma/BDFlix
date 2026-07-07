"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search as SearchIcon, X, TrendingUp, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ContentCard } from "./ContentCard";
import { PersonChip } from "./PersonChip";
import { useTmdbList } from "./hooks";
import { tmdbGet } from "@/lib/api-client";
import { profileUrl, type TMDBItem, TMDBPaged } from "@/lib/tmdb-types";
import { useAppStore } from "@/store/useAppStore";

interface PersonResult {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  known_for?: TMDBItem[];
}

export function SearchView() {
  const navigate = useAppStore((s) => s.navigate);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBItem[]>([]);
  const [people, setPeople] = useState<PersonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const trending = useTmdbList("/trending/all/day");

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setPeople([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const data = await tmdbGet<TMDBPaged<TMDBItem & { known_for_department?: string; known_for?: TMDBItem[] }>>("/search/multi", { query, page: 1 });
        if (!cancelled) {
          const all = data.results || [];
          setResults(
            all
              .filter((r) => (r.media_type === "movie" || r.media_type === "tv") && (r.poster_path || r.backdrop_path))
              .slice(0, 60),
          );
          setPeople(
            all
              .filter((r) => r.media_type === "person")
              .slice(0, 12)
              .map((r) => ({
                id: r.id,
                name: r.name || r.original_name || "Unknown",
                profile_path: r.profile_path,
                known_for_department: r.known_for_department || "Acting",
                known_for: r.known_for,
              })),
          );
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query]);

  const hasQuery = query.trim().length > 0;

  const handlePersonClick = (personId: number) => {
    setSearchOpen(false);
    navigate({ name: "person", personId });
  };

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 md:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Search input */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8"
        >
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, TV shows, people…"
            className="bg-white/5 border-white/10 text-white text-lg h-14 pl-12 pr-12 rounded-lg focus-visible:ring-bdnflix-red"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </motion.div>

        {/* Results / trending */}
        {!hasQuery ? (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 bdnflix-red" /> Trending Today
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {(trending.data?.results ?? []).slice(0, 18).map((item) => (
                <ContentCard
                  key={`${item.media_type}-${item.id}`}
                  item={item}
                  className="w-full"
                />
              ))}
            </div>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-md skeleton-shimmer" />
            ))}
          </div>
        ) : results.length === 0 && people.length === 0 ? (
          <div className="text-center py-20 text-white/50">
            <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg">No results for "{query}"</p>
            <p className="text-sm mt-1">Try a different search term.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* People section */}
            {people.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 bdnflix-red" /> People ({people.length})
                </h2>
                <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
                  {people.map((p) => (
                    <PersonChip key={p.id} person={p} onClick={() => handlePersonClick(p.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Movies & TV section */}
            {results.length > 0 && (
              <div>
                <p className="text-white/60 text-sm mb-4">{results.length} titles for "{query}"</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                  {results.map((item) => (
                    <ContentCard
                      key={`${item.media_type}-${item.id}`}
                      item={item}
                      className="w-full"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
