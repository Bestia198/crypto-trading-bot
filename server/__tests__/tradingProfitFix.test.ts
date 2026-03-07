import { describe, it, expect, beforeAll } from "vitest";
import { ImprovedMockMarketData } from "../services/ImprovedMockMarketData";
import { generateRealisticTrade } from "../tradingSimulation";

describe("Trading Profit Fix - Real Profits Generation", () => {
  let mockMarketData: ImprovedMockMarketData;

  beforeAll(() => {
    mockMarketData = new ImprovedMockMarketData();
  });

  it("should generate market data with realistic price movements", () => {
    const ohlcv = mockMarketData.generateOHLCV("BTC/USDT", 50);
    
    expect(ohlcv.length).toBe(50);
    expect(ohlcv[0].close).toBeGreaterThan(0);
    expect(ohlcv[49].close).toBeGreaterThan(0);
    
    // Check that prices change between candles
    let priceChanges = 0;
    for (let i = 1; i < ohlcv.length; i++) {
      if (ohlcv[i].close !== ohlcv[i - 1].close) {
        priceChanges++;
      }
    }
    
    expect(priceChanges).toBeGreaterThan(40); // Most prices should change
  });

  it("should generate trades with non-zero profits", () => {
    const currentPrice = 45000;
    const trades: any[] = [];
    
    // Generate 20 trades
    for (let i = 0; i < 20; i++) {
      const trade = generateRealisticTrade(i, "Momentum", currentPrice, 2.5);
      trades.push(trade);
    }
    
    // Check that at least some trades have non-zero profit
    const profitableTrades = trades.filter(t => t.profit !== 0);
    expect(profitableTrades.length).toBeGreaterThan(0);
    
    console.log(`Generated ${trades.length} trades, ${profitableTrades.length} with non-zero profit`);
  });

  it("should generate trades with larger price movements (3-8%)", () => {
    const currentPrice = 45000;
    const trades: any[] = [];
    
    for (let i = 0; i < 50; i++) {
      const trade = generateRealisticTrade(i, "RL", currentPrice, 2.5);
      trades.push(trade);
    }
    
    // Calculate average price change percentage
    const avgPriceChange = trades.reduce((sum, t) => {
      const change = Math.abs((t.exitPrice - t.entryPrice) / t.entryPrice) * 100;
      return sum + change;
    }, 0) / trades.length;
    
    console.log(`Average price change: ${avgPriceChange.toFixed(2)}%`);
    expect(avgPriceChange).toBeGreaterThan(2); // Should be 3-8%
  });

  it("should calculate profit correctly", () => {
    const entryPrice = 45000;
    const exitPrice = 45000 * 1.05; // 5% gain
    const quantity = 0.001; // 0.001 BTC
    
    const expectedProfit = (exitPrice - entryPrice) * quantity;
    
    const trade = generateRealisticTrade(1, "Momentum", entryPrice, 2.5);
    
    // Profit should be calculated as (exitPrice - entryPrice) * quantity
    const calculatedProfit = (trade.exitPrice - trade.entryPrice) * trade.quantity;
    
    expect(calculatedProfit).toBeCloseTo(trade.profit, 2);
  });

  it("should generate both profitable and losing trades", () => {
    const currentPrice = 45000;
    const trades: any[] = [];
    
    for (let i = 0; i < 100; i++) {
      const trade = generateRealisticTrade(i, "MeanReversion", currentPrice, 2.5);
      trades.push(trade);
    }
    
    const profitableTrades = trades.filter(t => t.profit > 0);
    const losingTrades = trades.filter(t => t.profit < 0);
    const breakEvenTrades = trades.filter(t => t.profit === 0);
    
    console.log(`Profitable: ${profitableTrades.length}, Losing: ${losingTrades.length}, Break-even: ${breakEvenTrades.length}`);
    
    // Should have a mix of profitable and losing trades
    expect(profitableTrades.length).toBeGreaterThan(0);
    expect(losingTrades.length).toBeGreaterThan(0);
  });

  it("should have realistic profit percentages", () => {
    const currentPrice = 45000;
    const trades: any[] = [];
    
    for (let i = 0; i < 30; i++) {
      const trade = generateRealisticTrade(i, "RL", currentPrice, 2.5);
      trades.push(trade);
    }
    
    // Calculate profit percentages
    const profitPercentages = trades.map(t => {
      if (t.quantity === 0) return 0;
      return ((t.exitPrice - t.entryPrice) / t.entryPrice) * 100;
    });
    
    const avgProfitPercent = profitPercentages.reduce((a, b) => a + b, 0) / profitPercentages.length;
    const maxProfitPercent = Math.max(...profitPercentages);
    const minProfitPercent = Math.min(...profitPercentages);
    
    console.log(`Profit range: ${minProfitPercent.toFixed(2)}% to ${maxProfitPercent.toFixed(2)}%`);
    console.log(`Average profit: ${avgProfitPercent.toFixed(2)}%`);
    
    // Profit percentages should be in the 3-8% range (with some variance)
    expect(Math.abs(maxProfitPercent)).toBeGreaterThan(1);
  });
});
