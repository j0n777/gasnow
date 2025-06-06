<?php
require_once 'functions.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'gas_prices':
        $blockchain = $_GET['blockchain'] ?? 'eth';
        echo json_encode(getGasPrices($blockchain));
        break;
    case 'fear_greed_index':
        echo json_encode(getFearGreedIndex());
        break;
    case 'market_cap':
        echo json_encode(getMarketCapData());
        break;
    case 'news':
        echo json_encode(getLatestNews());
        break;
    default:
        echo json_encode(['error' => 'Invalid action']);
}