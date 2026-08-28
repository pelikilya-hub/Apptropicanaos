// robots.txt только для своего домена. Один sitemap на площадку, не общий.
import type { APIRoute } from 'astro';
import { loadLanding } from '../../packages/config/load.mjs';

export const GET: APIRoute = () => {
  const landing = loadLanding();
  const lines = ['User-agent: *', 'Allow: /'];

  if (landing.origin) {
    lines.push('', `Sitemap: ${landing.origin}/sitemap.xml`);
  } else {
    // Домен ещё не назначен — на прод такая сборка не проходит валидацию,
    // но превью не должно попадать в индекс.
    lines.splice(1, 1, 'Disallow: /');
  }

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
