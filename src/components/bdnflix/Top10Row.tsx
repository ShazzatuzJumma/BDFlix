"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { posterUrl, titleOf, yearOf, type TMDBItem } from "@/lib/tmdb-types";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

interface Top10RowProps {
  title: string;
  items: TMDBItem[];
  media?: "movie" | "tv";
}

/**
 * Netflix-style "Top 10" row with oversized rank numbers behind each poster.
 */
export function Top10Row({ title, items, media }: Top10RowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const openDetail = useAppStore((s) => s.openDetail);
  const navigate = useAppStore((s) => s.navigate);

  const top10 = items.slice(0, 10);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    return () => el.removeEventListener("scroll", updateArrows);
  }, [top10.length]);

  const scrollBy = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * scrollRef.current.clientWidth * 0.85, behavior: "smooth" });
  };

  if (top10.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="relative group/row"
    >
      <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white px-4 md:px-8 lg:px-12 mb-2 md:mb-3 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 bdnflix-red" />
        {title}
      </h2>

      <div className="relative">
        {canLeft && (
          <button
            onClick={() => scrollBy(-1)}
            className="absolute left-0 top-0 bottom-0 z-20 w-10 md:w-12 flex items-center justify-center bg-gradient-to-r from-[#0b0b0f]/90 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
        )}

        <div ref={scrollRef} className="no-scrollbar flex gap-2 md:gap-4 overflow-x-auto px-4 md:px-8 lg:px-12 py-6">
          {top10.map((item, idx) => {
            const mt = media || (item.media_type as "movie" | "tv") || (item.title ? "movie" : "tv");
            const rank = idx + 1;
            return (
              <motion.div
                key={`${mt}-${item.id}`}
                whileHover={{ scale: 1.05, zIndex: 20 }}
                transition={{ duration: 0.25 }}
                className="relative shrink-0 cursor-pointer flex items-end"
                onClick={() => openDetail(mt, item.id)}
              >
                {/* Oversized rank number */}
                <span
                  className="text-[120px] md:text-[180px] font-black leading-none text-transparent select-none -mr-4 md:-mr-8"
                  style={{
                    WebkitTextStroke: "4px #4a4a55",
                    textShadow: "0 0 1px rgba(255,255,255,0.1)",
                  }}
                >
                  {rank}
                </span>
                {/* Poster */}
                <div className="relative w-[100px] md:w-[150px] aspect-[2/3] rounded-md overflow-hidden bg-[#1a1a22] card-shadow">
                  {item.poster_path ? (
                    <img
                      src={posterUrl(item.poster_path, "w500")}
                      alt={titleOf(item)}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30 text-xs p-2 text-center">
                      {titleOf(item)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    <p className="text-white text-xs font-semibold line-clamp-2">{titleOf(item)}</p>
                    {item.vote_average > 0 && (
                      <p className="text-green-400 text-xs">{Math.round(item.vote_average * 10)}%</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {canRight && (
          <button
            onClick={() => scrollBy(1)}
            className="absolute right-0 top-0 bottom-0 z-20 w-10 md:w-12 flex items-center justify-center bg-gradient-to-l from-[#0b0b0f]/90 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        )}
      </div>
    </motion.section>
  );
}
