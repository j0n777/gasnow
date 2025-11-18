const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getFearGreedIndex() {
  console.log('[get-fear-greed-index] Fetching Fear & Greed Index...');
  
  try {
    const url = 'https://api.alternative.me/fng/?limit=1';
    console.log('[get-fear-greed-index] Calling Alternative.me API...');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alternative.me API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !data.data[0]) {
      throw new Error('Invalid response format from Alternative.me');
    }
    
    const index = data.data[0];
    const result = {
      value: parseInt(index.value),
      classification: index.value_classification,
      timestamp: parseInt(index.timestamp) * 1000
    };
    
    console.log('[get-fear-greed-index] Fear & Greed Index fetched successfully:', result);
    return result;
  } catch (error) {
    console.error('[get-fear-greed-index] Error fetching Fear & Greed Index:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await getFearGreedIndex();

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
