import { ASSETS } from '../dist/embedded-assets.js';
import { RANKINGS } from '../dist/embedded-rankings.js';

function base64ToUint8Array(b64: string) {
  // global atob available in Workers
  const binary = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
  const len = binary.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    let pathname = url.pathname;
    if (pathname === '/') pathname = '/index.html';

    // Serve embedded static assets
    if (ASSETS[pathname]) {
      const { data, type } = (ASSETS as any)[pathname];
      const body = base64ToUint8Array(data);
      return new Response(body, { headers: { 'content-type': type } });
    }

    // Serve API: latest rankings
    if (pathname === '/api/rankings') {
      // RANKINGS is an object filename -> parsed JSON
      const filenames = Object.keys(RANKINGS).filter((n) => n.endsWith('.json'));
      if (filenames.length === 0) {
        return new Response(JSON.stringify({ error: 'No ranking files found.' }), { status: 500, headers: { 'content-type': 'application/json' } });
      }
      const latest = filenames.sort().reverse()[0];
      const data = (RANKINGS as any)[latest];
      return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
    }

    // Fallback: 404
    return new Response('Not Found', { status: 404 });
  }
};
