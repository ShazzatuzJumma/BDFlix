"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, Star, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { backdropUrl, titleOf, yearOf, type TMDBItem } from "@/lib/tmdb-types";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

interface HeroBannerProps {
  items: TMDBItem[];
}

export function HeroBanner({ items }: HeroBannerProps) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const openDetail = useAppStore((s) => s.openDetail);
  const navigate = useAppStore((s) => s.navigate);

  const featured = items.slice(0, 5);

  useEffect(() => {
    if (featured.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % featured.length);
    }, 12000);
    return () => clearInterval(id);
  }, [featured.length]);

  if (featured.length === 0) {
    return <HeroSkeleton />;
  }

  const item = featured[index];
  const mediaType = (item.media_type as "movie" | "tv") || (item.title ? "movie" : "tv");
  const title = titleOf(item);
  const year = yearOf(item);
  const rating = item.vote_average ? Math.round(item.vote_average * 10) / 10 : 0;
  const backdrop = backdropUrl(item.backdrop_path, "original");

  return (
    <div className="relative w-full h-[70vh] min-h-[480px] md:h-[85vh] md:min-h-[600px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {backdrop ? (
            <img
              src={backdrop}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1a1a22] to-[#0b0b0f]" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays */}
      <div className="absolute inset-0 hero-gradient-left" />
      <div className="absolute inset-0 hero-gradient-bottom" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end md:justify-center pb-24 md:pb-0 px-4 md:px-8 lg:px-12 max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="bdnflix-red font-black text-sm tracking-widest uppercase">
                BDnFlix {mediaType === "tv" ? "Series" : "Film"}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white text-shadow-lg leading-tight mb-4">
              {title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-3 text-white/90 text-sm md:text-base mb-4">
              {rating > 0 && (
                <span className="flex items-center gap-1 font-semibold">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {rating}
                </span>
              )}
              {year && <span>{year}</span>}
              {item.number_of_seasons && (
                <span>{item.number_of_seasons} Season{item.number_of_seasons > 1 ? "s" : ""}</span>
              )}
              {item.runtime && <span>{item.runtime}m</span>}
              <span className="border border-white/40 px-1.5 py-0.5 rounded text-xs uppercase">HD</span>
            </div>

            {/* Overview */}
            {item.overview && (
              <p className="text-white/80 text-sm md:text-lg line-clamp-3 md:line-clamp-4 max-w-xl mb-6 text-shadow-lg">
                {item.overview}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate({ name: "player", mediaType, tmdbId: item.id })}
                className="bg-white text-black hover:bg-white/85 font-semibold px-6 md:px-8"
              >
                <Play className="w-5 h-5 fill-black mr-2" /> Play
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => openDetail(mediaType, item.id)}
                className="glass text-white border border-white/20 hover:bg-white/15 font-semibold px-6 md:px-8"
              >
                <Info className="w-5 h-5 mr-2" /> More Info
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mute toggle + maturity rating */}
      <div className="absolute bottom-24 md:bottom-32 right-4 md:right-8 lg:right-12 flex items-center gap-3">
        <button
          onClick={() => setMuted((m) => !m)}
          className="w-9 h-9 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white/10"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        {item.vote_average > 0 && (
          <span className="glass border-l-2 border-white pl-2 py-1 pr-3 text-sm text-white/90">
            {Math.round(item.vote_average * 10)}% Match
          </span>
        )}
      </div>

      {/* Slide indicators */}
      {featured.length > 1 && (
        <div className="absolute bottom-16 md:bottom-6 right-4 md:right-8 lg:right-12 flex gap-1.5">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1 rounded-full transition-all",
                i === index ? "w-6 bg-bdnflix-red" : "w-2 bg-white/40 hover:bg-white/70",
              )}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className="relative w-full h-[70vh] min-h-[480px] md:h-[85vh] skeleton-shimmer" />
  );
}
