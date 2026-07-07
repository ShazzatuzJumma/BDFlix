"use client";

import { motion } from "framer-motion";
import { Flame, Sparkles, Calendar, Users, Film } from "lucide-react";
import { ContentRow } from "./ContentRow";
import { Top10Row } from "./Top10Row";
import { LanguageBrowse } from "./LanguageBrowse";
import { useTmdbList } from "./hooks";
import { tmdbGet } from "@/lib/api-client";
import { profileUrl, titleOf, type TMDBItem } from "@/lib/tmdb-types";
import { useAppStore } from "@/store/useAppStore";
import { useEffect, useState } from "react";

interface TrendingPerson {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  known_for?: TMDBItem[];
}

interface NewPopularViewProps {
  isKids: boolean;
}

export function NewPopularView({ isKids }: NewPopularViewProps) {
  const trendingDay = useTmdbList("/trending/all/day");
  const trendingWeek = useTmdbList("/trending/all/week");
  const popularMovies = useTmdbList("/movie/popular");
  const popularTV = useTmdbList("/tv/popular");
  const nowPlaying = useTmdbList("/movie/now_playing");
  const onTheAir = useTmdbList("/tv/on_the_air");
  const upcoming = useTmdbList("/movie/upcoming");

  const navigate = useAppStore((s) => s.navigate);
  const [people, setPeople] = useState<TrendingPerson[]>([]);

  useEffect(() => {
    let cancelled = false;
    tmdbGet<{ results: TrendingPerson[] }>("/trending/person/week")
      .then((d) => {
        if (!cancelled) {
          setPeople((d.results || []).slice(0, 12));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const filter = (items: TMDBItem[] = []) =>
    isKids ? items.filter((i) => !i.adult && i.vote_average <= 7.5) : items;

  return (
    <div className="min-h-screen pt-20 pb-16">
      {/* Header banner */}
      <div className="relative mb-6 px-4 md:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-2"
        >
          <Flame className="w-7 h-7 bdnflix-red" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">New & Popular</h1>
        </motion.div>
        <p className="text-white/50 text-sm">The latest trending content and popular people, refreshed daily.</p>
      </div>

      <div className="space-y-4 md:space-y-6">
        <Top10Row
          title="🔥 Top 10 Today"
          items={filter(trendingDay.data?.results)}
        />

        {/* Trending People */}
        {people.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="px-4 md:px-8 lg:px-12"
          >
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 bdnflix-red" /> Trending People This Week
            </h2>
            <div className="no-scrollbar flex gap-3 md:gap-4 overflow-x-auto pb-2">
              {people.map((p, idx) => (
                <motion.button
                  key={p.id}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate({ name: "person", personId: p.id })}
                  className="shrink-0 w-28 md:w-32 text-left group"
                >
                  <div className="relative">
                    <span className="absolute -left-2 top-2 text-5xl md:text-6xl font-black text-transparent select-none z-0" style={{ WebkitTextStroke: "2px #4a4a55" }}>
                      {idx + 1}
                    </span>
                    <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-[#1a1a22] mb-2 ring-2 ring-transparent group-hover:ring-bdnflix-red transition-all ml-4">
                      {p.profile_path ? (
                        <img src={profileUrl(p.profile_path, "w185")} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30 text-3xl">👤</div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-white truncate group-hover:text-bdnflix-red transition-colors ml-4">{p.name}</p>
                  <p className="text-xs text-white/50 truncate capitalize ml-4">{p.known_for_department}</p>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        <ContentRow
          title="✨ Trending This Week"
          items={filter(trendingWeek.data?.results)}
          variant="backdrop"
        />

        <ContentRow
          title="🎬 Now Playing in Theaters"
          items={filter(nowPlaying.data?.results)}
        />

        <ContentRow
          title="📺 New TV Episodes (On The Air)"
          items={filter(onTheAir.data?.results)}
          variant="backdrop"
        />

        <ContentRow
          title="🍿 Popular Movies"
          items={filter(popularMovies.data?.results)}
        />

        <ContentRow
          title="🎬 Coming Soon"
          items={filter(upcoming.data?.results)}
        />

        <ContentRow
          title="📺 Popular TV Shows"
          items={filter(popularTV.data?.results)}
        />

        <LanguageBrowse isKids={isKids} />
      </div>
    </div>
  );
}
