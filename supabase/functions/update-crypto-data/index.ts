import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateRequest {
  type: 'gas_prices' | 'crypto_prices' | 'market_data' | 'fear_greed' | 'altseason' | 'news' | 'trending_tokens' | 'derivatives' | 'stablecoin_supply' | 'market_stress';
  blockchain?: 'ethereum' | 'bitcoin';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Note: This function is called by scheduled cron jobs only
    // It writes to the database using service role key, no user data is exposed
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, blockchain } = await req.json() as UpdateRequest;
    console.log(`[update-crypto-data] Processing update for type: ${type}`);

    let result;
    switch (type) {
      case 'gas_prices':
        result = await updateGasPrices(supabase, blockchain || 'ethereum');
        break;
      case 'crypto_prices':
        result = await updateCryptoPrices(supabase);
        break;
      case 'market_data':
        result = await updateMarketData(supabase);
        break;
      case 'fear_greed':
        result = await updateFearGreed(supabase);
        break;
      case 'altseason':
        result = await updateAltseason(supabase);
        break;
      case 'news':
        result = await updateNews(supabase);
        break;
      case 'trending_tokens':
        result = await updateTrendingTokens(supabase);
        break;
      case 'derivatives':
        result = await updateDerivativesData(supabase);
        break;
      case 'stablecoin_supply':
        result = await updateStablecoinSupply(supabase);
        break;
      case 'market_stress':
        result = await updateMarketStressIndex(supabase);
        break;
      default:
        throw new Error(`Unknown update type: ${type}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[update-crypto-data] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function updateGasPrices(supabase: any, blockchain: string) {
  console.log(`[updateGasPrices] Fetching ${blockchain} gas prices...`);
  
  if (blockchain === 'ethereum') {
    const etherscanApiKey = Deno.env.get('ETHERSCAN_API_KEY');
    
    // Try Etherscan v2 API first
    if (etherscanApiKey) {
      try {
        const url = `https://api.etherscan.io/v2/api?chainid=1&module=gastracker&action=gasoracle&apikey=${etherscanApiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === '1' && data.result) {
          const { SafeGasPrice, ProposeGasPrice, FastGasPrice } = data.result;
          
          const { error } = await supabase.from('gas_prices').insert({
            blockchain: 'ethereum',
            slow: parseFloat(SafeGasPrice),
            standard: parseFloat(ProposeGasPrice),
            fast: parseFloat(FastGasPrice),
          });
          
          if (error) throw error;
          
          console.log('[updateGasPrices] Ethereum prices updated via Etherscan v2');
          return { blockchain: 'ethereum', source: 'etherscan_v2' };
        }
      } catch (error) {
        console.error('[updateGasPrices] Etherscan v2 API error:', error);
      }
    }
    
    // Fallback to beaconcha.in
    try {
      const response = await fetch('https://beaconcha.in/api/v1/execution/gasnow');
      const data = await response.json();
      
      if (data.data) {
        const slow = Math.round(data.data.slow / 1000000000);
        const standard = Math.round(data.data.standard / 1000000000);
        const fast = Math.round(data.data.fast / 1000000000);
        
        const { error } = await supabase.from('gas_prices').insert({
          blockchain: 'ethereum',
          slow,
          standard,
          fast,
        });
        
        if (error) throw error;
        
        console.log('[updateGasPrices] Ethereum prices updated via beaconcha.in');
        return { blockchain: 'ethereum', source: 'beaconcha' };
      }
    } catch (error) {
      console.error('[updateGasPrices] beaconcha.in error:', error);
      throw new Error('All Ethereum gas price sources failed');
    }
  } else if (blockchain === 'bitcoin') {
    try {
      const response = await fetch('https://mempool.space/api/v1/fees/recommended');
      const data = await response.json();
      
      const { error } = await supabase.from('gas_prices').insert({
        blockchain: 'bitcoin',
        slow: data.hourFee,
        standard: data.halfHourFee,
        fast: data.fastestFee,
      });
      
      if (error) throw error;
      
      console.log('[updateGasPrices] Bitcoin fees updated');
      return { blockchain: 'bitcoin', source: 'mempool.space' };
    } catch (error) {
      console.error('[updateGasPrices] Bitcoin error:', error);
      throw error;
    }
  }
}

