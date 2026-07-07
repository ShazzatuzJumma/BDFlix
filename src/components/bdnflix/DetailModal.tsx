"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, Check, ThumbsUp, Star, X, Volume2, VolumeX, ChevronDown, Share2, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  backdropUrl, posterUrl, profileUrl, titleOf, yearOf, dateOf, runtimeText,
  type TMDBItem, type TMDBCastMember,
} from "@/lib/tmdb-types";
import { useAppStore } from "@/store/useAppStore";
import { EpisodesSection } from "./EpisodesSection";
import { ShareDialog } from "./ShareDialog";
import { useDetails } from "./hooks";
import {
  addToWatchlist, removeFromWatchlist, getWatchlist, setRating as setRatingApi, getRatings,
} from "@/lib/api-client";
import { trailerEmbedUrl } from "@/lib/streaming";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DetailModalProps {
  profileId: string;
}

export function DetailModal({ profileId }: DetailModalProps) {
  const target = useAppStore((s) => s.detailTarget);
  const closeDetail = useAppStore((s) => s.closeDetail);
  const openTrailer = useAppStore((s) => s.openTrailer);
  const navigate = useAppStore((s) => s.navigate);
  const [muted, setMuted] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  const { data, loading } = useDetails(target?.mediaType ?? "movie", target?.tmdbId ?? null);

  // Reset mute state when the target changes (derived reset)
  const targetId = target?.tmdbId;
  const [lastTargetId, setLastTargetId] = useState<number | undefined>(undefined);
  if (lastTargetId !== targetId) {
    setLastTargetId(targetId);
    // queue the reset without a cascading render warning
    if (muted !== true) {
      queueMicrotask(() => setMuted(true));
    }
  }

  if (!target) return null;

  const item = data;
  const title = item ? titleOf(item) : "";
  const trailer = item?.videos?.results.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"),
  );
  const cast = (item?.credits?.cast ?? []).slice(0, 12);
  const director = item?.credits?.crew?.find((c) => c.job === "Director");
  const creators = item?.created_by ?? [];
  const similar = (item?.recommendations?.results ?? []).slice(0, 12);
  const rating = item?.vote_average ? Math.round(item.vote_average * 10) / 10 : 0;
  const maturityRating = getMaturityRating(item);

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && closeDetail()}>
      <DialogContent className="bg-[#0b0b0f] border-white/10 text-white p-0 max-w-4xl w-[95vw] rounded-xl overflow-hidden max-h-[92vh] gap-0">
        <DialogTitle className="sr-only">{item ? titleOf(item) : "Content details"}</DialogTitle>
        <DialogClose className="absolute right-3 top-3 z-50 w-9 h-9 rounded-full bg-black/70 hover:bg-black flex items-center justify-center text-white">
          <X className="w-5 h-5" />
        </DialogClose>

        <ScrollArea className="max-h-[92vh]">
          {loading || !item ? (
            <div className="aspect-video skeleton-shimmer" />
          ) : (
            <>
              {/* Hero / trailer area */}
              <div className="relative aspect-video w-full bg-black">
                {trailer ? (
                  <iframe
                    src={trailerEmbedUrl(trailer.key, !muted)}
                    title={title}
                    allow="autoplay; encrypted-media; fullscreen"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : (
                  <img
                    src={backdropUrl(item.backdrop_path, "w1280") || posterUrl(item.poster_path, "w500")}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-transparent to-transparent pointer-events-none" />

                {/* Title + actions */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
                  <h1 className="text-2xl md:text-4xl font-black text-white text-shadow-lg mb-4 max-w-2xl">
                    {title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <Button
                      onClick={() => {
                        navigate({ name: "player", mediaType: target.mediaType, tmdbId: target.tmdbId });
                        closeDetail();
                      }}
                      className="bg-white text-black hover:bg-white/85 font-semibold"
                    >
                      <Play className="w-5 h-5 fill-black mr-2" /> Play
                    </Button>
                    {trailer && (
                      <Button
                        onClick={() => {
                          closeDetail();
                          openTrailer(target.mediaType, target.tmdbId);
                        }}
                        variant="secondary"
                        className="glass text-white border border-white/20 hover:bg-white/15 font-semibold"
                      >
                        <Film className="w-5 h-5 mr-2" /> Trailer
                      </Button>
                    )}
                    <WatchlistButton profileId={profileId} item={item} mediaType={target.mediaType} />
                    <RatingButton profileId={profileId} tmdbId={item.id} mediaType={target.mediaType} />
                    <button
                      onClick={() => setShareOpen(true)}
                      className="w-10 h-10 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white/10 transition-colors"
                      aria-label="Share"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    {trailer && (
                      <button
                        onClick={() => setMuted((m) => !m)}
                        className="ml-auto w-10 h-10 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white/10"
                        aria-label={muted ? "Unmute" : "Mute"}
                      >
                        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Details body */}
              <div className="p-4 md:p-8 grid md:grid-cols-3 gap-6">
                {/* Left: overview + meta */}
                <div className="md:col-span-2 space-y-4">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {rating > 0 && (
                      <span className="flex items-center gap-1 font-semibold text-green-400">
                        <Star className="w-4 h-4 fill-green-400 text-green-400" />
                        {Math.round(item.vote_average * 10)}% Match
                      </span>
                    )}
                    {dateOf(item) && <span className="text-white/80">{dateOf(item)}</span>}
                    {item.runtime && <span className="text-white/80">{runtimeText(item.runtime)}</span>}
                    {item.number_of_seasons && (
                      <span className="text-white/80">
                        {item.number_of_seasons} Season{item.number_of_seasons > 1 ? "s" : ""}
                      </span>
                    )}
                    {maturityRating && (
                      <Badge variant="outline" className="border-white/30 text-white/90">{maturityRating}</Badge>
                    )}
                    <Badge variant="outline" className="border-white/30 text-white/90 uppercase">
                      {target.mediaType}
                    </Badge>
                    <span className="border border-white/30 px-1.5 rounded text-xs text-white/80">HD</span>
                  </div>

                  {item.tagline && (
                    <p className="text-white/60 italic text-sm">"{item.tagline}"</p>
                  )}

                  {item.overview && (
                    <p className="text-white/90 text-base leading-relaxed">{item.overview}</p>
                  )}

                  {item.genres && item.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {item.genres.map((g) => (
                        <Badge key={g.id} variant="secondary" className="bg-white/10 text-white/80">
                          {g.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: cast, director */}
                <div className="space-y-3 text-sm">
                  {cast.length > 0 && (
                    <div>
                      <span className="text-white/50">Cast: </span>
                      <span className="text-white/90">
                        {cast.slice(0, 4).map((c) => c.name).join(", ")}
                        {cast.length > 4 && ", more"}
                      </span>
                    </div>
                  )}
                  {director && (
                    <div>
                      <span className="text-white/50">Director: </span>
                      <span className="text-white/90">{director.name}</span>
                    </div>
                  )}
                  {creators.length > 0 && (
                    <div>
                      <span className="text-white/50">Creator{creators.length > 1 ? "s" : ""}: </span>
                      <span className="text-white/90">{creators.map((c) => c.name).join(", ")}</span>
                    </div>
                  )}
                  {item.production_companies && item.production_companies.length > 0 && (
                    <div>
                      <span className="text-white/50">Studio: </span>
                      <span className="text-white/90">
                        {item.production_companies.slice(0, 2).map((c) => c.name).join(", ")}
                      </span>
                    </div>
                  )}
                  {item.spoken_languages && item.spoken_languages.length > 0 && (
                    <div>
                      <span className="text-white/50">Languages: </span>
                      <span className="text-white/90">
                        {item.spoken_languages.map((l) => l.english_name).join(", ")}
                      </span>
                    </div>
                  )}
                  {item.status && (
                    <div>
                      <span className="text-white/50">Status: </span>
                      <span className="text-white/90">{item.status}</span>
                    </div>
                  )}
                  {/* External links */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {item.imdb_id && (
                      <a
                        href={`https://www.imdb.com/title/${item.imdb_id}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold hover:bg-yellow-500/20 transition-colors"
                      >
                        IMDb
                      </a>
                    )}
                    {item.external_ids?.imdb_id && !item.imdb_id && (
                      <a
                        href={`https://www.imdb.com/title/${item.external_ids.imdb_id}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold hover:bg-yellow-500/20 transition-colors"
                      >
                        IMDb
                      </a>
                    )}
                    {item.homepage && (
                      <a
                        href={item.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/20 text-white/80 text-xs font-semibold hover:bg-white/10 transition-colors"
                      >
                        Official Site
                      </a>
                    )}
                    {item.external_ids?.facebook_id && (
                      <a
                        href={`https://facebook.com/${item.external_ids.facebook_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/20 text-white/80 text-xs font-semibold hover:bg-white/10 transition-colors"
                      >
                        Facebook
                      </a>
                    )}
                    {item.external_ids?.instagram_id && (
                      <a
                        href={`https://instagram.com/${item.external_ids.instagram_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/20 text-white/80 text-xs font-semibold hover:bg-white/10 transition-colors"
                      >
                        Instagram
                      </a>
                    )}
                    {item.external_ids?.twitter_id && (
                      <a
                        href={`https://twitter.com/${item.external_ids.twitter_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 border border-white/20 text-white/80 text-xs font-semibold hover:bg-white/10 transition-colors"
                      >
                        Twitter
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Episodes section (TV only) */}
              {target.mediaType === "tv" && item.seasons && item.seasons.length > 0 && (
                <>
                  <Separator className="bg-white/10" />
                  <EpisodesSection tvId={item.id} seasons={item.seasons} />
                </>
              )}

              {/* Cast row */}
              {cast.length > 0 && (
                <div className="px-4 md:px-8 pb-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Cast</h3>
                  <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
                    {cast.map((c) => (
                      <CastCard key={c.id} member={c} />
                    ))}
                  </div>
                </div>
              )}

              {/* Similar */}
              {similar.length > 0 && (
                <>
                  <Separator className="bg-white/10" />
                  <div className="px-4 md:px-8 py-4">
                    <h3 className="text-lg font-semibold text-white mb-3">More Like This</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {similar.map((s) => (
                        <SimilarCard
                          key={s.id}
                          item={s}
                          onClick={() => {
                            const mt = target.mediaType;
                            useAppStore.getState().openDetail(mt === "movie" ? (s.title ? "movie" : "tv") : (s.name ? "tv" : "movie"), s.id);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </ScrollArea>
      </DialogContent>

      {/* Share dialog */}
      {item && (
        <ShareDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          item={item}
          mediaType={target.mediaType}
        />
      )}
    </Dialog>
  );
}

function WatchlistButton({ profileId, item, mediaType }: { profileId: string; item: TMDBItem; mediaType: "movie" | "tv" }) {
  const [inList, setInList] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getWatchlist(profileId).then(({ items }) => {
      if (!cancelled) {
        setInList(items.some((i) => i.tmdbId === item.id && i.mediaType === mediaType));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [profileId, item.id, mediaType]);

  const toggle = async () => {
    setLoading(true);
    try {
      if (inList) {
        await removeFromWatchlist(profileId, item.id, mediaType);
        setInList(false);
        toast.success("Removed from My List");
      } else {
        await addToWatchlist({
          profileId,
          tmdbId: item.id,
          mediaType,
          title: titleOf(item),
          poster: item.poster_path,
          backdrop: item.backdrop_path,
        });
        setInList(true);
        toast.success("Added to My List");
      }
    } catch (e) {
      toast.error("Failed to update My List");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="w-10 h-10 rounded-full border-2 border-white/40 text-white flex items-center justify-center hover:border-white transition"
      aria-label={inList ? "Remove from My List" : "Add to My List"}
      title={inList ? "Remove from My List" : "Add to My List"}
    >
      {inList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
    </button>
  );
}

function RatingButton({ profileId, tmdbId, mediaType }: { profileId: string; tmdbId: number; mediaType: "movie" | "tv" }) {
  const [value, setValue] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRatings(profileId).then(({ items }) => {
      if (!cancelled) {
        const r = items.find((i) => i.tmdbId === tmdbId && i.mediaType === mediaType);
        setValue(r ? r.value : null);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [profileId, tmdbId, mediaType]);

  const handleRate = async (v: number) => {
    try {
      await setRatingApi(profileId, tmdbId, mediaType, v);
      setValue(v);
      toast.success(v === value ? "Rating updated" : `Rated ${v}/10`);
      setOpen(false);
    } catch {
      toast.error("Failed to rate");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-10 h-10 rounded-full border-2 flex items-center justify-center transition",
          value ? "border-bdnflix-red text-bdnflix-red" : "border-white/40 text-white hover:border-white",
        )}
        aria-label="Rate this"
        title={value ? `Your rating: ${value}/10` : "Rate this"}
      >
        <ThumbsUp className={cn("w-5 h-5", value && "fill-bdnflix-red")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-12 left-0 z-50 glass border border-white/10 rounded-lg p-3 w-64"
          >
            <p className="text-xs text-white/70 mb-2">Rate this {mediaType === "tv" ? "series" : "movie"}</p>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => handleRate(n)}
                  className={cn(
                    "aspect-square rounded text-xs font-bold transition",
                    (hover ?? value ?? 0) >= n
                      ? "bg-bdnflix-red text-white"
                      : "bg-white/10 text-white/60 hover:bg-white/20",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CastCard({ member }: { member: TMDBCastMember }) {
  const navigate = useAppStore((s) => s.navigate);
  const closeDetail = useAppStore((s) => s.closeDetail);
  const handleClick = () => {
    closeDetail();
    navigate({ name: "person", personId: member.id });
  };
  return (
    <button
      onClick={handleClick}
      className="shrink-0 w-24 md:w-28 text-center group/cast"
    >
      <div className="w-24 h-24 md:w-28 md:h-28 rounded-lg overflow-hidden bg-[#1a1a22] mb-2 ring-2 ring-transparent group-hover/cast:ring-bdnflix-red transition-all">
        {member.profile_path ? (
          <img
            src={profileUrl(member.profile_path, "w185")}
            alt={member.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-2xl">👤</div>
        )}
      </div>
      <p className="text-xs font-medium text-white truncate group-hover/cast:text-bdnflix-red transition-colors">{member.name}</p>
      <p className="text-xs text-white/50 truncate">{member.character}</p>
    </button>
  );
}

function SimilarCard({ item, onClick }: { item: TMDBItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg overflow-hidden bg-[#1a1a22] hover:scale-[1.03] transition-transform"
    >
      <div className="aspect-video bg-[#1a1a22]">
        {item.backdrop_path || item.poster_path ? (
          <img
            src={backdropUrl(item.backdrop_path, "w300") || posterUrl(item.poster_path, "w300")}
            alt={titleOf(item)}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>
      <div className="p-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-white truncate">{titleOf(item)}</span>
          {item.vote_average > 0 && (
            <span className="text-xs text-green-400 shrink-0">{Math.round(item.vote_average * 10)}%</span>
          )}
        </div>
        <p className="text-xs text-white/60 line-clamp-2 mt-1">{item.overview}</p>
      </div>
    </button>
  );
}

function getMaturityRating(item: TMDBItem | undefined): string | null {
  if (!item) return null;
  // TV content ratings
  const cr = item.content_ratings?.results?.find((r) => r.iso_3166_1 === "US");
  if (cr?.rating) return cr.rating;
  // Movie release dates
  const rd = item.release_dates?.results?.find((r) => r.iso_3166_1 === "US");
  if (rd?.release_dates?.[0]?.certification) return rd.release_dates[0].certification;
  return null;
}
