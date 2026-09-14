import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface DataRequest {
  type: 'gas_prices' | 'crypto_prices' | 'market_data' | 'market_data_history' | 'fear_greed' | 'altseason' | 'news' | 'trending_tokens' | 'derivatives_data' | 'market_stress' | 'leverage_index' | 'stablecoin_supply' | 'bitcoin_cycle' | 'snapshot';
  blockchain?: 'ethereum' | 'bitcoin';
  category?: string;
  days?: number;
  format?: 'json' | 'text';
}

// 13/09/2026: além do POST usado pelo app, a function aceita GET com query string
// (?type=...&format=text) para crawlers de busca/IA e para o prerender de build.
// `type=snapshot` devolve todas as seções do dashboard de uma vez; `format=text`
// devolve markdown legível por LLM. GET é cacheado por 60s na borda.
async function parseRequest(req: Request): Promise<DataRequest> {
  if (req.method === 'GET') {
    const u = new URL(req.url);
    const daysParam = u.searchParams.get('days');
    return {
      type: (u.searchParams.get('type') || 'snapshot') as DataRequest['type'],
      blockchain: (u.searchParams.get('blockchain') || undefined) as DataRequest['blockchain'],
      category: u.searchParams.get('category') || undefined,
      days: daysParam ? parseInt(daysParam, 10) : undefined,
      format: (u.searchParams.get('format') || 'json') as DataRequest['format'],
    };
  }
  const body = await req.json();
  return body as DataRequest;
}

async function safeCall(fn: () => Promise<any>): Promise<any> {
  try { return await fn(); } catch (_e) { return null; }
}

async function getSnapshot(supabase: any) {
  const [gasEth, gasBtc, prices, market, fearGreed, altseason, trending, news, derivatives, stress, leverage, stablecoins, cycle] = await Promise.all([
    safeCall(() => getGasPrices(supabase, 'ethereum')),
    safeCall(() => getGasPrices(supabase, 'bitcoin')),
    safeCall(() => getCryptoPrices(supabase)),
    safeCall(() => getMarketData(supabase)),
    safeCall(() => getFearGreed(supabase)),
    safeCall(() => getAltseason(supabase)),
    safeCall(() => getTrendingTokens(supabase)),
    safeCall(() => getNews(supabase, 'general')),
    safeCall(() => getDerivativesData(supabase)),
    safeCall(() => getMarketStress(supabase)),
    safeCall(() => getLeverageIndex(supabase)),
    safeCall(() => getStablecoinSupply(supabase)),
    safeCall(() => getBitcoinCycle(supabase)),
  ]);
  const cycleLite = cycle ? { position: cycle.current ?? null, statistics: cycle.stats ?? null } : null;
  return {
    generated_at: new Date().toISOString(),
    site: 'https://gasnow.tools/',
    gas: { ethereum: gasEth, bitcoin: gasBtc },
    prices, market, fear_greed: fearGreed, altseason, trending,
    news: Array.isArray(news) ? news.slice(0, 10) : null,
    derivatives, market_stress: stress, leverage_index: leverage, stablecoins, bitcoin_cycle: cycleLite,
  };
}

function fmtNum(v: any, digits = 2): string {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (typeof n !== 'number' || !isFinite(n)) return 'n/a';
  if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return n.toFixed(digits);
}

