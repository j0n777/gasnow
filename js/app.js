class GasNowApp {
    constructor() {
        this.currentBlockchain = 'ethereum';
        this.updateInterval = 30000; // 30 seconds
        this.charts = {};
        this.cache = new Map();
        this.isLoading = false;
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing GasNow App...');
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

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

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
                const response = await fetch('/api_v2/?action=prices&coins=ethereum,bitcoin,solana,the-open-network&currencies=usd');
                if (response.ok) {
                    prices = await response.json();
                }
            } catch (error) {
                console.warn('Local API failed, using fallback data');
            }

            if (!prices) {
                // Use fallback data
                prices = {
                    ethereum: { usd: 2500, usd_24h_change: 1.5 },
                    bitcoin: { usd: 45000, usd_24h_change: 2.1 },
                    solana: { usd: 120, usd_24h_change: -0.8 },
                    'the-open-network': { usd: 2.5, usd_24h_change: 3.2 }
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
            { id: 'ethereum', symbol: 'ETH', icon: 'eth-icon.png' },
            { id: 'bitcoin', symbol: 'BTC', icon: 'btc-icon.png' },
            { id: 'solana', symbol: 'SOL', icon: 'sol-icon.png' },
            { id: 'the-open-network', symbol: 'TON', icon: 'ton-icon.png' }
        ];

        container.innerHTML = cryptos.map(crypto => {
            const price = prices[crypto.id]?.usd || 0;
            const change = prices[crypto.id]?.usd_24h_change || 0;
            const changeClass = change >= 0 ? 'positive' : 'negative';
            
            return `
                <div class="crypto-price" data-crypto="${crypto.id}">
                    <img src="images/${crypto.icon}" alt="${crypto.symbol}" onerror="this.style.display='none'">
                    <div class="crypto-price-info">
                        <span class="crypto-price-value">$${this.formatPrice(price)}</span>
                        <span class="crypto-price-change ${changeClass}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderCryptoPricesError() {
        const container = document.getElementById('cryptoPrices');
        if (!container) return;

        container.innerHTML = `
            <div class="crypto-price error">
                <span class="crypto-price-value">Error loading prices</span>
            </div>
        `;
    }

    async updateGasPrices() {
        try {
            console.log(`⛽ Updating gas prices for ${this.currentBlockchain}...`);
            let data;
            
            // Try to fetch from our API first
            try {
                const response = await fetch(`/api/gas-prices?blockchain=${this.currentBlockchain}`);
                if (response.ok) {
                    data = await response.json();
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
                priceElement.textContent = this.formatGasPrice(gasData[speed]);
                unitElement.textContent = gasData.unit;
                usdElement.textContent = `$${this.formatPrice(usdPrices[`${speed}Usd`])}`;
            }
        });
    }

    async calculateUsdPrices(gasData) {
        try {
            // Simple estimation for USD prices
            const estimatedPrices = {
                ethereum: 2500,
                bitcoin: 45000,
                ton: 2.5
            };

            let tokenPrice = estimatedPrices.ethereum;
            if (this.currentBlockchain === 'bitcoin') tokenPrice = estimatedPrices.bitcoin;
            if (this.currentBlockchain === 'ton') tokenPrice = estimatedPrices.ton;

            if (this.currentBlockchain === 'ethereum') {
                const gasLimit = 21000;
                return {
                    slowUsd: (gasData.slow / 1000000000) * gasLimit * tokenPrice,
                    standardUsd: (gasData.standard / 1000000000) * gasLimit * tokenPrice,
                    fastUsd: (gasData.fast / 1000000000) * gasLimit * tokenPrice
                };
            } else if (this.currentBlockchain === 'bitcoin') {
                const avgTxSize = 250;
                return {
                    slowUsd: (gasData.slow * avgTxSize / 100000000) * tokenPrice,
                    standardUsd: (gasData.standard * avgTxSize / 100000000) * tokenPrice,
                    fastUsd: (gasData.fast * avgTxSize / 100000000) * tokenPrice
                };
            } else {
                return {
                    slowUsd: gasData.slow * tokenPrice,
                    standardUsd: gasData.standard * tokenPrice,
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
                const marketResponse = await fetch('/api_v2/?action=market_cap');
                if (marketResponse.ok) {
                    marketCap = await marketResponse.json();
                }
            } catch (error) {
                console.warn('Market cap API failed');
            }

            try {
                const fearResponse = await fetch('/api_v2/?action=fear_greed');
                if (fearResponse.ok) {
                    fearGreed = await fearResponse.json();
                }
            } catch (error) {
                console.warn('Fear & Greed API failed');
            }

            try {
                const altResponse = await fetch('/api_v2/?action=altseason');
                if (altResponse.ok) {
                    altseason = await altResponse.json();
                }
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
            this.renderTokenLists({ trending: [], gainers: [] });
            
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
            const radius = Math.min(centerX, centerY) - 10;

            // Clear canvas
            ctx.clearRect(0, 0, rect.width, rect.height);

            // Draw background arc
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
            ctx.lineWidth = 20;
            ctx.strokeStyle = '#334155';
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
        } catch (error) {
            console.warn('Error drawing Fear & Greed gauge:', error);
        }
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
        // Render empty or fallback token lists
        const trendingContainer = document.getElementById('trendingTokens');
        const gainersContainer = document.getElementById('topGainers');

        if (trendingContainer) {
            trendingContainer.innerHTML = '<p>Loading trending tokens...</p>';
        }

        if (gainersContainer) {
            gainersContainer.innerHTML = '<p>Loading top gainers...</p>';
        }
    }

    async updateNews() {
        try {
            console.log('📰 Updating news...');
            
            let news;
            try {
                const response = await fetch('/api_v2/?action=news');
                if (response.ok) {
                    news = await response.json();
                }
            } catch (error) {
                console.warn('News API failed, using fallback');
            }

            if (!news || !news.length) {
                news = this.getMockNews();
            }
            
            this.renderNews(news);
            console.log('✅ News updated');
        } catch (error) {
            console.error('❌ Error updating news:', error);
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
        // Only try to initialize charts if Chart.js is available
        if (typeof Chart !== 'undefined') {
            this.initializeMarketCapChart();
        } else {
            console.warn('Chart.js not available, skipping chart initialization');
        }
    }

    async initializeMarketCapChart() {
        try {
            const canvas = document.getElementById('marketCapChart');
            if (!canvas) return;

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
                                callback: (value) => '$' + this.formatLargeNumber(value)
                            }
                        }
                    }
                }
            });
            
            console.log('✅ Market cap chart initialized');
        } catch (error) {
            console.error('❌ Error initializing market cap chart:', error);
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
        this.currentBlockchain = blockchain;
        
        // Update UI
        document.querySelectorAll('.blockchain-btn').forEach(btn => {
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
            }
        }, this.updateInterval * 10);

        // Update news every 30 minutes
        setInterval(() => {
            if (!this.isLoading) {
                this.updateNews();
            }
        }, this.updateInterval * 60);
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
        
        // Set basic gas prices
        this.renderGasPricesError();
        
        // Set basic market data
        const totalElement = document.getElementById('totalMarketCap');
        const changeElement = document.getElementById('marketCapChange');
        const volumeElement = document.getElementById('totalVolume');
        
        if (totalElement) totalElement.textContent = '$2.50T';
        if (changeElement) changeElement.textContent = '+1.50%';
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
        if (altStatusElement) altStatusElement.textContent = 'Neutral';
        
        // Show basic news
        this.renderNews(this.getMockNews());
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
    }
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
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.click();
        }
    }
});