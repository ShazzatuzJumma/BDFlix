/**
 * Netflix-style profile avatar presets.
 * Each is a gradient + emoji combo rendered as an SVG-like CSS avatar.
 */
export interface ProfileAvatar {
  id: string;
  name: string;
  gradient: string;
  emoji: string;
}

export const PROFILE_AVATARS: ProfileAvatar[] = [
  { id: "red", name: "Scarlet", gradient: "linear-gradient(135deg, #e50914 0%, #8b0000 100%)", emoji: "🎬" },
  { id: "blue", name: "Ocean", gradient: "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)", emoji: "🌊" },
  { id: "green", name: "Forest", gradient: "linear-gradient(135deg, #16a34a 0%, #14532d 100%)", emoji: "🌿" },
  { id: "purple", name: "Royal", gradient: "linear-gradient(135deg, #9333ea 0%, #581c87 100%)", emoji: "👑" },
  { id: "orange", name: "Sunset", gradient: "linear-gradient(135deg, #f97316 0%, #9a3412 100%)", emoji: "🔥" },
  { id: "pink", name: "Bloom", gradient: "linear-gradient(135deg, #ec4899 0%, #831843 100%)", emoji: "🌸" },
  { id: "cyan", name: "Glacier", gradient: "linear-gradient(135deg, #06b6d4 0%, #155e75 100%)", emoji: "❄️" },
  { id: "yellow", name: "Gold", gradient: "linear-gradient(135deg, #eab308 0%, #713f12 100%)", emoji: "⭐" },
  { id: "default", name: "BDnFlix", gradient: "linear-gradient(135deg, #e50914 0%, #1a1a1a 100%)", emoji: "🍿" },
];

export function getAvatar(id: string): ProfileAvatar {
  return PROFILE_AVATARS.find((a) => a.id === id) ?? PROFILE_AVATARS[PROFILE_AVATARS.length - 1];
}
