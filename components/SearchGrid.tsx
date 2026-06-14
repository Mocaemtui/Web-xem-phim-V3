"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import MovieCardWrapper from "@/components/MovieCardWrapper";
import type { Movie } from "@/types/api";

interface ExtendedMovie extends Movie {
  source?: string;
}

interface NguonCMovieItem {
  id: string;
  name: string;
  slug: string;
  original_name?: string;
  poster_url: string;
  thumb_url: string;
  year?: number;
  created?: string;
  modified?: string;
}

interface SearchGridProps {
  initialMovies: Movie[];
  keyword: string;
}

export default function SearchGrid({ initialMovies, keyword }: SearchGridProps) {
  const router = useRouter();
  
  const handleBack = () => {
    if (typeof window !== 'undefined') {
      const prevBrowse = sessionStorage.getItem("prev_browse_page");
      if (prevBrowse) {
        router.push(prevBrowse);
        return;
      }
    }
    router.push("/");
  };

  const [movies, setMovies] = useState<ExtendedMovie[]>(initialMovies);
  const [isLoadingNguonC, setIsLoadingNguonC] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string>("all");

  useEffect(() => {
    let active = true;
    const fetchNguonC = async () => {
      try {
        const res = await fetch(`https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(keyword)}&page=1`);
        if (!res.ok) {
          if (active) setIsLoadingNguonC(false);
          return;
        }
        const data = await res.json();
        
        if (active && data && data.items && Array.isArray(data.items)) {
          const allNguonCItems = [...data.items];
          const totalPages = data.paginate?.total_page || 1;
          
          if (totalPages > 1 && active) {
            const fetchPromises = [];
            const maxPagesToFetch = Math.min(totalPages, 10);
            for (let p = 2; p <= maxPagesToFetch; p++) {
              fetchPromises.push(
                fetch(`https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(keyword)}&page=${p}`)
                  .then(r => r.ok ? r.json() : null)
                  .then(pageData => pageData?.items || [])
                  .catch(() => [])
              );
            }
            const pagesResults = await Promise.all(fetchPromises);
            if (active) {
              pagesResults.forEach(items => {
                allNguonCItems.push(...items);
              });
            }
          }
          
          if (active) {
            // Sort by relevance score first, then by modified date descending
            const getRelevance = (movie: NguonCMovieItem) => {
              const kw = keyword.toLowerCase().trim();
              const name = (movie.name || '').toLowerCase();
              const orig = (movie.original_name || '').toLowerCase();
              
              if (name === kw || orig === kw) return 100;
              if (name.startsWith(kw) || orig.startsWith(kw)) return 80;
              if (name.includes(kw) || orig.includes(kw)) return 60;
              
              const tokens = kw.split(/\s+/);
              let matches = 0;
              tokens.forEach(t => {
                if (name.includes(t) || orig.includes(t)) matches++;
              });
              if (matches > 0) return (matches / tokens.length) * 40;
              
              return 0;
            };

            const sortedNguonC = [...allNguonCItems].sort((a, b) => {
              const scoreA = getRelevance(a);
              const scoreB = getRelevance(b);
              if (scoreA !== scoreB) return scoreB - scoreA;
              
              const timeA = a.modified ? new Date(a.modified).getTime() : 0;
              const timeB = b.modified ? new Date(b.modified).getTime() : 0;
              return timeB - timeA;
            });

            const newMovies: ExtendedMovie[] = sortedNguonC.map((item: NguonCMovieItem) => ({
              _id: item.id || Math.random().toString(),
              name: item.name,
              slug: item.slug,
              origin_name: item.original_name || item.name,
              poster_url: item.poster_url,
              thumb_url: item.thumb_url,
              year: item.year || (item.created ? new Date(item.created).getFullYear() : 2024),
              source: 'nguonc'
            }));
            
            if (newMovies.length > 0) {
              setMovies(prev => {
                const existingKeys = new Set(prev.map(m => `${m.source || 'default'}-${m.slug}`));
                const filteredNew = newMovies.filter(m => !existingKeys.has(`${m.source || 'default'}-${m.slug}`));
                return [...prev, ...filteredNew];
              });
            }
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
    const getSmartKey = (item: ExtendedMovie) => {
      const originName = item.origin_name || item.name || '';
      const normalizedOriginName = originName.toLowerCase().replace(/\s+/g, ' ').trim();
      return `${normalizedOriginName}`;
    };

    const getRelevance = (movie: ExtendedMovie) => {
      const kw = keyword.toLowerCase().trim();
      const name = (movie.name || '').toLowerCase();
      const orig = (movie.origin_name || '').toLowerCase();
      
      if (name === kw || orig === kw) return 100;
      if (name.startsWith(kw) || orig.startsWith(kw)) return 80;
      if (name.includes(kw) || orig.includes(kw)) return 60;
      
      const tokens = kw.split(/\s+/);
      let matches = 0;
      tokens.forEach(t => {
        if (name.includes(t) || orig.includes(t)) matches++;
      });
      if (matches > 0) return (matches / tokens.length) * 40;
      
      return 0;
    };

    const getModifiedTime = (movie: any): number => {
      if (!movie.modified) return 0;
      if (typeof movie.modified === 'string') {
        return new Date(movie.modified).getTime();
      }
      if (typeof movie.modified === 'object' && movie.modified.time) {
        return new Date(movie.modified.time).getTime();
      }
      return 0;
    };

    const getBaseName = (name: string, originalName: string): string => {
      const clean = (str: string) => {
        return str.toLowerCase()
          .replace(/(?:phần|season|ss|part|p\.?)\s*\d+/g, '')
          .replace(/\b[ivxldm]+\b/g, '') // Remove Roman numerals
          .replace(/\s*\(\s*\)/g, '')
          .replace(/[^a-z0-9]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };
      return `${clean(name)}-${clean(originalName)}`;
    };

    const extractPartNumber = (name: string, originalName: string): number => {
      const cleanStr = `${name} ${originalName}`.toLowerCase();
      
      const patterns = [
        /(?:phần|season|ss|part|p\.?)\s*(\d+)/,
        /\b(\d+)\s*(?:nd|rd|th|st)\s+(?:season|part)/,
        /\b(?:part|phần)\s*([ivxldm]+)\b/,
        /\b([ivxldm]+)$/
      ];
      
      const romanToDecimal = (roman: string): number => {
        const map: Record<string, number> = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
        let total = 0;
        for (let i = 0; i < roman.length; i++) {
          const current = map[roman[i]];
          const next = map[roman[i+1]];
          if (next && current < next) {
            total += next - current;
            i++;
          } else {
            total += current;
          }
        }
        return total;
      };

      for (const pattern of patterns) {
        const match = cleanStr.match(pattern);
        if (match && match[1]) {
          const val = match[1];
          if (/^[ivxldm]+$/.test(val)) {
            return romanToDecimal(val);
          }
          const num = parseInt(val, 10);
          if (!isNaN(num)) return num;
        }
      }
      
      return 1; // Default to part 1
    };

    const sortMovies = (list: ExtendedMovie[]) => {
      return [...list].sort((a, b) => {
        // 1. Sort by keyword relevance
        const scoreA = getRelevance(a);
        const scoreB = getRelevance(b);
        if (scoreA !== scoreB) return scoreB - scoreA;
        
        // 2. Group same franchises and sort by part/season number ascending (1 before 2)
        const baseA = getBaseName(a.name, a.origin_name || '');
        const baseB = getBaseName(b.name, b.origin_name || '');
        if (baseA === baseB) {
          const partA = extractPartNumber(a.name, a.origin_name || '');
          const partB = extractPartNumber(b.name, b.origin_name || '');
          if (partA !== partB) {
            return partA - partB;
          }
        }

        // 3. Sort by modified time descending (newest first)
        const timeA = getModifiedTime(a);
        const timeB = getModifiedTime(b);
        return timeB - timeA;
      });
    };

    // 1. Build a map of fallback images prioritizing PhimAPI > NguonC > Ophim
    const imageMap = new Map<string, { poster_url: string; thumb_url: string; source: string }>();
    
    // First, populate with Ophim images (lowest priority)
    movies.forEach(m => {
      if (m.source === 'ophim' && m.poster_url && m.thumb_url) {
        imageMap.set(getSmartKey(m), { poster_url: m.poster_url, thumb_url: m.thumb_url, source: 'ophim' });
      }
    });

    // Then, populate/overwrite with NguonC images (medium priority)
    movies.forEach(m => {
      if (m.source === 'nguonc' && m.poster_url && m.thumb_url) {
        imageMap.set(getSmartKey(m), { poster_url: m.poster_url, thumb_url: m.thumb_url, source: 'nguonc' });
      }
    });
    
    // Finally, populate/overwrite with PhimAPI images (highest priority)
    movies.forEach(m => {
      if (m.source === 'phimapi' && m.poster_url && m.thumb_url) {
        imageMap.set(getSmartKey(m), { poster_url: m.poster_url, thumb_url: m.thumb_url, source: 'phimapi' });
      }
    });

    // 2. Resolve movies (overwrite images with higher priority source if available)
    const resolvedMovies = movies.map(movie => {
      const key = getSmartKey(movie);
      const mappedImg = imageMap.get(key);
      if (mappedImg && movie.source !== mappedImg.source) {
        const getPriority = (src: string) => {
          if (src === 'phimapi') return 3;
          if (src === 'nguonc') return 2;
          if (src === 'ophim') return 1;
          return 0;
        };
        if (getPriority(mappedImg.source) > getPriority(movie.source || '')) {
          return {
            ...movie,
            poster_url: mappedImg.poster_url,
            thumb_url: mappedImg.thumb_url,
          };
        }
      }
      return movie;
    });

    // 3. Extract and sort movies for each source
    const phimapiMovies = resolvedMovies.filter(m => m.source === 'phimapi');
    const sortedNguonCMovies = sortMovies(resolvedMovies.filter(m => m.source === 'nguonc'));
    const ophimMovies = resolvedMovies.filter(m => m.source === 'ophim');

    // 4. Return results based on selectedSource
    if (selectedSource === "all") {
      // Group movies by source priority: phimapi (first) -> nguonc (second) -> ophim (third)
      const sortedGroupedMovies = [
        ...phimapiMovies,
        ...sortedNguonCMovies,
        ...ophimMovies
      ];

      // Deduplicate (first occurrence wins, which will be phimapi if available, then nguonc, then ophim)
      const itemsMap = new Map<string, ExtendedMovie>();
      sortedGroupedMovies.forEach(movie => {
        const key = getSmartKey(movie);
        if (!itemsMap.has(key)) {
          itemsMap.set(key, movie);
        }
      });

      return Array.from(itemsMap.values());
    } else if (selectedSource === "phimapi") {
      return phimapiMovies; // Original API relevance order
    } else if (selectedSource === "nguonc") {
      return sortedNguonCMovies; // Sorted by relevance + modified time
    } else if (selectedSource === "ophim") {
      return ophimMovies; // Original API relevance order (no sorting)
    } else {
      return resolvedMovies.filter((movie: ExtendedMovie) => movie.source === selectedSource);
    }
  }, [movies, selectedSource, keyword]);

  const sourceFilters = [
    { id: "all", name: "Tất cả" },
    { id: "phimapi", name: "PhimAPI" },
    { id: "nguonc", name: "NguonC" },
    { id: "ophim", name: "Ophim" },
  ];

  if (filteredMovies.length === 0 && !isLoadingNguonC) {
    return (
      <div>
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
          <MovieCardWrapper key={`${movie.source || 'default'}-${movie.slug || movie._id}`} movie={movie} />
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
