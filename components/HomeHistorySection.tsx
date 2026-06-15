"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Clock, ChevronRight } from "lucide-react";
import { getWatchHistory, type WatchHistoryItem } from "@/lib/watchHistory";
import SectionTitle from "@/components/SectionTitle";
import { getPosterUrl } from "@/lib/api";

import MovieCard from "@/components/MovieCard";
import type { Movie } from "@/types/api";

export default function HomeHistorySection() {
  const [history, setHistory] = useState<(WatchHistoryItem & { progressPercent?: number })[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedHistory = getWatchHistory().slice(0, 6);
    
    // Fetch full data for these items to get 'time', 'type', 'episode_total'
    Promise.all(savedHistory.map(async (item) => {
      try {
        const res = await fetch(`https://phimapi.com/phim/${item.slug}`);
        const data = await res.json();
        if (data && data.movie) {
           return { ...item, ...data.movie };
        }
        return item;
      } catch (e) {
        return item;
      }
    })).then(fullHistory => {
      setHistory(fullHistory as any);
    });
  }, []);

  if (!mounted || history.length === 0) {
    return null;
  }

  return (
    <section className="mb-12 relative z-10">
      <SectionTitle title="Phim Đang Xem" viewAllLink="/lich-su" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {history.map((item) => (
          <MovieCard
            key={item.slug}
            movie={item as unknown as Movie}
            href={`/xem-phim/${item.slug}`}
            isHistory={true}
          />
        ))}
      </div>
    </section>
  );
}
