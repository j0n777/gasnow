<?php
class SeoManager {
    private array $baseKeywords = [
        // High-performing keywords from Bing
        'crypto gas fees tracker',
        'gasnow',
        'eth gas tracker',
        'gas fees',
        'crypto',
        'cryptocurrency',
        'Ethereum',
        'Bitcoin',
        'TON',
        'market cap',
        'trending coins',
        'largest gainers',
        'gas tracker',
        'ethereum gas',
        'bitcoin fees',
        'ton fees',
        'blockchain fees',
        'crypto gas prices',
        'real-time gas',
        'gas now'
    ];

    private string $googleApiKey;
    private string $siteUrl;
    private string $cacheDir;
    private string $bingApiKey;
    private string $bingVerificationCode;

    public function __construct(string $googleApiKey, string $siteUrl, string $bingApiKey, string $bingVerificationCode) {
        $this->googleApiKey = $googleApiKey;
        $this->siteUrl = $siteUrl;
        $this->cacheDir = sys_get_temp_dir() . '/gasnow_seo/';
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
        $this->bingApiKey = $bingApiKey;
        $this->bingVerificationCode = $bingVerificationCode;
    }

    public function getTrendingSeoTerms(): array {
        $cachedTerms = $this->getCachedSeoTerms();
        if ($cachedTerms !== null) {
            return $cachedTerms;
        }

        $news = $this->getLatestNews();
        $extractedTerms = $this->extractTermsFromNews($news);
        $marketData = $this->getMarketData();
        $trendingTerms = $this->extractTrendingTerms($marketData);

        $allTerms = array_unique(array_merge(
            $this->baseKeywords,
            $extractedTerms,
            $trendingTerms
        ));

        $this->cacheSeoTerms($allTerms);
        return $allTerms;
    }

    private function extractTermsFromNews(array $news): array {
        $terms = [];
        foreach ($news as $article) {
            if (!empty($article['title'])) {
                // Remove special characters and convert to lowercase
                $cleanTitle = strtolower(preg_replace('/[^a-zA-Z0-9\s]/', '', $article['title']));
                $words = explode(' ', $cleanTitle);
                
                // Filter relevant words
                foreach ($words as $word) {
                    if (strlen($word) > 3 && !in_array($word, ['the', 'and', 'for', 'that', 'with'])) {
                        $terms[] = $word;
                    }
                }
            }
        }
        return array_unique($terms);
    }

    private function extractTrendingTerms(array $marketData): array {
        $terms = [];
        if (!empty($marketData['trendingTokens'])) {
            foreach ($marketData['trendingTokens'] as $token) {
                $terms[] = strtolower($token['name']);
                $terms[] = strtolower($token['symbol']);
            }
        }
        if (!empty($marketData['largestGainers'])) {
            foreach ($marketData['largestGainers'] as $token) {
                $terms[] = strtolower($token['name']);
                $terms[] = strtolower($token['symbol']);
            }
        }
        return array_unique($terms);
    }

