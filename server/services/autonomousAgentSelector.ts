/**
 * Autonomous Agent Selector Service
 * Automatically selects and routes trading to optimal agents based on market conditions
 */

import { AgentConfig, AgentExecution, TradingResult } from "../../drizzle/schema";

export interface AgentScore {
  agentId: number;
  agentType: string;
  score: number;
  winRate: number;
  profitability: number;
  recentPerformance: number;
  volatilityScore: number;
  recommendation: string;
}

export interface MarketCondition {
  trend: "uptrend" | "downtrend" | "ranging";
  volatility: "low" | "medium" | "high";
  momentum: "strong" | "moderate" | "weak";
  rsi: number; // 0-100
  macd: "bullish" | "bearish" | "neutral";
}

export class AutonomousAgentSelector {
  /**
   * Analyze market conditions based on recent price data
   */
  static analyzeMarketConditions(
    recentPrices: number[],
    recentRSI: number,
    recentMACD: string
  ): MarketCondition {
    if (recentPrices.length < 2) {
      return {
        trend: "ranging",
        volatility: "medium",
        momentum: "weak",
        rsi: 50,
        macd: "neutral",
      };
    }

    // Calculate trend
    const priceChange = recentPrices[recentPrices.length - 1] - recentPrices[0];
    const trend =
      priceChange > 0 ? "uptrend" : priceChange < 0 ? "downtrend" : "ranging";

    // Calculate volatility
    const mean = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const variance =
      recentPrices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) /
      recentPrices.length;
    const stdDev = Math.sqrt(variance);
    const volatilityPercent = (stdDev / mean) * 100;

    const volatility =
      volatilityPercent > 5 ? "high" : volatilityPercent > 2 ? "medium" : "low";

    // Calculate momentum
    const momentum =
      Math.abs(priceChange) > mean * 0.05
        ? "strong"
        : Math.abs(priceChange) > mean * 0.02
          ? "moderate"
          : "weak";

