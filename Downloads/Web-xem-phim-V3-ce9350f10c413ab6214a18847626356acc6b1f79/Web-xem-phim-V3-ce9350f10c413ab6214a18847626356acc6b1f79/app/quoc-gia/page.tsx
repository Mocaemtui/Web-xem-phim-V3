import Link from "next/link";
import SectionTitle from "@/components/SectionTitle";
import { getQuocGia } from "@/lib/api";

export default async function QuocGiaPage() {
  const quocGiaData = await getQuocGia();

  return (
    <div className="container mx-auto px-4 py-8">
      <SectionTitle title="Quốc gia" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {quocGiaData?.data?.items?.map((country) => (
          <Link
            key={country.id}
            href={`/quoc-gia/${country.slug}`}
            className="p-4 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors text-center"
          >
            <span className="text-white font-medium">{country.name}</span>
          </Link>
        )) || []}
      </div>
    </div>
  );
}
