"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Movie } from "@/types/api";
import { getBackdropUrl } from "@/lib/api";
import { Play, Info, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import YouTube from "react-youtube";

interface HeroBannerProps {
  movies: Movie[];
}

export default function HeroBanner({ movies }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trailerVideoId, setTrailerVideoId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const playerRef = useRef<any>(null);

  // Read mute preference from localStorage on mount
  useEffect(() => {
    try {
      const savedMuted = localStorage.getItem('trailer_muted');
      if (savedMuted !== null) {
        setIsMuted(savedMuted === 'true');
      }
    } catch (e) {}
  }, []);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    try {
      localStorage.setItem('trailer_muted', String(newMuted));
    } catch (e) {}
    
    if (playerRef.current) {
      if (newMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
      }
    }
  };

  // Auto slide
  useEffect(() => {
    if (!movies || movies.length <= 1) return;
    if (isPaused) return; // Dừng đổi phim khi hover
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
      setIsVideoPlaying(false); // Reset trạng thái video khi đổi phim
    }, 15000); // Kéo dài lên 15s để xem được trailer
    return () => clearInterval(interval);
  }, [movies, isPaused, currentIndex]);

  const movie = movies[currentIndex] || movies[0];
  const backdropUrl = movie ? getBackdropUrl(movie) : "";

  // Fetch trailer for current hero movie
  useEffect(() => {
    if (!movie?.slug) return;
    setTrailerVideoId(null);
    setIsVideoPlaying(false);
    let isMounted = true;
    
    fetch(`https://phimapi.com/phim/${movie.slug}`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.movie?.trailer_url) {
          let videoId = "";
          const url = data.movie.trailer_url;
          if (url.includes("youtube.com/watch?v=")) {
            videoId = url.split("v=")[1].split("&")[0];
          } else if (url.includes("youtu.be/")) {
            videoId = url.split("youtu.be/")[1].split("?")[0];
          } else if (url.includes("youtube.com/embed/")) {
            videoId = url.split("embed/")[1].split("?")[0];
          }
          if (videoId) {
            setTrailerVideoId(videoId);
          }
        }
      })
      .catch(() => {});
      
    return () => { isMounted = false; };
  }, [movie?.slug]);

  if (!movies || movies.length === 0) return null;

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
    setIsVideoPlaying(false);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
    setIsVideoPlaying(false);
  };

  const youtubeOpts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1 as const,
      mute: 1 as const, // Always start muted to ensure autoplay works on modern browsers
      controls: 0 as const,
      modestbranding: 1 as const,
      loop: 1 as const,
      playlist: trailerVideoId || undefined,
      playsinline: 1 as const,
      rel: 0 as const,
      disablekb: 1 as const,
      iv_load_policy: 3 as const,
      vq: 'hd1080' as const
    },
  };

  return (
    <div 
      className="relative w-full flex flex-col lg:block lg:aspect-[21/9] lg:max-h-[85vh] lg:flex-row lg:items-end bg-zinc-950 group overflow-hidden lg:pb-24 pt-[60px] lg:pt-20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image & Trailer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={movie._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="relative w-full aspect-video lg:absolute lg:inset-0 z-0 shrink-0"
        >
          
          {/* Youtube Auto-play Background (Always opacity 1, hidden behind image initially) */}
          {trailerVideoId && (
            <div 
              className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
            >
              <YouTube
                videoId={trailerVideoId}
                opts={youtubeOpts}
                onReady={(e) => {
                  playerRef.current = e.target;
                  e.target.setPlaybackQuality('hd1080');
                  if (!isMuted) {
                    e.target.unMute();
                  }
                }}
                onPlay={(e) => {
                  e.target.setPlaybackQuality('hd1080');
                  if (!isMuted) {
                    e.target.unMute();
                  }
                  setIsVideoPlaying(true);
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[105%] aspect-video md:w-[150%] lg:w-[120%] xl:w-[105%] pointer-events-none"
              />
            </div>
          )}

          {/* Background Image (Fades out strictly ONLY when video starts playing) */}
          <motion.div
            animate={{ opacity: isVideoPlaying ? 0 : 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-10"
          >
            <Image
              src={backdropUrl}
              alt={movie.name}
              fill
              className="object-cover animate-ken-burns"
              priority
            />
          </motion.div>

          {/* Gradient overlays for cinematic effect (Hidden on mobile top block, visible on desktop) */}
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent z-10" />
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
          
          {/* Bottom fade to match body background perfectly */}
          <div className="absolute bottom-0 left-0 right-0 h-12 lg:h-32 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {movies.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/40 hover:bg-black/70 text-white rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm border border-white/10"
            aria-label="Previous movie"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={nextSlide}
            className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/40 hover:bg-black/70 text-white rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm border border-white/10"
            aria-label="Next movie"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 md:px-6 relative z-10 w-full pb-8 lg:pb-0 flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${movie._id}`}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
            }}
            className="max-w-3xl pt-2 lg:pt-20"
          >
            <motion.h1 
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } } }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold font-outfit text-white mb-3 sm:mb-4 leading-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] tracking-tight line-clamp-2"
            >
              {movie.origin_name || movie.name}
            </motion.h1>
            
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="flex items-center flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm md:text-base text-zinc-200 mb-4 drop-shadow-md"
            >
              <span className="font-bold text-white">{movie.year}</span>
              {movie.quality && (
                <span className="px-2 py-0.5 border border-white/30 rounded bg-white/10 backdrop-blur-md shadow-sm">
                  {movie.quality}
                </span>
              )}
              {movie.lang && <span className="font-medium text-zinc-300">{movie.lang}</span>}
            </motion.div>

            <motion.p 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="text-zinc-300 text-xs sm:text-sm md:text-base line-clamp-2 sm:line-clamp-3 mb-6 drop-shadow-md max-w-xl leading-relaxed"
            >
              {movie.origin_name && <span className="block mb-1 font-bold text-white text-base sm:text-lg">{movie.name}</span>}
              Theo dõi ngay tác phẩm nổi bật này. Chúc bạn có những phút giây giải trí tuyệt vời nhất trên Mocaemtui.
            </motion.p>

            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="flex items-center flex-wrap gap-3 sm:gap-4"
            >
              <Link 
                href={`/phim/${encodeURIComponent(movie.slug)}`}
                className="group flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-[var(--color-cyan-neon)] text-black rounded-xl font-bold hover:bg-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_var(--color-cyan-neon)] hover:shadow-[0_0_30px_rgba(255,255,255,0.8)] text-sm sm:text-base relative overflow-hidden"
              >
                {/* Ping effect background */}
                <div className="absolute inset-0 bg-[var(--color-cyan-neon)] animate-ping opacity-20 group-hover:opacity-0 transition-opacity" />
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current relative z-10" />
                <span className="relative z-10">Phát Ngay</span>
              </Link>
              
              <Link
                href={`/phim/${encodeURIComponent(movie.slug)}`}
                className="flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-black/40 text-white rounded-xl font-bold backdrop-blur-md hover:bg-black/60 border border-[var(--color-cyan-neon)] transition-all hover:scale-105 active:scale-95 text-sm sm:text-base hover:shadow-[0_0_15px_var(--color-cyan-neon)]"
              >
                <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                Chi Tiết
              </Link>
              
              {trailerVideoId && (
                <button
                  onClick={toggleMute}
                  className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-black/40 text-white rounded-xl backdrop-blur-md hover:bg-black/60 border border-white/20 transition-all hover:scale-105 active:scale-95 text-sm sm:text-base hover:border-white/50"
                  aria-label={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Indicators */}
        {movies.length > 1 && (
          <div className="flex items-center gap-2 mt-8">
            {movies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  currentIndex === idx ? "w-8 h-2 bg-[var(--color-magenta-neon)] shadow-[0_0_15px_var(--color-magenta-neon)]" : "w-2 h-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
