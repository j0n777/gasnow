import { useState } from 'react';
import { Header } from '@/components/Header';
import { GasPriceCard } from '@/components/GasPriceCard';
import { NewsSection } from '@/components/NewsSection';
import { FearGreedWidget } from '@/components/FearGreedWidget';
import { MarketCycleWidget } from '@/components/MarketCycleWidget';
import { MarketStats } from '@/components/MarketStats';
import { TrendingTokens } from '@/components/TrendingTokens';
import { Sponsors } from '@/components/Sponsors';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useGasPrices } from '@/hooks/useGasPrices';

const Index = () => {
  const [selectedBlockchain, setSelectedBlockchain] = useState<'ethereum' | 'bitcoin'>('ethereum');
  const gasPrices = useGasPrices(selectedBlockchain);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <Header
          selectedBlockchain={selectedBlockchain}
          onBlockchainSelect={setSelectedBlockchain}
        />

        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* 1. Gas Prices */}
          <section>
            <h2 className="text-2xl font-bold mb-4">
              {selectedBlockchain === 'ethereum' ? 'Ethereum' : 'Bitcoin'} Gas Fees
            </h2>
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
          <section>
            <h2 className="text-2xl font-bold mb-4">Market Overview</h2>
            <MarketStats />
          </section>

          {/* 3. Layout with News and Sidebar */}
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              {/* Market Leaders - Full width in main column */}
              <TrendingTokens />
              
              {/* News Section */}
              <NewsSection />
            </div>
            
            {/* Sidebar with widgets */}
            <div className="space-y-6">
              <FearGreedWidget />
              <MarketCycleWidget />
            </div>
          </div>

          {/* 4. Sponsors Section */}
          <Sponsors />
        </main>

        <footer className="border-t border-border mt-16">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-sm text-muted-foreground">
              © 2024 GasNow. Real-time crypto gas tracker.
            </p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
};

export default Index;
