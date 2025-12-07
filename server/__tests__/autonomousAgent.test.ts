import { describe, it, expect, beforeAll } from "vitest";
import { selectOptimalStrategy, generateTradingSignal, MarketData } from "../autonomousAgent";

describe("Autonomous Agent", () => {
  const mockMarketData: MarketData = {
    currentPrice: 45000,
    priceHistory: [44500, 44800, 45000, 45200, 45100, 45400],
    volatility: 2.5,
    riskPreference: "medium",
  };

  describe("selectOptimalStrategy", () => {
    it("should return a strategy recommendation", async () => {
      const result = await selectOptimalStrategy(mockMarketData);
      
      expect(result).toBeDefined();
      expect(result.strategy).toMatch(/RL|Momentum|MeanReversion|DeepSeek/);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.reasoning).toBeDefined();
      expect(result.parameters).toBeDefined();
    });

    it("should handle high volatility market", async () => {
      const highVolatilityData: MarketData = {
        ...mockMarketData,
        volatility: 8,
      };
      
      const result = await selectOptimalStrategy(highVolatilityData);
      expect(result.strategy).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should handle strong uptrend", async () => {
      const uptrendData: MarketData = {
        ...mockMarketData,
        priceHistory: [40000, 41000, 42000, 43000, 44000, 45000],
      };
      
      const result = await selectOptimalStrategy(uptrendData);
      expect(result.strategy).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should handle strong downtrend", async () => {
      const downtrendData: MarketData = {
        ...mockMarketData,
        priceHistory: [50000, 49000, 48000, 47000, 46000, 45000],
      };
      
      const result = await selectOptimalStrategy(downtrendData);
      expect(result.strategy).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should respect risk preference", async () => {
      const lowRiskData: MarketData = {
        ...mockMarketData,
        riskPreference: "low",
      };
      
      const result = await selectOptimalStrategy(lowRiskData);
      expect(result.parameters.stopLossPct).toBeLessThanOrEqual(3);
    });

    it("should include trading parameters", async () => {
      const result = await selectOptimalStrategy(mockMarketData);
      
      expect(result.parameters).toBeDefined();
      if (result.parameters.stopLossPct) {
        expect(result.parameters.stopLossPct).toBeGreaterThan(0);
      }
      if (result.parameters.takeProfitPct) {
        expect(result.parameters.takeProfitPct).toBeGreaterThan(0);
      }
    });
  });

  describe("generateTradingSignal", () => {
    it("should return a trading signal", async () => {
      const result = await generateTradingSignal(mockMarketData);
      
      expect(result).toBeDefined();
      expect(result.action).toMatch(/buy|sell|hold/);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.reasoning).toBeDefined();
    });

    it("should handle mean reversion scenario", async () => {
      const meanReversionData: MarketData = {
        ...mockMarketData,
        currentPrice: 50000,
        priceHistory: [45000, 45000, 45000, 45000, 45000, 45000],
      };
      
      const result = await generateTradingSignal(meanReversionData);
      expect(result.action).toMatch(/buy|sell|hold/);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should handle momentum scenario", async () => {
      const momentumData: MarketData = {
        ...mockMarketData,
        priceHistory: [40000, 41000, 42000, 43000, 44000, 45000],
      };
      
      const result = await generateTradingSignal(momentumData);
      expect(result.action).toMatch(/buy|sell|hold/);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should respect risk preference in signal", async () => {
      const highRiskData: MarketData = {
        ...mockMarketData,
        riskPreference: "high",
      };
      
      const result = await generateTradingSignal(highRiskData);
      expect(result.action).toMatch(/buy|sell|hold/);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should handle low volatility market", async () => {
      const lowVolatilityData: MarketData = {
        ...mockMarketData,
        volatility: 0.5,
      };
      
      const result = await generateTradingSignal(lowVolatilityData);
      expect(result.action).toMatch(/buy|sell|hold/);
    });

    it("should handle high volatility market", async () => {
      const highVolatilityData: MarketData = {
        ...mockMarketData,
        volatility: 10,
      };
      
      const result = await generateTradingSignal(highVolatilityData);
      expect(result.action).toMatch(/buy|sell|hold/);
    });
  });

  describe("Market Data Validation", () => {
    it("should handle minimal price history", async () => {
      const minimalData: MarketData = {
        currentPrice: 45000,
        priceHistory: [45000],
        volatility: 2.5,
        riskPreference: "medium",
      };
      
      const result = await selectOptimalStrategy(minimalData);
      expect(result.strategy).toBeDefined();
    });

    it("should handle extreme prices", async () => {
      const extremeData: MarketData = {
        currentPrice: 100000,
        priceHistory: [50000, 75000, 100000],
        volatility: 15,
        riskPreference: "high",
      };
      
      const result = await selectOptimalStrategy(extremeData);
      expect(result.strategy).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should handle zero volatility", async () => {
      const zeroVolData: MarketData = {
        ...mockMarketData,
        volatility: 0,
      };
      
      const result = await selectOptimalStrategy(zeroVolData);
      expect(result.strategy).toBeDefined();
    });
  });
});
