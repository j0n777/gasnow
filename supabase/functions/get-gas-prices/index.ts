import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
  try {
    const response = await fetch(
      `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.status === '1' && data.result) {
      return {
        slow: parseInt(data.result.SafeGasPrice),
        standard: parseInt(data.result.ProposeGasPrice),
        fast: parseInt(data.result.FastGasPrice),
        timestamp: Date.now()
      };
    }
    
    throw new Error('Invalid response from Etherscan');
  } catch (error) {
    console.error('Error fetching Ethereum gas prices:', error);
    return {
      slow: 15,
      standard: 20,
      fast: 30,
      timestamp: Date.now()
    };
  }
}

async function getBitcoinFees(): Promise<GasPrices> {
  try {
    const response = await fetch('https://mempool.space/api/v1/fees/recommended');
    const data = await response.json();
    
    return {
      slow: data.hourFee || 10,
      standard: data.halfHourFee || 15,
      fast: data.fastestFee || 20,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error fetching Bitcoin fees:', error);
    return {
      slow: 10,
      standard: 15,
      fast: 20,
      timestamp: Date.now()
    };
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
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
