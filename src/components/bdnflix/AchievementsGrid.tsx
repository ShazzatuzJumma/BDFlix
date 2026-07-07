"use client";

import { motion } from "framer-motion";
import { Lock, Check } from "lucide-react";
import { type Achievement, getTierColor } from "@/lib/achievements";
import { cn } from "@/lib/utils";

interface AchievementsGridProps {
  achievements: Achievement[];
}

export function AchievementsGrid({ achievements }: AchievementsGridProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass rounded-xl p-5 border border-white/10"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          🏅 Achievements
        </h2>
        <span className="text-sm text-white/50">
          {unlockedCount}/{achievements.length} unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {achievements.map((ach, i) => {
          const tier = getTierColor(ach.tier);
          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
              whileHover={{ scale: ach.unlocked ? 1.05 : 1.02 }}
              className={cn(
                "relative rounded-xl p-3 border text-center overflow-hidden transition-all",
                ach.unlocked
                  ? "border-white/20 bg-white/5"
                  : "border-white/5 bg-white/2 opacity-60",
              )}
              style={ach.unlocked ? { boxShadow: `0 0 20px ${tier.glow}` } : undefined}
            >
              {/* Tier glow background */}
              {ach.unlocked && (
                <div
                  className="absolute inset-0 opacity-10"
                  style={{ background: `radial-gradient(circle at center, ${tier.color}, transparent 70%)` }}
                />
              )}

              {/* Icon */}
              <div className="relative mb-2">
                <div
                  className={cn(
                    "w-12 h-12 mx-auto rounded-full flex items-center justify-center text-2xl",
                    ach.unlocked ? "bg-white/10" : "bg-white/5 grayscale",
                  )}
                  style={ach.unlocked ? { border: `2px solid ${tier.color}` } : { border: "2px solid rgba(255,255,255,0.1)" }}
                >
                  {ach.unlocked ? ach.icon : <Lock className="w-5 h-5 text-white/40" />}
                </div>
                {ach.unlocked && (
                  <div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: tier.color }}
                  >
                    <Check className="w-3 h-3 text-black" />
                  </div>
                )}
              </div>

              {/* Name */}
              <p className="text-sm font-semibold text-white mb-0.5 truncate">{ach.name}</p>

              {/* Description */}
              <p className="text-[11px] text-white/50 line-clamp-2 mb-1.5">{ach.description}</p>

              {/* Tier badge */}
              <span
                className="inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{
                  color: ach.unlocked ? tier.color : "rgba(255,255,255,0.3)",
                  background: ach.unlocked ? `${tier.color}20` : "rgba(255,255,255,0.05)",
                }}
              >
                {ach.tier}
              </span>

              {/* Progress bar (for locked achievements with progress) */}
              {!ach.unlocked && ach.progress != null && ach.progress > 0 && (
                <div className="mt-2">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/40 rounded-full transition-all"
                      style={{ width: `${ach.progress * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-white/40 mt-1">{ach.progressText}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
