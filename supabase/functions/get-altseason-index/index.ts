const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COINGECKO_API_KEY = Deno.env.get('COINGECKO_API_KEY');

async function getAltseasonIndex() {
  console.log('[get-altseason-index] Fetching Altseason Index...');
  
  if (!COINGECKO_API_KEY) {
    console.error('[get-altseason-index] COINGECKO_API_KEY not found!');
    throw new Error('COINGECKO_API_KEY not configured');
  }
  
  try {
    const url = 'https://api.coingecko.com/api/v3/global';
    console.log('[get-altseason-index] Calling CoinGecko Global API...');
    
    const response = await fetch(url, {
      headers: {
        'x-cg-demo-api-key': COINGECKO_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const btcDominance = data.data.market_cap_percentage.btc;
    
    // Altseason Index = 100 - BTC Dominance
    const altseasonIndex = 100 - btcDominance;
    
    let classification = 'Neutral';
    if (altseasonIndex < 40) {
      classification = 'Bitcoin Season';
    } else if (altseasonIndex >= 40 && altseasonIndex <= 60) {
      classification = 'Neutral';
    } else {
      classification = 'Altseason';
    }
    
    const result = {
      value: Math.round(altseasonIndex * 10) / 10, // Round to 1 decimal
      btcDominance: Math.round(btcDominance * 10) / 10,
      classification,
      timestamp: Date.now()
    };
    
    console.log('[get-altseason-index] Altseason Index calculated successfully:', result);
    return result;
  } catch (error) {
    console.error('[get-altseason-index] Error fetching Altseason Index:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await getAltseasonIndex();

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[get-altseason-index] Error:', error);
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
