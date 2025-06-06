// Global variables to track initialization status
let fearGreedChartInitialized = false;
let altseasonChartInitialized = false;
let marketCapChartInitialized = false;

// Market Cap Chart
let marketCapChart;
let fearGreedGauge;
let altseasonChart;
let chartsInitialized = {
    marketCap: false,
    fearGreed: false,
    altseason: false
};

// Flag para controlar se a inicialização está em andamento
let isInitializing = false;

// Variável global para desativar o recarregamento dos gráficos durante o redimensionamento
window.disableChartsReload = true;

// Funções globais para inicialização direta (fallback)
async function initMarketCapChart() {
    console.log('initMarketCapChart called');
    if (marketCapChartInitialized) return;
    marketCapChartInitialized = true;
    try {
        const response = await fetch(`/api_v2/?action=market_cap_chart`);
        const json = await response.json();
        // Expecting json to have market_cap and volume data
        if (!json || !json.market_cap || !json.volume) {
            console.error('Dados de Market Cap inválidos:', json);
            return;
        }
        let marketCapPoints = json.market_cap.timestamps.map((ts, idx) => {
            return [new Date(ts).getTime(), json.market_cap.values[idx]];
        });
        let volumePoints = json.volume.timestamps.map((ts, idx) => {
            return [new Date(ts).getTime(), json.volume.values[idx]];
        });
        const series = [
            { name: 'Market Cap', data: marketCapPoints, color: '#2196F3' },
            { name: 'Volume', data: volumePoints, color: '#F57C00' }
        ];

        const options = {
            series: series,
            chart: {
                type: 'line',
                height: 280,
                toolbar: { show: false },
                background: 'transparent',
                animations: { enabled: false }
            },
            stroke: {
                width: 4,
                curve: 'smooth'
            },
            markers: { size: 0 },
            tooltip: {
                shared: true,
                x: {
                    formatter: function(val) {
                        return new Date(val).toLocaleDateString();
                    }
                },
                y: {
                    formatter: function(value, { series, seriesIndex, dataPointIndex, w }) {
                        return formatCurrency(value);
                    }
                },
                theme: 'dark'
            },
            grid: { show: false },
            legend: { show: false },
            xaxis: {
                type: 'datetime',
                labels: { style: { colors: '#aaa' } },
                axisBorder: { show: false },
                tooltip: { enabled: false }
            },
            yaxis: {
                labels: {
                    formatter: function(value) { return formatCurrency(value); },
                    style: { colors: '#aaa' }
                },
                axisBorder: { show: false }
            }
        };
        
        marketCapChart = new ApexCharts(document.querySelector('#market-cap-chart'), options);
        marketCapChart.render();
        console.log('Gráfico Global de Market Cap inicializado com sucesso.');
        chartsInitialized.marketCap = true;
    } catch (e) {
        console.error('Erro ao inicializar o gráfico Global Market Cap:', e);
    }
}

