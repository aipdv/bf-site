// Pages serves static files without byte-range support. Safari (macOS, iOS)
// will not play a video unless the server answers Range requests with 206.
// This function serves the launch video with Range support. It runs on the
// server only; the page itself still ships no JavaScript.
export async function onRequest({ request, env }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const asset = await env.ASSETS.fetch(new URL(request.url));
  if (!asset.ok) return asset;

  const body = await asset.arrayBuffer();
  const size = body.byteLength;
  const headers = new Headers({
    'Content-Type': 'video/mp4',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=86400',
  });

  const m = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('Range') || '');
  if (!m || (m[1] === '' && m[2] === '')) {
    headers.set('Content-Length', String(size));
    return new Response(request.method === 'HEAD' ? null : body, { status: 200, headers });
  }

  // "bytes=a-b", "bytes=a-" or the suffix form "bytes=-n".
  let start = m[1] === '' ? Math.max(0, size - Number(m[2])) : Number(m[1]);
  let end = m[1] === '' || m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  if (start > end || start >= size) {
    headers.set('Content-Range', `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  return new Response(request.method === 'HEAD' ? null : body.slice(start, end + 1), { status: 206, headers });
}
