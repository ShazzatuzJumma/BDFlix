"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronLeft, ChevronRight, List, Server, Maximize,
  SkipForward, SkipBack, Settings as SettingsIcon, Check, Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { stillUrl, titleOf, type TMDBItem, type TMDBEpisode } from "@/lib/tmdb-types";
import { useDetails, useSeason } from "./hooks";
import { useAppStore } from "@/store/useAppStore";
import { STREAM_SOURCES, getSource } from "@/lib/streaming";
import { getSettings, updateSettings, saveProgress, getProgress, type ProfileSettings } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PlayerViewProps {
  profileId: string;
  mediaType: "movie" | "tv";
  tmdbId: number;
  season?: number;
  episode?: number;
}

export function PlayerView({ profileId, mediaType, tmdbId, season, episode }: PlayerViewProps) {
  const navigate = useAppStore((s) => s.navigate);
  const goBack = useAppStore((s) => s.goBack);
  const openDetail = useAppStore((s) => s.openDetail);

  const { data: details } = useDetails(mediaType, tmdbId);
  const [currentSeason, setCurrentSeason] = useState<number>(season ?? (details?.seasons?.find((s) => s.season_number >= 1)?.season_number ?? 1));
  const [currentEpisode, setCurrentEpisode] = useState<number>(episode ?? 1);
  const { data: seasonData } = useSeason(mediaType === "tv" ? tmdbId : null, mediaType === "tv" ? currentSeason : null);

  const [sourceId, setSourceId] = useState<string>("videasy");
  const [settings, setSettings] = useState<ProfileSettings | null>(null);
  const [episodesOpen, setEpisodesOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [autoplayCountdown, setAutoplayCountdown] = useState<number | null>(null);
  const [showSkipIntro, setShowSkipIntro] = useState(false);

  // Load settings + preferred source
  useEffect(() => {
    let cancelled = false;
    getSettings(profileId).then(({ settings }) => {
      if (!cancelled) {
        setSettings(settings);
        setSourceId(settings.preferredSource);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [profileId]);

  // Load saved progress for resume
  useEffect(() => {
    if (mediaType !== "tv") return;
    let cancelled = false;
    getProgress(profileId, tmdbId, "tv").then(({ items }) => {
      if (cancelled || items.length === 0) return;
      // pick the most recently watched episode
      const latest = items[0];
      if (latest.season != null && latest.episode != null) {
        if (season == null && episode == null) {
          setCurrentSeason(latest.season);
          setCurrentEpisode(latest.episode);
        }
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [profileId, tmdbId]);

  const source = getSource(sourceId);
  const playerUrl = source.build({
    tmdbId,
    mediaType,
    season: currentSeason,
    episode: currentEpisode,
  });

  const title = details ? titleOf(details) : "Loading…";
  const currentEp = seasonData?.episodes?.find((e) => e.episode_number === currentEpisode);

  // Save progress periodically (best-effort; the iframe is cross-origin so we
  // can't read the actual video element, but we mark it as "started" so it
  // shows up in Continue Watching, and mark complete on next/prev navigation).
  const lastSaveRef = useRef<number>(0);
  const markProgress = useCallback((progress: number) => {
    const now = Date.now();
    if (now - lastSaveRef.current < 5000) return;
    lastSaveRef.current = now;
    saveProgress({
      profileId,
      tmdbId,
      mediaType,
      season: mediaType === "tv" ? currentSeason : undefined,
      episode: mediaType === "tv" ? currentEpisode : undefined,
      episodeName: currentEp?.name,
      progress,
      positionSec: Math.round(progress * (currentEp?.runtime ? currentEp.runtime * 60 : 60 * 45)),
      durationSec: currentEp?.runtime ? currentEp.runtime * 60 : 60 * 45,
      title,
      poster: details?.poster_path,
    }).catch(() => {});
  }, [profileId, tmdbId, mediaType, currentSeason, currentEpisode, currentEp, title, details]);

  // Mark "started" when player loads (only after details are available so we
  // don't save a "Loading…" title); mark "complete" when navigating away.
  const detailsReady = !!details && title !== "Loading…";
  useEffect(() => {
    if (!detailsReady) return;
    markProgress(0.05);
  }, [detailsReady, currentSeason, currentEpisode, tmdbId]);

  useEffect(() => {
    return () => {
      // On unmount, mark as progressed so it stays in Continue Watching.
      // Only save if we have a real title (details loaded).
      if (title === "Loading…") return;
      saveProgress({
        profileId,
        tmdbId,
        mediaType,
        season: mediaType === "tv" ? currentSeason : undefined,
        episode: mediaType === "tv" ? currentEpisode : undefined,
        episodeName: currentEp?.name,
        progress: 0.5,
        positionSec: Math.round(0.5 * (currentEp?.runtime ? currentEp.runtime * 60 : 60 * 45)),
        durationSec: currentEp?.runtime ? currentEp.runtime * 60 : 60 * 45,
        title,
        poster: details?.poster_path,
      }).catch(() => {});
    };
  }, [currentSeason, currentEpisode, tmdbId, title, details]);

  const changeSource = async (id: string) => {
    setSourceId(id);
    setIframeKey((k) => k + 1);
    setSourcesOpen(false);
    // persist preference
    try {
      const { settings } = await updateSettings(profileId, { preferredSource: id });
      setSettings(settings);
    } catch {
      // ignore
    }
  };

  const goPrevEpisode = () => {
    const eps = seasonData?.episodes ?? [];
    const idx = eps.findIndex((e) => e.episode_number === currentEpisode);
    if (idx > 0) {
      setCurrentEpisode(eps[idx - 1].episode_number);
      setIframeKey((k) => k + 1);
      setAutoplayCountdown(null);
    }
  };
  const goNextEpisode = () => {
    const eps = seasonData?.episodes ?? [];
    const idx = eps.findIndex((e) => e.episode_number === currentEpisode);
    if (idx >= 0 && idx < eps.length - 1) {
      setCurrentEpisode(eps[idx + 1].episode_number);
      setIframeKey((k) => k + 1);
      setAutoplayCountdown(null);
      markProgress(0.95);
    }
  };

  // Autoplay countdown effect (Netflix-style "Next episode in X seconds")
  useEffect(() => {
    if (autoplayCountdown == null || autoplayCountdown <= 0) return;
    if (autoplayCountdown === 0) {
      // Defer to avoid cascading render warning
      queueMicrotask(() => goNextEpisode());
      return;
    }
    const id = setTimeout(() => {
      setAutoplayCountdown((c) => (c != null ? c - 1 : null));
    }, 1000);
    return () => clearTimeout(id);
  }, [autoplayCountdown]);

  // Skip Intro overlay — shows for 15 seconds when player loads or episode changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowSkipIntro(true);
    const id = setTimeout(() => setShowSkipIntro(false), 15000);
    return () => clearTimeout(id);
  }, [iframeKey, currentSeason, currentEpisode]);

  const handleFullscreen = () => {
    const el = document.querySelector("iframe");
    if (el?.requestFullscreen) el.requestFullscreen();
  };

  // Next episode info for autoplay card
  const allEps = seasonData?.episodes ?? [];
  const currentEpIdx = allEps.findIndex((e) => e.episode_number === currentEpisode);
  const nextEp = currentEpIdx >= 0 && currentEpIdx < allEps.length - 1 ? allEps[currentEpIdx + 1] : null;

  const startAutoplayCountdown = () => {
    if (nextEp) setAutoplayCountdown(10);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Player iframe */}
      <div className="relative flex-1 bg-black">
        <iframe
          key={iframeKey}
          src={playerUrl}
          title={title}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="origin"
          className="w-full h-full"
        />

        {/* Top bar overlay */}
        <div className="absolute top-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center gap-3 pointer-events-none">
          <button
            onClick={() => {
              markProgress(0.5);
              goBack();
            }}
            className="pointer-events-auto w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="pointer-events-auto flex-1 min-w-0">
            <h1 className="text-white font-semibold text-sm md:text-lg truncate">{title}</h1>
            {mediaType === "tv" && currentEp && (
              <p className="text-white/70 text-xs md:text-sm truncate">
                S{currentSeason} E{currentEpisode} · {currentEp.name}
              </p>
            )}
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2">
          {mediaType === "tv" && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={goPrevEpisode}
                className="text-white hover:bg-white/10"
              >
                <SkipBack className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">Prev</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={goNextEpisode}
                disabled={!nextEp}
                className="text-white hover:bg-white/10 disabled:opacity-30"
              >
                <SkipForward className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">Next</span>
              </Button>
              {nextEp && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={startAutoplayCountdown}
                  className="text-white hover:bg-white/10"
                >
                  <Play className="w-4 h-4 md:mr-1" />
                  <span className="hidden md:inline">Play Next</span>
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEpisodesOpen(true)}
                className="text-white hover:bg-white/10"
              >
                <List className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">Episodes</span>
              </Button>
            </>
          )}
          <div className="flex-1" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSourcesOpen(true)}
            className="text-white hover:bg-white/10"
          >
            <Server className="w-4 h-4 md:mr-1" />
            <span className="hidden md:inline">{source.name}</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleFullscreen}
            className="text-white hover:bg-white/10"
            aria-label="Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </Button>
        </div>

        {/* Skip Intro overlay */}
        {showSkipIntro && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={() => {
              setShowSkipIntro(false);
              toast.info("Intro skipped");
            }}
            className="absolute bottom-24 right-4 md:right-8 z-30 px-5 py-2.5 rounded-md bg-white/15 glass border border-white/30 text-white text-sm font-bold backdrop-blur-md hover:bg-white/25 transition-all uppercase tracking-wider"
          >
            Skip Intro
          </motion.button>
        )}

        {/* Autoplay countdown overlay */}
        {autoplayCountdown != null && autoplayCountdown > 0 && nextEp && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-20 right-4 md:right-8 z-30 glass border border-white/20 rounded-xl p-4 max-w-xs"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="relative w-12 h-12 shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                  <circle
                    cx="24" cy="24" r="20" fill="none" stroke="#e50914" strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - autoplayCountdown / 10)}`}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
                  {autoplayCountdown}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/60 uppercase tracking-wider">Next Episode</p>
                <p className="text-white font-semibold text-sm truncate">E{nextEp.episode_number} · {nextEp.name}</p>
              </div>
            </div>
            <p className="text-xs text-white/50 line-clamp-2 mb-3">{nextEp.overview}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setAutoplayCountdown(null)}
                className="flex-1 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={goNextEpisode}
                className="flex-1 py-1.5 rounded-md bg-bdnflix-red hover:bg-bdnflix-red-dark text-white text-xs font-semibold transition-colors"
              >
                Play Now
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Episode selector sheet */}
      <Sheet open={episodesOpen} onOpenChange={setEpisodesOpen}>
        <SheetContent side="right" className="bg-[#0b0b0f] border-white/10 text-white w-full md:w-[460px] p-0 overflow-y-auto">
          <SheetHeader className="px-4 py-4 border-b border-white/10">
            <SheetTitle className="text-white">Episodes</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-4">
            {/* Season selector */}
            {details?.seasons && details.seasons.filter((s) => s.season_number >= 1).length > 1 && (
              <Select value={String(currentSeason)} onValueChange={(v) => { setCurrentSeason(Number(v)); setCurrentEpisode(1); setIframeKey((k) => k + 1); }}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Season" />
                </SelectTrigger>
                <SelectContent className="bg-[#16161d] border-white/10 text-white">
                  {details.seasons.filter((s) => s.season_number >= 1).map((s) => (
                    <SelectItem key={s.id} value={String(s.season_number)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="space-y-2">
              {(seasonData?.episodes ?? []).map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => {
                    setCurrentEpisode(ep.episode_number);
                    setIframeKey((k) => k + 1);
                    setEpisodesOpen(false);
                  }}
                  className={cn(
                    "w-full flex gap-3 p-2 rounded-lg text-left transition-colors",
                    ep.episode_number === currentEpisode ? "bg-bdnflix-red/20" : "hover:bg-white/5",
                  )}
                >
                  <div className="relative w-32 h-18 shrink-0 rounded overflow-hidden bg-[#1a1a22]">
                    {ep.still_path ? (
                      <img src={stillUrl(ep.still_path, "w300")} alt={ep.name} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">No image</div>
                    )}
                    <span className="absolute bottom-1 left-1 bg-black/80 text-white text-xs px-1.5 rounded">
                      E{ep.episode_number}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-white text-sm truncate">{ep.name}</p>
                      {ep.runtime && <span className="text-xs text-white/50 shrink-0">{ep.runtime}m</span>}
                    </div>
                    <p className="text-xs text-white/60 line-clamp-2 mt-0.5">{ep.overview || "No description"}</p>
                  </div>
                </button>
              ))}
              {!seasonData && <div className="text-white/40 text-sm">Loading episodes…</div>}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Source selector sheet */}
      <Sheet open={sourcesOpen} onOpenChange={setSourcesOpen}>
        <SheetContent side="bottom" className="bg-[#0b0b0f] border-white/10 text-white p-0">
          <SheetHeader className="px-4 py-4 border-b border-white/10">
            <SheetTitle className="text-white">Select Source</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-2">
            <p className="text-xs text-white/60 mb-2">
              If a source isn't working or has poor quality, try another one.
            </p>
            {STREAM_SOURCES.map((s) => (
              <button
                key={s.id}
                onClick={() => changeSource(s.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg border transition-colors",
                  s.id === sourceId
                    ? "border-bdnflix-red bg-bdnflix-red/10"
                    : "border-white/10 hover:bg-white/5",
                )}
              >
                <div className="flex items-center gap-3">
                  <Server className="w-4 h-4 text-white/70" />
                  <div className="text-left">
                    <p className="font-medium text-white">{s.name}</p>
                    <p className="text-xs text-white/50">
                      {s.supportsTV ? "Movies & TV" : "Movies only"}
                      {s.defaultSubs ? ` · Subs: ${s.defaultSubs.toUpperCase()}` : ""}
                    </p>
                  </div>
                </div>
                {s.id === sourceId && <Check className="w-5 h-5 text-bdnflix-red" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
