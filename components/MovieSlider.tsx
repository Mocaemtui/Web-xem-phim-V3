"use client";

import { useRef } from "react";
import MovieCardWrapper from "./MovieCardWrapper";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Movie } from "@/types/api";

interface MovieSliderProps {
  movies: Movie[];
}

export default function MovieSlider({ movies }: MovieSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

  if (!movies || movies.length === 0) return null;

  // Display exactly 12 movies, no duplication or JS loops
  const items = movies.slice(0, 12);

  const scroll = (direction: "left" | "right") => {
    const slider = sliderRef.current;
    if (!slider) return;

    // Scroll by the visible width of the container
    const widthToScroll = slider.clientWidth;
    const amount = direction === "left" ? -widthToScroll : widthToScroll;
    slider.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <div className="relative group/slider">
      {/* Navigation Arrow Left */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-[40%] -translate-y-1/2 z-20 w-10 h-10 bg-black/60 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover/slider:opacity-100 transition-all duration-300 ml-2 shadow-lg backdrop-blur-sm active:scale-90"
        aria-label="Scroll left"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Scrollable Container (CSS Snap Scroll, no JS loops) */}
      <div
        ref={sliderRef}
        className="flex overflow-x-auto overflow-y-visible no-scrollbar gap-4 pb-6 pt-6 px-2 -mx-2 scroll-smooth snap-x snap-mandatory"
      >
        {items.map((movie) => (
          <div
            key={movie._id}
            // Mobile: exactly 2 items fit (1 gap of 16px)
            // Tablet (md): exactly 4 items fit (3 gaps of 16px)
            // Desktop (lg): exactly 6 items fit (5 gaps of 16px)
            className="w-[calc((100%-16px)/2)] md:w-[calc((100%-48px)/4)] lg:w-[calc((100%-80px)/6)] shrink-0 snap-start"
          >
            <MovieCardWrapper movie={movie} />
          </div>
        ))}
      </div>

      {/* Navigation Arrow Right */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-[40%] -translate-y-1/2 z-20 w-10 h-10 bg-black/60 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover/slider:opacity-100 transition-all duration-300 mr-2 shadow-lg backdrop-blur-sm active:scale-90"
        aria-label="Scroll right"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