// Markdown para LLMs/crawlers: mesma informação do dashboard, em texto.
function snapshotToText(s: any): string {
  const L: string[] = [];
  const NL = '\n';
  L.push('# GasNow — live crypto gas fees & market snapshot');
  L.push(`Generated: ${s.generated_at} (UTC). Source: https://gasnow.tools/ — JSON: https://mddqwppgucgzefzddajy.supabase.co/functions/v1/get-crypto-data?type=snapshot`);
  if (s.gas?.ethereum) L.push(['## Ethereum gas (gwei)', `- Slow: ${s.gas.ethereum.slow}`, `- Standard: ${s.gas.ethereum.standard}`, `- Fast: ${s.gas.ethereum.fast}`, `- As of: ${new Date(s.gas.ethereum.timestamp).toISOString()}`].join(NL));
  if (s.gas?.bitcoin) L.push(['## Bitcoin fees (sat/vB)', `- Slow (1h): ${s.gas.bitcoin.slow}`, `- Standard (30min): ${s.gas.bitcoin.standard}`, `- Fast (next block): ${s.gas.bitcoin.fast}`, `- As of: ${new Date(s.gas.bitcoin.timestamp).toISOString()}`].join(NL));
  if (s.prices) L.push(['## Prices (USD)', ...Object.entries(s.prices).map(([k, v]: any) => `- ${k.toUpperCase()}: $${fmtNum(v?.price ?? v?.usd ?? v, 2)}${v?.change24h != null ? ` (24h ${fmtNum(v.change24h)}%)` : ''}`)].join(NL));
  if (s.market) L.push(['## Global market', ...Object.entries(s.market).map(([k, v]: any) => `- ${k}: ${typeof v === 'number' ? fmtNum(v) : v}`)].join(NL));
  if (s.fear_greed) L.push(`## Fear & Greed Index${NL}- Value: ${s.fear_greed.value} (${s.fear_greed.classification ?? ''})`);
  if (s.altseason) L.push(`## Altseason Index${NL}- Value: ${s.altseason.value} (${s.altseason.classification ?? ''})`);
  if (s.market_stress) L.push(`## Market Stress Index (MSI)${NL}- Value: ${s.market_stress.value} (${s.market_stress.classification ?? ''})${Array.isArray(s.market_stress.insights) && s.market_stress.insights.length ? `${NL}- Insights: ${s.market_stress.insights.join('; ')}` : ''}`);
  if (s.leverage_index) L.push(`## Leverage Index${NL}- Value: ${s.leverage_index.value} (${s.leverage_index.classification ?? ''})${s.leverage_index.insight ? `${NL}- Insight: ${s.leverage_index.insight}` : ''}`);
  const c = s.bitcoin_cycle?.position;
  if (c) L.push(['## Bitcoin halving cycle', `- Phase: ${c.phase ?? 'n/a'} (confidence ${c.phase_confidence ?? 'n/a'})`, `- Cycle progress: ${c.cycle_progress != null ? fmtNum(parseFloat(c.cycle_progress) <= 1 ? parseFloat(c.cycle_progress) * 100 : c.cycle_progress, 1) + '%' : 'n/a'}`, `- Blocks since halving: ${c.blocks_from_halving ?? 'n/a'}`, `- Predicted top: ${c.predicted_top_date ?? 'n/a'} · Predicted bottom: ${c.predicted_bottom_date ?? 'n/a'} · Next halving: ${c.predicted_next_halving_date ?? 'n/a'}`].join(NL));
  if (Array.isArray(s.derivatives) && s.derivatives.length) L.push(['## Derivatives (perpetual futures)', ...s.derivatives.map((d: any) => `- ${d.symbol}: price $${fmtNum(d.price)}, funding ${(d.funding_rate * 100).toFixed(4)}%, open interest $${fmtNum(d.open_interest_usd)}, long/short ${fmtNum(d.long_short_ratio)}, 24h ${fmtNum(d.price_change_24h)}%`)].join(NL));
  if (s.stablecoins) L.push(['## Stablecoin supply', ...Object.entries(s.stablecoins).map(([k, v]: any) => `- ${k}: ${typeof v === 'number' ? fmtNum(v) : v}`)].join(NL));
  const tt = s.trending;
  if (tt) {
    const list = (arr: any[]) => (arr || []).map((t: any) => `${t.name ?? t.symbol} (${(t.symbol ?? '').toUpperCase()})${t.price != null ? ` $${fmtNum(t.price, 4)}` : ''}${t.change_24h != null ? ` ${fmtNum(t.change_24h)}%` : ''}`).join(', ');
    L.push(['## Trending tokens', `- Trending: ${list(tt.trending)}`, `- Top gainers: ${list(tt.gainers)}`, `- Top 5 by market cap: ${list(tt.top5)}`].join(NL));
  }
  if (Array.isArray(s.news) && s.news.length) L.push(['## Latest crypto news', ...s.news.map((n: any) => `- [${n.title}](${n.url}) — ${n.source}, ${n.publishedAt}`)].join(NL));
  L.push('---' + NL + 'GasNow (gasnow.tools) is an independent, community-maintained crypto analytics dashboard, unrelated to the discontinued gasnow.org. Data refreshes every 5–30 minutes.');
  return L.join(NL + NL);
}

