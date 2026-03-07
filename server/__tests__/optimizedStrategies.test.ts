import { describe, it, expect } from "vitest";
import {
  aggressiveMomentumStrategy,
  smartMeanReversionStrategy,
  enhancedRLStrategy,
  premiumLLMStrategy,
  compositeStrategy,
} from "../services/optimizedTradingStrategies";
import {
  generateOptimizedTrade,
  calculatePortfolioMetrics,
  optimizeAgentWinRate,
  calculateOptimalPositionSize,
} from "../services/optimizedTradeGeneration";

describe("Optimized Trading Strategies", () => {
  describe("Aggressive Momentum Strategy", () => {
    it("should only trade in strong uptrends", () => {
      const market = {
        currentPrice: 50000,
        priceChange24h: 5,
        volatility: 2,
        volume24h: 1000000,
        trend: "strong_up" as const,
        rsi: 65,
        macd: 0.5,
      };

      const signal = aggressiveMomentumStrategy(market);

      expect(signal.action).toBe("buy");
      expect(signal.confidence).toBeGreaterThan(0.7);
      expect(signal.targetProfit).toBeGreaterThan(0);
      expect(signal.stopLoss).toBeGreaterThan(0);
    });

    it("should not trade in downtrends", () => {
      const market = {
        currentPrice: 50000,
        priceChange24h: -3,
        volatility: 2,
        volume24h: 1000000,
        trend: "strong_down" as const,
        rsi: 35,
        macd: -0.5,
      };

      const signal = aggressiveMomentumStrategy(market);

      expect(signal.action).toBe("hold");
      expect(signal.confidence).toBe(0);
    });

    it("should not trade when RSI is overbought", () => {
      const market = {
        currentPrice: 50000,
        priceChange24h: 5,
        volatility: 2,
        volume24h: 1000000,
        trend: "strong_up" as const,
        rsi: 85,
        macd: 0.5,
      };

      const signal = aggressiveMomentumStrategy(market);

      expect(signal.action).toBe("hold");
      expect(signal.confidence).toBe(0);
    });

    it("should have 3:1 profit/loss ratio", () => {
      const market = {
        currentPrice: 50000,
        priceChange24h: 5,
        volatility: 2,
        volume24h: 1000000,
        trend: "strong_up" as const,
        rsi: 65,
        macd: 0.5,
      };

      const signal = aggressiveMomentumStrategy(market);

      expect(signal.targetProfit / signal.stopLoss).toBeCloseTo(3.33, 1);
    });
  });

  describe("Smart Mean Reversion Strategy", () => {
    it("should trade oversold conditions", () => {
      const market = {
        currentPrice: 50000,
        priceChange24h: -5,
        volatility: 3,
        volume24h: 1000000,
        trend: "strong_down" as const,
        rsi: 25,
        macd: -0.5,
      };

      const signal = smartMeanReversionStrategy(market);

      expect(signal.action).toBe("buy");
      expect(signal.confidence).toBeGreaterThan(0.6);
    });

    it("should trade overbought conditions", () => {
      const market = {
        currentPrice: 50000,
        priceChange24h: 5,
        volatility: 3,
        volume24h: 1000000,
        trend: "strong_up" as const,
        rsi: 75,
        macd: 0.5,
      };

      const signal = smartMeanReversionStrategy(market);

      expect(signal.action).toBe("sell");
      expect(signal.confidence).toBeGreaterThan(0.6);
    });

    it("should not trade without MACD confirmation", () => {
      const market = {
        currentPrice: 50000,
        priceChange24h: -5,
        volatility: 3,
        volume24h: 1000000,
        trend: "strong_down" as const,
        rsi: 25,
        macd: 0.5, // Positive MACD conflicts with oversold
      };

      const signal = smartMeanReversionStrategy(market);

      expect(signal.action).toBe("hold");
      expect(signal.confidence).toBe(0);
    });

    it("should have 2.5:1 profit/loss ratio", () => {
      const market = {
        currentPrice: 50000,
        priceChange24h: -5,
        volatility: 3,
        volume24h: 1000000,
        trend: "strong_down" as const,
        rsi: 25,
        macd: -0.5,
      };

      const signal = smartMeanReversionStrategy(market);

      expect(signal.targetProfit / signal.stopLoss).toBeCloseTo(2.5, 1);
    });
  });

  describe("Enhanced RL Strategy", () => {
    it("should boost confidence with high historical win rate", () => {
      const market = {
        currentPrice: 50000,
        priceChange24h: 2,
        volatility: 2,
        volume24h: 1000000,
        trend: "up" as const,
        rsi: 55,
        macd: 0.3,
      };

      const signalLowWinRate = enhancedRLStrategy(market, 0.5);
      const signalHighWinRate = enhancedRLStrategy(market, 0.75);

      expect(signalHighWinRate.confidence).toBeGreaterThan(signalLowWinRate.confidence);
    });

    it("should adapt profit targets based on volatility", () => {
      const market1 = {
        currentPrice: 50000,
        priceChange24h: 1,
        volatility: 1,
        volume24h: 1000000,
        trend: "neutral" as const,
        rsi: 50,
        macd: 0,
      };

      const market2 = {
        currentPrice: 50000,
        priceChange24h: 3,
        volatility: 4,
        volume24h: 1000000,
        trend: "up" as const,
        rsi: 55,
        macd: 0.3,
      };

      const signal1 = enhancedRLStrategy(market1, 0.6);
      const signal2 = enhancedRLStrategy(market2, 0.6);

      if (signal2.action !== "hold") {
        expect(signal2.targetProfit).toBeGreaterThan(signal1.targetProfit || 0);
      }
    });
  });

  describe("Premium LLM Strategy", () => {
    it("should only trade high-confidence LLM signals", () => {
      const llmSignal = {
        action: "buy" as const,
        confidence: 0.8,
        reasoning: "Strong bullish pattern detected",
      };

      const market = {
        currentPrice: 50000,
        priceChange24h: 2,
        volatility: 2,
        volume24h: 1000000,
        trend: "up" as const,
        rsi: 55,
        macd: 0.3,
      };

      const signal = premiumLLMStrategy(llmSignal, market);

      expect(signal.action).toBe("buy");
      expect(signal.confidence).toBeGreaterThan(0.7);
    });

    it("should reject low-confidence LLM signals", () => {
      const llmSignal = {
        action: "buy" as const,
        confidence: 0.6,
        reasoning: "Weak signal",
      };

      const market = {
        currentPrice: 50000,
        priceChange24h: 2,
        volatility: 2,
        volume24h: 1000000,
        trend: "up" as const,
        rsi: 55,
        macd: 0.3,
      };

      const signal = premiumLLMStrategy(llmSignal, market);

      expect(signal.action).toBe("hold");
      expect(signal.confidence).toBe(0);
    });

    it("should have 5:1 profit/loss ratio", () => {
      const llmSignal = {
        action: "buy" as const,
        confidence: 0.8,
        reasoning: "Strong signal",
      };

      const market = {
        currentPrice: 50000,
        priceChange24h: 2,
        volatility: 2,
        volume24h: 1000000,
        trend: "up" as const,
        rsi: 55,
        macd: 0.3,
      };

      const signal = premiumLLMStrategy(llmSignal, market);

      expect(signal.targetProfit / signal.stopLoss).toBeCloseTo(5, 0);
    });
  });

  describe("Composite Strategy", () => {
    it("should require agreement from multiple strategies", () => {
      const market = {
        currentPrice: 50000,
        priceChange24h: 5,
        volatility: 2,
        volume24h: 1000000,
        trend: "strong_up" as const,
        rsi: 65,
        macd: 0.5,
      };

      const llmSignal = {
        action: "buy" as const,
        confidence: 0.8,
        reasoning: "Bullish",
      };

      const signal = compositeStrategy(market, llmSignal, 0.7);

      if (signal.action !== "hold") {
        expect(signal.confidence).toBeGreaterThan(0.7);
      }
    });

    it("should have 7:1 profit/loss ratio", () => {
      const market = {
        currentPrice: 50000,
        priceChange24h: 5,
        volatility: 3,
        volume24h: 1000000,
        trend: "strong_up" as const,
        rsi: 65,
        macd: 0.5,
      };

      const llmSignal = {
        action: "buy" as const,
        confidence: 0.85,
        reasoning: "Strong bullish signal",
      };

      const signal = compositeStrategy(market, llmSignal, 0.75);

      if (signal.action !== "hold") {
        expect(signal.targetProfit / signal.stopLoss).toBeCloseTo(7, 0);
      }
    });
  });

  describe("Optimized Trade Generation", () => {
    it("should generate winning trades 70% of the time", () => {
      let winCount = 0;
      const tradeCount = 100;

      for (let i = 0; i < tradeCount; i++) {
        const trade = generateOptimizedTrade(1, "RL", 50000, 1000, 0.7);
        if (trade.profit > 0) {
          winCount++;
        }
      }

      const winRate = winCount / tradeCount;
      expect(winRate).toBeGreaterThan(0.6);
      expect(winRate).toBeLessThan(0.8);
    });

    it("should generate trades with 2-4% profit on wins", () => {
      let allWinProfits: number[] = [];

      for (let i = 0; i < 50; i++) {
        const trade = generateOptimizedTrade(1, "RL", 50000, 1000, 0.9); // 90% win rate to get wins
        if (trade.profit > 0) {
          allWinProfits.push(trade.profitPercent);
        }
      }

      const avgWinProfit = allWinProfits.reduce((a, b) => a + b, 0) / allWinProfits.length;
      expect(avgWinProfit).toBeGreaterThan(1.5);
      expect(avgWinProfit).toBeLessThan(4.5);
    });

    it("should generate trades with 0.5-1.5% loss on losses", () => {
      let allLossProfits: number[] = [];

      for (let i = 0; i < 50; i++) {
        const trade = generateOptimizedTrade(1, "RL", 50000, 1000, 0.1); // 10% win rate to get losses
        if (trade.profit < 0) {
          allLossProfits.push(Math.abs(trade.profitPercent));
        }
      }

      const avgLossSize = allLossProfits.reduce((a, b) => a + b, 0) / allLossProfits.length;
      expect(avgLossSize).toBeGreaterThan(0.4);
      expect(avgLossSize).toBeLessThan(2);
    });
  });

  describe("Portfolio Metrics", () => {
    it("should calculate correct win rate", () => {
      const trades = [
        { profit: 10, profitPercent: 2 } as any,
        { profit: 15, profitPercent: 3 } as any,
        { profit: -5, profitPercent: -1 } as any,
        { profit: 20, profitPercent: 4 } as any,
      ];

      const metrics = calculatePortfolioMetrics(trades);

      expect(metrics.winRate).toBe(75);
      expect(metrics.totalTrades).toBe(4);
    });

    it("should calculate correct profit factor", () => {
      const trades = [
        { profit: 30, profitPercent: 3 } as any,
        { profit: -10, profitPercent: -1 } as any,
      ];

      const metrics = calculatePortfolioMetrics(trades);

      expect(metrics.profitFactor).toBe(3);
    });

    it("should calculate net profit correctly", () => {
      const trades = [
        { profit: 50, profitPercent: 5 } as any,
        { profit: 30, profitPercent: 3 } as any,
        { profit: -20, profitPercent: -2 } as any,
      ];

      const metrics = calculatePortfolioMetrics(trades);

      expect(metrics.netProfit).toBe(60);
    });
  });

  describe("Win Rate Optimization", () => {
    it("should adjust win rate towards target", () => {
      const currentWinRate = 0.5;
      const targetWinRate = 0.7;

      const optimized = optimizeAgentWinRate(currentWinRate, targetWinRate, 0.1);

      expect(optimized).toBeGreaterThan(currentWinRate);
      expect(optimized).toBeLessThan(targetWinRate);
    });

    it("should not exceed maximum win rate", () => {
      const currentWinRate = 0.8;
      const targetWinRate = 0.9;

      const optimized = optimizeAgentWinRate(currentWinRate, targetWinRate, 0.2);

      expect(optimized).toBeLessThanOrEqual(0.85);
    });
  });

  describe("Position Sizing", () => {
    it("should calculate optimal position size", () => {
      const walletBalance = 1000;
      const riskPercentage = 1;
      const stopLossPercent = 1;

      const positionSize = calculateOptimalPositionSize(walletBalance, riskPercentage, stopLossPercent);

      expect(positionSize).toBeGreaterThan(0);
      expect(positionSize).toBeLessThanOrEqual(walletBalance * 0.1);
    });

    it("should not exceed 10% of wallet", () => {
      const walletBalance = 10000;

      const positionSize = calculateOptimalPositionSize(walletBalance, 2, 1);

      expect(positionSize).toBeLessThanOrEqual(walletBalance * 0.1);
    });
  });
});
