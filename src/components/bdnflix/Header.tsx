"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, ChevronDown, Menu, X, Home, Film, Tv, TrendingUp, Heart, History, Settings, LogOut, User, Star, Flame, BarChart3 } from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useAppStore, type View } from "@/store/useAppStore";
import { getAvatar } from "@/lib/avatars";
import type { Profile } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface HeaderProps {
  profile: Profile;
  onSwitchProfile: () => void;
}

const NAV_ITEMS: { label: string; view: View; icon: React.ElementType }[] = [
  { label: "Home", view: { name: "home" }, icon: Home },
  { label: "Movies", view: { name: "movies" }, icon: Film },
  { label: "TV Shows", view: { name: "tv" }, icon: Tv },
  { label: "New & Popular", view: { name: "newpopular" }, icon: Flame },
  { label: "My List", view: { name: "mylist" }, icon: Heart },
  { label: "Ratings", view: { name: "ratings" }, icon: Star },
  { label: "History", view: { name: "history" }, icon: History },
];

export function Header({ profile, onSwitchProfile }: HeaderProps) {
  const navigate = useAppStore((s) => s.navigate);
  const view = useAppStore((s) => s.view);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const mobileNavOpen = useAppStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useAppStore((s) => s.setMobileNavOpen);
  const [scrolled, setScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const avatar = getAvatar(profile.avatar);
  const isActive = (item: View) => view.name === item.name;

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "glass border-b border-white/10" : "bg-gradient-to-b from-black/80 via-black/40 to-transparent",
        )}
      >
        <div className="flex items-center px-4 md:px-8 lg:px-12 h-16 gap-6">
          {/* Logo */}
          <button
            onClick={() => navigate({ name: "home" })}
            className="flex items-center gap-0 shrink-0"
            aria-label="BDnFlix home"
          >
            <span className="text-2xl md:text-3xl font-black tracking-tighter text-white">BD</span>
            <span className="text-2xl md:text-3xl font-black tracking-tighter bdnflix-red">Nflix</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.view)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded transition-colors",
                  isActive(item.view)
                    ? "text-white"
                    : "text-white/70 hover:text-white",
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="text-white hover:bg-white/10"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotifOpen(true)}
              className="text-white hover:bg-white/10 relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-bdnflix-red rounded-full pulse-glow" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden md:flex items-center gap-1.5 rounded p-1 hover:bg-white/10 transition">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-lg"
                    style={{ background: avatar.gradient }}
                  >
                    {avatar.emoji}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-white/70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#16161d] border-white/10 text-white w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded flex items-center justify-center text-sm"
                    style={{ background: avatar.gradient }}
                  >
                    {avatar.emoji}
                  </div>
                  <span className="font-medium truncate">{profile.name}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={() => navigate({ name: "stats" })}
                  className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                >
                  <BarChart3 className="w-4 h-4 mr-2" /> Watch Stats
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate({ name: "settings" })}
                  className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                >
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onSwitchProfile}
                  className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Switch Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden text-white hover:bg-white/10"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile nav sheet */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="bg-[#0b0b0f] border-white/10 text-white w-72 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/10">
            <SheetTitle className="flex items-center gap-0">
              <span className="text-2xl font-black tracking-tighter text-white">BD</span>
              <span className="text-2xl font-black tracking-tighter bdnflix-red">Nflix</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center gap-3 py-6 border-b border-white/10">
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl"
              style={{ background: avatar.gradient }}
            >
              {avatar.emoji}
            </div>
            <span className="font-semibold">{profile.name}</span>
          </div>
          <nav className="flex flex-col p-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    navigate(item.view);
                    setMobileNavOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                    isActive(item.view) ? "bg-bdnflix-red/20 text-white" : "text-white/80 hover:bg-white/5",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={() => {
                navigate({ name: "stats" });
                setMobileNavOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-left text-white/80 hover:bg-white/5"
            >
              <BarChart3 className="w-5 h-5" /> Watch Stats
            </button>
            <button
              onClick={() => {
                navigate({ name: "settings" });
                setMobileNavOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-left text-white/80 hover:bg-white/5"
            >
              <Settings className="w-5 h-5" /> Settings
            </button>
            <button
              onClick={() => {
                onSwitchProfile();
                setMobileNavOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-left text-white/80 hover:bg-white/5"
            >
              <LogOut className="w-5 h-5" /> Switch Profile
            </button>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Notification center */}
      <NotificationCenter
        profileId={profile.id}
        open={notifOpen}
        onOpenChange={setNotifOpen}
      />
    </>
  );
}
