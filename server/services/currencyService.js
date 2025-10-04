const fetch = require('node-fetch');

// Cache for country and currency data
let countriesCache = null;
let exchangeRatesCache = {};

/**
 * Fetch all countries with their currencies
 * @returns {Promise<Array>} Array of countries with currency information
 */
async function getCountriesWithCurrencies() {
  if (countriesCache) {
    return countriesCache;
  }

  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
    const data = await response.json();
    
    // Format the data for easier consumption
    const formattedData = data.map(country => {
      const currencies = country.currencies ? Object.keys(country.currencies) : [];
      const currencyInfo = currencies.length > 0 ? {
        code: currencies[0],
        name: country.currencies[currencies[0]].name,
        symbol: country.currencies[currencies[0]].symbol
      } : null;
      
      return {
        name: country.name.common,
        officialName: country.name.official,
        currency: currencyInfo
      };
    });
    
    // Sort by country name
    formattedData.sort((a, b) => a.name.localeCompare(b.name));
    
    // Cache the result
    countriesCache = formattedData;
    return formattedData;
  } catch (error) {
    console.error('Error fetching countries:', error);
    
    // Return a minimal fallback list
    return [
      { name: 'United States', currency: { code: 'USD', name: 'US Dollar', symbol: '$' } },
      { name: 'United Kingdom', currency: { code: 'GBP', name: 'British Pound', symbol: '£' } },
      { name: 'European Union', currency: { code: 'EUR', name: 'Euro', symbol: '€' } },
      { name: 'Japan', currency: { code: 'JPY', name: 'Japanese Yen', symbol: '¥' } }
    ];
  }
}

/**
 * Get exchange rates for a base currency
 * @param {string} baseCurrency - The base currency code (e.g., 'USD')
 * @returns {Promise<Object>} Exchange rates object
 */
async function getExchangeRates(baseCurrency) {
  // Check cache first (cache for 1 hour)
  const cacheKey = baseCurrency;
  const cacheTime = exchangeRatesCache[cacheKey]?.timestamp;
  const oneHour = 60 * 60 * 1000;
  
  if (cacheTime && (Date.now() - cacheTime < oneHour)) {
    return exchangeRatesCache[cacheKey].rates;
  }
  
  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    const data = await response.json();
    
    if (data.rates) {
      // Cache the result
      exchangeRatesCache[cacheKey] = {
        rates: data.rates,
        timestamp: Date.now()
      };
      
      return data.rates;
    }
    
    throw new Error('Invalid response from exchange rate API');
  } catch (error) {
    console.error(`Error fetching exchange rates for ${baseCurrency}:`, error);
    
    // Return a minimal fallback with common currencies
    return {
      USD: baseCurrency === 'USD' ? 1 : 1.1,
      EUR: baseCurrency === 'EUR' ? 1 : 0.9,
      GBP: baseCurrency === 'GBP' ? 1 : 0.8,
      JPY: baseCurrency === 'JPY' ? 1 : 150
    };
  }
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - The amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} Converted amount
 */
async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  try {
    const rates = await getExchangeRates(fromCurrency);
    
    if (!rates[toCurrency]) {
      throw new Error(`Exchange rate not available for ${toCurrency}`);
    }
    
    return amount * rates[toCurrency];
  } catch (error) {
    console.error('Currency conversion error:', error);
    throw error;
  }
}

module.exports = {
  getCountriesWithCurrencies,
  getExchangeRates,
  convertCurrency
};