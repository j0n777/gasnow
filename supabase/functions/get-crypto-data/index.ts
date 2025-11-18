import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DataRequest {
  type: 'gas_prices' | 'crypto_prices' | 'market_data' | 'fear_greed' | 'altseason' | 'news';
  blockchain?: 'ethereum' | 'bitcoin';
  category?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { type, blockchain, category } = await req.json() as DataRequest;
    console.log(`[get-crypto-data] Fetching data for type: ${type}`);

    let result;
    switch (type) {
      case 'gas_prices':
        result = await getGasPrices(supabase, blockchain || 'ethereum');
        break;
      case 'crypto_prices':
        result = await getCryptoPrices(supabase);
        break;
      case 'market_data':
        result = await getMarketData(supabase);
        break;
      case 'fear_greed':
        result = await getFearGreed(supabase);
        break;
      case 'altseason':
        result = await getAltseason(supabase);
        break;
      case 'news':
        result = await getNews(supabase, category);
        break;
      default:
        throw new Error(`Unknown data type: ${type}`);
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[get-crypto-data] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
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
    description: article.description,
    url: article.url,
    image: article.image_url,
    publishedAt: article.published_at,
    source: article.source,
  }));
}