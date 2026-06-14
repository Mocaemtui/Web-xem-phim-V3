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

// Lấy ảnh dọc (Poster) - Ophim dùng thumb_url làm poster; PhimAPI dùng poster_url làm poster
export const getPosterUrl = (movie: { thumb_url?: string; poster_url?: string }): string => {
  const isPhimApi = movie.thumb_url?.includes('upload/') || movie.poster_url?.includes('upload/') || movie.thumb_url?.includes('phimimg.com') || movie.poster_url?.includes('phimimg.com');
  if (isPhimApi) {
    return resolveImgUrl(movie.poster_url || movie.thumb_url);
  }
  return resolveImgUrl(movie.thumb_url || movie.poster_url);
};

// Lấy ảnh ngang (Backdrop) - Ophim dùng poster_url làm backdrop; PhimAPI dùng thumb_url làm backdrop
export const getBackdropUrl = (movie: { thumb_url?: string; poster_url?: string }): string => {
  const isPhimApi = movie.thumb_url?.includes('upload/') || movie.poster_url?.includes('upload/') || movie.thumb_url?.includes('phimimg.com') || movie.poster_url?.includes('phimimg.com');
  if (isPhimApi) {
    return resolveImgUrl(movie.thumb_url || movie.poster_url);
  }
  return resolveImgUrl(movie.poster_url || movie.thumb_url);
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

export async function getPhimBo(
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<MovieListResponse> | null> {
  return fetchAPI<MovieListResponse>(
    `/v1/api/danh-sach/phim-bo?page=${page}&limit=${limit}`
  );
}

export async function getPhimLe(
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<MovieListResponse> | null> {
  return fetchAPI<MovieListResponse>(
    `/v1/api/danh-sach/phim-le?page=${page}&limit=${limit}`
  );
}

export async function getPhimViet(
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<MovieListResponse> | null> {
  return fetchAPI<MovieListResponse>(
    `/v1/api/danh-sach/phim-viet?page=${page}&limit=${limit}`
  );
}

export async function getPhimAuMy(
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<MovieListResponse> | null> {
  return fetchAPI<MovieListResponse>(
    `/v1/api/danh-sach/phim-au-my?page=${page}&limit=${limit}`
  );
}

export async function getPhimHan(
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<MovieListResponse> | null> {
  return fetchAPI<MovieListResponse>(
    `/v1/api/danh-sach/phim-han?page=${page}&limit=${limit}`
  );
}

export async function getPhimNhat(
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<MovieListResponse> | null> {
  return fetchAPI<MovieListResponse>(
    `/v1/api/danh-sach/phim-nhat?page=${page}&limit=${limit}`
  );
}

export async function getPhimTrung(
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<MovieListResponse> | null> {
  return fetchAPI<MovieListResponse>(
    `/v1/api/danh-sach/phim-trung?page=${page}&limit=${limit}`
  );
}

export async function searchPhim(
  keyword: string
): Promise<ApiResponse<MovieListResponse> | null> {
  const endpoint = `/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}`;
  
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
  const params = new URLSearchParams();
  params.append('keyword', keyword);
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


export async function getChiTietPhim(
  slug: string
): Promise<ApiResponse<{ item: MovieDetail }> | null> {
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
