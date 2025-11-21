import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { agentConfigs, walletBalance, agentStatus } from "../drizzle/schema";

/**
 * Initialize default agents for a new user
 */
export async function initializeDefaultAgents(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Check if user already has agents
    const existingAgents = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.userId, userId));

    if (existingAgents.length > 0) {
      console.log(`User ${userId} already has agents, skipping initialization`);
      return;
    }

    // Default agent configurations
    const defaultAgents = [
      {
        userId,
        agentType: "RL",
        agentName: "RL-Agent-1",
        learningRate: "0.001",
        stopLossPct: "0.05",
        takeProfitPct: "0.1",
      },
      {
        userId,
        agentType: "RL",
        agentName: "RL-Agent-2",
        learningRate: "0.001",
        stopLossPct: "0.05",
        takeProfitPct: "0.1",
      },
      {
        userId,
        agentType: "RL",
        agentName: "RL-Agent-3",
        learningRate: "0.001",
        stopLossPct: "0.05",
        takeProfitPct: "0.1",
      },
      {
        userId,
        agentType: "Momentum",
        agentName: "Momentum-Agent",
        learningRate: "0.0005",
        stopLossPct: "0.08",
        takeProfitPct: "0.15",
      },
      {
        userId,
        agentType: "MeanReversion",
        agentName: "MeanReversion-Agent",
        learningRate: "0.0008",
        stopLossPct: "0.06",
        takeProfitPct: "0.12",
      },
      {
        userId,
        agentType: "DeepSeek",
        agentName: "DeepSeek-LLM-Agent",
        learningRate: "0.001",
        stopLossPct: "0.04",
        takeProfitPct: "0.2",
      },
    ];

    // Insert all default agents
    for (const agent of defaultAgents) {
      await db.insert(agentConfigs).values(agent);
    }

    console.log(`Initialized ${defaultAgents.length} default agents for user ${userId}`);
  } catch (error) {
    console.error("Error initializing default agents:", error);
    throw error;
  }
}

/**
 * Initialize wallet balance for a new user
 */
export async function initializeWalletBalance(userId: number, initialBalance: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Check if wallet already exists
    const existingWallet = await db
      .select()
      .from(walletBalance)
      .where(eq(walletBalance.userId, userId));

    if (existingWallet.length > 0) {
      console.log(`User ${userId} already has wallet, skipping initialization`);
      return;
    }

    // Create wallet with initial balance
    await db.insert(walletBalance).values({
      userId,
      totalBalance: initialBalance.toString(),
      availableBalance: initialBalance.toString(),
      lockedBalance: "0",
    });

    console.log(`Initialized wallet for user ${userId} with balance $${initialBalance}`);
  } catch (error) {
    console.error("Error initializing wallet balance:", error);
    throw error;
  }
}

/**
 * Initialize user trading infrastructure
 */
export async function initializeUserTrading(userId: number) {
  try {
    await initializeDefaultAgents(userId);
    await initializeWalletBalance(userId, 30);
    console.log(`Trading infrastructure initialized for user ${userId}`);
  } catch (error) {
    console.error("Error initializing user trading:", error);
    throw error;
  }
}