    return {
      trend,
      volatility,
      momentum,
      rsi: recentRSI,
      macd: recentMACD as "bullish" | "bearish" | "neutral",
    };
  }

  /**
   * Score agents based on performance and market fit
   */
  static scoreAgents(
    agents: AgentConfig[],
    executions: AgentExecution[],
    marketCondition: MarketCondition
  ): AgentScore[] {
    return agents.map((agent) => {
      const agentExecutions = executions.filter((e) => e.agentId === agent.id);

      // Calculate win rate
      const winningTrades = agentExecutions.reduce(
        (sum, e) => sum + (e.winningTrades || 0),
        0
      );
      const totalTrades = agentExecutions.reduce(
        (sum, e) => sum + (e.totalTrades || 0),
        0
      );
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      // Calculate profitability
      const totalProfit = agentExecutions.reduce((sum, e) => {
        const profit =
          typeof e.totalProfit === "number"
            ? e.totalProfit
            : parseFloat(e.totalProfit as string) || 0;
        return sum + profit;
      }, 0);
      const profitability = totalProfit > 0 ? Math.min(totalProfit * 10, 100) : 0;

      // Calculate recent performance (last 5 trades)
      const recentPerformance =
        agentExecutions.length > 0
          ? Math.min((winRate / 100) * agentExecutions.length * 10, 100)
          : 0;

      // Map agent type to market conditions
      let marketFitScore = 0;

      if (agent.agentType === "momentum") {
        // Momentum agents perform well in strong trends with high volatility
        if (marketCondition.trend !== "ranging" && marketCondition.momentum === "strong") {
          marketFitScore = 40;
        } else if (marketCondition.volatility === "high") {
          marketFitScore = 30;
        } else {
          marketFitScore = 10;
        }
      } else if (agent.agentType === "mean_reversion") {
        // Mean reversion agents perform well in ranging markets
        if (marketCondition.trend === "ranging" && marketCondition.volatility === "medium") {
          marketFitScore = 40;
        } else if (marketCondition.rsi > 70 || marketCondition.rsi < 30) {
          marketFitScore = 30;
        } else {
          marketFitScore = 10;
        }
      } else if (agent.agentType === "arbitrage") {
        // Arbitrage agents perform consistently across conditions
        marketFitScore = 25;
      } else if (agent.agentType === "deepseek" || agent.agentType === "qwen") {
        // LLM agents adapt to all conditions
        if (marketCondition.volatility === "high") {
          marketFitScore = 35;
        } else {
          marketFitScore = 20;
        }
      }

      // Calculate final score
      const score =
        winRate * 0.3 + profitability * 0.3 + recentPerformance * 0.2 + marketFitScore * 0.2;

      // Generate recommendation
      let recommendation = "";
      if (score > 75) {
        recommendation = "Highly Recommended - Excellent performance";
      } else if (score > 60) {
        recommendation = "Recommended - Good performance";
      } else if (score > 40) {
        recommendation = "Neutral - Average performance";
      } else {
        recommendation = "Use with caution - Below average performance";
      }

      return {
        agentId: agent.id,
        agentType: agent.agentType,
        score: Math.round(score),
        winRate: Math.round(winRate),
        profitability: Math.round(profitability),
        recentPerformance: Math.round(recentPerformance),
        volatilityScore: marketFitScore,
        recommendation,
      };
    });
  }

  /**
   * Select best agent for current market conditions
   */
  static selectBestAgent(scores: AgentScore[]): AgentScore | null {
    if (scores.length === 0) return null;
    return scores.reduce((best, current) =>
      current.score > best.score ? current : best
    );
  }

  /**
   * Select multiple agents for diversification
   */
  static selectDiversifiedAgents(scores: AgentScore[], count: number = 3): AgentScore[] {
    return scores.sort((a, b) => b.score - a.score).slice(0, count);
  }

  /**
   * Detect if agent switching is needed
   */
  static shouldSwitchAgent(
    currentAgent: AgentScore,
    topAgent: AgentScore,
    threshold: number = 20
  ): boolean {
    return topAgent.score - currentAgent.score > threshold;
  }

  /**
   * Calculate portfolio allocation across agents
   */
  static calculateAllocation(
    scores: AgentScore[],
    totalCapital: number
  ): Record<number, number> {
    const allocation: Record<number, number> = {};

    // Normalize scores
    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
    if (totalScore === 0) {
      // Equal allocation if all scores are 0
      const equalShare = totalCapital / scores.length;
      scores.forEach((s) => {
        allocation[s.agentId] = equalShare;
      });
    } else {
      // Proportional allocation based on scores
      scores.forEach((s) => {
        allocation[s.agentId] = (s.score / totalScore) * totalCapital;
      });
    }

    return allocation;
  }

  /**
   * Generate agent recommendations
   */
  static generateRecommendations(
    scores: AgentScore[],
    marketCondition: MarketCondition
  ): string[] {
    const recommendations: string[] = [];

    const topAgent = scores[0];
    if (topAgent) {
      recommendations.push(
        `Best Agent: ${topAgent.agentType} (Score: ${topAgent.score})`
      );
      recommendations.push(`Recommendation: ${topAgent.recommendation}`);
    }

    // Market-specific recommendations
    if (marketCondition.trend === "uptrend" && marketCondition.momentum === "strong") {
      recommendations.push("Market Condition: Strong Uptrend - Momentum agents recommended");
    } else if (marketCondition.trend === "downtrend") {
      recommendations.push(
        "Market Condition: Downtrend - Consider hedging or mean reversion"
      );
    } else if (marketCondition.trend === "ranging") {
      recommendations.push("Market Condition: Ranging - Mean reversion agents recommended");
    }

    if (marketCondition.volatility === "high") {
      recommendations.push("High Volatility: Increase risk management parameters");
    }

    return recommendations;
  }

  /**
   * Calculate agent health score
   */
  static calculateHealthScore(
    agentExecutions: AgentExecution[],
    recentTradesCount: number = 10
  ): number {
    if (agentExecutions.length === 0) return 50; // Default score

    const recentExecutions = agentExecutions.slice(-recentTradesCount);
    const successfulExecutions = recentExecutions.filter(
      (e) => e.status === "completed"
    ).length;
    const errorExecutions = recentExecutions.filter(
      (e) => e.status === "error"
    ).length;

    const successRate = (successfulExecutions / recentExecutions.length) * 100;
    const errorPenalty = errorExecutions * 10;

    return Math.max(0, Math.min(100, successRate - errorPenalty));
  }
}
