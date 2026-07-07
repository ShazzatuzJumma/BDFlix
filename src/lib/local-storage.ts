"use client";

/**
 * localStorage-based data layer for BDnFlix.
 * Replaces Prisma/SQLite so the app works on Netlify (read-only serverless filesystem).
 * All data is per-browser, persisted in localStorage.
 */

// ---- Helpers ----

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function getStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setStore<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

// ---- Storage Keys ----
const KEYS = {
  ACCOUNT_ID: "bdnflix_account_id",
  PROFILES: "bdnflix_profiles",
  WATCHLIST: "bdnflix_watchlist",
  PROGRESS: "bdnflix_progress",
  RATINGS: "bdnflix_ratings",
  HISTORY: "bdnflix_history",
  SETTINGS: "bdnflix_settings",
};

// ---- Types (matching existing api-client types) ----

export interface StoredProfile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
  pin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoredProfileSettings {
  profileId: string;
  autoplay: boolean;
  preferredSource: string;
  preferredSubtitle: string;
  volume: number;
  quality: string;
}

export interface StoredWatchlistItem {
  id: string;
  profileId: string;
  tmdbId: number;
  mediaType: string;
  title: string;
  poster: string | null;
  backdrop: string | null;
  addedAt: string;
}

export interface StoredWatchProgress {
  id: string;
  profileId: string;
  tmdbId: number;
  mediaType: string;
  season: number;
  episode: number;
  episodeName: string | null;
  progress: number;
  positionSec: number;
  durationSec: number;
  updatedAt: string;
  createdAt: string;
}

