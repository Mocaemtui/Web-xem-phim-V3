export const MOVIE_SOURCES = {
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

// Đặt PhimAPI làm Nguồn chính (Primary Source) để có ảnh WEBP siêu nhẹ và metadata chuẩn.
// Nguồn C sẽ đóng vai trò dự phòng và ưu tiên tốc độ stream video trong trang xem phim.
export const PRIMARY_SOURCE = MOVIE_SOURCES.PHIMAPI;
