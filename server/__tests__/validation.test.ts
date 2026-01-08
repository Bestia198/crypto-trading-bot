import { describe, it, expect } from "vitest";
import {
  agentConfigSchema,
  automationScheduleSchema,
  walletTransactionSchema,
  tradeSchema,
  isValidCronExpression,
  isValidSymbol,
  isValidTradeType,
  isValidPercentage,
  isValidPrice,
  isValidQuantity,
} from "../middleware/validation";

describe("Input Validation", () => {
  describe("Agent Config Validation", () => {
    it("should validate correct agent config", () => {
      const validConfig = {
        agentType: "RL",
        agentName: "Agent 1",
        learningRate: 0.5,
        stopLossPct: 5,
        takeProfitPct: 10,
      };

      const result = agentConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it("should reject invalid agent type", () => {
      const invalidConfig = {
        agentType: "InvalidType",
        agentName: "Agent 1",
      };

      const result = agentConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it("should reject empty agent name", () => {
      const invalidConfig = {
        agentType: "Momentum",
        agentName: "",
      };

      const result = agentConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it("should reject invalid learning rate", () => {
      const invalidConfig = {
        agentType: "DeepSeek",
        agentName: "Agent 1",
        learningRate: 1.5, // Greater than 1
      };

      const result = agentConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe("Automation Schedule Validation", () => {
    it("should validate correct schedule", () => {
      const validSchedule = {
        scheduleName: "Daily Trading",
        cronExpression: "0 0 9 * * *",
        symbol: "BTC/USDT",
        initialCapital: 1000,
        agentIds: [1, 2, 3],
      };

      const result = automationScheduleSchema.safeParse(validSchedule);
      expect(result.success).toBe(true);
    });

    it("should validate with default symbol", () => {
      const schedule = {
        scheduleName: "Daily Trading",
        cronExpression: "0 0 9 * * *",
        initialCapital: 1000,
        agentIds: [1],
      };

      const result = automationScheduleSchema.safeParse(schedule);
      expect(result.success).toBe(true);
    });

    it("should reject invalid cron expression", () => {
      const invalidSchedule = {
        scheduleName: "Daily Trading",
        cronExpression: "invalid cron",
        symbol: "BTC/USDT",
        initialCapital: 1000,
        agentIds: [1],
      };

      const result = automationScheduleSchema.safeParse(invalidSchedule);
      expect(result.success).toBe(false);
    });

    it("should reject invalid symbol format", () => {
      const invalidSchedule = {
        scheduleName: "Daily Trading",
        cronExpression: "0 0 9 * * *",
        symbol: "INVALID",
        initialCapital: 1000,
        agentIds: [1],
      };

      const result = automationScheduleSchema.safeParse(invalidSchedule);
      expect(result.success).toBe(false);
    });

    it("should reject empty agent ids", () => {
      const invalidSchedule = {
        scheduleName: "Daily Trading",
        cronExpression: "0 0 9 * * *",
        symbol: "BTC/USDT",
        initialCapital: 1000,
        agentIds: [],
      };

      const result = automationScheduleSchema.safeParse(invalidSchedule);
      expect(result.success).toBe(false);
    });
  });

  describe("Wallet Transaction Validation", () => {
    it("should validate correct transaction", () => {
      const validTransaction = {
        amount: 100,
        description: "Initial deposit",
      };

      const result = walletTransactionSchema.safeParse(validTransaction);
      expect(result.success).toBe(true);
    });

    it("should reject zero amount", () => {
      const invalidTransaction = {
        amount: 0,
      };

      const result = walletTransactionSchema.safeParse(invalidTransaction);
      expect(result.success).toBe(false);
    });

    it("should reject negative amount", () => {
      const invalidTransaction = {
        amount: -50,
      };

      const result = walletTransactionSchema.safeParse(invalidTransaction);
      expect(result.success).toBe(false);
    });
  });

  describe("Trade Validation", () => {
    it("should validate correct trade", () => {
      const validTrade = {
        symbol: "BTC/USDT",
        tradeType: "buy",
        entryPrice: 50000,
        exitPrice: 51000,
        quantity: 0.1,
        profit: 100,
      };

      const result = tradeSchema.safeParse(validTrade);
      expect(result.success).toBe(true);
    });

    it("should reject invalid trade type", () => {
      const invalidTrade = {
        symbol: "BTC/USDT",
        tradeType: "invalid",
        entryPrice: 50000,
        exitPrice: 51000,
        quantity: 0.1,
        profit: 100,
      };

      const result = tradeSchema.safeParse(invalidTrade);
      expect(result.success).toBe(false);
    });
  });
});

describe("Type Guards", () => {
  describe("Cron Expression Validation", () => {
    it("should validate correct cron expressions", () => {
      expect(isValidCronExpression("0 0 9 * * *")).toBe(true);
      expect(isValidCronExpression("*/5 * * * * *")).toBe(true);
      expect(isValidCronExpression("0 0 0 1 1 *")).toBe(true);
    });

    it("should reject invalid cron expressions", () => {
      expect(isValidCronExpression("invalid")).toBe(false);
      expect(isValidCronExpression("60 * * * * *")).toBe(false);
    });
  });

  describe("Symbol Validation", () => {
    it("should validate correct symbols", () => {
      expect(isValidSymbol("BTC/USDT")).toBe(true);
      expect(isValidSymbol("ETH/USDT")).toBe(true);
      expect(isValidSymbol("A/B")).toBe(true);
    });

    it("should reject invalid symbols", () => {
      expect(isValidSymbol("BTCUSDT")).toBe(false);
      expect(isValidSymbol("btc/usdt")).toBe(false);
      expect(isValidSymbol("BTC")).toBe(false);
    });
  });

  describe("Trade Type Validation", () => {
    it("should validate correct trade types", () => {
      expect(isValidTradeType("buy")).toBe(true);
      expect(isValidTradeType("sell")).toBe(true);
      expect(isValidTradeType("long")).toBe(true);
      expect(isValidTradeType("short")).toBe(true);
    });

    it("should reject invalid trade types", () => {
      expect(isValidTradeType("invalid")).toBe(false);
      expect(isValidTradeType("BUY")).toBe(false);
    });
  });

  describe("Percentage Validation", () => {
    it("should validate correct percentages", () => {
      expect(isValidPercentage(0)).toBe(true);
      expect(isValidPercentage(50)).toBe(true);
      expect(isValidPercentage(100)).toBe(true);
    });

    it("should reject invalid percentages", () => {
      expect(isValidPercentage(-1)).toBe(false);
      expect(isValidPercentage(101)).toBe(false);
    });
  });

  describe("Price Validation", () => {
    it("should validate correct prices", () => {
      expect(isValidPrice(0.01)).toBe(true);
      expect(isValidPrice(50000)).toBe(true);
      expect(isValidPrice(0.000001)).toBe(true);
    });

    it("should reject invalid prices", () => {
      expect(isValidPrice(0)).toBe(false);
      expect(isValidPrice(-100)).toBe(false);
      expect(isValidPrice(Infinity)).toBe(false);
    });
  });

  describe("Quantity Validation", () => {
    it("should validate correct quantities", () => {
      expect(isValidQuantity(0.1)).toBe(true);
      expect(isValidQuantity(1)).toBe(true);
      expect(isValidQuantity(1000)).toBe(true);
    });

    it("should reject invalid quantities", () => {
      expect(isValidQuantity(0)).toBe(false);
      expect(isValidQuantity(-1)).toBe(false);
      expect(isValidQuantity(Infinity)).toBe(false);
    });
  });
});
