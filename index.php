<?php
require_once __DIR__ . '/private/ErrorHandler.php';

if (version_compare(PHP_VERSION, '8.1.0', '<')) {
    die('This application requires PHP 8.1 or higher. Current version: ' . PHP_VERSION);
}

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/private/functions.php';
require_once __DIR__ . '/private/SeoManager.php';

function formatCryptoPrice($price) {
    if ($price === 'N/A') return $price;
    return '$' . number_format((float)$price, 2, '.', ',');
}

$headerCryptoPrices = getHeaderCryptoPrices();
$blockchain = $_GET['blockchain'] ?? 'eth';
$gasPrices = getGasPrices($blockchain) ?? ['slow' => 'N/A', 'standard' => 'N/A', 'fast' => 'N/A'];
// Fallback seguro para evitar warnings de chave indefinida
$defaultGasPrices = ['slow' => 'N/A', 'standard' => 'N/A', 'fast' => 'N/A'];
foreach ($defaultGasPrices as $k => $v) {
    if (!array_key_exists($k, $gasPrices)) $gasPrices[$k] = $v;
    if (!array_key_exists($k.'Usd', $gasPrices)) $gasPrices[$k.'Usd'] = 'N/A';
}
$fearGreedIndex = getFearGreedIndex() ?? ['value' => 'N/A', 'label' => 'N/A'];
$marketCapData = getMarketCapData();
$news = getLatestNews();

// Initialize SEO Manager
$seoManager = new SeoManager(
    GOOGLE_API_KEY,
    SITE_URL,
    BING_API_KEY,
    BING_VERIFICATION_CODE
);

// Generate meta description and structured data
$metaDescription = $seoManager->generateMetaDescription();
$structuredData = $seoManager->generateStructuredData();

// Get trending SEO terms for keywords
$seoTerms = $seoManager->getTrendingSeoTerms();
$keywords = implode(', ', $seoTerms);

$newsStructuredData = [
    "@context" => "https://schema.org",
    "@type" => "ItemList",
    "itemListElement" => []
];

