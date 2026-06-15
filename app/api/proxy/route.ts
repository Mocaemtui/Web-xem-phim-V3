import { NextRequest, NextResponse } from 'next/server';
import { fetchAPI } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint') || '';
    const baseUrl = searchParams.get('baseUrl') || undefined;
    const revalidateStr = searchParams.get('revalidate');
    const revalidate = revalidateStr ? parseInt(revalidateStr, 10) : 3600;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    const data = await fetchAPI(endpoint, revalidate, baseUrl);
    return NextResponse.json(data);
  } catch (error) {
    console.error('API proxy handler error:', error);
    return NextResponse.json({ error: 'Internal server error during proxy fetch' }, { status: 500 });
  }
}
