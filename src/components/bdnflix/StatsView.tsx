"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Clock, Film, Tv, Heart, Star, Flame, TrendingUp,
  Calendar, Trophy, PlayCircle, Sparkles,
} from "lucide-react";
import { getStats, type WatchStats } from "@/lib/api-client";
import { tmdbGet } from "@/lib/api-client";
import { posterUrl, type TMDBItem, type TMDBGenre } from "@/lib/tmdb-types";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { computeAchievements } from "@/lib/achievements";
import { AchievementsGrid } from "./AchievementsGrid";

interface StatsViewProps {
  profileId: string;
}

export function StatsView({ profileId }: StatsViewProps) {
  const navigate = useAppStore((s) => s.navigate);
  const openDetail = useAppStore((s) => s.openDetail);
  const [stats, setStats] = useState<WatchStats | null>(null);
  const [topGenres, setTopGenres] = useState<{ name: string; count: number }[]>([]);
  const [recentPosters, setRecentPosters] = useState<{ id: number; mediaType: string; title: string; poster: string | null; genres: number[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const s = await getStats(profileId);
        if (cancelled) return;
        setStats(s);

        // Fetch genre maps + details for recent items to compute top genres
        const [movieGenres, tvGenres] = await Promise.all([
          tmdbGet<{ genres: TMDBGenre[] }>("/genre/movie/list").catch(() => ({ genres: [] })),
          tmdbGet<{ genres: TMDBGenre[] }>("/genre/tv/list").catch(() => ({ genres: [] })),
        ]);
        const genreMap = new Map<number, string>();
        [...movieGenres.genres, ...tvGenres.genres].forEach((g) => genreMap.set(g.id, g.name));

        // Fetch details for recent items
        const details = await Promise.all(
          s.recentItems.slice(0, 12).map(async (r) => {
            try {
              const d = await tmdbGet<TMDBItem>(`/${r.mediaType}/${r.tmdbId}`);
              return { id: r.tmdbId, mediaType: r.mediaType, title: r.title, poster: d.poster_path, genres: d.genres?.map((g) => g.id) ?? d.genre_ids ?? [] };
            } catch {
              return null;
            }
          }),
        );
        if (cancelled) return;
        const valid = details.filter((d): d is NonNullable<typeof d> => d !== null);
        setRecentPosters(valid);

        // Count genres across all recent items
        const genreCounts = new Map<number, number>();
        valid.forEach((d) => d.genres.forEach((g) => genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1)));
        const top = Array.from(genreCounts.entries())
          .map(([id, count]) => ({ name: genreMap.get(id) ?? "Unknown", count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);
        setTopGenres(top);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [profileId]);

  if (loading || !stats) {
    return (
      <div className="min-h-screen pt-20 px-4 md:px-8 lg:px-12">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="h-10 w-64 rounded skeleton-shimmer" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl skeleton-shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hoursWatched = Math.floor(stats.totalMinutes / 60);
  const minutesRemainder = stats.totalMinutes % 60;
  const maxWeekly = Math.max(...stats.weeklyActivity.map((w) => w.count), 1);

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 md:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="w-7 h-7 bdnflix-red" />
            <h1 className="text-2xl md:text-3xl font-bold text-white">Your Watch Stats</h1>
          </div>
          <button
            onClick={() => navigate({ name: "yearinreview" })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-bdnflix-red to-red-700 hover:from-bdnflix-red-dark hover:to-red-800 text-white text-sm font-semibold transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Year in Review
          </button>
        </motion.div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          <StatCard
            icon={Clock}
            label="Watch Time"
            value={`${hoursWatched}h ${minutesRemainder}m`}
            color="from-blue-600/20 to-blue-900/10"
            iconColor="text-blue-400"
          />
          <StatCard
            icon={PlayCircle}
            label="Titles Watched"
            value={String(stats.totalWatched)}
            color="from-bdnflix-red/20 to-red-900/10"
            iconColor="text-bdnflix-red"
          />
          <StatCard
            icon={Flame}
            label="Day Streak"
            value={String(stats.streakDays)}
            color="from-orange-600/20 to-orange-900/10"
            iconColor="text-orange-400"
          />
          <StatCard
            icon={Trophy}
            label="This Month"
            value={String(stats.thisMonthCount)}
            color="from-yellow-600/20 to-yellow-900/10"
            iconColor="text-yellow-400"
          />
          <StatCard
            icon={Film}
            label="Movies"
            value={String(stats.totalMovies)}
            color="from-purple-600/20 to-purple-900/10"
            iconColor="text-purple-400"
          />
          <StatCard
            icon={Tv}
            label="Episodes"
            value={String(stats.totalEpisodes)}
            color="from-green-600/20 to-green-900/10"
            iconColor="text-green-400"
          />
          <StatCard
            icon={Heart}
            label="My List"
            value={String(stats.watchlistCount)}
            color="from-pink-600/20 to-pink-900/10"
            iconColor="text-pink-400"
          />
          <StatCard
            icon={Star}
            label="Avg Rating"
            value={stats.ratingsCount > 0 ? `${stats.ratingsAverage}/10` : "—"}
            color="from-cyan-600/20 to-cyan-900/10"
            iconColor="text-cyan-400"
          />
        </div>

        {/* Weekly activity chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-5 mb-6 border border-white/10"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 bdnflix-red" /> Last 7 Days
          </h2>
          <div className="flex items-end justify-between gap-2 h-32">
            {stats.weeklyActivity.map((day, i) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
              const height = (day.count / maxWeekly) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height, day.count > 0 ? 8 : 2)}%` }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                      className={cn(
                        "w-full rounded-t",
                        day.count > 0 ? "bg-bdnflix-red" : "bg-white/10",
                      )}
                    />
                  </div>
                  <span className="text-xs text-white/50">{dayName}</span>
                  <span className="text-xs text-white/70 font-semibold">{day.count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top genres */}
        {topGenres.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-5 mb-6 border border-white/10"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 bdnflix-red" /> Your Top Genres
            </h2>
            <div className="space-y-2">
              {topGenres.map((g, i) => {
                const maxCount = topGenres[0].count;
                const width = (g.count / maxCount) * 100;
                return (
                  <div key={g.name} className="flex items-center gap-3">
                    <span className="text-sm text-white/70 w-24 truncate">{g.name}</span>
                    <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-bdnflix-red to-red-700 rounded-full flex items-center justify-end pr-2"
                      >
                        <span className="text-xs text-white font-semibold">{g.count}</span>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Recently watched posters */}
        {recentPosters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-5 border border-white/10"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 bdnflix-red" /> Recently Watched
            </h2>
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
              {recentPosters.map((item) => (
                <button
                  key={`${item.mediaType}-${item.id}`}
                  onClick={() => openDetail(item.mediaType as "movie" | "tv", item.id)}
                  className="shrink-0 w-24 md:w-28 group"
                >
                  <div className="w-24 h-36 md:w-28 md:h-40 rounded-lg overflow-hidden bg-[#1a1a22] mb-1 ring-1 ring-white/5 group-hover:ring-bdnflix-red transition-all">
                    {item.poster ? (
                      <img
                        src={posterUrl(item.poster, "w200")}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30 text-xs p-1 text-center">{item.title}</div>
                    )}
                  </div>
                  <p className="text-xs text-white/70 truncate group-hover:text-white transition-colors">{item.title}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Achievements */}
        <div className="mb-6">
          <AchievementsGrid achievements={computeAchievements({
            totalWatched: stats.totalWatched,
            totalEpisodes: stats.totalEpisodes,
            totalMovies: stats.totalMovies,
            totalMinutes: stats.totalMinutes,
            watchlistCount: stats.watchlistCount,
            ratingsCount: stats.ratingsCount,
            streakDays: stats.streakDays,
            thisMonthCount: stats.thisMonthCount,
          })} />
        </div>

        {/* Empty state hint */}
        {stats.totalWatched === 0 && (
          <div className="text-center py-12 text-white/50">
            <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium text-white/70">Start watching to see your stats</p>
            <p className="text-sm mt-1">Your watch history, streaks, and favorite genres will appear here.</p>
            <button
              onClick={() => navigate({ name: "home" })}
              className="mt-4 px-6 py-2 rounded-lg bg-bdnflix-red hover:bg-bdnflix-red-dark text-white font-semibold transition-colors"
            >
              Browse Content
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  iconColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn("rounded-xl p-4 border border-white/10 bg-gradient-to-br relative overflow-hidden", color)}
    >
      <Icon className={cn("w-5 h-5 mb-2", iconColor)} />
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-white/60 mt-1">{label}</p>
    </motion.div>
  );
}