async function initFearGreedIndex() {
    console.log('initFearGreedIndex called');
    
    // Evitar inicialização duplicada
    if (chartsInitialized.fearGreed) {
        console.log('Fear & Greed Index já inicializado');
        return;
    }
    
    try {
        // Verificar se estamos no modo light logo no início da função
        const isLightMode = document.body.classList.contains('light-mode');
        console.log('isLightMode:', isLightMode);
        
        // Obter os dados do Fear & Greed Index
        console.log('Fetching Fear & Greed data...');
        const response = await fetch('/api_v2/?action=fear_greed');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fear & Greed data:', data);
        
        // Verificar se os dados são válidos
        if (!data || data.value === undefined && data.current?.value === undefined) {
            throw new Error('Dados inválidos do Fear & Greed Index');
        }
        
        // Obter o valor atual e a classificação
        let currentValue, classification;
        
        if (data.value !== undefined) {
            // Formato direto
            currentValue = parseFloat(data.value) || 0;
            classification = data.classification || '';
        } else if (data.current && data.current.value !== undefined) {
            // Formato aninhado (compatibilidade)
            currentValue = parseFloat(data.current.value) || 0;
            classification = data.current.classification || '';
        } else {
            // Fallback para valor padrão
            console.warn('Formato de dados do Fear & Greed Index não reconhecido:', data);
            currentValue = 50;
            classification = 'Neutral';
        }
        
        // Determinar a classificação com base no valor
        if (currentValue <= 20) {
            classification = 'Extreme Fear';
        } else if (currentValue <= 40) {
            classification = 'Fear';
        } else if (currentValue <= 60) {
            classification = 'Neutral';
        } else if (currentValue <= 80) {
            classification = 'Greed';
        } else {
            classification = 'Extreme Greed';
        }
        
        // Determinar a cor com base no valor
        let currentColor;
        if (currentValue <= 20) {
            currentColor = "#E74C3C"; // Extreme Fear
        } else if (currentValue <= 40) {
            currentColor = "#F57C00"; // Fear
        } else if (currentValue <= 60) {
            currentColor = "#FFC107"; // Neutral
        } else if (currentValue <= 80) {
            currentColor = "#4CAF50"; // Greed
        } else {
            currentColor = "#2E7D32"; // Extreme Greed
        }
        
        const container = document.querySelector('.fear-greed-container');
        container.innerHTML = '';
        
        // Criar um container flexível para organizar o gauge e o texto lado a lado
        const flexContainer = document.createElement('div');
        flexContainer.style.display = 'flex';
        flexContainer.style.justifyContent = 'center';
        flexContainer.style.alignItems = 'center';
        flexContainer.style.width = '100%';
        flexContainer.style.height = '100%';
        flexContainer.style.padding = '10px';
        container.appendChild(flexContainer);
        
        // Criar a estrutura para o gauge (lado esquerdo)
        const gaugeContainer = document.createElement('div');
        gaugeContainer.style.width = '50%'; // Ampliando em 30% lateralmente
        gaugeContainer.style.height = '100px';
        gaugeContainer.style.position = 'relative';
        gaugeContainer.style.display = 'flex';
        gaugeContainer.style.flexDirection = 'column';
        gaugeContainer.style.alignItems = 'center';
        gaugeContainer.style.justifyContent = 'center';
        
        // Criar o canvas para o gauge
        const canvas = document.createElement('canvas');
        canvas.id = 'fear-greed-gauge-canvas';
        canvas.style.width = '180px'; // Ampliando em 30% lateralmente (140px + 30%)
        canvas.style.height = '100px';
        canvas.style.display = 'block';
        gaugeContainer.appendChild(canvas);
        
        // Adicionar o container do gauge ao container flexível
        flexContainer.appendChild(gaugeContainer);
        
        // Criar o container para o valor e o rótulo (lado direito)
        const textContainer = document.createElement('div');
        textContainer.style.textAlign = 'center';
        textContainer.style.display = 'flex';
        textContainer.style.flexDirection = 'column';
        textContainer.style.justifyContent = 'center';
        textContainer.style.alignItems = 'center';
        textContainer.style.width = '30%';
        textContainer.style.marginLeft = '10px';
        
        // Criar o elemento para o valor
        const valueElement = document.createElement('div');
        valueElement.className = 'fear-greed-value';
        valueElement.textContent = Math.round(currentValue);
        valueElement.style.fontSize = '36px';
        valueElement.style.fontWeight = 'bold';
        valueElement.style.color = isLightMode ? '#333' : 'rgb(255, 255, 255)';
        valueElement.style.textShadow = isLightMode ? 'none' : '1px 1px 3px rgba(0, 0, 0, 0.7)';
        valueElement.style.marginBottom = '10px';
        textContainer.appendChild(valueElement);
        
        // Criar o elemento para o rótulo
        const labelElement = document.createElement('div');
        labelElement.className = 'fear-greed-label';
        
        // Adicionar a classe e o texto apropriados com base no valor
        if (currentValue <= 20) {
            labelElement.classList.add('extreme-fear');
            labelElement.textContent = 'Extreme Fear';
            labelElement.style.color = isLightMode ? '#C62828' : '#E74C3C';
        } else if (currentValue <= 40) {
            labelElement.classList.add('fear');
            labelElement.textContent = 'Fear';
            labelElement.style.color = isLightMode ? '#EF6C00' : '#F57C00';
        } else if (currentValue <= 60) {
            labelElement.classList.add('neutral');
            labelElement.textContent = 'Neutral';
            labelElement.style.color = isLightMode ? '#F9A825' : '#FFC107';
        } else if (currentValue <= 80) {
            labelElement.classList.add('greed');
            labelElement.textContent = 'Greed';
            labelElement.style.color = isLightMode ? '#1976D2' : '#2196F3';
        } else {
            labelElement.classList.add('extreme-greed');
            labelElement.textContent = 'Extreme Greed';
            labelElement.style.color = isLightMode ? '#0D47A1' : '#1565C0';
        }
        
        // Estilizar o rótulo conforme a imagem de referência
        labelElement.style.fontSize = '12px';
        labelElement.style.fontWeight = 'bold';
        labelElement.style.backgroundColor = isLightMode ? '#f5f5f5' : 'rgb(26, 26, 46)';
        labelElement.style.padding = '3px 3px';
        labelElement.style.borderRadius = '4px';
        textContainer.appendChild(labelElement);
        
        // Adicionar o container de texto ao container flexível
        flexContainer.appendChild(textContainer);
        
        // Verificar se a biblioteca GaugeJS está disponível
        if (typeof Gauge === 'undefined') {
            console.error('Biblioteca GaugeJS não encontrada. Verifique se o script foi carregado corretamente.');
            throw new Error('Biblioteca GaugeJS não encontrada');
        }
        
        // Configurar o gauge
        const gauge = new Gauge(canvas).setOptions({
            angle: 0,
            lineWidth: 0.25,
            radiusScale: 0.9,
            pointer: {
                length: 0.50,
                strokeWidth: 0.055,
                color: isLightMode ? '#333' : '#fff',
                shadowColor: isLightMode ? 'rgba(0,0,0,0.2)' : 'none',
                shadowOffsetX: isLightMode ? 1 : 0,
                shadowOffsetY: isLightMode ? 1 : 0,
                shadowBlur: isLightMode ? 2 : 0
            },
            limitMax: false,
            limitMin: false,
            colorStart: '#6FADCF',
            colorStop: '#8FC0DA',
            strokeColor: isLightMode ? '#E0E0E0' : '#333',
            generateGradient: true,
            highDpiSupport: true,
            staticZones: [
                { strokeStyle: "#E74C3C", min: 0, max: 20, height: 0.7 },  // Extreme Fear
                { strokeStyle: "#F57C00", min: 20, max: 40, height: 0.7 }, // Fear
                { strokeStyle: "#FFC107", min: 40, max: 60, height: 0.7 }, // Neutral
                { strokeStyle: "#2196F3", min: 60, max: 80, height: 0.7 }, // Greed (Azul em vez de Verde)
                { strokeStyle: "#1565C0", min: 80, max: 100, height: 0.7 } // Extreme Greed (Azul escuro em vez de Verde escuro)
            ],
        });
        
        // Configurar os valores do gauge
        gauge.maxValue = 100;
        gauge.setMinValue(0);
        gauge.animationSpeed = 15; // Animação mais suave
        gauge.set(currentValue); // Definir o valor atual
        
        chartsInitialized.fearGreed = true;
    } catch (error) {
        console.error('Erro ao inicializar o Fear & Greed Index:', error);
    }
}

