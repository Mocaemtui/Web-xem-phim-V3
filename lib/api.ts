import type {
  ApiResponse,
  HomeData,
  MovieListResponse,
  MovieDetail,
  MovieImages,
  MoviePeoples,
  Genre,
  Country,
  Year,
  Movie,
} from "@/types/api";
import { MOVIE_SOURCES, PRIMARY_SOURCE } from "./sources";

const API_BASE_URL = PRIMARY_SOURCE.url;
const TMDB_API_BASE_URL = process.env.TMDB_API_BASE_URL || "https://api.themoviedb.org";

export async function fetchAPI<T>(
  endpoint: string,
  revalidate: number = 3600,
  customBaseUrl?: string
): Promise<ApiResponse<T> | null> {
  try {
    const baseUrl = customBaseUrl || API_BASE_URL;
    const hasQuery = endpoint.includes('?');
    const url = `${baseUrl}${endpoint}${hasQuery ? '&' : '?'}cb=1`;
    
    const options = {
      next: { revalidate },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    };

    let response = await fetch(url, options);

    // Fallback to Ophim if PhimAPI returns 404 or fails
    if (!response.ok && baseUrl === MOVIE_SOURCES.PHIMAPI.url) {
      const fallbackUrl = `${MOVIE_SOURCES.OPHIM.url}${endpoint}${hasQuery ? '&' : '?'}cb=1`;
      response = await fetch(fallbackUrl, options);
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // Check if API returns error status
    if (data.status === 'error' && baseUrl === MOVIE_SOURCES.PHIMAPI.url) {
      const fallbackUrl = `${MOVIE_SOURCES.OPHIM.url}${endpoint}${hasQuery ? '&' : '?'}cb=1`;
      const fallbackResponse = await fetch(fallbackUrl, options);
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.status !== 'error') return fallbackData;
      }
      return null;
    } else if (data.status === 'error') {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}

export async function getHome(): Promise<ApiResponse<HomeData> | null> {
  return fetchAPI<HomeData>("/v1/api/home");
}

export async function getPhimMoi(
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<MovieListResponse> | null> {
  if (PRIMARY_SOURCE.id === 'phimapi') {
    try {
      const res = await fetch(`https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=${page}&limit=${limit}`, {
        next: { revalidate: 3600 },
        headers: {
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === true) {
          return {
            status: "success",
            data: {
              items: data.items,
              params: {
                pagination: data.pagination
              }
            }
          } as any;
        }
      }
    } catch (e) {
      console.warn("PhimAPI getPhimMoi fetch failed:", e);
    }
  }

  // Fallback to standard V1 endpoint
  return fetchAPI<MovieListResponse>(
    `/v1/api/danh-sach/phim-moi-cap-nhat?page=${page}&limit=${limit}`
  );
}

// Hàm chuẩn hóa và tối ưu ảnh bằng WEBP converter của PhimAPI
export const resolveImgUrl = (url: string | undefined): string => {
  if (!url) return "";
  
  let finalUrl = "";
  if (url.startsWith('http')) {
    finalUrl = url;
  } else if (url.startsWith('upload/')) {
    finalUrl = `https://phimimg.com/${url}`;

  } else {
    const cleanOphimUrl = url.startsWith('movies/') ? url : `movies/${url}`;
    finalUrl = `https://img.ophim.live/uploads/${cleanOphimUrl}`;
  }

  // Tối ưu ảnh: Nếu là ảnh từ phimimg.com (KKPhim/PhimAPI), sử dụng image.php để lấy file WEBP
  if (finalUrl.includes('phimimg.com')) {
    return `https://phimapi.com/image.php?url=${finalUrl}`;
  }
  
  return finalUrl;
};

const DEFAULT_POSTER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%2318181b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2371717a" font-family="sans-serif" font-size="16">No Poster</text></svg>';

const DEFAULT_BACKDROP = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect width="800" height="450" fill="%2318181b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2371717a" font-family="sans-serif" font-size="24">No Image</text></svg>';

// Lấy ảnh dọc (Poster) - Ophim dùng thumb_url làm poster; PhimAPI dùng poster_url làm poster
export const getPosterUrl = (movie: { thumb_url?: string; poster_url?: string; source?: string }): string => {
  const isTmdb = movie.source === 'tmdb' || movie.thumb_url?.includes('tmdb.org') || movie.poster_url?.includes('tmdb.org');
  const isPhimApi = movie.thumb_url?.includes('upload/') || movie.poster_url?.includes('upload/') || movie.thumb_url?.includes('phimimg.com') || movie.poster_url?.includes('phimimg.com');
  const useCorrect = isPhimApi || isTmdb;
  const url = useCorrect
    ? resolveImgUrl(movie.poster_url || movie.thumb_url)
    : resolveImgUrl(movie.thumb_url || movie.poster_url);
  return url || DEFAULT_POSTER;
};

// Lấy ảnh ngang (Backdrop) - Ophim dùng poster_url làm backdrop; PhimAPI dùng thumb_url làm backdrop
export const getBackdropUrl = (movie: { thumb_url?: string; poster_url?: string; source?: string }): string => {
  const isTmdb = movie.source === 'tmdb' || movie.thumb_url?.includes('tmdb.org') || movie.poster_url?.includes('tmdb.org');
  const isPhimApi = movie.thumb_url?.includes('upload/') || movie.poster_url?.includes('upload/') || movie.thumb_url?.includes('phimimg.com') || movie.poster_url?.includes('phimimg.com');
  const useCorrect = isPhimApi || isTmdb;
  const url = useCorrect
    ? resolveImgUrl(movie.thumb_url || movie.poster_url)
    : resolveImgUrl(movie.poster_url || movie.thumb_url);
  return url || DEFAULT_BACKDROP;
};

export function sortEpisodes(eps: any[]): any[] {
  if (!eps) return [];
  const priority: Record<string, number> = {
    phimapi: 2,
    kkphim: 2,
    ophim: 1
  };
  
  return [...eps].sort((a, b) => {
    const getPriority = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes("phimapi") || lower.includes("kkphim") || lower.includes("kk phim")) return priority.phimapi;
      if (lower.includes("ophim")) return priority.ophim;
      return 0;
    };
    return getPriority(b.server_name) - getPriority(a.server_name);
  });
}


export async function searchPhim(
  keyword: string
): Promise<ApiResponse<MovieListResponse> | null> {
  const cleanKeyword = keyword.trim();
  const imdbMatch = cleanKeyword.match(/tt\d{7,10}/i);
  const isImdbId = !!imdbMatch;
  const imdbId = isImdbId ? imdbMatch[0].toLowerCase() : '';
  
  const searchKeyword = isImdbId ? imdbId : cleanKeyword;
  const endpoint = `/v1/api/tim-kiem?keyword=${encodeURIComponent(searchKeyword)}`;

  const [ophimRes, phimapiRes] = await Promise.all([
    fetchAPI<MovieListResponse>(endpoint, 60, MOVIE_SOURCES.OPHIM.url),
    fetchAPI<MovieListResponse>(endpoint, 60, MOVIE_SOURCES.PHIMAPI.url)
  ]);

  const allItems: Movie[] = [];

  const addItems = (res: any, sourceName: string) => {
    const processItem = (item: Movie) => {
      allItems.push({ ...item, source: sourceName } as any);
    };

    if (res?.data?.items) {
      res.data.items.forEach(processItem);
    } else if (res?.items) {
      res.items.forEach(processItem);
    }
  };

  addItems(phimapiRes, 'phimapi');
  addItems(ophimRes, 'ophim');

  if (allItems.length === 0) return null;

  return {
    status: "success",
    data: {
      items: allItems,
      params: {
        pagination: {
          totalItems: allItems.length,
          totalItemsPerPage: allItems.length,
          currentPage: 1,
          pageRanges: 1
        }
      }
    }
  };
}

export async function getTheLoai(): Promise<ApiResponse<{ items: Genre[] }> | null> {
  if (PRIMARY_SOURCE.id === 'phimapi') {
    try {
      const res = await fetch(`https://phimapi.com/the-loai`, { next: { revalidate: 86400 } });
      if (res.ok) {
        const items = await res.json();
        // Lọc bỏ danh mục Phim 18+
        const filteredItems = items.filter((item: Genre) => item.slug !== 'phim-18');
        return { status: "success", data: { items: filteredItems } } as any;
      }
    } catch (e) {
      console.error(e);
    }
  }
  return fetchAPI<{ items: Genre[] }>("/v1/api/the-loai", 86400);
}

export async function getQuocGia(): Promise<ApiResponse<{ items: Country[] }> | null> {
  if (PRIMARY_SOURCE.id === 'phimapi') {
    try {
      const res = await fetch(`https://phimapi.com/quoc-gia`, { next: { revalidate: 86400 } });
      if (res.ok) {
        const items = await res.json();
        return { status: "success", data: { items } } as any;
      }
    } catch (e) {
      console.error(e);
    }
  }
  return fetchAPI<{ items: Country[] }>("/v1/api/quoc-gia", 86400);
}

// Search with optional pagination
export async function searchPhimWithPagination(
  keyword: string,
  options: { page?: number; limit?: number } = {}
): Promise<ApiResponse<MovieListResponse> | null> {
  const cleanKeyword = keyword.trim();
  const imdbMatch = cleanKeyword.match(/tt\d{7,10}/i);
  const searchKeyword = imdbMatch ? imdbMatch[0].toLowerCase() : cleanKeyword;

  const params = new URLSearchParams();
  params.append('keyword', searchKeyword);
  if (options.page !== undefined) params.append('page', options.page.toString());
  if (options.limit !== undefined) params.append('limit', options.limit.toString());
  const endpoint = `/v1/api/tim-kiem?${params.toString()}`;
  // Tìm kiếm phân trang, cache 60 giây
  return fetchAPI<MovieListResponse>(endpoint, 60);
}

// Get category details with filters
export async function getTheLoaiDetails(
  slug: string,
  options: {
    page?: number;
    limit?: number;
    sort_field?: string;
    sort_type?: string;
    country?: string;
    year?: string;
  } = {}
): Promise<ApiResponse<MovieListResponse> | null> {
  const params = new URLSearchParams();
  if (options.page !== undefined) params.append('page', options.page.toString());
  if (options.limit !== undefined) params.append('limit', options.limit.toString());
  if (options.sort_field) params.append('sort_field', options.sort_field);
  if (options.sort_type) params.append('sort_type', options.sort_type);
  if (options.country) params.append('country', options.country);
  if (options.year) params.append('year', options.year);
  const endpoint = `/v1/api/the-loai/${slug}${params.toString() ? '?' + params.toString() : ''}`;
  return fetchAPI<MovieListResponse>(endpoint);
}

// Get country details with filters
export async function getQuocGiaDetails(
  slug: string,
  options: {
    page?: number;
    limit?: number;
    sort_field?: string;
    sort_type?: string;
    category?: string;
    year?: string;
  } = {}
): Promise<ApiResponse<MovieListResponse> | null> {
  const params = new URLSearchParams();
  if (options.page !== undefined) params.append('page', options.page.toString());
  if (options.limit !== undefined) params.append('limit', options.limit.toString());
  if (options.sort_field) params.append('sort_field', options.sort_field);
  if (options.sort_type) params.append('sort_type', options.sort_type);
  if (options.category) params.append('category', options.category);
  if (options.year) params.append('year', options.year);
  const endpoint = `/v1/api/quoc-gia/${slug}${params.toString() ? '?' + params.toString() : ''}`;
  return fetchAPI<MovieListResponse>(endpoint);
}

export async function getNamPhatHanh(): Promise<ApiResponse<{ items: Year[] }> | null> {
  // Danh sách năm phát hành cố định, cache 24 giờ
  return fetchAPI<{ items: Year[] }>("/v1/api/nam-phat-hanh", 86400);
}
export async function getDanhSach(
  slug: string,
  options: {
    page?: number;
    limit?: number;
    sort_field?: string;
    sort_type?: string;
    category?: string;
    country?: string;
    year?: string;
  } = {}
): Promise<ApiResponse<MovieListResponse> | null> {
  const params = new URLSearchParams();
  if (options.page !== undefined) params.append('page', options.page.toString());
  if (options.limit !== undefined) params.append('limit', options.limit.toString());
  if (options.sort_field) params.append('sort_field', options.sort_field);
  if (options.sort_type) params.append('sort_type', options.sort_type);
  if (options.category) params.append('category', options.category);
  if (options.country) params.append('country', options.country);
  if (options.year) params.append('year', options.year);
  const query = params.toString();
  const endpoint = `/v1/api/danh-sach/${slug}${query ? '?' + query : ''}`;
  return fetchAPI<MovieListResponse>(endpoint);
}


const animeMalCache: Record<string, Record<number, number>> = {};

const getMatchScore = (anime: any, query: string): number => {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const queryWords = clean(query).split(/\s+/).filter(w => w.length > 2);
  if (queryWords.length === 0) return 1.0;
  
  const titles = [
    anime.title,
    anime.title_english,
    anime.title_japanese,
    ...(anime.title_synonyms || [])
  ].filter(Boolean).map(t => clean(t));
  
  let maxScore = 0;
  for (const title of titles) {
    let matches = 0;
    for (const word of queryWords) {
      if (title.includes(word)) {
        matches++;
      }
    }
    const score = matches / queryWords.length;
    if (score > maxScore) {
      maxScore = score;
    }
  }
  return maxScore;
};

async function getAnimeMalIds(originalName: string, seasonCount: number): Promise<Record<number, number>> {
  const cacheKey = originalName.toLowerCase().trim();
  if (animeMalCache[cacheKey]) {
    return animeMalCache[cacheKey];
  }

  const malIds: Record<number, number> = {};

  // 1. Try AniList GraphQL API first (Fast, Stable, No Rate Limit timeouts)
  try {
    const query = `
      query ($search: String) {
        Page(page: 1, perPage: 15) {
          media(search: $search, type: ANIME, format_in: [TV, ONA]) {
            id
            idMal
            title {
              romaji
              english
            }
            startDate {
              year
            }
          }
        }
      }
    `;
    
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        variables: {
          search: originalName
        }
      }),
      next: { revalidate: 86400 }
    });
    
    if (response.ok) {
      const result = await response.json();
      const mediaList = result.data?.Page?.media || [];
      
      if (mediaList.length > 0) {
        const tvShows = mediaList.filter((item: any) => item.idMal !== null);
        
        tvShows.sort((a: any, b: any) => {
          const scoreA = getMatchScore({ title: a.title.romaji, title_english: a.title.english }, originalName);
          const scoreB = getMatchScore({ title: b.title.romaji, title_english: b.title.english }, originalName);
          if (Math.abs(scoreB - scoreA) > 0.01) {
            return scoreB - scoreA;
          }
          const yearA = a.startDate?.year || 0;
          const yearB = b.startDate?.year || 0;
          return yearA - yearB;
        });
        
        for (let s = 1; s <= seasonCount; s++) {
          const matchedAnime = tvShows[s - 1];
          if (matchedAnime) {
            malIds[s] = matchedAnime.idMal;
          }
        }
        
        if (Object.keys(malIds).length > 0) {
          animeMalCache[cacheKey] = malIds;
          return malIds;
        }
      }
    }
  } catch (e) {
    console.warn("AniList query error, falling back to Jikan:", e);
  }

  // 2. Fallback to Jikan API (Legacy)
  try {
    let attempt = 0;
    let res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(originalName)}&limit=15`);
    
    while (res.status === 429 && attempt < 2) {
      attempt++;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(originalName)}&limit=15`);
    }

    if (!res.ok) return malIds;
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      let tvShows = data.data.filter((item: any) => {
        const isCorrectType = item.type === "TV" || item.type === "ONA" || item.type === "TV Special";
        const score = getMatchScore(item, originalName);
        return isCorrectType && score >= 0.15;
      });
      
      if (tvShows.length === 0) {
        tvShows = data.data;
      }
      
      tvShows.sort((a: any, b: any) => {
        const scoreA = getMatchScore(a, originalName);
        const scoreB = getMatchScore(b, originalName);
        if (Math.abs(scoreB - scoreA) > 0.01) {
          return scoreB - scoreA;
        }
        const dateA = a.aired?.from ? new Date(a.aired.from).getTime() : 0;
        const dateB = b.aired?.from ? new Date(b.aired.from).getTime() : 0;
        return dateA - dateB;
      });
      
      for (let s = 1; s <= seasonCount; s++) {
        const matchedAnime = tvShows[s - 1];
        if (matchedAnime) {
          malIds[s] = matchedAnime.mal_id;
        }
      }
      animeMalCache[cacheKey] = malIds;
    }
  } catch (e) {
    console.warn("getAnimeMalIds Jikan fallback error:", e);
  }
  return malIds;
}

