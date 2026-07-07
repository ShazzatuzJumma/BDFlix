/**
 * BDnFlix TMDB API client (server-side only).
 * The read access token is kept on the server so users never need to configure it.
 */
import { tmdbFetch } from "@/lib/tmdb-fetch";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type MediaType = "movie" | "tv";

export interface TMDBMovie {
  id: number;
  title: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  tagline?: string;
  status?: string;
  original_language?: string;
  original_title?: string;
  original_name?: string;
  popularity?: number;
  adult?: boolean;
  budget?: number;
  revenue?: number;
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  spoken_languages?: { english_name: string; iso_639_1: string; name: string }[];
  origin_country?: string[];
  homepage?: string;
  imdb_id?: string;
  seasons?: TMDBSeason[];
  created_by?: { id: number; name: string; profile_path: string | null }[];
}

export interface TMDBSeason {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
  overview: string;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  runtime: number | null;
  vote_average: number;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
}

export interface TMDBPaged<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

// ---------- Image helpers ----------
export function posterUrl(path: string | null, size: "w200" | "w300" | "w500" | "original" = "w500"): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null, size: "w300" | "w780" | "w1280" | "original" = "w1280"): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function profileUrl(path: string | null, size: "w185" | "w300" | "original" = "w185"): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function stillUrl(path: string | null, size: "w300" | "w500" | "original" = "w300"): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

// ---------- Trending / discover ----------
export const tmdb = {
  trending: (window: "day" | "week" = "week", media: "all" | "movie" | "tv" = "all") =>
    tmdbFetch<TMDBPaged<TMDBMovie>>(`/trending/${media}/${window}`),

  trendingMovies: () => tmdbFetch<TMDBPaged<TMDBMovie>>(`/trending/movie/week`),
  trendingTV: () => tmdbFetch<TMDBPaged<TMDBMovie>>(`/trending/tv/week`),

  popularMovies: (page = 1) => tmdbFetch<TMDBPaged<TMDBMovie>>(`/movie/popular`, { page }),
  popularTV: (page = 1) => tmdbFetch<TMDBPaged<TMDBMovie>>(`/tv/popular`, { page }),

  topRatedMovies: (page = 1) => tmdbFetch<TMDBPaged<TMDBMovie>>(`/movie/top_rated`, { page }),
  topRatedTV: (page = 1) => tmdbFetch<TMDBPaged<TMDBMovie>>(`/tv/top_rated`, { page }),

  nowPlayingMovies: (page = 1) => tmdbFetch<TMDBPaged<TMDBMovie>>(`/movie/now_playing`, { page }),
  airingTodayTV: (page = 1) => tmdbFetch<TMDBPaged<TMDBMovie>>(`/tv/airing_today`, { page }),
  onTheAirTV: (page = 1) => tmdbFetch<TMDBPaged<TMDBMovie>>(`/tv/on_the_air`, { page }),

  upcomingMovies: (page = 1) => tmdbFetch<TMDBPaged<TMDBMovie>>(`/movie/upcoming`, { page }),

  discoverMovies: (params: Record<string, string | number> = {}) =>
    tmdbFetch<TMDBPaged<TMDBMovie>>(`/discover/movie`, { sort_by: "popularity.desc", include_adult: false, ...params }),
  discoverTV: (params: Record<string, string | number> = {}) =>
    tmdbFetch<TMDBPaged<TMDBMovie>>(`/discover/tv`, { sort_by: "popularity.desc", ...params }),

  movieDetails: (id: number) =>
    tmdbFetch<TMDBMovie>(`/movie/${id}`, { append_to_response: "credits,videos,similar,recommendations,images,release_dates,content_ratings" }),
  tvDetails: (id: number) =>
    tmdbFetch<TMDBMovie>(`/tv/${id}`, { append_to_response: "credits,videos,similar,recommendations,images,content_ratings,external_ids" }),

  seasonDetails: (id: number, season: number) =>
    tmdbFetch<{ episodes: TMDBEpisode[]; name: string; overview: string; season_number: number }>(`/tv/${id}/season/${season}`),

  search: (query: string, page = 1) =>
    tmdbFetch<TMDBPaged<TMDBMovie & { media_type: string }>>(`/search/multi`, { query, page, include_adult: false }),

  searchMovies: (query: string, page = 1) =>
    tmdbFetch<TMDBPaged<TMDBMovie>>(`/search/movie`, { query, page, include_adult: false }),
  searchTV: (query: string, page = 1) =>
    tmdbFetch<TMDBPaged<TMDBMovie>>(`/search/tv`, { query, page, include_adult: false }),

  movieGenres: () => tmdbFetch<{ genres: TMDBGenre[] }>(`/genre/movie/list`),
  tvGenres: () => tmdbFetch<{ genres: TMDBGenre[] }>(`/genre/tv/list`),

  discoverByGenre: (media: MediaType, genreId: number, page = 1) =>
    media === "movie"
      ? tmdbFetch<TMDBPaged<TMDBMovie>>(`/discover/movie`, { with_genres: genreId, page, sort_by: "popularity.desc" })
      : tmdbFetch<TMDBPaged<TMDBMovie>>(`/discover/tv`, { with_genres: genreId, page, sort_by: "popularity.desc" }),

  person: (id: number) =>
    tmdbFetch<{ id: number; name: string; biography: string; birthday: string | null; profile_path: string | null; place_of_birth: string | null; movie_credits?: { cast: TMDBMovie[] }; tv_credits?: { cast: TMDBMovie[] } }>(`/person/${id}`, { append_to_response: "movie_credits,tv_credits" }),
};

// Title helper (movie.title vs tv.name)
export function titleOf(item: { title?: string; name?: string; original_title?: string; original_name?: string }): string {
  return item.title || item.name || item.original_title || item.original_name || "Untitled";
}

export function yearOf(item: { release_date?: string; first_air_date?: string }): string {
  const d = item.release_date || item.first_air_date;
  return d ? d.slice(0, 4) : "";
}

export function dateOf(item: { release_date?: string; first_air_date?: string }): string {
  const d = item.release_date || item.first_air_date;
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