async function initAltseasonIndex() {
    console.log('initAltseasonIndex called');
    if (altseasonChartInitialized) return;
    altseasonChartInitialized = true;
    try {
        const response = await fetch(`/api_v2/?action=altseason`);
        const json = await response.json();
        const container = document.querySelector('.altseason-container');
        
        // Limpar qualquer estilo CSS existente que possa estar causando conflitos
        container.removeAttribute('style');
        container.innerHTML = '';
        
        // Aplicar estilos inline para garantir que o alinhamento seja respeitado
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'flex-start';
        container.style.justifyContent = 'flex-start';
        container.style.textAlign = 'left';
        container.style.width = '100%';
        container.style.position = 'relative';
        container.style.padding = '8px';
        container.style.height = '150px';
        container.style.boxSizing = 'border-box';
        container.style.overflow = 'visible';
        container.style.zIndex = '1';
        
        // Usar apenas os dados atuais da API, sem depender de dados históricos
        // Verificar diferentes formatos possíveis de resposta da API
        let indexValue;
        
        if (json.index !== undefined) {
            // Formato direto
            indexValue = parseFloat(json.index) || 0;
        } else if (json.current && json.current.index !== undefined) {
            // Formato aninhado (compatibilidade)
            indexValue = parseFloat(json.current.index) || 0;
        } else {
            // Fallback para valor padrão
            console.warn('Formato de dados do Altseason Index não reconhecido:', json);
            indexValue = 50;
        }
        
        // Determine if it's Bitcoin Season or Altcoin Season
        const isBitcoinSeason = indexValue <= 50;
        
        // Create header with value and season
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '10px';
        header.style.width = '100%';
        
        // Value in format 30/100 - explicitamente alinhado à esquerda
        const valueContainer = document.createElement('div');
        valueContainer.style.display = 'flex';
        valueContainer.style.alignItems = 'center';
        valueContainer.style.justifyContent = 'flex-start';
        valueContainer.style.textAlign = 'left';
        valueContainer.style.width = 'auto';
        
        const value = document.createElement('span');
        value.style.fontSize = '18px';
        value.style.fontWeight = 'bold';
        value.style.textAlign = 'left';
        value.innerText = `${Math.round(indexValue)} / 100`;
        valueContainer.appendChild(value);
        
        // Season pill
        const season = document.createElement('div');
        season.style.padding = '3px 10px';
        season.style.borderRadius = '12px';
        season.style.fontSize = '12px';
        season.style.fontWeight = 'bold';
        season.style.marginLeft = 'auto';
        season.style.float = 'right';
        
        if (isBitcoinSeason) {
            season.style.backgroundColor = '#FF9800';
            season.style.color = '#000';
            season.innerText = 'Bitcoin Season';
        } else {
            season.style.backgroundColor = '#2196F3';
            season.style.color = '#fff';
            season.innerText = 'Altcoin Season';
        }
        
        header.appendChild(valueContainer);
        header.appendChild(season);
        
        // Create the progress bar container
        const barContainer = document.createElement('div');
        barContainer.style.width = '100%';
        barContainer.style.height = '6px';
        barContainer.style.backgroundColor = '#373A4D';
        barContainer.style.borderRadius = '3px';
        barContainer.style.marginBottom = '6px';
        barContainer.style.position = 'relative';
        barContainer.style.overflow = 'hidden';
        
        // Criar o fundo com static zones em vez de degradê
        const zoneWidth = 25; // Cada zona ocupa 25% da barra
        
        // Zona 1: Bitcoin Season (0-25%)
        const zone1 = document.createElement('div');
        zone1.style.position = 'absolute';
        zone1.style.left = '0%';
        zone1.style.width = `${zoneWidth}%`;
        zone1.style.height = '100%';
        zone1.style.backgroundColor = '#F57C00'; // Laranja escuro
        barContainer.appendChild(zone1);
        
        // Zona 2: Early Bitcoin Season (25-50%)
        const zone2 = document.createElement('div');
        zone2.style.position = 'absolute';
        zone2.style.left = `${zoneWidth}%`;
        zone2.style.width = `${zoneWidth}%`;
        zone2.style.height = '100%';
        zone2.style.backgroundColor = '#FFA726'; // Laranja claro
        barContainer.appendChild(zone2);
        
        // Zona 3: Early Altcoin Season (50-75%)
        const zone3 = document.createElement('div');
        zone3.style.position = 'absolute';
        zone3.style.left = `${zoneWidth * 2}%`;
        zone3.style.width = `${zoneWidth}%`;
        zone3.style.height = '100%';
        zone3.style.backgroundColor = '#64B5F6'; // Azul claro em vez de verde claro
        barContainer.appendChild(zone3);
        
        // Zona 4: Altcoin Season (75-100%)
        const zone4 = document.createElement('div');
        zone4.style.position = 'absolute';
        zone4.style.left = `${zoneWidth * 3}%`;
        zone4.style.width = `${zoneWidth}%`;
        zone4.style.height = '100%';
        zone4.style.backgroundColor = '#2196F3'; // Azul em vez de verde escuro
        barContainer.appendChild(zone4);
        
        // Create indicator for current position
        const progressIndicator = document.createElement('div');
        progressIndicator.style.width = '4px';
        progressIndicator.style.height = '14px';
        progressIndicator.style.backgroundColor = '#FFFFFF';
        progressIndicator.style.position = 'absolute';
        progressIndicator.style.top = '-4px';
        progressIndicator.style.left = `${indexValue}%`;
        progressIndicator.style.transform = 'translateX(-50%)';
        progressIndicator.style.borderRadius = '2px';
        progressIndicator.style.zIndex = '6';
        progressIndicator.style.boxShadow = '0 0 4px rgba(0, 0, 0, 0.8)';
        barContainer.appendChild(progressIndicator);
        
        // Add labels for Bitcoin Season and Altcoin Season
        const labelsContainer = document.createElement('div');
        labelsContainer.style.display = 'flex';
        labelsContainer.style.justifyContent = 'space-between';
        labelsContainer.style.width = '100%';
        labelsContainer.style.marginTop = '4px';
        
        const bitcoinSeasonLabel = document.createElement('div');
        bitcoinSeasonLabel.style.fontSize = '10px';
        bitcoinSeasonLabel.style.color = '#F57C00';
        bitcoinSeasonLabel.style.textAlign = 'left';
        bitcoinSeasonLabel.style.width = '50%';
        bitcoinSeasonLabel.style.justifyContent = 'flex-start';
        bitcoinSeasonLabel.style.float = 'left';
        bitcoinSeasonLabel.innerText = 'Bitcoin Season';
        
        const altcoinSeasonLabel = document.createElement('div');
        altcoinSeasonLabel.style.fontSize = '10px';
        altcoinSeasonLabel.style.color = '#2196F3'; // Azul em vez de verde
        altcoinSeasonLabel.style.textAlign = 'right';
        altcoinSeasonLabel.style.width = '50%';
        altcoinSeasonLabel.style.justifyContent = 'flex-end';
        altcoinSeasonLabel.style.float = 'right';
        altcoinSeasonLabel.innerText = 'Altcoin Season';
        
        labelsContainer.appendChild(bitcoinSeasonLabel);
        labelsContainer.appendChild(altcoinSeasonLabel);
        
        // Add all elements to container
        container.appendChild(header);
        container.appendChild(barContainer);
        container.appendChild(labelsContainer);
        
        console.log('Altseason Index inicializado no estilo CoinMarketCap.');
        chartsInitialized.altseason = true;
    } catch (e) {
        console.warn('Erro ao inicializar Altseason Index:', e);
    }
}

