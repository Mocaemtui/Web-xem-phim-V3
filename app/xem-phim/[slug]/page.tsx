import { notFound } from "next/navigation";
import WatchPageClient from "@/components/WatchPageClient";
import { getChiTietPhim, getPosterUrl } from "@/lib/api";

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
  const title = `Xem Phim ${movie.name} - ${movie.origin_name || ""} FULL HD | ${siteName}`;
  const description = `Xem phim online ${movie.name} (${movie.origin_name || ""}) - ${movie.year} ${movie.quality || "HD"} ${movie.lang || "Vietsub"} chất lượng cao, không giật lag.`;

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

export default async function WatchPage({ params }: PageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  if (!decodedSlug || decodedSlug === "undefined") {
    notFound();
  }

  const movieData = await getChiTietPhim(decodedSlug);

  if (!movieData || !movieData.data || !movieData.data.item) {
    notFound();
  }

  const movie = movieData.data.item;
  const posterUrl = getPosterUrl(movie);



  return (
    <>
      <WatchPageClient movie={movie} posterUrl={posterUrl} />


    </>
  );
}
