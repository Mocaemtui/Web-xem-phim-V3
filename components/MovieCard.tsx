import Link from "next/link";
import Image from "next/image";
import type { Movie } from "@/types/api";
import { getPosterUrl } from "@/lib/api";

interface MovieCardProps {
  movie: Movie;
  posterUrl?: string;
}

export default function MovieCard({ movie, posterUrl }: MovieCardProps) {
  if (!movie.slug) {
    return null;
  }

  const finalPosterUrl = getPosterUrl(movie);

  return (
    <Link href={`/phim/${encodeURIComponent(movie.slug)}`} className="group flex flex-col h-full transition-all duration-300 hover:scale-105 hover:z-10 relative">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-zinc-900 shadow-lg border border-white/5 transition-all duration-300 group-hover:shadow-blue-500/20 group-hover:border-white/10">
        <Image
          src={finalPosterUrl}
          alt={movie.name}
          fill
          className="object-cover transition-transform duration-500 ease-out will-change-transform"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
        />
        
        {/* Quality / Lang Badge */}
        <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
          {movie.quality && (
            <span className="px-1.5 py-0.5 bg-blue-600/90 text-[10px] font-bold text-white rounded shadow-sm backdrop-blur-md">
              {movie.quality}
            </span>
          )}
          {movie.lang && (
            <span className="px-1.5 py-0.5 bg-black/60 text-[10px] font-medium text-zinc-200 rounded shadow-sm backdrop-blur-md border border-white/10">
              {movie.lang}
            </span>
          )}
        </div>

        {/* Hover Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
        
        {/* Play Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 pointer-events-none">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            <svg className="w-6 h-6 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Origin Name on Hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0 pointer-events-none">
          <p className="text-xs font-medium text-zinc-300 line-clamp-2">{movie.origin_name || movie.name}</p>
        </div>
      </div>
      
      <div className="mt-3 flex-1 flex flex-col">
        <h3 className="font-medium text-white text-sm line-clamp-2 group-hover:text-blue-400 transition-colors leading-tight">
          {movie.name}
        </h3>
        <div className="flex items-center gap-2 mt-auto pt-1.5">
          <span className="text-xs font-medium text-zinc-400">{movie.year}</span>
          {movie.country && movie.country.length > 0 && (
            <>
              <span className="text-zinc-700 text-[10px]">•</span>
              <span className="text-xs text-zinc-500 line-clamp-1">{movie.country[0].name}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
