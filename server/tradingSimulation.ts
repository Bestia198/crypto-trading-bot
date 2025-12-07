import { getDb } from "./db";
import { tradingResults, portfolioAssets, walletTransactions } from "../drizzle/schema";

export interface TradeData {
  agentId: number;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  tradeType: "buy" | "sell";
  profit: number;
  confidence: number;
  timestamp: Date;
}

/**
 * Generates realistic trading data for an agent
 */
export function generateRealisticTrade(
  agentId: number,
  agentType: string,
  currentPrice: number,
  volatility: number = 2.5
): TradeData {
  // Simulate entry price based on agent type
  const entryPrice = currentPrice * (0.98 + Math.random() * 0.04);
  
  // Simulate exit price with volatility
  const priceChange = (Math.random() - 0.5) * volatility;
  const exitPrice = entryPrice * (1 + priceChange / 100);
  
  // Simulate quantity based on portfolio size ($30 USDT)
  // Use 50% of portfolio for this trade
  const tradeAmount = 15; // Use $15 per trade
  const quantity = Math.max(0.0001, tradeAmount / entryPrice); // Realistic quantity
  
  // Calculate profit/loss
  const profit = (exitPrice - entryPrice) * quantity;
  
  // Confidence varies by agent type
  let confidence = 0.5 + Math.random() * 0.25;
  
  switch (agentType) {
    case "RL":
      confidence = 0.60 + Math.random() * 0.30; // RL is more confident
      break;
    case "Momentum":
      confidence = 0.55 + Math.random() * 0.25;
      break;
    case "MeanReversion":
      confidence = 0.50 + Math.random() * 0.30;
      break;
    case "DeepSeek":
      confidence = 0.60 + Math.random() * 0.30; // DeepSeek LLM is most confident
      break;
  }
  
  // Determine trade type randomly (50% buy, 50% sell)
  const tradeType: "buy" | "sell" = Math.random() > 0.5 ? "buy" : "sell";
  
  return {
    agentId,
    symbol: "BTC/USDT",
    entryPrice,
    exitPrice,
    quantity,
    tradeType,
    profit,
    confidence: Math.min(1, confidence),
    timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random time in last 24h
  };
}

/**
 * Generates multiple trades for an agent
 */
export function generateMultipleTrades(
  agentId: number,
  agentType: string,
  count: number = 3,
  currentPrice: number = 50 // Realistic price for $30 portfolio
): TradeData[] {
  const trades: TradeData[] = [];
  for (let i = 0; i < count; i++) {
    trades.push(generateRealisticTrade(agentId, agentType, currentPrice + (Math.random() - 0.5) * 10));
  }
  return trades;
}

/**
 * Seeds the database with demo trading data
 */
export async function seedDemoTradingData(userId: number, agentIds: number[], agentTypes: string[]) {
  const db = await getDb();
  if (!db) return;

  try {
    // Generate trades for each agent
    for (let i = 0; i < agentIds.length; i++) {
      const agentId = agentIds[i];
      const agentType = agentTypes[i];
      
      // Generate 2-4 trades per agent
      const tradeCount = 2 + Math.floor(Math.random() * 3);
      const trades = generateMultipleTrades(agentId, agentType, tradeCount);
      
      // Insert trades into database
      for (const trade of trades) {
        await db.insert(tradingResults).values({
          executionId: agentId,
          userId,
          agentId: trade.agentId,
          symbol: trade.symbol,
          entryPrice: trade.entryPrice.toString(),
          exitPrice: trade.exitPrice.toString(),
          quantity: trade.quantity.toString(),
          profit: trade.profit.toString(),
          tradeType: trade.tradeType,
          confidence: trade.confidence.toString(),
          entryTime: trade.timestamp,
          createdAt: trade.timestamp,
        });
      }
    }

    // Create portfolio assets for $30 total
    const totalProfit = 0; // Will be calculated from trades
    await db.insert(portfolioAssets).values({
      userId,
      symbol: "BTC",
      quantity: "0.0003",
      averagePrice: "45000",
      currentPrice: "45500",
      totalValue: "13.65",
      unrealizedProfit: "0.90",
    });

    await db.insert(portfolioAssets).values({
      userId,
      symbol: "ETH",
      quantity: "0.008",
      averagePrice: "2500",
      currentPrice: "2550",
      totalValue: "20.40",
      unrealizedProfit: "0.40",
    });

    console.log("Demo trading data seeded successfully");
  } catch (error) {
    console.error("Error seeding demo data:", error);
  }
}

/**
 * Simulates a single trade execution
 */
export async function executeTrade(
  userId: number,
  agentId: number,
  agentType: string,
  currentPrice: number = 45000
): Promise<TradeData | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const trade = generateRealisticTrade(agentId, agentType, currentPrice);

    // Insert trade
    await db.insert(tradingResults).values({
      executionId: agentId,
      userId,
      agentId: trade.agentId,
      symbol: trade.symbol,
      entryPrice: trade.entryPrice.toString(),
      exitPrice: trade.exitPrice.toString(),
      quantity: trade.quantity.toString(),
      profit: trade.profit.toString(),
      tradeType: trade.tradeType,
      confidence: trade.confidence.toString(),
      entryTime: trade.timestamp,
      createdAt: trade.timestamp,
    });

    // Record transaction
    if (trade.profit !== 0) {
      await db.insert(walletTransactions).values({
        userId,
        transactionType: trade.profit > 0 ? "deposit" : "withdrawal",
        amount: Math.abs(trade.profit).toString(),
        currency: "USDT",
        status: "completed",
        description: `Trade by ${agentType} agent - ${trade.symbol}`,
      });
    }

    return trade;
  } catch (error) {
    console.error("Error executing trade:", error);
    return null;
  }
}

/**
 * Calculates trading statistics
 */
export function calculateTradeStats(trades: TradeData[]) {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      avgProfit: 0,
      totalProfit: 0,
      maxProfit: 0,
      maxLoss: 0,
    };
  }

  const wins = trades.filter((t) => t.profit > 0).length;
  const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
  const avgProfit = totalProfit / trades.length;
  const maxProfit = Math.max(...trades.map((t) => t.profit));
  const maxLoss = Math.min(...trades.map((t) => t.profit));

  return {
    totalTrades: trades.length,
    winRate: (wins / trades.length) * 100,
    avgProfit,
    totalProfit,
    maxProfit,
    maxLoss,
  };
}
