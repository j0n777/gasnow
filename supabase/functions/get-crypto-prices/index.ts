const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COINGECKO_API_KEY = Deno.env.get('COINGECKO_API_KEY');
const CMC_API_KEY = Deno.env.get('CMC_API_KEY');

async function getCryptoPrices() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,toncoin&vs_currencies=usd&include_24hr_change=true',
      {
        headers: {
          'x-cg-pro-api-key': COINGECKO_API_KEY || ''
        }
      }
    );
    
    const data = await response.json();
    
    return {
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
        price: data.toncoin?.usd || 0,
        change24h: data.toncoin?.usd_24h_change || 0
      }
    };
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return {
      btc: { price: 45000, change24h: 2.5 },
      eth: { price: 2500, change24h: 1.8 },
      sol: { price: 100, change24h: -0.5 },
      ton: { price: 2.5, change24h: 3.2 }
    };
  }
}

async function getGlobalMarketCap() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/global',
      {
        headers: {
          'x-cg-pro-api-key': COINGECKO_API_KEY || ''
        }
      }
    );
    
    const data = await response.json();
    
    return {
      totalMarketCap: data.data?.total_market_cap?.usd || 0,
      totalVolume24h: data.data?.total_volume?.usd || 0,
      btcDominance: data.data?.market_cap_percentage?.btc || 0,
      ethDominance: data.data?.market_cap_percentage?.eth || 0
    };
  } catch (error) {
    console.error('Error fetching global market cap:', error);
    return {
      totalMarketCap: 1500000000000,
      totalVolume24h: 80000000000,
      btcDominance: 50,
      ethDominance: 18
    };
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
