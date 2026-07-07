"use client";

import { create } from "zustand";

export type View =
  | { name: "home" }
  | { name: "movies" }
  | { name: "tv" }
  | { name: "trending" }
  | { name: "newpopular" }
  | { name: "mylist" }
  | { name: "history" }
  | { name: "ratings" }
  | { name: "stats" }
  | { name: "yearinreview" }
  | { name: "search"; query: string }
  | { name: "genre"; media: "movie" | "tv"; genreId: number; genreName: string }
  | { name: "details"; mediaType: "movie" | "tv"; tmdbId: number }
  | { name: "player"; mediaType: "movie" | "tv"; tmdbId: number; season?: number; episode?: number }
  | { name: "settings" }
  | { name: "person"; personId: number };

interface AppState {
  // session / profile
  accountId: string | null;
  profileId: string | null;
  setSession: (accountId: string, profileId: string) => void;
  clearProfile: () => void;

  // navigation
  view: View;
  history: View[];
  navigate: (view: View) => void;
  goBack: () => void;
  canGoBack: () => boolean;

  // detail modal overlay (separate from full navigation so it can stack)
  detailTarget: { mediaType: "movie" | "tv"; tmdbId: number } | null;
  openDetail: (mediaType: "movie" | "tv", tmdbId: number) => void;
  closeDetail: () => void;

  // trailer modal overlay
  trailerTarget: { mediaType: "movie" | "tv"; tmdbId: number } | null;
  openTrailer: (mediaType: "movie" | "tv", tmdbId: number) => void;
  closeTrailer: () => void;

  // search
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  // mobile nav
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;

  // toast helper passthrough
  toast: ((msg: string, type?: "success" | "error" | "info") => void) | null;
  setToast: (fn: (msg: string, type?: "success" | "error" | "info") => void) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  accountId: null,
  profileId: null,
  setSession: (accountId, profileId) => set({ accountId, profileId }),
  clearProfile: () => set({ profileId: null, view: { name: "home" }, history: [] }),

  view: { name: "home" },
  history: [],
  navigate: (view) => {
    const { view: current, history } = get();
    set({ view, history: [...history, current].slice(-30) });
  },
  goBack: () => {
    const { history } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    set({ view: prev, history: history.slice(0, -1) });
  },
  canGoBack: () => get().history.length > 0,

  detailTarget: null,
  openDetail: (mediaType, tmdbId) => set({ detailTarget: { mediaType, tmdbId } }),
  closeDetail: () => set({ detailTarget: null }),

  trailerTarget: null,
  openTrailer: (mediaType, tmdbId) => set({ trailerTarget: { mediaType, tmdbId } }),
  closeTrailer: () => set({ trailerTarget: null }),

  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),

  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

  toast: null,
  setToast: (fn) => set({ toast: fn }),
}));

// Convenience selectors
export const useCurrentView = () => useAppStore((s) => s.view);
export const useProfile = () => useAppStore((s) => s.profileId);