async function updateCryptoPrices(supabase: any) {
  console.log('[updateCryptoPrices] Fetching crypto prices...');
  
  const coingeckoApiKey = Deno.env.get('COINGECKO_API_KEY');
  const coins = ['bitcoin', 'ethereum', 'solana', 'the-open-network'];
  const symbols = ['btc', 'eth', 'sol', 'ton'];
  
  try {
    const params = new URLSearchParams({
      ids: coins.join(','),
      vs_currencies: 'usd',
      include_24hr_change: 'true',
    });
    
    const headers: any = { 'Accept': 'application/json' };
    if (coingeckoApiKey) {
      headers['x-cg-demo-api-key'] = coingeckoApiKey;
    }
    
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?${params}`, { headers });
    const data = await response.json();
    
    for (let i = 0; i < coins.length; i++) {
      const coinData = data[coins[i]];
      if (coinData) {
        const { error } = await supabase.from('crypto_prices').insert({
          symbol: symbols[i],
          price: coinData.usd,
          change_24h: coinData.usd_24h_change || 0,
        });
        
        if (error) console.error(`Error inserting ${symbols[i]}:`, error);
      }
    }
    
    console.log('[updateCryptoPrices] Crypto prices updated');
    return { updated: symbols.length };
  } catch (error) {
    console.error('[updateCryptoPrices] Error:', error);
    throw error;
  }
}

async function updateMarketData(supabase: any) {
  console.log('[updateMarketData] Fetching market data...');
  
  const coingeckoApiKey = Deno.env.get('COINGECKO_API_KEY');
  
  try {
    const headers: any = { 'Accept': 'application/json' };
    if (coingeckoApiKey) {
      headers['x-cg-demo-api-key'] = coingeckoApiKey;
    }
    
    const response = await fetch('https://api.coingecko.com/api/v3/global', { headers });
    const data = await response.json();
    
    const { error } = await supabase.from('market_data').insert({
      total_market_cap: data.data.total_market_cap.usd,
      total_volume_24h: data.data.total_volume.usd,
      btc_dominance: data.data.market_cap_percentage.btc,
      eth_dominance: data.data.market_cap_percentage.eth,
    });
    
    if (error) throw error;
    
    console.log('[updateMarketData] Market data updated');
    return { success: true };
  } catch (error) {
    console.error('[updateMarketData] Error:', error);
    throw error;
  }
}

async function updateFearGreed(supabase: any) {
  console.log('[updateFearGreed] Fetching Fear & Greed Index...');
  
  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=1');
    const data = await response.json();
    
    const indexData = data.data[0];
    const { error } = await supabase.from('fear_greed_index').insert({
      value: parseInt(indexData.value),
      classification: indexData.value_classification,
    });
    
    if (error) throw error;
    
    console.log('[updateFearGreed] Fear & Greed Index updated');
    return { value: indexData.value, classification: indexData.value_classification };
  } catch (error) {
    console.error('[updateFearGreed] Error:', error);
    throw error;
  }
}

async function updateAltseason(supabase: any) {
  console.log('[updateAltseason] Calculating Altseason Index...');
  
  const coingeckoApiKey = Deno.env.get('COINGECKO_API_KEY');
  
  try {
    const headers: any = { 'Accept': 'application/json' };
    if (coingeckoApiKey) {
      headers['x-cg-demo-api-key'] = coingeckoApiKey;
    }
    
    const response = await fetch('https://api.coingecko.com/api/v3/global', { headers });
    const data = await response.json();
    
    const btcDominance = data.data.market_cap_percentage.btc;
    const altDominance = 100 - btcDominance;
    
    let classification = 'Neutral';
    if (altDominance > 60) classification = 'Altseason';
    else if (altDominance < 40) classification = 'Bitcoin Season';
    
    const { error } = await supabase.from('altseason_index').insert({
      value: altDominance,
      btc_dominance: btcDominance,
      classification,
    });
    
    if (error) throw error;
    
    console.log('[updateAltseason] Altseason Index updated');
    return { value: altDominance, classification };
  } catch (error) {
    console.error('[updateAltseason] Error:', error);
    throw error;
  }
}

async function updateNews(supabase: any) {
  console.log('[updateNews] Fetching crypto news...');
  
  const feeds = [
    { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk' },
    { url: 'https://cointelegraph.com/rss', source: 'Cointelegraph' },
    { url: 'https://decrypt.co/feed', source: 'Decrypt' },
  ];
  
  let insertedCount = 0;
  
  for (const feed of feeds) {
    try {
      const response = await fetch(feed.url);
      const text = await response.text();
      
      // Simple RSS parsing
      const items = text.match(/<item>[\s\S]*?<\/item>/g) || [];
      
      for (const item of items.slice(0, 5)) {
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
        const linkMatch = item.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/);
        const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/);
        const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
        
        // Extract image from various RSS formats
        let imageUrl = '/images/default-crypto-news.jpg';
        const mediaMatch = item.match(/<media:content[^>]*url=["'](.*?)["']/);
        const enclosureMatch = item.match(/<enclosure[^>]*url=["'](.*?)["']/);
        const contentMatch = item.match(/<content:encoded><!\[CDATA\[[\s\S]*?<img[^>]*src=["'](.*?)["']/);
        
        if (mediaMatch) imageUrl = mediaMatch[1];
        else if (enclosureMatch) imageUrl = enclosureMatch[1];
        else if (contentMatch) imageUrl = contentMatch[1];
        
        if (titleMatch && linkMatch) {
          const { error } = await supabase.from('crypto_news').insert({
            title: titleMatch[1].trim(),
            description: descMatch ? descMatch[1].trim().replace(/<[^>]*>/g, '').slice(0, 500) : null,
            url: linkMatch[1].trim(),
            image_url: imageUrl,
            source: feed.source,
            category: 'general',
            published_at: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
          }).select();
          
          if (!error) insertedCount++;
        }
      }
    } catch (error) {
      console.error(`[updateNews] Error fetching ${feed.source}:`, error);
    }
  }
  
  console.log(`[updateNews] Inserted ${insertedCount} news articles`);
  return { inserted: insertedCount };
}

async function updateTrendingTokens(supabase: any) {
  const apiKey = Deno.env.get('COINGECKO_API_KEY');
  const headers: Record<string, string> = apiKey ? { 'x-cg-demo-api-key': apiKey } : {};
  
  console.log('[updateTrendingTokens] Fetching trending tokens...');

  try {
    // 1. Fetch trending coins
    const trendingRes = await fetch('https://api.coingecko.com/api/v3/search/trending', { headers });
    const trendingData = await trendingRes.json();
    
    // 2. Fetch 100 coins to get gainers and top 5 (with sparkline data)
    const marketsRes = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=100&page=1&sparkline=true&price_change_percentage=24h',
      { headers }
    );
    const allCoins = await marketsRes.json();

    // 3. Get Gainers: top 5 with highest positive 24h change
    const gainers = [...allCoins]
      .filter((c: any) => c.price_change_percentage_24h > 0)
      .sort((a: any, b: any) => b.price_change_percentage_24h - a.price_change_percentage_24h)
      .slice(0, 5);

    // 4. Get Top 5: by market cap rank (1-5)
    const top5 = [...allCoins]
      .sort((a: any, b: any) => a.market_cap_rank - b.market_cap_rank)
      .slice(0, 5);

    // Delete old trending tokens
    await supabase.from('trending_tokens').delete().neq('id', 0);

    // 5. Insert trending coins with enriched data
    const trendingTokens = trendingData.coins.slice(0, 5).map((coin: any) => {
      const marketData = allCoins.find((c: any) => c.id === coin.item.id);
      return {
        token_id: coin.item.id,
        symbol: coin.item.symbol,
        name: coin.item.name,
        rank: coin.item.market_cap_rank || 0,
        price_btc: coin.item.price_btc || 0,
        market_cap_rank: coin.item.market_cap_rank || 0,
        token_type: 'trending',
        price: marketData?.current_price || null,
        change_24h: marketData?.price_change_percentage_24h || null,
        image_url: coin.item.large || coin.item.thumb,
        sparkline_7d: marketData?.sparkline_in_7d?.price || null,
      };
    });

    // 6. Insert gainers
    const gainerTokens = gainers.map((coin: any, index: number) => ({
      token_id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      rank: index + 1,
      price_btc: null,
      market_cap_rank: coin.market_cap_rank,
      token_type: 'gainer',
      price: coin.current_price,
      change_24h: coin.price_change_percentage_24h,
      image_url: coin.image,
      sparkline_7d: coin.sparkline_in_7d?.price || null,
    }));

    // 7. Insert top 5
    const top5Tokens = top5.map((coin: any, index: number) => ({
      token_id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      rank: index + 1,
      price_btc: null,
      market_cap_rank: coin.market_cap_rank,
      token_type: 'top5',
      price: coin.current_price,
      change_24h: coin.price_change_percentage_24h,
      image_url: coin.image,
      sparkline_7d: coin.sparkline_in_7d?.price || null,
    }));

    const allTokens = [...trendingTokens, ...gainerTokens, ...top5Tokens];

    const { error: insertError } = await supabase
      .from('trending_tokens')
      .insert(allTokens);

    if (insertError) {
      console.error('[updateTrendingTokens] Insert error:', insertError);
      throw insertError;
    }

    console.log('[updateTrendingTokens] Trending tokens updated');
    return { success: true, count: allTokens.length };
  } catch (error) {
    console.error('[updateTrendingTokens] Error:', error);
    throw error;
  }
}

// ========== NEW FUNCTIONS FOR MARKET STRESS INDEX ==========

async function updateDerivativesData(supabase: any) {
  console.log('[updateDerivativesData] Fetching derivatives data from Binance...');
  
  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
  
  try {
    for (const symbol of symbols) {
      // Fetch funding rate and mark price
      const premiumRes = await fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`);
      const premiumData = await premiumRes.json();
      
      // Fetch open interest
      const oiRes = await fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`);
      const oiData = await oiRes.json();
      
      // Fetch long/short ratio
      let longShortRatio = 1;
      try {
        const lsRes = await fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=1h&limit=1`);
        const lsData = await lsRes.json();
        if (lsData && lsData[0]) {
          longShortRatio = parseFloat(lsData[0].longShortRatio);
        }
      } catch (e) {
        console.log(`[updateDerivativesData] Could not fetch L/S ratio for ${symbol}`);
      }
      
      // Calculate OI in USD
      const markPrice = parseFloat(premiumData.markPrice) || 0;
      const openInterest = parseFloat(oiData.openInterest) || 0;
      const openInterestUsd = openInterest * markPrice;
      
      // Get 24h price change from spot
      const tickerRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
      const tickerData = await tickerRes.json();
      const priceChange24h = parseFloat(tickerData.priceChangePercent) || 0;
      
      const { error } = await supabase.from('derivatives_data').insert({
        symbol,
        funding_rate: parseFloat(premiumData.lastFundingRate) || 0,
        open_interest: openInterest,
        open_interest_usd: openInterestUsd,
        long_short_ratio: longShortRatio,
        liquidations_24h: 0, // Would need separate API call
        price: markPrice,
        price_change_24h: priceChange24h,
      });
      
      if (error) {
        console.error(`[updateDerivativesData] Error inserting ${symbol}:`, error);
      }
    }
    
    console.log('[updateDerivativesData] Derivatives data updated');
    return { success: true, symbols };
  } catch (error) {
    console.error('[updateDerivativesData] Error:', error);
    throw error;
  }
}