// Retry helper for transient network errors
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 500): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const isRetryable = lastError.message?.includes('connection') ||
        lastError.message?.includes('reset') ||
        lastError.message?.includes('timeout');
      if (i < retries && isRetryable) {
        console.log(`[get-crypto-data] Retry ${i + 1}/${retries} after error: ${lastError.message}`);
        await new Promise(r => setTimeout(r, delay * (i + 1)));
      } else {
        throw lastError;
      }
    }
  }
  throw lastError;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { type, blockchain, category, days, format } = await parseRequest(req);
    console.log(`[get-crypto-data] Fetching data for type: ${type}`);

    let result;
    switch (type) {
      case 'snapshot':
        result = await getSnapshot(supabase);
        break;
      case 'gas_prices':
        result = await withRetry(() => getGasPrices(supabase, blockchain || 'ethereum'));
        break;
      case 'crypto_prices':
        result = await withRetry(() => getCryptoPrices(supabase));
        break;
      case 'market_data':
        result = await withRetry(() => getMarketData(supabase));
        break;
      case 'market_data_history':
        result = await withRetry(() => getMarketDataHistory(supabase, days || 30));
        break;
      case 'fear_greed':
        result = await withRetry(() => getFearGreed(supabase));
        break;
      case 'altseason':
        result = await withRetry(() => getAltseason(supabase));
        break;
      case 'news':
        result = await withRetry(() => getNews(supabase, category));
        break;
      case 'trending_tokens':
        result = await withRetry(() => getTrendingTokens(supabase));
        break;
      case 'derivatives_data':
        result = await withRetry(() => getDerivativesData(supabase));
        break;
      case 'market_stress':
        result = await withRetry(() => getMarketStress(supabase));
        break;
      case 'leverage_index':
        result = await withRetry(() => getLeverageIndex(supabase));
        break;
      case 'stablecoin_supply':
        result = await withRetry(() => getStablecoinSupply(supabase));
        break;
      case 'bitcoin_cycle':
        result = await withRetry(() => getBitcoinCycle(supabase));
        break;
      default:
        throw new Error(`Unknown data type: ${type}`);
    }

    const cache = req.method === 'GET' ? { 'Cache-Control': 'public, max-age=60, s-maxage=60' } : {};
    if (format === 'text' && type === 'snapshot') {
      return new Response(snapshotToText(result), {
        headers: { ...corsHeaders, ...cache, 'Content-Type': 'text/markdown; charset=utf-8' },
      });
    }
    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, ...cache, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[get-crypto-data] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message, details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
async function getGasPrices(supabase: any, blockchain: string) {
  const { data, error } = await supabase
    .from('gas_prices')
    .select('*')
    .eq('blockchain', blockchain)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;

  return {
    slow: parseFloat(data.slow),
    standard: parseFloat(data.standard),
    fast: parseFloat(data.fast),
    timestamp: new Date(data.created_at).getTime(),
  };
}

async function getCryptoPrices(supabase: any) {
  const symbols = ['btc', 'eth', 'sol', 'ton'];
  const result: any = {};

  for (const symbol of symbols) {
    const { data, error } = await supabase
      .from('crypto_prices')
      .select('*')
      .eq('symbol', symbol)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      result[symbol] = {
        price: parseFloat(data.price),
        change24h: parseFloat(data.change_24h),
      };
    }
  }

  return result;
}

async function getMarketData(supabase: any) {
  const { data, error } = await supabase
    .from('market_data')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;

  return {
    totalMarketCap: parseFloat(data.total_market_cap),
    totalVolume24h: parseFloat(data.total_volume_24h),
    btcDominance: parseFloat(data.btc_dominance),
    ethDominance: parseFloat(data.eth_dominance),
  };
}

async function getMarketDataHistory(supabase: any, days: number) {
  const { data, error } = await supabase
    .from('market_data')
    .select('total_market_cap, created_at')
    .order('created_at', { ascending: true })
    .limit(days);

  if (error) throw error;

  return data.map((d: any) => ({
    value: parseFloat(d.total_market_cap) / 1e12, // Em trilhões
    date: d.created_at,
  }));
}

async function getFearGreed(supabase: any) {
  const { data, error } = await supabase
    .from('fear_greed_index')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;

  return {
    value: data.value,
    classification: data.classification,
    timestamp: new Date(data.created_at).getTime(),
  };
}

async function getAltseason(supabase: any) {
  const { data, error } = await supabase
    .from('altseason_index')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;

  return {
    value: parseFloat(data.value),
    btcDominance: parseFloat(data.btc_dominance),
    classification: data.classification,
    timestamp: new Date(data.created_at).getTime(),
  };
}

async function getNews(supabase: any, category?: string) {
  let query = supabase
    .from('crypto_news')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(20);

  if (category && category !== 'general') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data.map((article: any) => ({
    title: article.title,
    description: article.description || '',
    url: article.url,
    image: article.image_url || '/images/default-crypto-news.jpg',
    publishedAt: article.published_at,
    source: article.source,
  }));
}

