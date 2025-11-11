import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { agentConfigs, agentExecutions, tradingResults } from "../drizzle/schema";

export type AgentType = "RL" | "Momentum" | "MeanReversion" | "DeepSeek";
export type MarketCondition = "trending_up" | "trending_down" | "volatile" | "sideways";
export type RiskLevel = "low" | "medium" | "high";

interface AgentPerformance {
  agentId: number;
  agentName: string;
  agentType: AgentType;
  winRate: number;
  avgProfit: number;
  totalTrades: number;
  confidence: number;
  riskLevel: RiskLevel;
}

interface StrategyRecommendation {
  agentId: number;
  agentName: string;
  agentType: AgentType;
  strategy: string;
  confidence: number;
  reason: string;
  marketCondition: MarketCondition;
}

/**
 * Analyzes market conditions based on recent price data
 */
export function analyzeMarketCondition(
  prices: number[],
  volatility: number
): MarketCondition {
  if (prices.length < 2) return "sideways";

  const recentPrices = prices.slice(-20);
  const firstPrice = recentPrices[0];
  const lastPrice = recentPrices[recentPrices.length - 1];
  const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;

  // Determine trend
  const isUptrend = priceChange > 2;
  const isDowntrend = priceChange < -2;

  // Determine volatility level
  const isHighVolatility = volatility > 3;

  if (isHighVolatility) {
    return "volatile";
  } else if (isUptrend) {
    return "trending_up";
  } else if (isDowntrend) {
    return "trending_down";
  } else {
    return "sideways";
  }
}

/**
 * Calculates agent performance metrics
 */
export async function calculateAgentPerformance(
  agentId: number,
  userId: number
): Promise<AgentPerformance | null> {
  const db = await getDb();
  if (!db) return null;

  // Get agent config
  const agent = await db
    .select()
    .from(agentConfigs)
    .where(eq(agentConfigs.id, agentId))
    .limit(1);

  if (agent.length === 0) return null;

  // Get trading results for this agent
  const results = await db
    .select()
    .from(tradingResults)
    .where(eq(tradingResults.agentId, agentId));

  if (results.length === 0) {
    return {
      agentId,
      agentName: agent[0].agentName,
      agentType: agent[0].agentType as AgentType,
      winRate: 0,
      avgProfit: 0,
      totalTrades: 0,
      confidence: 0.5,
      riskLevel: "medium" as RiskLevel,
    };
  }

  // Calculate metrics - ensure all profits are numbers
  const profits: number[] = results.map((r) => {
    const p = r.profit;
    if (typeof p === 'number') return p;
    if (typeof p === 'string') return parseFloat(p) || 0;
    return 0;
  });

  const wins = profits.filter((p) => p > 0).length;
  const winRate = wins / profits.length;
  const avgProfit = profits.reduce((sum, p) => sum + p, 0) / profits.length;
  const totalTrades = profits.length;

  // Calculate confidence based on consistency
  const avgAbsProfit = profits.reduce((sum, p) => sum + Math.abs(p), 0) / profits.length;
  const variance =
    profits.reduce((sum, p) => sum + Math.pow(p - avgProfit, 2), 0) / profits.length;
  const stdDev = Math.sqrt(variance);
  const avgAbsProfitSafe = Math.max(0.01, avgAbsProfit);
  const confidence = Math.max(0, Math.min(1, winRate * (1 - stdDev / (avgAbsProfitSafe + 1))));

  return {
    agentId,
    agentName: agent[0].agentName,
    agentType: agent[0].agentType as AgentType,
    winRate,
    avgProfit,
    totalTrades,
    confidence,
    riskLevel: "medium" as RiskLevel,
  };
}

/**
 * Recommends the best agent for current market conditions
 */
