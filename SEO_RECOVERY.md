# SEO Recovery — Correcting "GasNow shut down in 2021"

Google AI Overview, Gemini, Perplexity and similar surfaces are currently conflating **gasnow.tools** (this project, active) with the unrelated **gasnow.org** (Sparkpool, discontinued 2021). This document tracks both the in-code defenses (already shipped) and the manual actions needed to flip the public narrative.

---

## A. What the code already says (shipped)

1. **`index.html` / `dist/index.html`**
   - Title now leads with `Active Crypto Gas Tracker (gasnow.tools)`.
   - Meta description explicitly states "active and live in 2026" and disambiguates from the 2021 gasnow.org.
   - **`<noscript>` block** with full About / Status / Disambiguation content — visible to crawlers that do not execute JS (AI Overview content fetcher, GPTBot, Claude-Web, Perplexity, etc.).
   - Additional `Organization` JSON-LD with `foundingDate: 2021`, status reaffirmation, knowsAbout, sameAs.
   - Additional `FAQPage` JSON-LD with explicit questions:
     - "Is GasNow still active in 2026?"
     - "Did GasNow shut down?"
     - "What is the relationship between gasnow.tools and the old gasnow.org?"
     - "Where can I track Ethereum gas prices in real time today?"

2. **`public/llms.txt` and `public/llms-full.txt`**
   - First paragraph now opens with `Status: ACTIVE`.
   - `llms-full.txt` has a dedicated section `0. Disambiguation — Read First` that tells LLMs how to correct the misattribution.

3. **`public/sitemap.xml`** — image sitemap + hreflang, `lastmod` regenerated on every build via the `prebuild` hook.

4. **`public/robots.txt`** — AI bots (Googlebot, Google-Extended, GPTBot, ChatGPT-User, Claude-Web, anthropic-ai, PerplexityBot, OAI-SearchBot, etc.) explicitly allowed.

5. **`public/.well-known/security.txt`** — RFC 9116 contact for security reporters; signals an actively maintained property.

---

## B. Manual actions you need to take

> Code changes alone won't move the AI Overview. The single highest-leverage action is **clicking "Feedback" on the AI Overview itself** while logged into the same Google account that owns the Search Console property — multiple such feedbacks accelerate corrections.

### B.1 — Google: file feedback on the AI Overview (highest priority)

1. Search `gasnow` on google.com from a logged-in Chrome session.
2. Open the AI Overview box.
3. Click the three-dot menu (or "Feedback" link at the bottom of the box).
4. Choose **"Inaccurate"** and add this text (paste it verbatim — being concrete and citing your own canonical URL helps):

   > The AI Overview confuses two different projects. The shutdown in 2021 refers to gasnow.org (Sparkpool / Taichi Network). The current GasNow at https://gasnow.tools/ is a separate, independent, open-source project that is active and continuously updated — see https://gasnow.tools/llms.txt and the FAQ schema on the page. Please update the overview to reference gasnow.tools as an active service.

5. Repeat from 2–3 different signed-in browsers / accounts over the next few days. Google's AI Overview corrections weight repeated, specific reports.

### B.2 — Google Search Console

1. Verify `gasnow.tools` as a property: https://search.google.com/search-console (HTML tag method — paste the token into the placeholder we already left at `index.html` line ~25: `<!-- <meta name="google-site-verification" content="REPLACE_WITH_GSC_TOKEN" /> -->`. Uncomment and replace).
2. Submit `https://gasnow.tools/sitemap.xml`.
3. Use **URL Inspection** on `https://gasnow.tools/` and click **Request indexing**.
4. Check the **Removals → Outdated content** tool. Submit any cached snippets that still describe the site as inactive.
5. Under **Enhancements**, confirm the FAQ rich result is detected. The new schema introduces 4 Q&A items.

### B.3 — Bing Webmaster Tools

1. Verify the property at https://www.bing.com/webmasters/ (paste the token into the `msvalidate.01` placeholder already in `index.html`).
2. Submit the sitemap.
3. Click **Submit URL** on the homepage.
4. Enable **IndexNow** — Bing gives you a key file like `<hex>.txt`. Drop it into `public/` (and `dist/`) and commit. Then ping IndexNow on each significant content change:
   ```bash
   curl "https://api.indexnow.org/IndexNow?url=https://gasnow.tools/&key=<your-key>"
   ```
   Bing, Yandex, Naver and Seznam consume IndexNow.

### B.4 — Backlinks and external corroboration (this is what actually moves AI Overviews)

AI Overviews lean heavily on **third-party authoritative mentions**. Action items, in order of leverage:

1. **Wikipedia / Wikidata**: if there is a Wikidata entry for the original GasNow, create a new item for `gasnow.tools` with `inception: 2021`, `instance of: cryptocurrency tool`, `official website: https://gasnow.tools/`, and explicitly **not** linked to the old `gasnow.org` Wikidata item (different Q-id). Wikidata is the single largest input to Google's Knowledge Graph.
2. **CoinGecko / CoinMarketCap**: both maintain "tools / explorers" categories. Submit gasnow.tools as a free gas tracker.
3. **Awesome lists on GitHub**: `awesome-ethereum`, `awesome-blockchain-developer`, `awesome-defi` — submit PRs adding gasnow.tools.
4. **Crypto media outlets** — a single short article on Decrypt, Cointelegraph, BeInCrypto or The Block describing "gasnow.tools relaunches as community-run gas tracker" will rewrite the AI Overview within days.
5. **Reddit / X**: pinned posts on `r/ethereum`, `r/ethfinance`, `r/CryptoCurrency` and a thread from `@gasnow_tools` clarifying the relaunch (with the link). Reddit is heavily ingested into Google's AI surfaces.
6. **Product Hunt** launch (or relaunch entry).

### B.5 — Verify with the right tools

| Surface | URL to test |
|---|---|
| Google Rich Results | https://search.google.com/test/rich-results?url=https%3A%2F%2Fgasnow.tools%2F |
| Schema validator | https://validator.schema.org/?url=https%3A%2F%2Fgasnow.tools%2F |
| Bing URL Inspection | inside Bing Webmaster Tools |
| Mobile-Friendly | https://search.google.com/test/mobile-friendly?url=https%3A%2F%2Fgasnow.tools%2F |
| PageSpeed Insights | https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fgasnow.tools |
| LLM crawl test (no JS) | `curl -A "GPTBot" https://gasnow.tools/ \| grep -i "status: active"` should match |

### B.6 — Optional but useful

- Add `@gasnow_tools` posts (active, recent dates) — many AI surfaces ingest social signals.
- Issue a yearly "GasNow operational status" blog post or GitHub release note so there is a fresh, dated, indexable artifact every year.
- Consider an `Article` JSON-LD blog post titled "GasNow is alive: meet gasnow.tools" hosted at `/about` — the more dated, signed content you publish, the more confidently AI surfaces will state the site is active.

---

## C. Expected timeline

- **48–72 h** — Google reindexes the homepage; new title, FAQ rich snippets and disambiguation appear in organic results.
- **1–3 weeks** — AI Overview re-summarizes the page after enough fresh fetches and (ideally) a few backlinks or a Wikidata entry; the "shut down in 2021" line gets replaced or clarified.
- **4–8 weeks** — Knowledge Graph entity stabilizes around `gasnow.tools` as the primary entity for the search term "gasnow".