async function getTrendingTokens(supabase: any) {
  const { data, error } = await supabase
    .from('trending_tokens')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(15); // 5 of each type

  if (error) throw error;

  // Organize by type
  return {
    trending: data.filter((t: any) => t.token_type === 'trending').slice(0, 5),
    gainers: data.filter((t: any) => t.token_type === 'gainer').slice(0, 5),
    top5: data.filter((t: any) => t.token_type === 'top5').slice(0, 5),
  };
}

// ========== NEW FUNCTIONS ==========

async function getDerivativesData(supabase: any) {
  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
  const result: any[] = [];

  for (const symbol of symbols) {
    const { data, error } = await supabase
      .from('derivatives_data')
      .select('*')
      .eq('symbol', symbol)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      result.push({
        symbol: data.symbol,
        funding_rate: parseFloat(data.funding_rate) || 0,
        open_interest: parseFloat(data.open_interest) || 0,
        open_interest_usd: parseFloat(data.open_interest_usd) || 0,
        long_short_ratio: parseFloat(data.long_short_ratio) || 1,
        liquidations_24h: parseFloat(data.liquidations_24h) || 0,
        price: parseFloat(data.price) || 0,
        price_change_24h: parseFloat(data.price_change_24h) || 0,
        created_at: data.created_at,
      });
    }
  }

  return result;
}

async function getMarketStress(supabase: any) {
  const { data, error } = await supabase
    .from('market_stress_index')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.log('[getMarketStress] No data yet:', error.message);
    return null;
  }

  return {
    value: data.value,
    classification: data.classification,
    funding_score: parseFloat(data.funding_score) || 0,
    oi_score: parseFloat(data.oi_score) || 0,
    volatility_score: parseFloat(data.volatility_score) || 0,
    liquidation_score: parseFloat(data.liquidation_score) || 0,
    btc_dominance_score: parseFloat(data.btc_dominance_score) || 0,
    stablecoin_score: parseFloat(data.stablecoin_score) || 0,
    insights: data.insights || [],
    timestamp: new Date(data.created_at).getTime(),
  };
}

async function getLeverageIndex(supabase: any) {
  const { data, error } = await supabase
    .from('leverage_index')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.log('[getLeverageIndex] No data yet:', error.message);
    return null;
  }

  return {
    value: data.value,
    classification: data.classification,
    components: {
      fundingScore: parseFloat(data.funding_score) || 0,
      oiScore: parseFloat(data.oi_score) || 0,
      longShortScore: parseFloat(data.long_short_score) || 0,
      liquidationScore: parseFloat(data.liquidation_score) || 0,
    },
    metrics: {
      totalOI: parseFloat(data.total_oi) || 0,
      avgFunding: parseFloat(data.avg_funding) || 0,
      avgLongShortRatio: parseFloat(data.avg_long_short_ratio) || 1,
    },
    insight: data.insight || 'Market positioning within normal parameters',
    timestamp: new Date(data.created_at).getTime(),
  };
}

async function getStablecoinSupply(supabase: any) {
  const { data, error } = await supabase
    .from('stablecoin_supply')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.log('[getStablecoinSupply] No data yet:', error.message);
    return null;
  }

  return {
    usdt_market_cap: parseFloat(data.usdt_market_cap) || 0,
    usdc_market_cap: parseFloat(data.usdc_market_cap) || 0,
    total_supply: parseFloat(data.total_supply) || 0,
    change_24h: parseFloat(data.change_24h) || 0,
    timestamp: new Date(data.created_at).getTime(),
  };
}

async function getBitcoinCycle(supabase: any) {
  // 1. Get current position
  // current_cycle_position não tem created_at (tem updated_at): o order antigo
  // falhava e `current` vinha null desde sempre (13/09/2026).
  const { data: current } = await supabase
    .from('current_cycle_position')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  // 2. Get statistics (band)
  const { data: stats } = await supabase
    .from('cycle_statistics')
    .select('blocks_from_halving, avg_normalized_price, std_deviation, percentile_25, percentile_75')
    .order('blocks_from_halving', { ascending: true });

  // 3. Get historical cycles (lightweight)
  // We only fetch minimal data for plotting: x, y, series
  const { data: history } = await supabase
    .from('bitcoin_cycle_data')
    .select('blocks_from_halving, normalized_price, cycle_number')
    .order('blocks_from_halving', { ascending: true });

  // Organize history by cycle for easier frontend usage
  const cycles: Record<number, any[]> = {};
  if (history) {
    history.forEach((point: any) => {
      if (!cycles[point.cycle_number]) cycles[point.cycle_number] = [];
      cycles[point.cycle_number].push({
        x: point.blocks_from_halving,
        y: point.normalized_price
      });
    });
  }

  return {
    current,
    stats,
    cycles
  };
}

