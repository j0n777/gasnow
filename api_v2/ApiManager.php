<?php
class ApiManager {
    private string $cacheDir;
    private array $rateLimits = [
        'coingecko' => ['limit' => 50, 'window' => 60], // 50 requests per minute
        'binance' => ['limit' => 1200, 'window' => 60], // 1200 requests per minute
        'cryptocompare' => ['limit' => 100000, 'window' => 2592000], // 100k per month
        'alternative.me' => ['limit' => 30, 'window' => 60], // 30 requests per minute
        'coinmarketcap' => ['limit' => 30, 'window' => 86400] // 30 requests per day
    ];

    private array $apiEndpoints = [
        'prices' => [
            ['provider' => 'coingecko', 'url' => 'https://api.coingecko.com/api/v3/simple/price'],
            ['provider' => 'binance', 'url' => 'https://api.binance.com/api/v3/ticker/price'],
            ['provider' => 'cryptocompare', 'url' => 'https://min-api.cryptocompare.com/data/price']
        ],
        'market_cap' => [
            ['provider' => 'coingecko', 'url' => 'https://api.coingecko.com/api/v3/global'],
            ['provider' => 'cryptocompare', 'url' => 'https://min-api.cryptocompare.com/data/totalvolfull']
        ],
        'fear_greed' => [
            ['provider' => 'coinmarketcap', 'url' => 'https://pro-api.coinmarketcap.com/v3/fear-and-greed/latest'],
            ['provider' => 'alternative.me', 'url' => 'https://api.alternative.me/fng/']
        ],
        'fear_greed_historical' => [
            ['provider' => 'coinmarketcap', 'url' => 'https://pro-api.coinmarketcap.com/v3/fear-and-greed/historical']
        ]
    ];

    public function __construct() {
        $this->cacheDir = sys_get_temp_dir() . '/gasnow_api/';
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }

    public function fetchWithFallback(string $type, array $params = []): ?array {
        if (!isset($this->apiEndpoints[$type])) {
            throw new Exception("Unknown API type: $type");
        }

        foreach ($this->apiEndpoints[$type] as $endpoint) {
            if ($this->canMakeRequest($endpoint['provider'])) {
                $url = $this->buildUrl($endpoint['url'], $params);
                $data = $this->makeRequest($endpoint['provider'], $url);
                if ($data !== null) {
                    $this->logSuccess($endpoint['provider'], $type);
                    return $this->normalizeResponse($endpoint['provider'], $type, $data);
                }
                $this->logFailure($endpoint['provider'], $type);
            }
        }

        $this->logAllProvidersFailed($type);
        return null;
    }

    private function canMakeRequest(string $provider): bool {
        $rateLimit = $this->rateLimits[$provider];
        $logFile = $this->cacheDir . "{$provider}_requests.log";
        
        if (!file_exists($logFile)) {
            return true;
        }

        $requests = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $requests = array_filter($requests, function($timestamp) use ($rateLimit) {
            return (time() - intval($timestamp)) < $rateLimit['window'];
        });

        if (count($requests) >= $rateLimit['limit']) {
            $this->logRateLimitExceeded($provider);
            return false;
        }

        return true;
    }

    private function makeRequest(string $provider, string $url): ?array {
        $this->logRequest($provider);
        
        $options = [
            'http' => [
                'header' => [
                    'User-Agent: GasNow/1.0',
                    'Accept: application/json'
                ],
                'timeout' => 10
            ]
        ];

        if ($provider === 'cryptocompare') {
            $options['http']['header'][] = 'Authorization: Apikey ' . CRYPTOCOMPARE_API_KEY;
        } elseif ($provider === 'coinmarketcap') {
            $options['http']['header'][] = 'X-CMC_PRO_API_KEY: ' . CMC_API_KEY;
        }

        $context = stream_context_create($options);
        $response = @file_get_contents($url, false, $context);
        
        if ($response === false) {
            return null;
        }

        return json_decode($response, true);
    }

    private function buildUrl(string $baseUrl, array $params): string {
        if (empty($params)) {
            return $baseUrl;
        }
        return $baseUrl . '?' . http_build_query($params);
    }

    private function normalizeResponse(string $provider, string $type, array $data): array {
        switch ($type) {
            case 'prices':
                return $this->normalizePriceResponse($provider, $data);
            case 'market_cap':
                return $this->normalizeMarketCapResponse($provider, $data);
            case 'fear_greed':
                return $this->normalizeFearGreedResponse($provider, $data);
            case 'fear_greed_historical':
                return $this->normalizeFearGreedHistoricalResponse($provider, $data);
            default:
                return $data;
        }
    }

    private function normalizePriceResponse(string $provider, array $data): array {
        switch ($provider) {
            case 'coingecko':
                return $data;
            case 'binance':
                $normalized = [];
                foreach ($data as $item) {
                    $symbol = strtolower($item['symbol']);
                    $normalized[$symbol] = ['usd' => floatval($item['price'])];
                }
                return $normalized;
            case 'cryptocompare':
                return ['usd' => $data['USD'] ?? null];
            default:
                return $data;
        }
    }

