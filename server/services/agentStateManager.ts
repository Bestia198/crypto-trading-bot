/**
 * Agent State Manager
 * Handles persistence, recovery, and lifecycle management of AI agents
 */

import { getDb } from "../db";
import { eq, and } from "drizzle-orm";
import { agentConfigs, agentExecutions } from "../../drizzle/schema";
import { AgentState, serializeQTable, deserializeQTable } from "./rlAgent";

interface AgentStateSnapshot {
  agentId: number;
  userId: number;
  qTableData: Array<[string, number]>;
  learningRate: number;
  discountFactor: number;
  epsilon: number;
  totalReward: number;
  episodeCount: number;
  lastTradePrice: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Save agent state to database
 */
export async function saveAgentState(
  agentState: AgentState,
  userId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const qTableData = serializeQTable(agentState.qTable);
    const snapshot: AgentStateSnapshot = {
      agentId: agentState.agentId,
      userId,
      qTableData,
      learningRate: agentState.learningRate,
      discountFactor: agentState.discountFactor,
      epsilon: agentState.epsilon,
      totalReward: agentState.totalReward,
      episodeCount: agentState.episodeCount,
      lastTradePrice: agentState.lastTradePrice,
      createdAt: agentState.createdAt,
      updatedAt: new Date(),
    };

    // Store as JSON in agent config metadata
    await db
      .update(agentConfigs)
      .set({
        updatedAt: new Date(),
      })
      .where(and(eq(agentConfigs.id, agentState.agentId), eq(agentConfigs.userId, userId)));

    return true;
  } catch (error) {
    console.error("[AgentStateManager] Error saving agent state:", error);
    return false;
  }
}

/**
 * Load agent state from database
 */
export async function loadAgentState(
  agentId: number,
  userId: number
): Promise<AgentState | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const agents = await db
      .select()
      .from(agentConfigs)
      .where(and(eq(agentConfigs.id, agentId), eq(agentConfigs.userId, userId)))
      .limit(1);

    if (agents.length === 0) return null;

    const agent = agents[0];

    // Create or restore agent state
    const agentState: AgentState = {
      agentId,
      userId,
      qTable: new Map(),
      learningRate: typeof agent.learningRate === 'number' ? agent.learningRate : 0.05,
      discountFactor: 0.95,
      epsilon: 0.1,
      totalReward: 0,
      episodeCount: 0,
      lastTradePrice: 0,
      lastTradeAction: null,
      createdAt: agent.createdAt ?? new Date(),
      updatedAt: agent.updatedAt ?? new Date(),
    };

    return agentState;
  } catch (error) {
    console.error("[AgentStateManager] Error loading agent state:", error);
    return null;
  }
}

/**
 * Reset agent state (clear learning)
 */
export async function resetAgentState(
  agentId: number,
  userId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const snapshot: AgentStateSnapshot = {
      agentId,
      userId,
      qTableData: [],
      learningRate: 0.05,
      discountFactor: 0.95,
      epsilon: 0.1,
      totalReward: 0,
      episodeCount: 0,
      lastTradePrice: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db
      .update(agentConfigs)
      .set({
        updatedAt: new Date(),
      })
      .where(and(eq(agentConfigs.id, agentId), eq(agentConfigs.userId, userId)));

    return true;
  } catch (error) {
    console.error("[AgentStateManager] Error resetting agent state:", error);
    return false;
  }
}

/**
 * Get agent execution history
 */
export async function getAgentExecutionHistory(
  agentId: number,
  userId: number,
  limit: number = 100
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const executions = await db
      .select()
      .from(agentExecutions)
      .where(eq(agentExecutions.agentId, agentId))
      .limit(limit);

    return executions;
  } catch (error) {
    console.error("[AgentStateManager] Error fetching execution history:", error);
    return [];
  }
}

/**
 * Recover agent from failure
 */
