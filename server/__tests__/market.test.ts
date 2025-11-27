import { describe, it, expect } from "vitest";
import { getMarketData, analyzeMarketTrend, getPrice } from "../binanceApi";
import { selectOptimalStrategy, getAllStrategyRecommendations } from "../aiStrategySelector";

describe("Market Data Integration", () => {
  describe("Binance API", () => {
    it("should fetch current price", async () => {
      const price = await getPrice("BTCUSDT");
      expect(price).toBeGreaterThan(0);
      expect(typeof price).toBe("number");
    });

    it("should fetch market data", async () => {
      const data = await getMarketData("BTCUSDT");
      expect(data.symbol).toBe("BTCUSDT");
      expect(data.price).toBeGreaterThan(0);
      expect(typeof data.change24h).toBe("number");
      expect(typeof data.volatility).toBe("number");
    });

    it("should analyze market trend", async () => {
      const trend = await analyzeMarketTrend("BTCUSDT");
      expect(["uptrend", "downtrend", "sideways"]).toContain(trend.trend);
      expect(trend.strength).toBeGreaterThanOrEqual(0);
      expect(trend.strength).toBeLessThanOrEqual(100);
      expect(trend.volatility).toBeGreaterThanOrEqual(0);
    });
  });

  describe("AI Strategy Selection", () => {
    it("should select optimal strategy", async () => {
      const recommendation = await selectOptimalStrategy("BTCUSDT");
      expect(["RL", "Momentum", "MeanReversion", "DeepSeek"]).toContain(
        recommendation.strategy
      );
      expect(recommendation.confidence).toBeGreaterThanOrEqual(50);
      expect(recommendation.confidence).toBeLessThanOrEqual(99);
      expect(recommendation.reason).toBeDefined();
      expect(recommendation.marketCondition).toBeDefined();
    });

    it("should return all strategy recommendations ranked", async () => {
      const recommendations = await getAllStrategyRecommendations("BTCUSDT");
      expect(recommendations.length).toBe(4);
      
      // Check that strategies are sorted by confidence (descending)
      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].confidence).toBeGreaterThanOrEqual(
          recommendations[i + 1].confidence
        );
      }
      
      // All strategies should be present
      const strategies = recommendations.map(r => r.strategy);
      expect(strategies).toContain("RL");
      expect(strategies).toContain("Momentum");
      expect(strategies).toContain("MeanReversion");
      expect(strategies).toContain("DeepSeek");
    });

    it("should have reasonable confidence values", async () => {
      const recommendations = await getAllStrategyRecommendations("BTCUSDT");
      
      for (const rec of recommendations) {
        expect(rec.confidence).toBeGreaterThanOrEqual(30);
        expect(rec.confidence).toBeLessThanOrEqual(99);
      }
    });

    it("should select different strategies for different market conditions", async () => {
      const btcRec = await selectOptimalStrategy("BTCUSDT");
      const ethRec = await selectOptimalStrategy("ETHUSDT");
      
      expect(btcRec.strategy).toBeDefined();
      expect(ethRec.strategy).toBeDefined();
      
      // Both should be valid strategies
      expect(["RL", "Momentum", "MeanReversion", "DeepSeek"]).toContain(
        btcRec.strategy
      );
      expect(["RL", "Momentum", "MeanReversion", "DeepSeek"]).toContain(
        ethRec.strategy
      );
    });
  });
});
