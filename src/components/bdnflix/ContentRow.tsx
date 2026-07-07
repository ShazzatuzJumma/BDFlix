"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ContentCard } from "./ContentCard";
import type { TMDBItem } from "@/lib/tmdb-types";
import { cn } from "@/lib/utils";

interface ContentRowProps {
  title: string;
  items: TMDBItem[];
  variant?: "poster" | "backdrop";
  progressMap?: Map<string, number>;
  className?: string;
}

export function ContentRow({ title, items, variant = "poster", progressMap, className }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

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
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [items.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  if (!items || items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className={cn("relative group/row", className)}
    >
      <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white px-4 md:px-8 lg:px-12 mb-2 md:mb-3">
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

        <div
          ref={scrollRef}
          className="no-scrollbar flex gap-2 md:gap-3 overflow-x-auto scroll-smooth px-4 md:px-8 lg:px-12 py-4"
        >
          {items.map((item) => {
            const key = `${item.media_type || (item.title ? "movie" : "tv")}-${item.id}`;
            return (
              <ContentCard
                key={key}
                item={item}
                variant={variant}
                progress={progressMap?.get(key)}
              />
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
