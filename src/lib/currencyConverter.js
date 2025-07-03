
const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest';

class CurrencyConverter {
  constructor() {
    this.rates = {};
    this.lastUpdated = null;
    this.baseCurrency = 'USD';
    this.cacheTimeout = 60 * 60 * 1000;
  }

  async fetchExchangeRates(baseCurrency = 'USD') {
    try {
      const response = await fetch(`${EXCHANGE_RATE_API_URL}/${baseCurrency}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      this.rates = data.rates;
      this.baseCurrency = baseCurrency;
      this.lastUpdated = new Date();
      
      localStorage.setItem('exchangeRates', JSON.stringify({
        rates: this.rates,
        baseCurrency: this.baseCurrency,
        lastUpdated: this.lastUpdated.toISOString()
      }));
      
      return this.rates;
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      this.loadCachedRates();
      throw error;
    }
  }

  loadCachedRates() {
    try {
      const cached = localStorage.getItem('exchangeRates');
      if (cached) {
        const data = JSON.parse(cached);
        this.rates = data.rates || {};
        this.baseCurrency = data.baseCurrency || 'USD';
        this.lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : null;
      }
    } catch (error) {
      console.error('Failed to load cached rates:', error);
    }
  }

  isRatesCacheValid() {
    if (!this.lastUpdated || Object.keys(this.rates).length === 0) {
      return false;
    }
    const now = new Date();
    return (now - this.lastUpdated) < this.cacheTimeout;
  }

  async ensureRatesLoaded(baseCurrency = 'USD') {
    if (this.baseCurrency !== baseCurrency || !this.isRatesCacheValid()) {
      try {
        await this.fetchExchangeRates(baseCurrency);
      } catch (error) {
        if (Object.keys(this.rates).length === 0) {
          this.loadCachedRates();
        }
      }
    }
  }

  convert(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    if (Object.keys(this.rates).length === 0) {
      console.warn('No exchange rates available, returning original amount');
      return amount;
    }

    let convertedAmount = amount;

    if (fromCurrency !== this.baseCurrency) {
      if (!this.rates[fromCurrency]) {
        console.warn(`Exchange rate not found for ${fromCurrency}, returning original amount`);
        return amount;
      }
      convertedAmount = amount / this.rates[fromCurrency];
    }

    if (toCurrency !== this.baseCurrency) {
      if (!this.rates[toCurrency]) {
        console.warn(`Exchange rate not found for ${toCurrency}, returning original amount`);
        return amount;
      }
      convertedAmount = convertedAmount * this.rates[toCurrency];
    }

    return convertedAmount;
  }

  async convertAsync(amount, fromCurrency, toCurrency, baseCurrency = 'USD') {
    await this.ensureRatesLoaded(baseCurrency);
    return this.convert(amount, fromCurrency, toCurrency);
  }

  getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    if (Object.keys(this.rates).length === 0) {
      return null;
    }

    if (fromCurrency === this.baseCurrency) {
      return this.rates[toCurrency] || null;
    }

    if (toCurrency === this.baseCurrency) {
      return this.rates[fromCurrency] ? 1 / this.rates[fromCurrency] : null;
    }

    const fromRate = this.rates[fromCurrency];
    const toRate = this.rates[toCurrency];
    
    if (!fromRate || !toRate) {
      return null;
    }

    return toRate / fromRate;
  }

  formatCurrencyWithConversion(amount, fromCurrency, toCurrency, showOriginal = false) {
    const convertedAmount = this.convert(amount, fromCurrency, toCurrency);
    const formatted = new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: toCurrency 
    }).format(convertedAmount);

    if (showOriginal && fromCurrency !== toCurrency) {
      const originalFormatted = new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: fromCurrency 
      }).format(amount);
      return `${formatted} (${originalFormatted})`;
    }

    return formatted;
  }

  getLastUpdated() {
    return this.lastUpdated;
  }

  getRatesInfo() {
    return {
      baseCurrency: this.baseCurrency,
      lastUpdated: this.lastUpdated,
      ratesCount: Object.keys(this.rates).length,
      isValid: this.isRatesCacheValid()
    };
  }
}

export const currencyConverter = new CurrencyConverter();
export default currencyConverter;
