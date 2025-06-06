<?php
require_once __DIR__ . '/../private/config.php';
require_once __DIR__ . '/ApiManager.php';
require_once __DIR__ . '/../charts/market_data.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

$action = $_GET['action'] ?? '';
$response = [];

try {
    $apiManager = new ApiManager();

    switch ($action) {
        case 'prices':
            $coins = $_GET['coins'] ?? 'ethereum,bitcoin,the-open-network';
            $currencies = $_GET['currencies'] ?? 'usd';
            $response = $apiManager->fetchWithFallback('prices', [
                'ids' => $coins,
                'vs_currencies' => $currencies
            ]);
            break;

        case 'market_cap':
            $data = $apiManager->fetchWithFallback('market_cap');
            $response = [
                'total_market_cap' => $data['total_market_cap'] ?? 0,
                'total_volume' => $data['total_volume'] ?? 0,
                'market_cap_change_percentage_24h_usd' => $data['market_cap_change_percentage_24h_usd'] ?? 0,
                'formatted' => [
                    'total_market_cap' => formatCurrency($data['total_market_cap'] ?? 0),
                    'total_volume' => formatCurrency($data['total_volume'] ?? 0),
                    'change_24h' => number_format($data['market_cap_change_percentage_24h_usd'] ?? 0, 2) . '%'
                ]
            ];
            break;

        case 'market_cap_chart':
            $response = getMarketCapChartData();
            break;

        case 'fear_greed':
            $response = getFearGreedData();
            break;

        case 'altseason':
            $response = getAltseasonData();
            break;

        case 'cmc100':
            // Get top 100 coins with their market data
            $data = fetchApiData("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=true&price_change_percentage=24h");
            
            if (!$data || !is_array($data)) {
                throw new Exception("Failed to fetch CMC100 data");
            }

            $totalMarketCap = 0;
            $weightedChange = 0;

            foreach ($data as $coin) {
                $marketCap = $coin['market_cap'] ?? 0;
                $change24h = $coin['price_change_percentage_24h'] ?? 0;
                
                $totalMarketCap += $marketCap;
                $weightedChange += ($marketCap * $change24h);
            }

            $indexValue = $totalMarketCap > 0 ? $weightedChange / $totalMarketCap : 0;

            $response = [
                'value' => round($indexValue, 2),
                'change_24h' => round($weightedChange / $totalMarketCap, 2),
                'components' => array_map(function($coin) {
                    return [
                        'name' => $coin['name'],
                        'symbol' => strtoupper($coin['symbol']),
                        'price' => $coin['current_price'],
                        'market_cap' => $coin['market_cap'],
                        'change_24h' => $coin['price_change_percentage_24h'],
                        'sparkline' => $coin['sparkline_in_7d']['price'] ?? []
                    ];
                }, array_slice($data, 0, 100))
            ];
            break;

        default:
            http_response_code(400);
            $response = [
                'error' => 'Invalid action',
                'available_actions' => ['prices', 'market_cap', 'market_cap_chart', 'fear_greed', 'altseason', 'cmc100']
            ];
    }
} catch (Exception $e) {
    http_response_code(500);
    $response = ['error' => $e->getMessage()];
}

echo json_encode($response); 