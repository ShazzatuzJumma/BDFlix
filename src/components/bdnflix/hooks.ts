"use client";

import { useEffect, useState, useCallback } from "react";
import { tmdbGet, type WatchProgress } from "@/lib/api-client";
import type { TMDBItem, TMDBPaged, TMDBGenre, MediaType } from "@/lib/tmdb-types";

/**
 * Client-side data fetching hooks for TMDB content via our /api/tmdb proxy.
 */

export function useTmdbGet<T>(path: string, params?: Record<string, string | number | boolean>, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const key = `${path}?${new URLSearchParams((params ? Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) : {}) as Record<string, string>).toString()}`;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    tmdbGet<T>(path, params)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key, enabled]);

  return { data, loading, error };
}

export function useTmdbList(path: string, params?: Record<string, string | number | boolean>) {
  return useTmdbGet<TMDBPaged<TMDBItem>>(path, params);
}

export function useGenres(media: MediaType) {
  return useTmdbGet<{ genres: TMDBGenre[] }>(`/genre/${media}/list`);
}

export function useDetails(mediaType: MediaType, id: number | null) {
  return useTmdbGet<TMDBItem>(
    `/${mediaType}/${id}`,
    { append_to_response: "credits,videos,similar,recommendations,images,content_ratings,release_dates,external_ids" },
    id != null,
  );
}

export function useSeason(tvId: number | null, season: number | null) {
  return useTmdbGet<{ episodes: TMDBItem[]; name: string; overview: string; season_number: number }>(
    `/tv/${tvId}/season/${season}`,
    undefined,
    tvId != null && season != null && season > 0,
  );
}

// Build a continue-watching progress map keyed by `${mediaType}-${id}`
export function buildProgressMap(items: WatchProgress[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of items) {
    map.set(`${p.mediaType}-${p.tmdbId}`, p.progress);
  }
  return map;
}
