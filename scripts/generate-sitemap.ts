
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';

// ESM Dirname logic
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const DOMAIN = 'https://gasnow.tools';
const SITEMAP_PATH = path.resolve(__dirname, '../public/sitemap.xml');

// Static Routes (GasNow is primarily a dashboard)
const urls = [
  { loc: '/', priority: 1.0, changefreq: 'always' },
  // News Categories (Deep Links)
  { loc: '/?news=bitcoin', priority: 0.8, changefreq: 'hourly' },
  { loc: '/?news=ethereum', priority: 0.8, changefreq: 'hourly' },
  { loc: '/?news=defi', priority: 0.7, changefreq: 'daily' },
  { loc: '/?news=nft', priority: 0.7, changefreq: 'daily' },
  { loc: '/?news=altcoins', priority: 0.7, changefreq: 'daily' },
];

// Generate XML
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${DOMAIN}${u.loc.startsWith('http') ? '' : u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

// Write
fs.writeFileSync(SITEMAP_PATH, sitemap);
console.log(`✅ Sitemap generated at ${SITEMAP_PATH} with ${urls.length} URLs`);