    public function generateStructuredData(): array {
        $marketData = $this->getMarketData();
        $news = $this->getLatestNews();

        // Website Schema
        $websiteSchema = [
            "@context" => "https://schema.org",
            "@type" => "WebSite",
            "name" => "GasNow Tools",
            "url" => $this->siteUrl,
            "description" => $this->generateMetaDescription(),
            "keywords" => implode(', ', $this->getTrendingSeoTerms()),
            "inLanguage" => "en-US",
            "potentialAction" => [
                "@type" => "SearchAction",
                "target" => "{$this->siteUrl}/search?q={search_term_string}",
                "query-input" => "required name=search_term_string"
            ]
        ];

        // Financial Product Schema for Gas Prices
        $financialProductSchema = [
            "@context" => "https://schema.org",
            "@type" => "FinancialProduct",
            "name" => "Cryptocurrency Gas Fees Tracker",
            "description" => "Real-time gas fees and transaction costs for Ethereum, Bitcoin, and TON blockchains",
            "provider" => [
                "@type" => "Organization",
                "name" => "GasNow Tools",
                "url" => $this->siteUrl
            ],
            "feesAndCommissionsSpecification" => "Real-time blockchain transaction fees"
        ];

        // News Article List Schema
        $newsSchema = [
            "@context" => "https://schema.org",
            "@type" => "ItemList",
            "itemListElement" => []
        ];

        foreach ($news as $index => $article) {
            $newsSchema["itemListElement"][] = [
                "@type" => "ListItem",
                "position" => $index + 1,
                "item" => [
                    "@type" => "NewsArticle",
                    "headline" => $article['title'],
                    "url" => $article['link'],
                    "image" => $article['image'],
                    "datePublished" => date('c'),
                    "publisher" => [
                        "@type" => "Organization",
                        "name" => "GasNow Tools",
                        "url" => $this->siteUrl
                    ]
                ]
            ];
        }

        return [$websiteSchema, $financialProductSchema, $newsSchema];
    }

    public function generateMetaDescription(): string {
        $marketData = $this->getMarketData();
        $trendingTokens = array_slice($marketData['trendingTokens'] ?? [], 0, 3);
        $trendingNames = array_map(fn($token) => $token['name'], $trendingTokens);
        
        return sprintf(
            "GasNow - Real-time cryptocurrency gas fees and transaction costs for Ethereum, Bitcoin, and TON. " .
            "Current global market cap: %s. Trending: %s. Track gas prices instantly on GasNow Tools.",
            $marketData['globalMarketCap'] ?? 'N/A',
            implode(', ', $trendingNames)
        );
    }

