"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Cake, MapPin, Film, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentCard } from "./ContentCard";
import { tmdbGet } from "@/lib/api-client";
import { profileUrl, titleOf, type TMDBItem } from "@/lib/tmdb-types";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

interface PersonViewProps {
  personId: number;
}

interface PersonData {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  profile_path: string | null;
  place_of_birth: string | null;
  known_for_department: string;
  movie_credits?: { cast: (TMDBItem & { character?: string })[] };
  tv_credits?: { cast: (TMDBItem & { character?: string })[] };
}

export function PersonView({ personId }: PersonViewProps) {
  const goBack = useAppStore((s) => s.goBack);
  const openDetail = useAppStore((s) => s.openDetail);
  const [data, setData] = useState<PersonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"movie" | "tv">("movie");

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    tmdbGet<PersonData>(`/person/${personId}`, { append_to_response: "movie_credits,tv_credits" })
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [personId]);

  if (loading || !data) {
    return (
      <div className="min-h-screen pt-20 px-4 md:px-8 lg:px-12">
        <div className="max-w-5xl mx-auto flex gap-6">
          <div className="w-48 h-72 rounded-lg skeleton-shimmer shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-64 rounded skeleton-shimmer" />
            <div className="h-4 w-48 rounded skeleton-shimmer" />
            <div className="h-24 w-full rounded skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  const movieCast = (data.movie_credits?.cast ?? []).filter((c) => c.poster_path || c.backdrop_path);
  const tvCast = (data.tv_credits?.cast ?? []).filter((c) => c.poster_path || c.backdrop_path);
  const currentCast = tab === "movie" ? movieCast : tvCast;

  const age = data.birthday
    ? calcAge(data.birthday, data.deathday)
    : null;

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 md:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={goBack}
          className="text-white/70 hover:text-white mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row gap-6 md:gap-8 mb-10"
        >
          <div className="w-40 h-60 md:w-48 md:h-72 rounded-xl overflow-hidden bg-[#1a1a22] shrink-0 card-shadow">
            {data.profile_path ? (
              <img
                src={profileUrl(data.profile_path, "w300")}
                alt={data.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 text-5xl">👤</div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3">{data.name}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/70 mb-4">
              {data.known_for_department && (
                <span className="bg-bdnflix-red/20 text-bdnflix-red px-2 py-0.5 rounded text-xs font-semibold uppercase">
                  {data.known_for_department}
                </span>
              )}
              {data.birthday && (
                <span className="flex items-center gap-1">
                  <Cake className="w-4 h-4" />
                  {formatDate(data.birthday)}
                  {age != null && ` (${age} yrs)`}
                  {data.deathday && ` – ${formatDate(data.deathday)}`}
                </span>
              )}
              {data.place_of_birth && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {data.place_of_birth}
                </span>
              )}
            </div>

            {data.biography ? (
              <p className="text-white/80 text-sm md:text-base leading-relaxed line-clamp-6 md:line-clamp-none max-w-3xl">
                {data.biography}
              </p>
            ) : (
              <p className="text-white/40 text-sm italic">No biography available.</p>
            )}
          </div>
        </motion.div>

        {/* Filmography tabs */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Filmography</h2>
          <div className="flex bg-white/5 rounded-lg p-0.5 w-fit mb-5">
            <button
              onClick={() => setTab("movie")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition",
                tab === "movie" ? "bg-white text-black" : "text-white/60 hover:text-white",
              )}
            >
              <Film className="w-4 h-4" /> Movies ({movieCast.length})
            </button>
            <button
              onClick={() => setTab("tv")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition",
                tab === "tv" ? "bg-white text-black" : "text-white/60 hover:text-white",
              )}
            >
              <Tv className="w-4 h-4" /> TV Shows ({tvCast.length})
            </button>
          </div>

          {currentCast.length === 0 ? (
            <p className="text-white/40 text-sm">No {tab === "movie" ? "movie" : "TV"} credits found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {currentCast.slice(0, 60).map((item) => (
                <div key={`${tab}-${item.id}`} className="relative group">
                  <ContentCard
                    item={{ ...item, media_type: tab }}
                    className="w-full"
                  />
                  {item.character && (
                    <p className="text-xs text-white/60 truncate mt-1 px-1">as {item.character}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function calcAge(birthday: string, deathday: string | null): number | null {
  const birth = new Date(birthday);
  const end = deathday ? new Date(deathday) : new Date();
  if (isNaN(birth.getTime())) return null;
  let age = end.getFullYear() - birth.getFullYear();
  const m = end.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
