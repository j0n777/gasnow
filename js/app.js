document.addEventListener('DOMContentLoaded', function() {
    // Código de diagnóstico - verificar disponibilidade dos elementos
    console.log('DOM carregado. Verificando elementos dos gráficos:');
    console.log('Market Cap Chart container:', document.querySelector('#market-cap-chart') ? 'Existe' : 'Não existe');
    console.log('Fear & Greed Container:', document.querySelector('.fear-greed-container') ? 'Existe' : 'Não existe');
    console.log('Altseason Container:', document.querySelector('.altseason-container') ? 'Existe' : 'Não existe');
    
    // Verificar se a biblioteca ApexCharts está carregada
    console.log('ApexCharts disponível:', typeof ApexCharts !== 'undefined' ? 'Sim' : 'Não');
    
    // Inicializar componentes principais com verificação de erros
    try {
        initializeHeaderCryptoPrices();
    } catch (error) {
        console.error('Erro ao inicializar preços de cryptos no header:', error);
    }
    
    try {
        updateGasPrices();
    } catch (error) {
        console.error('Erro ao atualizar preços de gas:', error);
    }
    
    try {
        updateMarketCap();
    } catch (error) {
        console.error('Erro ao atualizar market cap:', error);
    }
    
    try {
        updateNews();
    } catch (error) {
        console.error('Erro ao atualizar notícias:', error);
    }
    
    // Inicializar os gráficos com um pequeno atraso para garantir que o DOM está completamente pronto
    console.log('Agendando inicialização dos gráficos...');
    
    // Primeiro, limpar quaisquer gráficos que possam estar em um estado inconsistente
    if (typeof marketCapChart !== 'undefined' && marketCapChart) {
        try {
            marketCapChart.destroy();
            console.log('Market Cap Chart destruído para reinicialização');
        } catch (e) {
            console.warn('Não foi possível destruir Market Cap Chart:', e);
        }
    }
    
    if (typeof fearGreedGauge !== 'undefined' && fearGreedGauge) {
        try {
            fearGreedGauge.destroy();
            console.log('Fear & Greed Gauge destruído para reinicialização');
        } catch (e) {
            console.warn('Não foi possível destruir Fear & Greed Gauge:', e);
        }
    }
    
    if (typeof altseasonChart !== 'undefined' && altseasonChart) {
        try {
            altseasonChart.destroy();
            console.log('Altseason Chart destruído para reinicialização');
        } catch (e) {
            console.warn('Não foi possível destruir Altseason Chart:', e);
        }
    }
    
    // Aguardar um pouco para garantir que o DOM está completamente montado
    setTimeout(() => {
        // Inicializar os gráficos usando a função do charts.js que já tem delay sequencial
        if (typeof initializeCharts === 'function') {
            initializeCharts().then(() => {
                console.log('Inicialização dos gráficos concluída');
            }).catch(error => {
                console.error('Erro na inicialização dos gráficos:', error);
            });
        } else {
            console.error('Função initializeCharts não encontrada');
        }
    }, 500);
    
    // Configurar intervalos de atualização
    setInterval(updateGasPrices, 30000);
    setInterval(updateCryptoPrices, 180000);
    setInterval(updateMarketCap, 600000);
    setInterval(updateNews, 3600000);
    
    // Adicionar event listeners com verificação de existência
    const blockchainSelect = document.getElementById('blockchain-select');
    if (blockchainSelect) {
        blockchainSelect.addEventListener('change', function() {
            updateGasPrices(this.value);
        });
    } else {
        console.warn('Elemento blockchain-select não encontrado');
    }
    
    // Inicializar tooltip se os elementos existirem
    const marketCapValue = document.getElementById('market-cap-value');
    const tooltip = document.getElementById('market-cap-tooltip');
    if (marketCapValue && tooltip) {
        initializeTooltip(marketCapValue, tooltip);
    }

    // Garantir que os gráficos sejam inicializados
    window.disableChartsReload = false;
    
    // Aguardar um momento para garantir que todos os elementos estejam prontos
    setTimeout(async function() {
        console.log('Forçando inicialização dos gráficos após carregamento da página...');
        
        try {
            if (typeof window.initializeCharts === 'function') {
                await window.initializeCharts();
            } else if (typeof initializeCharts === 'function') {
                await initializeCharts();
            } else {
                console.error('Função de inicialização de gráficos não encontrada');
            }
        } catch (error) {
            console.error('Erro ao forçar inicialização dos gráficos:', error);
        }
    }, 500);

    // Carregar preferências do usuário
    loadUserPreferences();
    
    // Adicionar evento para salvar tema - CORREÇÃO: Verificar se o elemento existe antes
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const isDarkMode = !document.body.classList.contains('light-mode');
            document.body.classList.toggle('light-mode');
            
            const icon = this.querySelector('i');
            if (icon) {
                if (isDarkMode) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                    localStorage.setItem('theme', 'light');
                } else {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                    localStorage.setItem('theme', 'dark');
                }
            } else {
                localStorage.setItem('theme', isDarkMode ? 'light' : 'dark');
            }
        });
    }
    
    // Adicionar evento para salvar blockchain selecionada
    document.querySelectorAll('.crypto-price').forEach(function(elem) {
        elem.addEventListener('click', function() {
            document.querySelectorAll('.crypto-price').forEach(e => e.classList.remove('active'));
            this.classList.add('active');
            const chain = this.getAttribute('data-chain');
            localStorage.setItem('selectedChain', chain);
            updateGasPrices(chain);
        });
    });
});

