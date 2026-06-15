"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Share2, Plus, Clock, Calendar, Star, Languages, Users } from "lucide-react";
import type { MovieDetail, MovieImages, MoviePeoples } from "@/types/api";
import ImageToggle from "./ImageToggle";
import YouTube from "react-youtube";
import { getWatchHistory } from "@/lib/watchHistory";

import { getPosterUrl, getBackdropUrl, resolveImgUrl, sortEpisodes } from "@/lib/api";


interface MovieDetailProps {
  movie: MovieDetail;
  images: MovieImages;
  peoples: MoviePeoples;
}

export default function MovieDetail({ movie, images, peoples }: MovieDetailProps) {
  // 0 = Primary, 1 = TMDB, 2 = Alternate
  const [backdropSource, setBackdropSource] = useState<0 | 1 | 2>(0);
  const [posterSource, setPosterSource] = useState<0 | 1 | 2>(0);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [trailerVideoId, setTrailerVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (!movie.trailer_url) return;
    let videoId = "";
    const url = movie.trailer_url;
    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("youtube.com/embed/")) {
      videoId = url.split("embed/")[1].split("?")[0];
    }
    if (videoId) setTrailerVideoId(videoId);
  }, [movie.trailer_url]);

  const primaryPosterUrl = getBackdropUrl(movie);
  const primaryThumbUrl = getPosterUrl(movie);
  
  // Alternate URLs (from fallback/secondary API)
  const altPosterUrl = movie.alt_poster_url ? resolveImgUrl(movie.alt_poster_url) : null;
  const altThumbUrl = movie.alt_thumb_url ? resolveImgUrl(movie.alt_thumb_url) : null;

  // TMDB URLs
  const tmdbPosterFile = images?.images?.find(img => img.type === 'poster')?.file_path;
  const tmdbPosterBase = images?.image_sizes?.poster?.w500 || "https://image.tmdb.org/t/p/w500";
  const tmdbPosterUrl = tmdbPosterFile ? `${tmdbPosterBase}${tmdbPosterFile}` : null;

  const tmdbBackdropFile = images?.images?.find(img => img.type === 'backdrop')?.file_path;
  const tmdbBackdropBase = images?.image_sizes?.backdrop?.w1280 || "https://image.tmdb.org/t/p/w1280";
  const tmdbBackdropUrl = tmdbBackdropFile ? `${tmdbBackdropBase}${tmdbBackdropFile}` : null;


  // Determine available options
  const hasAltBackdrop = Boolean(altPosterUrl && altPosterUrl !== primaryPosterUrl);
  const hasAltPoster = Boolean(altThumbUrl && altThumbUrl !== primaryThumbUrl);

  const availableBackdrops = [primaryPosterUrl];
  const backdropNames = ["PhimAPI"];
  if (tmdbBackdropUrl) {
    availableBackdrops.push(tmdbBackdropUrl);
    backdropNames.push("TMDB");
  }
  if (hasAltBackdrop) {
    availableBackdrops.push(altPosterUrl!);
    backdropNames.push("Ophim");
  }

  const availablePosters = [primaryThumbUrl];
  const posterNames = ["PhimAPI"];
  if (tmdbPosterUrl) {
    availablePosters.push(tmdbPosterUrl);
    posterNames.push("TMDB");
  }
  if (hasAltPoster) {
    availablePosters.push(altThumbUrl!);
    posterNames.push("Ophim");
  }

  // Current active images
  const currentBackdropIndex = backdropSource % availableBackdrops.length;
  const currentPosterIndex = posterSource % availablePosters.length;
  const currentBackdropUrl = availableBackdrops[currentBackdropIndex];
  const currentPosterUrl = availablePosters[currentPosterIndex];
  const currentBackdropName = backdropNames[currentBackdropIndex];
  const currentPosterName = posterNames[currentPosterIndex];

  // Transition states
  const [backdropFade, setBackdropFade] = useState(true);
  const [posterFade, setPosterFade] = useState(true);

  // Handle transitions smoothly
  const toggleBackdrop = () => {
    setBackdropFade(false);
    setTimeout(() => {
      setBackdropSource(prev => ((prev + 1) % availableBackdrops.length) as 0 | 1 | 2);
      setBackdropFade(true);
    }, 250);
  };

  const togglePoster = () => {
    setPosterFade(false);
    setTimeout(() => {
      setPosterSource(prev => ((prev + 1) % availablePosters.length) as 0 | 1 | 2);
      setPosterFade(true);
    }, 250);
  };

  const router = useRouter();
  
  const handleBack = () => {
    if (typeof window !== 'undefined') {
      const lastBrowse = sessionStorage.getItem("last_browse_page");
      if (lastBrowse) {
        router.push(lastBrowse);
        return;
      }
    }
    router.push("/");
  };

  const [historyItem, setHistoryItem] = useState<any>(null);
  const [episodes, setEpisodes] = useState(sortEpisodes(movie.episodes || []));
  const [currentOriginName, setCurrentOriginName] = useState(movie.origin_name);
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const history = getWatchHistory();
    const item = history.find((i: any) => i.slug === movie.slug);
    setHistoryItem(item || null);
    
    const sortedEps = sortEpisodes(movie.episodes || []);
    setEpisodes(sortedEps);
    setCurrentOriginName(movie.origin_name);

    try {
      const stored = localStorage.getItem("watched_episodes_v3");
      if (stored) {
        setWatchedEpisodes(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, [movie.slug, movie.origin_name, movie.episodes]);




  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Top Bar with Back Button */}
      <div className="fixed top-[76px] left-4 z-40 pointer-events-none flex items-start">
        <button 
          onClick={handleBack}
          className="pointer-events-auto opacity-100 md:opacity-0 md:hover:opacity-100 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-md transition-all border border-white/10 shadow-lg hover:scale-105 active:scale-95 duration-300"
          title="Quay lại"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      {/* Backdrop */}
      <div className="relative z-0 w-full aspect-[4/3] sm:aspect-video lg:aspect-[21/9] max-h-[85vh] overflow-hidden bg-zinc-950">
        
        {/* Youtube Background - clip-path giấu hoàn toàn cho tới khi video phát */}
        {isPlayingTrailer && trailerVideoId && (
          <div 
            className="absolute inset-0 z-0 bg-black"
            style={{
              clipPath: isVideoReady ? 'inset(0)' : 'inset(100%)',
              opacity: isVideoReady ? 1 : 0
            }}
          >
              <YouTube
                videoId={trailerVideoId}
                opts={{
                  height: '100%',
                  width: '100%',
                  playerVars: {
                    autoplay: 1,
                    controls: 0,
                    modestbranding: 1,
                    loop: 1,
                    playlist: trailerVideoId,
                    playsinline: 1,
                    rel: 0,
                    disablekb: 1,
                    iv_load_policy: 3,
                    vq: 'hd1080'
                  }
                }}
                onReady={(e) => {
                  e.target.setPlaybackQuality('hd1080');
                }}
                onPlay={(e) => {
                  e.target.setPlaybackQuality('hd1080');
                  setIsVideoReady(true);
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[67.5vw] min-h-[120%] min-w-[213.33%] pointer-events-none"
              />
            {/* Click to stop trailer */}
            <div 
              className="absolute inset-0 z-30 cursor-pointer" 
              onClick={() => {
                setIsPlayingTrailer(false);
                setIsVideoReady(false);
              }}
            />
          </div>
        )}

        {/* Bức ảnh nền (Biến mất lập tức khi video chạy) */}
        <div className={`absolute inset-0 z-10 ${isVideoReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <img
            src={currentBackdropUrl}
            alt={movie.name}
            className={`absolute inset-0 z-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out cursor-pointer md:cursor-default ${backdropFade ? "opacity-100" : "opacity-0"}`}
            onClick={() => { if (window.innerWidth < 768 && availableBackdrops.length > 1) toggleBackdrop(); }}
          />
          
          {/* Nút Play ẩn - chỉ hiện khi đưa chuột vào đúng vùng giữa ảnh */}
          {trailerVideoId && !isPlayingTrailer && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <div 
                className="w-24 h-24 pointer-events-auto cursor-pointer flex items-center justify-center group/play"
                onClick={() => setIsPlayingTrailer(true)}
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 md:bg-white/10 group-hover/play:bg-[var(--color-cyan-neon)] rounded-full flex items-center justify-center backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover/play:shadow-[0_0_50px_var(--color-cyan-neon)] transition-all duration-300 text-white/80 md:text-white/30 group-hover/play:text-black opacity-100 md:opacity-0 group-hover/play:opacity-100 scale-100 md:scale-75 group-hover/play:scale-100">
                  <svg className="w-8 h-8 md:w-10 md:h-10 translate-x-[2px]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Cinematic Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-zinc-950/10 to-transparent pointer-events-none z-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/30 via-transparent to-transparent pointer-events-none z-20" />

        {availableBackdrops.length > 1 && (
          <div className="hidden md:flex absolute top-0 right-0 w-48 h-48 z-30 group/corner items-start justify-end p-4">
            <div className="opacity-0 invisible group-hover/corner:opacity-100 group-hover/corner:visible pointer-events-none group-hover/corner:pointer-events-auto transition-all duration-300">
              <ImageToggle onToggle={toggleBackdrop} label={`Đổi ảnh nền (Nguồn: ${currentBackdropName})`} />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="grid md:grid-cols-[300px_1fr] gap-8">
          {/* Poster Desktop */}
          <div className="hidden md:block">
            <Link href={`/xem-phim/${movie.slug}`} className="block relative aspect-[2/3] rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] group bg-zinc-900 transition-transform duration-300 hover:scale-105 border border-white/10 hover:border-[var(--color-cyan-neon)]">
              <img
                src={currentPosterUrl}
                alt={movie.name}
                className={`w-full h-full object-cover transition-opacity duration-300 ease-in-out ${posterFade ? "opacity-100" : "opacity-0"}`}
              />

              {availablePosters.length > 1 && (
                <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 invisible group-hover:visible pointer-events-none group-hover:pointer-events-auto transition-all duration-300">
                  <ImageToggle onToggle={togglePoster} label={`Đổi ảnh poster (Nguồn: ${currentPosterName})`} />
                </div>
              )}
            </Link>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6">
            {/* Mobile Poster */}
            <div className="md:hidden flex justify-center mb-2">
              <Link href={`/xem-phim/${movie.slug}`} className="block relative aspect-[2/3] rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)] max-w-[200px] group bg-zinc-900 border border-white/10">
                <img
                  src={currentPosterUrl}
                  alt={movie.name}
                  className={`w-full h-full object-cover transition-opacity duration-300 ease-in-out ${posterFade ? "opacity-100" : "opacity-0"}`}
                />
                {availablePosters.length > 1 && (
                  <div className="absolute top-2 right-2 z-30" onClick={(e) => { e.preventDefault(); togglePoster(); }}>
                    <ImageToggle onToggle={togglePoster} label="Đổi" />
                  </div>
                )}
              </Link>
            </div>


            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 line-clamp-2">
                {movie.origin_name || movie.name}
              </h1>
              {movie.origin_name && (
                <p className="text-lg text-zinc-400 font-medium">{movie.name}</p>
              )}
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full">
                {movie.year}
              </span>
              {movie.quality && (
                <span className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full">
                  {movie.quality}
                </span>
              )}
              {movie.lang && (
                <span className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full">
                  {movie.lang}
                </span>
              )}
              {movie.time && (
                <span className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full">
                  {movie.time}
                </span>
              )}
            </div>

            {/* Categories */}
            {movie.category && movie.category.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-zinc-400 font-medium text-sm">Thể loại:</span>
                {movie.category.map((cat) => (
                  <div
                    key={cat.id}
                    className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 rounded-full px-3 py-1 text-sm transition-colors text-zinc-300"
                  >
                    <Link
                      href={`/filter?theLoai=${cat.slug}`}
                      className="text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {cat.name}
                    </Link>
                  </div>
                ))}
              </div>
            )}



            {/* Countries */}
            {movie.country && movie.country.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {movie.country.map((country) => (
                  <span
                    key={country.id}
                    className="text-sm text-zinc-400"
                  >
                    {country.name}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {movie.content && (
              <div 
                className="text-zinc-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: movie.content }}
              />
            )}

            {/* Director */}
            {((peoples.peoples && peoples.peoples.filter(p => p.known_for_department === 'Directing').length > 0) || (movie.director && movie.director.length > 0)) && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Đạo diễn</h3>
                <div className="flex flex-wrap gap-2">
                  {peoples.peoples && peoples.peoples.filter(p => p.known_for_department === 'Directing').length > 0 ? (
                    peoples.peoples
                      .filter(p => p.known_for_department === 'Directing')
                      .map((person, index) => (
                        <span
                          key={index}
                          className="text-sm text-zinc-400"
                        >
                          {person.name}
                        </span>
                      ))
                  ) : (
                    movie.director?.map((dir, index) => (
                      <span
                        key={index}
                        className="text-sm text-zinc-400"
                      >
                        {dir}
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Actors */}
            {((peoples.peoples && peoples.peoples.filter(p => p.known_for_department === 'Acting').length > 0) || (movie.actor && movie.actor.length > 0)) && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Diễn viên</h3>
                <div className="flex flex-wrap gap-2">
                  {peoples.peoples && peoples.peoples.filter(p => p.known_for_department === 'Acting').length > 0 ? (
                    peoples.peoples
                      .filter(p => p.known_for_department === 'Acting')
                      .slice(0, 10)
                      .map((person, index) => (
                        <span
                          key={index}
                          className="text-sm text-zinc-400"
                        >
                          {person.name}
                        </span>
                      ))
                  ) : (
                    movie.actor?.slice(0, 10).map((act, index) => (
                      <span
                        key={index}
                        className="text-sm text-zinc-400"
                      >
                        {act}
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Watch Buttons or Trailer Info */}
            <div className="flex flex-wrap gap-4 mt-2">
              {episodes && 
              episodes.length > 0 && 
              episodes[0].server_data && 
              episodes[0].server_data.length > 0 &&
              (episodes[0].server_data[0].link_m3u8 || episodes[0].server_data[0].link_embed) ? (
                <>
                  {movie.slug && (
                    <Link
                      href={`/xem-phim/${movie.slug}`}
                      className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-8 py-3 rounded-lg transition-colors w-fit shadow-lg shadow-red-900/20 active:scale-95"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Xem ngay
                    </Link>
                  )}
                  {movie.slug && (
                    <button
                      onClick={() => {
                        const roomId = Math.random().toString(36).substring(2, 9);
                        sessionStorage.setItem(`host_${roomId}`, 'true');
                        window.location.href = `/watch-together/${movie.slug}/${roomId}`;
                      }}
                      className="hidden md:inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-6 py-3 rounded-lg transition-colors w-fit border border-zinc-700 active:scale-95"
                    >
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Xem chung cùng bạn bè
                    </button>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 text-amber-200 text-sm max-w-xl">
                    <p className="font-semibold mb-1 flex items-center gap-1.5 text-amber-400">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                      Phim chưa phát sóng chính thức
                    </p>
                    <p className="text-zinc-400 text-xs mt-1">Hiện tại phim chưa có tập phát sóng (chỉ có trailer/sắp chiếu). Bạn có thể thưởng thức Trailer chính thức dưới đây.</p>
                  </div>
                  {movie.trailer_url ? (
                    <a
                      href={movie.trailer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-8 py-3 rounded-lg transition-colors w-fit active:scale-95 shadow-lg shadow-red-900/20"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.553a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.87.553 9.388.553 9.388.553s7.518 0 9.388-.553a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      Xem Trailer chính thức
                    </a>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center justify-center gap-2 bg-zinc-800 text-zinc-500 font-medium px-8 py-3 rounded-lg w-fit cursor-not-allowed border border-zinc-700/50"
                    >
                      Chưa có Trailer
                    </button>
                  )}
                </div>
              )}
            </div>
 
            {/* Episode Selector for Series Movies directly in Detail Page */}
            {episodes && episodes.length > 0 && (
              <div className="mt-8 border-t border-zinc-900 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Danh sách tập phim</h3>
                {episodes.map((server: any, sIdx: number) => (
                  <div key={sIdx} className="mb-6">
                    <p className="text-zinc-400 mb-2 font-medium">{server.server_name}</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                      {server.server_data?.map((episode: any, idx: number) => {
                        const epKey = `${movie.slug}_${episode.name}`;
                        const isCurrentlyWatching = historyItem?.currentServerIndex === sIdx && historyItem?.currentEpisodeIndex === idx;
                        const isWatched = watchedEpisodes.has(epKey);
                        return (
                          <Link
                            key={`${episode.slug}-${idx}`}
                            href={`/xem-phim/${movie.slug}?tap=${idx + 1}&server=${sIdx}`}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center cursor-pointer border ${
                              isCurrentlyWatching 
                                ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-900/20" 
                                : isWatched
                                  ? "bg-emerald-950/30 text-emerald-400 border-emerald-500/20 hover:bg-emerald-900/40"
                                  : "bg-zinc-900 hover:bg-red-600 text-zinc-300 hover:text-white border-transparent"
                            }`}
                          >
                            {episode.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