async function updateStablecoinSupply(supabase: any) {
  console.log('[updateStablecoinSupply] Fetching stablecoin supply...');
  
  const coingeckoApiKey = Deno.env.get('COINGECKO_API_KEY');
  
  try {
    const headers: any = { 'Accept': 'application/json' };
    if (coingeckoApiKey) {
      headers['x-cg-demo-api-key'] = coingeckoApiKey;
    }
    
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=tether,usd-coin&vs_currencies=usd&include_market_cap=true&include_24hr_change=true',
      { headers }
    );
    const data = await response.json();
    
    const usdtMarketCap = data.tether?.usd_market_cap || 0;
    const usdcMarketCap = data['usd-coin']?.usd_market_cap || 0;
    const totalSupply = usdtMarketCap + usdcMarketCap;
    
    // Get previous entry to calculate change
    const { data: prevData } = await supabase
      .from('stablecoin_supply')
      .select('total_supply')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    const change24h = prevData ? ((totalSupply - prevData.total_supply) / prevData.total_supply) * 100 : 0;
    
    const { error } = await supabase.from('stablecoin_supply').insert({
      usdt_market_cap: usdtMarketCap,
      usdc_market_cap: usdcMarketCap,
      total_supply: totalSupply,
      change_24h: change24h,
    });
    
    if (error) throw error;
    
    console.log('[updateStablecoinSupply] Stablecoin supply updated');
    return { success: true, totalSupply };
  } catch (error) {
    console.error('[updateStablecoinSupply] Error:', error);
    throw error;
  }
}

