"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Film, Tv, Star, Heart, Trophy, Flame, TrendingUp, Sparkles, PlayCircle } from "lucide-react";
import { getStats, getHistory, type WatchStats, type HistoryItem } from "@/lib/api-client";
import { tmdbGet } from "@/lib/api-client";
import { posterUrl, titleOf, type TMDBItem, type TMDBGenre } from "@/lib/tmdb-types";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

interface YearInReviewProps {
  profileId: string;
}

export function YearInReview({ profileId }: YearInReviewProps) {
  const navigate = useAppStore((s) => s.navigate);
  const openDetail = useAppStore((s) => s.openDetail);
  const [stats, setStats] = useState<WatchStats | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [topGenres, setTopGenres] = useState<{ name: string; count: number }[]>([]);
  const [topItems, setTopItems] = useState<{ id: number; mediaType: string; title: string; poster: string | null; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [s, h] = await Promise.all([
          getStats(profileId),
          getHistory(profileId, 200),
        ]);
        if (cancelled) return;
        setStats(s);
        setHistory(h.items);

        // Fetch genres
        const [movieGenres, tvGenres] = await Promise.all([
          tmdbGet<{ genres: TMDBGenre[] }>("/genre/movie/list").catch(() => ({ genres: [] })),
          tmdbGet<{ genres: TMDBGenre[] }>("/genre/tv/list").catch(() => ({ genres: [] })),
        ]);
        const genreMap = new Map<number, string>();
        [...movieGenres.genres, ...tvGenres.genres].forEach((g) => genreMap.set(g.id, g.name));

        // Fetch details for all history items to compute top genres + most-watched
        const detailsMap = new Map<string, TMDBItem>();
        const uniqueIds = new Set(h.items.map((i) => `${i.mediaType}-${i.tmdbId}`));
        await Promise.all(
          Array.from(uniqueIds).slice(0, 30).map(async (key) => {
            const [mediaType, idStr] = key.split("-");
            try {
              const d = await tmdbGet<TMDBItem>(`/${mediaType}/${idStr}`);
              detailsMap.set(key, d);
            } catch {
              // ignore
            }
          }),
        );

        // Top genres
        const genreCounts = new Map<number, number>();
        detailsMap.forEach((d) => {
          (d.genres?.map((g) => g.id) ?? d.genre_ids ?? []).forEach((g) => genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1));
        });
        const top = Array.from(genreCounts.entries())
          .map(([id, count]) => ({ name: genreMap.get(id) ?? "Unknown", count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        if (!cancelled) setTopGenres(top);

        // Most-watched items (by count of history entries)
        const itemCounts = new Map<string, { id: number; mediaType: string; title: string; poster: string | null; count: number }>();
        h.items.forEach((item) => {
          const key = `${item.mediaType}-${item.tmdbId}`;
          const existing = itemCounts.get(key);
          if (existing) {
            existing.count++;
          } else {
            itemCounts.set(key, { id: item.tmdbId, mediaType: item.mediaType, title: item.title, poster: item.poster, count: 1 });
          }
        });
        const topWatched = Array.from(itemCounts.values()).sort((a, b) => b.count - a.count).slice(0, 6);
        if (!cancelled) setTopItems(topWatched);
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
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-16 w-80 rounded skeleton-shimmer" />
          <div className="h-48 rounded-xl skeleton-shimmer" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl skeleton-shimmer" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hoursWatched = Math.floor(stats.totalMinutes / 60);
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 md:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto">
        {/* Hero header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 relative"
        >
          <div className="ambient-gradient ambient-gradient-1" style={{ opacity: 0.08 }} />
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bdnflix-red/20 border border-bdnflix-red/30 text-bdnflix-red text-sm font-bold uppercase tracking-wider mb-4"
          >
            <Sparkles className="w-4 h-4" /> {year} Year in Review
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-3 text-shadow-lg">
            Your Year on BDnFlix
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            {stats.totalWatched > 0
              ? `You watched ${stats.totalWatched} titles and spent ${hoursWatched} hours streaming this year.`
              : "Start watching to build your year in review!"}
          </p>
        </motion.div>

        {stats.totalWatched === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <PlayCircle className="w-20 h-20 mx-auto mb-4 text-white/20" />
            <p className="text-white/60 text-lg mb-4">No watch history yet this year</p>
            <button
              onClick={() => navigate({ name: "home" })}
              className="px-6 py-2.5 rounded-lg bg-bdnflix-red hover:bg-bdnflix-red-dark text-white font-semibold transition-colors"
            >
              Start Watching
            </button>
          </motion.div>
        ) : (
          <>
            {/* Big highlight cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <HighlightCard
                icon={Clock}
                value={`${hoursWatched}h`
                + (stats.totalMinutes % 60 > 0 ? ` ${stats.totalMinutes % 60}m` : "")}
                label="Time Watched"
                gradient="from-blue-600/30 to-blue-900/10"
                iconColor="text-blue-400"
                delay={0.1}
              />
              <HighlightCard
                icon={Film}
                value={String(stats.totalWatched)}
                label="Titles Watched"
                gradient="from-bdnflix-red/30 to-red-900/10"
                iconColor="text-bdnflix-red"
                delay={0.2}
              />
              <HighlightCard
                icon={Flame}
                value={`${stats.streakDays} days`}
                label="Longest Streak"
                gradient="from-orange-600/30 to-orange-900/10"
                iconColor="text-orange-400"
                delay={0.3}
              />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <MiniStat icon={Film} value={String(stats.totalMovies)} label="Movies" color="text-purple-400" />
              <MiniStat icon={Tv} value={String(stats.totalEpisodes)} label="Episodes" color="text-green-400" />
              <MiniStat icon={Heart} value={String(stats.watchlistCount)} label="In My List" color="text-pink-400" />
              <MiniStat icon={Star} value={stats.ratingsCount > 0 ? `${stats.ratingsAverage}/10` : "—"} label="Avg Rating" color="text-yellow-400" />
            </div>

            {/* Top genres */}
            {topGenres.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass rounded-xl p-5 mb-6 border border-white/10"
              >
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 bdnflix-red" /> Your Top Genres This Year
                </h2>
                <div className="space-y-2.5">
                  {topGenres.map((g, i) => {
                    const maxCount = topGenres[0].count;
                    const width = (g.count / maxCount) * 100;
                    return (
                      <div key={g.name} className="flex items-center gap-3">
                        <span className="text-sm text-white/70 w-24 truncate">{g.name}</span>
                        <div className="flex-1 h-7 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${width}%` }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 0.6, ease: "easeOut" }}
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

            {/* Most watched */}
            {topItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass rounded-xl p-5 mb-6 border border-white/10"
              >
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 bdnflix-red" /> Most Watched Titles
                </h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {topItems.map((item, idx) => (
                    <motion.button
                      key={`${item.mediaType}-${item.id}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + idx * 0.08 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => openDetail(item.mediaType as "movie" | "tv", item.id)}
                      className="text-left group relative"
                    >
                      <div className="absolute -top-2 -left-2 z-10 w-7 h-7 rounded-full bg-bdnflix-red text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[#1a1a22] mb-1 ring-1 ring-white/5 group-hover:ring-bdnflix-red transition-all">
                        {item.poster ? (
                          <img src={posterUrl(item.poster, "w200")} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs p-1 text-center">{item.title}</div>
                        )}
                      </div>
                      <p className="text-xs text-white/70 truncate group-hover:text-white transition-colors">{item.title}</p>
                      <p className="text-[10px] text-white/40">{item.count}x watched</p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Summary footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center pt-4"
            >
              <p className="text-white/40 text-sm">
                Based on {history.length} watch events this year. Keep streaming to grow your stats!
              </p>
              <button
                onClick={() => navigate({ name: "stats" })}
                className="mt-4 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors"
              >
                View Full Stats
              </button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

function HighlightCard({
  icon: Icon,
  value,
  label,
  gradient,
  iconColor,
  delay,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  gradient: string;
  iconColor: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={cn("rounded-xl p-6 border border-white/10 bg-gradient-to-br text-center", gradient)}
    >
      <Icon className={cn("w-8 h-8 mx-auto mb-3", iconColor)} />
      <p className="text-3xl md:text-4xl font-black text-white mb-1">{value}</p>
      <p className="text-sm text-white/60">{label}</p>
    </motion.div>
  );
}

function MiniStat({ icon: Icon, value, label, color }: { icon: React.ElementType; value: string; label: string; color: string }) {
  return (
    <div className="glass rounded-xl p-4 border border-white/10 text-center">
      <Icon className={cn("w-5 h-5 mx-auto mb-2", color)} />
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/50">{label}</p>
    </div>
  );
}
