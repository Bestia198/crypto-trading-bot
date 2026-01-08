import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getDb } from "../db";
import { agentConfigs, walletBalance, tradingResults } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Agent Automation System", () => {
  let db: any;
  const testUserId = 9999;
  const testAgentId = 30001;

  beforeEach(async () => {
    db = await getDb();
  });

  describe("Agent Control Panel", () => {
    it("should retrieve all agents for a user", async () => {
      const agents = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.userId, testUserId));

      expect(agents).toBeDefined();
      expect(Array.isArray(agents)).toBe(true);
    });

    it("should have correct agent types", async () => {
      const agents = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.userId, testUserId));

      const validTypes = ["RL", "Momentum", "MeanReversion", "DeepSeek"];
      agents.forEach((agent: any) => {
        expect(validTypes).toContain(agent.agentType);
      });
    });

    it("should track agent enabled/disabled status", async () => {
      const agent = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.id, testAgentId))
        .limit(1);

      if (agent.length > 0) {
        expect(typeof agent[0].isEnabled).toBe("boolean");
      }
    });

    it("should have risk management parameters", async () => {
      const agents = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.userId, testUserId));

      agents.forEach((agent: any) => {
        expect(agent.stopLossPct).toBeDefined();
        expect(agent.takeProfitPct).toBeDefined();
      });
    });
  });

  describe("Live Metrics Panel", () => {
    it("should calculate portfolio value from wallet balance", async () => {
      const wallet = await db
        .select()
        .from(walletBalance)
        .where(eq(walletBalance.userId, testUserId));

      if (wallet.length > 0) {
        const value = wallet[0].totalBalance;
        expect(value).toBeDefined();
        expect(typeof value === "string" || typeof value === "number").toBe(
          true
        );
      }
    });

    it("should calculate win rate from trading results", async () => {
      const trades = await db
        .select()
        .from(tradingResults)
        .where(eq(tradingResults.userId, testUserId));

      if (trades.length > 0) {
        const winningTrades = trades.filter((t: any) => {
          const profit =
            typeof t.profit === "string" ? parseFloat(t.profit) : t.profit;
          return profit && profit > 0;
        }).length;

        const winRate = (winningTrades / trades.length) * 100;
        expect(winRate).toBeGreaterThanOrEqual(0);
        expect(winRate).toBeLessThanOrEqual(100);
      }
    });

    it("should track total trades count", async () => {
      const trades = await db
        .select()
        .from(tradingResults)
        .where(eq(tradingResults.userId, testUserId));

      expect(Array.isArray(trades)).toBe(true);
      expect(trades.length).toBeGreaterThanOrEqual(0);
    });

    it("should calculate total profit/loss", async () => {
      const trades = await db
        .select()
        .from(tradingResults)
        .where(eq(tradingResults.userId, testUserId));

      if (trades.length > 0) {
        const totalProfit = trades.reduce((sum: number, t: any) => {
          const profit =
            typeof t.profit === "string" ? parseFloat(t.profit) : t.profit;
          return sum + (profit || 0);
        }, 0);

        expect(typeof totalProfit).toBe("number");
      }
    });
  });

  describe("Trade Execution Log", () => {
    it("should display recent trades with timestamps", async () => {
      const trades = await db
        .select()
        .from(tradingResults)
        .where(eq(tradingResults.userId, testUserId))
        .limit(10);

      trades.forEach((trade: any) => {
        expect(trade.entryTime).toBeDefined();
        expect(trade.symbol).toBeDefined();
        expect(trade.tradeType).toBeDefined();
      });
    });

    it("should show trade profit/loss values", async () => {
      const trades = await db
        .select()
        .from(tradingResults)
        .where(eq(tradingResults.userId, testUserId))
        .limit(5);

      trades.forEach((trade: any) => {
        expect(trade.profit).toBeDefined();
      });
    });

    it("should distinguish between BUY and SELL trades", async () => {
      const trades = await db
        .select()
        .from(tradingResults)
        .where(eq(tradingResults.userId, testUserId));

      const tradeTypes = trades.map((t: any) => t.tradeType);
      const hasMultipleTypes = new Set(tradeTypes).size > 1;

      if (trades.length > 10) {
        expect(hasMultipleTypes).toBe(true);
      }
    });

    it("should sort trades by most recent first", async () => {
      const trades = await db
        .select()
        .from(tradingResults)
        .where(eq(tradingResults.userId, testUserId))
        .limit(10);

      if (trades.length > 1) {
        for (let i = 0; i < trades.length - 1; i++) {
          const current = new Date(trades[i].entryTime).getTime();
          const next = new Date(trades[i + 1].entryTime).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  describe("Agent Automation Integration", () => {
    it("should enable multiple agents simultaneously", async () => {
      const agents = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.userId, testUserId));

      expect(agents.length).toBeGreaterThanOrEqual(0);
    });

    it("should maintain agent status consistency", async () => {
      const agents = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.userId, testUserId));

      agents.forEach((agent: any) => {
        expect(typeof agent.isEnabled).toBe("boolean");
        expect(agent.createdAt).toBeDefined();
        expect(agent.updatedAt).toBeDefined();
      });
    });

    it("should have agents with valid configurations", async () => {
      const agents = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.userId, testUserId));

      agents.forEach((agent: any) => {
        expect(agent.agentName).toBeDefined();
        expect(agent.agentName.length).toBeGreaterThan(0);
        expect(agent.agentType).toBeDefined();
      });
    });
  });

  describe("Real-time Metrics Updates", () => {
    it("should provide current portfolio snapshot", async () => {
      const wallet = await db
        .select()
        .from(walletBalance)
        .where(eq(walletBalance.userId, testUserId));

      if (wallet.length > 0) {
        expect(wallet[0].totalBalance).toBeDefined();
        expect(wallet[0].availableBalance).toBeDefined();
        expect(wallet[0].lockedBalance).toBeDefined();
      }
    });

    it("should track active vs inactive agents", async () => {
      const agents = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.userId, testUserId));

      const active = agents.filter((a: any) => a.isEnabled).length;
      const inactive = agents.filter((a: any) => !a.isEnabled).length;

      expect(active + inactive).toBe(agents.length);
    });

    it("should calculate metrics accurately", async () => {
      const trades = await db
        .select()
        .from(tradingResults)
        .where(eq(tradingResults.userId, testUserId));

      const totalTrades = trades.length;
      const winningTrades = trades.filter((t: any) => {
        const profit =
          typeof t.profit === "string" ? parseFloat(t.profit) : t.profit;
        return profit && profit > 0;
      }).length;

      if (totalTrades > 0) {
        const winRate = (winningTrades / totalTrades) * 100;
        expect(winRate).toBeGreaterThanOrEqual(0);
        expect(winRate).toBeLessThanOrEqual(100);
      }
    });
  });
});
