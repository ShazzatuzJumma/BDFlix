"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import { ProfileGate } from "./ProfileGate";
import { Header } from "./Header";
import { HomeView } from "./HomeView";
import { DetailModal } from "./DetailModal";
import { PlayerView } from "./PlayerView";
import { SearchView } from "./SearchView";
import { MyListView } from "./MyListView";
import { HistoryView } from "./HistoryView";
import { SettingsView } from "./SettingsView";
import { CategoryView } from "./CategoryView";
import { PersonView } from "./PersonView";
import { RatingsView } from "./RatingsView";
import { NewPopularView } from "./NewPopularView";
import { StatsView } from "./StatsView";
import { YearInReview } from "./YearInReview";
import { Footer } from "./Footer";
import { ScrollToTop } from "./ScrollToTop";
import { KeyboardHelp, useKeyboardHelp } from "./KeyboardHelp";
import { TrailerModal } from "./TrailerModal";
import { useAppStore } from "@/store/useAppStore";
import { getSession, getProfiles, type Profile } from "@/lib/api-client";

export function BDnFlixApp() {
  const view = useAppStore((s) => s.view);
  const navigate = useAppStore((s) => s.navigate);
  const goBack = useAppStore((s) => s.goBack);
  const setSession = useAppStore((s) => s.setSession);
  const clearProfile = useAppStore((s) => s.clearProfile);
  const searchOpen = useAppStore((s) => s.searchOpen);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const setToast = useAppStore((s) => s.setToast);
  const trailerTarget = useAppStore((s) => s.trailerTarget);
  const closeTrailer = useAppStore((s) => s.closeTrailer);
  const kbHelp = useKeyboardHelp();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Wire toast helper into the store (so non-component code can toast)
  useEffect(() => {
    setToast((msg, type) => {
      if (type === "error") toast.error(msg);
      else if (type === "success") toast.success(msg);
      else toast.info(msg);
    });
  }, [setToast]);

  const loadSession = useCallback(async () => {
    try {
      const { accountId, profiles } = await getSession();
      setSession(accountId, "");
      setProfiles(profiles);
    } catch (e) {
      console.error("Session load failed", e);
    } finally {
      setLoading(false);
    }
  }, [setSession]);

  // Refresh profiles list (used after create/update/delete)
  const refreshProfiles = useCallback(async () => {
    try {
      const { profiles } = await getProfiles();
      setProfiles(profiles);
    } catch (e) {
      console.error("Profile refresh failed", e);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Global keyboard shortcuts (only when a profile is active and not typing)
  useEffect(() => {
    if (!activeProfile) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isTyping) return;

      if (e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "Escape") {
        if (searchOpen) {
          setSearchOpen(false);
        } else if (useAppStore.getState().detailTarget) {
          useAppStore.getState().closeDetail();
        } else if (useAppStore.getState().view.name !== "home") {
          navigate({ name: "home" });
        }
      } else if (e.key === "h" || e.key === "H") {
        navigate({ name: "home" });
      } else if (e.key === "m" || e.key === "M") {
        navigate({ name: "movies" });
      } else if (e.key === "t" || e.key === "T") {
        navigate({ name: "tv" });
      } else if (e.key === "n" || e.key === "N") {
        navigate({ name: "newpopular" });
      } else if (e.key === "l" || e.key === "L") {
        navigate({ name: "mylist" });
      } else if (e.key === "s" || e.key === "S") {
        navigate({ name: "stats" });
      } else if (e.key === "g" || e.key === "G") {
        navigate({ name: "settings" });
      } else if (e.key === "Backspace" && !e.metaKey && !e.ctrlKey) {
        if (!searchOpen && !useAppStore.getState().detailTarget) {
          goBack();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeProfile, navigate, goBack, searchOpen, setSearchOpen]);

  const handleSelectProfile = (profile: Profile) => {
    setActiveProfile(profile);
    setSession(profile.id, ""); // store account in store via accountId already set; profileId below
    useAppStore.setState({ profileId: profile.id, accountId: useAppStore.getState().accountId });
    navigate({ name: "home" });
  };

  const handleSwitchProfile = () => {
    setActiveProfile(null);
    clearProfile();
  };

  // Show loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0f]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-0 mb-4">
            <span className="text-5xl font-black tracking-tighter text-white">BD</span>
            <span className="text-5xl font-black tracking-tighter bdnflix-red">Nflix</span>
          </div>
          <div className="w-12 h-12 mx-auto border-4 border-white/10 border-t-bdnflix-red rounded-full animate-spin" />
        </motion.div>
      </div>
    );
  }

  // Profile gate
  if (!activeProfile) {
    return (
      <ProfileGate
        profiles={profiles}
        accountId={useAppStore.getState().accountId ?? ""}
        onSelect={handleSelectProfile}
        onChanged={refreshProfiles}
      />
    );
  }

  // Player view is full-screen overlay
  if (view.name === "player") {
    return (
      <>
        <PlayerView
          profileId={activeProfile.id}
          mediaType={view.mediaType}
          tmdbId={view.tmdbId}
          season={view.season}
          episode={view.episode}
        />
        <DetailModal profileId={activeProfile.id} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0b0f]">
      <Header profile={activeProfile} onSwitchProfile={handleSwitchProfile} />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view.name === "search" ? "search" : view.name === "genre" ? `genre-${view.genreId}` : view.name === "details" ? `details-${view.tmdbId}` : view.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderView(view, activeProfile)}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      {/* Overlays */}
      <DetailModal profileId={activeProfile.id} />
      <TrailerModal open={!!trailerTarget} onClose={closeTrailer} />
      <ScrollToTop />
      <KeyboardHelp open={kbHelp.open} onClose={() => kbHelp.setOpen(false)} />

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0b0b0f]"
          >
            <SearchOverlay onClose={() => setSearchOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster position="bottom-right" theme="dark" richColors />
    </div>
  );
}

function renderView(view: ReturnType<typeof useAppStore.getState>["view"], profile: Profile) {
  switch (view.name) {
    case "home":
      return <HomeView profileId={profile.id} isKids={profile.isKids} />;
    case "movies":
      return <CategoryView title="Movies" media="movie" endpoint="popular" isKids={profile.isKids} />;
    case "tv":
      return <CategoryView title="TV Shows" media="tv" endpoint="popular" isKids={profile.isKids} />;
    case "trending":
      return <CategoryView title="Trending Now" media="movie" endpoint="trending" isKids={profile.isKids} />;
    case "newpopular":
      return <NewPopularView isKids={profile.isKids} />;
    case "mylist":
      return <MyListView profileId={profile.id} />;
    case "history":
      return <HistoryView profileId={profile.id} />;
    case "ratings":
      return <RatingsView profileId={profile.id} />;
    case "stats":
      return <StatsView profileId={profile.id} />;
    case "yearinreview":
      return <YearInReview profileId={profile.id} />;
    case "settings":
      return <SettingsView profileId={profile.id} />;
    case "search":
      return <SearchView />;
    case "genre":
      return (
        <CategoryView
          title={view.genreName}
          media={view.media}
          endpoint="popular"
          isKids={profile.isKids}
          initialGenreId={view.genreId}
        />
      );
    case "person":
      return <PersonView personId={view.personId} />;
    default:
      return <HomeView profileId={profile.id} isKids={profile.isKids} />;
  }
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="relative h-full">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl"
        aria-label="Close search"
      >
        ✕
      </button>
      <SearchView />
    </div>
  );
}


