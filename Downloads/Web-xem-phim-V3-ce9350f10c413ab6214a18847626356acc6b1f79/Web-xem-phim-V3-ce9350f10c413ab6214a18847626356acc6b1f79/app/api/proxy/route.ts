import { NextRequest, NextResponse } from 'next/server';
import { fetchAPI } from '@/lib/api';

export const runtime = 'edge';

const SOURCES = [
  'https://ophim1.com',
  'https://phim.nguonc.com',
  'https://phimapi.com'
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint') || '';
    const baseUrl = searchParams.get('baseUrl') || undefined;
    const revalidateStr = searchParams.get('revalidate');
    const revalidate = revalidateStr ? parseInt(revalidateStr, 10) : 0;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    let finalBaseUrl = baseUrl;
    if (baseUrl) {
      const SOURCE_MAP: Record<string, string> = {
        primary: 'https://ophim1.com',
        ophim: 'https://ophim1.com',
        backup: 'https://phimapi.com',
        phimapi: 'https://phimapi.com',
        nguonc: 'https://phim.nguonc.com'
      };
      const lowerVal = baseUrl.toLowerCase();
      if (SOURCE_MAP[lowerVal]) {
        finalBaseUrl = SOURCE_MAP[lowerVal];
      } else if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        // Attempt to decode base64
        try {
          const decoded = atob(baseUrl);
          if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
            finalBaseUrl = decoded;
          }
        } catch (e) {}
      }
    }

    // Try the requested source first
    let data = await fetchAPI(endpoint, revalidate, finalBaseUrl);
    
    // If failed and no specific baseUrl requested, try all sources with fallback
    if (!data && !baseUrl) {
      console.warn('Primary fetch failed, trying fallback sources');
      for (const source of SOURCES) {
        if (source === finalBaseUrl) continue; // Skip already tried
        console.log(`Trying fallback source: ${source}`);
        data = await fetchAPI(endpoint, revalidate, source);
        if (data) {
          console.log(`Success with fallback source: ${source}`);
          break;
        }
      }
    }

    const response = NextResponse.json(data);

    // Lưu Edge CDN cache để giải phóng tài nguyên CPU Serverless trên Vercel
    // Giảm stale-while-revalidate để tránh trả về cached response lỗi quá lâu
    // KHÔNG cache khi data là null hoặc có lỗi
    if (revalidate > 0 && data !== null) {
      response.headers.set(
        'Cache-Control',
        `public, s-maxage=${revalidate}, stale-while-revalidate=10`
      );
    } else {
      // Không cache response lỗi
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    }

    return response;
  } catch (error) {
    console.error('API proxy handler error:', error);
    return NextResponse.json({ error: 'Internal server error during proxy fetch' }, { status: 500 });
  }
}