foreach ($news as $index => $article) {
    $newsItem = [
        "@type" => "ListItem",
        "position" => $index + 1,
        "item" => [
            "@type" => "NewsArticle",
            "headline" => $article['title'],
            "url" => $article['link']
        ]
    ];

    // Add datePublished only if the date is available
    if (isset($article['date']) && !empty($article['date'])) {
        $newsItem['item']['datePublished'] = date('c', strtotime($article['date']));
    }

    $newsStructuredData["itemListElement"][] = $newsItem;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GasNow - Real-time Crypto Gas Tracker | ETH, BTC, TON Gas Fees</title>
    <meta name="description" content="<?php echo htmlspecialchars($metaDescription); ?>">
    <meta name="keywords" content="<?php echo htmlspecialchars($keywords); ?>">
    <!-- Load theme-related CSS files first -->
    <link rel="stylesheet" href="css/dark-theme.css">
    <link rel="stylesheet" href="css/responsive.css">
    <!-- Load custom styles last to ensure they override previous rules -->
    <link rel="stylesheet" href="css/styles.css?v=<?php echo time(); ?>">
    <link rel="icon" href="favicon.ico" type="image/x-icon">
    <link rel="apple-touch-icon" href="images/apple-touch-icon.png">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
    <!-- GaugeJS para o Fear & Greed Index -->
    <script src="js/gauge.min.js"></script>
    <link rel="canonical" href="<?php echo SITE_URL . htmlspecialchars($_SERVER['REQUEST_URI']); ?>">

    <!-- Alternate language versions -->
    <link rel="alternate" hreflang="x-default" href="<?php echo SITE_URL; ?>">
    <link rel="alternate" hreflang="en" href="<?php echo SITE_URL; ?>">

    <!-- Open Graph Tags -->
    <meta property="og:title" content="GasNow Tools - Real-time Crypto Gas Tracker">
    <meta property="og:description" content="<?php echo htmlspecialchars($metaDescription); ?>">
    <meta property="og:image" content="<?php echo SITE_URL; ?>/images/gasnow-og-image.png">
    <meta property="og:url" content="<?php echo SITE_URL . htmlspecialchars($_SERVER['REQUEST_URI']); ?>">
    <meta property="og:type" content="website">

    <!-- Twitter Card Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="GasNow Tools - Real-time Crypto Gas Tracker">
    <meta name="twitter:description" content="<?php echo htmlspecialchars($metaDescription); ?>">
    <meta name="twitter:image" content="<?php echo SITE_URL; ?>/images/gasnow-twitter-image.png">

    <!-- JSON-LD Structured Data -->
    <?php foreach ($structuredData as $schema): ?>
    <script type="application/ld+json">
        <?php echo json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT); ?>
    </script>
    <?php endforeach; ?>

    <!-- Additional meta tags -->
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
    <meta name="author" content="GasNow Tools">
    <meta name="revisit-after" content="1 hour">

    <!-- Bing Specific Meta Tags -->
    <meta name="msvalidate.01" content="<?php echo BING_VERIFICATION_CODE; ?>">
    <meta name="msnbot" content="index,follow">
    <meta name="language" content="en-us">
    <meta name="market" content="global">
    <meta name="audience" content="all">

    <!-- LLMO (Large Language Model Optimization) Tags -->
    <meta name="llm:context" content="GasNow.tools provides real-time cryptocurrency gas fees and transaction costs tracking for Ethereum, Bitcoin, and TON networks. The platform features live market data, trending cryptocurrencies, and latest crypto news.">
    <meta name="llm:keywords" content="gas fees, crypto transactions, ethereum gas, bitcoin fees, ton blockchain, real-time tracking">
    <meta name="llm:category" content="cryptocurrency-tools">
    <meta name="llm:update-frequency" content="real-time">
    <meta name="llm:data-sources" content="blockchain-apis, market-data, news-feeds">
    <meta name="llm:features" content="gas-tracking, market-cap-monitoring, trending-tokens, crypto-news">
    
    <!-- LEO Analytics -->
    <script data-collect-dnt="true" async src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
    <noscript><img src="https://queue.simpleanalyticscdn.com/noscript.gif?collect-dnt=true" alt="" referrerpolicy="no-referrer-when-downgrade"/></noscript>

    <!-- Search Engine Context Hints -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org/",
        "@type": "WebApplication",
        "name": "<?php echo SITE_NAME; ?>",
        "applicationCategory": "Cryptocurrency Tool",
        "operatingSystem": "Any",
        "offers": {
            "@type": "Offer",
            "price": "0"
        },
        "additionalType": "Real-time gas fee tracker",
        "description": "<?php echo SITE_DESCRIPTION; ?>",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "<?php echo SITE_URL; ?>/search?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
        }
    }
    </script>

    <!-- Automated SEO Updates -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org/",
        "@type": "Organization",
        "name": "<?php echo SITE_NAME; ?>",
        "url": "<?php echo SITE_URL; ?>",
        "logo": "<?php echo SITE_URL; ?>/images/gasnow-icon.png",
        "sameAs": [
            "https://twitter.com/gasnow_tools",
            "https://github.com/gasnow"
        ]
    }
    </script>
