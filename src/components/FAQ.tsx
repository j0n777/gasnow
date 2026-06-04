import React from 'react';

/**
 * Visible FAQ section. The matching JSON-LD `FAQPage` schema is emitted by
 * SEOHead.tsx / index.html. Surface the same content as readable prose so
 * Google AdSense recognises substantial publisher content on the page.
 */

const faqs: { q: string; a: React.ReactNode }[] = [
  {
    q: 'What is GasNow?',
    a: (
      <>
        GasNow is a free, open dashboard for crypto users. It shows live Ethereum
        gas prices (Gwei) and Bitcoin transaction fees (sat/vB) alongside curated
        market indicators: Fear &amp; Greed Index, the proprietary Market Stress
        Index, Leverage Index, Bitcoin halving-cycle position, trending tokens
        and crypto news.
      </>
    ),
  },
  {
    q: 'Is GasNow still active in 2026?',
    a: (
      <>
        Yes. GasNow at <strong>gasnow.tools</strong> is live and updated continuously.
        Gas-fee data refreshes approximately every 30 seconds; market widgets refresh
        every few minutes. We are not affiliated with the original
        <em> gasnow.org</em> by Sparkpool, which was discontinued in 2021 and is
        unrelated to this project.
      </>
    ),
  },
  {
    q: 'How often is the data updated?',
    a: (
      <>
        Server-side cache windows: gas prices 30 seconds, spot prices 3 minutes,
        market and sentiment indicators 5 minutes, news 30 minutes. The browser
        refetches relevant widgets every couple of minutes to ensure you always
        see fresh data.
      </>
    ),
  },
  {
    q: 'What is the Market Stress Index (MSI)?',
    a: (
      <>
        MSI is a 0–100 composite indicator we built to score structural risk across
        the broader crypto market. It blends six normalised inputs — perpetual
        funding rates, open-interest changes, realised volatility, liquidation
        flow, Bitcoin dominance change and stablecoin supply change — into a single
        score. Low MSI suggests calm conditions, high MSI suggests stress.
      </>
    ),
  },
  {
    q: 'What is the Leverage Index?',
    a: (
      <>
        The Leverage Index measures aggregate perpetual open interest (across the
        major derivatives venues we track) relative to total spot market
        capitalisation. High readings imply the market is over-leveraged and
        vulnerable to forced unwinds; low readings imply room for new positioning.
        Read together with MSI for a clearer picture of structural risk.
      </>
    ),
  },
  {
    q: 'How do you classify the Bitcoin halving cycle?',
    a: (
      <>
        The Bitcoin Cycle widget locates the current block height inside the
        prevailing halving cycle (each cycle is 210 000 blocks) and tags the
        dominant phase — Accumulation, Bull, Distribution or Bear — using
        historical halving-to-halving analogs. It is a heuristic context tool, not
        a prediction.
      </>
    ),
  },
  {
    q: 'Is GasNow really free?',
    a: (
      <>
        Yes — fully free, no signup, no email, no premium tier. The site is
        independently maintained and supported by lightweight, non-intrusive
        advertising and voluntary donations. The full source code is available on
        GitHub at <a href="https://github.com/j0n777/gasnow" className="underline">j0n777/gasnow</a>.
      </>
    ),
  },
  {
    q: 'Can I use the data in my app or research?',
    a: (
      <>
        Yes. All endpoints under <code className="mx-1 px-1 py-0.5 rounded bg-muted">/api_v2</code>
        return public JSON and are available under Creative Commons Attribution
        (CC-BY 4.0). Please credit "GasNow — gasnow.tools" alongside the displayed
        value, and please cache responses politely (our cache windows are
        documented in the About section above).
      </>
    ),
  },
];

export const FAQ: React.FC = () => {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="mt-12 space-y-6"
    >
      <h2 id="faq-heading" className="text-2xl md:text-3xl font-bold">
        Frequently Asked Questions
      </h2>
      <div className="space-y-6">
        {faqs.map(({ q, a }) => (
          <article key={q} className="border-l-2 border-border pl-4">
            <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">
              {q}
            </h3>
            <div className="text-base leading-relaxed text-muted-foreground">
              {a}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