export async function getChiTietPhim(
  slug: string
): Promise<ApiResponse<{ item: MovieDetail }> | null> {
  const tmdbKey = process.env.TMDB_API_KEY;
  if (slug.startsWith("tmdb-") && tmdbKey) {
    const parts = slug.split("-");
    const mediaType = parts[1]; // 'tv' or 'movie'
    const tmdbId = parts[2];
    
    try {
      const url = `${TMDB_API_BASE_URL}/3/${mediaType}/${tmdbId}?api_key=${tmdbKey}&language=vi-VN`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      
      const title = data.name || data.title;
      const originTitle = data.original_name || data.original_title;
      
      const categoryList = data.genres?.map((g: any) => ({
        id: g.id.toString(),
        name: g.name,
        slug: g.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
      })) || [];
      
      const countryList = data.production_countries?.map((c: any) => ({
        id: c.iso_3166_1.toLowerCase(),
        name: c.name,
        slug: c.iso_3166_1.toLowerCase()
      })) || [];

      const primaryColor = "B20710"; // theme-primary red
      const secondaryColor = "170000";
      const iconColor = "B20710";
      const icons = "vid";
      
      const isAnime = data.genres?.some((g: any) => g.id === 16 || g.name?.toLowerCase().includes("hoạt hình") || g.name?.toLowerCase().includes("animation")) && 
                      (data.original_language === 'ja' || data.origin_country?.includes('JP'));

      let animeMalIds: Record<number, number> = {};
      if (isAnime && mediaType === 'tv') {
        animeMalIds = await getAnimeMalIds(originTitle || title, data.seasons?.length || 1);
      }

      const serverEpisodes: any[] = [];
      
      if (mediaType === 'movie') {
        serverEpisodes.push({
          server_name: "Server Quốc tế (VidLink)",
          server_data: [{
            name: "Full",
            slug: "full",
            filename: "Full",
            link: "",
            link_embed: `https://vidlink.pro/movie/${tmdbId}?primaryColor=${primaryColor}&secondaryColor=${secondaryColor}&iconColor=${iconColor}&icons=${icons}&autoplay=false`,
            link_m3u8: ""
          }]
        });
      } else {
        if (data.seasons && data.seasons.length > 0) {
          data.seasons.forEach((season: any) => {
            if (season.season_number > 0 && season.episode_count > 0) {
              const seasonNum = season.season_number;
              const malId = animeMalIds[seasonNum];
              
              if (malId) {
                // Server Quốc tế Anime (MAL-based)
                const anime_server_data = Array.from({ length: season.episode_count }, (_, idx) => {
                  const epNum = idx + 1;
                  return {
                    name: `Tập ${epNum}`,
                    slug: `tap-${epNum}`,
                    filename: `Tập ${epNum}`,
                    link: "",
                    link_embed: `https://vidlink.pro/anime/${malId}/${epNum}/sub?fallback=true&primaryColor=${primaryColor}&secondaryColor=${secondaryColor}&iconColor=${iconColor}&icons=${icons}&autoplay=false`,
                    link_m3u8: ""
                  };
                });
                serverEpisodes.push({
                  server_name: `Mùa ${seasonNum} (VidLink Anime)`,
                  server_data: anime_server_data
                });
              }

              // Server Quốc tế TV (TMDB-based)
              const tv_server_data = Array.from({ length: season.episode_count }, (_, idx) => {
                const epNum = idx + 1;
                return {
                  name: `Tập ${epNum}`,
                  slug: `tap-${epNum}`,
                  filename: `Tập ${epNum}`,
                  link: "",
                  link_embed: `https://vidlink.pro/tv/${tmdbId}/${seasonNum}/${epNum}?primaryColor=${primaryColor}&secondaryColor=${secondaryColor}&iconColor=${iconColor}&icons=${icons}&autoplay=false`,
                  link_m3u8: ""
                };
              });
              serverEpisodes.push({
                server_name: `Mùa ${seasonNum} (VidLink)`,
                server_data: tv_server_data
              });
            }
          });
        }
      }

      const movieDetail: MovieDetail = {
        _id: slug,
        name: title,
        slug: slug,
        origin_name: originTitle || title,
        poster_url: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : "",
        thumb_url: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : "",
        year: data.first_air_date || data.release_date ? new Date(data.first_air_date || data.release_date).getFullYear() : 2024,
        quality: "HD",
        lang: "Vietsub/Mutilsub",
        time: data.episode_run_time ? `${data.episode_run_time[0] || ""} phút` : (data.runtime ? `${data.runtime} phút` : ""),
        episode_current: mediaType === 'movie' ? "Full" : `Hoàn tất (${data.number_of_episodes || 0} tập)`,
        episode_total: mediaType === 'movie' ? "1" : (data.number_of_episodes?.toString() || ""),
        content: data.overview || "Chưa có tóm tắt tiếng Việt cho phim này.",
        category: categoryList,
        country: countryList,
        director: [],
        actor: [],
        episodes: serverEpisodes,
        tmdb: {
          type: mediaType,
          id: parseInt(tmdbId, 10),
          vote_average: data.vote_average || 0,
          vote_count: data.vote_count || 0
        }
      };
      
      return {
        status: "success",
        data: { item: movieDetail }
      };
    } catch (e) {
      console.error("TMDB getChiTietPhim error:", e);
      return null;
    }
  }

  const normalizeCompare = (s1: string | undefined, s2: string | undefined): boolean => {
    if (!s1 || !s2) return false;
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    return clean(s1) === clean(s2);
  };

  let [ophimRes, phimapiRes] = await Promise.all([
    fetchAPI<{ item: MovieDetail }>(`/v1/api/phim/${slug}`, 86400, MOVIE_SOURCES.OPHIM.url),
    fetchAPI<{ item: MovieDetail }>(`/v1/api/phim/${slug}`, 86400, MOVIE_SOURCES.PHIMAPI.url)
  ]);

  let baseMovie: MovieDetail | null = phimapiRes?.data?.item || ophimRes?.data?.item || null;

  // --- SMART CROSS-API MATCHING (FALLBACK) ---
  if (baseMovie) {
    const originName = baseMovie.origin_name || baseMovie.name;
    const movieName = baseMovie.name;
    
    if ((!ophimRes?.data?.item || !phimapiRes?.data?.item) && originName) {
      // Step 1: Parallelize searches
      const [searchOphim, searchPhimapi] = await Promise.all([
        !ophimRes?.data?.item 
          ? fetchAPI<MovieListResponse>(`/v1/api/tim-kiem?keyword=${encodeURIComponent(originName)}`, 60, MOVIE_SOURCES.OPHIM.url) 
          : Promise.resolve(null),
        !phimapiRes?.data?.item 
          ? fetchAPI<MovieListResponse>(`/v1/api/tim-kiem?keyword=${encodeURIComponent(originName)}`, 60, MOVIE_SOURCES.PHIMAPI.url) 
          : Promise.resolve(null)
      ]);

      let fetchOphimPromise: Promise<ApiResponse<{ item: MovieDetail }> | null> | null = null;
      let fetchPhimapiPromise: Promise<ApiResponse<{ item: MovieDetail }> | null> | null = null;

      if (searchOphim?.data?.items) {
        const match = searchOphim.data.items.find(m => 
          normalizeCompare(m.origin_name, originName) || 
          normalizeCompare(m.name, originName) ||
          normalizeCompare(m.origin_name, movieName) ||
          normalizeCompare(m.name, movieName)
        );
        if (match && match.slug !== slug) {
          fetchOphimPromise = fetchAPI<{ item: MovieDetail }>(`/v1/api/phim/${match.slug}`, 86400, MOVIE_SOURCES.OPHIM.url);
        }
      }

      if (searchPhimapi?.data?.items) {
        const match = searchPhimapi.data.items.find(m => 
          normalizeCompare(m.origin_name, originName) || 
          normalizeCompare(m.name, originName) ||
          normalizeCompare(m.origin_name, movieName) ||
          normalizeCompare(m.name, movieName)
        );
        if (match && match.slug !== slug) {
          fetchPhimapiPromise = fetchAPI<{ item: MovieDetail }>(`/v1/api/phim/${match.slug}`, 86400, MOVIE_SOURCES.PHIMAPI.url);
        }
      }

      // Step 2: Parallelize detail fetches
      if (fetchOphimPromise || fetchPhimapiPromise) {
        const [fallbackOphim, fallbackPhimapi] = await Promise.all([
          fetchOphimPromise || Promise.resolve(null),
          fetchPhimapiPromise || Promise.resolve(null)
        ]);
        
        if (fallbackOphim?.data?.item) ophimRes = fallbackOphim;
        if (fallbackPhimapi?.data?.item) phimapiRes = fallbackPhimapi;
      }
    }
  }
  // -------------------------------------------

  const allEpisodes: any[] = [];

  if (phimapiRes?.data?.item) {
    allEpisodes.push(...(phimapiRes.data.item.episodes?.map(e => ({ ...e, server_name: `PhimAPI - ${e.server_name}` })) || []));
  }

  if (ophimRes?.data?.item) {
    allEpisodes.push(...(ophimRes.data.item.episodes?.map(e => ({ ...e, server_name: `Ophim - ${e.server_name}` })) || []));
  }

  // Re-evaluate baseMovie based on priority: PhimAPI > Ophim
  baseMovie = phimapiRes?.data?.item || ophimRes?.data?.item || null;

  if (!baseMovie) return null;

  // Inject Server Quốc tế (VidLink) if TMDB ID is available on the domestic movie
  if (baseMovie.tmdb?.id) {
    const tmdbId = baseMovie.tmdb.id.toString();
    const mediaType = baseMovie.tmdb.type || 'movie';
    const isTv = mediaType === 'tv' || (baseMovie.episodes?.[0]?.server_data?.length || 0) > 1;
    
    const primaryColor = "B20710";
    const secondaryColor = "170000";
    const iconColor = "B20710";
    const icons = "vid";
    
    const hasJapan = baseMovie.country?.some(c => c.name?.toLowerCase().includes('nhật') || c.slug === 'nhat-ban') || false;
    const isAnime = (baseMovie.type === 'hoathinh' || 
                    baseMovie.category?.some(c => c.name?.toLowerCase().includes('hoạt hình') || c.name?.toLowerCase().includes('anime')) || false) && hasJapan;
    
    if (!isTv) {
      // Movie
      const vidLinkServerData = [{
        name: "Full",
        slug: "full",
        filename: "Full",
        link: "",
        link_embed: `https://vidlink.pro/movie/${tmdbId}?primaryColor=${primaryColor}&secondaryColor=${secondaryColor}&iconColor=${iconColor}&icons=${icons}&autoplay=false`,
        link_m3u8: ""
      }];
      allEpisodes.push({
        server_name: "Server Quốc tế (VidLink)",
        server_data: vidLinkServerData
      });
    } else {
      // TV Show - use the first available domestic server to get base episode names
      const baseServer = baseMovie.episodes?.[0] || (phimapiRes?.data?.item?.episodes?.[0] || ophimRes?.data?.item?.episodes?.[0]);
      if (baseServer && baseServer.server_data) {
        const seasonNum = baseMovie.tmdb.season || 1;
        let malId: number | undefined = undefined;
        
        if (isAnime) {
          const originTitle = baseMovie.origin_name || baseMovie.name;
          const animeMalIds = await getAnimeMalIds(originTitle, seasonNum);
          malId = animeMalIds[seasonNum];
        }
        
        if (malId) {
          const animeServerData = baseServer.server_data.map((ep: any, idx: number) => {
            const epNum = idx + 1;
            return {
              name: ep.name,
              slug: ep.slug,
              filename: ep.name,
              link: "",
              link_embed: `https://vidlink.pro/anime/${malId}/${epNum}/sub?fallback=true&primaryColor=${primaryColor}&secondaryColor=${secondaryColor}&iconColor=${iconColor}&icons=${icons}&autoplay=false`,
              link_m3u8: ""
            };
          });
          allEpisodes.push({
            server_name: "Server Quốc tế (VidLink Anime)",
            server_data: animeServerData
          });
        }

        const tvServerData = baseServer.server_data.map((ep: any, idx: number) => {
          const epNum = idx + 1;
          return {
            name: ep.name,
            slug: ep.slug,
            filename: ep.name,
            link: "",
            link_embed: `https://vidlink.pro/tv/${tmdbId}/${seasonNum}/${epNum}?primaryColor=${primaryColor}&secondaryColor=${secondaryColor}&iconColor=${iconColor}&icons=${icons}&autoplay=false`,
            link_m3u8: ""
          };
        });
        allEpisodes.push({
          server_name: "Server Quốc tế (VidLink)",
          server_data: tvServerData
        });
      }
    }
  }

  // Swap primary and alternate images to prioritize PhimAPI > Ophim
  if (phimapiRes?.data?.item) {
    if (baseMovie !== phimapiRes.data.item) {
      // Save original images as alternates
      baseMovie.alt_poster_url = baseMovie.poster_url;
      baseMovie.alt_thumb_url = baseMovie.thumb_url;
      
      // Set PhimAPI's images as primary
      baseMovie.poster_url = phimapiRes.data.item.poster_url;
      baseMovie.thumb_url = phimapiRes.data.item.thumb_url;
    } else {
      if (ophimRes?.data?.item) {
        baseMovie.alt_poster_url = ophimRes.data.item.poster_url;
        baseMovie.alt_thumb_url = ophimRes.data.item.thumb_url;
      }
    }
  } else if (ophimRes?.data?.item) {
    if (baseMovie !== ophimRes.data.item) {
      baseMovie.alt_poster_url = baseMovie.poster_url;
      baseMovie.alt_thumb_url = baseMovie.thumb_url;
      baseMovie.poster_url = ophimRes.data.item.poster_url;
      baseMovie.thumb_url = ophimRes.data.item.thumb_url;
    }
  }

  baseMovie.episodes = sortEpisodes(allEpisodes);

  return {
    status: "success",
    data: { item: baseMovie }
  };
}

