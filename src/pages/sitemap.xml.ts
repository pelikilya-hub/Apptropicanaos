// Sitemap ровно на этот домен. Склейка площадок запрещена.
import type { APIRoute } from 'astro';
import { loadLanding } from '../../packages/config/load.mjs';

export const GET: APIRoute = () => {
  const landing = loadLanding();
  const url = landing.canonical;

  const body = url
    ? `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
  </url>
</urlset>
`
    : `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
