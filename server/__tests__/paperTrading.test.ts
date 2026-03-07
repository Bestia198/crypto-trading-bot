import { describe, it, expect, beforeEach } from "vitest";
import { PaperTradingEngine } from "../services/paperTradingEngine";

describe("Paper Trading Engine", () => {
  let engine: PaperTradingEngine;

  beforeEach(() => {
    engine = new PaperTradingEngine({
      sessionName: "Test Session",
      initialCapital: 10000,
      durationDays: 7,
      symbols: ["BTC/USDT", "ETH/USDT"],
    });
  });

  describe("Session Management", () => {
    it("should create a new paper trading session", () => {
      expect(engine).toBeDefined();
      const info = engine.getSessionInfo();
      expect(info.sessionId).toBeDefined();
      expect(info.isActive).toBe(true);
    });

    it("should track session duration", () => {
      const info = engine.getSessionInfo();
      expect(info.startDate).toBeDefined();
      expect(info.endDate).toBeDefined();
      expect(info.daysRemaining).toBeGreaterThan(0);
    });

    it("should initialize with correct capital", () => {
      const metrics = engine.getMetrics();
      expect(metrics.currentBalance).toBe(10000);
      expect(metrics.totalProfit).toBe(0);
    });
  });

  describe("Trade Execution", () => {
    it("should execute a BUY trade", () => {
      const trade = engine.executeTrade("BTC/USDT", "buy", 0.05, 50000, 0.8);

      expect(trade).toBeDefined();
      expect(trade?.symbol).toBe("BTC/USDT");
      expect(trade?.tradeType).toBe("buy");
      expect(trade?.quantity).toBe(0.05);
      expect(trade?.entryPrice).toBe(50000);
      expect(trade?.status).toBe("open");
    });

    it("should reject trade with insufficient balance", () => {
      const trade = engine.executeTrade("BTC/USDT", "buy", 1, 50000, 0.8);
      expect(trade).toBeNull();
    });

    it("should execute a SELL trade", () => {
      engine.executeTrade("ETH/USDT", "buy", 1, 3000, 0.8);
      const sellTrade = engine.executeTrade("ETH/USDT", "sell", 0.5, 3100, 0.8);

      expect(sellTrade).toBeDefined();
      expect(sellTrade?.tradeType).toBe("sell");
      expect(sellTrade?.quantity).toBe(0.5);
    });

    it("should update balance after trade", () => {
      const initialBalance = engine.getMetrics().currentBalance;

      engine.executeTrade("BTC/USDT", "buy", 0.05, 50000, 0.8);

      const newBalance = engine.getMetrics().currentBalance;
      expect(newBalance).toBeLessThan(initialBalance);
      expect(newBalance).toBe(initialBalance - 0.05 * 50000);
    });
  });

  describe("Trade Closing", () => {
    it("should close an open trade with profit", () => {
      const trade = engine.executeTrade("BTC/USDT", "buy", 0.05, 50000, 0.8);
      expect(trade).toBeDefined();

      const closedTrade = engine.closeTrade(trade!.id, 55000);

      expect(closedTrade).toBeDefined();
      expect(closedTrade?.status).toBe("closed");
      expect(closedTrade?.exitPrice).toBe(55000);
      expect(closedTrade?.profit).toBe(0.05 * (55000 - 50000));
      expect(closedTrade?.profitPercent).toBe(10);
    });

    it("should close an open trade with loss", () => {
      const trade = engine.executeTrade("BTC/USDT", "buy", 0.05, 50000, 0.8);

      const closedTrade = engine.closeTrade(trade!.id, 45000);

      expect(closedTrade?.profit).toBe(0.05 * (45000 - 50000));
      expect(closedTrade?.profitPercent).toBe(-10);
    });

    it("should update balance when closing trade", () => {
      const trade = engine.executeTrade("BTC/USDT", "buy", 0.05, 50000, 0.8);
      const balanceAfterBuy = engine.getMetrics().currentBalance;

      engine.closeTrade(trade!.id, 55000);

      const balanceAfterSell = engine.getMetrics().currentBalance;
      expect(balanceAfterSell).toBeGreaterThan(balanceAfterBuy);
    });
  });

  describe("Portfolio Management", () => {
    it("should track portfolio positions", () => {
      engine.executeTrade("BTC/USDT", "buy", 0.05, 50000, 0.8);
      engine.executeTrade("ETH/USDT", "buy", 1, 3000, 0.8);

      const portfolio = engine.getPortfolio();

      expect(portfolio.get("BTC/USDT")).toBe(0.05);
      expect(portfolio.get("ETH/USDT")).toBe(1);
    });

    it("should calculate portfolio value", () => {
      engine.executeTrade("BTC/USDT", "buy", 0.05, 50000, 0.8);

      const prices = new Map<string, number>();
      prices.set("BTC/USDT", 50000);

      const value = engine.getPortfolioValue(prices);
      expect(value).toBeGreaterThan(0);
    });

    it("should handle multiple positions in same symbol", () => {
      engine.executeTrade("BTC/USDT", "buy", 0.05, 50000, 0.8);
      engine.executeTrade("BTC/USDT", "buy", 0.05, 51000, 0.8);

      const portfolio = engine.getPortfolio();
      expect(portfolio.get("BTC/USDT")).toBe(0.1);
    });
  });

  describe("Performance Metrics", () => {
    it("should calculate win rate", () => {
      const trade1 = engine.executeTrade("BTC/USDT", "buy", 0.05, 50000, 0.8);
      engine.closeTrade(trade1!.id, 55000);

      const trade2 = engine.executeTrade("ETH/USDT", "buy", 0.5, 3000, 0.8);
      engine.closeTrade(trade2!.id, 2900);

      const metrics = engine.getMetrics();
      expect(metrics.winRate).toBe(50);
    });

    it("should calculate total profit", () => {
      const trade1 = engine.executeTrade("BTC/USDT", "buy", 0.05, 50000, 0.8);
      engine.closeTrade(trade1!.id, 55000);

      const trade2 = engine.executeTrade("ETH/USDT", "buy", 0.5, 3000, 0.8);
      engine.closeTrade(trade2!.id, 3100);

      const metrics = engine.getMetrics();
      expect(metrics.totalProfit).toBeGreaterThan(0);
    });

    it("should track number of trades", () => {
      engine.executeTrade("BTC/USDT", "buy", 0.05, 50000, 0.8);
      engine.executeTrade("ETH/USDT", "buy", 1, 3000, 0.8);

      const metrics = engine.getMetrics();
      expect(metrics.totalTrades).toBe(2);
    });
  });

  describe("Trade History", () => {
    it("should maintain trade history", () => {
      engine.executeTrade("BTC/USDT", "buy", 0.05, 50000, 0.8);
      engine.executeTrade("ETH/USDT", "buy", 1, 3000, 0.8);

      const trades = engine.getTrades();

      expect(trades.length).toBe(2);
      expect(trades[0].symbol).toBe("BTC/USDT");
      expect(trades[1].symbol).toBe("ETH/USDT");
    });

    it("should track open and closed trades separately", () => {
      const trade1 = engine.executeTrade("BTC/USDT", "buy", 0.05, 50000, 0.8);
      const trade2 = engine.executeTrade("ETH/USDT", "buy", 1, 3000, 0.8);

      engine.closeTrade(trade1!.id, 55000);

      const trades = engine.getTrades();
      const openTrades = trades.filter((t) => t.status === "open");
      const closedTrades = trades.filter((t) => t.status === "closed");

      expect(openTrades.length).toBe(1);
      expect(closedTrades.length).toBe(1);
    });
  });
});
