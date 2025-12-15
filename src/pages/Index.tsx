import { useState } from 'react';
import { Header } from '@/components/Header';
import { GasPriceCard } from '@/components/GasPriceCard';
import { NewsSection } from '@/components/NewsSection';
import { FearGreedWidget } from '@/components/FearGreedWidget';
import { MarketCycleWidget } from '@/components/MarketCycleWidget';
import { MarketStats } from '@/components/MarketStats';
import { TrendingTokens } from '@/components/TrendingTokens';
import { Sponsors } from '@/components/Sponsors';
import { StealthExWidget } from '@/components/StealthExWidget';
import { MarketStressWidget } from '@/components/MarketStressWidget';
import { LeveragePanel } from '@/components/LeveragePanel';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SEOHead } from '@/components/SEOHead';
import { useGasPrices } from '@/hooks/useGasPrices';

const Index = () => {
  const [selectedBlockchain, setSelectedBlockchain] = useState<'ethereum' | 'bitcoin'>('ethereum');
  const gasPrices = useGasPrices(selectedBlockchain);

  return (
    <ThemeProvider>
      <SEOHead />
      <div className="min-h-screen bg-background">
        <Header
          selectedBlockchain={selectedBlockchain}
          onBlockchainSelect={setSelectedBlockchain}
        />

        <main className="container mx-auto px-4 py-8 space-y-8" role="main">
          {/* 1. Gas Prices */}
          <section aria-labelledby="gas-fees-heading">
            <h1 id="gas-fees-heading" className="text-2xl font-bold mb-2">
              {selectedBlockchain === 'ethereum' ? 'Ethereum' : 'Bitcoin'} Gas Fees
            </h1>
            <p className="text-sm text-muted-foreground mb-4">Real-time network transaction fees updated every 2 minutes</p>
            <div className="grid gap-4 md:grid-cols-3">
              <GasPriceCard
                speed="slow"
                price={gasPrices?.data?.slow || 0}
                blockchain={selectedBlockchain}
                isLoading={gasPrices.isLoading}
                usdValue={gasPrices?.data?.slowUsd}
              />
              <GasPriceCard
                speed="standard"
                price={gasPrices?.data?.standard || 0}
                blockchain={selectedBlockchain}
                isLoading={gasPrices.isLoading}
                usdValue={gasPrices?.data?.standardUsd}
              />
              <GasPriceCard
                speed="fast"
                price={gasPrices?.data?.fast || 0}
                blockchain={selectedBlockchain}
                isLoading={gasPrices.isLoading}
                usdValue={gasPrices?.data?.fastUsd}
              />
            </div>
          </section>

          {/* 2. Market Stats */}
          <section aria-labelledby="market-stats-heading">
            <h2 id="market-stats-heading" className="sr-only">Global Crypto Market Statistics</h2>
            <MarketStats />
          </section>

          {/* 3. Liquidity & Leverage Panel */}
          <section aria-labelledby="leverage-heading">
            <h2 id="leverage-heading" className="sr-only">Derivatives Market Data</h2>
            <LeveragePanel />
          </section>

          {/* 4. Layout with News and Sidebar */}
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              {/* Market Leaders */}
              <section aria-labelledby="trending-heading">
                <h2 id="trending-heading" className="sr-only">Trending Cryptocurrencies</h2>
                <TrendingTokens />
              </section>
              
              {/* News Section */}
              <section aria-labelledby="news-heading">
                <h2 id="news-heading" className="sr-only">Latest Crypto News</h2>
                <NewsSection />
              </section>
            </div>
            
            {/* Sidebar with widgets */}
            <aside className="space-y-6" aria-label="Market indicators">
              <FearGreedWidget />
              <MarketStressWidget />
              <MarketCycleWidget />
              <StealthExWidget />
            </aside>
          </div>

          {/* 5. Sponsors Section */}
          <section aria-labelledby="sponsors-heading">
            <h2 id="sponsors-heading" className="sr-only">Our Partners and Sponsors</h2>
            <Sponsors />
          </section>
        </main>

        <footer className="border-t border-border mt-16" role="contentinfo">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-sm text-muted-foreground">
              © 2024 GasNow. Real-time crypto gas tracker. Free and open-source.
            </p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
};

export default Index;
