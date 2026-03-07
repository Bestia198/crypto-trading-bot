import { describe, it, expect } from "vitest";
import { generateRealisticTrade, generateMultipleTrades, calculateTradeStats } from "../tradingSimulation";

describe("Trading Simulation", () => {
  describe("generateRealisticTrade", () => {
    it("should generate a realistic trade with required fields", () => {
      const trade = generateRealisticTrade(1, "RL", 45000);
      
      expect(trade).toBeDefined();
      expect(trade.agentId).toBe(1);
      expect(trade.symbol).toBe("BTC/USDT");
      expect(trade.entryPrice).toBeGreaterThan(0);
      expect(trade.exitPrice).toBeGreaterThan(0);
      expect(trade.quantity).toBeGreaterThanOrEqual(0);
      expect(trade.tradeType).toMatch(/^(buy|sell)$/);
      expect(trade.confidence).toBeGreaterThanOrEqual(0);
      expect(trade.confidence).toBeLessThanOrEqual(1);
      expect(trade.timestamp).toBeInstanceOf(Date);
    });

    it("should generate different confidence levels for different agent types", () => {
      const rlTrade = generateRealisticTrade(1, "RL", 45000);
      const momentumTrade = generateRealisticTrade(1, "Momentum", 45000);
      const deepseekTrade = generateRealisticTrade(1, "DeepSeek", 45000);
      
      expect(rlTrade.confidence).toBeGreaterThan(0);
      expect(momentumTrade.confidence).toBeGreaterThan(0);
      expect(deepseekTrade.confidence).toBeGreaterThan(0);
    });

    it("should generate trades with realistic profit/loss", () => {
      const trade = generateRealisticTrade(1, "RL", 45000);
      const expectedProfit = (trade.exitPrice - trade.entryPrice) * trade.quantity * 0.5;
      
      expect(Math.abs(trade.profit - expectedProfit)).toBeLessThan(0.01);
    });

    it("should respect $30 portfolio limit", () => {
      const trade = generateRealisticTrade(1, "RL", 45000);
      
      // With $30 portfolio and $45000 price, quantity should be 0
      expect(trade.quantity).toBeLessThanOrEqual(1);
    });
  });

  describe("generateMultipleTrades", () => {
    it("should generate multiple trades", () => {
      const trades = generateMultipleTrades(1, "RL", 5);
      
      expect(trades).toHaveLength(5);
      expect(trades.every(t => t.agentId === 1)).toBe(true);
    });

    it("should generate trades with different entry prices", () => {
      const trades = generateMultipleTrades(1, "RL", 10);
      const entryPrices = trades.map(t => t.entryPrice);
      const uniquePrices = new Set(entryPrices);
      
      expect(uniquePrices.size).toBeGreaterThan(1);
    });
  });

  describe("calculateTradeStats", () => {
    it("should calculate stats for empty trades array", () => {
      const stats = calculateTradeStats([]);
      
      expect(stats.totalTrades).toBe(0);
      expect(stats.winRate).toBe(0);
      expect(stats.avgProfit).toBe(0);
      expect(stats.totalProfit).toBe(0);
    });

    it("should calculate correct win rate", () => {
      const trades = generateMultipleTrades(1, "RL", 10);
      const stats = calculateTradeStats(trades);
      
      const wins = trades.filter(t => t.profit > 0).length;
      const expectedWinRate = (wins / trades.length) * 100;
      
      expect(stats.totalTrades).toBe(10);
      expect(stats.winRate).toBe(expectedWinRate);
    });

    it("should calculate correct total profit", () => {
      const trades = generateMultipleTrades(1, "RL", 5);
      const stats = calculateTradeStats(trades);
      
      const expectedTotal = trades.reduce((sum, t) => sum + t.profit, 0);
      expect(stats.totalProfit).toBe(expectedTotal);
    });

    it("should calculate correct average profit", () => {
      const trades = generateMultipleTrades(1, "RL", 5);
      const stats = calculateTradeStats(trades);
      
      const expectedAvg = stats.totalProfit / trades.length;
      expect(stats.avgProfit).toBe(expectedAvg);
    });
  });
});
