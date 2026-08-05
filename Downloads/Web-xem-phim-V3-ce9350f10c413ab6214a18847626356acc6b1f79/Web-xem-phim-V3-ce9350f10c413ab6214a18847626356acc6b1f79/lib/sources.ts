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

// PhimAPI (KKPhim) là nguồn chính với nhiều tính năng nâng cao
// Ophim đóng vai trò dự phòng khi PhimAPI gặp vấn đề
export const PRIMARY_SOURCE = MOVIE_SOURCES.PHIMAPI;
