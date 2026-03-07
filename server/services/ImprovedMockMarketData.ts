/**
 * Improved Mock Market Data Service
 * Generates realistic price movements for testing when Binance API is unavailable
 */

import { PriceData } from "./technicalIndicators";

export interface MockMarketState {
  currentPrice: number;
  trend: number; // -1: down, 0: neutral, 1: up
  volatility: number; // 0-1
  volume: number;
}

export class ImprovedMockMarketData {
  private marketState: Map<string, MockMarketState> = new Map();
  private priceHistory: Map<string, number[]> = new Map();

  constructor() {
    // Initialize market states for common symbols
    this.initializeSymbol("BTC/USDT", 45000);
    this.initializeSymbol("ETH/USDT", 2500);
    this.initializeSymbol("XRP/USDT", 0.52);
  }

  /**
   * Initialize market state for a symbol
   */
  private initializeSymbol(symbol: string, initialPrice: number): void {
    this.marketState.set(symbol, {
      currentPrice: initialPrice,
      trend: Math.random() - 0.5, // Random initial trend
      volatility: 0.02 + Math.random() * 0.03, // 2-5% volatility
      volume: 1000000 + Math.random() * 5000000,
    });
    this.priceHistory.set(symbol, [initialPrice]);
  }

  /**
   * Generate next price with realistic market dynamics
   */
  generateNextPrice(symbol: string): number {
    let state = this.marketState.get(symbol);
    if (!state) {
      this.initializeSymbol(symbol, 45000);
      state = this.marketState.get(symbol)!;
    }

    // Trend changes (momentum reversal)
    if (Math.random() < 0.1) {
      state.trend = state.trend * -0.5 + (Math.random() - 0.5) * 0.3;
    }

    // Volatility changes (market regime shifts)
    if (Math.random() < 0.05) {
      state.volatility = Math.max(0.01, Math.min(0.1, state.volatility + (Math.random() - 0.5) * 0.02));
    }

    // Generate price change with trend and volatility
    const trendComponent = state.trend * 0.5; // Trend contributes 50%
    const randomComponent = (Math.random() - 0.5) * state.volatility * 2; // Random walk
    const priceChangePercent = (trendComponent + randomComponent) / 100;

    // Apply price change
    const newPrice = state.currentPrice * (1 + priceChangePercent);
    state.currentPrice = Math.max(newPrice * 0.8, Math.min(newPrice * 1.2, newPrice)); // Prevent extreme moves

    // Update volume with slight randomness
    state.volume = state.volume * (0.8 + Math.random() * 0.4);

    // Store in history
    const history = this.priceHistory.get(symbol) || [];
    history.push(state.currentPrice);
    if (history.length > 100) {
      history.shift(); // Keep only last 100 prices
    }
    this.priceHistory.set(symbol, history);

    return state.currentPrice;
  }

  /**
   * Generate OHLCV data with realistic price movements
   */
  generateOHLCV(symbol: string, periods: number = 50): PriceData[] {
    const ohlcv: PriceData[] = [];
    let price = this.marketState.get(symbol)?.currentPrice || 45000;

    for (let i = 0; i < periods; i++) {
      const open = price;
      const high = price * (1 + Math.random() * 0.02); // Up to 2% higher
      const low = price * (1 - Math.random() * 0.02); // Up to 2% lower
      const close = low + Math.random() * (high - low); // Random close between low and high
      const volume = 1000000 + Math.random() * 5000000;

      ohlcv.push({
        timestamp: Date.now() - (periods - i) * 60000,
        open,
        high,
        low,
        close,
        volume,
      });

      price = close; // Next candle starts at previous close
    }

    return ohlcv;
  }

  /**
   * Get current price
   */
  getCurrentPrice(symbol: string): number {
    let state = this.marketState.get(symbol);
    if (!state) {
      this.initializeSymbol(symbol, 45000);
      state = this.marketState.get(symbol)!;
    }
    return state.currentPrice;
  }

  /**
   * Get market state
   */
  getMarketState(symbol: string): MockMarketState {
    let state = this.marketState.get(symbol);
    if (!state) {
      this.initializeSymbol(symbol, 45000);
      state = this.marketState.get(symbol)!;
    }
    return { ...state };
  }

  /**
   * Get price history
   */
  getPriceHistory(symbol: string): number[] {
    return this.priceHistory.get(symbol) || [];
  }

  /**
   * Simulate price movement for multiple periods
   */
  simulatePriceMovement(symbol: string, periods: number = 10): number[] {
    const prices: number[] = [];
    for (let i = 0; i < periods; i++) {
      prices.push(this.generateNextPrice(symbol));
    }
    return prices;
  }

  /**
   * Reset market state (for testing)
   */
  reset(): void {
    this.marketState.clear();
    this.priceHistory.clear();
    this.initializeSymbol("BTC/USDT", 45000);
    this.initializeSymbol("ETH/USDT", 2500);
    this.initializeSymbol("XRP/USDT", 0.52);
  }
}

// Singleton instance
export const improvedMockMarketData = new ImprovedMockMarketData();
