"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterPanel from "@/components/FilterPanel";
import MovieCard from "@/components/MovieCard";
import SectionTitle from "@/components/SectionTitle";
import Pagination from "@/components/Pagination";
import { getDanhSach, getTheLoaiDetails, getQuocGiaDetails, getTheLoai, getQuocGia, getPhimMoi } from "@/lib/api";
import type { MovieListResponse, Genre, Country, Movie } from "@/types/api";

const DANH_MUC_LIST = [
  { name: "Phim mới", slug: "phim-moi" },
  { name: "Phim bộ", slug: "phim-bo" },
  { name: "Phim lẻ", slug: "phim-le" },
  { name: "Shows", slug: "tv-shows" },
  { name: "Hoạt hình", slug: "hoat-hinh" },
  { name: "Phim vietsub", slug: "phim-vietsub" },
  { name: "Phim thuyết minh", slug: "phim-thuyet-minh" },
  { name: "Phim lồng tiếng", slug: "phim-long-tieng" },
  { name: "Phim bộ đang chiếu", slug: "phim-bo-dang-chieu" },
  { name: "Phim bộ đã hoàn thành", slug: "phim-bo-hoan-thanh" },
  { name: "Phim sắp chiếu", slug: "phim-sap-chieu" },
  { name: "Subteam", slug: "subteam" },
  { name: "Phim chiếu rạp", slug: "phim-chieu-rap" },
];

function FilterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleBack = () => {
    const hasReferrer = typeof document !== 'undefined' && document.referrer && document.referrer.includes(window.location.host);
    if (hasReferrer) {
      router.back();
    } else {
      router.push("/");
    }
  };
  const [movies, setMovies] = useState<MovieListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{ theLoai?: string; quocGia?: string; year?: string; loaiPhim?: string; phienBan?: string; sortField?: string }>({});
  const [title, setTitle] = useState("Bộ Lọc Phim");
  const [theLoaiList, setTheLoaiList] = useState<Genre[]>([]);
  const [quocGiaList, setQuocGiaList] = useState<Country[]>([]);


  const updateTitle = useCallback(() => {
    const parts: string[] = [];
    if (filters.loaiPhim) parts.push(filters.loaiPhim);
    if (filters.phienBan) parts.push(filters.phienBan);
    if (filters.theLoai) {
      const name = theLoaiList.find(t => t.slug === filters.theLoai)?.name || filters.theLoai;
      parts.push(name);
    }
    if (filters.quocGia) {
      const name = quocGiaList.find(c => c.slug === filters.quocGia)?.name || filters.quocGia;
      parts.push(name);
    }
    if (filters.year) parts.push(filters.year);
    setTitle(parts.length > 0 ? parts.join(" - ") : "Bộ Lọc Phim");
  }, [filters, theLoaiList, quocGiaList]);

  const fetchMovies = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      let data: MovieListResponse | null = null;
      const danhMucSlug = filters.loaiPhim || filters.phienBan || "phim-moi";
      
      const queryParams: any = { 
        page, 
        limit: 30, 
        category: filters.theLoai, 
        country: filters.quocGia, 
        year: filters.year,
        sort_field: filters.sortField,
        sort_type: filters.sortField ? "desc" : undefined
      };

      const hasAnyFilter = filters.theLoai || filters.quocGia || filters.year || filters.sortField;

      if (filters.loaiPhim || filters.phienBan) {
        if (danhMucSlug === "phim-moi" && !hasAnyFilter) {
          const res = await getPhimMoi(page, 30);
          data = res?.data || null;
        } else {
          const res = await getDanhSach(danhMucSlug, queryParams);
          data = res?.data || null;
        }
      } else if (filters.theLoai) {
        const res = await getTheLoaiDetails(filters.theLoai, queryParams);
        data = res?.data || null;
      } else if (filters.quocGia) {
        const res = await getQuocGiaDetails(filters.quocGia, queryParams);
        data = res?.data || null;
      } else if (hasAnyFilter) {
        const res = await getDanhSach("phim-moi", queryParams);
        data = res?.data || null;
      } else {
        const res = await getPhimMoi(page, 30);
        data = res?.data || null;
      }
      setMovies(data);
      updateTitle();
    } catch (e) {
      console.error("Error fetching movies:", e);
    } finally {
      setLoading(false);
    }
  }, [filters, updateTitle]);

  const fetchFilterData = useCallback(async () => {
    try {
      const [theLoaiRes, quocGiaRes] = await Promise.all([getTheLoai(), getQuocGia()]);
      if (theLoaiRes?.data?.items) {
        const filtered = theLoaiRes.data.items.filter(item => !item.name.toLowerCase().includes('18+') && !item.name.toLowerCase().includes('18'));
        setTheLoaiList(filtered);
      }
      if (quocGiaRes?.data?.items) setQuocGiaList(quocGiaRes.data.items);
    } catch (e) {
      console.error("Error fetching filter data:", e);
    }
  }, []);

  useEffect(() => {
    const theLoai = searchParams.get("theLoai") || undefined;
    const quocGia = searchParams.get("quocGia") || undefined;
    const year = searchParams.get("year") || undefined;
    const loaiPhim = searchParams.get("loaiPhim") || undefined;
    const phienBan = searchParams.get("phienBan") || undefined;
    const sortField = searchParams.get("sortField") || undefined;
    setFilters({ theLoai, quocGia, year, loaiPhim, phienBan, sortField });
  }, [searchParams]);

  const handleFilterChange = (newFilters: { theLoai?: string; quocGia?: string; year?: string; loaiPhim?: string; phienBan?: string; sortField?: string }) => {
    const params = new URLSearchParams();
    if (newFilters.theLoai) params.set("theLoai", newFilters.theLoai);
    if (newFilters.quocGia) params.set("quocGia", newFilters.quocGia);
    if (newFilters.year) params.set("year", newFilters.year);
    if (newFilters.loaiPhim) params.set("loaiPhim", newFilters.loaiPhim);
    if (newFilters.phienBan) params.set("phienBan", newFilters.phienBan);
    if (newFilters.sortField) params.set("sortField", newFilters.sortField);
    
    router.push(`/filter?${params.toString()}`, { scroll: false });
    setCurrentPage(1);
  };

  useEffect(() => { fetchFilterData(); }, [fetchFilterData]);
  useEffect(() => {
    const p = searchParams.get('page');
    if (p) setCurrentPage(parseInt(p, 10));
  }, [searchParams]);
  useEffect(() => { fetchMovies(currentPage); }, [fetchMovies, currentPage]);

  return (
    <div className="container mx-auto px-4 py-8 pl-16 md:pl-4">
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
      <div className="mb-6">
        <FilterPanel
          theLoaiList={theLoaiList}
          quocGiaList={quocGiaList}
          initialFilters={{
            theLoaiSlug: filters.theLoai,
            quocGiaSlug: filters.quocGia,
            year: filters.year,
            loaiPhim: filters.loaiPhim,
            phienBan: filters.phienBan,
            sortField: filters.sortField
          }}
          onFilterChange={handleFilterChange}
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle title={title} />
          {movies?.params?.pagination && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Tổng: {movies.params.pagination.totalItems} phim
            </span>
          )}
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : movies?.items && movies.items.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {movies.items.map(movie => (
                <MovieCard key={movie._id} movie={movie} />
              ))}
            </div>
            {Math.ceil(movies.params.pagination.totalItems / movies.params.pagination.totalItemsPerPage) > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(movies.params.pagination.totalItems / movies.params.pagination.totalItemsPerPage)}
                  baseUrl="/filter"
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>Không tìm thấy phim nào với bộ lọc đã chọn.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FilterPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <FilterContent />
    </Suspense>
  );
}