export async function getHinhAnhPhim(
  slug: string
): Promise<ApiResponse<MovieImages> | null> {
  // Hình ảnh phim phụ trợ, cache 24 giờ
  return fetchAPI<MovieImages>(`/v1/api/phim/${slug}/images`, 86400);
}

export async function getPeoplesPhim(
  slug: string
): Promise<ApiResponse<MoviePeoples> | null> {
  // Diễn viên/Đạo diễn, cache 24 giờ
  return fetchAPI<MoviePeoples>(`/v1/api/phim/${slug}/peoples`, 86400);
}

export async function getPhimByTheLoai(
  slug: string,
  page: number = 1,
  limit: number = 24
): Promise<ApiResponse<MovieListResponse> | null> {
  return fetchAPI<MovieListResponse>(
    `/v1/api/the-loai/${slug}?page=${page}&limit=${limit}`
  );
}

export async function getPhimByQuocGia(
  slug: string,
  page: number = 1,
  limit: number = 24
): Promise<ApiResponse<MovieListResponse> | null> {
  return fetchAPI<MovieListResponse>(
    `/v1/api/quoc-gia/${slug}?page=${page}&limit=${limit}`
  );
}

export async function getPhimByNam(
  year: number,
  page: number = 1,
  limit: number = 24
): Promise<ApiResponse<MovieListResponse> | null> {
  return fetchAPI<MovieListResponse>(
    `/v1/api/nam-phat-hanh/${year}?page=${page}&limit=${limit}`
  );
}