    public function submitToGoogleIndexing(): bool {
        $urls = $this->getUrlsToSubmit();
        $success = true;

        foreach ($urls as $url) {
            $data = json_encode([
                'url' => $url,
                'type' => 'URL_UPDATED'
            ]);

            $ch = curl_init('https://indexing.googleapis.com/v3/urlNotifications:publish');
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->googleApiKey
            ]);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                error_log("Failed to submit URL to Google: $url. Response: $response");
                $success = false;
            }
        }

        return $success;
    }

    private function getUrlsToSubmit(): array {
        return [
            $this->siteUrl,
            $this->siteUrl . '/ethereum',
            $this->siteUrl . '/bitcoin',
            $this->siteUrl . '/ton',
            $this->siteUrl . '/news'
        ];
    }

    private function getCachedSeoTerms(): ?array {
        $cacheFile = $this->cacheDir . 'seo_terms.json';
        if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < 3600)) {
            return json_decode(file_get_contents($cacheFile), true);
        }
        return null;
    }

    private function cacheSeoTerms(array $terms): void {
        $cacheFile = $this->cacheDir . 'seo_terms.json';
        file_put_contents($cacheFile, json_encode($terms));
    }

    private function getLatestNews(): array {
        global $news;
        return $news ?? [];
    }

    private function getMarketData(): array {
        global $marketCapData;
        return $marketCapData ?? [];
    }

    // New methods for LLM optimization
    public function generateLlmOptimizedData(): array {
        $marketData = $this->getMarketData();
        $news = $this->getLatestNews();
        
        // Generate context-rich data for LLMs
        return [
            'context' => [
                'purpose' => 'Real-time cryptocurrency gas fee tracking and market analysis',
                'main_features' => [
                    'Gas fee tracking for Ethereum, Bitcoin, and TON',
                    'Market capitalization monitoring',
                    'Trending tokens analysis',
                    'Latest cryptocurrency news'
                ],
                'data_freshness' => 'Real-time updates every 30 seconds',
                'target_audience' => 'Cryptocurrency traders, investors, and blockchain users',
                'unique_value' => 'Comprehensive gas fee tracking across multiple blockchains with market insights'
            ],
            'current_market_state' => [
                'global_market_cap' => $marketData['globalMarketCap'] ?? 'N/A',
                'market_trend' => $this->analyzeMarketTrend($marketData),
                'trending_tokens' => array_slice($marketData['trendingTokens'] ?? [], 0, 3),
                'latest_developments' => $this->extractKeyDevelopments($news)
            ],
            'semantic_relationships' => [
                'primary_topics' => [
                    'gas_fees' => ['ethereum_gas', 'bitcoin_fees', 'ton_fees'],
                    'market_analysis' => ['trending', 'market_cap', 'price_changes'],
                    'blockchain_networks' => ['ethereum', 'bitcoin', 'ton']
                ],
                'related_concepts' => [
                    'transaction_costs',
                    'network_congestion',
                    'blockchain_scalability',
                    'defi_operations'
                ]
            ]
        ];
    }

    private function analyzeMarketTrend(array $marketData): string {
        if (empty($marketData['change24h'])) {
            return 'neutral';
        }
        
        $change = floatval(str_replace(['%', '+'], '', $marketData['change24h']));
        if ($change > 5) return 'strongly_bullish';
        if ($change > 0) return 'bullish';
        if ($change < -5) return 'strongly_bearish';
        if ($change < 0) return 'bearish';
        return 'neutral';
    }

    private function extractKeyDevelopments(array $news): array {
        $developments = [];
        foreach (array_slice($news, 0, 3) as $article) {
            $developments[] = [
                'headline' => $article['title'],
                'summary' => $this->generateAiSummary($article['excerpt']),
                'impact_area' => $this->classifyNewsImpact($article['title'])
            ];
        }
        return $developments;
    }

    private function generateAiSummary(string $text): string {
        // Remove HTML tags and limit to 150 characters
        return substr(strip_tags($text), 0, 150) . '...';
    }

    private function classifyNewsImpact(string $title): string {
        $title = strtolower($title);
        $impactAreas = [
            'market' => ['price', 'market', 'trading', 'value'],
            'technology' => ['update', 'upgrade', 'protocol', 'development'],
            'regulation' => ['sec', 'regulation', 'law', 'government'],
            'adoption' => ['adoption', 'partnership', 'integration', 'launch']
        ];

        foreach ($impactAreas as $area => $keywords) {
            foreach ($keywords as $keyword) {
                if (strpos($title, $keyword) !== false) {
                    return $area;
                }
            }
        }

        return 'general';
    }

    public function generateAiContextualData(): array {
        $llmData = $this->generateLlmOptimizedData();
        
        return [
            '@context' => 'https://schema.org',
            '@type' => 'Dataset',
            'name' => 'GasNow Tools Real-time Cryptocurrency Data',
            'description' => $this->generateMetaDescription(),
            'keywords' => implode(', ', $this->getTrendingSeoTerms()),
            'url' => $this->siteUrl,
            'temporalCoverage' => date('c'),
            'spatialCoverage' => 'Global',
            'creator' => [
                '@type' => 'Organization',
                'name' => 'GasNow Tools',
                'url' => $this->siteUrl
            ],
            'distribution' => [
                '@type' => 'DataDownload',
                'encodingFormat' => 'application/json',
                'contentUrl' => $this->siteUrl . '/api/v1/data'
            ],
            'additionalContextForAI' => $llmData
        ];
    }

    // Bing SEO Optimization Methods
    public function submitToBingIndexing(): bool {
        $urls = $this->getUrlsToSubmit();
        $success = true;

        // Bing Webmaster API endpoint
        $bingApiUrl = 'https://ssl.bing.com/webmaster/api.svc/json/SubmitUrl';
        
        foreach ($urls as $url) {
            $data = json_encode([
                'siteUrl' => $this->siteUrl,
                'url' => $url
            ]);

            $ch = curl_init($bingApiUrl);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->bingApiKey
            ]);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                error_log("Failed to submit URL to Bing: $url. Response: $response");
                $success = false;
            }
        }

        return $success;
    }

    public function generateBingMetadata(): array {
        return [
            'msvalidate.01' => $this->bingVerificationCode, // Add this to config
            'msnbot' => 'index,follow',
            'language' => 'en-us',
            'market' => 'global',
            'audience' => 'all',
            'revisit-after' => '1 hour'
        ];
    }

    // Enhanced Automated SEO Management
    public function autoUpdateSearchEngines(): array {
        $results = [
            'google' => false,
            'bing' => false,
            'sitemap' => false
        ];

        // Update sitemap first
        try {
            $this->generateSitemap();
            $results['sitemap'] = true;
        } catch (Exception $e) {
            error_log("Failed to generate sitemap: " . $e->getMessage());
        }

        // Submit to Google
        try {
            $results['google'] = $this->submitToGoogleIndexing();
        } catch (Exception $e) {
            error_log("Failed to submit to Google: " . $e->getMessage());
        }

        // Submit to Bing
        try {
            $results['bing'] = $this->submitToBingIndexing();
        } catch (Exception $e) {
            error_log("Failed to submit to Bing: " . $e->getMessage());
        }

        // Cache the results
        $this->cacheUpdateResults($results);

        return $results;
    }

    private function generateSitemap(): void {
        $baseUrl = $this->siteUrl;
        $pages = [
            ['loc' => $baseUrl, 'priority' => '1.0'],
            ['loc' => "$baseUrl/ethereum", 'priority' => '0.9'],
            ['loc' => "$baseUrl/bitcoin", 'priority' => '0.9'],
            ['loc' => "$baseUrl/ton", 'priority' => '0.9'],
            ['loc' => "$baseUrl/news", 'priority' => '0.8']
        ];

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . PHP_EOL;

        foreach ($pages as $page) {
            $xml .= "\t<url>" . PHP_EOL;
            $xml .= "\t\t<loc>" . $page['loc'] . "</loc>" . PHP_EOL;
            $xml .= "\t\t<lastmod>" . date('c') . "</lastmod>" . PHP_EOL;
            $xml .= "\t\t<changefreq>hourly</changefreq>" . PHP_EOL;
            $xml .= "\t\t<priority>" . $page['priority'] . "</priority>" . PHP_EOL;
            $xml .= "\t</url>" . PHP_EOL;
        }

        $xml .= '</urlset>';
        
        file_put_contents(__DIR__ . '/../sitemap.xml', $xml);
    }

    private function cacheUpdateResults(array $results): void {
        $cacheFile = $this->cacheDir . 'search_engine_updates.json';
        $data = [
            'timestamp' => time(),
            'results' => $results
        ];
        file_put_contents($cacheFile, json_encode($data));
    }

    // Bing Performance Monitoring
    public function trackBingPerformance(): array {
        $bingApiUrl = 'https://www.bing.com/webmaster/api.svc/json/GetQueryStats';
        
        $data = [
            'apikey' => $this->bingApiKey,
            'siteUrl' => $this->siteUrl,
            'period' => 'LastSevenDays'
        ];

        $ch = curl_init($bingApiUrl . '?' . http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log("Failed to fetch Bing performance data. Response: $response");
            return [];
        }

        $stats = json_decode($response, true);
        
        // Cache the results
        $cacheFile = $this->cacheDir . 'bing_performance.json';
        file_put_contents($cacheFile, json_encode([
            'timestamp' => time(),
            'stats' => $stats
        ]));

        return $stats;
    }

    // Enhanced keyword optimization based on performance
    public function optimizeKeywordsFromPerformance(): void {
        $performanceData = $this->trackBingPerformance();
        if (empty($performanceData)) {
            return;
        }

        // Analyze top performing queries and update base keywords
        $topQueries = array_slice($performanceData['queries'] ?? [], 0, 10);
        $newKeywords = array_map(function($query) {
            return strtolower($query['query']);
        }, $topQueries);

        // Merge with existing keywords and save
        $allKeywords = array_unique(array_merge($this->baseKeywords, $newKeywords));
        
        // Update keywords cache
        $this->cacheSeoTerms($allKeywords);
    }
} 