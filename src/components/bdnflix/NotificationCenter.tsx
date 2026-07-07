"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Tv, Film, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getWatchlist, tmdbGet, type WatchlistItem } from "@/lib/api-client";
import { posterUrl, titleOf, type TMDBItem, type TMDBPaged } from "@/lib/tmdb-types";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

interface NotificationCenterProps {
  profileId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Notification {
  id: string;
  type: "new-episode" | "trending" | "info";
  title: string;
  body: string;
  mediaType?: "movie" | "tv";
  tmdbId?: number;
  poster?: string | null;
  timestamp: Date;
}

export function NotificationCenter({ profileId, open, onOpenChange }: NotificationCenterProps) {
  const navigate = useAppStore((s) => s.navigate);
  const openDetail = useAppStore((s) => s.openDetail);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { items: watchlist } = await getWatchlist(profileId);
        const tvItems = watchlist.filter((w) => w.mediaType === "tv");
        const movieItems = watchlist.filter((w) => w.mediaType === "movie");

        const notifs: Notification[] = [];

        // Check for new episodes of watchlisted TV shows (airing today)
        if (tvItems.length > 0) {
          try {
            const onTheAir = await tmdbGet<TMDBPaged<TMDBItem>>("/tv/airing_today");
            const airingIds = new Set(onTheAir.results?.map((r) => r.id) ?? []);
            tvItems.forEach((w) => {
              if (airingIds.has(w.tmdbId)) {
                notifs.push({
                  id: `new-ep-${w.tmdbId}`,
                  type: "new-episode",
                  title: "New Episode Available",
                  body: `New episode of "${w.title}" is airing today!`,
                  mediaType: "tv",
                  tmdbId: w.tmdbId,
                  poster: w.poster,
                  timestamp: new Date(),
                });
              }
            });
          } catch {
            // ignore
          }
        }

        // Trending today notification
        try {
          const trending = await tmdbGet<TMDBPaged<TMDBItem>>("/trending/all/day");
          const topTrending = trending.results?.[0];
          if (topTrending) {
            notifs.push({
              id: `trending-${topTrending.id}`,
              type: "trending",
              title: "🔥 Trending Now",
              body: `"${titleOf(topTrending)}" is trending today on BDnFlix`,
              mediaType: (topTrending.media_type as "movie" | "tv") || (topTrending.title ? "movie" : "tv"),
              tmdbId: topTrending.id,
              poster: topTrending.poster_path,
              timestamp: new Date(),
            });
          }
        } catch {
          // ignore
        }

        // Watchlist size milestone
        if (watchlist.length >= 5) {
          notifs.push({
            id: "milestone-watchlist",
            type: "info",
            title: "📺 Watchlist Growing",
            body: `You have ${watchlist.length} titles in your My List. Keep adding!`,
            timestamp: new Date(),
          });
        }

        if (!cancelled) setNotifications(notifs);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [profileId]);

  const visibleNotifs = notifications.filter((n) => !dismissed.has(n.id));
  const unreadCount = visibleNotifs.length;

  const handleClick = (notif: Notification) => {
    if (notif.tmdbId && notif.mediaType) {
      openDetail(notif.mediaType, notif.tmdbId);
      onOpenChange(false);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-[#0b0b0f] border-white/10 text-white w-full md:w-[400px] p-0">
        <SheetHeader className="px-5 py-4 border-b border-white/10 flex-row items-center justify-between">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 bdnflix-red" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-bdnflix-red text-white ml-1">{unreadCount}</Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg">
                    <div className="w-10 h-10 rounded-full skeleton-shimmer shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 rounded skeleton-shimmer" />
                      <div className="h-2 w-full rounded skeleton-shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleNotifs.length === 0 ? (
              <div className="text-center py-16 text-white/40">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium text-white/60">You're all caught up!</p>
                <p className="text-xs mt-1">New notifications will appear here.</p>
              </div>
            ) : (
              <AnimatePresence>
                {visibleNotifs.map((notif) => (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={cn(
                      "relative flex gap-3 p-3 rounded-lg border transition-all",
                      notif.tmdbId
                        ? "border-white/10 bg-white/5 hover:bg-white/8 cursor-pointer"
                        : "border-white/5 bg-white/2",
                    )}
                    onClick={() => handleClick(notif)}
                  >
                    {/* Icon / Poster */}
                    {notif.poster ? (
                      <div className="w-12 h-16 rounded overflow-hidden bg-[#1a1a22] shrink-0">
                        <img src={posterUrl(notif.poster, "w200")} alt={notif.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-bdnflix-red/20 flex items-center justify-center shrink-0">
                        {notif.type === "new-episode" ? (
                          <Tv className="w-5 h-5 bdnflix-red" />
                        ) : notif.type === "trending" ? (
                          <Sparkles className="w-5 h-5 bdnflix-red" />
                        ) : (
                          <Film className="w-5 h-5 bdnflix-red" />
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-sm font-semibold text-white">{notif.title}</p>
                      <p className="text-xs text-white/60 mt-0.5 line-clamp-2">{notif.body}</p>
                      <p className="text-[10px] text-white/40 mt-1">
                        {notif.timestamp.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>

                    {/* Dismiss */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(notif.id);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
                      aria-label="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