// Get movies by release year with filters
export async function getNamPhatHanhDetails(
  year: number,
  options: {
    page?: number;
    limit?: number;
    sort_field?: string;
    sort_type?: string;
    category?: string;
    country?: string;
  } = {}
): Promise<ApiResponse<MovieListResponse> | null> {
  const params = new URLSearchParams();
  if (options.page !== undefined) params.append('page', options.page.toString());
  if (options.limit !== undefined) params.append('limit', options.limit.toString());
  if (options.sort_field) params.append('sort_field', options.sort_field);
  if (options.sort_type) params.append('sort_type', options.sort_type);
  if (options.category) params.append('category', options.category);
  if (options.country) params.append('country', options.country);
  const query = params.toString();
  const endpoint = `/v1/api/nam-phat-hanh/${year}${query ? '?' + query : ''}`;
  return fetchAPI<MovieListResponse>(endpoint);
}

// Helper function to get TMDB poster URL for a movie
export async function getMoviePosterUrl(slug: string): Promise<string | null> {
  const imagesData = await fetchAPI<MovieImages>(`/v1/api/phim/${slug}/images`);
  if (!imagesData?.data) return null;

  const poster = imagesData.data.images?.find(img => img.type === 'poster')?.file_path;
  const baseUrl = imagesData.data.image_sizes?.poster?.w500;

  return poster && baseUrl ? `${baseUrl}${poster}` : null;
}
