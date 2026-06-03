/**
 * IndexNow ping — notifies Bing, Yandex, Naver, Seznam and other IndexNow
 * consumers that URLs were created or updated.
 *
 * Docs: https://www.indexnow.org/documentation
 *
 * Usage:
 *   npx tsx scripts/indexnow-ping.ts
 *   npx tsx scripts/indexnow-ping.ts https://gasnow.tools/ https://gasnow.tools/llms.txt
 *
 * If no URLs are passed, pings the homepage + llms.txt + llms-full.txt + sitemap.
 *
 * The key file MUST be reachable at https://gasnow.tools/<KEY>.txt with the
 * key as its only content. We commit it under public/<KEY>.txt.
 */

const HOST = 'gasnow.tools';
const KEY = 'e215998a6fdd355bd75e7a7525f84961';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const defaultUrls = [
  `https://${HOST}/`,
  `https://${HOST}/llms.txt`,
  `https://${HOST}/llms-full.txt`,
  `https://${HOST}/sitemap.xml`,
];

const argUrls = process.argv.slice(2);
const urlList = argUrls.length > 0 ? argUrls : defaultUrls;

const body = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList,
};

async function main() {
  const res = await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (res.ok || res.status === 202) {
    console.log(`✅ IndexNow accepted ${urlList.length} URL(s) (HTTP ${res.status})`);
    urlList.forEach((u) => console.log(`   - ${u}`));
  } else {
    console.error(`❌ IndexNow failed: HTTP ${res.status}`);
    console.error(text);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('IndexNow ping crashed:', e);
  process.exit(1);
});
