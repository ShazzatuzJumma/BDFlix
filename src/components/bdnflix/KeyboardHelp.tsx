"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useEffect, useState } from "react";

const SHORTCUTS = [
  { key: "/", desc: "Open search" },
  { key: "Esc", desc: "Close overlay / go home" },
  { key: "H", desc: "Go to Home" },
  { key: "M", desc: "Go to Movies" },
  { key: "T", desc: "Go to TV Shows" },
  { key: "N", desc: "Go to New & Popular" },
  { key: "L", desc: "Go to My List" },
  { key: "S", desc: "Go to Watch Stats" },
  { key: "G", desc: "Go to Settings" },
  { key: "⌫", desc: "Go back" },
];

export function KeyboardHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#16161d] border-white/10 text-white max-w-md p-0">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 bdnflix-red" />
            <h2 className="text-lg font-bold">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-1.5">
              <span className="text-white/70 text-sm">{s.desc}</span>
              <kbd className="min-w-[2rem] text-center px-2.5 py-1 rounded bg-white/10 border border-white/20 text-white text-sm font-mono font-semibold">
                {s.key}
              </kbd>
            </div>
          ))}
          <p className="text-xs text-white/40 pt-3 border-t border-white/10 mt-3">
            Shortcuts are disabled while typing in input fields.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook that manages the keyboard help overlay state.
 * Listens for "?" key to toggle.
 */
export function useKeyboardHelp() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isTyping) return;
      if (e.key === "?") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}
