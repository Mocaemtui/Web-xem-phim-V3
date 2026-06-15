"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import type { Movie } from "@/types/api";
import { getPosterUrl } from "@/lib/api";
import { getWatchHistory } from "@/lib/watchHistory";

interface MovieCardProps {
  movie: Movie;
  posterUrl?: string;
  href?: string;
  isHistory?: boolean;
}

// Hàm hỗ trợ chuyển URL Youtube thành Embed URL cho background play
const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return null;
  let videoId = "";
  if (url.includes("youtube.com/watch?v=")) {
    videoId = url.split("v=")[1].split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1].split("?")[0];
  }
  if (!videoId) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${videoId}&playsinline=1&vq=hd1080`;
};

export default function MovieCard({ movie, posterUrl, href, isHistory }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [thumbImageUrl, setThumbImageUrl] = useState<string | null>(null);
  const [actualEpisodeCount, setActualEpisodeCount] = useState<number | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [historyData, setHistoryData] = useState<{ episodeName?: string; progressPercent?: number } | null>(null);

  useEffect(() => {
    // Lazily fetch actual episode count for series to fix missing episode_total
    const isSeries = movie.type !== "single" && movie.episode_total !== "1" && movie.slug;
    if (isSeries) {
      const fetchExactCount = async () => {
        try {
          const res = await fetch(`https://phimapi.com/phim/${movie.slug}`);
          const data = await res.json();
          if (data && data.episodes) {
             const phimapi = data.episodes.find((e: any) => e.server_name.toLowerCase().includes("phimapi"));
             if (phimapi) return setActualEpisodeCount(phimapi.server_data.length);
             const ophim = data.episodes.find((e: any) => e.server_name.toLowerCase().includes("ophim"));
             if (ophim) return setActualEpisodeCount(ophim.server_data.length);
             const other = data.episodes.find((e: any) => !e.server_name.toLowerCase().includes("vid"));
             if (other) return setActualEpisodeCount(other.server_data.length);
          }
        } catch (e) {}
      };
      // Random delay 500ms -> 2500ms to prevent network congestion when 60 cards mount
      const timer = setTimeout(fetchExactCount, 500 + Math.random() * 2000);
      return () => clearTimeout(timer);
    }
  }, [movie.slug, movie.type, movie.episode_total]);

  useEffect(() => {
    try {
      const history = getWatchHistory();
      const item = history.find(h => h.slug === movie.slug);
      if (item) {
        let progressPercent = 0;
        const key = `playback_progress_${item.slug}_ep_${item.currentEpisodeIndex}_percent`;
        const val = localStorage.getItem(key);
        if (val) {
          progressPercent = parseFloat(val);
        }
        setHistoryData({
          episodeName: item.episodeName,
          progressPercent
        });
      }
    } catch (e) {}
  }, [movie.slug]);

  useEffect(() => {
    if (isHovered && cardRef.current) {
      setRect(cardRef.current.getBoundingClientRect());
    }
  }, [isHovered]);

  useEffect(() => {
    if (isHovered) {
      hoverTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`https://phimapi.com/phim/${movie.slug}`);
          const data = await res.json();
          if (data.movie?.trailer_url) {
            const embed = getYoutubeEmbedUrl(data.movie.trailer_url);
            if (embed) {
              setTrailerUrl(embed);
              setThumbImageUrl(null);
            }
          } else if (data.movie?.thumb_url) {
            setThumbImageUrl(data.movie.thumb_url);
            setTrailerUrl(null);
          }
        } catch (e) {}
      }, 1200); // Đợi 1.2s hover liên tục mới tải dữ liệu để tránh lag
    } else {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      setTrailerUrl(null); // Xóa iframe ngay khi chuột rời đi
      setThumbImageUrl(null);
    }
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, [isHovered, movie.slug]);

  if (!movie.slug) {
    return null;
  }

  const finalPosterUrl = getPosterUrl(movie);

  const renderEpisodeBadge = () => {
    // Xác định xem có phải phim lẻ không
    const isSingle = movie.type === "single" || movie.episode_total === "1" || historyData?.episodeName?.toLowerCase() === "full";

    if (isSingle) {
      if (movie.time && movie.time !== "Đang cập nhật") {
        return movie.time.replace(/phút/gi, "p").replace(/\s+/g, "");
      }
      return movie.quality || "Phim Lẻ";
    }

    // Phim bộ
    const total = movie.episode_total && movie.episode_total !== "?" && movie.episode_total.toLowerCase() !== "unknown" ? movie.episode_total : "?";

    const extractNumber = (str: string) => {
      const match = str.match(/\d+/);
      return match ? match[0] : null;
    };

    // Đã xem
    if (historyData?.episodeName) {
      const epNum = extractNumber(historyData.episodeName);
      const totalToDisplay = actualEpisodeCount || total;
      if (epNum) {
        return `Tập ${epNum}/${totalToDisplay}`;
      }
      return `${historyData.episodeName}/${totalToDisplay}`;
    }

    // Chưa xem
    let current = movie.episode_current || "?";
    
    if (current.includes("/")) {
      current = current.split("/")[0].trim();
    }

    // Nếu lấy được số tập thật từ mảng episodes, luôn dùng số đó
    if (actualEpisodeCount !== null) {
      return `${actualEpisodeCount} Tập`;
    }

    const epNum = extractNumber(current);
    if (epNum) {
      return `${epNum} Tập`;
    }

    if (current === "?" || current.toLowerCase().includes("cập nhật")) {
      return movie.quality || "Phim Bộ";
    }
    return current;
  };

  return (
    <Link 
      ref={cardRef}
      href={href || `/phim/${encodeURIComponent(movie.slug)}`} 
      draggable={false}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex flex-col h-full relative z-10 transition-transform duration-300 hover:scale-105 hover:z-20 select-none"
    >
      <div 
        className="relative aspect-[2/3] overflow-hidden rounded-xl bg-zinc-900/40 shadow-lg border border-white/5 transition-all duration-500"
        style={{ 
           boxShadow: 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)',
        }}
      >
        {/* Lớp hover overlay lấy màu từ biến CSS */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none border-2 border-[var(--color-cyan-neon)] shadow-[0_0_20px_var(--color-cyan-neon)]"
        />
        
        <Image
          src={finalPosterUrl}
          alt={movie.name}
          fill
          draggable={false}
          className={`object-cover transition-all duration-700 ease-out will-change-transform ${trailerUrl ? 'opacity-0 scale-110' : 'opacity-100'}`}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
          loading="lazy"
        />
        
        {/* Quality / Lang Badge */}
        <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
          {renderEpisodeBadge() && (
            <span className="px-1.5 py-0.5 bg-[var(--color-cyan-neon)] text-black text-[10px] font-bold rounded shadow-[0_0_10px_var(--color-cyan-neon)] whitespace-nowrap">
              {renderEpisodeBadge()}
            </span>
          )}
          {movie.lang && (
            <span className="px-1.5 py-0.5 bg-black/60 text-[10px] font-medium text-zinc-200 rounded shadow-sm backdrop-blur-md border border-white/10 whitespace-nowrap">
              {movie.lang}
            </span>
          )}
        </div>

        {/* Hover Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
        
        {/* Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 pointer-events-none">
          <div className="w-14 h-14 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-[var(--color-cyan-neon)] shadow-[0_0_20px_var(--color-cyan-neon)] relative">
            <div className="absolute inset-0 rounded-full animate-ping opacity-30 bg-[var(--color-cyan-neon)]" />
            <svg className="w-7 h-7 translate-x-0.5 relative z-10 text-[var(--color-cyan-neon)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Lịch sử: Nhãn tập đang xem */}
        {historyData?.episodeName && (
          <div className="absolute bottom-1 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 pointer-events-none">
            <p className="text-xs font-semibold text-[var(--color-cyan-neon)] mb-1 flex items-center gap-1 drop-shadow-md">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {historyData.episodeName}
            </p>
          </div>
        )}

        {/* Lịch sử: Vạch tiến trình */}
        {historyData?.progressPercent !== undefined && historyData.progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-800 z-30 pointer-events-none">
            <div 
              className="h-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" 
              style={{ width: `${Math.min(100, Math.max(0, historyData.progressPercent))}%` }} 
            />
          </div>
        )}

        {/* Origin Name on Hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0 pointer-events-none">
          <p className="text-xs font-medium text-zinc-300 line-clamp-2">{movie.origin_name || movie.name}</p>
        </div>
      </div>
      
      {/* Youtube Auto-play Trailer or Thumb Image Pop-out (Netflix Style) rendered via Portal */}
      {(trailerUrl || thumbImageUrl) && rect && typeof window !== "undefined" && createPortal(
        <div 
          className="fixed z-[9999] bg-zinc-950 animate-in fade-in zoom-in-95 duration-300 rounded-lg overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] border border-white/5 pointer-events-auto origin-center transition-all flex flex-col"
          style={{
            top: rect.top + rect.height / 2,
            left: rect.left + rect.width / 2,
            width: rect.width * 1.75, // 175% của thẻ gốc
            transform: "translate(-50%, -50%)"
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Link href={href || `/phim/${encodeURIComponent(movie.slug)}`} className="absolute inset-0 z-10" />
          <div className="relative w-full aspect-video bg-black z-0">
            {trailerUrl ? (
              <iframe
                src={trailerUrl}
                className="w-full h-full pointer-events-none opacity-100"
                allow="autoplay; encrypted-media"
              />
            ) : (
              thumbImageUrl && (
                <Image
                  src={thumbImageUrl.startsWith('http') ? thumbImageUrl : `https://img.ophim.live/uploads/movies/${thumbImageUrl}`}
                  alt={movie.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )
            )}
            {/* Lớp mờ nhẹ phía dưới video/ảnh để làm mượt phần chuyển giao */}
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
          </div>
          <div className="p-4 flex flex-col gap-2 bg-zinc-950 relative z-20">
            {/* Action Buttons */}
            <div className="flex items-center gap-2 mb-1">
               <Link href={href || `/phim/${encodeURIComponent(movie.slug)}`} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black shadow-lg hover:bg-zinc-200 transition-colors">
                  <svg className="w-4 h-4 translate-x-[1px]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
               </Link>
               <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
               </div>
               <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/></svg>
               </div>
               <div className="ml-auto w-8 h-8 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-white hover:bg-zinc-700 transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
               </div>
            </div>
            
            <span className="text-white font-bold text-[15px] leading-tight line-clamp-1">{movie.name}</span>
            <div className="flex items-center gap-2 text-[11px] mt-0.5 font-medium">
              {movie.quality && <span className="text-[var(--color-cyan-neon)]">{movie.quality}</span>}
              <span className="text-zinc-400 border border-zinc-700 px-1.5 rounded-sm uppercase tracking-wider">{movie.lang || "Vietsub"}</span>
              <span className="text-zinc-300">{movie.year}</span>
              {movie.time && <span className="text-zinc-400">{movie.time}</span>}
            </div>
            {movie.category && movie.category.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {movie.category.slice(0, 3).map((c, i) => (
                  <div key={c.id} className="flex items-center gap-1.5">
                    <span className="text-zinc-400 text-[10px] whitespace-nowrap">{c.name}</span>
                    {i < 2 && i < (movie.category?.length || 0) - 1 && <span className="w-1 h-1 rounded-full bg-zinc-600" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
      
      <div className="mt-3 flex-1 flex flex-col pointer-events-none">
        <h3 
          className="font-outfit font-semibold text-white text-base line-clamp-2 group-hover:text-[var(--color-cyan-neon)] transition-colors leading-tight drop-shadow-md"
        >
          {movie.name}
        </h3>
        <div className="flex items-center gap-2 mt-auto pt-1.5">
          <span className="text-xs font-medium text-zinc-400">{movie.year}</span>
          {movie.country && movie.country.length > 0 && (
            <>
              <span className="text-zinc-700 text-[10px]">•</span>
              <span className="text-xs text-zinc-500 line-clamp-1">{movie.country[0].name}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
