"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MovieDetail, MovieImages, MoviePeoples } from "@/types/api";
import ImageToggle from "./ImageToggle";
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

  useEffect(() => {
    const history = getWatchHistory();
    const item = history.find((i: any) => i.slug === movie.slug);
    setHistoryItem(item || null);
    
    const sortedEps = sortEpisodes(movie.episodes || []);
    
    // Inject Server Quốc tế (VidLink) if TMDB ID is available
    if (movie.tmdb?.id) {
      const tmdbId = movie.tmdb.id.toString();
      const isTv = movie.tmdb.type === "tv" || (movie.episodes?.[0]?.server_data?.length || 0) > 1;
      
      const primaryColor = "B20710"; // theme-primary red
      const secondaryColor = "170000";
      const iconColor = "B20710";
      const icons = "vid";
      
      let vidLinkServerData = [];
      if (!isTv) {
        // Movie
        vidLinkServerData = [{
          name: "Full",
          slug: "full",
          filename: "Full",
          link: "",
          link_embed: `https://vidlink.pro/movie/${tmdbId}?primaryColor=${primaryColor}&secondaryColor=${secondaryColor}&iconColor=${iconColor}&icons=${icons}&autoplay=false`,
          link_m3u8: ""
        }];
      } else {
        // TV Show - Mirror the episodes from the first available server
        const baseServer = sortedEps[0];
        if (baseServer && baseServer.server_data) {
          const season = movie.tmdb.season || 1;
          vidLinkServerData = baseServer.server_data.map((ep: any, idx: number) => {
            const epNum = idx + 1;
            return {
              name: ep.name,
              slug: ep.slug,
              filename: ep.name,
              link: "",
              link_embed: `https://vidlink.pro/tv/${tmdbId}/${season}/${epNum}?primaryColor=${primaryColor}&secondaryColor=${secondaryColor}&iconColor=${iconColor}&icons=${icons}&autoplay=false`,
              link_m3u8: ""
            };
          });
        }
      }
      
      if (vidLinkServerData.length > 0) {
        sortedEps.push({
          server_name: "Server Quốc tế (VidLink)",
          server_data: vidLinkServerData
        });
      }
    }
    
    setEpisodes(sortedEps);
    setCurrentOriginName(movie.origin_name);
  }, [movie.slug, movie.origin_name, movie.episodes, movie.tmdb]);




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
      <div className="relative w-full aspect-video overflow-hidden bg-zinc-950 group">
        <img
          src={currentBackdropUrl}
          alt={movie.name}
          className={`w-full h-full object-cover transition-opacity duration-300 ease-in-out cursor-pointer md:cursor-default ${backdropFade ? "opacity-100" : "opacity-0"}`}
          onClick={() => { if (window.innerWidth < 768 && availableBackdrops.length > 1) toggleBackdrop(); }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent pointer-events-none" />
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
          {/* Poster */}
          <div className="hidden md:block">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-2xl group bg-zinc-900">
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
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6">
            {/* Mobile Poster */}
            <div className="md:hidden">
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-2xl max-w-[200px] group bg-zinc-900 cursor-pointer" onClick={() => { if (availablePosters.length > 1) togglePoster(); }}>
                <img
                  src={currentPosterUrl}
                  alt={movie.name}
                  className={`w-full h-full object-cover transition-opacity duration-300 ease-in-out ${posterFade ? "opacity-100" : "opacity-0"}`}
                />
              </div>
            </div>


            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {movie.name}
              </h1>
              {currentOriginName && (
                <p className="text-lg text-zinc-400">{currentOriginName}</p>
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
                  {movie.slug && historyItem && (
                    <Link
                      href={`/xem-phim/${movie.slug}?tap=${historyItem.currentEpisodeIndex + 1}&server=${historyItem.currentServerIndex}`}
                      className="inline-flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-8 py-3 rounded-lg transition-colors w-fit shadow-lg shadow-zinc-900/20 active:scale-95 border border-zinc-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                      Xem tiếp tập {historyItem.currentEpisodeName || historyItem.currentEpisodeIndex + 1}
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
                        const isWatched = historyItem?.currentServerIndex === sIdx && historyItem?.currentEpisodeIndex === idx;
                        return (
                          <Link
                            key={`${episode.slug}-${idx}`}
                            href={`/xem-phim/${movie.slug}?tap=${idx + 1}&server=${sIdx}`}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-center cursor-pointer border ${
                              isWatched 
                                ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-900/20" 
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