function selectBlockchain(blockchain) {
    document.querySelectorAll('.crypto-price').forEach(el => {
        el.classList.remove('selected');
    });
    document.querySelector(`.crypto-price[data-crypto="${blockchain}"]`).classList.add('selected');
    updateGasPrices(blockchain);
}

async function fetchData(action, params = {}) {
    try {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`api.php?action=${action}&${queryString}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error(`Invalid JSON response for ${action}:`, text);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching ${action}:`, error);
        return null;
    }
}

const GAS_CACHE_TTL = 30 * 1000; // 30 segundos

function getCachedGasPrices(chain) {
    const cache = localStorage.getItem('gasPricesCache');
    if (!cache) return null;
    const parsed = JSON.parse(cache);
    if (!parsed[chain]) return null;
    if (Date.now() - parsed[chain].timestamp > GAS_CACHE_TTL) return null;
    return parsed[chain].data;
}

function setCachedGasPrices(chain, data) {
    let cache = localStorage.getItem('gasPricesCache');
    cache = cache ? JSON.parse(cache) : {};
    cache[chain] = { data, timestamp: Date.now() };
    localStorage.setItem('gasPricesCache', JSON.stringify(cache));
}

// Substituir updateGasPrices para usar cache
async function updateGasPrices(chain = 'ethereum') {
    try {
        // Reset progress bars
        document.querySelectorAll('.progress-bar').forEach(bar => {
            bar.style.transition = 'none';
            bar.style.width = '0';
            void bar.offsetWidth;
            bar.style.transition = 'width 30s linear';
        });

        let data = getCachedGasPrices(chain);
        if (!data) {
            data = await fetchData('gas_prices', { blockchain: chain });
            if (data) setCachedGasPrices(chain, data);
        }
        if (data) {
            // Se não houver campos USD, calcular dinamicamente
            let needUsd = (!('slowUsd' in data) || !('standardUsd' in data) || !('fastUsd' in data));
            let usdPrices = { slowUsd: data.slowUsd, standardUsd: data.standardUsd, fastUsd: data.fastUsd };
            if (needUsd) {
                // Mapear chain para id do CoinGecko
                const chainToId = {
                    ethereum: 'ethereum',
                    binance: 'binancecoin',
                    polygon: 'matic-network',
                    avalanche: 'avalanche-2',
                    arbitrum: 'arbitrum',
                    optimism: 'optimism',
                    fantom: 'fantom',
                    celo: 'celo',
                    cronos: 'cronos',
                    base: 'base-protocol',
                    bitcoin: 'bitcoin',
                    ton: 'the-open-network',
                    // Adicione outros se necessário
                };
                const coingeckoId = chainToId[chain] || 'ethereum';
                try {
                    const priceResp = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`);
                    const priceJson = await priceResp.json();
                    const tokenPrice = priceJson[coingeckoId]?.usd || 0;
                    if (chain === 'ethereum') {
                        usdPrices = {
                            slowUsd: (data.slow / 1_000_000_000) * tokenPrice,
                            standardUsd: (data.standard / 1_000_000_000) * tokenPrice,
                            fastUsd: (data.fast / 1_000_000_000) * tokenPrice
                        };
                    } else if (chain === 'btc' || chain === 'bitcoin') {
                        // sat/vB * 250 bytes = total satoshis
                        const avgTxSize = 250;
                        usdPrices = {
                            slowUsd: ((data.slow * avgTxSize) / 100_000_000) * tokenPrice,
                            standardUsd: ((data.standard * avgTxSize) / 100_000_000) * tokenPrice,
                            fastUsd: ((data.fast * avgTxSize) / 100_000_000) * tokenPrice
                        };
                    } else {
                        usdPrices = {
                            slowUsd: data.slow * tokenPrice,
                            standardUsd: data.standard * tokenPrice,
                            fastUsd: data.fast * tokenPrice
                        };
                    }
                } catch (e) {
                    usdPrices = { slowUsd: 'N/A', standardUsd: 'N/A', fastUsd: 'N/A' };
                }
            }
            if (chain === 'btc') {
                updateBitcoinPriceCard('slow', data.slow, usdPrices.slowUsd);
                updateBitcoinPriceCard('standard', data.standard, usdPrices.standardUsd);
                updateBitcoinPriceCard('fast', data.fast, usdPrices.fastUsd);
            } else if (chain === 'ton') {
                updateTonPriceCard('slow', data.slow, usdPrices.slowUsd);
                updateTonPriceCard('standard', data.standard, usdPrices.standardUsd);
                updateTonPriceCard('fast', data.fast, usdPrices.fastUsd);
            } else {
                updatePriceCard('slow', data.slow, usdPrices.slowUsd, chain);
                updatePriceCard('standard', data.standard, usdPrices.standardUsd, chain);
                updatePriceCard('fast', data.fast, usdPrices.fastUsd, chain);
            }
            startTimerAnimation();
        } else {
            displayErrorInPriceCards();
        }
    } catch (error) {
        console.error('Error updating gas prices:', error);
        displayErrorInPriceCards();
    }
}

function displayErrorInPriceCards() {
    updatePriceCard('slow', 'Error', 'N/A');
    updatePriceCard('standard', 'Error', 'N/A');
    updatePriceCard('fast', 'Error', 'N/A');
}

function updatePriceCard(id, price, usdPrice, blockchain) {
    const card = document.getElementById(id);
    if (card) {
        const priceElement = card.querySelector('.price');
        const usdPriceElement = card.querySelector('.usd-price');
        if (priceElement && usdPriceElement) {
            if (price === 'Error') {
                priceElement.textContent = 'Error fetching data';
                usdPriceElement.textContent = 'N/A';
            } else if (price && !isNaN(price) && usdPrice && !isNaN(usdPrice)) {
                if (blockchain === 'eth') {
                    priceElement.innerHTML = `${parseFloat(price).toFixed(2)} <span class="gwei">Gwei</span>`;
                } else if (blockchain === 'btc') {
                    priceElement.innerHTML = `${parseFloat(price).toFixed(0)} <span class="gwei">sat/vB</span>`;
                } else if (blockchain === 'ton') {
                    priceElement.innerHTML = `${parseFloat(price).toFixed(2)} <span class="gwei">TON</span>`;
                }
                usdPriceElement.textContent = `$${parseFloat(usdPrice).toFixed(2)}`;
            } else {
                priceElement.textContent = 'N/A';
                usdPriceElement.textContent = 'N/A';
            }
        }
    }
}

function updateBitcoinPriceCard(id, satoshisPerByte, usdPrice) {
    const card = document.getElementById(id);
    if (card) {
        const priceElement = card.querySelector('.price');
        const usdPriceElement = card.querySelector('.usd-price');
        if (priceElement && usdPriceElement) {
            if (satoshisPerByte === 'Error') {
                priceElement.textContent = 'Error fetching data';
                usdPriceElement.textContent = 'N/A';
            } else if (satoshisPerByte && !isNaN(satoshisPerByte) && usdPrice && !isNaN(usdPrice)) {
                const avgTransactionSize = 250; // bytes
                const totalUsdPrice = usdPrice * avgTransactionSize;
                priceElement.innerHTML = `${parseFloat(satoshisPerByte).toFixed(2)} <span class="gwei">sat/vB</span>`;
                usdPriceElement.textContent = `$${totalUsdPrice.toFixed(2)}`;
            } else {
                priceElement.textContent = 'N/A';
                usdPriceElement.textContent = 'N/A';
            }
        }
    }
}

function updateTonPriceCard(id, tonFee, usdPrice) {
    const card = document.getElementById(id);
    if (card) {
        const priceElement = card.querySelector('.price');
        const usdPriceElement = card.querySelector('.usd-price');
        if (priceElement && usdPriceElement) {
            if (tonFee === 'Error') {
                priceElement.textContent = 'Error fetching data';
                usdPriceElement.textContent = 'N/A';
            } else if (tonFee && !isNaN(tonFee) && usdPrice && !isNaN(usdPrice)) {
                priceElement.innerHTML = `${parseFloat(tonFee).toFixed(4)} <span class="gwei">TON</span>`;
                usdPriceElement.textContent = `$${parseFloat(usdPrice).toFixed(4)}`;
            } else {
                priceElement.textContent = 'N/A';
                usdPriceElement.textContent = 'N/A';
            }
        }
    }
}

async function updateCryptoPrices() {
    try {
        const data = await fetchData('crypto_prices');
        if (data) {
            updateHeaderCryptoPrice('eth', data.ethPrice);
            updateHeaderCryptoPrice('btc', data.btcPrice);
            updateHeaderCryptoPrice('sol', data.solPrice);
            updateHeaderCryptoPrice('ton', data.tonPrice);
        }
    } catch (error) {
        console.error('Error updating crypto prices:', error);
    }
}

function updateHeaderCryptoPrice(symbol, price) {
    const element = document.querySelector(`.crypto-price[data-crypto="${symbol}"] .price-value`);
    if (element) {
        if (price !== null && !isNaN(price)) {
            element.textContent = formatCryptoPrice(price);
        } else {
            console.warn(`Invalid price for ${symbol}:`, price);
            element.textContent = 'N/A';
        }
    }
}

function formatCryptoPrice(price) {
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD', 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    }).format(price);
}

function startTimerAnimation() {
    document.querySelectorAll('.progress-bar').forEach(bar => {
        bar.style.width = '0';
        void bar.offsetWidth;
        bar.style.width = '100%';
    });
}

async function updateMarketCap() {
    try {
        const data = await fetchData('market_cap');
        if (data) {
            // Verificar se estamos recebendo o formato antigo ou novo
            if (data.globalMarketCap) {
                // Novo formato da API
                updateMarketCapDisplayFromNewFormat(data);
            } else if (data.total_market_cap) {
                // Formato antigo
                updateMarketCapDisplay(data);
            } else {
                console.error('Dados de Market Cap inválidos:', data);
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar Market Cap:', error);
    }
}

// Função para processar o novo formato de dados
function updateMarketCapDisplayFromNewFormat(data) {
    // Extrair o valor numérico do globalMarketCap (remover $ e vírgulas)
    const marketCapString = data.globalMarketCap.replace('$', '').replace(/,/g, '');
    const marketCapValue = parseFloat(marketCapString);
    
    // Extrair o valor percentual do change24h (remover %)
    const changeString = data.change24h.replace('%', '');
    const changeValue = parseFloat(changeString);
    
    // Formatar para exibição
    const totalMarketCap = formatCurrencyAbbreviated(marketCapValue);
    
    // Atualizar elementos na página
    const marketCapElement = document.getElementById('total-market-cap');
    const volumeElement = document.getElementById('total-volume');
    const changeElement = document.getElementById('market-cap-change');
    
    if (marketCapElement) marketCapElement.textContent = totalMarketCap;
    
    // Volume pode não estar disponível no novo formato
    if (volumeElement) {
        // Se tivermos dados de volume, use-os, caso contrário, mostre N/A
        volumeElement.textContent = data.totalVolume ? formatCurrencyAbbreviated(data.totalVolume) : 'N/A';
    }
    
    if (changeElement) {
        // Formatar a mudança percentual
        const changePrefix = changeValue >= 0 ? '+' : '';
        changeElement.textContent = `${changePrefix}${changeValue.toFixed(2)}%`;
        
        // Adicionar classe baseada no valor (positivo/negativo)
        changeElement.className = 'market-cap-stat-value';
        if (changeValue > 0) {
            changeElement.classList.add('positive');
        } else if (changeValue < 0) {
            changeElement.classList.add('negative');
        }
    }
}

// Adicionar a função original para o formato antigo de dados
function updateMarketCapDisplay(data) {
    // Formatar valores para exibição
    const totalMarketCap = formatCurrency(data.total_market_cap);
    const totalVolume = formatCurrency(data.total_volume);
    const change24h = data.market_cap_change_percentage_24h_usd;
    
    // Atualizar elementos na página
    const marketCapElement = document.getElementById('total-market-cap');
    const volumeElement = document.getElementById('total-volume');
    const changeElement = document.getElementById('market-cap-change');
    
    if (marketCapElement) marketCapElement.textContent = totalMarketCap;
    if (volumeElement) volumeElement.textContent = totalVolume;
    
    if (changeElement) {
        // Formatar a mudança percentual
        const changePrefix = change24h >= 0 ? '+' : '';
        changeElement.textContent = `${changePrefix}${change24h.toFixed(2)}%`;
        
        // Adicionar classe baseada no valor (positivo/negativo)
        changeElement.className = 'market-cap-stat-value';
        if (change24h > 0) {
            changeElement.classList.add('positive');
        } else if (change24h < 0) {
            changeElement.classList.add('negative');
        }
    }
}

// Função para formatar valores monetários (ex: $1.23T, $4.56B)
function formatCurrencyAbbreviated(value) {
    if (value === undefined || value === null || isNaN(value)) {
        return '$0';
    }
    
    // Definir os sufixos para diferentes escalas
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    
    // Determinar o índice do sufixo
    const suffixIndex = Math.floor(Math.log10(Math.abs(value)) / 3);
    
    // Calcular o valor formatado
    const formattedValue = suffixIndex === 0 ? 
        value : 
        (value / Math.pow(10, suffixIndex * 3)).toFixed(2);
    
    // Retornar o valor formatado com o símbolo de dólar e o sufixo apropriado
    return `$${formattedValue}${suffixes[suffixIndex]}`;
}

function initializeTooltip(triggerElement, tooltipElement) {
    if (triggerElement && tooltipElement) {
        triggerElement.addEventListener('mousemove', (e) => {
            const x = e.clientX;
            const y = e.clientY;
            
            tooltipElement.style.visibility = 'visible';
            tooltipElement.style.opacity = '1';
            
            // Position the tooltip near the cursor
            tooltipElement.style.left = `${x + 10}px`;
            tooltipElement.style.top = `${y + 10}px`;
        });

        triggerElement.addEventListener('mouseleave', () => {
            tooltipElement.style.visibility = 'hidden';
            tooltipElement.style.opacity = '0';
        });
    }
}

function formatTokenPrice(price) {
    if (price < 0.01) {
        return price.toFixed(8);
    }
    return price.toFixed(2);
}

function updateTrendingTokens(tokens) {
    updateTokenList('trending-tokens', tokens);
}

function updateLargestGainers(tokens) {
    updateTokenList('largest-gainers', tokens);
}

function updateTokenList(containerId, tokens) {
    const container = document.getElementById(containerId);
    if (container && tokens) {
        container.innerHTML = tokens.map(token => `
            <div class="token">
                <div class="token-left">
                    <img src="${token.icon}" alt="${token.name}" class="token-icon">
                    <div class="token-info">
                        <span class="token-name">${token.name}</span>
                        <span class="token-symbol">${token.symbol}</span>
                    </div>
                </div>
                <div class="token-right">
                    <div class="token-price">$${formatTokenPrice(parseFloat(token.price))}</div>
                    <div class="token-change ${parseFloat(token.change24h) >= 0 ? 'positive' : 'negative'}">
                        <span class="token-change-arrow">${parseFloat(token.change24h) >= 0 ? '▲' : '▼'}</span>
                        ${Math.abs(parseFloat(token.change24h)).toFixed(2)}%
                    </div>
                </div>
            </div>
        `).join('');
    }
}

async function updateNews() {
    try {
        const news = await fetchData('news');
        const newsContainer = document.getElementById('news-container');
        if (newsContainer && news) {
            newsContainer.innerHTML = news.map(article => `
                <div class="news-article">
                    <div class="news-image" style="background-image: url('${article.image}')"></div>
                    <div class="news-content">
                        <h3><a href="${article.link}" target="_blank">${article.title}</a></h3>
                        <p>${article.excerpt}</p>
                        <a href="${article.link}" target="_blank" class="read-more">Read more</a>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error updating news:', error);
    }
}

function initializeHeaderCryptoPrices() {
    const cryptoPrices = document.querySelectorAll('#crypto-prices .crypto-price span');
    cryptoPrices.forEach(priceSpan => {
        const initialPrice = priceSpan.textContent.split('$')[1];
        if (!isNaN(parseFloat(initialPrice))) {
            const symbol = priceSpan.textContent.split(':')[0];
            updateHeaderCryptoPrice(symbol, parseFloat(initialPrice));
        }
    });
}

// A inicialização real é feita pela função no charts.js
async function initializeChartsWrapper() {
    try {
        console.log('Redirecionando para a função de inicialização no charts.js...');
        
        // Verificar se a função existe no charts.js
        if (typeof window.initializeCharts === 'function') {
            return await window.initializeCharts();
        }
        
        // Fallback para inicialização direta se a função do charts.js não existir
        console.log('Iniciando inicialização direta dos gráficos (fallback)...');
        
        // Inicializar os gráficos diretamente, sem depender do ChartManager
        if (typeof initMarketCapChart === 'function') {
            console.log('Inicializando Market Cap Chart...');
            await initMarketCapChart();
        } else {
            console.error('Função initMarketCapChart não encontrada');
        }
        
        if (typeof initFearGreedIndex === 'function') {
            console.log('Inicializando Fear & Greed Index...');
            await initFearGreedIndex();
        } else {
            console.error('Função initFearGreedIndex não encontrada');
        }
        
        if (typeof initAltseasonIndex === 'function') {
            console.log('Inicializando Altseason Index...');
            await initAltseasonIndex();
        } else {
            console.error('Função initAltseasonIndex não encontrada');
        }
        
        console.log('Todos os gráficos foram inicializados com sucesso.');
    } catch (error) {
        console.error('Erro na inicialização dos gráficos:', error);
    }
}

// Usar a função wrapper para inicialização
const initializeCharts = initializeChartsWrapper;

// Variável para armazenar o timer de debounce do resize
// Verificar se a variável já existe para evitar redeclaração
let resizeTimer;

// Código para detectar quando o redimensionamento está ocorrendo
window.isResizing = false;
window.disableChartsReload = false; // Permitir o carregamento inicial dos gráficos

window.addEventListener('resize', function() {
    window.isResizing = true;
    
    // Desativar explicitamente o recarregamento dos gráficos durante o redimensionamento
    window.disableChartsReload = true;
    
    clearTimeout(window.resizeEndTimer);
    window.resizeEndTimer = setTimeout(function() {
        window.isResizing = false;
        
        // Reativar o carregamento dos gráficos após o redimensionamento
        window.disableChartsReload = false;
    }, 1000); // Aumentar o tempo para garantir que o redimensionamento seja completamente concluído
});

// Adicionar evento de resize para ajustar os gráficos quando a janela for redimensionada
// Usando debounce para evitar múltiplas chamadas durante o redimensionamento
/*
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        console.log('Janela redimensionada, atualizando gráficos...');
        
        // Usar a função de inicialização sequencial do charts.js
        if (typeof window.initializeCharts === 'function') {
            window.initializeCharts().catch(e => console.error('Erro ao reinicializar gráficos após resize:', e));
        } else {
            // Fallback para inicialização individual
            if (typeof initMarketCapChart === 'function' && chartsInitialized && !chartsInitialized.marketCap) {
                initMarketCapChart().catch(e => console.error('Erro ao reinicializar Market Cap Chart:', e));
            }
        }
    }, 500);
});
*/

// Função para formatar valores monetários de forma mais legível
function formatCurrency(value) {
    if (!value && value !== 0) return '$0';
    
    // Formatar para trilhões, bilhões ou milhões com 2 casas decimais
    if (value >= 1e12) {
        return '$' + (value / 1e12).toFixed(2) + 'T';
    } else if (value >= 1e9) {
        return '$' + (value / 1e9).toFixed(2) + 'B';
    } else if (value >= 1e6) {
        return '$' + (value / 1e6).toFixed(2) + 'M';
    } else if (value >= 1e3) {
        return '$' + (value / 1e3).toFixed(2) + 'K';
    }
    
    // Para valores menores, usar formato padrão
    return '$' + value.toFixed(2);
}

// Adicionar código para salvar e carregar preferências do usuário (tema e blockchain)
function loadUserPreferences() {
    // Carregar tema
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        const themeToggle = document.querySelector('.theme-toggle i');
        if (themeToggle) {
            themeToggle.classList.remove('fa-moon');
            themeToggle.classList.add('fa-sun');
        }
    }
    
    // Carregar blockchain selecionada
    const savedChain = localStorage.getItem('selectedChain');
    if (savedChain) {
        document.querySelectorAll('.crypto-price').forEach(el => {
            el.classList.remove('active');
            if (el.getAttribute('data-chain') === savedChain) {
                el.classList.add('active');
            }
        });
        
        // Atualizar preços de gás para a blockchain selecionada
        updateGasPrices(savedChain);
    }
}

// Modificar a função getSolanaGasData para calcular corretamente as taxas da Solana
async function getSolanaGasData() {
    try {
        // Taxa base da Solana (5000 lamports por assinatura)
        const BASE_FEE_LAMPORTS = 5000;
        
        // Converter lamports para SOL (1 SOL = 1,000,000,000 lamports)
        const LAMPORTS_TO_SOL = 0.000000001;
        
        // Transação padrão usa 1 assinatura
        const STANDARD_SIGNATURES = 1;
        
        // Obter preço atual do SOL em USD
        const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const priceData = await priceResponse.json();
        const solPrice = priceData?.solana?.usd || 0;
        
        console.log('Preço do SOL:', solPrice);
        
        try {
            // Tentar obter dados de priorização de taxas do RPC
            const endpoint = 'https://solana-mainnet.g.alchemy.com/v2/demo';
            
            const rpcResponse = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getRecentPrioritizationFees"
                })
            });
            
            const rpcData = await rpcResponse.json();
            
            if (rpcData && rpcData.result && rpcData.result.length > 0) {
                // Extrair taxas de priorização em lamports
                const priorityFees = rpcData.result.map(item => parseInt(item.prioritizationFee || 0));
                
                // Ordenar taxas para calcular percentis
                priorityFees.sort((a, b) => a - b);
                
                // Calcular taxas para diferentes níveis de prioridade (10º, 50º e 90º percentis)
                const slowIndex = Math.floor(priorityFees.length * 0.1);
                const standardIndex = Math.floor(priorityFees.length * 0.5);
                const fastIndex = Math.floor(priorityFees.length * 0.9);
                
                let slowPriorityFee = priorityFees[slowIndex] || 0;
                let standardPriorityFee = priorityFees[standardIndex] || 0;
                let fastPriorityFee = priorityFees[fastIndex] || 0;
                
                // Garantir valores mínimos razoáveis
                slowPriorityFee = Math.max(slowPriorityFee, 1);
                standardPriorityFee = Math.max(standardPriorityFee, 10);
                fastPriorityFee = Math.max(fastPriorityFee, 100);
                
                // Calcular taxas totais em lamports (base + prioridade)
                const slowTotalLamports = BASE_FEE_LAMPORTS + slowPriorityFee;
                const standardTotalLamports = BASE_FEE_LAMPORTS + standardPriorityFee;
                const fastTotalLamports = BASE_FEE_LAMPORTS + fastPriorityFee;
                
                // Converter para SOL
                const slowSol = slowTotalLamports * LAMPORTS_TO_SOL;
                const standardSol = standardTotalLamports * LAMPORTS_TO_SOL;
                const fastSol = fastTotalLamports * LAMPORTS_TO_SOL;
                
                // Calcular valores em USD
                const slowUsd = slowSol * solPrice;
                const standardUsd = standardSol * solPrice;
                const fastUsd = fastSol * solPrice;
                
                console.log('Dados de gás da Solana calculados (RPC):', {
                    slow: slowSol,
                    standard: standardSol,
                    fast: fastSol,
                    slowLamports: slowTotalLamports,
                    standardLamports: standardTotalLamports,
                    fastLamports: fastTotalLamports
                });
                
                return {
                    slow: slowSol,
                    standard: standardSol,
                    fast: fastSol,
                    slowUsd,
                    standardUsd,
                    fastUsd,
                    unit: 'SOL'
                };
            }
        } catch (rpcError) {
            console.warn('Erro ao obter dados do RPC da Solana:', rpcError);
        }
        
        // Se não conseguimos dados do RPC, usar valores típicos com base no Solscan
        // Valores de referência baseados no Solscan Fee Tracker
        const slowPriorityFee = 1; // Quase nenhuma priorização
        const standardPriorityFee = 13; // Valor médio típico
        const fastPriorityFee = 1000; // Alta priorização
        
        // Calcular taxas totais em lamports (base + prioridade)
        const slowTotalLamports = BASE_FEE_LAMPORTS + slowPriorityFee;
        const standardTotalLamports = BASE_FEE_LAMPORTS + standardPriorityFee;
        const fastTotalLamports = BASE_FEE_LAMPORTS + fastPriorityFee;
        
        // Converter para SOL
        const slowSol = slowTotalLamports * LAMPORTS_TO_SOL;
        const standardSol = standardTotalLamports * LAMPORTS_TO_SOL;
        const fastSol = fastTotalLamports * LAMPORTS_TO_SOL;
        
        // Calcular valores em USD
        const slowUsd = slowSol * solPrice;
        const standardUsd = standardSol * solPrice;
        const fastUsd = fastSol * solPrice;
        
        console.log('Dados de gás da Solana calculados (valores típicos):', {
            slow: slowSol,
            standard: standardSol,
            fast: fastSol,
            slowUsd,
            standardUsd,
            fastUsd
        });
        
        return {
            slow: slowSol,
            standard: standardSol,
            fast: fastSol,
            slowUsd,
            standardUsd,
            fastUsd,
            unit: 'SOL'
        };
    } catch (error) {
        console.error('Erro ao calcular taxas da Solana:', error);
        
        // Em caso de falha total, retornar valores de referência do Solscan
        // 5000 lamports base fee + pequena priorização = ~0.000018 SOL para taxa padrão
        return {
            slow: 0.000005,
            standard: 0.000018,
            fast: 0.000060,
            slowUsd: 0.000005 * 125, // Assumindo preço de ~$125 por SOL
            standardUsd: 0.000018 * 125,
            fastUsd: 0.000060 * 125,
            unit: 'SOL'
        };
    }
}

