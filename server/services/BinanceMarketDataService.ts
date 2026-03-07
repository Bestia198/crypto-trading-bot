/**
 * Binance Market Data Service
 * Fetches real-time cryptocurrency prices from Binance API
 */

import axios from "axios";

export interface BinancePrice {
  symbol: string;
  price: number;
  timestamp: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export interface PriceCache {
  [symbol: string]: BinancePrice;
}

export class BinanceMarketDataService {
  private static readonly BINANCE_API = "https://api.binance.com/api/v3";
  private static readonly CACHE_TTL = 5000; // 5 seconds
  private priceCache: PriceCache = {};
  private cacheTimestamps: { [symbol: string]: number } = {};

  /**
   * Get current price for a trading pair from Binance
   */
  async getPrice(symbol: string): Promise<BinancePrice | null> {
    try {
      // Check cache first
      if (this.isCacheValid(symbol)) {
        return this.priceCache[symbol];
      }

      // Fetch from Binance API
      const response = await axios.get(`${BinanceMarketDataService.BINANCE_API}/ticker/24hr`, {
        params: { symbol },
        timeout: 5000,
      });

      const data = response.data;
      const price: BinancePrice = {
        symbol: data.symbol,
        price: parseFloat(data.lastPrice),
        timestamp: data.time,
        change24h: parseFloat(data.priceChangePercent),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        volume24h: parseFloat(data.volume),
      };

      // Cache the result
      this.priceCache[symbol] = price;
      this.cacheTimestamps[symbol] = Date.now();

      return price;
    } catch (error) {
      console.error(`[BinanceMarketData] Error fetching price for ${symbol}:`, error);
      // Return cached value if available, even if expired
      return this.priceCache[symbol] || null;
    }
  }

  /**
   * Get prices for multiple symbols
   */
  async getPrices(symbols: string[]): Promise<BinancePrice[]> {
    const prices: BinancePrice[] = [];

    for (const symbol of symbols) {
      const price = await this.getPrice(symbol);
      if (price) {
        prices.push(price);
      }
    }

    return prices;
  }

  /**
   * Get OHLCV (candlestick) data for technical analysis
   */
  async getOHLCV(
    symbol: string,
    interval: string = "1h",
    limit: number = 50
  ): Promise<
    {
      timestamp: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }[]
  > {
    try {
      const response = await axios.get(`${BinanceMarketDataService.BINANCE_API}/klines`, {
        params: {
          symbol,
          interval,
          limit,
        },
        timeout: 5000,
      });

      return response.data.map((candle: any[]) => ({
        timestamp: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[7]),
      }));
    } catch (error) {
      console.error(`[BinanceMarketData] Error fetching OHLCV for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Check if cached price is still valid
   */
  private isCacheValid(symbol: string): boolean {
    if (!this.priceCache[symbol]) return false;
    const age = Date.now() - (this.cacheTimestamps[symbol] || 0);
    return age < BinanceMarketDataService.CACHE_TTL;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.priceCache = {};
    this.cacheTimestamps = {};
  }

  /**
   * Get market data for trading analysis
   */
  async getMarketData(symbol: string, interval: string = "1h"): Promise<any> {
    try {
      const [price, ohlcv] = await Promise.all([this.getPrice(symbol), this.getOHLCV(symbol, interval)]);

      if (!price || ohlcv.length === 0) {
        return null;
      }

      return {
        symbol,
        currentPrice: price.price,
        change24h: price.change24h,
        high24h: price.high24h,
        low24h: price.low24h,
        volume24h: price.volume24h,
        ohlcv,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`[BinanceMarketData] Error getting market data for ${symbol}:`, error);
      return null;
    }
  }
}

// Singleton instance
export const binanceMarketData = new BinanceMarketDataService();
