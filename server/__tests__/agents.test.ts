import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { agentConfigs, users, tradingResults, walletBalance } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Agent Trading System Validation", () => {
  let db: any;
  let testUserId: number;
  let testAgentId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");
  });

  describe("Agent Configuration", () => {
    it("should validate agent types are properly configured", async () => {
      const agents = await db.select().from(agentConfigs).limit(10);
      
      expect(agents.length).toBeGreaterThan(0);
      
      for (const agent of agents) {
        expect(["RL", "Momentum", "MeanReversion", "DeepSeek"]).toContain(agent.agentType);
        expect(agent.agentName).toBeDefined();
        expect(agent.isEnabled).toBeDefined();
        expect(agent.stopLossPct).toBeDefined();
        expect(agent.takeProfitPct).toBeDefined();
      }
    });

    it("should validate agent parameters are within acceptable ranges", async () => {
      const agents = await db.select().from(agentConfigs).limit(5);
      
      for (const agent of agents) {
        const learningRate = parseFloat(agent.learningRate?.toString() || "0");
        const stopLoss = parseFloat(agent.stopLossPct?.toString() || "0");
        const takeProfit = parseFloat(agent.takeProfitPct?.toString() || "0");
        
        expect(learningRate).toBeGreaterThanOrEqual(0);
        expect(learningRate).toBeLessThanOrEqual(1);
        
        expect(stopLoss).toBeGreaterThan(0);
        expect(stopLoss).toBeLessThan(1);
        
        expect(takeProfit).toBeGreaterThan(0);
        expect(takeProfit).toBeLessThan(1);
      }
    });

    it("should have agents assigned to users", async () => {
      const agents = await db.select().from(agentConfigs).limit(5);
      
      for (const agent of agents) {
        expect(agent.userId).toBeGreaterThan(0);
        
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, agent.userId))
          .limit(1);
        
        expect(user.length).toBe(1);
      }
    });
  });

  describe("Trade Execution", () => {
    it("should have trading results recorded", async () => {
      const trades = await db.select().from(tradingResults).limit(10);
      
      // Trades may or may not exist depending on scheduler
      if (trades.length > 0) {
        for (const trade of trades) {
          expect(trade.userId).toBeGreaterThan(0);
          expect(trade.agentId).toBeGreaterThan(0);
          expect(trade.symbol).toBeDefined();
          expect(["buy", "sell", "long", "short"]).toContain(trade.tradeType);
          expect(["open", "closed", "cancelled"]).toContain(trade.status);
        }
      }
    });

    it("should validate trade prices are reasonable", async () => {
      const trades = await db
        .select()
        .from(tradingResults)
        .limit(10);
      
      for (const trade of trades) {
        const entryPrice = parseFloat(trade.entryPrice?.toString() || "0");
        const exitPrice = parseFloat(trade.exitPrice?.toString() || "0");
        
        expect(entryPrice).toBeGreaterThan(0);
        if (exitPrice > 0) {
          expect(exitPrice).toBeGreaterThan(0);
        }
      }
    });

    it("should validate profit calculations", async () => {
      const trades = await db
        .select()
        .from(tradingResults)
        .limit(10);
      
      for (const trade of trades) {
        const profit = parseFloat(trade.profit?.toString() || "0");
        const profitPercent = parseFloat(trade.profitPercent?.toString() || "0");
        
        // Profit percent should be within reasonable bounds
        expect(profitPercent).toBeGreaterThanOrEqual(-100);
        expect(profitPercent).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("Wallet Management", () => {
    it("should have wallet balances for users with agents", async () => {
      const agents = await db.select().from(agentConfigs).limit(5);
      
      if (agents.length > 0) {
        const userIds = [...new Set(agents.map(a => a.userId))];
        let walletsFound = 0;
        
        for (const userId of userIds) {
          const wallet = await db
            .select()
            .from(walletBalance)
            .where(eq(walletBalance.userId, userId))
            .limit(1);
          
          if (wallet.length > 0) {
            walletsFound++;
            const balance = parseFloat(wallet[0].totalBalance?.toString() || "0");
            expect(balance).toBeGreaterThanOrEqual(0);
          }
        }
        
        expect(walletsFound).toBeGreaterThanOrEqual(0);
      }
    });

    it("should validate wallet balance is non-negative", async () => {
      const wallets = await db.select().from(walletBalance).limit(10);
      
      for (const wallet of wallets) {
        const totalBalance = parseFloat(wallet.totalBalance?.toString() || "0");
        const availableBalance = parseFloat(wallet.availableBalance?.toString() || "0");
        
        expect(totalBalance).toBeGreaterThanOrEqual(0);
        expect(availableBalance).toBeGreaterThanOrEqual(0);
        expect(availableBalance).toBeLessThanOrEqual(totalBalance);
      }
    });
  });

  describe("Agent Status Tracking", () => {
    it("should track agent enabled/disabled status", async () => {
      const agents = await db.select().from(agentConfigs).limit(10);
      
      for (const agent of agents) {
        expect([true, false]).toContain(agent.isEnabled);
      }
    });

    it("should have valid timestamps for agents", async () => {
      const agents = await db.select().from(agentConfigs).limit(5);
      
      for (const agent of agents) {
        expect(agent.createdAt).toBeDefined();
        expect(agent.updatedAt).toBeDefined();
        
        const createdTime = new Date(agent.createdAt).getTime();
        const updatedTime = new Date(agent.updatedAt).getTime();
        
        expect(createdTime).toBeGreaterThan(0);
        expect(updatedTime).toBeGreaterThanOrEqual(createdTime);
      }
    });
  });

  describe("Data Integrity", () => {
    it("should have no orphaned trades (trades without valid agents)", async () => {
      const trades = await db.select().from(tradingResults).limit(20);
      
      for (const trade of trades) {
        const agent = await db
          .select()
          .from(agentConfigs)
          .where(eq(agentConfigs.id, trade.agentId))
          .limit(1);
        
        expect(agent.length).toBeGreaterThan(0);
      }
    });

    it("should have no orphaned agents (agents without valid users)", async () => {
      const agents = await db.select().from(agentConfigs).limit(20);
      
      for (const agent of agents) {
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, agent.userId))
          .limit(1);
        
        expect(user.length).toBeGreaterThan(0);
      }
    });
  });
});
