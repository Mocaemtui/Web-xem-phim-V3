"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import EpisodeSelector from "@/components/EpisodeSelector";
import type { MovieDetail } from "@/types/api";
import { saveWatchHistory, getWatchHistory } from "@/lib/watchHistory";
import { sortEpisodes } from "@/lib/api";

const VideoPlayer = dynamic(() => import("@/components/VideoPlayer"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-zinc-900 rounded-lg flex items-center justify-center">
    </div>
  )
});

interface NguonCEpisodeItem {
  name: string;
  slug: string;
  embed: string;
  m3u8?: string;
}

interface NguonCEpisodeServer {
  server_name: string;
  items: NguonCEpisodeItem[];
}

interface WatchPageClientProps {
  movie: MovieDetail;
  posterUrl: string;
}

import { useRouter } from "next/navigation";

export default function WatchPageClient({ movie, posterUrl }: WatchPageClientProps) {
  const router = useRouter();
  
  const handleBack = () => {
    const hasReferrer = typeof document !== 'undefined' && document.referrer && document.referrer.includes(window.location.host);
    if (hasReferrer) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const [episodes, setEpisodes] = useState(sortEpisodes(movie.episodes || []));
  const [isLoadingNguonC, setIsLoadingNguonC] = useState(true);
  
  const [currentServerIndex, setCurrentServerIndex] = useState(() => {
    if (typeof window !== "undefined" && movie.episodes) {
      const preferred = localStorage.getItem("preferred_server_name");
      if (preferred) {
        const sortedEps = sortEpisodes(movie.episodes);
        const idx = sortedEps.findIndex(e => e.server_name === preferred);
        if (idx !== -1) return idx;
      }
    }
    return 0;
  });
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [selectedServerIndex, setSelectedServerIndex] = useState(currentServerIndex);
  const [isRestored, setIsRestored] = useState(false);

  // Reset trạng thái khi chuyển phim mới
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsRestored(false);
    setIsLoadingNguonC(true);
    setCurrentEpisodeIndex(0);
    const sortedEps = sortEpisodes(movie.episodes || []);
    setEpisodes(sortedEps);
    let initialIdx = 0;
    if (typeof window !== "undefined" && movie.episodes) {
      const preferred = localStorage.getItem("preferred_server_name");
      if (preferred) {
        const idx = sortedEps.findIndex(e => e.server_name === preferred);
        if (idx !== -1) {
          initialIdx = idx;
        }
      }
    }
    setCurrentServerIndex(initialIdx);
    setSelectedServerIndex(initialIdx);
  }, [movie.slug, movie.episodes]);

  // Client-side fetch for NguonC to bypass Vercel DataCenter Cloudflare blocks
  useEffect(() => {
    let active = true;
    const fetchNguonC = async () => {
      try {
        let res = await fetch(`https://phim.nguonc.com/api/film/${movie.slug}`);
        let data = res.ok ? await res.json() : null;

        // --- SMART CROSS-API MATCHING (FALLBACK) ---
        if (!data?.movie?.episodes && active) {
          const originName = movie.origin_name || movie.name;
          if (originName) {
            const searchRes = await fetch(`https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(originName)}`);
            if (searchRes.ok && active) {
              const searchData = await searchRes.json();
              const match = searchData?.items?.find((m: { original_name?: string; name?: string; slug: string }) => 
                (m.original_name?.toLowerCase() === originName.toLowerCase() || m.name?.toLowerCase() === originName.toLowerCase())
              );
              if (match && match.slug !== movie.slug && active) {
                res = await fetch(`https://phim.nguonc.com/api/film/${match.slug}`);
                data = res.ok ? await res.json() : null;
              }
            }
          }
        }
        
        if (active && data?.movie?.episodes) {
          const nguonCEps = data.movie.episodes.map((epServer: NguonCEpisodeServer) => ({
            server_name: `NguonC - ${epServer.server_name}`,
            server_data: epServer.items.map((item: NguonCEpisodeItem) => ({
              name: item.name,
              slug: item.slug,
              filename: item.name,
              link: "",
              link_embed: item.embed,
              link_m3u8: item.m3u8 || ""
            }))
          }));
          
          setEpisodes(prev => {
            if (prev.some(e => e.server_name.startsWith('NguonC'))) return prev;
            const updated = sortEpisodes([...prev, ...nguonCEps]);
            
            // Re-evaluate preferred server if it has NguonC
            if (typeof window !== "undefined") {
              const preferred = localStorage.getItem("preferred_server_name");
              if (preferred) {
                const idx = updated.findIndex(e => e.server_name === preferred);
                if (idx !== -1) {
                  setCurrentServerIndex(idx);
                  setSelectedServerIndex(idx);
                }
              }
            }
            return updated;
          });
        }
      } catch (error) {
        console.error("Lỗi tải NguonC (Client):", error);
      } finally {
        if (active) setIsLoadingNguonC(false);
      }
    };

    fetchNguonC();
    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie.slug]);

  useEffect(() => {
    if (!isLoadingNguonC && !isRestored) {
      // Check query parameters first (e.g. ?tap=3&server=0)
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const tapParam = params.get("tap");
        const serverParam = params.get("server");
        
        let sIdx = serverParam ? parseInt(serverParam, 10) : 0;
        let tIdx = tapParam ? parseInt(tapParam, 10) - 1 : 0;
        
        if (tapParam || serverParam) {
          if (episodes?.[sIdx]?.server_data?.[tIdx]) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCurrentServerIndex(sIdx);
            setCurrentEpisodeIndex(tIdx);
            setIsRestored(true);
            return;
          } else if (episodes?.[0]?.server_data?.[tIdx]) {
            setCurrentServerIndex(0);
            setCurrentEpisodeIndex(tIdx);
            setIsRestored(true);
            return;
          }
        }
      }

      const history = getWatchHistory();
      const item = history.find(i => i.slug === movie.slug);
      if (item) {
        if (episodes?.[item.currentServerIndex]?.server_data?.[item.currentEpisodeIndex]) {
          setCurrentServerIndex(item.currentServerIndex);
          setCurrentEpisodeIndex(item.currentEpisodeIndex);
        }
      }
      setIsRestored(true);
    }
  }, [movie, isRestored, episodes, isLoadingNguonC]);

  const currentServer = episodes[currentServerIndex];
  const serverData = currentServer?.server_data || [];
  const currentEpisode = serverData[currentEpisodeIndex];

  // Save watch history whenever episode or server changes
  useEffect(() => {
    if (isRestored && currentEpisode) {
      saveWatchHistory(
        movie,
        currentEpisode.name || `Tập ${currentEpisodeIndex + 1}`,
        currentServerIndex,
        currentEpisodeIndex
      );
    }
  }, [movie, currentEpisode, currentServerIndex, currentEpisodeIndex, isRestored]);

  const handleEpisodeSelect = (episodeIndex: number) => {
    setCurrentServerIndex(selectedServerIndex);
    setCurrentEpisodeIndex(episodeIndex);
  };

  const handleServerChange = (serverIndex: number) => {
    setSelectedServerIndex(serverIndex);
    if (typeof window !== "undefined") {
      const preferred = episodes[serverIndex]?.server_name;
      if (preferred) {
        localStorage.setItem("preferred_server_name", preferred);
      }
    }
  };

  const isSingleEpisode = currentEpisode?.name.toLowerCase().includes("full") || (episodes.length > 0 && serverData.length === 1 && currentEpisode?.name === "1");

  return (
    <div className="min-h-screen bg-zinc-950 overflow-x-hidden">
      {/* Top Bar with Back Button */}
      <div className="fixed top-[76px] left-4 z-40 pointer-events-none flex items-start">
        <button 
          onClick={handleBack}
          className="pointer-events-auto bg-black/60 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-md transition-all border border-white/10 shadow-lg hover:scale-105 active:scale-95"
          title="Quay lại"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="container mx-auto px-4 py-8 mt-12 md:mt-0">
        
        {/* Video Player (Moved to very top below back button) */}
        <div className="mb-8 relative z-10 w-full aspect-video">
          {currentEpisode ? (
            <VideoPlayer
              key={`${currentServerIndex}-${currentEpisodeIndex}`}
              poster={posterUrl}
              videoUrl={currentEpisode.link_m3u8}
              embedUrl={currentEpisode.link_embed}
              hasNextEpisode={currentEpisodeIndex < serverData.length - 1}
              nextVideoUrl={serverData[currentEpisodeIndex + 1]?.link_m3u8}
              onAutoNext={() => {
                if (currentEpisodeIndex < serverData.length - 1) {
                  setCurrentEpisodeIndex((prev) => prev + 1);
                }
              }}
            />
          ) : (
            <div className="relative w-full aspect-video bg-zinc-900 rounded-lg flex items-center justify-center">
              <div className="text-center p-8">
                <p className="text-zinc-400 text-lg mb-2">Không tìm thấy link phim</p>
                <p className="text-zinc-500 text-sm">Phim này hiện không có sẵn để xem</p>
              </div>
            </div>
          )}
        </div>

        {/* Movie Info (Below Video Player) */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {isSingleEpisode 
              ? movie.name 
              : `${movie.name} - ${currentEpisode?.name.toLowerCase().includes("tập") ? currentEpisode.name : `Tập ${currentEpisode?.name || currentEpisodeIndex + 1}`}`
            }
          </h1>
          {movie.origin_name && (
            <p className="text-lg text-zinc-400 mb-4">{movie.origin_name}</p>
          )}

          <div className="flex flex-wrap gap-3 text-sm mb-4">
            <span className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full">
              {movie.year}
            </span>
            {movie.quality && (
              <span className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full">
                {movie.quality}
              </span>
            )}
            {movie.lang && (
              <span className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full">
                {movie.lang}
              </span>
            )}
            {movie.time && (
              <span className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full">
                {movie.time}
              </span>
            )}
          </div>

          {/* Categories */}
          {movie.category && movie.category.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {movie.category.map((cat: any) => (
                <span
                  key={cat.id || cat.slug}
                  className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-400"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          {/* Countries */}
          {movie.country && movie.country.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {movie.country.map((country: any) => (
                <span key={country.id || country.slug} className="text-sm text-zinc-400">
                  {country.name}
                </span>
              ))}
            </div>
          )}

          {/* Actors */}
          {movie.actor && movie.actor.length > 0 && (
            <div className="mb-4">
              <span className="text-sm text-zinc-500">Diễn viên: </span>
              <span className="text-sm text-zinc-400">
                {movie.actor.join(", ")}
              </span>
            </div>
          )}

          {/* Content Description */}
          {movie.content && (
            <div 
              className="text-zinc-400 text-sm leading-relaxed max-w-4xl"
              dangerouslySetInnerHTML={{ __html: movie.content }}
            />
          )}
        </div>

        {/* Episode Selector */}
        <div className="relative z-30">
          {episodes.length > 0 && serverData.length > 0 ? (
            <EpisodeSelector
              episodes={episodes}
              currentServerIndex={selectedServerIndex}
              currentEpisodeIndex={currentServerIndex === selectedServerIndex ? currentEpisodeIndex : -1}
              onSelectEpisode={handleEpisodeSelect}
              onSelectServer={handleServerChange}
            />
          ) : (
            <div className="mb-8 p-4 bg-zinc-900 rounded-lg">
              <p className="text-zinc-400 text-sm">Không có tập phim nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
