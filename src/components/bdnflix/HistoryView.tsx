"use client";

import { useEffect, useState } from "react";
import { History, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHistory, clearHistory, type HistoryItem } from "@/lib/api-client";
import { posterUrl, titleOf } from "@/lib/tmdb-types";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";

interface HistoryViewProps {
  profileId: string;
}

export function HistoryView({ profileId }: HistoryViewProps) {
  const navigate = useAppStore((s) => s.navigate);
  const openDetail = useAppStore((s) => s.openDetail);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getHistory(profileId)
      .then(({ items }) => setItems(items))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [profileId]);

  const handleClear = async () => {
    await clearHistory(profileId);
    setItems([]);
    toast.success("History cleared");
  };

  const handleClearOne = async (id: string) => {
    await clearHistory(profileId, id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Group by day
  const grouped = items.reduce<Record<string, HistoryItem[]>>((acc, item) => {
    const day = new Date(item.watchedAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    (acc[day] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 md:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <History className="w-7 h-7 bdnflix-red" />
            <h1 className="text-2xl md:text-3xl font-bold text-white">Watch History</h1>
            {items.length > 0 && (
              <span className="text-white/50 text-sm">({items.length})</span>
            )}
          </div>
          {items.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClear}
              className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Clear All
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg skeleton-shimmer" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-white/50">
            <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium text-white/70">No watch history yet</p>
            <p className="text-sm mt-1">Start watching to see your history here.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([day, dayItems]) => (
              <div key={day}>
                <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">{day}</h2>
                <div className="space-y-2">
                  {dayItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 group"
                    >
                      <button
                        onClick={() => openDetail(item.mediaType as "movie" | "tv", item.tmdbId)}
                        className="w-16 h-24 shrink-0 rounded overflow-hidden bg-[#1a1a22]"
                      >
                        {item.poster ? (
                          <img src={posterUrl(item.poster, "w200")} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {item.title}
                          {item.mediaType === "tv" && item.season != null && item.episode != null && item.season > 0 && (
                            <span className="text-white/60"> · S{item.season} E{item.episode}</span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-white/50">
                            {new Date(item.watchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </p>
                          <span className="text-[10px] uppercase border border-white/20 px-1 rounded text-white/50">
                            {item.mediaType}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate({ name: "player", mediaType: item.mediaType as "movie" | "tv", tmdbId: item.tmdbId, season: item.mediaType === "tv" && item.season ? item.season : undefined, episode: item.mediaType === "tv" && item.episode ? item.episode : undefined })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black text-xs font-semibold opacity-0 group-hover:opacity-100 transition hover:scale-105"
                        aria-label="Watch Again"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span className="hidden sm:inline">Watch Again</span>
                      </button>
                      <button
                        onClick={() => handleClearOne(item.id)}
                        className="w-9 h-9 rounded-full text-white/50 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                        aria-label="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
