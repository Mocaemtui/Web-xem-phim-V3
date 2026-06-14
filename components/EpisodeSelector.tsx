"use client";
import { useEffect, useState } from "react";

interface Episode {
  name: string;
  slug: string;
  filename: string;
  link: string;
  link_embed: string;
  link_m3u8: string;
}

interface Server {
  server_name: string;
  is_ai?: boolean;
  server_data: Episode[];
}

interface EpisodeSelectorProps {
  episodes: Server[];
  currentServerIndex: number;
  currentEpisodeIndex: number;
  onSelectEpisode: (episodeIndex: number) => void;
  onSelectServer: (serverIndex: number) => void;
}

export default function EpisodeSelector({ 
  episodes, 
  currentServerIndex, 
  currentEpisodeIndex,
  onSelectEpisode,
  onSelectServer 
}: EpisodeSelectorProps) {
  const serverData = episodes[currentServerIndex]?.server_data || [];
  const currentEpisode = serverData[currentEpisodeIndex];

  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<string>>(new Set());

  // Load watched history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("watched_episodes_v3");
      if (stored) {
        setWatchedEpisodes(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, []);

  // Mark current episode as watched
  useEffect(() => {
    if (!currentEpisode) return;
    const epKey = currentEpisode.link_m3u8 || currentEpisode.link_embed || currentEpisode.slug;
    if (!epKey) return;
    try {
      const stored = localStorage.getItem("watched_episodes_v3");
      const watched = stored ? JSON.parse(stored) : [];
      if (!watched.includes(epKey)) {
        watched.push(epKey);
        if (watched.length > 1000) watched.shift();
        localStorage.setItem("watched_episodes_v3", JSON.stringify(watched));
        setWatchedEpisodes(new Set(watched));
      }
    } catch {}
  }, [currentEpisode]);

  return (
    <div className="mb-8 relative z-20">
      <h3 className="text-lg font-semibold text-white mb-4">
        {serverData.length <= 1 ? "Server nguồn / Tập" : "Danh sách tập"}
      </h3>
      
      {/* Server Selection */}
      {episodes.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {episodes.map((server, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSelectServer(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentServerIndex === index
                    ? "bg-red-600 text-white shadow-md shadow-red-900/20"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {server.server_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Episode Selection - Show even for single episode (Phim lẻ) */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {serverData.map((episode, index) => {
          const epKey = episode.link_m3u8 || episode.link_embed || episode.slug;
          const isWatched = watchedEpisodes.has(epKey);
          return (
            <button
              key={`${episode.slug}-${index}`}
              type="button"
              onClick={() => onSelectEpisode(index)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
                currentEpisodeIndex === index
                  ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-900/20"
                  : isWatched
                    ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/20 hover:bg-emerald-900/40"
                    : "bg-zinc-800 text-zinc-300 border-zinc-700/50 hover:bg-zinc-700"
              }`}
            >
              {episode.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
