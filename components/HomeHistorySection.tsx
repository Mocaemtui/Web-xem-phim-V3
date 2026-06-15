"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Clock, ChevronRight } from "lucide-react";
import { getWatchHistory, type WatchHistoryItem } from "@/lib/watchHistory";
import SectionTitle from "@/components/SectionTitle";
import { getPosterUrl } from "@/lib/api";

export default function HomeHistorySection() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHistory(getWatchHistory().slice(0, 6)); // Lấy 6 phim gần nhất
  }, []);

  if (!mounted || history.length === 0) {
    return null;
  }

  return (
    <section className="mb-12 relative z-10">
      <SectionTitle title="Phim Đang Xem" viewAllLink="/lich-su" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {history.map((item) => (
          <Link
            key={item.slug}
            href={`/xem-phim/${item.slug}`}
            className="group flex flex-col h-full relative z-10 transition-transform duration-300 hover:scale-105 hover:z-20"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-zinc-900/40 shadow-lg border border-white/5 transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] group-hover:border-[var(--color-cyan-neon)]">
              <Image
                src={getPosterUrl(item)}
                alt={item.name}
                fill
                className="object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-[var(--color-cyan-neon)] shadow-[0_0_20px_var(--color-cyan-neon)] relative">
                  <div className="absolute inset-0 rounded-full animate-ping opacity-30 bg-[var(--color-cyan-neon)]" />
                  <Play className="w-6 h-6 text-[var(--color-cyan-neon)] fill-current translate-x-0.5 relative z-10" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <p className="text-xs font-semibold text-[var(--color-cyan-neon)] mb-1 flex items-center gap-1 drop-shadow-md">
                  <Clock size={12} />
                  {item.episodeName || "Xem tiếp"}
                </p>
              </div>
            </div>
            <div className="mt-2 flex-1 flex flex-col">
              <h3 className="font-outfit font-medium text-white text-sm line-clamp-1 group-hover:text-[var(--color-cyan-neon)] transition-colors leading-tight drop-shadow-md">
                {item.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-zinc-500">{item.year}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
