"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Calendar, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tmdbGet } from "@/lib/api-client";
import { stillUrl, type TMDBItem, type TMDBEpisode } from "@/lib/tmdb-types";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

interface EpisodesSectionProps {
  tvId: number;
  seasons: { id: number; name: string; season_number: number; episode_count: number; poster_path: string | null }[];
}

interface SeasonData {
  episodes: TMDBEpisode[];
  name: string;
  overview: string;
  season_number: number;
}

export function EpisodesSection({ tvId, seasons }: EpisodesSectionProps) {
  const navigate = useAppStore((s) => s.navigate);
  const closeDetail = useAppStore((s) => s.closeDetail);
  const validSeasons = seasons.filter((s) => s.season_number >= 1);
  const [selectedSeason, setSelectedSeason] = useState<number>(
    validSeasons[0]?.season_number ?? 1,
  );
  const [seasonData, setSeasonData] = useState<SeasonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    tmdbGet<SeasonData>(`/tv/${tvId}/season/${selectedSeason}`)
      .then((d) => { if (!cancelled) setSeasonData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tvId, selectedSeason]);

  const handlePlay = (episode: TMDBEpisode) => {
    closeDetail();
    navigate({
      name: "player",
      mediaType: "tv",
      tmdbId: tvId,
      season: episode.season_number,
      episode: episode.episode_number,
    });
  };

  if (validSeasons.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 md:px-8 py-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Episodes</h3>
        {validSeasons.length > 1 && (
          <Select value={String(selectedSeason)} onValueChange={(v) => setSelectedSeason(Number(v))}>
            <SelectTrigger className="w-44 bg-white/5 border-white/10 text-white h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#16161d] border-white/10 text-white max-h-72">
              {validSeasons.map((s) => (
                <SelectItem key={s.id} value={String(s.season_number)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-2 rounded-lg">
              <div className="w-32 h-18 rounded skeleton-shimmer shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded skeleton-shimmer" />
                <div className="h-3 w-full rounded skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {(seasonData?.episodes ?? []).map((ep) => (
            <motion.button
              key={ep.id}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              onClick={() => handlePlay(ep)}
              className="w-full flex gap-3 p-2 rounded-lg text-left group"
            >
              <div className="relative w-32 h-18 md:w-40 md:h-24 shrink-0 rounded overflow-hidden bg-[#1a1a22]">
                {ep.still_path ? (
                  <img
                    src={stillUrl(ep.still_path, "w300")}
                    alt={ep.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">No image</div>
                )}
                <span className="absolute bottom-1 left-1 bg-black/80 text-white text-xs px-1.5 rounded font-semibold">
                  E{ep.episode_number}
                </span>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-4 h-4 fill-black text-black" />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-white text-sm truncate">{ep.name}</p>
                  <div className="flex items-center gap-2 text-xs text-white/50 shrink-0">
                    {ep.runtime && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> {ep.runtime}m
                      </span>
                    )}
                    {ep.air_date && (
                      <span className="hidden md:flex items-center gap-0.5">
                        <Calendar className="w-3 h-3" /> {new Date(ep.air_date).getFullYear()}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-white/60 line-clamp-2 mt-1">{ep.overview || "No description available."}</p>
              </div>
            </motion.button>
          ))}
          {!seasonData?.episodes?.length && (
            <p className="text-white/40 text-sm py-4 text-center">No episodes found for this season.</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
