"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Menu, X, Filter, Clock } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Mocaemtui";

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/tim-kiem/${encodeURIComponent(searchKeyword.trim())}`);
      setSearchOpen(false);
      setSearchKeyword("");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-zinc-950 border-b border-white/10 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white transition-transform hover:scale-105">
            <img src="/icon-192x192.png" alt="Mocaemtui Logo" className="w-8 h-8 rounded-full object-cover shadow-glow" />
            <span className="tracking-tight">{siteName}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Trang chủ
            </Link>
            <Link href="/filter" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5">
              <Filter size={16} />
              Bộ lọc
            </Link>
            <Link href="/lich-su" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5">
              <Clock size={16} />
              Lịch sử
            </Link>
          </nav>

          {/* Search & Mobile Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-zinc-300 hover:text-white transition-colors rounded-full hover:bg-white/10"
              title="Tìm kiếm"
            >
              <Search size={20} />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-300 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="py-4 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm phim, diễn viên..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full bg-zinc-900/60 backdrop-blur-sm text-white pl-12 pr-4 py-3 rounded-full border border-zinc-700/50 focus:border-blue-500 focus:bg-zinc-900/80 focus:outline-none transition-all shadow-inner"
                autoFocus
              />
            </form>
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
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
