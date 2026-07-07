"use client";

import { motion } from "framer-motion";
import { Share2, Copy, Check, Facebook, ExternalLink, MessageCircle, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { titleOf, type TMDBItem } from "@/lib/tmdb-types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  item: TMDBItem;
  mediaType: "movie" | "tv";
}

export function ShareDialog({ open, onClose, item, mediaType }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const title = titleOf(item);
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/?share=${mediaType}-${item.id}`
    : "";
  const shareText = `Check out "${title}" on BDnFlix!`;

  const shareLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "#1877f2",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      name: "Twitter",
      icon: MessageCircle,
      color: "#1da1f2",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Reddit",
      icon: Share2,
      color: "#ff4500",
      url: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "#25d366",
      url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
    },
    {
      name: "Email",
      icon: Mail,
      color: "#6b7280",
      url: `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`I thought you might like this on BDnFlix:\n\n${title}\n${shareUrl}`)}`,
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: shareUrl });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#16161d] border-white/10 text-white max-w-md p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-white/10">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Share2 className="w-5 h-5 bdnflix-red" />
            Share "{title.length > 30 ? title.slice(0, 30) + "…" : title}"
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Social links */}
          <div className="grid grid-cols-5 gap-3">
            {shareLinks.map((link) => {
              const Icon = link.icon;
              return (
                <motion.a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:shadow-lg"
                    style={{ backgroundColor: `${link.color}20`, border: `1px solid ${link.color}40` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: link.color }} />
                  </div>
                  <span className="text-[10px] text-white/60 group-hover:text-white transition-colors">{link.name}</span>
                </motion.a>
              );
            })}
          </div>

          {/* Copy link */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-wider">Share Link</label>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent text-white text-sm px-2 outline-none truncate"
              />
              <button
                onClick={handleCopy}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                  copied ? "bg-green-600 text-white" : "bg-bdnflix-red text-white hover:bg-bdnflix-red-dark",
                )}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Native share (if supported) */}
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              More sharing options…
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