// Função para inicializar todos os gráficos diretamente com delay para evitar conflitos
async function initializeChartsInternal() {
    // Verificar se o recarregamento está desativado e se é um evento de resize
    if (window.disableChartsReload && window.isResizing) {
        console.log('Recarregamento de gráficos desativado durante o redimensionamento');
        return Promise.resolve(); // Retornar uma Promise resolvida para manter a consistência
    }
    
    // Verificar se o recarregamento está desativado globalmente
    // Comentando esta verificação para permitir a inicialização inicial
    /*
    if (window.disableChartsReload) {
        console.log('Recarregamento de gráficos desativado globalmente');
        return Promise.resolve(); // Retornar uma Promise resolvida para manter a consistência
    }
    */
    
    // Evitar inicializações simultâneas
    if (isInitializing) {
        console.log('Inicialização já em andamento, ignorando chamada duplicada');
        return Promise.resolve(); // Retornar uma Promise resolvida para manter a consistência
    }
    
    isInitializing = true;
    
    try {
        console.log('Iniciando inicialização sequencial dos gráficos...');
        
        // Limpar gráficos existentes
        if (marketCapChart) {
            try {
                marketCapChart.destroy();
                marketCapChart = null;
                chartsInitialized.marketCap = false;
            } catch (e) {
                console.warn('Erro ao destruir Market Cap Chart:', e);
            }
        }
        
        if (fearGreedGauge) {
            try {
                fearGreedGauge.destroy();
                fearGreedGauge = null;
                chartsInitialized.fearGreed = false;
            } catch (e) {
                console.warn('Erro ao destruir Fear & Greed Gauge:', e);
            }
        }
        
        // Primeiro, inicializar o Market Cap Chart
        console.log('Inicializando Market Cap Chart...');
        await initMarketCapChart();
        
        // Aguardar um momento antes de iniciar o próximo gráfico
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Depois, inicializar o Fear & Greed Index
        console.log('Inicializando Fear & Greed Index...');
        await initFearGreedIndex();
        
        // Aguardar mais um momento antes de iniciar o último gráfico
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Por fim, inicializar o Altseason Index
        console.log('Inicializando Altseason Index...');
        await initAltseasonIndex();
        
        console.log('Todos os gráficos foram inicializados com sucesso!');
    } catch (error) {
        console.error('Erro na inicialização sequencial dos gráficos:', error);
    } finally {
        // Sempre resetar a flag ao finalizar
        isInitializing = false;
    }
}