</head>
<body>
    <div id="app" role="main" aria-label="GasNow Tools - Cryptocurrency Gas Fee Tracker">
        <header>
            <div class="logo">
                <img src="images/gasnow-icon.png" alt="GasNow Icon" class="logo-icon">
                <h1><span>Gas</span><span>Now</span></h1>
            </div>
            <div id="crypto-prices">
                <?php foreach (['eth', 'btc', 'sol', 'ton'] as $crypto): ?>
                    <div class="crypto-price" data-crypto="<?php echo $crypto; ?>" onclick="selectBlockchain('<?php echo $crypto; ?>')">
                        <img src="images/<?php echo $crypto; ?>-icon.png" alt="<?php echo strtoupper($crypto); ?>">
                        <span class="price-value"><?php echo formatCryptoPrice($headerCryptoPrices["{$crypto}Price"]); ?></span>
                    </div>
                <?php endforeach; ?>
            </div>
        </header>
        
        <section id="gas-prices">
            <?php 
            $speeds = [
				'slow' => ['label' => 'Slow', 'icon' => 'turtle.png'],
				'standard' => ['label' => 'Standard', 'icon' => 'speed.png'],
				'fast' => ['label' => 'Fast', 'icon' => 'rocket.png']
            ];
            foreach ($speeds as $speed => $info): 
                $gwei = $gasPrices[$speed] !== 'N/A' ? number_format($gasPrices[$speed], 2) : 'Updating...';
                $usd = $gasPrices["{$speed}Usd"] !== 'N/A' ? number_format($gasPrices["{$speed}Usd"], 2) : 'Updating...';
            ?>
                <div class="price-card" id="<?php echo $speed; ?>">
                    <div class="price-card-content">
                        <h2><?php echo $info['label']; ?></h2>
                        <div class="price-info">
                            <p class="price"><?php echo $gwei; ?> <span class="gwei">Gwei</span></p>
                            <p class="usd-price">$<?php echo $usd; ?></p>
                        </div>
                    </div>
                    <img src="images/<?php echo $info['icon']; ?>" alt="<?php echo $info['label']; ?>" class="speed-icon">
                    <div class="progress-bar"></div>
                </div>
            <?php endforeach; ?>
        </section>
        
        <div class="main-content">
            <section id="market-cap">
                <h2>Crypto Market Overview</h2>
                <div class="market-cap-charts">
                    <!-- Global Market Cap Chart -->
                    <div class="market-cap-main-chart">
                        <div class="market-cap-chart-header">
                            <h3 class="market-cap-chart-title">Global Market Cap</h3>
                            <div class="market-cap-chart-stats">
                                <div class="market-cap-stat">
                                    <div class="market-cap-stat-label">Total Market Cap</div>
                                    <div class="market-cap-stat-value" id="total-market-cap">$0</div>
                                </div>
                                <div class="market-cap-stat">
                                    <div class="market-cap-stat-label">24h Change</div>
                                    <div class="market-cap-stat-value" id="market-cap-change">0%</div>
                                </div>
                                <div class="market-cap-stat">
                                    <div class="market-cap-stat-label">24h Volume</div>
                                    <div class="market-cap-stat-value" id="total-volume">$0</div>
                                </div>
                            </div>
                        </div>
                        <div id="market-cap-chart"></div>
                    </div>

                    <div class="market-cap-secondary-charts">
                        <!-- Fear & Greed Index -->
                        <div class="market-cap-chart">
                            <div class="market-cap-chart-header">
                                <div class="title-with-info">
                                    <h3 class="market-cap-chart-title">Fear & Greed Index</h3>
                                    <div class="info-icon"><span>i</span></div>
                                </div>
                            </div>
                            <div class="fear-greed-container">
                                <div id="fear-greed-gauge"></div>
                                <!-- O conteúdo será preenchido pelo JavaScript -->
                            </div>
                        </div>

                        <!-- Altseason Index -->
                        <div class="market-cap-chart">
                            <div class="market-cap-chart-header">
                                <div class="title-with-info">
                                    <h3 class="market-cap-chart-title">Altseason Index</h3>
                                    <div class="info-icon"><span>i</span></div>
                                </div>
                            </div>
                            <div class="altseason-container">
                                <!-- O conteúdo será preenchido pelo JavaScript -->
                            </div>
                        </div>
                    </div>
                </div>

                <div class="market-cap-cards">
                    <div class="market-cap-card">
                        <h3>Trending Tokens</h3>
                        <div id="trending-tokens">
                            <?php foreach ($marketCapData['trendingTokens'] as $token): ?>
                            <div class="token">
                                <div class="token-left">
                                    <img src="<?php echo $token['icon']; ?>" alt="<?php echo $token['name']; ?>" class="token-icon">
                                    <div class="token-info">
                                        <span class="token-name"><?php echo $token['name']; ?></span>
                                        <span class="token-symbol"><?php echo $token['symbol']; ?></span>
                                    </div>
                                </div>
                                <div class="token-right">
                                    <span class="token-price">$<?php echo number_format($token['price'], 2); ?></span>
                                    <span class="token-change <?php echo $token['change24h'] >= 0 ? 'positive' : 'negative'; ?>">
                                        <?php echo $token['change24h'] >= 0 ? '+' : ''; ?><?php echo number_format($token['change24h'], 2); ?>%
                                    </span>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <div class="market-cap-card">
                        <h3>Largest Gainers</h3>
                        <div id="largest-gainers">
                            <?php foreach ($marketCapData['largestGainers'] as $token): ?>
                            <div class="token">
                                <div class="token-left">
                                    <img src="<?php echo $token['icon']; ?>" alt="<?php echo $token['name']; ?>" class="token-icon">
                                    <div class="token-info">
                                        <span class="token-name"><?php echo $token['name']; ?></span>
                                        <span class="token-symbol"><?php echo $token['symbol']; ?></span>
                                    </div>
                                </div>
                                <div class="token-right">
                                    <span class="token-price">$<?php echo number_format($token['price'], 2); ?></span>
                                    <span class="token-change positive">
                                        +<?php echo number_format($token['change24h'], 2); ?>%
                                    </span>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </section>
        </div>
        
        <section id="news">
            <h2>Latest Crypto News</h2>
            <div id="news-container">
                <?php foreach ($news as $article): 
                    $newsImage = (!empty($article['image'])) ? $article['image'] : 'images/default-news-image.jpg';
                ?>
                    <div class="news-article">
                        <div class="news-image" style="background-image: url('<?php echo $newsImage; ?>')"></div>
                        <div class="news-content">
                            <h3><a href="<?php echo $article['link']; ?>" target="_blank"><?php echo $article['title']; ?></a></h3>
                            <p><?php echo $article['excerpt']; ?></p>
                            <a href="<?php echo $article['link']; ?>" target="_blank" class="read-more">Read more</a>
                        </div>
                        <div class="news-hover-overlay">
                            <div class="news-hover-content">
                                <h3><?php echo $article['title']; ?></h3>
                                <p><?php echo $article['excerpt']; ?></p>
                                <a href="<?php echo $article['link']; ?>" target="_blank" class="read-more-hover">Read full article</a>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </section>
        
        <!-- Sessão de Parceiros & Patrocinadores -->
        <section class="partners-sponsors">
            <h2 class="section-title">Partners & Sponsors</h2>
            <div class="partners-banners">
                <a href="https://kastfinance.app.link/HP8K5JYH" target="_blank" class="partner-banner kast">KAST Finance<br><span>Card to use your Crypto</span></a>
                <a href="https://bingx.com/pt-br/act/template/7457/?randomId=7549452152&ref=OOCUZI" target="_blank" class="partner-banner bingx">BingX Exchange<br><span>Crypto Trading</span></a>
                <a href="https://www.okx.com/pt-br/campaigns/boas-vindas-novos-usuarios?channelId=JONATA" target="_blank" class="partner-banner okx">OKX Exchange<br><span>Crypto Trading</span></a>
            </div>
        </section>

        <!-- Rodapé -->
        <footer class="site-footer">
            <div class="footer-main">
                <div class="footer-actions">
                    <a href="https://github.com/seuusuario/gasnow" target="_blank" class="footer-btn github-btn">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:8px;"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 2.92-.39c.99 0 1.99.13 2.92.39 2.22-1.49 3.2-1.18 3.2-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"/></svg>
                        View on GitHub
                    </a>
                    <a href="#" onclick="alert('Donation instructions coming soon!');" class="footer-btn donate-btn">
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:8px;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        Donate
                    </a>
                </div>
                <div class="footer-support">
                    Support GasNow! Help keep this project alive and independent. Every donation makes a difference!
                </div>
            </div>
            <div class="footer-copyright">
                &copy; 2025 GasNow. All rights reserved. | Powered by the community.
            </div>
        </footer>
    </div>
    <!-- ApexCharts - Biblioteca de gráficos -->
    <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
    <!-- Script dos Gráficos with cache busting -->
    <script src="charts/charts.js?v=<?php echo time(); ?>"></script>
    <!-- Script principal da aplicação with cache busting -->
    <script src="js/app.js?v=<?php echo time(); ?>"></script>
    <!-- Incluir o novo script para gerenciar o tema claro/escuro -->
    <script src="js/theme.js?v=<?php echo time(); ?>"></script>
</body>
</html>