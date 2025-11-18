const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  image: string;
  publishedAt: string;
  source: string;
}

// RSS Feed sources
const RSS_FEEDS = {
  general: [
    'https://www.coindesk.com/arc/outboundfeeds/rss/',
    'https://cointelegraph.com/rss',
    'https://decrypt.co/feed',
    'https://news.bitcoin.com/feed/',
    'https://cryptoslate.com/feed/',
  ],
  bitcoin: [
    'https://news.bitcoin.com/feed/',
    'https://bitcoinist.com/feed/',
    'https://www.newsbtc.com/feed/',
  ],
  ethereum: [
    'https://www.coindesk.com/arc/outboundfeeds/rss/',
    'https://cointelegraph.com/rss',
  ],
  defi: [
    'https://decrypt.co/feed',
    'https://cointelegraph.com/rss',
  ],
  nft: [
    'https://decrypt.co/feed',
    'https://cointelegraph.com/rss',
  ],
  altcoins: [
    'https://cryptoslate.com/feed/',
    'https://beincrypto.com/feed/',
  ]
};

// Cache management
let cachedNews: { [key: string]: { articles: NewsArticle[], timestamp: number } } = {};
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function extractImageFromRSS(item: any): string {
  // Try multiple methods to extract image
  const defaultImage = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80';
  
  try {
    // Try media:content
    if (item['media:content']?.['@_url']) {
      return item['media:content']['@_url'];
    }
    
    // Try enclosure
    if (item.enclosure?.['@_url']) {
      return item.enclosure['@_url'];
    }
    
    // Try description/content for img tags
    const content = item.description || item['content:encoded'] || '';
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }
    
    // Try media:thumbnail
    if (item['media:thumbnail']?.['@_url']) {
      return item['media:thumbnail']['@_url'];
    }
  } catch (error) {
    console.error('[get-crypto-news] Error extracting image:', error);
  }
  
  return defaultImage;
}

function parseRSSFeed(xmlText: string, sourceName: string): NewsArticle[] {
  const articles: NewsArticle[] = [];
  
  try {
    // Simple regex-based XML parsing for RSS
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    const items = xmlText.match(itemRegex) || [];
    
    for (const itemXml of items) {
      try {
        const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
        const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i);
        const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/i);
        const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i);
        
        // Try to extract image from various formats
        let imageUrl = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80';
        
        const mediaContentMatch = itemXml.match(/<media:content[^>]+url="([^"]+)"/i);
        const enclosureMatch = itemXml.match(/<enclosure[^>]+url="([^"]+)"/i);
        const imgMatch = itemXml.match(/<img[^>]+src="([^"]+)"/i);
        
        if (mediaContentMatch && mediaContentMatch[1]) {
          imageUrl = mediaContentMatch[1];
        } else if (enclosureMatch && enclosureMatch[1]) {
          imageUrl = enclosureMatch[1];
        } else if (imgMatch && imgMatch[1]) {
          imageUrl = imgMatch[1];
        }
        
        if (titleMatch && linkMatch) {
          const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').substring(0, 200) : '';
          
          articles.push({
            title: titleMatch[1].trim(),
            description: description.trim(),
            url: linkMatch[1].trim(),
            image: imageUrl,
            publishedAt: pubDateMatch ? pubDateMatch[1] : new Date().toISOString(),
            source: sourceName
          });
        }
      } catch (error) {
        console.error('[get-crypto-news] Error parsing RSS item:', error);
      }
    }
  } catch (error) {
    console.error('[get-crypto-news] Error parsing RSS feed:', error);
  }
  
  return articles;
}

async function fetchRSSFeed(url: string): Promise<NewsArticle[]> {
  try {
    console.log('[get-crypto-news] Fetching RSS feed:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GasNow-RSS-Reader/1.0'
      }
    });
    
    if (!response.ok) {
      console.error('[get-crypto-news] RSS feed error:', response.status, response.statusText);
      return [];
    }
    
    const xmlText = await response.text();
    const sourceName = new URL(url).hostname.replace('www.', '');
    
    return parseRSSFeed(xmlText, sourceName);
  } catch (error) {
    console.error('[get-crypto-news] Error fetching RSS feed:', url, error);
    return [];
  }
}

async function getNewsFromRSS(category: string): Promise<NewsArticle[]> {
  console.log('[get-crypto-news] Fetching news for category:', category);
  
  // Check cache
  const cached = cachedNews[category];
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('[get-crypto-news] Returning cached news for:', category);
    return cached.articles;
  }
  
  const feeds = RSS_FEEDS[category as keyof typeof RSS_FEEDS] || RSS_FEEDS.general;
  
  // Fetch all feeds in parallel
  const results = await Promise.allSettled(
    feeds.map(feed => fetchRSSFeed(feed))
  );
  
  // Combine all articles
  let allArticles: NewsArticle[] = [];
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      allArticles = allArticles.concat(result.value);
    }
  });
  
  // Sort by date (newest first)
  allArticles.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    return dateB - dateA;
  });
  
  // Remove duplicates by URL
  const uniqueArticles = allArticles.filter((article, index, self) =>
    index === self.findIndex(a => a.url === article.url)
  );
  
  // Limit to top 30 articles
  const limitedArticles = uniqueArticles.slice(0, 30);
  
  // Cache results
  cachedNews[category] = {
    articles: limitedArticles,
    timestamp: Date.now()
  };
  
  console.log('[get-crypto-news] Fetched', limitedArticles.length, 'articles for:', category);
  return limitedArticles;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category = 'general' } = await req.json().catch(() => ({}));
    
    const articles = await getNewsFromRSS(category);

    return new Response(
      JSON.stringify({ success: true, data: articles }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[get-crypto-news] Error:', error);
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
