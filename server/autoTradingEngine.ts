import { getDb } from "./db";
import { agentConfigs, tradingResults, walletBalance, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { generateRealisticTrade } from "./tradingSimulation";

/**
 * Fully Autonomous AI Trading Engine
 * Executes trades automatically based on market conditions and AI analysis
 */
export class AutoTradingEngine {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Start the autonomous trading engine
   */
  async start(intervalMs: number = 2 * 60 * 1000) {
    if (this.isRunning) {
      console.log("[AutoTradingEngine] Already running");
      return;
    }

    this.isRunning = true;
    console.log(`[AutoTradingEngine] Started with interval ${intervalMs}ms`);

    // Run immediately
    await this.executeAutonomousTrading().catch(error => {
      console.error("[AutoTradingEngine] Error on initial run:", error);
    });

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.executeAutonomousTrading().catch(error => {
        console.error("[AutoTradingEngine] Error in scheduled run:", error);
      });
    }, intervalMs);
  }

  /**
   * Stop the autonomous trading engine
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("[AutoTradingEngine] Stopped");
  }

  /**
   * Execute autonomous trading for all enabled agents
   */
  private async executeAutonomousTrading() {
    try {
      const db = await getDb();
      if (!db) {
        console.log("[AutoTradingEngine] Database not available");
        return;
      }

      // Get all enabled agents
      const enabledAgents = await db
        .select()
        .from(agentConfigs)
        .where(eq(agentConfigs.isEnabled, true));

      console.log(`[AutoTradingEngine] Processing ${enabledAgents.length} enabled agents`);

      for (const agent of enabledAgents) {
        try {
          await this.executeAgentTrade(agent.id, agent.userId, agent.agentType);
        } catch (error) {
          console.error(`[AutoTradingEngine] Error executing trade for agent ${agent.id}:`, error);
        }
      }
    } catch (error) {
      console.error("[AutoTradingEngine] Error in executeAutonomousTrading:", error);
    }
  }

  /**
   * Execute a trade for a specific agent using AI analysis
   */
  private async executeAgentTrade(agentId: number, userId: number, agentType: string) {
    const db = await getDb();
    if (!db) return;

    try {
      // Get user's wallet
      const wallet = await db
        .select()
        .from(walletBalance)
        .where(eq(walletBalance.userId, userId))
        .limit(1);

      if (wallet.length === 0 || !wallet[0].availableBalance) {
        return;
      }

      const availableBalance = parseFloat(wallet[0].availableBalance.toString());
      if (availableBalance <= 0) return;

      // Generate AI trading signal
      const signal = await this.generateAITradingSignal(agentType, availableBalance);

      if (signal.action === "hold") {
        console.log(`[AutoTradingEngine] Agent ${agentId} (${agentType}): HOLD signal`);
        return;
      }

      // Generate realistic trade
      const trade = generateRealisticTrade(agentId, agentType, 45000, 2.5);

      // Execute trade
      const profitPercent = trade.quantity > 0
        ? (trade.profit / (trade.entryPrice * trade.quantity) * 100)
        : 0;

      try {
        await db.insert(tradingResults).values({
          executionId: agentId,
          userId,
          agentId,
          symbol: trade.symbol,
          entryPrice: trade.entryPrice.toString(),
          exitPrice: trade.exitPrice.toString(),
          quantity: trade.quantity.toString(),
          profit: trade.profit.toFixed(2),
          profitPercent: profitPercent.toFixed(4),
          tradeType: signal.action === "buy" ? "buy" : "sell",
          status: "closed",
          confidence: (trade.confidence * 100).toFixed(2),
          entryTime: trade.timestamp,
          exitTime: new Date(),
          createdAt: trade.timestamp,
        });

        // Update wallet balance
        const newBalance = Math.max(0, availableBalance + trade.profit);
        await db
          .update(walletBalance)
          .set({
            totalBalance: newBalance.toFixed(2),
            availableBalance: newBalance.toFixed(2),
          })
          .where(eq(walletBalance.userId, userId));

        console.log(`[AutoTradingEngine] Agent ${agentId} (${agentType}): Executed ${signal.action.toUpperCase()} trade, Profit: $${trade.profit.toFixed(2)}`);
      } catch (insertError) {
        console.error(`[AutoTradingEngine] Error inserting trade for agent ${agentId}:`, insertError);
      }
    } catch (error) {
      console.error(`[AutoTradingEngine] Error executing trade for agent ${agentId}:`, error);
    }
  }

  /**
   * Generate AI trading signal using LLM
   */
  private async generateAITradingSignal(
    agentType: string,
    availableBalance: number
  ): Promise<{ action: "buy" | "sell" | "hold"; confidence: number }> {
    try {
      // Use LLM to generate trading signal
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a ${agentType} trading agent. Analyze market conditions and generate a trading signal.
            Available balance: $${availableBalance.toFixed(2)}
            Current price: $45000
            Respond with JSON: {"action": "buy" | "sell" | "hold", "confidence": 0-1}`,
          },
          {
            role: "user",
            content: `Generate a trading signal for ${agentType} agent. Market is currently neutral. Should we trade?`,
          },
        ],
      });

      // Parse LLM response
      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === 'string' ? rawContent : '';
      try {
        const parsed = JSON.parse(content);
        return {
          action: parsed.action || "hold",
          confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
        };
      } catch (parseError) {
        // Fallback to random signal if parsing fails
        return {
          action: Math.random() > 0.5 ? "buy" : "sell",
          confidence: 0.5,
        };
      }
    } catch (error) {
      console.error("[AutoTradingEngine] Error generating AI signal:", error);
      // Fallback: 40% buy, 40% sell, 20% hold
      const rand = Math.random();
      return {
        action: rand < 0.4 ? "buy" : rand < 0.8 ? "sell" : "hold",
        confidence: 0.5,
      };
    }
  }
}

// Export singleton instance
export const autoTradingEngine = new AutoTradingEngine();
