'use client';

import { useState, useEffect } from 'react';
import MovieSlider from "@/components/MovieSlider";
import SectionTitle from "@/components/SectionTitle";
import HomeHistorySection from "@/components/HomeHistorySection";
import HeroBanner from "@/components/HeroBanner";
import { getPhimMoi, getDanhSach, getQuocGiaDetails } from "@/lib/api";

// Hardcoded fallback data để đảm bảo trang luôn hiển thị
const FALLBACK_MOVIES = [
  {
    _id: "1",
    name: "Doraemon: Nobita và Chuyến Thám Hiểm Nam Cực Kachi Kochi",
    slug: "doraemon-nobita-va-chuyen-tham-hiem-nam-cuc-kachi-kochi",
    origin_name: "Doraemon: Nobita's Earthling Symphony",
    poster_url: "https://img.ophim.live/uploads/movies/uploads/movies/20240803/doraemon-nobita-va-chuyen-tham-hiem-nam-cuc-kachi-kochi-poster.webp",
    thumb_url: "https://img.ophim.live/uploads/movies/uploads/movies/20240803/doraemon-nobita-va-chuyen-tham-hiem-nam-cuc-kachi-kochi-thumb.webp",
    year: 2024,
    type: "single",
    category: [{ id: "1", name: "Hoạt Hình", slug: "hoat-hinh" }],
    country: [{ id: "1", name: "Nhật Bản", slug: "nhat-ban" }],
    episode_current: "Full",
    episode_total: "1",
    quality: "HD",
    lang: "Vietsub"
  },
  {
    _id: "2", 
    name: "One Piece Film Red",
    slug: "one-piece-film-red",
    origin_name: "One Piece Film: Red",
    poster_url: "https://img.ophim.live/uploads/movies/uploads/movies/20240803/one-piece-film-red-poster.webp",
    thumb_url: "https://img.ophim.live/uploads/movies/uploads/movies/20240803/one-piece-film-red-thumb.webp",
    year: 2022,
    type: "single",
    category: [{ id: "1", name: "Hoạt Hình", slug: "hoat-hinh" }],
    country: [{ id: "1", name: "Nhật Bản", slug: "nhat-ban" }],
    episode_current: "Full",
    episode_total: "1",
    quality: "HD",
    lang: "Vietsub"
  },
  {
    _id: "3",
    name: "Demon Slayer: Kimetsu no Yaiba - Swordsmith Village Arc",
    slug: "demon-slayer-kimetsu-no-yaiba-swordsmith-village-arc",
    origin_name: "Demon Slayer: Kimetsu no Yaiba - Swordsmith Village Arc",
    poster_url: "https://img.ophim.live/uploads/movies/uploads/movies/20240803/demon-slayer-kimetsu-no-yaiba-swordsmith-village-arc-poster.webp",
    thumb_url: "https://img.ophim.live/uploads/movies/uploads/movies/20240803/demon-slayer-kimetsu-no-yaiba-swordsmith-village-arc-thumb.webp",
    year: 2023,
    type: "series",
    category: [{ id: "1", name: "Hoạt Hình", slug: "hoat-hinh" }],
    country: [{ id: "1", name: "Nhật Bản", slug: "nhat-ban" }],
    episode_current: "11/11",
    episode_total: "11",
    quality: "HD",
    lang: "Vietsub"
  },
  {
    _id: "4",
    name: "Jujutsu Kaisen Season 2",
    slug: "jujutsu-kaisen-season-2",
    origin_name: "Jujutsu Kaisen Season 2",
    poster_url: "https://img.ophim.live/uploads/movies/uploads/movies/20240803/jujutsu-kaisen-season-2-poster.webp",
    thumb_url: "https://img.ophim.live/uploads/movies/uploads/movies/20240803/jujutsu-kaisen-season-2-thumb.webp",
    year: 2023,
    type: "series",
    category: [{ id: "1", name: "Hoạt Hình", slug: "hoat-hinh" }],
    country: [{ id: "1", name: "Nhật Bản", slug: "nhat-ban" }],
    episode_current: "23/23",
    episode_total: "23",
    quality: "HD",
    lang: "Vietsub"
  },
  {
    _id: "5",
    name: "Spy x Family Season 2",
    slug: "spy-x-family-season-2",
    origin_name: "Spy x Family Season 2",
    poster_url: "https://img.ophim.live/uploads/movies/uploads/movies/20240803/spy-x-family-season-2-poster.webp",
    thumb_url: "https://img.ophim.live/uploads/movies/uploads/movies/20240803/spy-x-family-season-2-thumb.webp",
    year: 2023,
    type: "series",
    category: [{ id: "1", name: "Hoạt Hình", slug: "hoat-hinh" }],
    country: [{ id: "1", name: "Nhật Bản", slug: "nhat-ban" }],
    episode_current: "12/12",
    episode_total: "12",
    quality: "HD",
    lang: "Vietsub"
  },
  {
    _id: "6",
    name: "Bleach: Thousand-Year Blood War",
    slug: "bleach-thousand-year-blood-war",
    origin_name: "Bleach: Thousand-Year Blood War",
    poster_url: "https://img.ophim.live/uploads/movies/uploads/movies/20240803/bleach-thousand-year-blood-war-poster.webp",
    thumb_url: "https://img.ophim.live/uploads/movies/uploads/movies/20240803/bleach-thousand-year-blood-war-thumb.webp",
    year: 2022,
    type: "series",
    category: [{ id: "1", name: "Hoạt Hình", slug: "hoat-hinh" }],
    country: [{ id: "1", name: "Nhật Bản", slug: "nhat-ban" }],
    episode_current: "13/26",
    episode_total: "26",
    quality: "HD",
    lang: "Vietsub"
  }
];

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({
    phimMoiData: null,
    bannerHoatHinhData: null,
    phimVietData: null,
    phimAuMyData: null,
    phimHanData: null,
    phimNhatData: null,
    phimTrungData: null,
    animeData: null,
    cartoonData: null,
    longTiengData: null,
    thuyetMinhData: null,
    tvShowsData: null,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('[Home Client] Starting data fetch...');
        setLoading(true);
        setError(null);

        // Try API calls with fallback to hardcoded data
        let phimMoiData;
        try {
          phimMoiData = await getPhimMoi(1, 30);
          console.log('[Home Client] phimMoiData API success');
        } catch (apiError) {
          console.warn('[Home Client] phimMoiData API failed, using fallback:', apiError);
          phimMoiData = { data: { items: FALLBACK_MOVIES } };
        }

        // Try other APIs but don't fail if they error
        let bannerHoatHinhData, phimVietData, phimAuMyData, phimHanData, phimNhatData, phimTrungData, animeData, cartoonData, longTiengData, thuyetMinhData, tvShowsData;
        
        try {
          const results = await Promise.allSettled([
            getDanhSach("hoat-hinh", { page: 1, limit: 50 }),
            getQuocGiaDetails("viet-nam", { page: 1, limit: 12 }),
            getQuocGiaDetails("au-my", { page: 1, limit: 12 }),
            getQuocGiaDetails("han-quoc", { page: 1, limit: 12 }),
            getQuocGiaDetails("nhat-ban", { page: 1, limit: 12 }),
            getQuocGiaDetails("trung-quoc", { page: 1, limit: 12 }),
            getDanhSach("hoat-hinh", { page: 1, limit: 12, country: "nhat-ban" }),
            getDanhSach("hoat-hinh", { page: 1, limit: 30, country: "au-my" }),
            getDanhSach("phim-long-tieng", { page: 1, limit: 12 }),
            getDanhSach("phim-thuyet-minh", { page: 1, limit: 12 }),
            getDanhSach("tv-shows", { page: 1, limit: 12 }),
          ]);

          bannerHoatHinhData = results[0].status === 'fulfilled' ? results[0].value : null;
          phimVietData = results[1].status === 'fulfilled' ? results[1].value : null;
          phimAuMyData = results[2].status === 'fulfilled' ? results[2].value : null;
          phimHanData = results[3].status === 'fulfilled' ? results[3].value : null;
          phimNhatData = results[4].status === 'fulfilled' ? results[4].value : null;
          phimTrungData = results[5].status === 'fulfilled' ? results[5].value : null;
          animeData = results[6].status === 'fulfilled' ? results[6].value : null;
          cartoonData = results[7].status === 'fulfilled' ? results[7].value : null;
          longTiengData = results[8].status === 'fulfilled' ? results[8].value : null;
          thuyetMinhData = results[9].status === 'fulfilled' ? results[9].value : null;
          tvShowsData = results[10].status === 'fulfilled' ? results[10].value : null;
        } catch (secondaryError) {
          console.warn('[Home Client] Secondary APIs failed, using fallbacks:', secondaryError);
          // Use fallback data for all sections
          bannerHoatHinhData = { data: { items: FALLBACK_MOVIES } };
          phimVietData = { data: { items: FALLBACK_MOVIES.slice(0, 3) } };
          phimAuMyData = { data: { items: FALLBACK_MOVIES.slice(0, 3) } };
          phimHanData = { data: { items: FALLBACK_MOVIES.slice(0, 3) } };
          phimNhatData = { data: { items: FALLBACK_MOVIES.slice(0, 3) } };
          phimTrungData = { data: { items: FALLBACK_MOVIES.slice(0, 3) } };
          animeData = { data: { items: FALLBACK_MOVIES.slice(0, 3) } };
          cartoonData = { data: { items: FALLBACK_MOVIES.slice(0, 3) } };
          longTiengData = { data: { items: FALLBACK_MOVIES.slice(0, 3) } };
          thuyetMinhData = { data: { items: FALLBACK_MOVIES.slice(0, 3) } };
          tvShowsData = { data: { items: FALLBACK_MOVIES.slice(0, 3) } };
        }

        console.log('[Home Client] Data fetch completed with fallbacks');

        setData({
          phimMoiData,
          bannerHoatHinhData,
          phimVietData,
          phimAuMyData,
          phimHanData,
          phimNhatData,
          phimTrungData,
          animeData,
          cartoonData,
          longTiengData,
          thuyetMinhData,
          tvShowsData,
        });
      } catch (err) {
        console.error('[Home Client] Fatal error:', err);
        // Even on fatal error, use fallback data
        setData({
          phimMoiData: { data: { items: FALLBACK_MOVIES } },
          bannerHoatHinhData: { data: { items: FALLBACK_MOVIES } },
          phimVietData: { data: { items: FALLBACK_MOVIES.slice(0, 3) } },
          phimAuMyData: { data: { items: FALLBACK_MOVIES.slice(0, 3) } },
          phimHanData: { data: { items: FALLBACK_MOVIES.slice(0, 3) } },
          phimNhatData: { data: { items: FALLBACK_MOVIES.slice(0, 3) } },
          phimTrungData: { data: { items: FALLBACK_MOVIES.slice(0, 3) } },
          animeData: { data: { items: FALLBACK_MOVIES.slice(0, 3) } },
          cartoonData: { data: { items: FALLBACK_MOVIES.slice(0, 3) } },
          longTiengData: { data: { items: FALLBACK_MOVIES.slice(0, 3) } },
          thuyetMinhData: { data: { items: FALLBACK_MOVIES.slice(0, 3) } },
          tvShowsData: { data: { items: FALLBACK_MOVIES.slice(0, 3) } },
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-zinc-400 text-lg">Đang tải...</p>
        </div>
      </div>
    );
  }

  const allPhimMoi = data.phimMoiData?.data?.items || FALLBACK_MOVIES;
  
  // Combine sources to create a larger, more diverse pool for the banner
  const bannerPool = [
    ...allPhimMoi, 
    ...(data.phimAuMyData?.data?.items || []), 
    ...(data.phimNhatData?.data?.items || [])
  ];
  
  // Remove duplicates
  const uniquePool = Array.from(new Map(bannerPool.map(m => [m.slug, m])).values());
  
  const heroMovies: any[] = [];
  const sliderPhimMoi: any[] = [];
  
  // Banner pool: 50 hoạt hình mới nhất, lọc bỏ phim Trung Quốc
  const eligibleForBanner = (data.bannerHoatHinhData?.data?.items || [])
    .filter((movie: any) => !movie.country?.some((c: any) => c.slug === 'trung-quoc'));
  
  // Pick the top 15 for the hero banner to have backups in case some are blocked by YouTube
  for (const movie of eligibleForBanner) {
    if (heroMovies.length < 15) {
      heroMovies.push(movie);
    }
  }
  
  // Populate the slider with new movies that are NOT in the hero banner
  for (const movie of allPhimMoi) {
    if (!heroMovies.some(h => h.slug === movie.slug)) {
      sliderPhimMoi.push(movie);
    }
  }

  return (
    <div className="overflow-hidden bg-black pb-16">
      {/* Hero Banner (Featured Movies Carousel) */}
      {heroMovies.length > 0 && <HeroBanner movies={heroMovies} />}

      <div className="container mx-auto px-4 mt-4 sm:-mt-10 relative z-20">
        {/* 1. Lịch Sử Section (Client-side) */}
        <HomeHistorySection />

        {/* 2. Anime Section */}
        <section className="mb-14">
          <SectionTitle title="Anime" viewAllLink="/anime" />
          <MovieSlider movies={data.animeData?.data?.items || FALLBACK_MOVIES.slice(0, 6)} />
        </section>

        {/* 3. Cartoon Section */}
        <section className="mb-14">
          <SectionTitle title="Cartoon" viewAllLink="/cartoon" />
          <MovieSlider movies={(data.cartoonData?.data?.items || FALLBACK_MOVIES.slice(0, 6)).filter((movie: any) => !movie.country?.some((c: any) => c.slug === 'nhat-ban'))} />
        </section>

        {/* 5. Phim Việt Section */}
        <section className="mb-14">
          <SectionTitle title="Phim Việt" viewAllLink="/phim-viet" />
          <MovieSlider movies={data.phimVietData?.data?.items || FALLBACK_MOVIES.slice(0, 6)} />
        </section>

        {/* 6. Phim Âu Mỹ Section */}
        <section className="mb-14">
          <SectionTitle title="Phim Âu Mỹ" viewAllLink="/phim-au-my" />
          <MovieSlider movies={data.phimAuMyData?.data?.items || FALLBACK_MOVIES.slice(0, 6)} />
        </section>

        {/* 7. Phim Nhật Section */}
        <section className="mb-14">
          <SectionTitle title="Phim Nhật" viewAllLink="/phim-nhat" />
          <MovieSlider movies={data.phimNhatData?.data?.items || FALLBACK_MOVIES.slice(0, 6)} />
        </section>

        {/* 8. Phim Hàn Section */}
        <section className="mb-14">
          <SectionTitle title="Phim Hàn" viewAllLink="/phim-han" />
          <MovieSlider movies={data.phimHanData?.data?.items || FALLBACK_MOVIES.slice(0, 6)} />
        </section>

        {/* 9. Phim Trung Section */}
        <section className="mb-14">
          <SectionTitle title="Phim Trung" viewAllLink="/phim-trung" />
          <MovieSlider movies={data.phimTrungData?.data?.items || FALLBACK_MOVIES.slice(0, 6)} />
        </section>

        {/* TV Shows Section */}
        <section className="mb-14">
          <SectionTitle title="TV Shows" viewAllLink="/tv-shows" />
          <MovieSlider movies={data.tvShowsData?.data?.items || FALLBACK_MOVIES.slice(0, 6)} />
        </section>

        {/* 10. Phim Thuyết Minh Section */}
        <section className="mb-14">
          <SectionTitle title="Phim Thuyết Minh" viewAllLink="/phim-thuyet-minh" />
          <MovieSlider movies={data.thuyetMinhData?.data?.items || FALLBACK_MOVIES.slice(0, 6)} />
        </section>

        {/* 11. Phim Lồng Tiếng Section */}
        <section className="mb-14">
          <SectionTitle title="Phim Lồng Tiếng" viewAllLink="/phim-long-tieng" />
          <MovieSlider movies={data.longTiengData?.data?.items || FALLBACK_MOVIES.slice(0, 6)} />
        </section>
      </div>
    </div>
  );
}
