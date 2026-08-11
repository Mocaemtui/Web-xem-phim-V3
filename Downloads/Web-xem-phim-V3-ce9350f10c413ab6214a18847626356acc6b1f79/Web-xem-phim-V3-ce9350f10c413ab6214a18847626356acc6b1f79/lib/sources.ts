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
  }
};

// PhimAPI đã ngừng hoạt động (tất cả endpoint trả 404 từ 07/2026).
// Chuyển sang Ophim làm nguồn chính.
export const PRIMARY_SOURCE = MOVIE_SOURCES.OPHIM;
