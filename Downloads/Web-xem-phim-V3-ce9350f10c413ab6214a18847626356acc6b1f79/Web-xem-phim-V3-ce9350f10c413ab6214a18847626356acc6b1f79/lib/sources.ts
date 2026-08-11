export const MOVIE_SOURCES = {
  OPHIM: {
    id: 'ophim',
    name: 'Ophim',
    url: 'https://ophim1.com',
    type: 'V1_STANDARD'
  },
  PHIMAPI: {
    id: 'phimapi',
    name: 'PhimAPI',
    url: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://phimapi.com',
    type: 'V1_STANDARD'
  },
  NGUONC: {
    id: 'nguonc',
    name: 'Nguồn C',
    url: 'https://phim.nguonc.com',
    type: 'V2_NGUONC'
  }
};

// PhimAPI có thể không hoạt động ổn định trên Vercel (region/network issues)
// Tạm thời dùng Ophim làm nguồn chính để đảm bảo Vercel hoạt động
export const PRIMARY_SOURCE = MOVIE_SOURCES.OPHIM;
