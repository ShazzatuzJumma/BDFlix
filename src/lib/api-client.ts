"use client";

import type { MediaType } from "@/lib/tmdb-types";
import {
  getOrCreateAccountId,
  getAllProfiles,
  createLocalProfile,
  updateLocalProfile,
  deleteLocalProfile,
  getWatchlistItems,
  addWatchlistItem,
  removeWatchlistItem,
  getProgressItems,
  saveProgressItem,
  removeProgressItem,
  getRatingItems,
  setRatingItem,
  removeRatingItem,
  getHistoryItems,
  clearHistoryItems,
  getProfileSettings,
  updateProfileSettings,
  computeStats,
  type StoredProfile,
  type StoredProfileSettings,
  type LocalWatchStats,
} from "@/lib/local-storage";

/**
 * Client-side data helpers for BDnFlix.
 * All user data is stored in localStorage (no server-side database needed).
 * TMDB calls still go through the /api/tmdb proxy so the token stays server-side.
 */

export async function tmdbGet<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
  const url = new URL(`/api/tmdb/${path.split("/").map(encodeURIComponent).join("/")}`, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json() as Promise<T>;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
  pin: string | null;
  settings?: ProfileSettings;
}

export interface ProfileSettings {
  autoplay: boolean;
  preferredSource: string;
  preferredSubtitle: string;
  volume: number;
  quality: string;
}

export interface WatchlistItem {
  id: string;
  tmdbId: number;
  mediaType: string;
  title: string;
  poster: string | null;
  backdrop: string | null;
  addedAt: string;
}

export interface WatchProgress {
  id: string;
  tmdbId: number;
  mediaType: string;
  season: number | null;
  episode: number | null;
  episodeName: string | null;
  progress: number;
  positionSec: number;
  durationSec: number;
  updatedAt: string;
}

export interface Rating {
  id: string;
  tmdbId: number;
  mediaType: string;
  value: number;
}

export interface HistoryItem {
  id: string;
  tmdbId: number;
  mediaType: string;
  title: string;
  poster: string | null;
  season: number | null;
  episode: number | null;
  watchedAt: string;
}

// ---- Helpers to map stored data to API interfaces ----

function profileToApi(p: StoredProfile): Profile {
  const settings = getProfileSettings(p.id);
  return {
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    isKids: p.isKids,
    pin: p.pin,
    settings: {
      autoplay: settings.autoplay,
      preferredSource: settings.preferredSource,
      preferredSubtitle: settings.preferredSubtitle,
      volume: settings.volume,
      quality: settings.quality,
    },
  };
}

// ---- Session / profiles ----
export async function getSession(): Promise<{ accountId: string; isNew: boolean; profiles: Profile[] }> {
  const accountId = getOrCreateAccountId();
  const stored = getAllProfiles();
  const profiles = stored.map(profileToApi);
  return { accountId, isNew: false, profiles };
}

export async function getProfiles(): Promise<{ profiles: Profile[] }> {
  const stored = getAllProfiles();
  return { profiles: stored.map(profileToApi) };
}

export async function createProfile(input: { name: string; avatar?: string; isKids?: boolean }): Promise<{ profile: Profile }> {
  const created = createLocalProfile(input);
  return { profile: profileToApi(created) };
}

export async function updateProfile(id: string, data: { name?: string; avatar?: string; isKids?: boolean; pin?: string | null }): Promise<{ profile: Profile }> {
  const updated = updateLocalProfile(id, data);
  return { profile: profileToApi(updated) };
}

export async function deleteProfile(id: string): Promise<void> {
  deleteLocalProfile(id);
}

// ---- Watchlist ----
export async function getWatchlist(profileId: string): Promise<{ items: WatchlistItem[] }> {
  const items = getWatchlistItems(profileId);
  return { items };
}

export async function addToWatchlist(item: { profileId: string; tmdbId: number; mediaType: MediaType; title: string; poster?: string; backdrop?: string }): Promise<void> {
  addWatchlistItem(item);
}

export async function removeFromWatchlist(profileId: string, tmdbId: number, mediaType: MediaType): Promise<void> {
  removeWatchlistItem(profileId, tmdbId, mediaType);
}

// ---- Progress ----
export async function getProgress(profileId: string, tmdbId?: number, mediaType?: MediaType): Promise<{ items: WatchProgress[]; continueWatching?: WatchProgress[] }> {
  return getProgressItems(profileId, tmdbId, mediaType);
}

export async function saveProgress(item: {
  profileId: string;
  tmdbId: number;
  mediaType: MediaType;
  season?: number;
  episode?: number;
  episodeName?: string;
  progress: number;
  positionSec: number;
  durationSec: number;
  title?: string;
  poster?: string;
}): Promise<void> {
  saveProgressItem(item);
}

export async function removeProgress(profileId: string, tmdbId: number, mediaType: MediaType, season?: number, episode?: number): Promise<void> {
  removeProgressItem(profileId, tmdbId, mediaType, season, episode);
}

// ---- Ratings ----
export async function getRatings(profileId: string): Promise<{ items: Rating[] }> {
  const items = getRatingItems(profileId);
  return { items };
}

export async function setRating(profileId: string, tmdbId: number, mediaType: MediaType, value: number): Promise<void> {
  setRatingItem(profileId, tmdbId, mediaType, value);
}

export async function removeRating(profileId: string, tmdbId: number, mediaType: MediaType): Promise<void> {
  removeRatingItem(profileId, tmdbId, mediaType);
}

// ---- History ----
export async function getHistory(profileId: string, limit = 100): Promise<{ items: HistoryItem[] }> {
  const items = getHistoryItems(profileId, limit);
  return { items };
}

export async function clearHistory(profileId: string, id?: string): Promise<void> {
  clearHistoryItems(profileId, id);
}

// ---- Settings ----
export async function getSettings(profileId: string): Promise<{ settings: ProfileSettings }> {
  const s = getProfileSettings(profileId);
  return {
    settings: {
      autoplay: s.autoplay,
      preferredSource: s.preferredSource,
      preferredSubtitle: s.preferredSubtitle,
      volume: s.volume,
      quality: s.quality,
    },
  };
}

export async function updateSettings(profileId: string, data: Partial<ProfileSettings>): Promise<{ settings: ProfileSettings }> {
  const s = updateProfileSettings(profileId, data);
  return {
    settings: {
      autoplay: s.autoplay,
      preferredSource: s.preferredSource,
      preferredSubtitle: s.preferredSubtitle,
      volume: s.volume,
      quality: s.quality,
    },
  };
}

// ---- Stats ----
export interface WatchStats {
  totalWatched: number;
  totalEpisodes: number;
  totalMovies: number;
  totalMinutes: number;
  watchlistCount: number;
  ratingsCount: number;
  ratingsAverage: number;
  streakDays: number;
  thisMonthCount: number;
  weeklyActivity: { date: string; count: number }[];
  recentItems: { tmdbId: number; mediaType: string; title: string; watchedAt: string }[];
}

export async function getStats(profileId: string): Promise<WatchStats> {
  return computeStats(profileId);
}
