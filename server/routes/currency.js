const express = require('express');
const router = express.Router();
const currencyService = require('../services/currencyService');

// Get all countries with currencies
router.get('/countries', async (req, res) => {
  try {
    const countries = await currencyService.getCountriesWithCurrencies();
    res.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ message: 'Failed to fetch countries data' });
  }
});

// Get exchange rates for a base currency
router.get('/rates/:baseCurrency', async (req, res) => {
  const { baseCurrency } = req.params;
  
  try {
    const rates = await currencyService.getExchangeRates(baseCurrency);
    res.json({ base: baseCurrency, rates });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ message: 'Failed to fetch exchange rates' });
  }
});

// Convert currency
router.post('/convert', async (req, res) => {
  const { amount, fromCurrency, toCurrency } = req.body;
  
  if (!amount || !fromCurrency || !toCurrency) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }
  
  try {
    const convertedAmount = await currencyService.convertCurrency(
      parseFloat(amount),
      fromCurrency,
      toCurrency
    );
    
    res.json({
      original: {
        amount: parseFloat(amount),
        currency: fromCurrency
      },
      converted: {
        amount: convertedAmount,
        currency: toCurrency
      }
    });
  } catch (error) {
    console.error('Currency conversion error:', error);
    res.status(500).json({ message: 'Currency conversion failed' });
  }
});

module.exports = router;