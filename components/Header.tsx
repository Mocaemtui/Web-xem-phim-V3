"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Menu, X, Filter, Clock, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Movie } from "@/types/api";
import { getPosterUrl, searchPhim } from "@/lib/api";

export default function Header() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Mocaemtui";
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkInstallability = () => {
      if ((window as any).deferredPrompt) {
        setIsInstallable(true);
      }
    };

    const handleInstallable = () => {
      setIsInstallable(true);
    };

    window.addEventListener("pwa_installable", handleInstallable);
    
    // Check initial state
    checkInstallability();

    return () => {
      window.removeEventListener("pwa_installable", handleInstallable);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) return;

    // Show prompt
    promptEvent.prompt();

    // Wait for user choice
    const { outcome } = await promptEvent.userChoice;
    console.log(`PWA install user choice outcome: ${outcome}`);

    // Clear prompt event since it can only be used once
    (window as any).deferredPrompt = null;
    setIsInstallable(false);
  };

  useEffect(() => {
    if (searchKeyword.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchPhim(searchKeyword);
        const items = data?.data?.items || [];
        setSearchResults(items.slice(0, 8));
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchKeyword]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/tim-kiem/${encodeURIComponent(searchKeyword.trim())}`);
      setSearchOpen(false);
      setSearchKeyword("");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  return (
    <header className="sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/5 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white transition-transform hover:scale-105">
            <img src="/icon-192x192.png" alt="Mocaemtui Logo" className="w-8 h-8 rounded-full object-cover shadow-glow" />
            <span className="tracking-tight font-outfit text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{siteName}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-zinc-300 hover:text-[var(--color-cyan-neon)] hover:drop-shadow-[0_0_8px_var(--color-cyan-neon)] transition-all">
              Trang chủ
            </Link>
            <Link href="/filter" className="text-sm font-medium text-zinc-300 hover:text-[var(--color-cyan-neon)] hover:drop-shadow-[0_0_8px_var(--color-cyan-neon)] transition-all flex items-center gap-1.5">
              <Filter size={16} />
              Bộ lọc
            </Link>
            <Link href="/lich-su" className="text-sm font-medium text-zinc-300 hover:text-[var(--color-cyan-neon)] hover:drop-shadow-[0_0_8px_var(--color-cyan-neon)] transition-all flex items-center gap-1.5">
              <Clock size={16} />
              Lịch sử
            </Link>
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="text-sm font-medium text-black bg-[var(--color-cyan-neon)] hover:bg-[var(--color-cyan-neon)]/90 px-3 py-1 rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_12px_var(--color-cyan-neon)] scale-100 hover:scale-105 active:scale-95 duration-300 cursor-pointer"
              >
                <Download size={14} />
                Tải App
              </button>
            )}
          </nav>

          {/* Search & Mobile Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-zinc-400 hover:text-white transition-colors rounded-full bg-white/5 hover:bg-white/10 border border-white/5"
              title="Tìm kiếm (Ctrl+K)"
            >
              <Search size={16} />
              <span className="text-xs hidden md:inline-block font-medium">Ctrl K</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-300 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search Modal (Spotlight) */}
        {searchOpen && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] animate-in fade-in duration-200">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setSearchOpen(false)} />
            
            <div className="relative w-full max-w-2xl mx-4 bg-zinc-900/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in zoom-in-95 duration-200">
              <form onSubmit={handleSearch} className="flex items-center px-4 border-b border-white/5 bg-black/40">
                <Search className="text-[var(--color-cyan-neon)] drop-shadow-[0_0_8px_var(--color-cyan-neon)]" size={24} />
                <input
                  type="text"
                  placeholder="Tìm kiếm phim, diễn viên..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full bg-transparent text-white text-lg md:text-xl placeholder-zinc-500 px-4 py-5 focus:outline-none"
                  autoFocus
                />
                {searchKeyword && (
                  <button type="button" onClick={() => setSearchKeyword("")} className="text-zinc-400 hover:text-white p-2">
                    <X size={20} />
                  </button>
                )}
              </form>

              {/* Live Search Results */}
              <AnimatePresence>
                {searchKeyword.trim().length >= 2 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="max-h-[60vh] overflow-y-auto bg-black/60 backdrop-blur-xl border-b border-white/5"
                  >
                    {isSearching ? (
                      <div className="p-6 flex justify-center items-center">
                        <div className="w-5 h-5 border-2 border-zinc-500 border-t-[var(--color-cyan-neon)] rounded-full animate-spin" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="flex flex-col">
                        {searchResults.map((movie, index) => (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            key={movie._id}
                          >
                            <Link
                              href={`/phim/${movie.slug}`}
                              onClick={() => setSearchOpen(false)}
                              className="group flex items-center gap-4 p-3 hover:bg-[var(--color-cyan-neon)]/10 transition-colors border-b border-white/5 last:border-0"
                            >
                              <div className="relative w-12 h-16 rounded-md overflow-hidden shrink-0">
                                <img
                                  src={getPosterUrl(movie)}
                                  alt={movie.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              </div>
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-zinc-200 group-hover:text-white group-hover:text-[var(--color-cyan-neon)] font-medium line-clamp-1 transition-colors">
                                  {movie.name}
                                </span>
                                <span className="text-zinc-500 text-xs line-clamp-1">
                                  {movie.origin_name} ({movie.year})
                                </span>
                              </div>
                              {movie.quality && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-white/10 text-zinc-300 rounded shrink-0 group-hover:bg-[var(--color-cyan-neon)] group-hover:text-black transition-colors">
                                  {movie.quality}
                                </span>
                              )}
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-zinc-500 text-sm">Không tìm thấy kết quả nào cho &quot;{searchKeyword}&quot;</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-3 bg-zinc-950/50 flex items-center justify-between text-[11px] md:text-xs text-zinc-500">
                <span>Nhấn <kbd className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-zinc-300">Enter</kbd> để xem tất cả</span>
                <span className="flex items-center gap-1">Nhấn <kbd className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-zinc-300">ESC</kbd> để đóng</span>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col gap-2">
              <Link href="/" className="px-4 py-3 rounded-lg text-sm font-medium text-zinc-200 hover:bg-white/10 transition-colors">
                Trang chủ
              </Link>
              <Link href="/filter" className="px-4 py-3 rounded-lg text-sm font-medium text-zinc-200 hover:bg-white/10 transition-colors flex items-center gap-2">
                <Filter size={18} />
                Bộ lọc
              </Link>
              <Link href="/lich-su" className="px-4 py-3 rounded-lg text-sm font-medium text-zinc-200 hover:bg-white/10 transition-colors flex items-center gap-2">
                <Clock size={18} />
                Lịch sử
              </Link>
              {isInstallable && (
                <button
                  onClick={handleInstallClick}
                  className="mx-4 my-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-black bg-[var(--color-cyan-neon)] hover:bg-[var(--color-cyan-neon)]/90 transition-colors flex items-center justify-center gap-2 shadow-[0_0_12px_var(--color-cyan-neon)] cursor-pointer"
                >
                  <Download size={16} />
                  Tải App Mocaemtui
                </button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
