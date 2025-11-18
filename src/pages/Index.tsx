import { useState } from 'react';
import { Header } from '@/components/Header';
import { GasPriceCard } from '@/components/GasPriceCard';
import { NewsSection } from '@/components/NewsSection';
import { FearGreedWidget } from '@/components/FearGreedWidget';
import { AltseasonWidget } from '@/components/AltseasonWidget';
import { MarketStats } from '@/components/MarketStats';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useGasPrices } from '@/hooks/useGasPrices';

const Index = () => {
  const [selectedBlockchain, setSelectedBlockchain] = useState<'ethereum' | 'bitcoin'>('ethereum');
  const { data: gasPrices, isLoading } = useGasPrices(selectedBlockchain);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <Header
          selectedBlockchain={selectedBlockchain}
          onBlockchainSelect={setSelectedBlockchain}
        />

        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Market Stats */}
          <MarketStats />

          {/* Gas Prices */}
          <section>
            <h2 className="text-2xl font-bold mb-4">
              {selectedBlockchain === 'ethereum' ? 'Ethereum' : 'Bitcoin'} Gas Fees
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <GasPriceCard
                speed="slow"
                price={gasPrices?.slow || 0}
                blockchain={selectedBlockchain}
                isLoading={isLoading}
              />
              <GasPriceCard
                speed="standard"
                price={gasPrices?.standard || 0}
                blockchain={selectedBlockchain}
                isLoading={isLoading}
              />
              <GasPriceCard
                speed="fast"
                price={gasPrices?.fast || 0}
                blockchain={selectedBlockchain}
                isLoading={isLoading}
              />
            </div>
          </section>

          {/* News and Market Indicators */}
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <NewsSection />
            </div>
            <div className="space-y-6">
              <FearGreedWidget />
              <AltseasonWidget />
            </div>
          </div>
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
