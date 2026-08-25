export const MOVIE_SOURCES = {
  OPHIM: {
    id: 'ophim',
    name: 'Ophim',
    url: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ophim1.com',
    type: 'V1_STANDARD'
  },
  PHIMAPI: {
    id: 'phimapi',
    name: 'PhimAPI',
    url: 'https://phimapi.com',
    type: 'V1_STANDARD'
  },
  NGUONC: {
    id: 'nguonc',
    name: 'Nguồn C',
    url: 'https://phim.nguonc.com',
    type: 'V2_NGUONC'
  }
};

// TEST: Tạm đổi sang Ophim để kiểm tra lỗi Vercel
export const PRIMARY_SOURCE = MOVIE_SOURCES.OPHIM;
