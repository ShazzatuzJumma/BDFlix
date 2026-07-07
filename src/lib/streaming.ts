import type { MediaType } from "@/lib/tmdb";

/**
 * BDnFlix streaming source providers.
 *
 * Adapted from the streambert project (https://github.com/truelockmc/streambert)
 * for a web context. These are public embed players that work inside an <iframe>
 * in a normal browser. Each builds a URL from a TMDB id (+ season/episode for TV).
 *
 * We expose multiple sources so the user can switch if one is down.
 */
export interface StreamSource {
  id: string;
  name: string;
  /** Build an embeddable player URL. */
  build: (args: { tmdbId: number; mediaType: MediaType; season?: number; episode?: number }) => string;
  /** Whether this source supports TV. */
  supportsTV: boolean;
  /** Default subtitle language code (ISO 639-1). */
  defaultSubs?: string;
}

export const STREAM_SOURCES: StreamSource[] = [
  {
    id: "videasy",
    name: "Videasy",
    supportsTV: true,
    defaultSubs: "en",
    build: ({ tmdbId, mediaType, season, episode }) => {
      const color = "E50914"; // BDnFlix red
      if (mediaType === "movie") {
        return `https://player.videasy.to/movie/${tmdbId}?color=${color}&subtitleLanguage=en`;
      }
      return `https://player.videasy.to/tv/${tmdbId}/${season ?? 1}/${episode ?? 1}?color=${color}&subtitleLanguage=en`;
    },
  },
  {
    id: "vidsrc",
    name: "VidSrc",
    supportsTV: true,
    build: ({ tmdbId, mediaType, season, episode }) => {
      if (mediaType === "movie") {
        return `https://vsembed.su/embed/movie/${tmdbId}`;
      }
      return `https://vsembed.su/embed/tv/${tmdbId}/${season ?? 1}/${episode ?? 1}`;
    },
  },
  {
    id: "vidking",
    name: "VidKing",
    supportsTV: true,
    defaultSubs: "en",
    build: ({ tmdbId, mediaType, season, episode }) => {
      if (mediaType === "movie") {
        return `https://www.vidking.net/embed/movie/${tmdbId}?autoPlay=true`;
      }
      return `https://www.vidking.net/embed/tv/${tmdbId}/${season ?? 1}/${episode ?? 1}?autoPlay=true`;
    },
  },
  {
    id: "2embed",
    name: "2Embed",
    supportsTV: true,
    build: ({ tmdbId, mediaType, season, episode }) => {
      if (mediaType === "movie") {
        return `https://www.2embed.cc/embed/${tmdbId}`;
      }
      return `https://www.2embed.cc/embedtv/${tmdbId}&s=${season ?? 1}&e=${episode ?? 1}`;
    },
  },
  {
    id: "multiembed",
    name: "MultiEmbed",
    supportsTV: true,
    build: ({ tmdbId, mediaType, season, episode }) => {
      if (mediaType === "movie") {
        return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
      }
      return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season ?? 1}&e=${episode ?? 1}`;
    },
  },
];

export function getSource(id: string): StreamSource {
  return STREAM_SOURCES.find((s) => s.id === id) ?? STREAM_SOURCES[0];
}

/**
 * Build a YouTube trailer embed URL from a TMDB videos response.
 */
export function trailerEmbedUrl(youtubeKey: string, autoplay = true): string {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  // SOCS consent cookie to bypass the EU consent gate (same trick as streambert)
  return `https://www.youtube-nocookie.com/embed/${youtubeKey}?${params.toString()}`;
}
