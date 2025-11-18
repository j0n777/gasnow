const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COINGECKO_API_KEY = Deno.env.get('COINGECKO_API_KEY');
const CMC_API_KEY = Deno.env.get('CMC_API_KEY');

async function getCryptoPrices() {
  console.log('[get-crypto-prices] Fetching crypto prices...');
  
  if (!COINGECKO_API_KEY) {
    console.error('[get-crypto-prices] COINGECKO_API_KEY not found!');
    throw new Error('COINGECKO_API_KEY not configured');
  }
  
  try {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,the-open-network&vs_currencies=usd&include_24hr_change=true';
    console.log('[get-crypto-prices] Calling CoinGecko API...');
    
    const response = await fetch(url, {
      headers: {
        'x-cg-demo-api-key': COINGECKO_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const result = {
      btc: {
        price: data.bitcoin?.usd || 0,
        change24h: data.bitcoin?.usd_24h_change || 0
      },
      eth: {
        price: data.ethereum?.usd || 0,
        change24h: data.ethereum?.usd_24h_change || 0
      },
      sol: {
        price: data.solana?.usd || 0,
        change24h: data.solana?.usd_24h_change || 0
      },
      ton: {
        price: data['the-open-network']?.usd || 0,
        change24h: data['the-open-network']?.usd_24h_change || 0
      }
    };
    
    console.log('[get-crypto-prices] Crypto prices fetched successfully');
    return result;
  } catch (error) {
    console.error('[get-crypto-prices] Error fetching crypto prices:', error);
    throw error;
  }
}

async function getGlobalMarketCap() {
  console.log('[get-crypto-prices] Fetching global market cap...');
  
  if (!COINGECKO_API_KEY) {
    console.error('[get-crypto-prices] COINGECKO_API_KEY not found!');
    throw new Error('COINGECKO_API_KEY not configured');
  }
  
  try {
    const url = 'https://api.coingecko.com/api/v3/global';
    console.log('[get-crypto-prices] Calling CoinGecko Global API...');
    
    const response = await fetch(url, {
      headers: {
        'x-cg-demo-api-key': COINGECKO_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const result = {
      totalMarketCap: data.data?.total_market_cap?.usd || 0,
      totalVolume24h: data.data?.total_volume?.usd || 0,
      btcDominance: data.data?.market_cap_percentage?.btc || 0,
      ethDominance: data.data?.market_cap_percentage?.eth || 0
    };
    
    console.log('[get-crypto-prices] Global market cap fetched successfully');
    return result;
  } catch (error) {
    console.error('[get-crypto-prices] Error fetching global market cap:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type = 'prices' } = await req.json().catch(() => ({}));

    let data;
    
    if (type === 'global') {
      data = await getGlobalMarketCap();
    } else {
      data = await getCryptoPrices();
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
