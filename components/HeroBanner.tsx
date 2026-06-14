"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Movie } from "@/types/api";
import { getBackdropUrl } from "@/lib/api";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";

interface HeroBannerProps {
  movies: Movie[];
}

export default function HeroBanner({ movies }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!movies || movies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [movies]);

  if (!movies || movies.length === 0) return null;

  const movie = movies[currentIndex];
  const backdropUrl = getBackdropUrl(movie);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  };

  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-video lg:aspect-[21/9] max-h-[85vh] flex items-end pb-12 md:pb-24 pt-20 overflow-hidden group">
      {/* Background Image */}
      <div key={movie._id} className="absolute inset-0 z-0 animate-in fade-in duration-1000">
        <Image
          src={backdropUrl}
          alt={movie.name}
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlays for cinematic effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
        
        {/* Bottom fade to match body background perfectly */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />
      </div>

      {/* Navigation Arrows */}
      {movies.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm border border-white/10"
            aria-label="Previous movie"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm border border-white/10"
            aria-label="Next movie"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 w-full">
        <div key={`content-${movie._id}`} className="max-w-3xl animate-in slide-in-from-bottom-8 duration-700 fade-in zoom-in-95">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 leading-tight drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] tracking-tight line-clamp-2">
            {movie.name}
          </h1>
          
          <div className="flex items-center gap-3 text-xs sm:text-sm md:text-base text-zinc-200 mb-4 drop-shadow-md">
            <span className="font-bold text-white">{movie.year}</span>
            {movie.quality && (
              <span className="px-2 py-0.5 border border-white/30 rounded bg-white/10 backdrop-blur-md shadow-sm">
                {movie.quality}
              </span>
            )}
            {movie.lang && <span className="font-medium text-zinc-300">{movie.lang}</span>}
          </div>

          <p className="text-zinc-300 text-xs sm:text-sm md:text-base line-clamp-2 sm:line-clamp-3 mb-6 drop-shadow-md max-w-xl leading-relaxed">
            {movie.origin_name && <span className="block mb-1 italic text-zinc-400 font-medium">{movie.origin_name}</span>}
            Theo dõi ngay tác phẩm nổi bật này. Chúc bạn có những phút giây giải trí tuyệt vời nhất trên Mocaemtui.
          </p>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              href={`/phim/${encodeURIComponent(movie.slug)}`}
              className="flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] text-sm sm:text-base"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              Phát Ngay
            </Link>
            
            <Link
              href={`/phim/${encodeURIComponent(movie.slug)}`}
              className="flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-zinc-600/40 text-white rounded-xl font-bold backdrop-blur-md hover:bg-zinc-600/60 border border-white/10 transition-all hover:scale-105 active:scale-95 text-sm sm:text-base"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
              Chi Tiết
            </Link>
          </div>
        </div>

        {/* Indicators */}
        {movies.length > 1 && (
          <div className="flex items-center gap-2 mt-8">
            {movies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  currentIndex === idx ? "w-8 h-2 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]" : "w-2 h-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
