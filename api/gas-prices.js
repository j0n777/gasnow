// Modern API endpoint for gas prices with multiple providers
class GasPriceAPI {
    constructor() {
        this.providers = {
            ethereum: [
                {
                    name: 'etherscan',
                    url: 'https://api.etherscan.io/api?module=gastracker&action=gasoracle',
                    parser: this.parseEtherscan.bind(this)
                },
                {
                    name: 'blocknative',
                    url: 'https://api.blocknative.com/gasprices/blockprices',
                    parser: this.parseBlocknative.bind(this)
                }
            ],
            bitcoin: [
                {
                    name: 'mempool',
                    url: 'https://mempool.space/api/v1/fees/recommended',
                    parser: this.parseMempool.bind(this)
                }
            ],
            ton: [
                {
                    name: 'toncenter',
                    url: 'https://toncenter.com/api/v2/estimateFee',
                    parser: this.parseTon.bind(this)
                }
            ]
        };
        
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds
    }

    async getGasPrices(blockchain = 'ethereum') {
        const cacheKey = `gas-${blockchain}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        const providers = this.providers[blockchain] || this.providers.ethereum;
        
        for (const provider of providers) {
            try {
                const response = await fetch(provider.url);
                if (!response.ok) continue;
                
                const data = await response.json();
                const parsed = provider.parser(data);
                
                if (parsed) {
                    this.cache.set(cacheKey, {
                        data: parsed,
                        timestamp: Date.now()
                    });
                    return parsed;
                }
            } catch (error) {
                console.warn(`Provider ${provider.name} failed:`, error);
                continue;
            }
        }

        // Return fallback values if all providers fail
        return this.getFallbackPrices(blockchain);
    }

    parseEtherscan(data) {
        if (!data.result) return null;
        
        return {
            slow: parseFloat(data.result.SafeGasPrice),
            standard: parseFloat(data.result.StandardGasPrice),
            fast: parseFloat(data.result.FastGasPrice),
            unit: 'Gwei',
            source: 'etherscan'
        };
    }

    parseBlocknative(data) {
        if (!data.blockPrices || !data.blockPrices[0]) return null;
        
        const prices = data.blockPrices[0].estimatedPrices;
        const slow = prices.find(p => p.confidence === 70);
        const standard = prices.find(p => p.confidence === 80);
        const fast = prices.find(p => p.confidence === 95);
        
        if (!slow || !standard || !fast) return null;
        
        return {
            slow: parseFloat(slow.maxFeePerGas),
            standard: parseFloat(standard.maxFeePerGas),
            fast: parseFloat(fast.maxFeePerGas),
            unit: 'Gwei',
            source: 'blocknative'
        };
    }

    parseMempool(data) {
        return {
            slow: data.hourFee,
            standard: data.halfHourFee,
            fast: data.fastestFee,
            unit: 'sat/vB',
            source: 'mempool'
        };
    }

    parseTon(data) {
        // TON has very predictable and low fees
        return {
            slow: 0.005,
            standard: 0.01,
            fast: 0.02,
            unit: 'TON',
            source: 'toncenter'
        };
    }

    getFallbackPrices(blockchain) {
        const fallbacks = {
            ethereum: {
                slow: 10,
                standard: 15,
                fast: 25,
                unit: 'Gwei',
                source: 'fallback'
            },
            bitcoin: {
                slow: 1,
                standard: 5,
                fast: 10,
                unit: 'sat/vB',
                source: 'fallback'
            },
            ton: {
                slow: 0.005,
                standard: 0.01,
                fast: 0.02,
                unit: 'TON',
                source: 'fallback'
            }
        };

        return fallbacks[blockchain] || fallbacks.ethereum;
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GasPriceAPI;
} else {
    window.GasPriceAPI = GasPriceAPI;
}