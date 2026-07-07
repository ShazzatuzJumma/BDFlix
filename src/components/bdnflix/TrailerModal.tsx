"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX, Maximize } from "lucide-react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { tmdbGet } from "@/lib/api-client";
import { titleOf, type TMDBItem, type TMDBVideo } from "@/lib/tmdb-types";
import { trailerEmbedUrl } from "@/lib/streaming";
import { useAppStore } from "@/store/useAppStore";

interface TrailerModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Quick trailer player overlay.
 * Reads the current trailer target from the app store.
 */
export function TrailerModal({ open, onClose }: TrailerModalProps) {
  const target = useAppStore((s) => s.trailerTarget);
  const [details, setDetails] = useState<TMDBItem | null>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!target) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDetails(null);
      return;
    }
    let cancelled = false;
    setDetails(null);
    tmdbGet<TMDBItem>(`/${target.mediaType}/${target.tmdbId}`, { append_to_response: "videos" })
      .then((d) => { if (!cancelled) setDetails(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [target]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMuted(true);
  }, [target?.tmdbId]);

  const trailer = details?.videos?.results?.find(
    (v: TMDBVideo) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"),
  );

  const title = details ? titleOf(details) : "Loading…";

  const handleFullscreen = () => {
    const iframe = document.querySelector("#trailer-iframe") as HTMLIFrameElement;
    iframe?.requestFullscreen?.();
  };

  return (
    <Dialog open={open && !!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-black border-white/10 text-white p-0 max-w-4xl w-[95vw] rounded-xl overflow-hidden">
        <DialogClose className="absolute right-3 top-3 z-50 w-9 h-9 rounded-full bg-black/70 hover:bg-black flex items-center justify-center text-white">
          <X className="w-5 h-5" />
        </DialogClose>

        <div className="relative aspect-video w-full bg-black">
          {trailer ? (
            <iframe
              id="trailer-iframe"
              src={trailerEmbedUrl(trailer.key, !muted)}
              title={title}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {details ? (
                <div className="text-center">
                  <p className="text-white/50 text-sm">No trailer available for "{title}"</p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="w-12 h-12 border-4 border-white/10 border-t-bdnflix-red rounded-full animate-spin" />
              )}
            </div>
          )}

          {/* Controls bar */}
          {trailer && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm truncate">{title}</p>
                <p className="text-white/50 text-xs">Official Trailer</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="w-9 h-9 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white/10"
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleFullscreen}
                  className="w-9 h-9 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white/10"
                  aria-label="Fullscreen"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
