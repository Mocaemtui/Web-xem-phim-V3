import SearchGrid from "@/components/SearchGrid";
import SectionTitle from "@/components/SectionTitle";
import { searchPhim } from "@/lib/api";

interface PageProps {
  params: Promise<{
    keyword: string;
  }>;
}

export default async function SearchPage({ params }: PageProps) {
  const { keyword } = await params;
  const decodedKeyword = decodeURIComponent(keyword);
  const searchResults = await searchPhim(decodedKeyword);

  return (
    <div className="container mx-auto px-4 py-8 pl-16">
      <SectionTitle title={`Kết quả tìm kiếm: "${decodedKeyword}"`} />
      
      <SearchGrid 
        key={decodedKeyword}
        initialMovies={searchResults?.data?.items || []} 
        keyword={decodedKeyword} 
      />
    </div>
  );
}