export async function recommendAgent(
  marketCondition: MarketCondition,
  userAgents: number[],
  userId: number,
  riskPreference: RiskLevel = "medium"
): Promise<StrategyRecommendation | null> {
  const db = await getDb();
  if (!db) return null;

  // Get performance for all user agents
  const performances: AgentPerformance[] = [];
  for (const agentId of userAgents) {
    const perf = await calculateAgentPerformance(agentId, userId);
    if (perf) performances.push(perf);
  }

  if (performances.length === 0) return null;

  // Score agents based on market condition
  const scores = performances.map((perf) => {
    let score = perf.confidence * perf.winRate;

    // Adjust score based on market condition
    switch (marketCondition) {
      case "trending_up":
        // Momentum and RL agents perform well in uptrends
        if (perf.agentType === "Momentum") score *= 1.3;
        if (perf.agentType === "RL") score *= 1.2;
        break;

      case "trending_down":
        // Mean Reversion performs well in downtrends
        if (perf.agentType === "MeanReversion") score *= 1.3;
        if (perf.agentType === "DeepSeek") score *= 1.1;
        break;

      case "volatile":
        // DeepSeek LLM handles volatility well
        if (perf.agentType === "DeepSeek") score *= 1.4;
        if (perf.agentType === "RL") score *= 1.1;
        break;

      case "sideways":
        // Mean Reversion excels in sideways markets
        if (perf.agentType === "MeanReversion") score *= 1.4;
        if (perf.agentType === "Momentum") score *= 0.8;
        break;
    }

    // Adjust for risk preference
    const riskMultiplier =
      riskPreference === "low" && perf.riskLevel === "high"
        ? 0.7
        : riskPreference === "high" && perf.riskLevel === "low"
          ? 0.8
          : 1;
    score *= riskMultiplier;

    return { ...perf, score };
  });

  // Find best agent
  const bestAgent = scores.reduce((best, current) =>
    current.score > best.score ? current : best
  );

  // Determine strategy
  let strategy = "";
  let reason = "";

  switch (marketCondition) {
    case "trending_up":
      strategy = "Follow the trend with momentum indicators";
      reason = `${bestAgent.agentType} agent is optimal for uptrend conditions`;
      break;

    case "trending_down":
      strategy = "Use mean reversion to catch bounces";
      reason = `${bestAgent.agentType} agent excels in downtrend reversals`;
      break;

    case "volatile":
      strategy = "Use wider stops and smaller position sizes";
      reason = `${bestAgent.agentType} agent handles high volatility effectively`;
      break;

    case "sideways":
      strategy = "Trade range-bound price action";
      reason = `${bestAgent.agentType} agent thrives in sideways markets`;
      break;
  }

  return {
    agentId: bestAgent.agentId,
    agentName: bestAgent.agentName,
    agentType: bestAgent.agentType,
    strategy,
    confidence: bestAgent.score,
    reason,
    marketCondition,
  };
}

/**
 * Autonomously selects multiple agents for ensemble trading
 */
export async function selectEnsembleAgents(
  marketCondition: MarketCondition,
  userAgents: number[],
  userId: number,
  ensembleSize: number = 3
): Promise<StrategyRecommendation[]> {
  const db = await getDb();
  if (!db) return [];

  // Get performance for all user agents
  const performances: AgentPerformance[] = [];
  for (const agentId of userAgents) {
    const perf = await calculateAgentPerformance(agentId, userId);
    if (perf) performances.push(perf);
  }

  if (performances.length === 0) return [];

  // Score agents
  const scores = performances.map((perf) => {
    let score = perf.confidence * perf.winRate;

    switch (marketCondition) {
      case "trending_up":
        if (perf.agentType === "Momentum") score *= 1.3;
        if (perf.agentType === "RL") score *= 1.2;
        break;
      case "trending_down":
        if (perf.agentType === "MeanReversion") score *= 1.3;
        if (perf.agentType === "DeepSeek") score *= 1.1;
        break;
      case "volatile":
        if (perf.agentType === "DeepSeek") score *= 1.4;
        if (perf.agentType === "RL") score *= 1.1;
        break;
      case "sideways":
        if (perf.agentType === "MeanReversion") score *= 1.4;
        if (perf.agentType === "Momentum") score *= 0.8;
        break;
    }

    return { ...perf, score };
  });

  // Sort by score and take top N
  const topAgents = scores
    .sort((a, b) => b.score - a.score)
    .slice(0, ensembleSize);

  // Create recommendations for ensemble
  return topAgents.map((agent) => ({
    agentId: agent.agentId,
    agentName: agent.agentName,
    agentType: agent.agentType,
    strategy: `Ensemble member - ${agent.agentType}`,
    confidence: agent.score,
    reason: `Selected for ensemble trading with ${(agent.score * 100).toFixed(1)}% confidence`,
    marketCondition,
  }));
}
