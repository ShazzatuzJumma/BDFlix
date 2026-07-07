"use client";

import { Facebook, Instagram, Twitter, Youtube, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto bg-[#0b0b0f] border-t border-white/10 px-4 md:px-8 lg:px-12 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-0 mb-4">
              <span className="text-2xl font-black tracking-tighter text-white">BD</span>
              <span className="text-2xl font-black tracking-tighter bdnflix-red">Nflix</span>
            </div>
            <p className="text-sm text-white/50 max-w-xs">
              Stream unlimited movies, TV shows, and anime in HD. Anywhere. Anytime.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Browse</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><a href="#" className="hover:text-white">Home</a></li>
              <li><a href="#" className="hover:text-white">Movies</a></li>
              <li><a href="#" className="hover:text-white">TV Shows</a></li>
              <li><a href="#" className="hover:text-white">Trending</a></li>
              <li><a href="#" className="hover:text-white">My List</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="#" className="hover:text-white">Account</a></li>
              <li><a href="#" className="hover:text-white">Devices</a></li>
              <li><a href="#" className="hover:text-white">Accessibility</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">About</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><a href="#" className="hover:text-white">About BDnFlix</a></li>
              <li><a href="#" className="hover:text-white">Privacy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Use</a></li>
              <li><a href="#" className="hover:text-white">Cookie Preferences</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            {[Facebook, Instagram, Twitter, Youtube, Github].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-bdnflix-red flex items-center justify-center text-white/70 hover:text-white transition-colors"
                aria-label="Social link"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} BDnFlix. Metadata provided by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
