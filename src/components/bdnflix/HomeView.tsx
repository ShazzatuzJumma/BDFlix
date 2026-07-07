"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { HeroBanner } from "./HeroBanner";
import { ContentRow } from "./ContentRow";
import { Top10Row } from "./Top10Row";
import { GenreChips } from "./GenreChips";
import { CuratedCollections } from "./CuratedCollections";
import { useTmdbList, buildProgressMap } from "./hooks";
import { tmdbGet, getProgress, type WatchProgress } from "@/lib/api-client";
import { useAppStore } from "@/store/useAppStore";
import { useEffect, useState } from "react";
import type { TMDBItem } from "@/lib/tmdb-types";

interface HomeViewProps {
  profileId: string;
  isKids: boolean;
}

export function HomeView({ profileId, isKids }: HomeViewProps) {
  const trending = useTmdbList("/trending/all/week");
  const trendingDay = useTmdbList("/trending/all/day");
  const trendingMovies = useTmdbList("/trending/movie/week");
  const popularMovies = useTmdbList("/movie/popular");
  const popularTV = useTmdbList("/tv/popular");
  const topRatedMovies = useTmdbList("/movie/top_rated");
  const topRatedTV = useTmdbList("/tv/top_rated");
  const nowPlaying = useTmdbList("/movie/now_playing");
  const onTheAir = useTmdbList("/tv/on_the_air");
  const upcoming = useTmdbList("/movie/upcoming");

  const [progressMap, setProgressMap] = useState<Map<string, number>>(new Map());
  const [continueItems, setContinueItems] = useState<TMDBItem[]>([]);
  const [recommendedTitle, setRecommendedTitle] = useState<string>("");
  const [recommendedItems, setRecommendedItems] = useState<TMDBItem[]>([]);
  const [topPicksItems, setTopPicksItems] = useState<TMDBItem[]>([]);

  // Load continue watching + "Because you watched" recommendations + Top Picks
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { continueWatching } = await getProgress(profileId);
        // Fetch each item's details (limited)
        const cw = continueWatching ?? [];
        setProgressMap(buildProgressMap(cw));
        const details = await Promise.all(
          cw.slice(0, 20).map(async (p) => {
            try {
              const d = await tmdbGet<TMDBItem>(`/${p.mediaType}/${p.tmdbId}`);
              return { ...d, media_type: p.mediaType } as TMDBItem;
            } catch {
              return null;
            }
          }),
        );
        if (!cancelled) {
          setContinueItems(details.filter((d): d is TMDBItem => d !== null));
        }

        // Build "Because you watched" from the most recently watched item's recommendations
        if (cw.length > 0 && !cancelled) {
          const latest = cw[0];
          try {
            const d = await tmdbGet<TMDBItem & { recommendations?: { results: TMDBItem[] } }>(
              `/${latest.mediaType}/${latest.tmdbId}`,
              { append_to_response: "recommendations" },
            );
            const recs = (d.recommendations?.results ?? [])
              .filter((r) => r.poster_path || r.backdrop_path)
              .slice(0, 20)
              .map((r) => ({ ...r, media_type: latest.mediaType }));
            if (!cancelled) {
              const title = d.title || d.name || "Recently Watched";
              setRecommendedTitle(`Because you watched "${title}"`);
              setRecommendedItems(recs);
            }
          } catch {
            // ignore
          }
        }

        // Build "Top Picks for You" from the user's top genres (aggregated across all watched)
        if (cw.length > 0 && !cancelled) {
          try {
            // Gather genres from all watched items (limit to first 10 for performance)
            const watchedDetails = await Promise.all(
              cw.slice(0, 10).map(async (p) => {
                try {
                  const d = await tmdbGet<TMDBItem>(`/${p.mediaType}/${p.tmdbId}`);
                  return d.genres?.map((g) => g.id) ?? d.genre_ids ?? [];
                } catch {
                  return [];
                }
              }),
            );
            const genreCounts = new Map<number, number>();
            watchedDetails.flat().forEach((g) => genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1));
            const topGenre = Array.from(genreCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
            if (topGenre != null) {
              const [movies, tv] = await Promise.all([
                tmdbGet<{ results: TMDBItem[] }>("/discover/movie", { with_genres: topGenre, sort_by: "popularity.desc", "vote_count.gte": 100 }).catch(() => ({ results: [] })),
                tmdbGet<{ results: TMDBItem[] }>("/discover/tv", { with_genres: topGenre, sort_by: "popularity.desc", "vote_count.gte": 50 }).catch(() => ({ results: [] })),
              ]);
              const picks = [
                ...movies.results.map((m) => ({ ...m, media_type: "movie" })),
                ...tv.results.map((t) => ({ ...t, media_type: "tv" })),
              ]
                .filter((i) => i.poster_path || i.backdrop_path)
                .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
                .slice(0, 20);
              if (!cancelled) setTopPicksItems(picks);
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const featured = useMemo(() => {
    const items = (trending.data?.results ?? []).filter(
      (i) => i.backdrop_path && (i.overview || "").length > 30,
    );
    return items.slice(0, 5);
  }, [trending.data]);

  // Filter out adult content for kids profiles
  const filter = (items: TMDBItem[] = []) =>
    isKids ? items.filter((i) => !i.adult && i.vote_average <= 7.5) : items;

  return (
    <div className="pb-16">
      <HeroBanner items={featured} />

      <div className="relative -mt-20 md:-mt-32 z-10 space-y-4 md:space-y-6">
        {continueItems.length > 0 && (
          <ContentRow
            title="Continue Watching"
            items={filter(continueItems)}
            variant="backdrop"
            progressMap={progressMap}
          />
        )}

        {recommendedItems.length > 0 && (
          <ContentRow
            title={recommendedTitle}
            items={filter(recommendedItems)}
          />
        )}

        {topPicksItems.length > 0 && (
          <ContentRow
            title="✨ Top Picks for You"
            items={filter(topPicksItems)}
          />
        )}

        <GenreChips />

        <Top10Row
          title="Top 10 Today"
          items={filter(trendingDay.data?.results)}
        />

        <ContentRow
          title="Trending Now"
          items={filter(trending.data?.results)}
          variant="backdrop"
        />

        <ContentRow
          title="Popular Movies"
          items={filter(popularMovies.data?.results)}
        />

        <ContentRow
          title="Popular on BDnFlix"
          items={filter(trendingMovies.data?.results)}
        />

        <ContentRow
          title="New TV Episodes This Week"
          items={filter(onTheAir.data?.results)}
          variant="backdrop"
        />

        <ContentRow
          title="Popular TV Shows"
          items={filter(popularTV.data?.results)}
        />

        <ContentRow
          title="Now Playing in Theaters"
          items={filter(nowPlaying.data?.results)}
        />

        <ContentRow
          title="Top Rated Movies"
          items={filter(topRatedMovies.data?.results)}
        />

        <ContentRow
          title="Top Rated TV"
          items={filter(topRatedTV.data?.results)}
        />

        <ContentRow
          title="Coming Soon"
          items={filter(upcoming.data?.results)}
        />

        {/* Curated themed collections */}
        <CuratedCollections isKids={isKids} />
      </div>
    </div>
  );
}
