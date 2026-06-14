import { notFound } from "next/navigation";
import MovieDetail from "@/components/MovieDetail";
import { getChiTietPhim, getHinhAnhPhim, getPeoplesPhim } from "@/lib/api";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  if (!decodedSlug || decodedSlug === "undefined") {
    return {};
  }

  const movieData = await getChiTietPhim(decodedSlug);
  if (!movieData || !movieData.data || !movieData.data.item) {
    return {};
  }

  const movie = movieData.data.item;
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Mocaemtui";
  const title = `${movie.name} (${movie.year}) - Xem Phim ${movie.origin_name || ""} | ${siteName}`;
  const description = `Xem phim ${movie.name} (${movie.origin_name || ""}) - ${movie.year} ${movie.quality || "HD"} ${movie.lang || "Vietsub"}. ${movie.content ? movie.content.replace(/<[^>]*>/g, "").slice(0, 150) + "..." : "Xem phim online miễn phí chất lượng cao."}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: movie.thumb_url || movie.poster_url || "",
          alt: movie.name,
        },
      ],
    },
  };
}

export default async function MoviePage({ params }: PageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  if (!decodedSlug || decodedSlug === "undefined") {
    notFound();
  }

  const [movieData, imagesData, peoplesData] = await Promise.all([
    getChiTietPhim(decodedSlug),
    getHinhAnhPhim(decodedSlug),
    getPeoplesPhim(decodedSlug),
  ]);

  if (!movieData || !movieData.data || !movieData.data.item) {
    notFound();
  }

  const movie = movieData.data.item;



  return (
    <>
      <MovieDetail
        movie={movie}
        images={imagesData?.data || { images: [] }}
        peoples={peoplesData?.data || { peoples: [] }}
      />


    </>
  );
}
