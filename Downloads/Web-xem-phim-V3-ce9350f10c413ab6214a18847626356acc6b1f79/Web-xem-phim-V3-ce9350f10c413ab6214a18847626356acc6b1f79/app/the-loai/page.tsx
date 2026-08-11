import Link from "next/link";
import SectionTitle from "@/components/SectionTitle";
import { getTheLoai } from "@/lib/api";

export default async function TheLoaiPage() {
  const theLoaiData = await getTheLoai();

  return (
    <div className="container mx-auto px-4 py-8">
      <SectionTitle title="Thể loại phim" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {theLoaiData?.data?.items?.map((genre) => (
          <Link
            key={genre.id}
            href={`/the-loai/${genre.slug}`}
            className="p-4 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors text-center"
          >
            <span className="text-white font-medium">{genre.name}</span>
          </Link>
        )) || []}
      </div>
    </div>
  );
}