// Expor a função globalmente para que possa ser chamada de app.js
window.initializeCharts = initializeChartsInternal;

/*
// Evento de resize desativado para evitar problemas de layout
// Adicionar evento de resize para ajustar os gráficos quando a janela for redimensionada
// Usando um timer para não chamar as funções muitas vezes durante o resize
// Usar a variável global compartilhada
window.chartsResizeTimer = window.chartsResizeTimer || null;
window.addEventListener('resize', function() {
    clearTimeout(window.chartsResizeTimer);
    window.chartsResizeTimer = setTimeout(function() {
        console.log('Janela redimensionada, atualizando gráficos...');
        
        // Não reinicializar completamente, apenas ajustar os gráficos existentes
        if (marketCapChart && chartsInitialized.marketCap) {
            marketCapChart.updateOptions({
                chart: {
                    width: '100%',
                    height: 125
                }
            });
        }
        
        if (fearGreedGauge && chartsInitialized.fearGreed) {
            fearGreedGauge.updateOptions({
                chart: {
                    width: '100%',
                    height: 125
                }
            });
        }
    }, 500);
});
*/

// Chart configuration and data management
class ChartManager {
    constructor() {
        this.charts = {};
        this.updateInterval = 5 * 60 * 1000; // 5 minutes
        this.initialized = false;
        // Não inicializar automaticamente no construtor
    }

