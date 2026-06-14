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
            className="group flex flex-col h-full transition-all duration-300 hover:scale-105 hover:z-10 relative"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-zinc-900 shadow-lg border border-white/5 transition-all duration-300 group-hover:shadow-blue-500/20 group-hover:border-white/10">
              <Image
                src={getPosterUrl(item)}
                alt={item.name}
                fill
                className="object-cover transition-transform duration-500 ease-out will-change-transform"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-12 h-12 text-white fill-white" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <p className="text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1">
                  <Clock size={12} />
                  {item.episodeName || "Xem tiếp"}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <h3 className="font-medium text-white text-sm line-clamp-1 group-hover:text-blue-400 transition-colors">
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
