/**
 * Internal raw TMDB fetch with caching — shared by the typed client and the
 * passthrough proxy route. Kept in a separate module so the route can import it
 * without pulling the heavy typed client into the edge bundle.
 */
const TMDB_BASE = "https://api.themoviedb.org/3";

type CacheEntry = { data: unknown; expires: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;

export async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }

  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }

  const TOKEN = process.env.TMDB_API_TOKEN || "";
  const API_KEY = process.env.TMDB_API_KEY || "";

  const headers: Record<string, string> = { Accept: "application/json" };
  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
  } else if (API_KEY) {
    url.searchParams.set("api_key", API_KEY);
  }

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`TMDB ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as T;
  cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL });
  return data;
}