export interface StoredRating {
  id: string;
  profileId: string;
  tmdbId: number;
  mediaType: string;
  value: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredHistoryItem {
  id: string;
  profileId: string;
  tmdbId: number;
  mediaType: string;
  title: string;
  poster: string | null;
  season: number | null;
  episode: number | null;
  watchedAt: string;
}

// ---- Account ----

export function getOrCreateAccountId(): string {
  let id = getStore<string | null>(KEYS.ACCOUNT_ID, null);
  if (!id) {
    id = generateId();
    setStore(KEYS.ACCOUNT_ID, id);
  }
  return id;
}

// ---- Profiles ----

const DEFAULT_SETTINGS: Omit<StoredProfileSettings, "profileId"> = {
  autoplay: true,
  preferredSource: "videasy",
  preferredSubtitle: "en",
  volume: 80,
  quality: "auto",
};

function ensureDefaultProfile(): StoredProfile[] {
  let profiles = getStore<StoredProfile[]>(KEYS.PROFILES, []);
  if (profiles.length === 0) {
    const now = new Date().toISOString();
    const defaultProfile: StoredProfile = {
      id: generateId(),
      name: "BDnFlix",
      avatar: "default",
      isKids: false,
      pin: null,
      createdAt: now,
      updatedAt: now,
    };
    profiles = [defaultProfile];
    setStore(KEYS.PROFILES, profiles);
    // Also create default settings
    const settings = getStore<StoredProfileSettings[]>(KEYS.SETTINGS, []);
    settings.push({ profileId: defaultProfile.id, ...DEFAULT_SETTINGS });
    setStore(KEYS.SETTINGS, settings);
  }
  return profiles;
}

export function getAllProfiles(): StoredProfile[] {
  return ensureDefaultProfile();
}

export function getProfileById(id: string): StoredProfile | null {
  const profiles = ensureDefaultProfile();
  return profiles.find((p) => p.id === id) ?? null;
}

export function createLocalProfile(input: { name: string; avatar?: string; isKids?: boolean }): StoredProfile {
  const profiles = ensureDefaultProfile();
  if (profiles.length >= 5) {
    throw new Error("You can have up to 5 profiles");
  }

  const AVATARS = ["default", "red", "blue", "green", "purple", "orange", "pink", "cyan", "yellow"];
  const now = new Date().toISOString();
  const profile: StoredProfile = {
    id: generateId(),
    name: input.name.trim().slice(0, 24),
    avatar: input.avatar && AVATARS.includes(input.avatar) ? input.avatar : AVATARS[profiles.length % AVATARS.length],
    isKids: input.isKids ?? false,
    pin: null,
    createdAt: now,
    updatedAt: now,
  };
  profiles.push(profile);
  setStore(KEYS.PROFILES, profiles);

  // Create default settings for new profile
  const settings = getStore<StoredProfileSettings[]>(KEYS.SETTINGS, []);
  settings.push({ profileId: profile.id, ...DEFAULT_SETTINGS });
  setStore(KEYS.SETTINGS, settings);

  return profile;
}

export function updateLocalProfile(
  id: string,
  data: { name?: string; avatar?: string; isKids?: boolean; pin?: string | null },
): StoredProfile {
  const profiles = ensureDefaultProfile();
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Profile not found");

  const profile = profiles[idx];
  if (data.name !== undefined) profile.name = data.name.trim().slice(0, 24);
  if (data.avatar !== undefined) profile.avatar = data.avatar;
  if (data.isKids !== undefined) profile.isKids = data.isKids;
  if (data.pin !== undefined) profile.pin = data.pin ?? null;
  profile.updatedAt = new Date().toISOString();

  profiles[idx] = profile;
  setStore(KEYS.PROFILES, profiles);
  return profile;
}

export function deleteLocalProfile(id: string): void {
  const profiles = ensureDefaultProfile();
  if (profiles.length <= 1) throw new Error("You must keep at least one profile");
  const filtered = profiles.filter((p) => p.id !== id);
  setStore(KEYS.PROFILES, filtered);

  // Clean up related data
  const watchlist = getStore<StoredWatchlistItem[]>(KEYS.WATCHLIST, []).filter((w) => w.profileId !== id);
  setStore(KEYS.WATCHLIST, watchlist);
  const progress = getStore<StoredWatchProgress[]>(KEYS.PROGRESS, []).filter((p) => p.profileId !== id);
  setStore(KEYS.PROGRESS, progress);
  const ratings = getStore<StoredRating[]>(KEYS.RATINGS, []).filter((r) => r.profileId !== id);
  setStore(KEYS.RATINGS, ratings);
  const history = getStore<StoredHistoryItem[]>(KEYS.HISTORY, []).filter((h) => h.profileId !== id);
  setStore(KEYS.HISTORY, history);
  const settings = getStore<StoredProfileSettings[]>(KEYS.SETTINGS, []).filter((s) => s.profileId !== id);
  setStore(KEYS.SETTINGS, settings);
}

// ---- Watchlist ----

export function getWatchlistItems(profileId: string): StoredWatchlistItem[] {
  const all = getStore<StoredWatchlistItem[]>(KEYS.WATCHLIST, []);
  return all
    .filter((w) => w.profileId === profileId)
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
}

export function addWatchlistItem(item: {
  profileId: string;
  tmdbId: number;
  mediaType: string;
  title: string;
  poster?: string;
  backdrop?: string;
}): StoredWatchlistItem {
  const all = getStore<StoredWatchlistItem[]>(KEYS.WATCHLIST, []);
  // Remove existing if any (upsert)
  const filtered = all.filter(
    (w) => !(w.profileId === item.profileId && w.tmdbId === item.tmdbId && w.mediaType === item.mediaType),
  );
  const newItem: StoredWatchlistItem = {
    id: generateId(),
    profileId: item.profileId,
    tmdbId: item.tmdbId,
    mediaType: item.mediaType,
    title: item.title.slice(0, 300),
    poster: item.poster ?? null,
    backdrop: item.backdrop ?? null,
    addedAt: new Date().toISOString(),
  };
  filtered.push(newItem);
  setStore(KEYS.WATCHLIST, filtered);
  return newItem;
}

export function removeWatchlistItem(profileId: string, tmdbId: number, mediaType: string): void {
  const all = getStore<StoredWatchlistItem[]>(KEYS.WATCHLIST, []);
  const filtered = all.filter(
    (w) => !(w.profileId === profileId && w.tmdbId === tmdbId && w.mediaType === mediaType),
  );
  setStore(KEYS.WATCHLIST, filtered);
}

// ---- Watch Progress ----

export function getProgressItems(
  profileId: string,
  tmdbId?: number,
  mediaType?: string,
): { items: StoredWatchProgress[]; continueWatching: StoredWatchProgress[] } {
  const all = getStore<StoredWatchProgress[]>(KEYS.PROGRESS, []);
  let items = all.filter((p) => p.profileId === profileId);

  if (tmdbId) {
    items = items.filter((p) => p.tmdbId === tmdbId && (mediaType ? p.mediaType === mediaType : true));
    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return { items, continueWatching: [] };
  }

  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Continue watching: dedupe by tmdbId+mediaType, exclude near-zero or near-complete
  const seen = new Set<string>();
  const continueWatching = items
    .filter((p) => {
      const key = `${p.mediaType}-${p.tmdbId}`;
      if (seen.has(key)) return false;
      if (p.progress < 0.03 || p.progress > 0.95) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 20);

  return { items, continueWatching };
}

export function saveProgressItem(item: {
  profileId: string;
  tmdbId: number;
  mediaType: string;
  season?: number;
  episode?: number;
  episodeName?: string;
  progress: number;
  positionSec: number;
  durationSec: number;
  title?: string;
  poster?: string;
}): StoredWatchProgress {
  const all = getStore<StoredWatchProgress[]>(KEYS.PROGRESS, []);
  const season = item.season ?? 0;
  const episode = item.episode ?? 0;
  const progress = Math.min(1, Math.max(0, item.progress));
  const positionSec = Math.max(0, Math.round(item.positionSec));
  const durationSec = Math.max(0, Math.round(item.durationSec));
  const now = new Date().toISOString();

  // Find existing
  const existingIdx = all.findIndex(
    (p) =>
      p.profileId === item.profileId &&
      p.tmdbId === item.tmdbId &&
      p.mediaType === item.mediaType &&
      p.season === season &&
      p.episode === episode,
  );

  let result: StoredWatchProgress;
  if (existingIdx >= 0) {
    all[existingIdx].progress = progress;
    all[existingIdx].positionSec = positionSec;
    all[existingIdx].durationSec = durationSec;
    all[existingIdx].updatedAt = now;
    if (item.episodeName) all[existingIdx].episodeName = item.episodeName.slice(0, 300);
    result = all[existingIdx];
  } else {
    result = {
      id: generateId(),
      profileId: item.profileId,
      tmdbId: item.tmdbId,
      mediaType: item.mediaType,
      season,
      episode,
      episodeName: item.episodeName?.slice(0, 300) ?? null,
      progress,
      positionSec,
      durationSec,
      updatedAt: now,
      createdAt: now,
    };
    all.push(result);
  }
  setStore(KEYS.PROGRESS, all);

  // Also append to history
  addHistoryItem({
    profileId: item.profileId,
    tmdbId: item.tmdbId,
    mediaType: item.mediaType,
    title: item.title ?? "",
    poster: item.poster,
    season,
    episode,
  });

  return result;
}

export function removeProgressItem(
  profileId: string,
  tmdbId: number,
  mediaType: string,
  season?: number,
  episode?: number,
): void {
  const all = getStore<StoredWatchProgress[]>(KEYS.PROGRESS, []);
  const s = season ?? 0;
  const e = episode ?? 0;
  const filtered = all.filter(
    (p) =>
      !(
        p.profileId === profileId &&
        p.tmdbId === tmdbId &&
        p.mediaType === mediaType &&
        p.season === s &&
        p.episode === e
      ),
  );
  setStore(KEYS.PROGRESS, filtered);
}

// ---- Ratings ----

export function getRatingItems(profileId: string): StoredRating[] {
  const all = getStore<StoredRating[]>(KEYS.RATINGS, []);
  return all.filter((r) => r.profileId === profileId);
}

export function setRatingItem(profileId: string, tmdbId: number, mediaType: string, value: number): StoredRating {
  const all = getStore<StoredRating[]>(KEYS.RATINGS, []);
  const clampedValue = Math.min(10, Math.max(1, Math.round(value)));
  const now = new Date().toISOString();

  const existingIdx = all.findIndex(
    (r) => r.profileId === profileId && r.tmdbId === tmdbId && r.mediaType === mediaType,
  );

  let result: StoredRating;
  if (existingIdx >= 0) {
    all[existingIdx].value = clampedValue;
    all[existingIdx].updatedAt = now;
    result = all[existingIdx];
  } else {
    result = {
      id: generateId(),
      profileId,
      tmdbId,
      mediaType,
      value: clampedValue,
      createdAt: now,
      updatedAt: now,
    };
    all.push(result);
  }
  setStore(KEYS.RATINGS, all);
  return result;
}

export function removeRatingItem(profileId: string, tmdbId: number, mediaType: string): void {
  const all = getStore<StoredRating[]>(KEYS.RATINGS, []);
  const filtered = all.filter(
    (r) => !(r.profileId === profileId && r.tmdbId === tmdbId && r.mediaType === mediaType),
  );
  setStore(KEYS.RATINGS, filtered);
}

// ---- History ----

function addHistoryItem(item: {
  profileId: string;
  tmdbId: number;
  mediaType: string;
  title: string;
  poster?: string;
  season?: number;
  episode?: number;
}): void {
  const all = getStore<StoredHistoryItem[]>(KEYS.HISTORY, []);
  const newItem: StoredHistoryItem = {
    id: generateId(),
    profileId: item.profileId,
    tmdbId: item.tmdbId,
    mediaType: item.mediaType,
    title: item.title.slice(0, 300),
    poster: item.poster ?? null,
    season: item.season ?? null,
    episode: item.episode ?? null,
    watchedAt: new Date().toISOString(),
  };
  all.push(newItem);
  // Cap at 2000 entries to avoid localStorage bloat
  if (all.length > 2000) {
    all.splice(0, all.length - 2000);
  }
  setStore(KEYS.HISTORY, all);
}

export function getHistoryItems(profileId: string, limit = 100): StoredHistoryItem[] {
  const all = getStore<StoredHistoryItem[]>(KEYS.HISTORY, []);
  const profileItems = all
    .filter((h) => h.profileId === profileId)
    .sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime());

  // Deduplicate by (tmdbId, mediaType, season, episode) keeping most recent
  const seen = new Set<string>();
  return profileItems
    .filter((r) => {
      const key = `${r.mediaType}-${r.tmdbId}-${r.season ?? 0}-${r.episode ?? 0}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

export function clearHistoryItems(profileId: string, id?: string): void {
  const all = getStore<StoredHistoryItem[]>(KEYS.HISTORY, []);
  if (id) {
    const filtered = all.filter((h) => !(h.id === id && h.profileId === profileId));
    setStore(KEYS.HISTORY, filtered);
  } else {
    const filtered = all.filter((h) => h.profileId !== profileId);
    setStore(KEYS.HISTORY, filtered);
  }
}

// ---- Settings ----

export function getProfileSettings(profileId: string): StoredProfileSettings {
  const all = getStore<StoredProfileSettings[]>(KEYS.SETTINGS, []);
  const found = all.find((s) => s.profileId === profileId);
  if (found) return found;
  // Create default settings
  const newSettings: StoredProfileSettings = { profileId, ...DEFAULT_SETTINGS };
  all.push(newSettings);
  setStore(KEYS.SETTINGS, all);
  return newSettings;
}

export function updateProfileSettings(
  profileId: string,
  data: Partial<Omit<StoredProfileSettings, "profileId">>,
): StoredProfileSettings {
  const all = getStore<StoredProfileSettings[]>(KEYS.SETTINGS, []);
  let idx = all.findIndex((s) => s.profileId === profileId);
  if (idx === -1) {
    all.push({ profileId, ...DEFAULT_SETTINGS });
    idx = all.length - 1;
  }
  const settings = all[idx];
  if (typeof data.autoplay === "boolean") settings.autoplay = data.autoplay;
  if (typeof data.preferredSource === "string") settings.preferredSource = data.preferredSource;
  if (typeof data.preferredSubtitle === "string") settings.preferredSubtitle = data.preferredSubtitle;
  if (typeof data.volume === "number") settings.volume = Math.min(100, Math.max(0, data.volume));
  if (typeof data.quality === "string") settings.quality = data.quality;
  all[idx] = settings;
  setStore(KEYS.SETTINGS, all);
  return settings;
}

// ---- Stats ----

export interface LocalWatchStats {
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

export function computeStats(profileId: string): LocalWatchStats {
  const history = getStore<StoredHistoryItem[]>(KEYS.HISTORY, [])
    .filter((h) => h.profileId === profileId)
    .sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime());

  const progress = getStore<StoredWatchProgress[]>(KEYS.PROGRESS, []).filter((p) => p.profileId === profileId);
  const watchlistCount = getStore<StoredWatchlistItem[]>(KEYS.WATCHLIST, []).filter(
    (w) => w.profileId === profileId,
  ).length;
  const ratings = getStore<StoredRating[]>(KEYS.RATINGS, []).filter((r) => r.profileId === profileId);

  // Unique titles
  const uniqueTitles = new Set(history.map((h) => `${h.mediaType}-${h.tmdbId}`));
  const totalWatched = uniqueTitles.size;

  const totalMovies = history.filter((h) => h.mediaType === "movie").length;
  const totalEpisodes = history.filter((h) => h.mediaType === "tv").length;

  // Estimated watch minutes
  const totalMinutes = Math.round(progress.reduce((sum, p) => sum + (p.progress * p.durationSec) / 60, 0));

  // Ratings average
  const ratingsAverage =
    ratings.length > 0
      ? Math.round((ratings.reduce((s, r) => s + r.value, 0) / ratings.length) * 10) / 10
      : 0;

  // Weekly activity (last 7 days)
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const count = history.filter((h) => {
      const d = new Date(h.watchedAt);
      return d >= dayStart && d < dayEnd;
    }).length;
    return { date: dayStart.toISOString().slice(0, 10), count };
  });

  // This month count
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthCount = history.filter((h) => new Date(h.watchedAt) >= monthStart).length;

  // Streak
  const watchDays = new Set(history.map((h) => new Date(h.watchedAt).toISOString().slice(0, 10)));
  let streakDays = 0;
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = checkDate.toISOString().slice(0, 10);
    if (watchDays.has(dateStr)) {
      streakDays++;
    } else if (i > 0) {
      break;
    }
  }

  const recentItems = history.slice(0, 20).map((h) => ({
    tmdbId: h.tmdbId,
    mediaType: h.mediaType,
    title: h.title,
    watchedAt: h.watchedAt,
  }));

  return {
    totalWatched,
    totalEpisodes,
    totalMovies,
    totalMinutes,
    watchlistCount,
    ratingsCount: ratings.length,
    ratingsAverage,
    streakDays,
    thisMonthCount,
    weeklyActivity,
    recentItems,
  };
}
