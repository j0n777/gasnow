import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from './ThemeProvider';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';

interface HeaderProps {
  selectedBlockchain: 'ethereum' | 'bitcoin';
  onBlockchainSelect: (blockchain: 'ethereum' | 'bitcoin') => void;
}

export const Header = ({ selectedBlockchain, onBlockchainSelect }: HeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const { data: prices } = useCryptoPrices();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <img src="/images/gasnow-icon.png" alt="GasNow" className="w-8 h-8" />
              <div className="text-2xl font-bold">
                <span className="text-primary">Gas</span>
                <span className="text-accent-foreground">Now</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => onBlockchainSelect('ethereum')}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  selectedBlockchain === 'ethereum'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <img src="/images/eth-icon.png" alt="ETH" className="w-5 h-5" />
                <span className="font-semibold">ETH</span>
                {prices?.eth && (
                  <span className="text-sm font-medium">
                    ${prices.eth.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => onBlockchainSelect('bitcoin')}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  selectedBlockchain === 'bitcoin'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <img src="/images/btc-icon.png" alt="BTC" className="w-5 h-5" />
                <span className="font-semibold">BTC</span>
                {prices?.btc && (
                  <span className="text-sm font-medium">
                    ${prices.btc.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                )}
              </button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
