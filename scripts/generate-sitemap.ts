import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// ESM Dirname logic
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const DOMAIN = 'https://gasnow.tools';
const SITEMAP_PATH = path.resolve(__dirname, '../public/sitemap.xml');
const TODAY = new Date().toISOString().slice(0, 10);

type Url = {
  loc: string;
  priority: number;
  changefreq: string;
  hreflang?: boolean;
  images?: { loc: string; title: string; caption?: string }[];
};

// NOTE: GasNow is currently a single-page dashboard. Adding ?news=X or
// ?blockchain=X URLs here causes duplicate-content penalties because the SPA
// doesn't actually render distinct pages per query string. Keep this list
// minimal until React Router (or per-route prerender) lands.
const urls: Url[] = [
  {
    loc: '/',
    priority: 1.0,
    changefreq: 'always',
    hreflang: true,
    images: [
      {
        loc: 'https://storage.googleapis.com/gpt-engineer-file-uploads/8GP29eTmvBO0Kqf0CrHfX8Rb2hI3/social-images/social-1763601573739-gasnow%20perfil.png',
        title: 'GasNow Dashboard - Real-time Crypto Gas Fees & Market Analytics',
        caption: 'Live Ethereum and Bitcoin gas tracker with market sentiment indices',
      },
      { loc: `${DOMAIN}/images/gasnow-icon.png`, title: 'GasNow Logo' },
      { loc: `${DOMAIN}/images/eth-icon.png`, title: 'Ethereum Gas Tracker' },
      { loc: `${DOMAIN}/images/btc-icon.png`, title: 'Bitcoin Transaction Fee Tracker' },
    ],
  },
  // Also surface the LLM-facing entry points so they show up in Bing/Google sitemap
  { loc: '/llms.txt', priority: 0.5, changefreq: 'weekly' },
  { loc: '/llms-full.txt', priority: 0.5, changefreq: 'weekly' },
];

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const renderUrl = (u: Url) => {
  const full = u.loc.startsWith('http') ? u.loc : `${DOMAIN}${u.loc}`;
  const hreflang = u.hreflang
    ? `
    <xhtml:link rel="alternate" hreflang="en" href="${DOMAIN}/" />
    <xhtml:link rel="alternate" hreflang="pt" href="${DOMAIN}/?lang=pt" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${DOMAIN}/" />`
    : '';
  const images = (u.images ?? [])
    .map(
      (img) => `
    <image:image>
      <image:loc>${escapeXml(img.loc)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>${
        img.caption ? `\n      <image:caption>${escapeXml(img.caption)}</image:caption>` : ''
      }
    </image:image>`,
    )
    .join('');
  return `  <url>
    <loc>${escapeXml(full)}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${hreflang}${images}
  </url>`;
};

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(renderUrl).join('\n')}
</urlset>
`;

fs.writeFileSync(SITEMAP_PATH, sitemap);
console.log(`✅ Sitemap generated at ${SITEMAP_PATH} with ${urls.length} URLs (lastmod=${TODAY})`);
