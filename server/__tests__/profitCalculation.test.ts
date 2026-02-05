import { describe, it, expect } from "vitest";
import { generateRealisticTrade, generateMultipleTrades } from "../tradingSimulation";

describe("Profit and Quantity Calculation", () => {
  it("should generate trades with non-zero quantity", () => {
    const trade = generateRealisticTrade(1, "RL", 50000);
    
    expect(trade.quantity).toBeGreaterThan(0);
    expect(trade.quantity).toBeLessThanOrEqual(1);
    expect(Number.isNaN(trade.quantity)).toBe(false);
  });

  it("should generate trades with calculated profit", () => {
    const trade = generateRealisticTrade(1, "Momentum", 50000);
    
    // Profit should be calculated as (exitPrice - entryPrice) * quantity
    const expectedProfit = (trade.exitPrice - trade.entryPrice) * trade.quantity;
    
    // Allow small floating point differences
    expect(Math.abs(trade.profit - expectedProfit)).toBeLessThan(0.01);
  });

  it("should round profit to 2 decimal places", () => {
    const trade = generateRealisticTrade(1, "MeanReversion", 50000);
    
    // Check that profit has max 2 decimal places
    const profitStr = trade.profit.toString();
    const decimalPart = profitStr.split(".")[1];
    
    if (decimalPart) {
      expect(decimalPart.length).toBeLessThanOrEqual(2);
    }
  });

  it("should have valid quantity as number", () => {
    const trade = generateRealisticTrade(1, "DeepSeek", 50000);
    
    // Quantity should be a valid number
    expect(typeof trade.quantity).toBe("number");
    expect(Number.isFinite(trade.quantity)).toBe(true);
    expect(trade.quantity).toBeGreaterThan(0);
  });

  it("should generate multiple trades with valid profits and quantities", () => {
    const trades = generateMultipleTrades(1, "RL", 5, 50000);
    
    expect(trades.length).toBe(5);
    
    trades.forEach((trade) => {
      expect(trade.quantity).toBeGreaterThan(0);
      expect(Number.isNaN(trade.profit)).toBe(false);
      expect(Number.isNaN(trade.quantity)).toBe(false);
    });
  });

  it("should have profit that matches price difference times quantity", () => {
    const trade = generateRealisticTrade(1, "Momentum", 50000);
    
    const calculatedProfit = (trade.exitPrice - trade.entryPrice) * trade.quantity;
    
    // Profit should be within 0.01 due to rounding
    expect(Math.abs(trade.profit - calculatedProfit)).toBeLessThan(0.01);
  });

  it("should generate positive and negative profits", () => {
    let positiveCount = 0;
    let negativeCount = 0;
    
    // Generate 50 trades to check distribution
    for (let i = 0; i < 50; i++) {
      const trade = generateRealisticTrade(i, "RL", 50000);
      
      if (trade.profit > 0) {
        positiveCount++;
      } else if (trade.profit < 0) {
        negativeCount++;
      }
    }
    
    // Should have both positive and negative profits
    expect(positiveCount).toBeGreaterThan(0);
    expect(negativeCount).toBeGreaterThan(0);
  });

  it("should have quantity based on trade amount and entry price", () => {
    const currentPrice = 50000;
    const trade = generateRealisticTrade(1, "RL", currentPrice);
    
    const tradeAmount = 15; // $15 per trade
    const expectedQuantity = tradeAmount / trade.entryPrice;
    
    // Quantity should be approximately equal to trade amount / entry price
    expect(Math.abs(trade.quantity - expectedQuantity)).toBeLessThan(0.0001);
  });

  it("should have entry price within 2% of current price", () => {
    const currentPrice = 50000;
    const trade = generateRealisticTrade(1, "RL", currentPrice);
    
    // Entry price should be within 2% of current price (0.98 - 1.02)
    const minPrice = currentPrice * 0.98;
    const maxPrice = currentPrice * 1.02;
    
    expect(trade.entryPrice).toBeGreaterThanOrEqual(minPrice);
    expect(trade.entryPrice).toBeLessThanOrEqual(maxPrice);
  });

  it("should have exit price within volatility range of entry price", () => {
    const trade = generateRealisticTrade(1, "RL", 50000);
    
    // Exit price should be within ±2.5% of entry price (volatility = 2.5)
    const minPrice = trade.entryPrice * 0.975;
    const maxPrice = trade.entryPrice * 1.025;
    
    expect(trade.exitPrice).toBeGreaterThanOrEqual(minPrice);
    expect(trade.exitPrice).toBeLessThanOrEqual(maxPrice);
  });
});