async function updateMarketStressIndex(supabase: any) {
  console.log('[updateMarketStressIndex] Calculating Market Stress Index...');
  
  try {
    // 1. Get latest derivatives data
    const { data: derivativesData } = await supabase
      .from('derivatives_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    
    // 2. Get latest market data (for BTC dominance)
    const { data: marketData } = await supabase
      .from('market_data')
      .select('btc_dominance')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // 3. Get latest stablecoin supply
    const { data: stablecoinData } = await supabase
      .from('stablecoin_supply')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Calculate component scores (0-100)
    const insights: string[] = [];
    
    // Funding Score (25%): Higher absolute funding = more stress
    let fundingScore = 0;
    if (derivativesData && derivativesData.length > 0) {
      const avgFunding = derivativesData.reduce((sum: number, d: any) => sum + Math.abs(d.funding_rate || 0), 0) / derivativesData.length;
      fundingScore = Math.min(100, avgFunding * 100000); // Scale: 0.001 = 100
      if (avgFunding > 0.0003) insights.push('Funding elevated');
    }
    
    // OI Score (20%): Based on total OI level
    let oiScore = 0;
    if (derivativesData && derivativesData.length > 0) {
      const totalOI = derivativesData.reduce((sum: number, d: any) => sum + (d.open_interest_usd || 0), 0);
      oiScore = Math.min(100, (totalOI / 50e9) * 100); // Scale: 50B = 100
      if (totalOI > 30e9) insights.push('High open interest');
    }
    
    // Volatility Score (20%): Based on 24h price changes
    let volatilityScore = 0;
    if (derivativesData && derivativesData.length > 0) {
      const avgVolatility = derivativesData.reduce((sum: number, d: any) => sum + Math.abs(d.price_change_24h || 0), 0) / derivativesData.length;
      volatilityScore = Math.min(100, avgVolatility * 10); // Scale: 10% = 100
      if (avgVolatility > 5) insights.push('Volatility expanding');
    }
    
    // Liquidation Score (15%): Not available from free API, use 0
    const liquidationScore = 0;
    
    // BTC Dominance Score (10%): Lower dominance = more risk (altcoin season = more volatile)
    let btcDominanceScore = 0;
    if (marketData) {
      const btcDom = marketData.btc_dominance || 50;
      btcDominanceScore = Math.max(0, 100 - btcDom * 2); // 50% dom = 0 score, 0% = 100
      if (btcDom < 45) insights.push('Low BTC dominance');
    }
    
    // Stablecoin Score (10%): Decreasing supply = more stress
    let stablecoinScore = 0;
    if (stablecoinData && stablecoinData.change_24h !== null) {
      stablecoinScore = Math.max(0, Math.min(100, -stablecoinData.change_24h * 10)); // -10% change = 100
      if (stablecoinData.change_24h < -1) insights.push('Stablecoin outflow detected');
    }
    
    // Calculate weighted total
    const totalScore = Math.round(
      fundingScore * 0.25 +
      oiScore * 0.20 +
      volatilityScore * 0.20 +
      liquidationScore * 0.15 +
      btcDominanceScore * 0.10 +
      stablecoinScore * 0.10
    );
    
    // Classify
    let classification = 'Neutral';
    if (totalScore <= 30) classification = 'Low Stress';
    else if (totalScore >= 61) classification = 'High Stress';
    
    // Add classification insight if none
    if (insights.length === 0) {
      insights.push('Market conditions stable');
    }
    
    const { error } = await supabase.from('market_stress_index').insert({
      value: totalScore,
      classification,
      funding_score: fundingScore,
      oi_score: oiScore,
      volatility_score: volatilityScore,
      liquidation_score: liquidationScore,
      btc_dominance_score: btcDominanceScore,
      stablecoin_score: stablecoinScore,
      insights,
    });
    
    if (error) throw error;
    
    console.log('[updateMarketStressIndex] Market Stress Index updated:', totalScore, classification);
    return { value: totalScore, classification, insights };
  } catch (error) {
    console.error('[updateMarketStressIndex] Error:', error);
    throw error;
  }
}
