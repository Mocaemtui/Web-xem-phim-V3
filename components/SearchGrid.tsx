"use client";

import { useState, useEffect, useMemo } from "react";
import MovieCardWrapper from "@/components/MovieCardWrapper";
import type { Movie } from "@/types/api";

interface SearchGridProps {
  initialMovies: Movie[];
  keyword: string;
}

export default function SearchGrid({ initialMovies, keyword }: SearchGridProps) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [isLoadingNguonC, setIsLoadingNguonC] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string>("all");

  useEffect(() => {
    let active = true;
    setMovies(initialMovies);
    setIsLoadingNguonC(true);
    const fetchNguonC = async () => {
      try {
        const res = await fetch(`https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(keyword)}`);
        if (!res.ok) {
          if (active) setIsLoadingNguonC(false);
          return;
        }
        const data = await res.json();
        
        if (active && data && data.items && Array.isArray(data.items)) {
          const newMovies: Movie[] = data.items.map((item: any) => ({
            _id: item.id || Math.random().toString(),
            name: item.name,
            slug: item.slug,
            origin_name: item.original_name || item.name,
            poster_url: item.poster_url,
            thumb_url: item.thumb_url,
            year: item.year || '',
            source: 'nguonc'
          } as any));
          
          if (newMovies.length > 0) {
            setMovies(prev => {
              const existingSlugs = new Set(prev.map(m => m.slug));
              const filteredNew = newMovies.filter(m => !existingSlugs.has(m.slug));
              return [...prev, ...filteredNew];
            });
          }
        }
      } catch (error) {
        console.error("Lỗi lấy NguonC Search (Client):", error);
      } finally {
        if (active) setIsLoadingNguonC(false);
      }
    };

    fetchNguonC();
    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, initialMovies]);

  // No smart default selection needed, always default to "all" as requested by user


  const filteredMovies = useMemo(() => {
    const getSmartKey = (item: Movie) => {
      const originName = item.origin_name || item.name || '';
      const normalizedOriginName = originName.toLowerCase().replace(/\s+/g, ' ').trim();
      return `${normalizedOriginName}-${item.year || 'unknown'}`;
    };

    // 1. Build maps of priority sources (Ophim, PhimAPI, NguonC)
    const ophimMap = new Map<string, Movie>();
    const phimapiMap = new Map<string, Movie>();
    const nguoncMap = new Map<string, Movie>();

    movies.forEach(movie => {
      const key = getSmartKey(movie);
      const source = (movie as any).source;
      if (source === 'ophim') {
        ophimMap.set(key, movie);
      } else if (source === 'phimapi') {
        phimapiMap.set(key, movie);
      } else if (source === 'nguonc') {
        nguoncMap.set(key, movie);
      }
    });

    // 2. Filter or Deduplicate based on selectedSource
    if (selectedSource === "all") {
      const itemsMap = new Map<string, Movie>();
      
      // Sort movies: 'phimapi' first, then 'ophim', then 'nguonc'
      const sortedMovies = [...movies].sort((a: any, b: any) => {
        const priority = { phimapi: 3, ophim: 2, nguonc: 1 } as any;
        const priorityA = priority[(a as any).source] || 0;
        const priorityB = priority[(b as any).source] || 0;
        return priorityB - priorityA;
      });

      sortedMovies.forEach(movie => {
        const key = getSmartKey(movie);
        if (!itemsMap.has(key)) {
          itemsMap.set(key, movie);
        }
      });

      return Array.from(itemsMap.values());
    } else {
      // Show all movies from that source directly without overriding metadata
      return movies.filter((movie: any) => (movie as any).source === selectedSource);
    }
  }, [movies, selectedSource]);

  const sourceFilters = [
    { id: "all", name: "Tất cả" },
    { id: "ophim", name: "Ophim" },
    { id: "phimapi", name: "PhimAPI" },
    { id: "nguonc", name: "NguonC" },
  ];

  if (filteredMovies.length === 0 && !isLoadingNguonC) {
    return (
      <div>
        {/* Source Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center sm:justify-start">
          {sourceFilters.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedSource(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border cursor-pointer ${
                selectedSource === tab.id
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
        <div className="text-center py-16">
          <p className="text-zinc-400 text-lg">
            Không tìm thấy phim nào từ nguồn này với từ khóa "{keyword}"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Source Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center sm:justify-start">
        {sourceFilters.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedSource(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border cursor-pointer ${
              selectedSource === tab.id
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredMovies.map((movie) => (
          <MovieCardWrapper key={`${(movie as any).source || 'default'}-${movie.slug || movie._id}`} movie={movie} />
        ))}
      </div>
      {isLoadingNguonC && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2 text-zinc-500">
            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm">Đang quét thêm nguồn backup...</span>
          </div>
        </div>
      )}
    </div>
  );
}
