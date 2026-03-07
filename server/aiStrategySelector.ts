import { analyzeMarketTrend, getMarketData } from "./binanceApi";

export type AgentType = "RL" | "Momentum" | "MeanReversion" | "DeepSeek";

export interface StrategyRecommendation {
  strategy: AgentType;
  confidence: number;
  reason: string;
  marketCondition: string;
}

/**
 * Automatically select the best strategy based on market conditions
 */
export async function selectOptimalStrategy(symbol: string = "BTCUSDT"): Promise<StrategyRecommendation> {
  try {
    const [marketData, trendAnalysis] = await Promise.all([
      getMarketData(symbol),
      analyzeMarketTrend(symbol),
    ]);

    const volatility = marketData.volatility;
    const change24h = marketData.change24h;
    const trend = trendAnalysis.trend;
    const strength = trendAnalysis.strength;

    // Decision logic based on market conditions
    let strategy: AgentType;
    let confidence: number;
    let reason: string;
    let marketCondition: string;

    // High volatility environment
    if (volatility > 5) {
      if (trend === "uptrend" && strength > 50) {
        strategy = "Momentum";
        confidence = Math.min(95, 50 + strength);
        reason = "Strong uptrend with high volatility - Momentum strategy optimal";
        marketCondition = "Strong Uptrend";
      } else if (trend === "downtrend" && strength > 50) {
        strategy = "MeanReversion";
        confidence = Math.min(95, 50 + strength);
        reason = "Strong downtrend - Mean Reversion for bounce trades";
        marketCondition = "Strong Downtrend";
      } else {
        strategy = "RL";
        confidence = 70;
        reason = "High volatility with mixed signals - RL for adaptive learning";
        marketCondition = "High Volatility Mixed";
      }
    }
    // Low volatility environment
    else if (volatility < 1.5) {
      strategy = "DeepSeek";
      confidence = 75;
      reason = "Low volatility - DeepSeek LLM for pattern recognition";
      marketCondition = "Low Volatility Consolidation";
    }
    // Normal volatility
    else {
      if (trend === "uptrend") {
        strategy = "Momentum";
        confidence = 65 + strength / 2;
        reason = "Uptrend detected - Momentum strategy for trend following";
        marketCondition = "Moderate Uptrend";
      } else if (trend === "downtrend") {
        strategy = "MeanReversion";
        confidence = 65 + strength / 2;
        reason = "Downtrend detected - Mean Reversion for counter-trend trades";
        marketCondition = "Moderate Downtrend";
      } else {
        strategy = "RL";
        confidence = 60;
        reason = "Sideways market - RL for optimal decision making";
        marketCondition = "Sideways Consolidation";
      }
    }

    // Adjust confidence based on recent price action
    if (Math.abs(change24h) > 10) {
      confidence = Math.min(99, confidence + 10);
    } else if (Math.abs(change24h) < 0.5) {
      confidence = Math.max(50, confidence - 10);
    }

    return {
      strategy,
      confidence: Math.min(99, Math.max(50, confidence)),
      reason,
      marketCondition,
    };
  } catch (error) {
    console.error("Error selecting optimal strategy:", error);
    // Default to RL if analysis fails
    return {
      strategy: "RL",
      confidence: 50,
      reason: "Market analysis unavailable - defaulting to RL",
      marketCondition: "Unknown",
    };
  }
}

/**
 * Get all recommended strategies ranked by confidence
 */
export async function getAllStrategyRecommendations(
  symbol: string = "BTCUSDT"
): Promise<StrategyRecommendation[]> {
  const optimal = await selectOptimalStrategy(symbol);

  const strategies: StrategyRecommendation[] = [optimal];

  // Add alternative strategies with lower confidence
  const allStrategies: AgentType[] = ["RL", "Momentum", "MeanReversion", "DeepSeek"];
  const alternatives = allStrategies.filter(s => s !== optimal.strategy);

  for (const alt of alternatives) {
    strategies.push({
      strategy: alt,
      confidence: Math.max(30, optimal.confidence - 20),
      reason: `Alternative strategy - ${alt}`,
      marketCondition: optimal.marketCondition,
    });
  }

  return strategies.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Validate if a strategy is suitable for current market conditions
 */
export async function isStrategySuitable(
  strategy: AgentType,
  symbol: string = "BTCUSDT"
): Promise<boolean> {
  const recommendations = await getAllStrategyRecommendations(symbol);
  const recommendation = recommendations.find(r => r.strategy === strategy);
  return recommendation ? recommendation.confidence > 55 : false;
}
