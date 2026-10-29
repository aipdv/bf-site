// Pages serves static files without byte-range support. Safari (macOS, iOS)
// will not play a video unless the server answers Range requests with 206.
// This function serves the launch video with Range support. It runs on the
// server only; the page itself still ships no JavaScript.
function sliceStream(body, start, end) {
  const reader = body.getReader();
  let offset = 0;

  return new ReadableStream({
    async pull(controller) {
      while (offset <= end) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }

        const chunkStart = offset;
        offset += value.byteLength;
        if (offset <= start) continue;

        const from = Math.max(0, start - chunkStart);
        const to = Math.min(value.byteLength, end - chunkStart + 1);
        controller.enqueue(value.subarray(from, to));
        if (offset > end) {
          await reader.cancel();
          controller.close();
        }
        return;
      }
      await reader.cancel();
      controller.close();
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}

export async function onRequest({ request, env }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const asset = await env.ASSETS.fetch(new URL(request.url));
  if (!asset.ok) return asset;

  const size = Number(asset.headers.get('Content-Length'));
  if (!Number.isSafeInteger(size) || size < 0) {
    await asset.body?.cancel();
    return new Response(null, { status: 502 });
  }
  const headers = new Headers({
    'Content-Type': 'video/mp4',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=86400',
  });

  const m = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('Range') || '');
  if (!m || (m[1] === '' && m[2] === '')) {
    headers.set('Content-Length', String(size));
    if (request.method === 'HEAD') await asset.body?.cancel();
    return new Response(request.method === 'HEAD' ? null : asset.body, { status: 200, headers });
  }

  // "bytes=a-b", "bytes=a-" or the suffix form "bytes=-n".
  let start = m[1] === '' ? Math.max(0, size - Number(m[2])) : Number(m[1]);
  let end = m[1] === '' || m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  if (start > end || start >= size) {
    await asset.body?.cancel();
    headers.set('Content-Range', `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  if (request.method === 'HEAD') await asset.body?.cancel();
  return new Response(request.method === 'HEAD' ? null : sliceStream(asset.body, start, end), { status: 206, headers });
}
