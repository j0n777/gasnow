<?php
require_once __DIR__ . '/../private/functions.php';
require_once __DIR__ . '/../private/JsonDataStorage.php';

// Market Cap Chart Data Endpoint
function getMarketCapChartData(): array {
    return getCachedData("market_cap_chart", function() {
        // Initialize storage
        $storage = JsonDataStorage::getInstance();
        
        // Get current global market data from API
        $globalData = fetchApiData("https://api.coingecko.com/api/v3/global");
        $dataSource = 'api';
        
        if ($globalData && isset($globalData['data'])) {
            $currentTimestamp = time() * 1000; // Convert to milliseconds
            $totalMarketCap = $globalData['data']['total_market_cap']['usd'];
            $volume24h = $globalData['data']['total_volume']['usd'];
            $change24h = $globalData['data']['market_cap_change_percentage_24h_usd'];
        } else {
            // Fallback to stored data if API fails
            $dataSource = 'storage';
            $todayData = $storage->getFallbackData('market_cap');
            
            if ($todayData) {
                $lastHourData = end($todayData);
                $currentTimestamp = $lastHourData['timestamp'] * 1000; // Convert to milliseconds
                $totalMarketCap = $lastHourData['total_market_cap'];
                $volume24h = $lastHourData['total_volume'];
                $change24h = $lastHourData['market_cap_change_percentage_24h'];
            } else {
                // If no data is available
                $currentTimestamp = time() * 1000;
                $totalMarketCap = 0;
                $volume24h = 0;
                $change24h = 0;
            }
        }
        
        // Get historical data (up to 12 months)
        $historicalData = [];
        
        // Get data from monthly files - this is now our primary source
        $monthlyData = [];
        for ($i = 0; $i < 12; $i++) {
            $monthDate = date('Y-m', strtotime("-$i months"));
            $monthData = $storage->getMonthlyData('market_cap', $monthDate);
            
            if ($monthData) {
                foreach ($monthData as $date => $dayData) {
                    if (isset($dayData['total_market_cap'])) {
                        $historicalData[] = [
                            'timestamp' => strtotime($date) * 1000, // Convert to milliseconds
                            'market_cap' => $dayData['total_market_cap'],
                            'volume' => $dayData['total_volume'] ?? 0
                        ];
                    }
                }
            }
        }
        
        // Only use daily files for very recent data that might not be in monthly files yet
        if (empty($historicalData) || count($historicalData) < 7) {
            $dailyDir = __DIR__ . '/../private/data/market_cap/';
            if (is_dir($dailyDir)) {
                $files = glob($dailyDir . '*.json');
                
                // Sort by date (ascending)
                usort($files, function($a, $b) {
                    return filemtime($a) - filemtime($b);
                });
                
                // Limit to last 30 days only
                $files = array_slice($files, -30);
                
                foreach ($files as $file) {
                    $date = basename($file, '.json');
                    $dayData = json_decode(file_get_contents($file), true);
                    
                    if (is_array($dayData)) {
                        // Use the average of all hour entries
                        $totalMarketCapDay = 0;
                        $totalVolumeDay = 0;
                        $count = 0;
                        
                        foreach ($dayData as $hourData) {
                            if (isset($hourData['total_market_cap'])) {
                                $totalMarketCapDay += $hourData['total_market_cap'];
                                $totalVolumeDay += $hourData['total_volume'] ?? 0;
                                $count++;
                            }
                        }
                        
                        if ($count > 0) {
                            $historicalData[] = [
                                'timestamp' => strtotime($date) * 1000,
                                'market_cap' => $totalMarketCapDay / $count,
                                'volume' => $totalVolumeDay / $count
                            ];
                        }
                    }
                }
            }
        }
        
        // We no longer need to check for CSV files, since they've been imported
        
        // Add current data point if using API data
        if ($dataSource === 'api') {
                $historicalData[] = [
                    'timestamp' => $currentTimestamp,
                    'market_cap' => $totalMarketCap,
                    'volume' => $volume24h
                ];
        }

        // Filter data for last year
        $oneYearAgo = (time() - (365 * 24 * 60 * 60)) * 1000; // Convert to milliseconds
        $historicalData = array_filter($historicalData, function($entry) use ($oneYearAgo) {
            return $entry['timestamp'] >= $oneYearAgo;
        });

        // Ensure we have unique timestamps (no duplicates)
        $uniqueData = [];
        foreach ($historicalData as $entry) {
            $uniqueData[intval($entry['timestamp'])] = $entry;
        }
        $historicalData = array_values($uniqueData);

        // Prepare data for charts
        $marketCapData = array_map(function($entry) {
            return [
                'timestamp' => $entry['timestamp'],
                'value' => $entry['market_cap']
            ];
        }, $historicalData);

        $volumeData = array_map(function($entry) {
            return [
                'timestamp' => $entry['timestamp'],
                'value' => $entry['volume']
            ];
        }, $historicalData);

        // Sort by timestamp
        usort($marketCapData, fn($a, $b) => $a['timestamp'] - $b['timestamp']);
        usort($volumeData, fn($a, $b) => $a['timestamp'] - $b['timestamp']);

        return [
            'market_cap' => [
                'timestamps' => array_column($marketCapData, 'timestamp'),
                'values' => array_column($marketCapData, 'value')
            ],
            'volume' => [
                'timestamps' => array_column($volumeData, 'timestamp'),
                'values' => array_column($volumeData, 'value')
            ],
            'current' => [
                'total_market_cap' => $totalMarketCap,
                'change_24h' => $change24h,
                'volume' => $volume24h
            ],
            'formatted' => [
                'total_market_cap' => formatCurrency($totalMarketCap),
                'total_volume' => formatCurrency($volume24h),
                'change_24h' => number_format($change24h, 2) . '%'
            ],
            'data_source' => $dataSource
        ];
    }, 3600); // Cache for 1 hour
}

