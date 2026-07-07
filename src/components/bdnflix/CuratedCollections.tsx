"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Award, Brain, Heart, Skull, Rocket, Laugh, Globe } from "lucide-react";
import { ContentCard } from "./ContentCard";
import { tmdbGet } from "@/lib/api-client";
import type { TMDBItem, TMDBPaged } from "@/lib/tmdb-types";
import { cn } from "@/lib/utils";

interface Collection {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  endpoint: string;
  params: Record<string, string | number>;
  media: "movie" | "tv";
}

const COLLECTIONS: Collection[] = [
  {
    id: "award-winners",
    title: "Award Winners",
    icon: Award,
    color: "text-yellow-400",
    endpoint: "/discover/movie",
    params: { sort_by: "vote_average.desc", "vote_count.gte": 2000, "primary_release_date.gte": "2000-01-01" },
    media: "movie",
  },
  {
    id: "mind-bending",
    title: "Mind-Bending Thrillers",
    icon: Brain,
    color: "text-purple-400",
    endpoint: "/discover/movie",
    params: { with_genres: 9648, sort_by: "vote_average.desc", "vote_count.gte": 500 },
    media: "movie",
  },
  {
    id: "feel-good",
    title: "Feel-Good Comedies",
    icon: Laugh,
    color: "text-orange-400",
    endpoint: "/discover/movie",
    params: { with_genres: 35, sort_by: "popularity.desc", "vote_count.gte": 500 },
    media: "movie",
  },
  {
    id: "epic-romance",
    title: "Epic Romance",
    icon: Heart,
    color: "text-pink-400",
    endpoint: "/discover/movie",
    params: { with_genres: 10749, sort_by: "vote_average.desc", "vote_count.gte": 500 },
    media: "movie",
  },
  {
    id: "horror-picks",
    title: "Scary Good Horror",
    icon: Skull,
    color: "text-red-400",
    endpoint: "/discover/movie",
    params: { with_genres: 27, sort_by: "vote_average.desc", "vote_count.gte": 500 },
    media: "movie",
  },
  {
    id: "sci-fi-adventure",
    title: "Sci-Fi Adventures",
    icon: Rocket,
    color: "text-cyan-400",
    endpoint: "/discover/movie",
    params: { with_genres: 878, sort_by: "popularity.desc", "vote_count.gte": 500 },
    media: "movie",
  },
  {
    id: "binge-worthy-tv",
    title: "Binge-Worthy TV",
    icon: Sparkles,
    color: "text-green-400",
    endpoint: "/discover/tv",
    params: { sort_by: "vote_average.desc", "vote_count.gte": 500, "first_air_date.gte": "2015-01-01" },
    media: "tv",
  },
  {
    id: "international",
    title: "International Gems",
    icon: Globe,
    color: "text-blue-400",
    endpoint: "/discover/movie",
    params: { with_original_language: "ko", sort_by: "vote_average.desc", "vote_count.gte": 200 },
    media: "movie",
  },
];

interface CuratedCollectionsProps {
  isKids: boolean;
}

export function CuratedCollections({ isKids }: CuratedCollectionsProps) {
  const [collections, setCollections] = useState<Record<string, TMDBItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all(
      COLLECTIONS.map(async (c) => {
        try {
          const data = await tmdbGet<TMDBPaged<TMDBItem>>(c.endpoint, c.params);
          const items = (data.results || [])
            .filter((r) => r.poster_path || r.backdrop_path)
            .slice(0, 18)
            .map((r) => ({ ...r, media_type: c.media }));
          return [c.id, items] as const;
        } catch {
          return [c.id, []] as const;
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, TMDBItem[]> = {};
      results.forEach(([id, items]) => { map[id] = items; });
      setCollections(map);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const filter = (items: TMDBItem[] = []) =>
    isKids ? items.filter((i) => !i.adult && i.vote_average <= 7.5) : items;

  if (loading) {
    return (
      <div className="space-y-6 px-4 md:px-8 lg:px-12 py-6">
        {COLLECTIONS.slice(0, 4).map((c) => (
          <div key={c.id}>
            <div className="h-7 w-48 rounded skeleton-shimmer mb-3" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-[140px] md:w-[180px] aspect-[2/3] rounded-md skeleton-shimmer shrink-0" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {COLLECTIONS.map((c, idx) => {
        const items = filter(collections[c.id] ?? []);
        if (items.length === 0) return null;
        const Icon = c.icon;
        return (
          <motion.section
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
            className="relative group/row"
          >
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white px-4 md:px-8 lg:px-12 mb-2 md:mb-3 flex items-center gap-2">
              <Icon className={cn("w-5 h-5", c.color)} />
              {c.title}
            </h2>
            <div className="no-scrollbar flex gap-2 md:gap-3 overflow-x-auto px-4 md:px-8 lg:px-12 py-4">
              {items.map((item) => (
                <ContentCard
                  key={`${c.media}-${item.id}`}
                  item={item}
                />
              ))}
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}