    private function normalizeMarketCapResponse(string $provider, array $data): array {
        switch ($provider) {
            case 'coingecko':
                return [
                    'total_market_cap' => $data['data']['total_market_cap']['usd'] ?? null,
                    'total_volume' => $data['data']['total_volume']['usd'] ?? null,
                    'market_cap_change_percentage_24h_usd' => $data['data']['market_cap_change_percentage_24h_usd'] ?? null
                ];
            case 'cryptocompare':
                return [
                    'total_market_cap' => $data['RAW']['TOTALVOLUME24H']['USD'] ?? null,
                    'total_volume' => $data['RAW']['TOTALVOLFULL24H']['USD'] ?? null,
                    'market_cap_change_percentage_24h_usd' => null
                ];
            default:
                return $data;
        }
    }

    private function normalizeFearGreedResponse(string $provider, array $data): array {
        switch ($provider) {
            case 'coinmarketcap':
                return [
                    'value' => $data['data']['value'] ?? null,
                    'classification' => $data['data']['value_classification'] ?? null,
                    'timestamp' => strtotime($data['data']['update_time'] ?? 'now')
                ];
            case 'alternative.me':
                return [
                    'value' => $data['data'][0]['value'] ?? null,
                    'classification' => $data['data'][0]['value_classification'] ?? null,
                    'timestamp' => $data['data'][0]['timestamp'] ?? time()
                ];
            case 'cryptocompare':
                // Convert trading signals to fear/greed value (0-100)
                $signals = $data['Data'] ?? [];
                $value = isset($signals['inOutVar']) ? ($signals['inOutVar'] * 50 + 50) : null;
                return [
                    'value' => $value,
                    'classification' => $this->getFearGreedClassification($value)
                ];
            default:
                return $data;
        }
    }

    private function getFearGreedClassification(?float $value): string {
        if ($value === null) return 'Unknown';
        if ($value <= 20) return 'Extreme Fear';
        if ($value <= 40) return 'Fear';
        if ($value <= 60) return 'Neutral';
        if ($value <= 80) return 'Greed';
        return 'Extreme Greed';
    }

    private function normalizeFearGreedHistoricalResponse(string $provider, array $data): array {
        // Implementation of the new method
        return $data;
    }

    private function logRequest(string $provider): void {
        $logFile = $this->cacheDir . "{$provider}_requests.log";
        file_put_contents($logFile, time() . "\n", FILE_APPEND);
    }

    private function logSuccess(string $provider, string $type): void {
        $logFile = $this->cacheDir . 'api_success.log';
        $message = sprintf(
            "[%s] SUCCESS: %s API request for %s\n",
            date('Y-m-d H:i:s'),
            $provider,
            $type
        );
        file_put_contents($logFile, $message, FILE_APPEND);
    }

    private function logFailure(string $provider, string $type): void {
        $logFile = $this->cacheDir . 'api_failures.log';
        $message = sprintf(
            "[%s] FAILURE: %s API request for %s\n",
            date('Y-m-d H:i:s'),
            $provider,
            $type
        );
        file_put_contents($logFile, $message, FILE_APPEND);

        // Send alert if failure rate is high
        $this->checkFailureRate($provider);
    }

    private function logRateLimitExceeded(string $provider): void {
        $logFile = $this->cacheDir . 'rate_limits.log';
        $message = sprintf(
            "[%s] RATE LIMIT EXCEEDED: %s\n",
            date('Y-m-d H:i:s'),
            $provider
        );
        file_put_contents($logFile, $message, FILE_APPEND);

        // Send alert
        $this->sendAlert("Rate limit exceeded for $provider API");
    }

    private function logAllProvidersFailed(string $type): void {
        $logFile = $this->cacheDir . 'critical_failures.log';
        $message = sprintf(
            "[%s] CRITICAL: All providers failed for %s\n",
            date('Y-m-d H:i:s'),
            $type
        );
        file_put_contents($logFile, $message, FILE_APPEND);

        // Send critical alert
        $this->sendAlert("CRITICAL: All API providers failed for $type", true);
    }

    private function checkFailureRate(string $provider): void {
        $logFile = $this->cacheDir . 'api_failures.log';
        $logs = file_exists($logFile) ? file($logFile) : [];
        $recentLogs = array_filter($logs, function($log) {
            return strtotime(substr($log, 1, 19)) > strtotime('-1 hour');
        });

        $failureCount = count(array_filter($recentLogs, function($log) use ($provider) {
            return strpos($log, $provider) !== false;
        }));

        if ($failureCount >= 5) {
            $this->sendAlert("High failure rate detected for $provider API: $failureCount failures in the last hour");
        }
    }

    private function sendAlert(string $message, bool $critical = false): void {
        $logFile = $this->cacheDir . 'alerts.log';
        $formattedMessage = sprintf(
            "[%s] %s: %s\n",
            date('Y-m-d H:i:s'),
            $critical ? 'CRITICAL' : 'ALERT',
            $message
        );
        file_put_contents($logFile, $formattedMessage, FILE_APPEND);

        error_log($formattedMessage);
    }
} 