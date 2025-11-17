import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
const BING_API_KEY = Deno.env.get('BING_API_KEY');

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  image: string;
  publishedAt: string;
  source: string;
}

async function getNewsFromBing(query: string): Promise<NewsArticle[]> {
  try {
    const response = await fetch(
      `https://api.bing.microsoft.com/v7.0/news/search?q=${encodeURIComponent(query)}&count=10&mkt=en-US`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': BING_API_KEY || ''
        }
      }
    );
    
    const data = await response.json();
    
    if (data.value) {
      return data.value.map((article: any) => ({
        title: article.name,
        description: article.description,
        url: article.url,
        image: article.image?.thumbnail?.contentUrl || 'https://via.placeholder.com/400x200',
        publishedAt: article.datePublished,
        source: article.provider?.[0]?.name || 'Unknown'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching news from Bing:', error);
    return [];
  }
}

async function getFallbackNews(category: string): Promise<NewsArticle[]> {
  return [
    {
      title: `Latest ${category} Updates`,
      description: 'Stay tuned for the latest cryptocurrency news and updates.',
      url: '#',
      image: 'https://via.placeholder.com/400x200',
      publishedAt: new Date().toISOString(),
      source: 'GasNow'
    }
  ];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category = 'cryptocurrency' } = await req.json().catch(() => ({}));

    const queries: Record<string, string> = {
      general: 'cryptocurrency news',
      bitcoin: 'Bitcoin news',
      ethereum: 'Ethereum news',
      defi: 'DeFi news',
      nft: 'NFT news',
      altcoins: 'altcoin news'
    };

    const query = queries[category] || queries.general;
    let articles = await getNewsFromBing(query);
    
    if (articles.length === 0) {
      articles = await getFallbackNews(category);
    }

    return new Response(
      JSON.stringify({ success: true, data: articles }),
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