// Modificar a função selectBlockchain para salvar a preferência
const originalSelectBlockchain = selectBlockchain;
selectBlockchain = function(blockchain) {
    // Chamar a função original
    originalSelectBlockchain(blockchain);
    
    // Salvar a preferência
    localStorage.setItem('selectedBlockchain', blockchain);
    
    // Se for 'sol', usar dados da Solana
    if (blockchain === 'sol') {
        // Atualizar a unidade para SOL
        document.querySelectorAll('.gwei').forEach(el => {
            el.textContent = 'SOL';
        });
        
        // Buscar e exibir dados da Solana
        getSolanaGasData().then(data => {
            if (data) {
                const speeds = ['slow', 'standard', 'fast'];
                
                speeds.forEach(speed => {
                    const card = document.getElementById(speed);
                    if (card) {
                        const priceElement = card.querySelector('.price');
                        const usdPriceElement = card.querySelector('.usd-price');
                        
                        if (priceElement) {
                            priceElement.innerHTML = `${data[speed].toFixed(5)} <span class="gwei">SOL</span>`;
                        }
                        
                        if (usdPriceElement) {
                            usdPriceElement.textContent = `$${data[speed + 'Usd'].toFixed(4)}`;
                        }
                    }
                });
                
                // Iniciar animação de temporizador
                startTimerAnimation();
            }
        });
    }
};

// Função para carregar as preferências do usuário
function loadUserPreferences() {
    // Carregar tema (claro/escuro)
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
    
    // Carregar blockchain selecionada
    const savedBlockchain = localStorage.getItem('selectedBlockchain');
    if (savedBlockchain) {
        selectBlockchain(savedBlockchain);
    }
}

// Adicionar evento para salvar o tema
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const isLightMode = document.body.classList.toggle('light-mode');
            localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
        });
    }
    
    // Carregar preferências do usuário ao iniciar
    loadUserPreferences();
});