    async init() {
        // Evitar inicialização dupla
        if (this.initialized) {
            console.log('ChartManager já está inicializado');
            return;
        }
        
        try {
            this.charts = {};
            
            // Inicializar Market Cap Chart
            try {
                await this.initMarketCapChart();
                console.log('Market Cap Chart inicializado com sucesso');
            } catch (e) {
                console.error('Erro ao inicializar Market Cap Chart:', e);
            }
            
            // Inicializar Fear & Greed Index
            try {
                await this.initFearGreedIndex();
                console.log('Fear & Greed Index inicializado com sucesso');
            } catch (e) {
                console.error('Erro ao inicializar Fear & Greed Index:', e);
            }
            
            // Inicializar Altseason Index
            try {
                await this.initAltseasonIndex();
                console.log('Altseason Index inicializado com sucesso');
            } catch (e) {
                console.error('Erro ao inicializar Altseason Index:', e);
            }
            
            // Marcar como inicializado
            this.initialized = true;
            
            // Iniciar ciclo de atualização
            this.startUpdateCycle();
        } catch (error) {
            console.error('Erro geral na inicialização dos gráficos:', error);
        }
    }

    async initializeCharts() {
        console.log("Método legado chamado: initializeCharts. Use init() diretamente.");
        
        try {
            return await this.init();
        } catch (error) {
            console.error("Erro ao inicializar gráficos (método legado):", error);
        }
    }

    startUpdateCycle() {
        setInterval(() => this.updateAllCharts(), this.updateInterval);
    }

    updateAltcoinsList(alts) {
        const container = document.getElementById('top-alts');
        if (!container) return;

        container.innerHTML = '';

        alts.forEach(coin => {
            const coinElement = document.createElement('div');
            coinElement.className = 'altcoin-item';

            const info = document.createElement('div');
            info.className = 'altcoin-info';
            info.innerHTML = `
                <span class="altcoin-name">${coin.name}</span>
                <span class="altcoin-symbol">${coin.symbol.toUpperCase()}</span>
                <div class="altcoin-stats">
                    <span class="stat-value ${coin.change_90d >= 0 ? 'positive' : 'negative'}">
                        ${coin.change_90d >= 0 ? '+' : ''}${coin.change_90d}%
                    </span>
                </div>
            `;

            coinElement.appendChild(info);
            container.appendChild(coinElement);
        });
    }

