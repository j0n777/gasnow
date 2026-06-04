import React from 'react';

/**
 * Editorial content section — required for Google AdSense approval.
 * AdSense rejects pages with only widgets/numbers as "screens used for
 * alerts, navigation or behavioral purposes". This section provides the
 * publisher-grade textual content that ad placements require to be served.
 */
export const AboutAndMethodology: React.FC = () => {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="prose prose-invert max-w-none dark:prose-invert mt-12 space-y-8 text-foreground"
    >
      <div>
        <h2 id="about-heading" className="text-2xl md:text-3xl font-bold mb-3">
          About GasNow — Real-Time Crypto Gas &amp; Market Intelligence
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          GasNow is a free, open, real-time dashboard for cryptocurrency transaction
          costs and market sentiment. It surfaces the price of sending a transaction on
          the Ethereum network (in Gwei) and the Bitcoin network (in sat/vB) alongside
          a curated set of market indicators that retail crypto users actually use:
          the Fear &amp; Greed Index, the Market Stress Index (MSI), an aggregate
          Leverage Index, the Bitcoin halving-cycle phase, trending tokens and crypto
          news. No account, no paywall, no email harvesting. The site is independent
          and community-maintained — it is not affiliated with the original
          <span> </span>gasnow.org service operated by Sparkpool which was discontinued
          in 2021.
        </p>
      </div>

      <div>
        <h3 className="text-xl md:text-2xl font-semibold mb-2">
          Why gas fees matter
        </h3>
        <p className="text-base leading-relaxed text-muted-foreground">
          Every interaction with a public blockchain costs money. On Ethereum, the
          unit is <em>gas</em> — a measure of computational effort — and the fee per
          unit is denominated in Gwei (one billionth of one ether). Sending a simple
          ETH transfer costs roughly 21,000 gas; calling a complex DeFi contract can
          consume hundreds of thousands. Multiplied by the current network gas price,
          fees can swing from a few cents during quiet periods to tens of dollars
          during congestion. Knowing the live price before you click "confirm" is
          the difference between paying $0.40 and $35 for the same swap. On Bitcoin
          the equivalent unit is satoshis per virtual byte (sat/vB), and the same
          principle applies: fees rise when the mempool is full.
        </p>
        <p className="text-base leading-relaxed text-muted-foreground mt-3">
          GasNow shows three tiers — <strong>Slow</strong>, <strong>Standard</strong>{' '}
          and <strong>Fast</strong> — corresponding to roughly 5-minute, 1-minute and
          next-block inclusion targets. Each tier is converted to a USD-equivalent
          cost using the current spot price of ETH or BTC, so users can decide
          whether the transaction is worth executing now or worth waiting.
        </p>
      </div>

      <div>
        <h3 className="text-xl md:text-2xl font-semibold mb-2">
          Market Stress Index (MSI) — methodology
        </h3>
        <p className="text-base leading-relaxed text-muted-foreground">
          The Market Stress Index is a proprietary composite indicator scoring
          structural risk in the broader crypto market from <strong>0 (low stress)</strong>{' '}
          to <strong>100 (high stress)</strong>. It blends six normalised inputs:
        </p>
        <ul className="list-disc list-inside text-base leading-relaxed text-muted-foreground space-y-1 mt-2">
          <li>
            <strong>Perpetual funding rates</strong> across major derivatives venues —
            high positive funding signals long-side crowding.
          </li>
          <li>
            <strong>Open-interest deltas</strong> — a sharp 24-hour rise in OI combined
            with stretched funding is a classic late-cycle signature.
          </li>
          <li>
            <strong>Realised volatility</strong> on a rolling window — captures
            regime shifts and price swings.
          </li>
          <li>
            <strong>Recent liquidation flow</strong> — large directional liquidation
            clusters raise the stress score because they indicate forced selling.
          </li>
          <li>
            <strong>Bitcoin dominance change</strong> — abrupt shifts between BTC and
            altcoin capital often precede macro reversals.
          </li>
          <li>
            <strong>Stablecoin supply change</strong> — net mint/burn of USDT and USDC
            proxies the willingness of capital to enter or exit risk.
          </li>
        </ul>
        <p className="text-base leading-relaxed text-muted-foreground mt-3">
          Each input is z-scored against a 90-day rolling window, clipped to a fixed
          range, and equal-weighted into the composite. The score updates every five
          minutes. Like any composite, it is a heuristic and not financial advice —
          it is most useful as a relative gauge over time rather than as a single
          point-in-time prediction.
        </p>
      </div>

      <div>
        <h3 className="text-xl md:text-2xl font-semibold mb-2">
          Leverage Index — what it measures
        </h3>
        <p className="text-base leading-relaxed text-muted-foreground">
          The Leverage Index gauges how much directional risk the derivatives market
          is holding relative to the underlying spot market. It is computed as
          aggregate perpetual open interest (across the major venues we track)
          divided by the total spot market capitalisation. A high reading suggests
          the market is over-leveraged and vulnerable to forced unwinds; a low
          reading suggests room for new positioning to expand. Read together with
          MSI it forms a "stress + leverage" pair: high MSI on high leverage is
          the most dangerous configuration historically.
        </p>
      </div>

      <div>
        <h3 className="text-xl md:text-2xl font-semibold mb-2">
          Bitcoin Halving Cycle — interpretation
        </h3>
        <p className="text-base leading-relaxed text-muted-foreground">
          Bitcoin issuance halves roughly every four years (every 210,000 blocks),
          and the four cycles since 2012 each followed a recognisable rhythm:
          accumulation, expansion (bull), distribution, contraction (bear). The
          Bitcoin Cycle widget locates the current block height inside the
          prevailing halving cycle and classifies the dominant phase using
          historical analogs. It is a heuristic — past cycles do not guarantee
          future ones — but it provides useful context for interpreting current
          price action against the long-running on-chain rhythm.
        </p>
      </div>

      <div>
        <h3 className="text-xl md:text-2xl font-semibold mb-2">
          Fear &amp; Greed Index — how to read it
        </h3>
        <p className="text-base leading-relaxed text-muted-foreground">
          The Fear &amp; Greed Index condenses market sentiment into a single number
          from 0 (Extreme Fear) to 100 (Extreme Greed), drawing on volatility,
          momentum, social media activity, dominance and survey signals. We surface
          the value provided by Alternative.me alongside our other indicators so
          users can quickly cross-check the structural picture (MSI, Leverage) with
          the sentiment picture (Fear &amp; Greed). When the two diverge — for
          example, low MSI with extreme greed — the divergence itself is the signal.
        </p>
      </div>

      <div>
        <h3 className="text-xl md:text-2xl font-semibold mb-2">
          Data sources and refresh cadence
        </h3>
        <p className="text-base leading-relaxed text-muted-foreground">
          GasNow aggregates public data from several reputable upstream providers:
          Mempool.space and Beaconcha.in for transaction-fee oracles, CoinGecko and
          Binance for spot prices, Alternative.me for Fear &amp; Greed, and a set
          of public derivatives endpoints for funding, open interest and
          liquidations. Server-side caches are short — gas data refreshes every
          30 seconds, prices every three minutes, market sentiment every five
          minutes, news every thirty minutes. Every endpoint we surface is
          available through a free public JSON API at
          <code className="mx-1 px-1 py-0.5 rounded bg-muted text-foreground">/api_v2</code>
          so developers can build their own integrations.
        </p>
      </div>
    </section>
  );
};
