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

const getServerPriority = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("phimapi") || lower.includes("kkphim") || lower.includes("kk phim")) return 3;
  if (lower.includes("ophim")) return 2;
  if (lower.includes("nguonc") || lower.includes("nguồn c") || lower.includes("nguon c")) return 1;
  return 0;
};

export default function WatchPageClient({ movie, posterUrl }: WatchPageClientProps) {
  const router = useRouter();
  
  const handleBack = () => {
    router.push(`/phim/${movie.slug}`);
  };

  const [episodes, setEpisodes] = useState(sortEpisodes(movie.episodes || []));
  const [isLoadingNguonC, setIsLoadingNguonC] = useState(true);
  
  const [currentServerIndex, setCurrentServerIndex] = useState(0);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);
  const [isRestored, setIsRestored] = useState(false);
  const [currentOriginName, setCurrentOriginName] = useState(movie.origin_name);

  // Reset trạng thái khi chuyển phim mới
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsRestored(false);
    setIsLoadingNguonC(true);
    setCurrentEpisodeIndex(0);
    const sortedEps = sortEpisodes(movie.episodes || []);
    setEpisodes(sortedEps);
    // Luôn chọn server đầu tiên (đã sắp xếp theo thứ tự ưu tiên: PhimAPI > Ophim > NguonC)
    // khi mở phim mới, trừ phi được phục hồi từ lịch sử xem của chính phim này.
    setCurrentServerIndex(0);
    setSelectedServerIndex(0);
    setCurrentOriginName(movie.origin_name);
  }, [movie.slug, movie.origin_name, movie.episodes]);

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
          const movieName = movie.name;
          if (originName) {
            const searchRes = await fetch(`https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(originName)}`);
            if (searchRes.ok && active) {
              const searchData = await searchRes.json();
              const normalizeCompare = (s1: string | undefined, s2: string | undefined): boolean => {
                if (!s1 || !s2) return false;
                const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
                return clean(s1) === clean(s2);
              };
              const match = searchData?.items?.find((m: { original_name?: string; name?: string; slug: string }) => 
                normalizeCompare(m.original_name, originName) || 
                normalizeCompare(m.name, originName) ||
                normalizeCompare(m.original_name, movieName) ||
                normalizeCompare(m.name, movieName)
              );
              if (match && match.slug !== movie.slug && active) {
                res = await fetch(`https://phim.nguonc.com/api/film/${match.slug}`);
                data = res.ok ? await res.json() : null;
              }
            }
          }
        }
        
        if (active && data?.movie) {
          if (data.movie.original_name && (!movie.origin_name || movie.origin_name === movie.name)) {
            setCurrentOriginName(data.movie.original_name);
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
            
            // Try to restore from watch history again now that NguonC has loaded!
            const history = getWatchHistory();
            const item = history.find(i => i.slug === movie.slug);
            let restored = false;

            if (item) {
              const targetServerName = item.serverName || 
                (item.currentServerIndex === 1 ? "NguonC" : 
                 item.currentServerIndex === 2 ? "Ophim" : 
                 item.currentServerIndex === 0 ? "PhimAPI" : undefined);
              if (targetServerName) {
                const sIdx = updated.findIndex(e => e.server_name === targetServerName || 
                               (targetServerName.startsWith("NguonC") && e.server_name.startsWith("NguonC")) ||
                               (targetServerName.startsWith("Ophim") && e.server_name.startsWith("Ophim")) ||
                               (targetServerName.startsWith("PhimAPI") && e.server_name.startsWith("PhimAPI")));
                if (sIdx !== -1) {
                  const sData = updated[sIdx].server_data || [];
                  const eIdx = item.episodeName ? sData.findIndex((ep: any) => ep.name === item.episodeName) : item.currentEpisodeIndex;
                  if (eIdx !== -1 && sData[eIdx]) {
                    setCurrentServerIndex(sIdx);
                    setSelectedServerIndex(sIdx);
                    setCurrentEpisodeIndex(eIdx);
                    restored = true;
                  }
                }
              }
            }

            // If we didn't restore NguonC from history, adjust the active playing server's index
            // so it doesn't shift due to sorting
            if (!restored) {
              const currentPlayingServerName = prev[currentServerIndex]?.server_name;
              if (currentPlayingServerName) {
                const newIdx = updated.findIndex(e => e.server_name === currentPlayingServerName);
                if (newIdx !== -1) {
                  setCurrentServerIndex(newIdx);
                  setSelectedServerIndex(newIdx);
                }
              } else {
                // Nếu chưa có server nào phát (prev rỗng), chọn server đầu tiên có sẵn trong danh sách đã xếp thứ tự ưu tiên
                if (updated.length > 0) {
                  setCurrentServerIndex(0);
                  setSelectedServerIndex(0);
                }
              }
            }
            return updated;
          });
        }
      } catch (error) {
        // Suppressed error log to keep UI/console cleaner
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
        let foundServerIdx = -1;
        let foundEpisodeIdx = -1;

        const targetServerName = item.serverName || 
          (item.currentServerIndex === 1 ? "NguonC" : 
           item.currentServerIndex === 2 ? "Ophim" : 
           item.currentServerIndex === 0 ? "PhimAPI" : undefined);

        if (targetServerName) {
          foundServerIdx = episodes.findIndex(e => e.server_name === targetServerName || 
                           (targetServerName.startsWith("NguonC") && e.server_name.startsWith("NguonC")) ||
                           (targetServerName.startsWith("Ophim") && e.server_name.startsWith("Ophim")) ||
                           (targetServerName.startsWith("PhimAPI") && e.server_name.startsWith("PhimAPI")));
        }

        if (foundServerIdx !== -1 && episodes[foundServerIdx]) {
          const sData = episodes[foundServerIdx].server_data || [];
          if (item.episodeName) {
            foundEpisodeIdx = sData.findIndex((ep: any) => ep.name === item.episodeName);
          } else {
            foundEpisodeIdx = item.currentEpisodeIndex;
          }
          
          if (foundEpisodeIdx !== -1 && sData[foundEpisodeIdx]) {
            setCurrentServerIndex(foundServerIdx);
            setSelectedServerIndex(foundServerIdx);
            setCurrentEpisodeIndex(foundEpisodeIdx);
          } else {
            setCurrentServerIndex(foundServerIdx);
            setSelectedServerIndex(foundServerIdx);
            setCurrentEpisodeIndex(0);
          }
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
    if (isRestored && currentEpisode && currentServer) {
      saveWatchHistory(
        movie,
        currentEpisode.name || `Tập ${currentEpisodeIndex + 1}`,
        currentServer.server_name,
        currentServerIndex,
        currentEpisodeIndex
      );
    }
  }, [movie, currentEpisode, currentServer, currentServerIndex, currentEpisodeIndex, isRestored]);

  const [playerMode, setPlayerMode] = useState<"hls" | "iframe">("hls");

  // Auto set player mode based on active server: default NguonC to iframe, others to HLS
  useEffect(() => {
    const currentServer = episodes[currentServerIndex];
    if (currentServer) {
      const isNguonC = currentServer.server_name.toLowerCase().includes("nguonc") || 
                       currentServer.server_name.toLowerCase().includes("nguồn c") ||
                       currentServer.server_name.toLowerCase().includes("nguon c");
      setPlayerMode(isNguonC ? "iframe" : "hls");
    }
  }, [currentServerIndex, episodes]);

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
          className="pointer-events-auto opacity-100 md:opacity-0 md:hover:opacity-100 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-md transition-all border border-white/10 shadow-lg hover:scale-105 active:scale-95 duration-300"
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
              key={`${currentServerIndex}-${currentEpisodeIndex}-${playerMode}`}
              poster=""
              videoUrl={playerMode === "hls" ? currentEpisode.link_m3u8 : undefined}
              embedUrl={currentEpisode.link_embed}
              onError={() => {
                if (playerMode === "hls" && currentEpisode.link_embed) {
                  setPlayerMode("iframe");
                }
              }}
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
          {currentOriginName && (
            <p className="text-lg text-zinc-400 mb-4">{currentOriginName}</p>
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
