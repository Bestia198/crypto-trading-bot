import { getDb } from "./db";
import { tradingSessions, agentMetrics, transactions, portfolioSnapshots } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

/**
 * Interface for trading simulation results
 */
export interface TradingSimulationResult {
  sessionId: number;
  agentMetrics: Array<{
    agentName: string;
    agentType: string;
    roi: number;
    winRate: number;
    tradesCount: number;
    reinvestmentProfit: number;
  }>;
  totalROI: number;
  totalTrades: number;
  finalNetWorth: number;
}

/**
 * Run a trading simulation using the enhanced bot code
 * This function executes the bot training and collects metrics
 */
export async function runTradingSimulation(
  userId: number,
  sessionName: string,
  symbol: string = "BTC/USDT",
  initialFiat: number = 20,
  episodes: number = 1
): Promise<TradingSimulationResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create a new trading session
  const sessionResult = await db.insert(tradingSessions).values({
    userId,
    sessionName,
    symbol,
    episodeNumber: 1,
    initialFiat: initialFiat.toString(),
    finalNetWorth: initialFiat.toString(),
    totalROI: "0",
    totalTrades: 0,
    winRate: "0",
    reinvestmentProfit: "0",
  });

  const sessionId = (sessionResult as any).insertId || 1;

  // For now, we'll return mock data that represents what the bot would produce
  // In production, you would call the actual bot code here
  const mockMetrics = generateMockMetrics(sessionId, initialFiat);

  // Store metrics in database
  for (const metric of mockMetrics.agentMetrics) {
    await db.insert(agentMetrics).values({
      sessionId,
      agentName: metric.agentName,
      agentType: metric.agentType,
      roi: metric.roi.toString(),
      winRate: metric.winRate.toString(),
      tradesCount: metric.tradesCount,
      reinvestmentProfit: metric.reinvestmentProfit.toString(),
    });
  }

  // Generate mock portfolio snapshots
  const snapshots = generateMockPortfolioSnapshots(sessionId, mockMetrics.agentMetrics);
  for (const snapshot of snapshots) {
    await db.insert(portfolioSnapshots).values({
      sessionId,
      agentName: snapshot.agentName,
      fiatBalance: snapshot.fiatBalance.toString(),
      cryptoBalance: snapshot.cryptoBalance.toString(),
      shortPosition: (snapshot.shortPosition || 0).toString(),
      netWorth: snapshot.netWorth.toString(),
    });
  }

  // Update session with final metrics
  await db
    .update(tradingSessions)
    .set({
      finalNetWorth: mockMetrics.finalNetWorth.toString(),
      totalROI: mockMetrics.totalROI.toString(),
      totalTrades: mockMetrics.totalTrades,
      reinvestmentProfit: mockMetrics.reinvestmentProfit.toString(),
    })
    .where(eq(tradingSessions.id, sessionId));

  return {
    sessionId,
    agentMetrics: mockMetrics.agentMetrics,
    totalROI: mockMetrics.totalROI,
    totalTrades: mockMetrics.totalTrades,
    finalNetWorth: mockMetrics.finalNetWorth,
  };
}

/**
 * Generate mock metrics for demonstration
 * In production, this would be replaced with actual bot execution
 */
function generateMockMetrics(sessionId: number, initialFiat: number) {
  const agents = [
    { name: "RL_Agent_1", type: "RL" },
    { name: "RL_Agent_2", type: "RL" },
    { name: "RL_Agent_3", type: "RL" },
    { name: "Momentum", type: "Momentum" },
    { name: "MeanReversion", type: "MeanReversion" },
    { name: "DeepSeek", type: "DeepSeek" },
    { name: "Consensus", type: "Consensus" },
  ];

  const agentMetrics = agents.map((agent) => ({
    agentName: agent.name,
    agentType: agent.type,
    roi: (Math.random() * 0.3 - 0.1), // ROI between -10% and 20%
    winRate: Math.random() * 0.5, // Win rate between 0% and 50%
    tradesCount: Math.floor(Math.random() * 10),
    reinvestmentProfit: Math.random() * 5,
  }));

  const avgROI = agentMetrics.reduce((sum, m) => sum + m.roi, 0) / agentMetrics.length;
  const totalTrades = agentMetrics.reduce((sum, m) => sum + m.tradesCount, 0);
  const totalReinvestment = agentMetrics.reduce((sum, m) => sum + m.reinvestmentProfit, 0);

  return {
    agentMetrics,
    totalROI: avgROI,
    totalTrades,
    finalNetWorth: initialFiat * (1 + avgROI) + totalReinvestment,
    reinvestmentProfit: totalReinvestment,
  };
}