    async updateAllCharts() {
        try {
            const [marketCapData, fearGreedData, altseasonData] = await Promise.all([
                fetch('/api_v2/?action=market_cap_chart').then(r => r.json()),
                fetch('/api_v2/?action=fear_greed').then(r => r.json()),
                fetch('/api_v2/?action=altseason').then(r => r.json())
            ]);

            // Update Market Cap Chart if data structure is available
            if (marketCapData.market_cap && marketCapData.volume) {
                this.charts.marketCap.updateSeries([{ 
                    name: 'Market Cap',
                    data: marketCapData.market_cap.values.map((value, index) => ({
                        x: new Date(marketCapData.market_cap.timestamps[index]),
                        y: value
                    }))
                }, { 
                    name: 'Volume',
                    data: marketCapData.volume.values.map((value, index) => ({
                        x: new Date(marketCapData.volume.timestamps[index]),
                        y: value
                    }))
                }]);
            } else {
                console.warn('Dados de Market Cap inválidos para atualização de série:', marketCapData);
            }

            // Update Market Cap stats
            if (marketCapData.formatted) {
                document.getElementById('total-market-cap').textContent = marketCapData.formatted.total_market_cap;
                document.getElementById('market-cap-change').textContent = marketCapData.formatted.change_24h;
                document.getElementById('total-volume').textContent = marketCapData.formatted.total_volume;
            } else {
                document.getElementById('total-market-cap').textContent = marketCapData.globalMarketCap || '';
                document.getElementById('market-cap-change').textContent = marketCapData.change24h || '';
                document.getElementById('total-volume').textContent = marketCapData.totalVolume || '';
                
                // Update styling for change value (add positive/negative class)
                const changeElement = document.getElementById('market-cap-change');
                if (changeElement && marketCapData.change24h) {
                    if (marketCapData.change24h.includes('-')) {
                        changeElement.classList.add('negative');
                        changeElement.classList.remove('positive');
                    } else {
                        changeElement.classList.add('positive');
                        changeElement.classList.remove('negative');
                    }
                }
            }

            // Update Fear & Greed Index
            // Get current value
            let currentValue;
            
            if (fearGreedData.value !== undefined) {
                // Formato direto
                currentValue = parseInt(fearGreedData.value);
            } else if (fearGreedData.current && fearGreedData.current.value !== undefined) {
                // Formato aninhado (compatibilidade)
                currentValue = parseInt(fearGreedData.current.value);
            } else {
                // Fallback para valor padrão
                console.warn('Formato de dados do Fear & Greed Index não reconhecido:', fearGreedData);
                currentValue = 50;
            }
            
            this.charts.fearGreedGauge.updateSeries([currentValue]);
            
            // Usar valores fixos para comparações, já que não temos mais dados históricos
            let weekAgoValue = 'N/A';
            let weekAgoClass = '';
            
            // Update Fear & Greed comparison values
            const weekAgoEl = document.querySelector('.fear-greed-comparisons .fear-greed-comparison:nth-child(2) .comparison-value');
            if (weekAgoEl) {
                weekAgoEl.className = 'comparison-value';
                weekAgoEl.textContent = weekAgoValue;
            }
            
            const todayEl = document.querySelector('.fear-greed-comparisons .fear-greed-comparison:nth-child(1) .comparison-value');
            if (todayEl) {
                todayEl.textContent = currentValue;
            }
            
            const avgEl = document.querySelector('.fear-greed-comparisons .fear-greed-comparison:nth-child(3) .comparison-value');
            if (avgEl) {
                avgEl.textContent = 'N/A';
            }
            
            // Update label classification
            let classification = '';
            let colorClass = '';
            const isLightMode = document.body.classList.contains('light-mode');
            
            if (currentValue <= 20) {
                classification = 'Extreme Fear';
                colorClass = 'extreme-fear';
                document.querySelector('.fear-greed-label').style.color = isLightMode ? '#C62828' : '#E74C3C';
            } else if (currentValue <= 40) {
                classification = 'Fear';
                colorClass = 'fear';
                document.querySelector('.fear-greed-label').style.color = isLightMode ? '#EF6C00' : '#F57C00';
            } else if (currentValue <= 60) {
                classification = 'Neutral';
                colorClass = 'neutral';
                document.querySelector('.fear-greed-label').style.color = isLightMode ? '#F9A825' : '#FFC107';
            } else if (currentValue <= 80) {
                classification = 'Greed';
                colorClass = 'greed';
                document.querySelector('.fear-greed-label').style.color = isLightMode ? '#1976D2' : '#2196F3';
            } else {
                classification = 'Extreme Greed';
                colorClass = 'extreme-greed';
                document.querySelector('.fear-greed-label').style.color = isLightMode ? '#0D47A1' : '#1565C0';
            }
            
            const labelEl = document.querySelector('.fear-greed-label');
            if (labelEl) {
                labelEl.className = 'fear-greed-label ' + colorClass;
                labelEl.textContent = classification;
            }

            // Update Altseason Index
            let index;
            
            if (altseasonData.index !== undefined) {
                // Formato direto
                index = parseInt(altseasonData.index);
            } else if (altseasonData.current && altseasonData.current.index !== undefined) {
                // Formato aninhado (compatibilidade)
                index = parseInt(altseasonData.current.index);
            } else {
                // Fallback para valor padrão
                console.warn('Formato de dados do Altseason Index não reconhecido:', altseasonData);
                index = 50;
            }
            
            const safeIndex = isNaN(index) ? 0 : Math.max(0, Math.min(100, Math.round(index)));
            
            // Determine the Altseason label and status class
            let altseasonLabel, statusClass;
            
            if (safeIndex <= 25) {
                altseasonLabel = "Bitcoin Season";
                statusClass = "bitcoin-season";
            } else if (safeIndex <= 50) {
                altseasonLabel = "Early Bitcoin Season";
                statusClass = "early-bitcoin-season";
            } else if (safeIndex <= 75) {
                altseasonLabel = "Early Altcoin Season";
                statusClass = "early-altcoin-season";
            } else {
                altseasonLabel = "Altcoin Season";
                statusClass = "altcoin-season";
            }

            // Determinar BTC Dominance e outras estatísticas
            const bitcoinDominance = altseasonData.bitcoin_dominance || 50;
            const bitcoinPerformance = altseasonData.bitcoin_performance || 0;
            const outperformingAlts = altseasonData.outperforming_alts || 0;
            const totalAltsAnalyzed = altseasonData.total_alts_analyzed || 50;

            // Update the Altseason container
            const container = document.querySelector('.altseason-container');
            if (container) {
                container.innerHTML = `
                    <div class="altseason-header">
                        <div class="altseason-value-display">${safeIndex}<span class="altseason-max">/100</span></div>
                        <div class="altseason-current-state ${statusClass}">${altseasonLabel}</div>
                    </div>
                    
                    <div class="altseason-progress-container">
                        <div class="altseason-progress">
                            <div class="altseason-progress-bg"></div>
                            <div class="altseason-progress-fill" style="width: ${safeIndex}%"></div>
                            <div class="altseason-marker" style="left: ${safeIndex}%; width: 4px; height: 14px; top: -4px; background-color: #FFFFFF; border-radius: 2px; z-index: 6; box-shadow: 0 0 4px rgba(0, 0, 0, 0.8);"></div>
                        </div>
                        <div class="altseason-labels">
                            <span class="altseason-label-btc">Bitcoin Season</span>
                            <span class="altseason-label-alt">Altcoin Season</span>
                        </div>
                    </div>
                    
                    <div class="altseason-stats">
                        <div class="altseason-stat">
                            <div class="altseason-stat-value">${bitcoinDominance}%</div>
                            <div class="altseason-stat-label">BTC Dominance</div>
                        </div>
                        <div class="altseason-stat">
                            <div class="altseason-stat-value ${bitcoinPerformance >= 0 ? 'positive' : 'negative'}">${bitcoinPerformance >= 0 ? '+' : ''}${bitcoinPerformance}%</div>
                            <div class="altseason-stat-label">BTC 90d Perf</div>
                        </div>
                        <div class="altseason-stat">
                            <div class="altseason-stat-value">${outperformingAlts}/${totalAltsAnalyzed}</div>
                            <div class="altseason-stat-label">Outperforming Alts</div>
                        </div>
                    </div>
                `;
            }

            // Update altcoins list
            this.updateAltcoinsList(altseasonData.top_alts_performance);
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }

    // Método para inicializar o Market Cap Chart
    async initMarketCapChart() {
        // Chamar a função global initMarketCapChart
        return await initMarketCapChart();
    }

    // Método para inicializar o Fear & Greed Index
    async initFearGreedIndex() {
        // Chamar a função global initFearGreedIndex
        return await initFearGreedIndex();
    }

    // Método para inicializar o Altseason Index
    async initAltseasonIndex() {
        // Chamar a função global initAltseasonIndex
        return await initAltseasonIndex();
    }
}

// Helper function to create sparklines
function createSparkline(container, data) {
    const chart = LightweightCharts.createChart(container, {
        width: 150,
        height: 50,
        layout: {
            background: { color: 'transparent' },
            textColor: 'transparent',
        },
        grid: {
            vertLines: { visible: false },
            horzLines: { visible: false },
        },
        rightPriceScale: {
            visible: true,
        },
        timeScale: {
            visible: false,
        },
        crosshair: {
            visible: true,
        },
        handleScroll: false,
        handleScale: false,
    });

    const series = chart.addAreaSeries({
        lineColor: '#2563eb',
        topColor: 'rgba(37, 99, 235, 0.4)',
        bottomColor: 'rgba(37, 99, 235, 0)',
        lineWidth: 1,
    });

    series.setData(
        data.map((value, index) => ({
            time: Math.floor(Date.now() / 1000) - (data.length - index) * 3600,
            value: value
        }))
    );

    return chart;
}

// Initialize charts when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChartManager();
});

/* Added helper function for segmenting market cap data */
function segmentMarketCapData(data) {
    const segments = [];
    if (!data || data.length === 0) return segments;
    let currentSegment = [data[0]];
    let currentDirection = null;
    for (let i = 1; i < data.length; i++) {
        const prev = data[i - 1][1];
        const curr = data[i][1];
        const direction = (curr >= prev) ? 'up' : 'down';
        if (currentDirection === null) {
            currentDirection = direction;
            currentSegment.push(data[i]);
        } else if (direction === currentDirection) {
            currentSegment.push(data[i]);
        } else {
            segments.push({ direction: currentDirection, data: currentSegment });
            // start new segment with last point repeated to ensure continuity
            currentSegment = [data[i - 1], data[i]];
            currentDirection = direction;
        }
    }
    segments.push({ direction: currentDirection, data: currentSegment });
    return segments;
} 