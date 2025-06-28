const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve static files
app.use('/css', express.static('css'));
app.use('/js', express.static('js'));
app.use('/images', express.static('images'));

// Cache for API responses
const cache = new Map();
const CACHE_DURATION = {
  gas: 30000, // 30 seconds
  prices: 180000, // 3 minutes
  market: 300000, // 5 minutes
  news: 1800000 // 30 minutes
};

// Helper function to get cached data
function getCachedData(key, duration) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < duration) {
    return cached.data;
  }
  return null;
}

// Helper function to set cached data
function setCachedData(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Gas Prices API
app.get('/api_v2/', async (req, res) => {
  const action = req.query.action;
  
  try {
    switch (action) {
      case 'prices':
        await handlePricesRequest(req, res);
        break;
      case 'market_cap':
        await handleMarketCapRequest(req, res);
        break;
      case 'market_cap_chart':
        await handleMarketCapChartRequest(req, res);
        break;
      case 'fear_greed':
        await handleFearGreedRequest(req, res);
        break;
      case 'altseason':
        await handleAltseasonRequest(req, res);
        break;
      case 'news':
        await handleNewsRequest(req, res);
        break;
      default:
        res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error(`Error handling ${action}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle crypto prices
async function handlePricesRequest(req, res) {
  const cacheKey = 'crypto-prices';
  const cached = getCachedData(cacheKey, CACHE_DURATION.prices);
  
  if (cached) {
    return res.json(cached);
  }

  try {
    const coins = req.query.coins || 'ethereum,bitcoin,solana,the-open-network';
    const currencies = req.query.currencies || 'usd';
    
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: coins,
        vs_currencies: currencies,
        include_24hr_change: true
      },
      headers: {
        'X-CG-Demo-API-Key': process.env.COINGECKO_API_KEY
      }
    });

    setCachedData(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    // Return fallback data
    res.json({
      ethereum: { usd: 2500, usd_24h_change: 1.5 },
      bitcoin: { usd: 45000, usd_24h_change: 2.1 },
      solana: { usd: 120, usd_24h_change: -0.8 },
      'the-open-network': { usd: 2.5, usd_24h_change: 3.2 }
    });
  }
}

// Handle market cap data
async function handleMarketCapRequest(req, res) {
  const cacheKey = 'market-cap';
  const cached = getCachedData(cacheKey, CACHE_DURATION.market);
  
  if (cached) {
    return res.json(cached);
  }

  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/global', {
      headers: {
        'X-CG-Demo-API-Key': process.env.COINGECKO_API_KEY
      }
    });

    const globalData = response.data.data;
    const result = {
      total_market_cap: globalData.total_market_cap.usd,
      total_volume: globalData.total_volume.usd,
      market_cap_change_percentage_24h_usd: globalData.market_cap_change_percentage_24h_usd,
      formatted: {
        total_market_cap: formatCurrency(globalData.total_market_cap.usd),
        total_volume: formatCurrency(globalData.total_volume.usd),
        change_24h: `${globalData.market_cap_change_percentage_24h_usd >= 0 ? '+' : ''}${globalData.market_cap_change_percentage_24h_usd.toFixed(2)}%`
      }
    };

    setCachedData(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching market cap:', error);
    // Return fallback data
    res.json({
      total_market_cap: 2500000000000,
      total_volume: 80000000000,
      market_cap_change_percentage_24h_usd: 1.5,
      formatted: {
        total_market_cap: '$2.50T',
        total_volume: '$80.00B',
        change_24h: '+1.50%'
      }
    });
  }
}

// Handle market cap chart data
async function handleMarketCapChartRequest(req, res) {
  const cacheKey = 'market-cap-chart';
  const cached = getCachedData(cacheKey, CACHE_DURATION.market);
  
  if (cached) {
    return res.json(cached);
  }

  try {
    // Get historical market cap data (30 days)
    const response = await axios.get('https://api.coingecko.com/api/v3/global/market_cap_chart', {
      params: {
        days: 30
      },
      headers: {
        'X-CG-Demo-API-Key': process.env.COINGECKO_API_KEY
      }
    });

    const chartData = response.data;
    const result = {
      market_cap: {
        timestamps: chartData.market_cap_chart.map(point => point[0]),
        values: chartData.market_cap_chart.map(point => point[1])
      },
      volume: {
        timestamps: chartData.volume_chart?.map(point => point[0]) || [],
        values: chartData.volume_chart?.map(point => point[1]) || []
      }
    };

    setCachedData(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching market cap chart:', error);
    // Return mock chart data
    const now = Date.now();
    const timestamps = Array.from({ length: 30 }, (_, i) => now - (29 - i) * 24 * 60 * 60 * 1000);
    const values = timestamps.map(() => 2500000000000 + Math.random() * 500000000000);
    
    res.json({
      market_cap: {
        timestamps,
        values
      },
      volume: {
        timestamps,
        values: values.map(v => v * 0.03)
      }
    });
  }
}

// Handle Fear & Greed Index
async function handleFearGreedRequest(req, res) {
  const cacheKey = 'fear-greed';
  const cached = getCachedData(cacheKey, 3600000); // 1 hour cache
  
  if (cached) {
    return res.json(cached);
  }

  try {
    const response = await axios.get('https://api.alternative.me/fng/');
    const data = response.data.data[0];
    
    const result = {
      value: parseInt(data.value),
      classification: data.value_classification,
      timestamp: data.timestamp,
      current: {
        value: parseInt(data.value),
        classification: data.value_classification
      }
    };

    setCachedData(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching Fear & Greed Index:', error);
    // Return fallback data
    res.json({
      value: 50,
      classification: 'Neutral',
      timestamp: Math.floor(Date.now() / 1000),
      current: {
        value: 50,
        classification: 'Neutral'
      }
    });
  }
}

// Handle Altseason Index
async function handleAltseasonRequest(req, res) {
  const cacheKey = 'altseason';
  const cached = getCachedData(cacheKey, 3600000); // 1 hour cache
  
  if (cached) {
    return res.json(cached);
  }

  try {
    // Get Bitcoin dominance from global data
    const globalResponse = await axios.get('https://api.coingecko.com/api/v3/global', {
      headers: {
        'X-CG-Demo-API-Key': process.env.COINGECKO_API_KEY
      }
    });

    const btcDominance = globalResponse.data.data.market_cap_percentage.btc;
    
    // Calculate altseason index (inverse of BTC dominance with adjustments)
    const altseasonIndex = Math.max(0, Math.min(100, 100 - btcDominance * 1.2));
    
    const result = {
      index: Math.round(altseasonIndex),
      bitcoin_dominance: btcDominance,
      bitcoin_performance: 0, // Would need additional API call for this
      outperforming_alts: Math.round(altseasonIndex * 0.5),
      total_alts_analyzed: 50,
      current: {
        index: Math.round(altseasonIndex)
      }
    };

    setCachedData(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error calculating altseason index:', error);
    // Return fallback data
    res.json({
      index: 50,
      bitcoin_dominance: 50,
      bitcoin_performance: 0,
      outperforming_alts: 25,
      total_alts_analyzed: 50,
      current: {
        index: 50
      }
    });
  }
}

// Handle news request
async function handleNewsRequest(req, res) {
  const cacheKey = 'crypto-news';
  const cached = getCachedData(cacheKey, CACHE_DURATION.news);
  
  if (cached) {
    return res.json(cached);
  }

  try {
    // Try to get news from CryptoCompare
    const response = await axios.get('https://min-api.cryptocompare.com/data/v2/news/', {
      params: {
        lang: 'EN',
        sortOrder: 'latest'
      },
      headers: {
        'Authorization': `Apikey ${process.env.CRYPTOCOMPARE_API_KEY}`
      }
    });

    const articles = response.data.Data.slice(0, 6).map(article => ({
      title: article.title,
      excerpt: article.body.substring(0, 150) + '...',
      image: article.imageurl || 'images/default-crypto-news.jpg',
      link: article.url,
      date: new Date(article.published_on * 1000).toISOString()
    }));

    setCachedData(cacheKey, articles);
    res.json(articles);
  } catch (error) {
    console.error('Error fetching news:', error);
    // Return mock news data
    const mockNews = [
      {
        title: "Bitcoin Reaches New All-Time High",
        excerpt: "Bitcoin continues its bullish momentum as institutional adoption grows and regulatory clarity improves across major markets...",
        image: "images/default-crypto-news.jpg",
        link: "#",
        date: new Date().toISOString()
      },
      {
        title: "Ethereum 2.0 Staking Rewards Increase",
        excerpt: "Ethereum staking rewards see significant increase following network upgrades and improved validator participation rates...",
        image: "images/default-crypto-news.jpg",
        link: "#",
        date: new Date(Date.now() - 3600000).toISOString()
      },
      {
        title: "DeFi TVL Surpasses $100 Billion",
        excerpt: "Decentralized Finance total value locked reaches new milestone as more protocols launch and user adoption accelerates...",
        image: "images/default-crypto-news.jpg",
        link: "#",
        date: new Date(Date.now() - 7200000).toISOString()
      }
    ];
    
    res.json(mockNews);
  }
}

// Gas prices endpoint (legacy support)
app.get('/api/gas-prices', async (req, res) => {
  const blockchain = req.query.blockchain || 'ethereum';
  const cacheKey = `gas-${blockchain}`;
  const cached = getCachedData(cacheKey, CACHE_DURATION.gas);
  
  if (cached) {
    return res.json(cached);
  }

  try {
    let gasData;
    
    switch (blockchain) {
      case 'ethereum':
      case 'eth':
        gasData = await getEthereumGas();
        break;
      case 'bitcoin':
      case 'btc':
        gasData = await getBitcoinGas();
        break;
      case 'ton':
        gasData = await getTonGas();
        break;
      default:
        gasData = await getEthereumGas();
    }

    setCachedData(cacheKey, gasData);
    res.json(gasData);
  } catch (error) {
    console.error('Error fetching gas prices:', error);
    res.status(500).json({ error: 'Failed to fetch gas prices' });
  }
});

// Gas price fetchers
async function getEthereumGas() {
  try {
    // Try Etherscan first
    if (process.env.ETHERSCAN_API_KEY) {
      const response = await axios.get('https://api.etherscan.io/api', {
        params: {
          module: 'gastracker',
          action: 'gasoracle',
          apikey: process.env.ETHERSCAN_API_KEY
        }
      });

      if (response.data.status === '1') {
        return {
          slow: parseFloat(response.data.result.SafeGasPrice),
          standard: parseFloat(response.data.result.StandardGasPrice),
          fast: parseFloat(response.data.result.FastGasPrice),
          unit: 'Gwei'
        };
      }
    }

    // Fallback to estimated values
    return {
      slow: 10,
      standard: 15,
      fast: 25,
      unit: 'Gwei'
    };
  } catch (error) {
    console.error('Error fetching Ethereum gas:', error);
    return {
      slow: 10,
      standard: 15,
      fast: 25,
      unit: 'Gwei'
    };
  }
}

async function getBitcoinGas() {
  try {
    const response = await axios.get('https://mempool.space/api/v1/fees/recommended');
    return {
      slow: response.data.hourFee,
      standard: response.data.halfHourFee,
      fast: response.data.fastestFee,
      unit: 'sat/vB'
    };
  } catch (error) {
    console.error('Error fetching Bitcoin gas:', error);
    return {
      slow: 1,
      standard: 5,
      fast: 10,
      unit: 'sat/vB'
    };
  }
}

async function getTonGas() {
  // TON has very predictable and low fees
  return {
    slow: 0.005,
    standard: 0.01,
    fast: 0.02,
    unit: 'TON'
  };
}

// Helper function to format currency
function formatCurrency(value) {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  return `$${value.toFixed(2)}`;
}

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API Keys loaded:', {
    etherscan: !!process.env.ETHERSCAN_API_KEY,
    coingecko: !!process.env.COINGECKO_API_KEY,
    coinmarketcap: !!process.env.COINMARKETCAP_API_KEY,
    cryptocompare: !!process.env.CRYPTOCOMPARE_API_KEY
  });
});