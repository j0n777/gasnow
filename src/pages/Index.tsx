import { useState } from 'react';
import { Header } from '@/components/Header';
import { GasPriceCard } from '@/components/GasPriceCard';
import { NewsSection } from '@/components/NewsSection';
import { FearGreedWidget } from '@/components/FearGreedWidget';
import { MarketCycleWidget } from '@/components/MarketCycleWidget';
import { BitcoinCycleWidget } from '@/components/BitcoinCycleWidget';
import { MarketStats } from '@/components/MarketStats';
import { TrendingTokens } from '@/components/TrendingTokens';
import { MarketStressWidget } from '@/components/MarketStressWidget';
import { LeverageIndexWidget } from '@/components/LeverageIndexWidget';
import PrivacyDojo from '@/components/PrivacyDojo';
import { BecomePartner } from '@/components/BecomePartner';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SEOHead } from '@/components/SEOHead';
import { AboutAndMethodology } from '@/components/AboutAndMethodology';
import { FAQ } from '@/components/FAQ';
import { useGasPrices } from '@/hooks/useGasPrices';
import { FAQ_SCHEMA, SOFTWARE_APP_SCHEMA, ORGANIZATION_SCHEMA, DATASET_SCHEMA, BREADCRUMB_SCHEMA, BITCOIN_CYCLE_DATASET_SCHEMA } from '@/constants/seoSchemas';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const Index = () => {
  const [selectedBlockchain, setSelectedBlockchain] = useState<'ethereum' | 'bitcoin'>('ethereum');
  const gasPrices = useGasPrices(selectedBlockchain);
  const { t } = useTranslation();

  const indexSchema = {
    "@context": "https://schema.org",
    "@graph": [
      ORGANIZATION_SCHEMA,
      SOFTWARE_APP_SCHEMA,
      DATASET_SCHEMA,
      FAQ_SCHEMA,
      BREADCRUMB_SCHEMA,
      BITCOIN_CYCLE_DATASET_SCHEMA
    ]
  };

  return (
    <ThemeProvider>
      <SEOHead
        title={gasPrices?.data?.standard ? `⚡ ${gasPrices.data.standard} Gwei | GasNow` : undefined}
        description={gasPrices?.data?.standard ? `Current Gas: ${gasPrices.data.slow} (Slow) / ${gasPrices.data.standard} (Std) / ${gasPrices.data.fast} (Fast). Real-time crypto market data.` : undefined}
        schema={indexSchema}
      />
      <div className="min-h-screen bg-background">
        <Header
          selectedBlockchain={selectedBlockchain}
          onBlockchainSelect={setSelectedBlockchain}
        />

        <main className="container mx-auto px-4 py-8 space-y-8" role="main">
          {/* 1. Gas Prices */}
          <section aria-labelledby="gas-fees-heading">
            <h1 id="gas-fees-heading" className="text-2xl font-bold mb-2">
              {selectedBlockchain === 'ethereum' ? t('dashboard.eth_gas_title') : t('dashboard.btc_gas_title')}
            </h1>
            <p className="text-sm text-muted-foreground mb-4">{t('dashboard.gas_subtitle')}</p>
            <div className="grid gap-4 md:grid-cols-3">
              <GasPriceCard
                speed="slow"
                title={t('dashboard.slow')}
                price={gasPrices?.data?.slow || 0}
                blockchain={selectedBlockchain}
                isLoading={gasPrices.isLoading}
                usdValue={gasPrices?.data?.slowUsd}
              />
              <GasPriceCard
                speed="standard"
                title={t('dashboard.standard')}
                price={gasPrices?.data?.standard || 0}
                blockchain={selectedBlockchain}
                isLoading={gasPrices.isLoading}
                usdValue={gasPrices?.data?.standardUsd}
              />
              <GasPriceCard
                speed="fast"
                title={t('dashboard.fast')}
                price={gasPrices?.data?.fast || 0}
                blockchain={selectedBlockchain}
                isLoading={gasPrices.isLoading}
                usdValue={gasPrices?.data?.fastUsd}
              />
            </div>
          </section>

          {/* 2. Market Stats */}
          <section aria-labelledby="market-stats-heading">
            <h2 id="market-stats-heading" className="sr-only">{t('dashboard.market_stats')}</h2>
            <MarketStats title={t('dashboard.market_stats')} />
          </section>

          {/* 3. Market Indices - 3 Gauges Side by Side */}
          <section aria-labelledby="indices-heading">
            <h2 id="indices-heading" className="sr-only">{t('dashboard.indices')}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <LeverageIndexWidget />
              <FearGreedWidget />
              <MarketStressWidget />
            </div>
          </section>

          {/* 4. Cycle Widgets - 2 Side by Side */}
          <section aria-labelledby="cycles-heading">
            <h2 id="cycles-heading" className="sr-only">{t('dashboard.cycles')}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <BitcoinCycleWidget />
              <MarketCycleWidget />
            </div>
          </section>

          {/* 5. Market Leaders - Full Width */}
          <section aria-labelledby="trending-heading">
            <h2 id="trending-heading" className="sr-only">{t('dashboard.trending')}</h2>
            <TrendingTokens title={t('dashboard.trending')} />
          </section>

          {/* 6. News Section - Full Width */}
          <section aria-labelledby="news-heading">
            <h2 id="news-heading" className="sr-only">{t('dashboard.news')}</h2>
            <NewsSection initialCategory={new URLSearchParams(window.location.search).get('news') || 'general'} title={t('dashboard.news')} />
          </section>

          {/* 7. Privacy Tools - Full Width */}
          <section aria-labelledby="privacy-heading">
            <h2 id="privacy-heading" className="sr-only">{t('dashboard.privacy_tools')}</h2>
            <PrivacyDojo title={t('dashboard.privacy_tools')} />
          </section>


          <section aria-labelledby="partner-heading">
            <h2 id="partner-heading" className="sr-only">{t('dashboard.partners')}</h2>
            <BecomePartner title={t('dashboard.partners')} />
          </section>

          {/* Editorial content — required for Google AdSense approval.
              These sections provide the publisher-grade prose, methodology
              explanations and visible FAQ that AdSense expects. Do not hide. */}
          <AboutAndMethodology />
          <FAQ />
        </main>

        <footer className="border-t border-border mt-16" role="contentinfo">
          <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-center text-sm text-muted-foreground">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
            <LanguageSwitcher />
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
};

export default Index;

