import fetch from 'node-fetch';
import logger, { logError } from '../utils/logger.js';

class BitcoinService {
  constructor() {
    this.coingeckoBaseUrl = 'https://api.coingecko.com/api/v3';
    this.blockonomicsBaseUrl = 'https://www.blockonomics.co/api';
    this.blockonomicsApiKey = process.env.BLOCKONOMICS_API_KEY;
    
    // Exchange rate validity window (60 minutes to reduce API calls)
    this.exchangeRateValidityMs = 60 * 60 * 1000;
    
    // Payment expiry window (24 hours)
    this.paymentExpiryMs = 24 * 60 * 60 * 1000;
    
    // Cache for exchange rates
    this.rateCache = {
      rate: null,
      timestamp: null
    };
    
    // Fallback exchange rate (updated manually if needed)
    this.fallbackRate = 87000; // £87,000 per BTC as of July 2025
    
    // Track API call attempts for rate limiting
    this.lastApiCallTime = 0;
    this.apiCallMinInterval = 10000; // Minimum 10 seconds between API calls
  }

  /**
   * Get BTC/GBP exchange rate from CoinGecko
   * Uses caching with validity window
   */
  async getBtcExchangeRate() {
    try {
      const now = Date.now();
      
      // Check if cached rate is still valid
      if (this.rateCache.rate && this.rateCache.timestamp && 
          (now - this.rateCache.timestamp < this.exchangeRateValidityMs)) {
        return {
          rate: this.rateCache.rate,
          timestamp: new Date(this.rateCache.timestamp),
          cached: true
        };
      }

      // Rate limiting check - prevent too frequent API calls
      if (now - this.lastApiCallTime < this.apiCallMinInterval) {
        logger.warn('CoinGecko API call throttled - too frequent requests');
        
        // Use cached rate if available, even if expired
        if (this.rateCache.rate) {
          return {
            rate: this.rateCache.rate,
            timestamp: new Date(this.rateCache.timestamp),
            cached: true,
            throttled: true
          };
        }
        
        // Otherwise use fallback rate
        return {
          rate: this.fallbackRate,
          timestamp: new Date(),
          cached: false,
          fallback: true
        };
      }

      // Update last API call time
      this.lastApiCallTime = now;

      // Fetch fresh rate from CoinGecko
      const response = await fetch(
        `${this.coingeckoBaseUrl}/simple/price?ids=bitcoin&vs_currencies=gbp`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'GrapheneOS-Store/1.0'
          },
          timeout: 10000
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.bitcoin || !data.bitcoin.gbp) {
        throw new Error('Invalid response from CoinGecko API');
      }

      const rate = data.bitcoin.gbp;
      const timestamp = now;

      // Update cache
      this.rateCache = {
        rate,
        timestamp
      };

      return {
        rate,
        timestamp: new Date(timestamp),
        cached: false
      };

    } catch (error) {
      logError(error, { context: 'btc_exchange_rate_fetch' });
      
      // Handle rate limiting specifically
      if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
        logger.warn('CoinGecko API rate limit exceeded - using fallback');
      }
      
      // If we have a cached rate, use it even if expired as fallback
      if (this.rateCache.rate && this.rateCache.timestamp) {
        logger.warn('Using expired cached Bitcoin rate due to API failure');
        return {
          rate: this.rateCache.rate,
          timestamp: new Date(this.rateCache.timestamp),
          cached: true,
          expired: true
        };
      }
      
