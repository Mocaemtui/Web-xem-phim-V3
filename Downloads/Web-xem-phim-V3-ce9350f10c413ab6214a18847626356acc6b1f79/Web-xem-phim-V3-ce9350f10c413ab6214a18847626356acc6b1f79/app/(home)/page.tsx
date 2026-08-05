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

export default function Home() {
  return (
    <div className="overflow-hidden bg-black pb-16">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Mocaemtui</h1>
          <p className="text-zinc-400 text-lg">Trang chủ đang được điều tra</p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {FALLBACK_MOVIES.map((movie) => (
              <div key={movie._id} className="bg-zinc-900 rounded-lg overflow-hidden">
                <img 
                  src={movie.poster_url} 
                  alt={movie.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-3">
                  <h3 className="text-white text-sm font-medium truncate">{movie.name}</h3>
                  <p className="text-zinc-400 text-xs mt-1">{movie.year}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
