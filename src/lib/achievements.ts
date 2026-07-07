/**
 * BDnFlix Achievements System
 * Gamification badges that unlock based on watch activity.
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  unlocked: boolean;
  progress?: number; // 0..1 for partial progress
  progressText?: string; // e.g. "3/10"
}

interface StatsInput {
  totalWatched: number;
  totalEpisodes: number;
  totalMovies: number;
  totalMinutes: number;
  watchlistCount: number;
  ratingsCount: number;
  streakDays: number;
  thisMonthCount: number;
}

const TIERS = {
  bronze: { color: "#cd7f32", glow: "rgba(205, 127, 50, 0.4)" },
  silver: { color: "#c0c0c0", glow: "rgba(192, 192, 192, 0.4)" },
  gold: { color: "#ffd700", glow: "rgba(255, 215, 0, 0.4)" },
  platinum: { color: "#e5e4e2", glow: "rgba(229, 228, 226, 0.5)" },
};

export function getTierColor(tier: Achievement["tier"]) {
  return TIERS[tier];
}

export function computeAchievements(stats: StatsInput): Achievement[] {
  const achievements: Achievement[] = [
    // Watching milestones
    {
      id: "first-watch",
      name: "First Steps",
      description: "Watch your first title",
      icon: "🎬",
      tier: "bronze",
      unlocked: stats.totalWatched >= 1,
    },
    {
      id: "binge-starter",
      name: "Binge Starter",
      description: "Watch 5 titles",
      icon: "🍿",
      tier: "bronze",
      unlocked: stats.totalWatched >= 5,
      progress: Math.min(1, stats.totalWatched / 5),
      progressText: `${Math.min(stats.totalWatched, 5)}/5`,
    },
    {
      id: "binge-watcher",
      name: "Binge Watcher",
      description: "Watch 25 titles",
      icon: "🔥",
      tier: "silver",
      unlocked: stats.totalWatched >= 25,
      progress: Math.min(1, stats.totalWatched / 25),
      progressText: `${Math.min(stats.totalWatched, 25)}/25`,
    },
    {
      id: "marathon-master",
      name: "Marathon Master",
      description: "Watch 100 titles",
      icon: "🏆",
      tier: "gold",
      unlocked: stats.totalWatched >= 100,
      progress: Math.min(1, stats.totalWatched / 100),
      progressText: `${Math.min(stats.totalWatched, 100)}/100`,
    },
    // Time-based
    {
      id: "movie-buff",
      name: "Movie Buff",
      description: "Watch 10 movies",
      icon: "🎞️",
      tier: "bronze",
      unlocked: stats.totalMovies >= 10,
      progress: Math.min(1, stats.totalMovies / 10),
      progressText: `${Math.min(stats.totalMovies, 10)}/10`,
    },
    {
      id: "tv-enthusiast",
      name: "TV Enthusiast",
      description: "Watch 20 episodes",
      icon: "📺",
      tier: "silver",
      unlocked: stats.totalEpisodes >= 20,
      progress: Math.min(1, stats.totalEpisodes / 20),
      progressText: `${Math.min(stats.totalEpisodes, 20)}/20`,
    },
    {
      id: "time-invested",
      name: "Time Invested",
      description: "Watch for 10 hours total",
      icon: "⏰",
      tier: "silver",
      unlocked: stats.totalMinutes >= 600,
      progress: Math.min(1, stats.totalMinutes / 600),
      progressText: `${Math.floor(Math.min(stats.totalMinutes, 600) / 60)}h/10h`,
    },
    {
      id: "screen-legend",
      name: "Screen Legend",
      description: "Watch for 50 hours total",
      icon: "👑",
      tier: "platinum",
      unlocked: stats.totalMinutes >= 3000,
      progress: Math.min(1, stats.totalMinutes / 3000),
      progressText: `${Math.floor(Math.min(stats.totalMinutes, 3000) / 60)}h/50h`,
    },
    // Streaks
    {
      id: "daily-habit",
      name: "Daily Habit",
      description: "Watch 3 days in a row",
      icon: "📅",
      tier: "bronze",
      unlocked: stats.streakDays >= 3,
      progress: Math.min(1, stats.streakDays / 3),
      progressText: `${Math.min(stats.streakDays, 3)}/3`,
    },
    {
      id: "on-fire",
      name: "On Fire",
      description: "Watch 7 days in a row",
      icon: "🔥",
      tier: "gold",
      unlocked: stats.streakDays >= 7,
      progress: Math.min(1, stats.streakDays / 7),
      progressText: `${Math.min(stats.streakDays, 7)}/7`,
    },
    // Engagement
    {
      id: "curator",
      name: "Curator",
      description: "Add 10 titles to My List",
      icon: "📌",
      tier: "bronze",
      unlocked: stats.watchlistCount >= 10,
      progress: Math.min(1, stats.watchlistCount / 10),
      progressText: `${Math.min(stats.watchlistCount, 10)}/10`,
    },
    {
      id: "critic",
      name: "Critic",
      description: "Rate 10 titles",
      icon: "⭐",
      tier: "silver",
      unlocked: stats.ratingsCount >= 10,
      progress: Math.min(1, stats.ratingsCount / 10),
      progressText: `${Math.min(stats.ratingsCount, 10)}/10`,
    },
    // Monthly
    {
      id: "monthly-grind",
      name: "Monthly Grind",
      description: "Watch 20 titles this month",
      icon: "💪",
      tier: "gold",
      unlocked: stats.thisMonthCount >= 20,
      progress: Math.min(1, stats.thisMonthCount / 20),
      progressText: `${Math.min(stats.thisMonthCount, 20)}/20`,
    },
  ];

  return achievements;
}

export function getUnlockedCount(achievements: Achievement[]): number {
  return achievements.filter((a) => a.unlocked).length;
}