function readMarketCapCSV(string $filename): array {
    if (!file_exists($filename)) {
        return [];
    }

    $data = [];
    $handle = fopen($filename, 'r');
    
    // Skip header
    fgetcsv($handle);
    
    while (($row = fgetcsv($handle)) !== false) {
        $data[] = [
            'timestamp' => (int)$row[0],
            'market_cap' => (float)$row[1],
            'volume' => (float)$row[2]
        ];
    }
    
    fclose($handle);
    return $data;
}

// Fear & Greed Index Data
function getFearGreedData(bool $rawDataOnly = false): array {
    return getCachedData("fear_greed", function() use ($rawDataOnly) {
        // Initialize storage and API manager
        $storage = JsonDataStorage::getInstance();
        $apiManager = new ApiManager();
        $dataSource = 'api';
        
        // Try to get current data from API
        $currentData = $apiManager->fetchWithFallback('fear_greed');
        
        if (!$currentData) {
            // Fallback to stored data
            $dataSource = 'storage';
            $todayData = $storage->getFallbackData('fear_greed');
            
            if ($todayData) {
                $lastHourData = end($todayData);
                $currentData = [
                    'value' => $lastHourData['value'],
                    'classification' => $lastHourData['classification'],
                    'timestamp' => $lastHourData['timestamp']
                ];
            } else {
                // If we're only returning raw data
                if ($rawDataOnly) {
                    return [
                        'value' => 50,
                        'classification' => 'Neutral',
                        'timestamp' => time()
                    ];
                }
                
                // Otherwise, return formatted empty response
            return [
                'values' => [],
                'timestamps' => [],
                'current' => [
                    'value' => 'N/A',
                    'classification' => 'N/A'
                ],
                'stats' => [
                    'average_30d' => 'N/A',
                    'trend' => 'neutral'
                    ],
                    'data_source' => 'none'
                ];
            }
        }

        // If we only need raw data (for daily collection)
        if ($rawDataOnly) {
            return $currentData;
        }

        // Get historical data - prioritize monthly files
        $historicalValues = [];
        $historicalTimestamps = [];
        $historicalClassifications = [];
        
        // Get data from monthly files first
        for ($i = 0; $i < 6; $i++) { // Get last 6 months
            $monthDate = date('Y-m', strtotime("-$i months"));
            $monthData = $storage->getMonthlyData('fear_greed', $monthDate);
            
            if ($monthData) {
                // Sort by date to ensure chronological order
                ksort($monthData);
                
                foreach ($monthData as $date => $dayData) {
                    if (isset($dayData['value'])) {
                        $historicalValues[] = intval($dayData['value']);
                        $historicalTimestamps[] = $dayData['timestamp'];
                        $historicalClassifications[] = $dayData['classification'];
                    }
                }
            }
        }
        
        // If we don't have enough monthly data (less than 30 days), try daily files for recent data
        if (count($historicalValues) < 30) {
            $dailyDir = __DIR__ . '/../private/data/fear_greed/';
            if (is_dir($dailyDir)) {
                $files = glob($dailyDir . '*.json');
                
                // Sort by date (newest first for fear & greed)
                usort($files, function($a, $b) {
                    return filemtime($b) - filemtime($a);
                });
                
                // Limit to last 30 days
                $files = array_slice($files, 0, 30);
                
                foreach ($files as $file) {
                    $date = basename($file, '.json');
                    $dayData = json_decode(file_get_contents($file), true);
                    
                    if (is_array($dayData)) {
                        // Use the last value of the day for fear & greed
                        if (!empty($dayData)) {
                            $lastHour = max(array_keys($dayData));
                            $hourData = $dayData[$lastHour];
                            
                            if (isset($hourData['value'])) {
                                // Check if this timestamp is already in our data
                                $timestamp = $hourData['timestamp'];
                                $exists = false;
                                
                                foreach ($historicalTimestamps as $existingTimestamp) {
                                    // Check if timestamp is within the same day (86400 seconds in a day)
                                    if (abs($existingTimestamp - $timestamp) < 86400) {
                                        $exists = true;
                                        break;
                                    }
                                }
                                
                                if (!$exists) {
                                    $historicalValues[] = intval($hourData['value']);
                                    $historicalTimestamps[] = $timestamp;
                                    $historicalClassifications[] = $hourData['classification'];
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Sort by timestamp (newest first)
        if (!empty($historicalTimestamps)) {
            array_multisort($historicalTimestamps, SORT_DESC, $historicalValues, $historicalClassifications);
        }

        // Add current value to historical data
        if (!empty($historicalTimestamps)) {
            // Add only if it's not already the first item or if timestamps don't match
            // First convert timestamps to days to avoid time-of-day mismatches
            $currentDayTimestamp = strtotime(date('Y-m-d', intval($currentData['timestamp'])));
            $firstHistoricalDayTimestamp = strtotime(date('Y-m-d', $historicalTimestamps[0]));
            
            if ($currentDayTimestamp != $firstHistoricalDayTimestamp) {
                array_unshift($historicalValues, intval($currentData['value']));
                array_unshift($historicalTimestamps, intval($currentData['timestamp']));
                array_unshift($historicalClassifications, $currentData['classification']);
            } else {
                // If it's the same day, update the value to ensure it's current
                $historicalValues[0] = intval($currentData['value']);
                $historicalClassifications[0] = $currentData['classification'];
            }
        } else {
            // If no historical data, start with current value
            $historicalValues[] = intval($currentData['value']);
            $historicalTimestamps[] = intval($currentData['timestamp']);
            $historicalClassifications[] = $currentData['classification'];
        }

        // Calculate 30-day average
        $last30Values = array_slice($historicalValues, 0, 30);
        $average30d = count($last30Values) > 0 ? array_sum($last30Values) / count($last30Values) : 'N/A';

        // Determine trend
        $trend = 'neutral';
        if (count($historicalValues) >= 14) {
            $last7Values = array_slice($historicalValues, 0, 7);
            $prevWeekValues = array_slice($historicalValues, 7, 7);
            if (array_sum($last7Values) / 7 > array_sum($prevWeekValues) / 7) {
                $trend = 'increasing';
            } elseif (array_sum($last7Values) / 7 < array_sum($prevWeekValues) / 7) {
                $trend = 'decreasing';
            }
        }

        return [
            'values' => $historicalValues,
            'timestamps' => $historicalTimestamps,
            'classifications' => $historicalClassifications,
            'current' => [
                'value' => $currentData['value'],
                'classification' => $currentData['classification']
            ],
            'stats' => [
                'average_30d' => is_numeric($average30d) ? round($average30d, 1) : $average30d,
                'trend' => $trend
            ],
            'data_source' => $dataSource
        ];
    }, 3600); // Cache for 1 hour
}

// Altcoin Season Index Data
function getAltseasonData(bool $rawDataOnly = false): array {
    return getCachedData("altseason", function() use ($rawDataOnly) {
        // Initialize storage
        $storage = JsonDataStorage::getInstance();
        $dataSource = 'api';
        
        // MÉTODO PRIORITÁRIO: Web Scraping do Blockchain Center
        $scrapedIndex = scrapeBlockchainCenterAltcoinIndex();
        if ($scrapedIndex !== null) {
            // Se conseguimos obter o valor, usamos ele como fonte primária
            $dataSource = 'blockchain_center_scraping';
            
            // Obter Bitcoin Dominance para contexto e complemento
            $globalData = fetchApiData("https://api.coingecko.com/api/v3/global");
            $btcDominance = $globalData['data']['market_cap_percentage']['btc'] ?? 58.0;
            
            // Obter Bitcoin Performance para contextualização
            $btcData = fetchApiData("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=90&interval=daily");
            $btc90dPerformance = 0;
            if ($btcData && isset($btcData['prices'])) {
                $btcPrices = $btcData['prices'];
                $btcCurrentPrice = end($btcPrices)[1];
                $btcStartPrice = reset($btcPrices)[1];
                $btc90dPerformance = (($btcCurrentPrice - $btcStartPrice) / $btcStartPrice) * 100;
            }
            
            // Estimamos os outperforming alts baseado no valor do índice
            // 75% = 100% do índice, então 75 no índice = 37.5 altcoins de 50
            $estimatedTotalAlts = 50;
            $estimatedOutperforming = round(($scrapedIndex / 100) * 0.75 * $estimatedTotalAlts);
            
            // Prepare raw data response
            if ($rawDataOnly) {
                return [
                    'index_value' => $scrapedIndex,
                    'bitcoin_dominance' => $btcDominance,
                    'bitcoin_performance' => round($btc90dPerformance, 2),
                    'outperforming_alts' => $estimatedOutperforming,
                    'total_alts_analyzed' => $estimatedTotalAlts,
                    'data_source' => $dataSource
                ];
            }
            
            // Get historical data from storage for chart
            $timestamps = [];
            $values = [];
            
            // Get data from monthly files
            for ($i = 0; $i < 6; $i++) {
                $monthDate = date('Y-m', strtotime("-$i months"));
                $monthData = $storage->getMonthlyData('altseason', $monthDate);
                
                if ($monthData) {
                    ksort($monthData);
                    foreach ($monthData as $date => $dayData) {
                        if (isset($dayData['index_value'])) {
                            $timestamps[] = strtotime($date) * 1000;
                            $values[] = round($dayData['index_value']);
                        }
                    }
                }
            }
            
            // If not enough historical data, check daily files
            if (count($values) < 30) {
                $dailyDir = __DIR__ . '/../private/data/altseason/';
                if (is_dir($dailyDir)) {
                    $files = glob($dailyDir . '*.json');
                    usort($files, function($a, $b) {
                        return filemtime($b) - filemtime($a);
                    });
                    
                    $files = array_slice($files, 0, 30);
                    foreach ($files as $file) {
                        $date = basename($file, '.json');
                        $dayTimestamp = strtotime($date) * 1000;
                        
                        if (!in_array($dayTimestamp, $timestamps)) {
                            $dayData = json_decode(file_get_contents($file), true);
                            if (is_array($dayData)) {
                                $totalIndex = 0;
                                $count = 0;
                                
                                foreach ($dayData as $hourData) {
                                    if (isset($hourData['index_value'])) {
                                        $totalIndex += $hourData['index_value'];
                                        $count++;
                                    }
                                }
                                
                                if ($count > 0) {
                                    $timestamps[] = $dayTimestamp;
                                    $values[] = round($totalIndex / $count);
                                }
                            }
                        }
                    }
                }
            }
            
            // Sort by timestamp (oldest first for charts)
            if (!empty($timestamps)) {
                array_multisort($timestamps, SORT_ASC, $values);
            }
            
            // Return formatted data with scraped value
            return [
                'index' => $scrapedIndex,
                'bitcoin_dominance' => round($btcDominance, 1),
                'bitcoin_performance' => round($btc90dPerformance, 2),
                'outperforming_alts' => $estimatedOutperforming,
                'total_alts_analyzed' => $estimatedTotalAlts,
                'top_alts_performance' => [], // Não temos dados detalhados com scraping
                'historical' => [
                    'timestamps' => $timestamps,
                    'values' => $values
                ],
                'data_source' => $dataSource
            ];
        }
        
        // MÉTODO SECUNDÁRIO: Cálculo via API CoinGecko (fallback)
        // Get Bitcoin data for the last 90 days
        $btcData = fetchApiData("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=90&interval=daily");
        
        if (!$btcData || !isset($btcData['prices'])) {
            $dataSource = 'storage';
            // Fallback to stored data
            $todayData = $storage->getFallbackData('altseason');
            
            if ($todayData) {
                $lastHourData = end($todayData);
                
                // If we only need raw data
                if ($rawDataOnly) {
                    return $lastHourData;
                }
                
                // Format the response using stored data
                return [
                    'index' => round($lastHourData['index_value']),
                    'bitcoin_dominance' => round($lastHourData['bitcoin_dominance'], 1),
                    'bitcoin_performance' => round($lastHourData['bitcoin_performance'], 2),
                    'outperforming_alts' => $lastHourData['outperforming_alts'],
                    'total_alts_analyzed' => $lastHourData['total_alts_analyzed'],
                    'top_alts_performance' => [], // Limited data in stored version
                    'data_source' => 'storage'
                ];
            }
            
            return defaultAltseasonResponse();
        }

        // Calculate Bitcoin's performance
        $btcPrices = $btcData['prices'];
        $btcCurrentPrice = end($btcPrices)[1];
        $btcStartPrice = reset($btcPrices)[1];
        $btc90dPerformance = (($btcCurrentPrice - $btcStartPrice) / $btcStartPrice) * 100;

        // Get global market data for Bitcoin dominance
        $globalData = fetchApiData("https://api.coingecko.com/api/v3/global");
        $btcDominance = $globalData['data']['market_cap_percentage']['btc'] ?? 0;

        // Get top 50 coins data
        $topCoins = fetchApiData("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=false");
        if (!$topCoins || !is_array($topCoins)) {
            return defaultAltseasonResponse();
        }

        // Excluded tokens (stablecoins and asset-backed tokens)
        $excludedTokens = [
            'usdt', 'usdc', 'dai', 'busd', 'tusd', 'usdp', 'usdd', 'frax', // stablecoins
            'wbtc', 'steth', 'wsteth', 'reth', 'cbeth', 'ethx', 'weth', // liquid staking and wrapped tokens
            'xaut', 'paxg' // gold-backed tokens
        ];

        // Filter and limit to top 50 non-excluded coins
        $topCoins = array_filter($topCoins, function($coin) use ($excludedTokens) {
            return !in_array(strtolower($coin['symbol']), $excludedTokens);
        });
        $topCoins = array_slice($topCoins, 0, 50); // Take only top 50 after filtering

        $outperformingAlts = 0;
        $topAltsPerformance = [];
        $totalAlts = 0;

        foreach ($topCoins as $coin) {
            if (strtolower($coin['symbol']) === 'btc') continue;
            
            $totalAlts++;
            
            // Get 90-day history for each coin
            $coinHistory = fetchApiData("https://api.coingecko.com/api/v3/coins/{$coin['id']}/market_chart?vs_currency=usd&days=90&interval=daily");
            if (!$coinHistory || empty($coinHistory['prices'])) continue;

            $prices = $coinHistory['prices'];
            
            // Ensure we have enough price data
            if (count($prices) < 2) continue;
            
            // Calculate performance using moving average to reduce volatility impact
            $currentMA = array_sum(array_column(array_slice($prices, -7), 1)) / 7;
            $startMA = array_sum(array_column(array_slice($prices, 0, 7), 1)) / 7;
            
            $change90d = $startMA > 0 ? (($currentMA - $startMA) / $startMA) * 100 : 0;
            
            // Compare with Bitcoin's performance with a small margin to account for API data variations
            if ($change90d > ($btc90dPerformance - 0.5)) {
                $outperformingAlts++;
            }

            // Get last 7 days for sparkline with proper error handling
            try {
                $sparkline = array_slice($prices, -7);
                $sparklineValues = array_column($sparkline, 1);
                if (count($sparklineValues) < 7) {
                    // Pad with last known value if needed
                    $lastValue = end($sparklineValues);
                    while (count($sparklineValues) < 7) {
                        $sparklineValues[] = $lastValue;
                    }
                }
            } catch (Exception $e) {
                $sparklineValues = array_fill(0, 7, $currentMA);
            }

            $topAltsPerformance[] = [
                'name' => $coin['name'],
                'symbol' => strtolower($coin['symbol']),
                'change_90d' => round($change90d, 2),
                'current_price' => round($currentMA, 2),
                'market_cap' => $coin['market_cap'],
                'sparkline' => array_map('round', $sparklineValues, array_fill(0, count($sparklineValues), 2))
            ];
        }

        // Sort top alts by performance
        usort($topAltsPerformance, function($a, $b) {
            return $b['change_90d'] - $a['change_90d'];
        });

        // Calculate altseason index (0-100) based on Blockchain Center methodology
        // If 75% of the top 50 coins outperform Bitcoin in the last 90 days, it's Altcoin Season
        $altseasonIndex = $totalAlts > 0 ? round(($outperformingAlts / $totalAlts) * (100/0.75)) : 50;
        
        // Add contextual adjustments based on market conditions
        if ($btcDominance > 60) {
            // High BTC dominance typically indicates Bitcoin season
            // Apply a dampening factor to the index
            $dominanceFactor = ($btcDominance - 60) * 0.5;
            $altseasonIndex = max(5, $altseasonIndex - $dominanceFactor);
        } else if ($btcDominance < 50) {
            // Low BTC dominance typically indicates Altcoin season
            // Apply a boosting factor to the index
            $dominanceFactor = (50 - $btcDominance) * 0.5;
            $altseasonIndex = min(95, $altseasonIndex + $dominanceFactor);
        }
        
        // Adjust based on market trends (directional movement)
        if ($outperformingAlts > 0) {
            // If there are outperforming altcoins, ensure minimum value
            $altseasonIndex = max(10, $altseasonIndex);
        }
        
        $baseAltseasonIndex = $altseasonIndex;
        $altseasonIndex = min(100, max(0, $altseasonIndex)); // Ensure between 0 and 100

        // Return raw data for daily collection if requested
        if ($rawDataOnly) {
            return [
                'index_value' => $altseasonIndex,
                'bitcoin_dominance' => $btcDominance,
                'bitcoin_performance' => round($btc90dPerformance, 2),
                'outperforming_alts' => $outperformingAlts,
                'total_alts_analyzed' => $totalAlts,
                'data_source' => $dataSource
            ];
        }

        // Get historical data from storage
        $timestamps = [];
        $values = [];
        
        // Get data from monthly files
        for ($i = 0; $i < 6; $i++) { // Last 6 months
            $monthDate = date('Y-m', strtotime("-$i months"));
            $monthData = $storage->getMonthlyData('altseason', $monthDate);
            
            if ($monthData) {
                ksort($monthData); // Sort by date
                foreach ($monthData as $date => $dayData) {
                    if (isset($dayData['index_value'])) {
                        $timestamps[] = strtotime($date) * 1000; // Convert to milliseconds
                        $values[] = round($dayData['index_value']);
                    }
                }
            }
        }
        
        // If not enough data in monthly files, check daily files
        if (count($values) < 30) {
            $dailyDir = __DIR__ . '/../private/data/altseason/';
            if (is_dir($dailyDir)) {
                $files = glob($dailyDir . '*.json');
                usort($files, function($a, $b) {
                    return filemtime($b) - filemtime($a);
                });
                
                $files = array_slice($files, 0, 30);
                
                foreach ($files as $file) {
                    $date = basename($file, '.json');
                    $dayTimestamp = strtotime($date) * 1000;
                    
                    if (!in_array($dayTimestamp, $timestamps)) {
                        $dayData = json_decode(file_get_contents($file), true);
                        if (is_array($dayData)) {
                            $totalIndex = 0;
                            $count = 0;
                            
                            foreach ($dayData as $hourData) {
                                if (isset($hourData['index_value'])) {
                                    $totalIndex += $hourData['index_value'];
                                    $count++;
                                }
                            }
                            
                            if ($count > 0) {
                                $timestamps[] = $dayTimestamp;
                                $values[] = round($totalIndex / $count);
                            }
                        }
                    }
                }
            }
        }

        // Sort by timestamp (oldest first for charts)
        if (!empty($timestamps)) {
            array_multisort($timestamps, SORT_ASC, $values);
        }
        
        // Cross-validate with historical data to ensure consistency
        if (!empty($values)) {
            $recentValues = array_slice($values, -14, 14); // Last 2 weeks of data
            if (!empty($recentValues)) {
                $avgRecentValue = array_sum($recentValues) / count($recentValues);
                // Prevent extreme jumps in the index
                if (abs($baseAltseasonIndex - $avgRecentValue) > 30) {
                    // Blend the calculated value with the recent average
                    $altseasonIndex = round(($baseAltseasonIndex * 0.7) + ($avgRecentValue * 0.3));
                    $altseasonIndex = min(100, max(0, $altseasonIndex)); // Ensure between 0 and 100
                }
            }
        }

        // Return formatted data
        return [
            'index' => $altseasonIndex,
            'bitcoin_dominance' => round($btcDominance, 1),
            'bitcoin_performance' => round($btc90dPerformance, 2),
            'outperforming_alts' => $outperformingAlts,
            'total_alts_analyzed' => $totalAlts,
            'top_alts_performance' => array_slice($topAltsPerformance, 0, 10),
            'historical' => [
                'timestamps' => $timestamps,
                'values' => $values
            ],
            'data_source' => $dataSource
        ];
    }, 3600); // Cache for 1 hour
}

function defaultAltseasonResponse(): array {
    return [
        'index' => 50,
        'bitcoin_dominance' => 0,
        'bitcoin_performance' => 0,
        'outperforming_alts' => 0,
        'total_alts_analyzed' => 0,
        'top_alts_performance' => [],
        'historical' => [
            'timestamps' => [],
            'values' => []
        ],
        'data_source' => 'none'
    ];
}

function formatCurrency($value): string {
    if (!is_numeric($value)) return 'N/A';

    if ($value >= 1e12) {
        return '$' . number_format($value / 1e12, 2) . ' T';
    } else if ($value >= 1e9) {
        return '$' . number_format($value / 1e9, 2) . ' B';
    } else if ($value >= 1e6) {
        return '$' . number_format($value / 1e6, 2) . ' M';
    } else {
        return '$' . number_format($value, 2);
    }
}

function fetchLunarCrushAltcoinIndex(): ?array {
    $apiKey = "seu_api_key"; // Inscrição gratuita necessária
    $endpoint = "https://lunarcrush.com/api3/coins/correlations";
    $url = $endpoint . "?key=" . $apiKey . "&symbol=BTC&limit=50";
    
    $response = fetchApiData($url);
    if (!$response) return null;
    
    $outperformingAlts = 0;
    $totalAlts = 0;
    
    foreach ($response['data'] as $coin) {
        if ($coin['symbol'] !== 'BTC') {
            $totalAlts++;
            if ($coin['correlation'] < 0.5) { // Baixa correlação indica desempenho independente 
                $outperformingAlts++;
            }
        }
    }

    $index = $totalAlts > 0 ? round(($outperformingAlts / $totalAlts) * (100/0.75)) : 50;
    return ['index' => $index, 'outperforming' => $outperformingAlts, 'total' => $totalAlts];
}

// Implementação da função de web scraping para o Blockchain Center
function scrapeBlockchainCenterAltcoinIndex(): ?int {
    // Log do início da tentativa
    error_log("Tentando obter Altcoin Season Index via web scraping");
    
    // Usar User-Agent para evitar bloqueios
    $context = stream_context_create([
        'http' => [
            'header' => 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
            'timeout' => 15
        ]
    ]);
    
    // Lista de URLs para tentar em ordem
    $urls = [
        'https://www.blockchaincenter.net/altcoin-season-index/',
        'https://www.blockchaincenter.net/en/altcoin-season-index/',
        'https://web.archive.org/web/20230601/https://www.blockchaincenter.net/altcoin-season-index/',
        'https://web.archive.org/web/https://www.blockchaincenter.net/altcoin-season-index/' // Última versão arquivada
    ];
    
    $html = null;
    foreach ($urls as $url) {
        try {
            $html = @file_get_contents($url, false, $context);
            if ($html) {
                error_log("Sucesso ao obter HTML de: " . $url);
                break;
            }
        } catch (Exception $e) {
            error_log("Erro ao tentar obter HTML de {$url}: " . $e->getMessage());
        }
    }
    
    if (!$html) {
        error_log("Falha ao obter HTML de todas as URLs tentadas");
        return null;
    }
    
    // Tenta extrair o valor do índice usando vários padrões
    $patterns = [
        '/Altcoin Season\s+\*\*\((\d+)\)\*\*/i',
        '/Season\s+Index\s*[:]*\s*(\d+)/is',
        '/<div[^>]*>(\d+)<\/div>.*?(?:bitcoin|altcoin)\s+season/is',
        '/index\s*value[^0-9]*(\d+)/is',
        '/(?:Season|Altcoin)[^0-9]*(\d+)[^%]/is',
        '/<[^>]*class="[^"]*value[^"]*"[^>]*>(\d+)/is'
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $html, $matches)) {
            $value = (int)$matches[1];
            error_log("Encontrado valor do Altcoin Season Index: " . $value);
            
            // Verificar se o valor está no intervalo esperado (0-100)
            if ($value >= 0 && $value <= 100) {
                return $value;
            } else {
                error_log("Valor fora do intervalo esperado: " . $value);
            }
        }
    }
    
    error_log("Nenhum padrão encontrou o valor do índice no HTML");
    return null;
} 