/**
 * Generate mock portfolio snapshots for visualization
 */
function generateMockPortfolioSnapshots(
  sessionId: number,
  agentMetrics: Array<{
    agentName: string;
    agentType: string;
    roi: number;
    winRate: number;
    tradesCount: number;
    reinvestmentProfit: number;
  }>
) {
  const snapshots = [];
  const timePoints = 10; // Generate 10 time snapshots

  for (let t = 0; t < timePoints; t++) {
    for (const agent of agentMetrics) {
      const progress = t / timePoints;
      const netWorth = 20 * (1 + agent.roi * progress) + agent.reinvestmentProfit * progress;
      const fiatBalance = 20 * (1 - progress * 0.5);
      const cryptoBalance = (netWorth - fiatBalance) / 50000; // Assuming BTC price ~50000

      snapshots.push({
        agentName: agent.agentName,
        fiatBalance,
        cryptoBalance,
        shortPosition: 0,
        netWorth,
        timestamp: new Date(Date.now() - (timePoints - t) * 60000), // 1 minute intervals
      });
    }
  }

  return snapshots;
}

/**
 * Load metrics from CSV file (for integration with existing bot output)
 */
export async function loadMetricsFromCSV(
  userId: number,
  csvPath: string,
  sessionName: string
): Promise<TradingSimulationResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n").filter((line) => line.trim());
  const headers = lines[0].split(",");

  // Create session
  const sessionResult = await db.insert(tradingSessions).values({
    userId,
    sessionName,
    symbol: "BTC/USDT",
    episodeNumber: 1,
    initialFiat: "20",
    finalNetWorth: "20",
    totalROI: "0",
    totalTrades: 0,
    winRate: "0",
    reinvestmentProfit: "0",
  });

  const sessionId = (sessionResult as any).insertId || 1;

  // Parse CSV and store metrics
  const metricsMap = new Map<string, any>();

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const record: Record<string, string> = {};

    headers.forEach((header, idx) => {
      record[header.trim()] = values[idx]?.trim() || "";
    });

    const key = `${record.agent}`;
    if (!metricsMap.has(key)) {
      metricsMap.set(key, record);
    }
  }

  // Store unique metrics in database
  const uniqueMetrics = Array.from(metricsMap.values());
  let totalROI = 0;
  let totalTrades = 0;

  for (const metric of uniqueMetrics) {
    const roi = parseFloat(metric.roi) || 0;
    const winRate = parseFloat(metric.win_rate) || 0;
    const trades = parseInt(metric.trades) || 0;
    const reinvestment = parseFloat(metric.reinvestment_profit) || 0;

    await db.insert(agentMetrics).values({
      sessionId,
      agentName: metric.agent,
      agentType: "Unknown",
      roi: roi.toString(),
      winRate: winRate.toString(),
      tradesCount: trades,
      reinvestmentProfit: reinvestment.toString(),
    });

    totalROI += roi;
    totalTrades += trades;
  }

  // Update session
  const avgROI = totalROI / uniqueMetrics.length;
  await db
    .update(tradingSessions)
    .set({
      totalROI: avgROI.toString(),
      totalTrades,
    })
    .where(eq(tradingSessions.id, sessionId));

  return {
    sessionId,
    agentMetrics: uniqueMetrics.map((m) => ({
      agentName: m.agent,
      agentType: "Unknown",
      roi: parseFloat(m.roi) || 0,
      winRate: parseFloat(m.win_rate) || 0,
      tradesCount: parseInt(m.trades) || 0,
      reinvestmentProfit: parseFloat(m.reinvestment_profit) || 0,
    })),
    totalROI: avgROI,
    totalTrades,
    finalNetWorth: 20 * (1 + avgROI),
  };
}
