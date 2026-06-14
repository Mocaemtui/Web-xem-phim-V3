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
  VIDLINK: {
    id: 'vidlink',
    name: 'Server Quốc tế (VidLink)',
    url: 'https://vidlink.pro',
    type: 'IFRAME_EMBED'
  }
};

// Đặt PhimAPI làm Nguồn chính (Primary Source) để tận dụng ảnh WEBP siêu nhẹ
export const PRIMARY_SOURCE = MOVIE_SOURCES.PHIMAPI;