      // Use fallback rate as last resort
      logger.warn(`Using fallback Bitcoin rate: £${this.fallbackRate} per BTC`);
      return {
        rate: this.fallbackRate,
        timestamp: new Date(),
        cached: false,
        fallback: true,
        error: error.message
      };
    }
  }

  /**
   * Convert GBP amount to BTC using current exchange rate
   */
  async convertGbpToBtc(gbpAmount) {
    try {
      const { rate, timestamp } = await this.getBtcExchangeRate();
      const btcAmount = gbpAmount / rate;
      
      return {
        btcAmount: parseFloat(btcAmount.toFixed(8)), // Bitcoin has 8 decimal places
        exchangeRate: rate,
        exchangeRateTimestamp: timestamp
      };
    } catch (error) {
      logError(error, { context: 'gbp_to_btc_conversion', amount: gbpAmount });
      throw error;
    }
  }

  /**
   * Generate a new Bitcoin address using Blockonomics API
   */
  async generateBitcoinAddress() {
    try {
      // For development/testing, generate a mock Bitcoin address if API key is not configured
      if (!this.blockonomicsApiKey) {
        console.warn('⚠️  Blockonomics API key not configured - using mock Bitcoin address for development');
        
        // Generate a realistic-looking Bitcoin address for testing
        const mockAddresses = [
          '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
          '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
          'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
          'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
        ];
        
        // Return a random mock address for testing
        const randomIndex = Math.floor(Math.random() * mockAddresses.length);
        const mockAddress = mockAddresses[randomIndex];
        
        console.log(`🧪 Generated mock Bitcoin address for testing: ${mockAddress}`);
        return mockAddress;
      }

      const response = await fetch(
        `${this.blockonomicsBaseUrl}/new_address`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.blockonomicsApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (!response.ok) {
        throw new Error(`Blockonomics API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.address) {
        throw new Error('Invalid response from Blockonomics API');
      }

      console.log(`✅ Generated Bitcoin address via Blockonomics: ${data.address}`);
      return data.address;

    } catch (error) {
      logError(error, { context: 'bitcoin_address_generation' });
      throw new Error('Failed to generate Bitcoin address');
    }
  }

  /**
   * Get Bitcoin address balance and transaction info from Blockonomics
   */
  async getBitcoinAddressInfo(address) {
    try {
      if (!this.blockonomicsApiKey) {
        throw new Error('Blockonomics API key not configured');
      }

      const response = await fetch(
        `${this.blockonomicsBaseUrl}/balance`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.blockonomicsApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            addr: address
          }),
          timeout: 10000
        }
      );

      if (!response.ok) {
        throw new Error(`Blockonomics API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        balance: data.response?.[0]?.confirmed || 0,
        unconfirmedBalance: data.response?.[0]?.unconfirmed || 0,
        txCount: data.response?.[0]?.tx_count || 0
      };

    } catch (error) {
      logError(error, { context: 'bitcoin_address_info', address });
      throw new Error('Failed to fetch Bitcoin address information');
    }
  }

  /**
   * Get transaction details from Blockonomics
   */
  async getTransactionDetails(txHash) {
    try {
      if (!this.blockonomicsApiKey) {
        throw new Error('Blockonomics API key not configured');
      }

      const response = await fetch(
        `${this.blockonomicsBaseUrl}/tx_detail/${txHash}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.blockonomicsApiKey}`,
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      if (!response.ok) {
        throw new Error(`Blockonomics API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        confirmations: data.confirmations || 0,
        blockHeight: data.block_height,
        timestamp: data.time,
        fee: data.fee,
        size: data.size,
        outputs: data.out || []
      };

    } catch (error) {
      logError(error, { context: 'bitcoin_transaction_details', txHash });
      throw new Error('Failed to fetch transaction details');
    }
  }

  /**
   * Create Bitcoin payment data for an order
   */
  async createBitcoinPayment(orderAmount) {
    try {
      // Generate Bitcoin address
      const bitcoinAddress = await this.generateBitcoinAddress();
      
      // Get current exchange rate and convert amount
      const { btcAmount, exchangeRate, exchangeRateTimestamp } = await this.convertGbpToBtc(orderAmount);
      
      // Set payment expiry (24 hours from now)
      const paymentExpiry = new Date(Date.now() + this.paymentExpiryMs);

      return {
        bitcoinAddress,
        bitcoinAmount: btcAmount,
        bitcoinExchangeRate: exchangeRate,
        bitcoinExchangeRateTimestamp: exchangeRateTimestamp,
        bitcoinPaymentExpiry: paymentExpiry
      };

    } catch (error) {
      logError(error, { context: 'bitcoin_payment_creation', orderAmount });
      throw error;
    }
  }

  /**
   * Validate Bitcoin payment confirmation requirements
   */
  isPaymentConfirmed(confirmations) {
    return confirmations >= 2; // Require 2 confirmations as per requirements
  }

  /**
   * Check if payment is expired
   */
  isPaymentExpired(expiryDate) {
    return new Date() > new Date(expiryDate);
  }

  /**
   * Check if payment amount is sufficient (allowing for small variance)
   */
  isPaymentSufficient(receivedAmount, expectedAmount, tolerancePercent = 1) {
    const tolerance = expectedAmount * (tolerancePercent / 100);
    return receivedAmount >= (expectedAmount - tolerance);
  }

  /**
   * Format Bitcoin amount for display
   */
  formatBitcoinAmount(amount) {
    return parseFloat(amount.toFixed(8));
  }

  /**
   * Convert satoshis to BTC
   */
  satoshisToBtc(satoshis) {
    return satoshis / 100000000;
  }

  /**
   * Convert BTC to satoshis
   */
  btcToSatoshis(btc) {
    return Math.round(btc * 100000000);
  }
}

export default new BitcoinService();