import { notFound } from "next/navigation";
import WatchPageClient from "@/components/WatchPageClient";
import { getChiTietPhim, getBackdropUrl } from "@/lib/api";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
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
  const posterUrl = getBackdropUrl(movie);



  return (
    <>
      <WatchPageClient movie={movie} posterUrl={posterUrl} />


    </>
  );
}
