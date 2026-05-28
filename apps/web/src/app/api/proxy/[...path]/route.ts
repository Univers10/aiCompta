import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function handler(req: NextRequest, context: { params: Promise<{ path: string[] }> | { path: string[] } }) {
  const params = await Promise.resolve(context.params);
  const path = params.path.join('/');
  const url = `${API_URL}/api/v1/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!['host', 'connection'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.arrayBuffer() : undefined;

  try {
    const apiRes = await fetch(url, {
      method: req.method,
      headers,
      body: body ? Buffer.from(body) : undefined,
    });

    const resHeaders = new Headers();
    const excludedHeaders = ['transfer-encoding', 'content-encoding', 'content-length'];
    apiRes.headers.forEach((value, key) => {
      if (!excludedHeaders.includes(key.toLowerCase())) {
        resHeaders.set(key, value);
      }
    });

    const resBody = apiRes.status === 204 ? null : await apiRes.arrayBuffer();

    return new NextResponse(resBody, {
      status: apiRes.status,
      headers: resHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to proxy request' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
