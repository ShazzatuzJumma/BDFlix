import { NextRequest, NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdb-fetch";

/**
 * TMDB proxy. Keeps the API token on the server and adds a small in-memory cache.
 *
 * Examples:
 *   GET /api/tmdb/trending/movie/week
 *   GET /api/tmdb/movie/123?append_to_response=credits,videos
 *   GET /api/tmdb/search/multi?query=batman
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const segments = path.map(encodeURIComponent).join("/");
    const url = new URL(req.url);

    const paramsObj: Record<string, string | number | boolean | undefined> = {};
    url.searchParams.forEach((v, k) => {
      paramsObj[k] = v;
    });

    const data = await tmdbFetch(`/${segments}`, paramsObj);
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "TMDB request failed";
    const status = msg.startsWith("TMDB 404") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
