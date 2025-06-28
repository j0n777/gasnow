const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve static files
app.use('/css', express.static('css'));
app.use('/js', express.static('js'));
app.use('/images', express.static('images'));

// API Routes
app.get('/api/gas-prices', async (req, res) => {
  try {
    // Mock gas price data - replace with actual API calls
    const gasData = {
      ethereum: {
        slow: 15,
        standard: 25,
        fast: 35,
        instant: 45
      },
      polygon: {
        slow: 1,
        standard: 2,
        fast: 3,
        instant: 5
      }
    };
    
    res.json(gasData);
  } catch (error) {
    console.error('Error fetching gas prices:', error);
    res.status(500).json({ error: 'Failed to fetch gas prices' });
  }
});

app.get('/api/market-data', async (req, res) => {
  try {
    // Mock market data - replace with actual API calls
    const marketData = {
      bitcoin: {
        price: 45000,
        change24h: 2.5,
        marketCap: 850000000000
      },
      ethereum: {
        price: 3200,
        change24h: -1.2,
        marketCap: 380000000000
      },
      solana: {
        price: 95,
        change24h: 5.8,
        marketCap: 42000000000
      }
    };
    
    res.json(marketData);
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});