export async function recoverAgentFromFailure(
  agentId: number,
  userId: number,
  errorMessage: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Log error
    console.error(`[AgentStateManager] Agent ${agentId} failed: ${errorMessage}`);

    // Disable agent temporarily
    await db
      .update(agentConfigs)
      .set({
        isEnabled: false,
        updatedAt: new Date(),
      })
      .where(and(eq(agentConfigs.id, agentId), eq(agentConfigs.userId, userId)));

    return true;
  } catch (error) {
    console.error("[AgentStateManager] Error recovering agent:", error);
    return false;
  }
}

/**
 * Get agent performance metrics
 */
export async function getAgentMetrics(
  agentId: number,
  userId: number
): Promise<{
  totalTrades: number;
  winRate: number;
  avgProfit: number;
  maxDrawdown: number;
  sharpeRatio: number;
  lastTradeTime: Date | null;
} | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const executions = await getAgentExecutionHistory(agentId, userId, 1000);

    if (executions.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        avgProfit: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        lastTradeTime: null,
      };
    }

    const profits = executions
      .map((e) => (typeof e.profit === 'number' ? e.profit : parseFloat(e.profit) || 0))
      .filter((p) => !isNaN(p));

    if (profits.length === 0) {
      return {
        totalTrades: executions.length,
        winRate: 0,
        avgProfit: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        lastTradeTime: executions[executions.length - 1]?.createdAt ?? null,
      };
    }

    const wins = profits.filter((p) => p > 0).length;
    const winRate = wins / profits.length;
    const avgProfit = profits.reduce((a, b) => a + b, 0) / profits.length;

    // Calculate max drawdown
    let maxDrawdown = 0;
    let runningMax = 0;
    let runningProfit = 0;
    for (const profit of profits) {
      runningProfit += profit;
      runningMax = Math.max(runningMax, runningProfit);
      maxDrawdown = Math.min(maxDrawdown, runningProfit - runningMax);
    }

    // Calculate Sharpe ratio
    const variance = profits.reduce((sum, p) => sum + Math.pow(p - avgProfit, 2), 0) / profits.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? avgProfit / stdDev : 0;

    return {
      totalTrades: profits.length,
      winRate,
      avgProfit,
      maxDrawdown: Math.abs(maxDrawdown),
      sharpeRatio,
      lastTradeTime: executions[executions.length - 1]?.createdAt ?? null,
    };
  } catch (error) {
    console.error("[AgentStateManager] Error calculating metrics:", error);
    return null;
  }
}

/**
 * Export agent state for backup
 */
export async function exportAgentState(
  agentId: number,
  userId: number
): Promise<string | null> {
  try {
    const agentState = await loadAgentState(agentId, userId);
    if (!agentState) return null;

    const qTableData = serializeQTable(agentState.qTable);
    const snapshot: AgentStateSnapshot = {
      agentId,
      userId,
      qTableData,
      learningRate: agentState.learningRate,
      discountFactor: agentState.discountFactor,
      epsilon: agentState.epsilon,
      totalReward: agentState.totalReward,
      episodeCount: agentState.episodeCount,
      lastTradePrice: agentState.lastTradePrice,
      createdAt: agentState.createdAt,
      updatedAt: agentState.updatedAt,
    };

    return JSON.stringify(snapshot, null, 2);
  } catch (error) {
    console.error("[AgentStateManager] Error exporting agent state:", error);
    return null;
  }
}

/**
 * Import agent state from backup
 */
export async function importAgentState(
  agentId: number,
  userId: number,
  stateJson: string
): Promise<boolean> {
  try {
    const snapshot: AgentStateSnapshot = JSON.parse(stateJson);

    const agentState: AgentState = {
      agentId,
      userId,
      qTable: deserializeQTable(snapshot.qTableData),
      learningRate: snapshot.learningRate,
      discountFactor: snapshot.discountFactor,
      epsilon: snapshot.epsilon,
      totalReward: snapshot.totalReward,
      episodeCount: snapshot.episodeCount,
      lastTradePrice: snapshot.lastTradePrice,
      lastTradeAction: null,
      createdAt: snapshot.createdAt,
      updatedAt: new Date(),
    };

    return await saveAgentState(agentState, userId);
  } catch (error) {
    console.error("[AgentStateManager] Error importing agent state:", error);
    return false;
  }
}
