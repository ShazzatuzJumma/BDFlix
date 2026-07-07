"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, ChevronDown, Star, Sparkles, Film } from "lucide-react";
import { posterUrl, backdropUrl, titleOf, yearOf, type TMDBItem } from "@/lib/tmdb-types";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

interface ContentCardProps {
  item: TMDBItem;
  variant?: "poster" | "backdrop";
  progress?: number; // 0..1
  className?: string;
}

export function ContentCard({ item, variant = "poster", progress, className }: ContentCardProps) {
  const [loaded, setLoaded] = useState(false);
  const openDetail = useAppStore((s) => s.openDetail);
  const openTrailer = useAppStore((s) => s.openTrailer);
  const navigate = useAppStore((s) => s.navigate);

  const mediaType = (item.media_type as "movie" | "tv") || (item.title ? "movie" : "tv");
  const title = titleOf(item);
  const year = yearOf(item);
  const rating = item.vote_average ? Math.round(item.vote_average * 10) / 10 : 0;
  const matchPercent = item.vote_average ? Math.round(item.vote_average * 10) : 0;

  // "NEW" badge for content released in the last 30 days
  // "JUST ADDED" badge for content released in the last 7 days
  const releaseDate = item.release_date || item.first_air_date;
  const { isNew, isJustAdded } = (() => {
    if (!releaseDate) return { isNew: false, isJustAdded: false };
    const d = new Date(releaseDate);
    const diff = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    return {
      isNew: diff >= 0 && diff <= 30,
      isJustAdded: diff >= 0 && diff <= 7,
    };
  })();

  // "TOP 10" badge for highly rated content
  const isTopRated = item.vote_average >= 8.0 && item.vote_count > 1000;

  const img = variant === "poster"
    ? posterUrl(item.poster_path, "w500")
    : backdropUrl(item.backdrop_path || item.poster_path, "w780");

  const handleClick = () => openDetail(mediaType, item.id);

  return (
    <motion.div
      whileHover={{ scale: 1.06, zIndex: 20 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative shrink-0 cursor-pointer rounded-md overflow-hidden bg-[#1a1a22] group",
        variant === "poster" ? "w-[140px] md:w-[180px] aspect-[2/3]" : "w-[280px] md:w-[340px] aspect-video",
        className,
      )}
      onClick={handleClick}
    >
      {/* Image */}
      {!loaded && <div className="absolute inset-0 skeleton-shimmer" />}
      {img ? (
        <img
          src={img}
          alt={title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/30 text-xs p-2 text-center">
          {title}
        </div>
      )}

      {/* Freshness badges */}
      {isJustAdded ? (
        <div className="absolute top-1.5 left-1.5 bg-bdnflix-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5 pulse-glow">
          <Sparkles className="w-2.5 h-2.5" /> Just Added
        </div>
      ) : isNew ? (
        <div className="absolute top-1.5 left-1.5 bg-bdnflix-red/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5">
          <Sparkles className="w-2.5 h-2.5" /> New
        </div>
      ) : isTopRated ? (
        <div className="absolute top-1.5 left-1.5 bg-yellow-500/90 text-black text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5">
          <Star className="w-2.5 h-2.5 fill-black text-black" /> Top Rated
        </div>
      ) : null}

      {/* Top-right rating badge (always visible) */}
      {rating > 0 && (
        <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-0 transition-opacity">
          <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
          <span className="text-[10px] font-bold text-white">{rating}</span>
        </div>
      )}

      {/* Progress bar */}
      {progress != null && progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
          <div
            className="h-full bg-bdnflix-red transition-all duration-500"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
        <h4 className="text-white text-sm font-semibold line-clamp-2 mb-1">{title}</h4>
        <div className="flex items-center gap-2 text-xs text-white/80 mb-2">
          {matchPercent > 0 && (
            <span className="text-green-400 font-semibold">{matchPercent}% Match</span>
          )}
          {year && <span className="text-white/60">{year}</span>}
          <span className="uppercase border border-white/30 px-1 rounded text-[10px] text-white/70">{mediaType}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate({ name: "player", mediaType, tmdbId: item.id });
            }}
            className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 hover:scale-110 transition-all"
            aria-label="Play"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openTrailer(mediaType, item.id);
            }}
            className="w-7 h-7 rounded-full border border-white/40 text-white flex items-center justify-center hover:border-white hover:bg-white/10 transition-all"
            aria-label="Watch trailer"
            title="Watch Trailer"
          >
            <Film className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDetail(mediaType, item.id);
            }}
            className="w-7 h-7 rounded-full border border-white/40 text-white flex items-center justify-center hover:border-white hover:bg-white/10 transition-all"
            aria-label="More info"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
