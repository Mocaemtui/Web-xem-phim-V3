import type { Movie } from "@/types/api";

export interface WatchHistoryItem {
  slug: string;
  name: string;
  origin_name: string;
  poster_url: string;
  thumb_url: string;
  year: number;
  country?: string;
  time?: string;
  quality?: string;
  episodeName?: string;
  serverName?: string;
  currentServerIndex: number;
  currentEpisodeIndex: number;
  currentTime?: number;
  duration?: number;
  watchedAt: number; // timestamp
}

const STORAGE_KEY = "movie_watch_history";
const MAX_HISTORY = 50;

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let lastSyncTime = 0;
const MAX_SYNC_INTERVAL = 60000;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getWatchHistory(): WatchHistoryItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw) as WatchHistoryItem[];
    // Lọc bỏ các phim từ Nguồn C (vì đã bị gỡ bỏ khỏi hệ thống)
    const validItems = items.filter(item => {
      const isNguonC = 
        (item.poster_url && item.poster_url.includes('nguonc')) || 
        (item.thumb_url && item.thumb_url.includes('nguonc')) ||
        (item.serverName && item.serverName.toLowerCase().includes('nguonc'));
      return !isNguonC;
    });
    
    // Nếu có thay đổi do lọc, cập nhật lại storage
    if (validItems.length !== items.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validItems));
    }
    
    return validItems;
  } catch {
    return [];
  }
}

export function saveWatchHistory(
  movie: Pick<Movie, "slug" | "name" | "origin_name" | "poster_url" | "thumb_url" | "year" | "country" | "time" | "quality">,
  episodeName: string,
  serverName: string,
  currentServerIndex: number,
  currentEpisodeIndex: number,
  currentTime?: number,
  duration?: number
): void {
  if (!isBrowser()) return;
  try {
    const history = getWatchHistory();

    // Remove existing entry for this movie (to move it to front)
    const filtered = history.filter((item) => item.slug !== movie.slug);

    const newItem: WatchHistoryItem = {
      slug: movie.slug,
      name: movie.name,
      origin_name: movie.origin_name,
      poster_url: movie.poster_url,
      thumb_url: movie.thumb_url,
      year: movie.year,
      country: movie.country?.[0]?.name,
      time: movie.time,
      quality: movie.quality,
      episodeName,
      serverName,
      currentServerIndex,
      currentEpisodeIndex,
      currentTime,
      duration,
      watchedAt: Date.now(),
    };

    // Add to front, limit to MAX_HISTORY
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Background Cloud Sync (Lưu ngầm lên DB) - TEMPORARILY DISABLED
    // Áp dụng kỹ thuật Throttle (60s) + Debounce (10s) để chống spam Database
    /*
    const syncToCloud = () => {
      lastSyncTime = Date.now();
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movie, episodeName, serverName, currentServerIndex, currentEpisodeIndex, currentTime, duration })
      }).catch((err) => {
        console.error("History sync error:", err);
      });
    };

    const now = Date.now();
    if (now - lastSyncTime >= MAX_SYNC_INTERVAL) {
      if (syncTimeout) clearTimeout(syncTimeout);
      syncToCloud();
    } else {
      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(syncToCloud, 10000);
    }
    */
  } catch {
    // Silently fail if localStorage is full or unavailable
  }
}

export function removeFromHistory(slug: string): void {
  if (!isBrowser()) return;
  try {
    // 1. Xóa khỏi danh sách lịch sử phim
    const history = getWatchHistory();
    const filtered = history.filter((item) => item.slug !== slug);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    // 2. Xóa các tập đã xem của phim này khỏi danh sách "watched_episodes_v3"
    const watchedEpsRaw = localStorage.getItem("watched_episodes_v3");
    if (watchedEpsRaw) {
      const watchedEps = JSON.parse(watchedEpsRaw);
      if (Array.isArray(watchedEps)) {
        const cleanWatched = watchedEps.filter((epKey: string) => {
          if (!epKey) return false;
          return !epKey.toLowerCase().includes(slug.toLowerCase());
        });
        localStorage.setItem("watched_episodes_v3", JSON.stringify(cleanWatched));
      }
    }

    // 3. Xóa tiến trình thời gian xem của tất cả các tập phim thuộc phim này
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("playback_progress_") && key.toLowerCase().includes(slug.toLowerCase())) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Xóa ngầm trên Cloud
    fetch(`/api/history?slug=${slug}`, { method: "DELETE" }).catch(() => {});
  } catch {
    // Silently fail
  }
}

export function clearWatchHistory(): void {
  if (!isBrowser()) return;
  try {
    // 1. Xóa lịch sử phim
    localStorage.removeItem(STORAGE_KEY);

    // 2. Xóa danh sách các tập đã xem
    localStorage.removeItem("watched_episodes_v3");

    // 3. Xóa tất cả tiến trình phát video
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("playback_progress_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Xóa ngầm trên Cloud
    fetch(`/api/history?clearAll=true`, { method: "DELETE" }).catch(() => {});
  } catch {
    // Silently fail
  }
}
