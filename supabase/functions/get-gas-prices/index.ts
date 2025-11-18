const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ETHERSCAN_API_KEY = Deno.env.get('ETHERSCAN_API_KEY');

interface GasPrices {
  slow: number;
  standard: number;
  fast: number;
  timestamp: number;
}

async function getEthereumGasPrices(): Promise<GasPrices> {
  console.log('[get-gas-prices] Fetching Ethereum gas prices...');
  
  if (!ETHERSCAN_API_KEY) {
    console.error('[get-gas-prices] ETHERSCAN_API_KEY not found!');
    throw new Error('ETHERSCAN_API_KEY not configured');
  }
  
  try {
    const url = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY}`;
    console.log('[get-gas-prices] Calling Etherscan API...');
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('[get-gas-prices] Etherscan response status:', data.status);
    
    if (data.status !== '1') {
      throw new Error(`Etherscan API error: ${data.message || 'Unknown error'}`);
    }
    
    const result = {
      slow: parseInt(data.result.SafeGasPrice),
      standard: parseInt(data.result.ProposeGasPrice),
      fast: parseInt(data.result.FastGasPrice),
      timestamp: Date.now()
    };
    
    console.log('[get-gas-prices] Ethereum gas prices fetched successfully:', result);
    return result;
  } catch (error) {
    console.error('[get-gas-prices] Error fetching Ethereum gas prices:', error);
    throw error;
  }
}

async function getBitcoinFees(): Promise<GasPrices> {
  console.log('[get-gas-prices] Fetching Bitcoin fees...');
  
  try {
    const url = 'https://mempool.space/api/v1/fees/recommended';
    console.log('[get-gas-prices] Calling Mempool.space API...');
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Mempool.space API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const result = {
      slow: data.hourFee || 10,
      standard: data.halfHourFee || 15,
      fast: data.fastestFee || 20,
      timestamp: Date.now()
    };
    
    console.log('[get-gas-prices] Bitcoin fees fetched successfully:', result);
    return result;
  } catch (error) {
    console.error('[get-gas-prices] Error fetching Bitcoin fees:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { blockchain = 'ethereum' } = await req.json().catch(() => ({}));

    let gasPrices: GasPrices;
    
    if (blockchain === 'bitcoin') {
      gasPrices = await getBitcoinFees();
    } else {
      gasPrices = await getEthereumGasPrices();
    }

    return new Response(
      JSON.stringify({ success: true, data: gasPrices }),
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
