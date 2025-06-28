class GasNowApp {
    constructor() {
        this.currentBlockchain = 'ethereum';
        this.updateInterval = 30000; // 30 seconds
        this.charts = {};
        this.cache = new Map();
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupTheme();
        await this.loadInitialData();
        this.startAutoUpdate();
        this.hideLoadingScreen();
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Blockchain selector
        document.querySelectorAll('.blockchain-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectBlockchain(e.currentTarget.dataset.blockchain);
            });
        });

        // Window resize
        window.addEventListener('resize', this.debounce(() => {
            this.resizeCharts();
        }, 250));
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('gasnow-theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    toggleTheme() {
        const isLight = document.body.classList.toggle('light-theme');
        const themeToggle = document.getElementById('themeToggle');
        
        if (isLight) {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('gasnow-theme', 'light');
        } else {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('gasnow-theme', 'dark');
        }

        // Update charts for theme change
        setTimeout(() => this.updateChartsTheme(), 100);
    }

    async loadInitialData() {
        this.showLoading();
        
        try {
            await Promise.all([
                this.updateCryptoPrices(),
                this.updateGasPrices(),
                this.updateMarketData(),
                this.updateNews()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load data. Please refresh the page.');
        } finally {
            this.hideLoading();
        }
    }

    async updateCryptoPrices() {
        try {
            const prices = await this.fetchWithCache('/api_v2/?action=prices&coins=ethereum,bitcoin,solana,the-open-network&currencies=usd', 180000);
            
            if (prices) {
                this.renderCryptoPrices(prices);
            }
        } catch (error) {
            console.error('Error updating crypto prices:', error);
        }
    }

    renderCryptoPrices(prices) {
        const container = document.getElementById('cryptoPrices');
        const cryptos = [
            { id: 'ethereum', symbol: 'ETH', icon: 'eth-icon.png' },
            { id: 'bitcoin', symbol: 'BTC', icon: 'btc-icon.png' },
            { id: 'solana', symbol: 'SOL', icon: 'sol-icon.png' },
            { id: 'the-open-network', symbol: 'TON', icon: 'ton-icon.png' }
        ];

        container.innerHTML = cryptos.map(crypto => {
            const price = prices[crypto.id]?.usd || 0;
            return `
                <div class="crypto-price" data-crypto="${crypto.id}">
                    <img src="images/${crypto.icon}" alt="${crypto.symbol}">
                    <span class="crypto-price-value">$${this.formatPrice(price)}</span>
                </div>
            `;
        }).join('');
    }

    async updateGasPrices() {
        try {
            let data;
            
            switch (this.currentBlockchain) {
                case 'ethereum':
                    data = await this.fetchEthereumGas();
                    break;
                case 'bitcoin':
                    data = await this.fetchBitcoinGas();
                    break;
                case 'ton':
                    data = await this.fetchTonGas();
                    break;
                default:
                    data = await this.fetchEthereumGas();
            }

            if (data) {
                this.renderGasPrices(data);
                this.startProgressAnimation();
            }
        } catch (error) {
            console.error('Error updating gas prices:', error);
            this.renderGasPricesError();
        }
    }

    async fetchEthereumGas() {
        try {
            // Try multiple sources for Ethereum gas prices
            const sources = [
                'https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=YourApiKeyToken',
                'https://gas-api.metaswap.codefi.network/networks/1/suggestedGasFees',
                'https://api.blocknative.com/gasprices/blockprices'
            ];

            for (const source of sources) {
                try {
                    const response = await fetch(source);
                    const data = await response.json();
                    
                    if (source.includes('etherscan')) {
                        return {
                            slow: parseFloat(data.result.SafeGasPrice),
                            standard: parseFloat(data.result.StandardGasPrice),
                            fast: parseFloat(data.result.FastGasPrice),
                            unit: 'Gwei'
                        };
                    } else if (source.includes('metaswap')) {
                        return {
                            slow: parseFloat(data.low.suggestedMaxFeePerGas),
                            standard: parseFloat(data.medium.suggestedMaxFeePerGas),
                            fast: parseFloat(data.high.suggestedMaxFeePerGas),
                            unit: 'Gwei'
                        };
                    }
                } catch (err) {
                    console.warn(`Failed to fetch from ${source}:`, err);
                    continue;
                }
            }
            
            // Fallback to estimated values
            return {
                slow: 10,
                standard: 15,
                fast: 25,
                unit: 'Gwei'
            };
        } catch (error) {
            throw new Error('Failed to fetch Ethereum gas prices');
        }
    }

    async fetchBitcoinGas() {
        try {
            const response = await fetch('https://mempool.space/api/v1/fees/recommended');
            const data = await response.json();
            
            return {
                slow: data.hourFee,
                standard: data.halfHourFee,
                fast: data.fastestFee,
                unit: 'sat/vB'
            };
        } catch (error) {
            // Fallback values
            return {
                slow: 1,
                standard: 5,
                fast: 10,
                unit: 'sat/vB'
            };
        }
    }

    async fetchTonGas() {
        try {
            // TON gas estimation (simplified)
            const response = await fetch('https://toncenter.com/api/v2/getAddressInformation?address=EQD4FPq-PRDieyQKkizFTRtSDyucUIqrj0v_zXJmqaDp6_0t');
            
            // TON has very low and predictable fees
            return {
                slow: 0.005,
                standard: 0.01,
                fast: 0.02,
                unit: 'TON'
            };
        } catch (error) {
            return {
                slow: 0.005,
                standard: 0.01,
                fast: 0.02,
                unit: 'TON'
            };
        }
    }

    async calculateUsdPrices(gasData) {
        try {
            let coinId;
            switch (this.currentBlockchain) {
                case 'ethereum':
                    coinId = 'ethereum';
                    break;
                case 'bitcoin':
                    coinId = 'bitcoin';
                    break;
                case 'ton':
                    coinId = 'the-open-network';
                    break;
                default:
                    coinId = 'ethereum';
            }

            const priceResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
            const priceData = await priceResponse.json();
            const tokenPrice = priceData[coinId]?.usd || 0;

            if (this.currentBlockchain === 'ethereum') {
                // Convert Gwei to ETH and multiply by price
                return {
                    slowUsd: (gasData.slow / 1000000000) * 21000 * tokenPrice,
                    standardUsd: (gasData.standard / 1000000000) * 21000 * tokenPrice,
                    fastUsd: (gasData.fast / 1000000000) * 21000 * tokenPrice
                };
            } else if (this.currentBlockchain === 'bitcoin') {
                // Estimate transaction size (250 bytes average)
                const avgTxSize = 250;
                return {
                    slowUsd: (gasData.slow * avgTxSize / 100000000) * tokenPrice,
                    standardUsd: (gasData.standard * avgTxSize / 100000000) * tokenPrice,
                    fastUsd: (gasData.fast * avgTxSize / 100000000) * tokenPrice
                };
            } else {
                // TON - direct multiplication
                return {
                    slowUsd: gasData.slow * tokenPrice,
                    standardUsd: gasData.standard * tokenPrice,
                    fastUsd: gasData.fast * tokenPrice
                };
            }
        } catch (error) {
            return {
                slowUsd: 0,
                standardUsd: 0,
                fastUsd: 0
            };
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
                priceElement.textContent = this.formatGasPrice(gasData[speed]);
                unitElement.textContent = gasData.unit;
                usdElement.textContent = `$${this.formatPrice(usdPrices[`${speed}Usd`])}`;
            }
        });
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
            const [marketCap, fearGreed, altseason, trending] = await Promise.all([
                this.fetchWithCache('/api_v2/?action=market_cap', 300000),
                this.fetchWithCache('/api_v2/?action=fear_greed', 3600000),
                this.fetchWithCache('/api_v2/?action=altseason', 3600000),
                this.fetchCoingeckoTrending()
            ]);

            if (marketCap) this.renderMarketCap(marketCap);
            if (fearGreed) this.renderFearGreed(fearGreed);
            if (altseason) this.renderAltseason(altseason);
            if (trending) this.renderTokenLists(trending);
            
            this.initializeCharts();
        } catch (error) {
            console.error('Error updating market data:', error);
        }
    }

    async fetchCoingeckoTrending() {
        try {
            const [trending, gainers] = await Promise.all([
                fetch('https://api.coingecko.com/api/v3/search/trending').then(r => r.json()),
                fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=percent_change_24h_desc&per_page=10&page=1').then(r => r.json())
            ]);

            return {
                trending: trending.coins?.slice(0, 5) || [],
                gainers: gainers?.slice(0, 5) || []
            };
        } catch (error) {
            console.error('Error fetching trending data:', error);
            return { trending: [], gainers: [] };
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

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
        ctx.lineWidth = 20;
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-tertiary');
        ctx.stroke();

        // Draw value arc
        const angle = Math.PI + (value / 100) * Math.PI;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, angle);
        ctx.lineWidth = 20;
        
        // Color based on value
        if (value <= 20) ctx.strokeStyle = '#ef4444';
        else if (value <= 40) ctx.strokeStyle = '#f59e0b';
        else if (value <= 60) ctx.strokeStyle = '#eab308';
        else if (value <= 80) ctx.strokeStyle = '#10b981';
        else ctx.strokeStyle = '#059669';
        
        ctx.stroke();

        // Draw pointer
        const pointerAngle = Math.PI + (value / 100) * Math.PI;
        const pointerX = centerX + Math.cos(pointerAngle) * (radius - 10);
        const pointerY = centerY + Math.sin(pointerAngle) * (radius - 10);
        
        ctx.beginPath();
        ctx.arc(pointerX, pointerY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary');
        ctx.fill();
    }

    renderAltseason(data) {
        const valueElement = document.getElementById('altseasonValue');
        const statusElement = document.getElementById('altseasonStatus');
        const progressElement = document.getElementById('altseasonProgress');
        const markerElement = document.getElementById('altseasonMarker');

        if (valueElement && statusElement && progressElement && markerElement) {
            const value = data.index || data.current?.index || 50;
            
            valueElement.textContent = Math.round(value);
            progressElement.style.width = `${value}%`;
            markerElement.style.left = `${value}%`;

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
        }
    }

    renderTokenLists(data) {
        this.renderTrendingTokens(data.trending);
        this.renderTopGainers(data.gainers);
    }

    renderTrendingTokens(tokens) {
        const container = document.getElementById('trendingTokens');
        if (!container || !tokens.length) return;

        container.innerHTML = tokens.map(token => {
            const coin = token.item || token;
            return `
                <div class="token-item">
                    <div class="token-info">
                        <img src="${coin.thumb || coin.image}" alt="${coin.name}" class="token-icon">
                        <div class="token-details">
                            <h4>${coin.name}</h4>
                            <p>${coin.symbol?.toUpperCase()}</p>
                        </div>
                    </div>
                    <div class="token-stats">
                        <div class="token-price">$${this.formatPrice(coin.current_price || 0)}</div>
                        <div class="token-change ${(coin.price_change_percentage_24h || 0) >= 0 ? 'positive' : 'negative'}">
                            ${this.formatPercentage(coin.price_change_percentage_24h || 0)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderTopGainers(tokens) {
        const container = document.getElementById('topGainers');
        if (!container || !tokens.length) return;

        container.innerHTML = tokens.map(token => `
            <div class="token-item">
                <div class="token-info">
                    <img src="${token.image}" alt="${token.name}" class="token-icon">
                    <div class="token-details">
                        <h4>${token.name}</h4>
                        <p>${token.symbol?.toUpperCase()}</p>
                    </div>
                </div>
                <div class="token-stats">
                    <div class="token-price">$${this.formatPrice(token.current_price || 0)}</div>
                    <div class="token-change positive">
                        +${this.formatPercentage(token.price_change_percentage_24h || 0)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    async updateNews() {
        try {
            const news = await this.fetchWithCache('/api_v2/?action=news', 1800000); // 30 minutes cache
            if (news && news.length) {
                this.renderNews(news);
            } else {
                // Fallback to mock news
                this.renderNews(this.getMockNews());
            }
        } catch (error) {
            console.error('Error updating news:', error);
            this.renderNews(this.getMockNews());
        }
    }

    getMockNews() {
        return [
            {
                title: "Bitcoin Reaches New All-Time High",
                excerpt: "Bitcoin continues its bullish momentum as institutional adoption grows...",
                image: "images/default-crypto-news.jpg",
                link: "#",
                date: new Date().toISOString()
            },
            {
                title: "Ethereum 2.0 Staking Rewards Increase",
                excerpt: "Ethereum staking rewards see significant increase following network upgrades...",
                image: "images/default-crypto-news.jpg",
                link: "#",
                date: new Date().toISOString()
            },
            {
                title: "DeFi TVL Surpasses $100 Billion",
                excerpt: "Decentralized Finance total value locked reaches new milestone...",
                image: "images/default-crypto-news.jpg",
                link: "#",
                date: new Date().toISOString()
            }
        ];
    }

    renderNews(articles) {
        const container = document.getElementById('newsGrid');
        if (!container) return;

        container.innerHTML = articles.slice(0, 6).map(article => `
            <div class="news-card" onclick="window.open('${article.link}', '_blank')">
                <div class="news-image" style="background-image: url('${article.image || 'images/default-crypto-news.jpg'}')"></div>
                <div class="news-content">
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-excerpt">${article.excerpt || ''}</p>
                    <div class="news-meta">
                        <span class="news-date">${this.formatDate(article.date)}</span>
                        <a href="${article.link}" class="read-more" target="_blank" onclick="event.stopPropagation()">Read more</a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    initializeCharts() {
        this.initializeMarketCapChart();
    }

    async initializeMarketCapChart() {
        try {
            const chartData = await this.fetchWithCache('/api_v2/?action=market_cap_chart', 3600000);
            if (!chartData || !chartData.market_cap) return;

            const canvas = document.getElementById('marketCapChart');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');

            // Destroy existing chart
            if (this.charts.marketCap) {
                this.charts.marketCap.destroy();
            }

            const timestamps = chartData.market_cap.timestamps || [];
            const values = chartData.market_cap.values || [];
            const volumeValues = chartData.volume?.values || [];

            this.charts.marketCap = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: timestamps.map(ts => new Date(ts)),
                    datasets: [
                        {
                            label: 'Market Cap',
                            data: values,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Volume',
                            data: volumeValues,
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.4,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: '#3b82f6',
                            borderWidth: 1,
                            callbacks: {
                                label: (context) => {
                                    const value = context.parsed.y;
                                    const label = context.dataset.label;
                                    return `${label}: $${this.formatLargeNumber(value)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'day'
                            },
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted')
                            }
                        },
                        y: {
                            position: 'left',
                            grid: {
                                color: 'rgba(148, 163, 184, 0.1)'
                            },
                            ticks: {
                                color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted'),
                                callback: (value) => '$' + this.formatLargeNumber(value)
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: false,
                            position: 'right'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing market cap chart:', error);
        }
    }

    updateChartsTheme() {
        if (this.charts.marketCap) {
            const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted');
            this.charts.marketCap.options.scales.x.ticks.color = textColor;
            this.charts.marketCap.options.scales.y.ticks.color = textColor;
            this.charts.marketCap.update();
        }
    }

    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    selectBlockchain(blockchain) {
        this.currentBlockchain = blockchain;
        
        // Update UI
        document.querySelectorAll('.blockchain-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-blockchain="${blockchain}"]`).classList.add('active');
        
        // Update gas prices
        this.updateGasPrices();
        
        // Save preference
        localStorage.setItem('gasnow-blockchain', blockchain);
    }

    startAutoUpdate() {
        setInterval(() => {
            if (!this.isLoading) {
                this.updateCryptoPrices();
                this.updateGasPrices();
            }
        }, this.updateInterval);

        // Update market data less frequently
        setInterval(() => {
            if (!this.isLoading) {
                this.updateMarketData();
            }
        }, this.updateInterval * 10);

        // Update news even less frequently
        setInterval(() => {
            if (!this.isLoading) {
                this.updateNews();
            }
        }, this.updateInterval * 20);
    }

    async fetchWithCache(url, cacheTime = 300000) {
        const cacheKey = url;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < cacheTime) {
            return cached.data;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.cache.set(cacheKey, { data, timestamp: Date.now() });
            return data;
        } catch (error) {
            console.error(`Fetch error for ${url}:`, error);
            return cached?.data || null;
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

    showError(message) {
        console.error(message);
        // Could implement a toast notification system here
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

    formatPercentage(value) {
        if (value === 0 || value === null || value === undefined) return '0.00%';
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
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

    formatDate(dateString) {
        if (!dateString) return 'Recently';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return date.toLocaleDateString();
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

// Modal functions
function showDonationModal() {
    const modal = document.getElementById('donationModal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeDonationModal() {
    const modal = document.getElementById('donationModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gasNowApp = new GasNowApp();
});

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('donationModal');
    if (modal && e.target === modal) {
        closeDonationModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeDonationModal();
    }
    
    if (e.key === 't' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        document.getElementById('themeToggle').click();
    }
});