/**
 * Shared TMDB types safe to import on the client (no server-only code).
 */

export type MediaType = "movie" | "tv";

export interface TMDBItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
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
  popularity?: number;
  adult?: boolean;
  media_type?: string;
  seasons?: TMDBSeason[];
  created_by?: { id: number; name: string; profile_path: string | null }[];
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  spoken_languages?: { english_name: string; iso_639_1: string; name: string }[];
  origin_country?: string[];
  homepage?: string;
  imdb_id?: string;
  content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
  release_dates?: { results: { iso_3166_1: string; release_dates: { certification: string }[] }[] };
  credits?: { cast: TMDBCastMember[]; crew: TMDBCrewMember[] };
  videos?: { results: TMDBVideo[] };
  similar?: { results: TMDBItem[] };
  recommendations?: { results: TMDBItem[] };
  images?: { backdrops: { file_path: string }[]; posters: { file_path: string }[]; logos: { file_path: string }[] };
  external_ids?: { imdb_id: string | null; tvdb_id: number | null; facebook_id: string | null; instagram_id: string | null; twitter_id: string | null };
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

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null | undefined, size: "w200" | "w300" | "w500" | "original" = "w500"): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null | undefined, size: "w300" | "w780" | "w1280" | "original" = "w1280"): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function profileUrl(path: string | null | undefined, size: "w185" | "w300" | "original" = "w185"): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function stillUrl(path: string | null | undefined, size: "w300" | "w500" | "original" = "w300"): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

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

export function runtimeText(minutes?: number): string {
  if (!minutes || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
