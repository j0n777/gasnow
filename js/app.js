class GasNowApp {
    constructor() {
        this.currentBlockchain = 'ethereum';
        this.currentNewsSource = 'general';
        this.updateInterval = 30000; // 30 seconds
        this.charts = {};
        this.cache = new Map();
        this.isLoading = false;
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        
        // Enhanced news sources configuration with RSS feeds
        this.newsSources = {
            general: { 
                name: 'General Crypto', 
                category: 'cryptocurrency',
                feeds: [
                    'https://cointelegraph.com/rss',
                    'https://coindesk.com/arc/outboundfeeds/rss/',
                    'https://decrypt.co/feed'
                ]
            },
            bitcoin: { 
                name: 'Bitcoin News', 
                category: 'bitcoin',
                feeds: [
                    'https://bitcoinmagazine.com/.rss/full/',
                    'https://cointelegraph.com/rss/tag/bitcoin'
                ]
            },
            ethereum: { 
                name: 'Ethereum News', 
                category: 'ethereum',
                feeds: [
                    'https://cointelegraph.com/rss/tag/ethereum',
                    'https://ethereum.org/en/blog/feed.xml'
                ]
            },
            defi: { 
                name: 'DeFi News', 
                category: 'defi',
                feeds: [
                    'https://cointelegraph.com/rss/tag/defi',
                    'https://thedefiant.io/feed/'
                ]
            },
            nft: { 
                name: 'NFT News', 
                category: 'nft',
                feeds: [
                    'https://cointelegraph.com/rss/tag/nft',
                    'https://nftnow.com/feed/'
                ]
            },
            altcoins: { 
                name: 'Altcoin News', 
                category: 'altcoins',
                feeds: [
                    'https://cointelegraph.com/rss/tag/altcoin'
                ]
            }
        };
        
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing GasNow App...');
            
            // Ensure app is visible first
            this.showApp();
            
            this.setupEventListeners();
            this.setupTheme();
            await this.loadInitialData();
            this.startAutoUpdate();
            this.hideLoadingScreen();
            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.hideLoadingScreen();
            this.showBasicContent();
        }
    }

    showApp() {
        const app = document.getElementById('app');
        if (app) {
            app.style.opacity = '1';
            app.style.visibility = 'visible';
            console.log('📱 App made visible');
        }
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Window resize
        window.addEventListener('resize', this.debounce(() => {
            this.resizeCharts();
        }, 250));
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('gasnow-theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            }
        }
    }

    toggleTheme() {
        const isLight = document.body.classList.toggle('light-theme');
        const themeToggle = document.getElementById('themeToggle');
        
        if (themeToggle) {
            if (isLight) {
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
                localStorage.setItem('gasnow-theme', 'light');
            } else {
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                localStorage.setItem('gasnow-theme', 'dark');
            }
        }

        // Update charts for theme change
        setTimeout(() => this.updateChartsTheme(), 100);
    }

    async loadInitialData() {
        this.showLoading();
        
        try {
            console.log('🔄 Loading initial data...');
            
            // Load data with error handling for each section
            await Promise.allSettled([
                this.updateCryptoPrices(),
                this.updateGasPrices(),
                this.updateMarketData(),
                this.updateTrendingTokens(),
                this.updateNews()
            ]);
            
            console.log('✅ Initial data loaded');
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
        } finally {
            this.hideLoading();
        }
    }

    async updateCryptoPrices() {
        try {
            console.log('📈 Updating crypto prices...');
            
            // Try to fetch from our API first, then fallback to direct API
            let prices;
            try {
                const response = await this.fetchWithCache('/api_v2/?action=prices&coins=ethereum,bitcoin,solana,the-open-network&currencies=usd', 180000);
                if (response) {
                    prices = response;
                }
            } catch (error) {
                console.warn('Local API failed, using fallback data');
            }

            if (!prices) {
                // Use fallback data
                prices = {
                    ethereum: { usd: 2442, usd_24h_change: -1.04 },
                    bitcoin: { usd: 106605, usd_24h_change: -1.04 },
                    solana: { usd: 148, usd_24h_change: -2.21 },
                    'the-open-network': { usd: 2.81, usd_24h_change: -3.50 }
                };
            }
            
            this.renderCryptoPrices(prices);
            console.log('✅ Crypto prices updated');
        } catch (error) {
            console.error('❌ Error updating crypto prices:', error);
            this.renderCryptoPricesError();
        }
    }

    renderCryptoPrices(prices) {
        const container = document.getElementById('cryptoPrices');
        if (!container) return;

        const cryptos = [
            { id: 'ethereum', symbol: 'ETH', blockchain: 'ethereum', logo: 'images/eth-icon.png', fallback: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
            { id: 'bitcoin', symbol: 'BTC', blockchain: 'bitcoin', logo: 'images/btc-icon.png', fallback: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' }
        ];

        container.innerHTML = cryptos.map(crypto => {
            const isActive = this.currentBlockchain === crypto.blockchain ? 'active' : '';
            
            return `
                <div class="crypto-price-icon ${isActive}" data-blockchain="${crypto.blockchain}" onclick="window.gasNowApp?.selectBlockchain('${crypto.blockchain}')">
                    <img src="${crypto.logo}" alt="${crypto.symbol}" onerror="this.src='${crypto.fallback}'">
                </div>
            `;
        }).join('');
    }

    renderCryptoPricesError() {
        const container = document.getElementById('cryptoPrices');
        if (!container) return;

        container.innerHTML = `
            <div class="crypto-price-icon error">
                <span>Error</span>
            </div>
        `;
    }

    async updateGasPrices() {
        try {
            console.log(`⛽ Updating gas prices for ${this.currentBlockchain}...`);
            let data;
            
            // Try to fetch from our API first
            try {
                const response = await this.fetchWithCache(`/api/gas-prices?blockchain=${this.currentBlockchain}`, 30000);
                if (response) {
                    data = response;
                }
            } catch (error) {
                console.warn('Gas API failed, using fallback data');
            }

            if (!data) {
                // Use fallback data based on blockchain
                switch (this.currentBlockchain) {
                    case 'ethereum':
                        data = { slow: 10, standard: 15, fast: 25, unit: 'Gwei' };
                        break;
                    case 'bitcoin':
                        data = { slow: 1, standard: 5, fast: 10, unit: 'sat/vB' };
                        break;
                    case 'ton':
                        data = { slow: 0.005, standard: 0.01, fast: 0.02, unit: 'TON' };
                        break;
                    case 'solana':
                        data = { slow: 0.00025, standard: 0.0005, fast: 0.001, unit: 'SOL' };
                        break;
                    default:
                        data = { slow: 10, standard: 15, fast: 25, unit: 'Gwei' };
                }
            }

            await this.renderGasPrices(data);
            this.startProgressAnimation();
            console.log('✅ Gas prices updated');
        } catch (error) {
            console.error('❌ Error updating gas prices:', error);
            this.renderGasPricesError();
        }
    }

    async renderGasPrices(gasData) {
        const usdPrices = await this.calculateUsdPrices(gasData);
        
        const speeds = ['slow', 'standard', 'fast'];
        speeds.forEach(speed => {
            const priceElement = document.getElementById(`${speed}Price`);
            const unitElement = document.getElementById(`${speed}Unit`);
            const usdElement = document.getElementById(`${speed}Usd`);
            
            if (priceElement && unitElement && usdElement) {
                let gasValue = gasData[speed];
                
                // Fix: If standard is null, undefined, or 0, use slow value
                if (speed === 'standard' && (gasValue === null || gasValue === undefined || gasValue === 0)) {
                    gasValue = gasData.slow || 10; // Use slow value or fallback to 10
                    console.log(`⚠️ Standard gas price was ${gasData[speed]}, using slow value: ${gasValue}`);
                }
                
                if (gasValue !== undefined && gasValue !== null) {
                    priceElement.textContent = this.formatGasPrice(gasValue);
                } else {
                    // Final fallback values if everything fails
                    const fallbackValues = { slow: 10, standard: 15, fast: 25 };
                    priceElement.textContent = this.formatGasPrice(fallbackValues[speed]);
                }
                
                unitElement.textContent = gasData.unit || 'Gwei';
                usdElement.textContent = `$${this.formatPrice(usdPrices[`${speed}Usd`] || 0)}`;
            }
        });
    }

    async calculateUsdPrices(gasData) {
        try {
            // Simple estimation for USD prices
            const estimatedPrices = {
                ethereum: 2442,
                bitcoin: 106605,
                ton: 2.81,
                solana: 148
            };

            let tokenPrice = estimatedPrices[this.currentBlockchain] || estimatedPrices.ethereum;

            if (this.currentBlockchain === 'ethereum') {
                const gasLimit = 21000;
                return {
                    slowUsd: (gasData.slow / 1000000000) * gasLimit * tokenPrice,
                    standardUsd: ((gasData.standard || gasData.slow) / 1000000000) * gasLimit * tokenPrice, // Use slow if standard is null
                    fastUsd: (gasData.fast / 1000000000) * gasLimit * tokenPrice
                };
            } else if (this.currentBlockchain === 'bitcoin') {
                const avgTxSize = 250;
                return {
                    slowUsd: (gasData.slow * avgTxSize / 100000000) * tokenPrice,
                    standardUsd: ((gasData.standard || gasData.slow) * avgTxSize / 100000000) * tokenPrice,
                    fastUsd: (gasData.fast * avgTxSize / 100000000) * tokenPrice
                };
            } else if (this.currentBlockchain === 'solana') {
                return {
                    slowUsd: gasData.slow * tokenPrice,
                    standardUsd: (gasData.standard || gasData.slow) * tokenPrice,
                    fastUsd: gasData.fast * tokenPrice
                };
            } else {
                return {
                    slowUsd: gasData.slow * tokenPrice,
                    standardUsd: (gasData.standard || gasData.slow) * tokenPrice,
                    fastUsd: gasData.fast * tokenPrice
                };
            }
        } catch (error) {
            return { slowUsd: 0, standardUsd: 0, fastUsd: 0 };
        }
    }

    renderGasPricesError() {
        const speeds = ['slow', 'standard', 'fast'];
        speeds.forEach(speed => {
            const priceElement = document.getElementById(`${speed}Price`);
            const usdElement = document.getElementById(`${speed}Usd`);
            
            if (priceElement && usdElement) {
                priceElement.textContent = '--';
                usdElement.textContent = '$--';
            }
        });
    }

    startProgressAnimation() {
        document.querySelectorAll('.progress-fill').forEach(fill => {
            fill.style.width = '0%';
            setTimeout(() => {
                fill.style.width = '100%';
            }, 100);
        });
    }

    async updateMarketData() {
        try {
            console.log('📊 Updating market data...');
            
            // Try to fetch market data
            let marketCap, fearGreed, altseason;
            
            try {
                marketCap = await this.fetchWithCache('/api_v2/?action=market_cap', 300000);
            } catch (error) {
                console.warn('Market cap API failed');
            }

            try {
                fearGreed = await this.fetchWithCache('/api_v2/?action=fear_greed', 3600000);
            } catch (error) {
                console.warn('Fear & Greed API failed');
            }

            try {
                altseason = await this.fetchWithCache('/api_v2/?action=altseason', 3600000);
            } catch (error) {
                console.warn('Altseason API failed');
            }

            // Use fallback data if APIs failed
            if (!marketCap) {
                marketCap = {
                    formatted: {
                        total_market_cap: '$2.50T',
                        total_volume: '$80.00B',
                        change_24h: '+1.50%'
                    }
                };
            }

            if (!fearGreed) {
                fearGreed = {
                    value: 50,
                    classification: 'Neutral',
                    current: { value: 50, classification: 'Neutral' }
                };
            }

            if (!altseason) {
                altseason = {
                    index: 50,
                    current: { index: 50 }
                };
            }

            this.renderMarketCap(marketCap);
            this.renderFearGreed(fearGreed);
            this.renderAltseason(altseason);
            
            // Try to initialize charts
            this.initializeCharts();
            
            console.log('✅ Market data updated');
        } catch (error) {
            console.error('❌ Error updating market data:', error);
        }
    }

    renderMarketCap(data) {
        const totalElement = document.getElementById('totalMarketCap');
        const changeElement = document.getElementById('marketCapChange');
        const volumeElement = document.getElementById('totalVolume');

        if (totalElement && data.formatted?.total_market_cap) {
            totalElement.textContent = data.formatted.total_market_cap;
        }

        if (changeElement && data.formatted?.change_24h) {
            const change = parseFloat(data.formatted.change_24h.replace('%', ''));
            changeElement.textContent = data.formatted.change_24h;
            changeElement.className = `stat-value ${change >= 0 ? 'positive' : 'negative'}`;
        }

        if (volumeElement && data.formatted?.total_volume) {
            volumeElement.textContent = data.formatted.total_volume;
        }
    }

    renderFearGreed(data) {
        const valueElement = document.getElementById('fearGreedValue');
        const labelElement = document.getElementById('fearGreedLabel');

        if (valueElement && labelElement) {
            const value = data.current?.value || data.value || 50;
            const classification = data.current?.classification || data.classification || 'Neutral';

            valueElement.textContent = Math.round(value);
            labelElement.textContent = classification;

            this.updateFearGreedGauge(value);
        }
    }

    updateFearGreedGauge(value) {
        const canvas = document.getElementById('fearGreedCanvas');
        if (!canvas) return;

        try {
            const ctx = canvas.getContext('2d');
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const radius = Math.min(centerX, centerY) - 30; // Increased margin for larger arc

            // Clear canvas
            ctx.clearRect(0, 0, rect.width, rect.height);

            // Draw background arc
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
            ctx.lineWidth = 30; // Much larger line width
            ctx.strokeStyle = '#334155';
            ctx.stroke();

            // Draw value arc
            const angle = Math.PI + (value / 100) * Math.PI;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, Math.PI, angle);
            ctx.lineWidth = 30; // Much larger line width
            
            // Color based on value
            if (value <= 20) ctx.strokeStyle = '#ef4444';
            else if (value <= 40) ctx.strokeStyle = '#f59e0b';
            else if (value <= 60) ctx.strokeStyle = '#eab308';
            else if (value <= 80) ctx.strokeStyle = '#10b981';
            else ctx.strokeStyle = '#059669';
            
            ctx.stroke();
        } catch (error) {
            console.warn('Error drawing Fear & Greed gauge:', error);
        }
    }

    renderAltseason(data) {
        const valueElement = document.getElementById('altseasonValue');
        const statusElement = document.getElementById('altseasonStatus');

        if (valueElement && statusElement) {
            const value = data.index || data.current?.index || 50;
            
            valueElement.textContent = Math.round(value);

            // Determine status
            let status, statusClass;
            if (value <= 25) {
                status = 'Bitcoin Season';
                statusClass = 'bitcoin-season';
            } else if (value <= 75) {
                status = 'Neutral';
                statusClass = 'neutral';
            } else {
                status = 'Altcoin Season';
                statusClass = 'altcoin-season';
            }

            statusElement.textContent = status;
            statusElement.className = `altseason-status ${statusClass}`;

            // Update progress bar
            const progressFill = document.querySelector('.altseason-progress .progress-fill');
            if (progressFill) {
                progressFill.style.width = `${value}%`;
            }
        }
    }

    async updateTrendingTokens() {
        try {
            console.log('🔥 Updating trending tokens...');
            
            // Try to fetch from API first
            let marketData;
            try {
                marketData = await this.fetchWithCache('/api_v2/?action=trending_tokens', 600000);
            } catch (error) {
                console.warn('Trending tokens API failed, using fallback data');
            }

            if (marketData && marketData.trendingTokens && marketData.largestGainers && marketData.top3) {
                this.renderTrendingTokens(marketData.trendingTokens);
                this.renderLargestGainers(marketData.largestGainers);
                this.renderTop3Tokens(marketData.top3);
            } else {
                // Use fallback data with proper structure
                const fallbackData = this.generateFallbackTokenData();
                this.renderTrendingTokens(fallbackData.trendingTokens);
                this.renderLargestGainers(fallbackData.largestGainers);
                this.renderTop3Tokens(fallbackData.top3);
            }
            
            console.log('✅ Trending tokens updated');
        } catch (error) {
            console.error('❌ Error updating trending tokens:', error);
            const fallbackData = this.generateFallbackTokenData();
            this.renderTrendingTokens(fallbackData.trendingTokens);
            this.renderLargestGainers(fallbackData.largestGainers);
            this.renderTop3Tokens(fallbackData.top3);
        }
    }

    generateFallbackTokenData() {
        return {
            trendingTokens: [
                { 
                    name: 'Toncoin', 
                    symbol: 'TON', 
                    price: 2.89, 
                    change24h: 3.35, 
                    icon: 'https://coin-images.coingecko.com/coins/images/17980/small/ton_symbol.png'
                },
                { 
                    name: 'Jupiter', 
                    symbol: 'JUP', 
                    price: 0.46, 
                    change24h: 7.14, 
                    icon: 'https://coin-images.coingecko.com/coins/images/34188/small/jup.png'
                },
                { 
                    name: 'Pudgy Penguins', 
                    symbol: 'PENGU', 
                    price: 0.02, 
                    change24h: 5.76, 
                    icon: 'https://coin-images.coingecko.com/coins/images/35718/small/pengu.png'
                }
            ],
            largestGainers: [
                { 
                    name: 'Bonk', 
                    symbol: 'BONK', 
                    price: 0.00003419, 
                    change24h: 18.84, 
                    icon: 'https://coin-images.coingecko.com/coins/images/28600/small/bonk.jpg'
                },
                { 
                    name: 'Pump.fun', 
                    symbol: 'PUMP', 
                    price: 0.65, 
                    change24h: 20.29, 
                    icon: 'https://coin-images.coingecko.com/coins/images/33440/small/pump.png'
                },
                { 
                    name: 'SPX6900', 
                    symbol: 'SPX', 
                    price: 0.11, 
                    change24h: 19.08, 
                    icon: 'https://coin-images.coingecko.com/coins/images/33051/small/spx.png'
                }
            ],
            top3: [
                {
                    name: 'Bitcoin',
                    symbol: 'BTC',
                    price: 106605,
                    change24h: -1.04,
                    icon: 'https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png'
                },
                {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    price: 2442,
                    change24h: -1.04,
                    icon: 'https://coin-images.coingecko.com/coins/images/279/small/ethereum.png'
                },
                {
                    name: 'Tether',
                    symbol: 'USDT',
                    price: 1.00,
                    change24h: 0.01,
                    icon: 'https://coin-images.coingecko.com/coins/images/325/small/Tether.png'
                }
            ]
        };
    }

    renderTrendingTokens(tokens) {
        const container = document.getElementById('trendingTokens');
        if (!container) return;

        container.innerHTML = tokens.map(token => `
            <div class="token-item">
                <div class="token-info">
                    <img src="${token.icon}" alt="${token.symbol}" class="token-icon" onerror="this.src='https://via.placeholder.com/32x32/3b82f6/ffffff?text=${token.symbol.charAt(0)}'; this.onerror=null;">
                    <div class="token-details">
                        <h4>${token.name}</h4>
                        <p>${token.symbol}</p>
                    </div>
                </div>
                <div class="token-stats">
                    <div class="token-price">${token.price > 0 ? '$' + this.formatPrice(token.price) : 'N/A'}</div>
                    <div class="token-change ${token.change24h >= 0 ? 'positive' : 'negative'}">
                        ${token.change24h !== 0 ? (token.change24h >= 0 ? '+' : '') + token.change24h.toFixed(2) + '%' : 'N/A'}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderTop3Tokens(tokens) {
        const container = document.getElementById('top3Tokens');
        if (!container) return;

        container.innerHTML = tokens.map(token => `
            <div class="token-item">
                <div class="token-info">
                    <img src="${token.icon}" alt="${token.symbol}" class="token-icon" onerror="this.src='https://via.placeholder.com/32x32/3b82f6/ffffff?text=${token.symbol.charAt(0)}'; this.onerror=null;">
                    <div class="token-details">
                        <h4>${token.name}</h4>
                        <p>${token.symbol}</p>
                    </div>
                </div>
                <div class="token-stats">
                    <div class="token-price">$${this.formatPrice(token.price)}</div>
                    <div class="token-change ${token.change24h >= 0 ? 'positive' : 'negative'}">
                        ${token.change24h >= 0 ? '+' : ''}${token.change24h.toFixed(2)}%
                    </div>
                </div>
            </div>
        `).join('');
    }
    renderLargestGainers(tokens) {
        const container = document.getElementById('largestGainers');
        if (!container) return;

        container.innerHTML = tokens.map(token => `
            <div class="token-item">
                <div class="token-info">
                    <img src="${token.icon}" alt="${token.symbol}" class="token-icon" onerror="this.src='https://via.placeholder.com/32x32/10b981/ffffff?text=${token.symbol.charAt(0)}'; this.onerror=null;">
                    <div class="token-details">
                        <h4>${token.name}</h4>
                        <p>${token.symbol}</p>
                    </div>
                </div>
                <div class="token-stats">
                    <div class="token-price">$${this.formatPrice(token.price)}</div>
                    <div class="token-change positive">
                        +${token.change24h.toFixed(2)}%
                    </div>
                </div>
            </div>
        `).join('');
    }

    async updateNews() {
        try {
            console.log(`📰 Updating news for ${this.currentNewsSource}...`);
            
            let news;
            try {
                news = await this.fetchWithCache(`/api_v2/?action=news&source=${this.currentNewsSource}`, 1800000);
            } catch (error) {
                console.warn('News API failed, using fallback data');
            }

            if (!news) {
                news = this.generateEnhancedMockNews();
            }

            this.renderNews(news);
            console.log('✅ News updated');
        } catch (error) {
            console.error('❌ Error updating news:', error);
            this.renderNews(this.generateEnhancedMockNews());
        }
    }

    generateEnhancedMockNews(source = 'general') {
        const newsTopics = {
            general: [
                {
                    title: "Bitcoin Reaches New All-Time High Amid Institutional Adoption",
                    excerpt: "Bitcoin continues its bullish momentum as institutional adoption grows and regulatory clarity improves across major markets worldwide, with several Fortune 500 companies adding BTC to their treasury reserves...",
                    image: "images/default-crypto-news.jpg",
                    link: "#",
                    date: "2 hours ago",
                    source: "CoinTelegraph"
                },
                {
                    title: "Ethereum 2.0 Staking Rewards Increase Following Network Upgrades",
                    excerpt: "Ethereum staking rewards see significant increase following network upgrades and improved validator participation rates across the network, with APY reaching new highs for long-term holders...",
                    image: "images/default-crypto-news.jpg",
                    link: "#",
                    date: "4 hours ago",
                    source: "CoinDesk"
                },
                {
                    title: "DeFi TVL Surpasses $100 Billion as Protocols Expand",
                    excerpt: "Decentralized Finance total value locked reaches new milestone as more protocols launch and user adoption accelerates globally, driven by innovative yield farming strategies...",
                    image: "images/default-crypto-news.jpg",
                    link: "#",
                    date: "6 hours ago",
                    source: "The Defiant"
                }
            ],
            bitcoin: [
                {
                    title: "Bitcoin Mining Difficulty Reaches Record High",
                    excerpt: "Bitcoin network difficulty adjustment shows continued growth in mining participation and network security, with hash rate hitting new all-time highs...",
                    image: "images/default-crypto-news.jpg",
                    link: "#",
                    date: "1 hour ago",
                    source: "Bitcoin Magazine"
                },
                {
                    title: "Major Corporation Adds Bitcoin to Treasury Holdings",
                    excerpt: "Another Fortune 500 company announces Bitcoin treasury allocation as corporate adoption trend continues, following MicroStrategy's successful strategy...",
                    image: "images/default-crypto-news.jpg",
                    link: "#",
                    date: "3 hours ago",
                    source: "CoinTelegraph"
                }
            ],
            ethereum: [
                {
                    title: "Ethereum Layer 2 Solutions See Massive Growth",
                    excerpt: "Layer 2 scaling solutions experience unprecedented transaction volume as users seek lower fees, with Arbitrum and Optimism leading the charge...",
                    image: "images/default-crypto-news.jpg",
                    link: "#",
                    date: "2 hours ago",
                    source: "Ethereum.org"
                },
                {
                    title: "New Ethereum Improvement Proposal Approved",
                    excerpt: "Latest EIP promises to further optimize network efficiency and reduce transaction costs, improving user experience across the ecosystem...",
                    image: "images/default-crypto-news.jpg",
                    link: "#",
                    date: "5 hours ago",
                    source: "CoinDesk"
                }
            ],
            defi: [
                {
                    title: "New DeFi Protocol Launches with $50M TVL",
                    excerpt: "Innovative decentralized finance protocol attracts significant liquidity on launch day, offering unique yield farming opportunities for users...",
                    image: "images/default-crypto-news.jpg",
                    link: "#",
                    date: "1 hour ago",
                    source: "The Defiant"
                },
                {
                    title: "Yield Farming Strategies Evolve with New Protocols",
                    excerpt: "DeFi users adopt new sophisticated strategies for maximizing returns while managing risks, as protocol innovation continues to accelerate...",
                    image: "images/default-crypto-news.jpg",
                    link: "#",
                    date: "4 hours ago",
                    source: "DeFi Pulse"
                }
            ],
            nft: [
                {
                    title: "NFT Market Shows Signs of Recovery",
                    excerpt: "Non-fungible token trading volumes increase as new utility-focused projects gain traction, moving beyond simple collectibles to real-world applications...",
                    image: "images/default-crypto-news.jpg",
                    link: "#",
                    date: "3 hours ago",
                    source: "NFT Now"
                },
                {
                    title: "Major Brand Launches Utility-Focused NFT Collection",
                    excerpt: "Global brand enters NFT space with innovative digital collectibles and real-world utility, bridging traditional business with Web3 technology...",
                    image: "images/default-crypto-news.jpg",
                    link: "#",
                    date: "6 hours ago",
                    source: "CoinTelegraph"
                }
            ],
            altcoins: [
                {
                    title: "Altcoin Season Indicators Point to Potential Rally",
                    excerpt: "Technical analysis suggests altcoins may be preparing for significant price movements as Bitcoin dominance shows signs of weakening...",
                    image: "images/default-crypto-news.jpg",
                    link: "#",
                    date: "2 hours ago",
                    source: "CoinTelegraph"
                },
                {
                    title: "Emerging Altcoins Gain Institutional Interest",
                    excerpt: "Several promising altcoin projects attract institutional investment as the market matures and diversification strategies evolve...",
                    image: "images/default-crypto-news.jpg",
                    link: "#",
                    date: "5 hours ago",
                    source: "CoinDesk"
                }
            ]
        };

        return newsTopics[source] || newsTopics.general;
    }

    renderNews(news) {
        const container = document.getElementById('newsGrid');
        if (!container) return;

        container.innerHTML = news.map(article => `
            <div class="news-card" onclick="window.open('${article.link}', '_blank')">
                <div class="news-image" style="background-image: url('${article.image}')"></div>
                <div class="news-content">
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-excerpt">${article.excerpt}</p>
                    <div class="news-meta">
                        <span>${article.date}</span>
                        <a href="${article.link}" class="read-more" target="_blank" onclick="event.stopPropagation()">Read more</a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    selectNewsSource(source) {
        if (!source) return;
        
        this.currentNewsSource = source;
        
        // Update UI
        document.querySelectorAll('.news-source-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-source="${source}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Update news
        this.updateNews();
        
        // Save preference
        localStorage.setItem('gasnow-news-source', source);
        
        console.log(`📰 News source changed to: ${source}`);
    }

    initializeCharts() {
        // Only try to initialize charts if Chart.js is available
        if (typeof Chart !== 'undefined') {
            this.initializeMarketCapChart();
        } else {
            console.warn('Chart.js not available, skipping chart initialization');
            const fallback = document.getElementById('chartFallback');
            if (fallback) {
                fallback.textContent = 'Chart unavailable';
                fallback.style.display = 'block';
            }
        }
    }

    async initializeMarketCapChart() {
        try {
            const canvas = document.getElementById('marketCapChart');
            if (!canvas) return;

            // Hide fallback text
            const fallback = document.getElementById('chartFallback');
            if (fallback) {
                fallback.style.display = 'none';
            }

            // Generate simple mock data for the chart
            const now = Date.now();
            const days = 7;
            const labels = [];
            const data = [];
            
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(now - (i * 24 * 60 * 60 * 1000));
                labels.push(date.toLocaleDateString());
                data.push(2500000000000 + (Math.random() - 0.5) * 200000000000);
            }

            const ctx = canvas.getContext('2d');

            // Destroy existing chart
            if (this.charts.marketCap) {
                this.charts.marketCap.destroy();
            }

            this.charts.marketCap = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Market Cap',
                        data: data,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: (value) => '$' + this.formatLargeNumber(value),
                                color: '#64748b'
                            },
                            grid: {
                                color: 'rgba(148, 163, 184, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: '#64748b'
                            },
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
            
            console.log('✅ Market cap chart initialized');
        } catch (error) {
            console.error('❌ Error initializing market cap chart:', error);
            const fallback = document.getElementById('chartFallback');
            if (fallback) {
                fallback.textContent = 'Chart error';
                fallback.style.display = 'block';
            }
        }
    }

    updateChartsTheme() {
        // Update chart colors for theme changes
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.update === 'function') {
                chart.update();
            }
        });
    }

    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    selectBlockchain(blockchain) {
        if (!blockchain) return;
        
        this.currentBlockchain = blockchain;
        
        // Update UI - crypto price icons
        document.querySelectorAll('.crypto-price-icon').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-blockchain="${blockchain}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Update gas prices
        this.updateGasPrices();
        
        // Save preference
        localStorage.setItem('gasnow-blockchain', blockchain);
        
        console.log(`⛽ Blockchain changed to: ${blockchain}`);
    }

    startAutoUpdate() {
        // Update prices every 30 seconds
        setInterval(() => {
            if (!this.isLoading) {
                this.updateCryptoPrices();
                this.updateGasPrices();
            }
        }, this.updateInterval);

        // Update market data every 5 minutes
        setInterval(() => {
            if (!this.isLoading) {
                this.updateMarketData();
                this.updateTrendingTokens();
            }
        }, this.updateInterval * 10);

        // Update news every 30 minutes
        setInterval(() => {
            if (!this.isLoading) {
                this.updateNews();
            }
        }, this.updateInterval * 60);
    }

    async fetchWithCache(url, cacheTime = 300000) {
        const cacheKey = url;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < cacheTime) {
            return cached.data;
        }

        try {
            const response = await fetch(url, { timeout: 10000 });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error(`Fetch error for ${url}:`, error);
            throw error;
        }
    }

    showLoading() {
        this.isLoading = true;
    }

    hideLoading() {
        this.isLoading = false;
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }

    showBasicContent() {
        // Show basic content even if APIs fail
        console.log('📄 Showing basic content due to API failures');
        
        // Ensure app is visible
        this.showApp();
        
        // Set basic gas prices
        this.renderGasPricesError();
        
        // Set basic market data
        const totalElement = document.getElementById('totalMarketCap');
        const changeElement = document.getElementById('marketCapChange');
        const volumeElement = document.getElementById('totalVolume');
        
        if (totalElement) totalElement.textContent = '$2.50T';
        if (changeElement) {
            changeElement.textContent = '+1.50%';
            changeElement.className = 'stat-value positive';
        }
        if (volumeElement) volumeElement.textContent = '$80.00B';
        
        // Set basic Fear & Greed
        const fearValueElement = document.getElementById('fearGreedValue');
        const fearLabelElement = document.getElementById('fearGreedLabel');
        
        if (fearValueElement) fearValueElement.textContent = '50';
        if (fearLabelElement) fearLabelElement.textContent = 'Neutral';
        
        // Set basic Altseason
        const altValueElement = document.getElementById('altseasonValue');
        const altStatusElement = document.getElementById('altseasonStatus');
        
        if (altValueElement) altValueElement.textContent = '50';
        if (altStatusElement) {
            altStatusElement.textContent = 'Neutral';
            altStatusElement.className = 'altseason-status neutral';
        }

        // Set basic news
        this.renderNews(this.generateEnhancedMockNews());
        
        // Set basic trending tokens
        this.updateTrendingTokens();
    }

    formatPrice(price) {
        if (price === 0 || price === null || price === undefined) return '0.00';
        
        if (price < 0.01) {
            return price.toFixed(6);
        } else if (price < 1) {
            return price.toFixed(4);
        } else if (price < 100) {
            return price.toFixed(2);
        } else {
            return Math.round(price).toLocaleString();
        }
    }

    formatGasPrice(price) {
        if (price === 0 || price === null || price === undefined) return '0';
        
        if (price < 1) {
            return price.toFixed(3);
        } else if (price < 100) {
            return price.toFixed(1);
        } else {
            return Math.round(price).toString();
        }
    }

    formatLargeNumber(num) {
        if (num >= 1e12) {
            return (num / 1e12).toFixed(2) + 'T';
        } else if (num >= 1e9) {
            return (num / 1e9).toFixed(2) + 'B';
        } else if (num >= 1e6) {
            return (num / 1e6).toFixed(2) + 'M';
        } else if (num >= 1e3) {
            return (num / 1e3).toFixed(2) + 'K';
        }
        return num.toFixed(2);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing GasNow App...');
    try {
        window.gasNowApp = new GasNowApp();
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        // Hide loading screen even if app fails
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
        // Ensure app is visible
        const app = document.getElementById('app');
        if (app) {
            app.style.opacity = '1';
            app.style.visibility = 'visible';
        }
    }
});

// Make functions globally available for onclick handlers
window.selectBlockchain = (blockchain) => {
    if (window.gasNowApp) {
        window.gasNowApp.selectBlockchain(blockchain);
    }
};

window.selectNewsSource = (source) => {
    if (window.gasNowApp) {
        window.gasNowApp.selectNewsSource(source);
    }
};