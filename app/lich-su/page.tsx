"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Clock, Play, X } from "lucide-react";
import BackButton from "@/components/BackButton";
import {
  getWatchHistory,
  removeFromHistory,
  clearWatchHistory,
  type WatchHistoryItem,
} from "@/lib/watchHistory";

import { getPosterUrl } from "@/lib/api";

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Vừa xong";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  return `${months} tháng trước`;
}

export default function WatchHistoryPage() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHistory(getWatchHistory());
  }, []);

  const handleRemove = (slug: string) => {
    removeFromHistory(slug);
    setHistory(getWatchHistory());
  };

  const handleClearAll = () => {
    if (window.confirm("Bạn có chắc muốn xóa toàn bộ lịch sử xem?")) {
      clearWatchHistory();
      setHistory([]);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="w-7 h-7 text-blue-400" />
            <h1 className="text-2xl md:text-3xl font-bold text-white">Lịch sử xem</h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 rounded-lg animate-pulse h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      <div className="container mx-auto px-4 py-8 mt-16 md:mt-20">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton fallbackUrl="/" label="Quay lại Trang chủ" />
        </div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Lịch sử xem</h1>
              <p className="text-zinc-400 mt-1">Phim bạn đã xem gần đây</p>
            </div>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Xóa tất cả</span>
            </button>
          )}
        </div>

        {/* Empty state */}
        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Clock className="w-16 h-16 text-zinc-700 mb-4" />
            <h2 className="text-xl font-semibold text-zinc-400 mb-2">
              Chưa có lịch sử xem
            </h2>
            <p className="text-zinc-500 mb-6 max-w-md">
              Khi bạn xem phim, lịch sử sẽ được lưu tại đây để bạn tiếp tục xem nhanh chóng.
            </p>
            <Link
              href="/"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
            >
              Khám phá phim
            </Link>
          </div>
        )}

        {/* History list */}
        {history.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {history.map((item) => (
              <div
                key={item.slug}
                className="group relative"
              >
                <Link
                  href={`/xem-phim/${item.slug}`}
                  className="block"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-zinc-900 shadow-lg">
                    <Image
                      src={getPosterUrl(item)}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-12 h-12 text-white fill-white" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                      <p className="text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1">
                        <Clock size={12} />
                        {item.episodeName || "Xem tiếp"}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {timeAgo(item.watchedAt)}
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

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemove(item.slug);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-zinc-900/80 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100 z-10"
                  title="Xóa khỏi lịch sử"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
