"use client";

import { motion } from "framer-motion";
import { profileUrl } from "@/lib/tmdb-types";
import type { TMDBItem } from "@/lib/tmdb-types";
import { titleOf } from "@/lib/tmdb-types";

interface PersonChipProps {
  person: {
    id: number;
    name: string;
    profile_path: string | null;
    known_for_department: string;
    known_for?: TMDBItem[];
  };
  onClick: () => void;
}

export function PersonChip({ person, onClick }: PersonChipProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="shrink-0 w-32 md:w-36 text-left group"
    >
      <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden bg-[#1a1a22] mb-2 ring-2 ring-transparent group-hover:ring-bdnflix-red transition-all">
        {person.profile_path ? (
          <img
            src={profileUrl(person.profile_path, "w185")}
            alt={person.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-4xl">👤</div>
        )}
      </div>
      <p className="text-sm font-medium text-white truncate group-hover:text-bdnflix-red transition-colors">{person.name}</p>
      <p className="text-xs text-white/50 truncate capitalize">{person.known_for_department}</p>
      {person.known_for && person.known_for.length > 0 && (
        <p className="text-[11px] text-white/40 truncate mt-0.5">
          {person.known_for.slice(0, 2).map((k) => titleOf(k)).join(", ")}
        </p>
      )}
    </motion.button>
  );
}
