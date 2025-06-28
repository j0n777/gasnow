// Modern API endpoint for market data with multiple providers
class MarketDataAPI {
    constructor() {
        this.providers = {
            prices: [
                'https://api.coingecko.com/api/v3/simple/price',
                'https://api.coinbase.com/v2/exchange-rates'
            ],
            marketCap: [
                'https://api.coingecko.com/api/v3/global',
                'https://api.coinmarketcap.com/v1/global/'
            ],
            trending: [
                'https://api.coingecko.com/api/v3/search/trending',
                'https://api.coinmarketcap.com/v1/ticker/?limit=10'
            ]
        };
        
        this.cache = new Map();
        this.cacheTimeouts = {
            prices: 180000, // 3 minutes
            marketCap: 300000, // 5 minutes
            trending: 600000 // 10 minutes
        };
    }

    async getCryptoPrices(coins = ['bitcoin', 'ethereum', 'solana', 'the-open-network']) {
        const cacheKey = `prices-${coins.join(',')}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeouts.prices) {
            return cached.data;
        }

        try {
            const coinsParam = coins.join(',');
            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${coinsParam}&vs_currencies=usd&include_24hr_change=true`
            );
            
            if (!response.ok) throw new Error('Failed to fetch prices');
            
            const data = await response.json();
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('Error fetching crypto prices:', error);
            return cached?.data || this.getFallbackPrices();
        }
    }

    async getGlobalMarketCap() {
        const cacheKey = 'global-market-cap';
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeouts.marketCap) {
            return cached.data;
        }

        try {
            const response = await fetch('https://api.coingecko.com/api/v3/global');
            if (!response.ok) throw new Error('Failed to fetch market cap');
            
            const data = await response.json();
            const processed = this.processGlobalData(data);
            
            this.cache.set(cacheKey, {
                data: processed,
                timestamp: Date.now()
            });
            
            return processed;
        } catch (error) {
            console.error('Error fetching global market cap:', error);
            return cached?.data || this.getFallbackMarketCap();
        }
    }

    async getTrendingTokens() {
        const cacheKey = 'trending-tokens';
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeouts.trending) {
            return cached.data;
        }

        try {
            const [trending, gainers] = await Promise.all([
                fetch('https://api.coingecko.com/api/v3/search/trending').then(r => r.json()),
                fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=percent_change_24h_desc&per_page=10&page=1').then(r => r.json())
            ]);

            const processed = {
                trending: trending.coins?.slice(0, 5) || [],
                gainers: gainers?.slice(0, 5) || []
            };

            this.cache.set(cacheKey, {
                data: processed,
                timestamp: Date.now()
            });
            
            return processed;
        } catch (error) {
            console.error('Error fetching trending tokens:', error);
            return cached?.data || this.getFallbackTrending();
        }
    }

    async getFearGreedIndex() {
        const cacheKey = 'fear-greed-index';
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
            return cached.data;
        }

        try {
            const response = await fetch('https://api.alternative.me/fng/');
            if (!response.ok) throw new Error('Failed to fetch Fear & Greed Index');
            
            const data = await response.json();
            const processed = {
                value: parseInt(data.data[0].value),
                classification: data.data[0].value_classification,
                timestamp: data.data[0].timestamp
            };

            this.cache.set(cacheKey, {
                data: processed,
                timestamp: Date.now()
            });
            
            return processed;
        } catch (error) {
            console.error('Error fetching Fear & Greed Index:', error);
            return cached?.data || { value: 50, classification: 'Neutral', timestamp: Date.now() };
        }
    }

    async getAltseasonIndex() {
        // Simplified altseason calculation based on Bitcoin dominance
        try {
            const globalData = await this.getGlobalMarketCap();
            const btcDominance = globalData.bitcoin_dominance || 50;
            
            // Convert dominance to altseason index (inverse relationship)
            const altseasonIndex = Math.max(0, Math.min(100, 100 - btcDominance * 1.5));
            
            return {
                index: Math.round(altseasonIndex),
                bitcoin_dominance: btcDominance,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Error calculating altseason index:', error);
            return { index: 50, bitcoin_dominance: 50, timestamp: Date.now() };
        }
    }

    processGlobalData(data) {
        const globalData = data.data;
        return {
            total_market_cap: globalData.total_market_cap.usd,
            total_volume: globalData.total_volume.usd,
            market_cap_change_percentage_24h: globalData.market_cap_change_percentage_24h_usd,
            bitcoin_dominance: globalData.market_cap_percentage.btc,
            formatted: {
                total_market_cap: this.formatCurrency(globalData.total_market_cap.usd),
                total_volume: this.formatCurrency(globalData.total_volume.usd),
                change_24h: `${globalData.market_cap_change_percentage_24h_usd >= 0 ? '+' : ''}${globalData.market_cap_change_percentage_24h_usd.toFixed(2)}%`
            }
        };
    }

    formatCurrency(value) {
        if (value >= 1e12) {
            return `$${(value / 1e12).toFixed(2)}T`;
        } else if (value >= 1e9) {
            return `$${(value / 1e9).toFixed(2)}B`;
        } else if (value >= 1e6) {
            return `$${(value / 1e6).toFixed(2)}M`;
        }
        return `$${value.toFixed(2)}`;
    }

    getFallbackPrices() {
        return {
            bitcoin: { usd: 45000, usd_24h_change: 2.5 },
            ethereum: { usd: 2800, usd_24h_change: 1.8 },
            solana: { usd: 120, usd_24h_change: -0.5 },
            'the-open-network': { usd: 2.5, usd_24h_change: 3.2 }
        };
    }

    getFallbackMarketCap() {
        return {
            total_market_cap: 2500000000000,
            total_volume: 80000000000,
            market_cap_change_percentage_24h: 1.5,
            bitcoin_dominance: 52,
            formatted: {
                total_market_cap: '$2.50T',
                total_volume: '$80.00B',
                change_24h: '+1.50%'
            }
        };
    }

    getFallbackTrending() {
        return {
            trending: [],
            gainers: []
        };
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarketDataAPI;
} else {
    window.MarketDataAPI = MarketDataAPI;
}