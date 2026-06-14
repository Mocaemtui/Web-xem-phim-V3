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


interface WatchPageClientProps {
  movie: MovieDetail;
  posterUrl: string;
}

import { useRouter } from "next/navigation";

const getServerPriority = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("phimapi") || lower.includes("kkphim") || lower.includes("kk phim")) return 2;
  if (lower.includes("ophim")) return 1;
  return 0;
};

export default function WatchPageClient({ movie, posterUrl }: WatchPageClientProps) {
  const router = useRouter();
  
  const handleBack = () => {
    router.push(`/phim/${movie.slug}`);
  };

  const [episodes, setEpisodes] = useState(sortEpisodes(movie.episodes || []));

  
  const [currentServerIndex, setCurrentServerIndex] = useState(0);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(0);
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);
  const [isRestored, setIsRestored] = useState(false);
  const [currentOriginName, setCurrentOriginName] = useState(movie.origin_name);

  // Reset trạng thái khi chuyển phim mới
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsRestored(false);
    setCurrentEpisodeIndex(0);
    const sortedEps = sortEpisodes(movie.episodes || []);
    setEpisodes(sortedEps);
    // Luôn chọn server đầu tiên (đã sắp xếp theo thứ tự ưu tiên: PhimAPI > Ophim)
    // khi mở phim mới, trừ phi được phục hồi từ lịch sử xem của chính phim này.
    setCurrentServerIndex(0);
    setSelectedServerIndex(0);
    setCurrentOriginName(movie.origin_name);
  }, [movie.slug, movie.origin_name, movie.episodes]);



  useEffect(() => {
    if (!isRestored) {
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
          (item.currentServerIndex === 2 ? "Ophim" : 
           item.currentServerIndex === 0 ? "PhimAPI" : undefined);

        if (targetServerName) {
          foundServerIdx = episodes.findIndex(e => e.server_name === targetServerName || 
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
  }, [movie, isRestored, episodes]);

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
