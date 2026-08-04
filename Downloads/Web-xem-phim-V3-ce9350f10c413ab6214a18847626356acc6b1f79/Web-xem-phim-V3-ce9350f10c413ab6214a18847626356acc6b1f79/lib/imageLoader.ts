export default function myImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // Bỏ qua nếu là ảnh cục bộ hoặc data URI
  if (src.startsWith("/") || src.startsWith("data:")) return src;
  // Nếu là ảnh từ TMDB, sử dụng API resize gốc của TMDB
  if (src.includes("image.tmdb.org")) {
    if (width <= 342) return src.replace("/original/", "/w342/");
    if (width <= 500) return src.replace("/original/", "/w500/");
    if (width <= 780) return src.replace("/original/", "/w780/");
    return src;
  }

  // Tạm thời tắt proxy CDN khác do bị block 404/403
  // Trả về URL gốc trực tiếp
  return src;
}
