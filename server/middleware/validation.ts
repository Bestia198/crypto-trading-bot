import { z } from "zod";

/**
 * Input Validation Schemas
 */

export const agentConfigSchema = z.object({
  agentType: z.enum(["RL", "Momentum", "MeanReversion", "DeepSeek"]),
  agentName: z.string().min(1).max(100),
  learningRate: z.number().min(0.001).max(1).optional(),
  stopLossPct: z.number().min(0.1).max(50).optional(),
  takeProfitPct: z.number().min(0.1).max(500).optional(),
});

export const automationScheduleSchema = z.object({
  scheduleName: z.string().min(1).max(100),
  cronExpression: z.string().regex(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/),
  symbol: z.string().regex(/^[A-Z]{1,10}\/[A-Z]{1,10}$/).default("BTC/USDT"),
  initialCapital: z.number().min(10).max(1000000),
  agentIds: z.array(z.number().int().positive()).min(1),
});

export const walletTransactionSchema = z.object({
  amount: z.number().min(0.01).max(1000000),
  description: z.string().max(500).optional(),
});

export const tradeSchema = z.object({
  symbol: z.string().regex(/^[A-Z]{1,10}\/[A-Z]{1,10}$/),
  tradeType: z.enum(["buy", "sell", "long", "short"]),
  entryPrice: z.number().positive(),
  exitPrice: z.number().positive(),
  quantity: z.number().positive(),
  profit: z.number(),
});

/**
 * Output Validation & Sanitization
 */

export const sanitizeAgentConfig = (agent: any) => {
  return {
    id: z.number().parse(agent.id),
    agentName: z.string().parse(agent.agentName),
    agentType: z.enum(["RL", "Momentum", "MeanReversion", "DeepSeek"]).parse(agent.agentType),
    isEnabled: z.boolean().parse(agent.isEnabled),
    stopLossPct: agent.stopLossPct ? z.string().parse(agent.stopLossPct) : null,
    takeProfitPct: agent.takeProfitPct ? z.string().parse(agent.takeProfitPct) : null,
    createdAt: z.date().parse(agent.createdAt),
    updatedAt: z.date().parse(agent.updatedAt),
  };
};

export const sanitizeWalletBalance = (wallet: any) => {
  return {
    userId: z.number().parse(wallet.userId),
    totalBalance: z.string().parse(wallet.totalBalance),
    availableBalance: z.string().parse(wallet.availableBalance),
    lockedBalance: z.string().parse(wallet.lockedBalance),
  };
};

export const sanitizeTradingResult = (trade: any) => {
  return {
    id: z.number().parse(trade.id),
    symbol: z.string().parse(trade.symbol),
    tradeType: z.enum(["buy", "sell", "long", "short"]).parse(trade.tradeType),
    entryPrice: z.string().parse(trade.entryPrice),
    exitPrice: z.string().parse(trade.exitPrice),
    quantity: z.string().parse(trade.quantity),
    profit: trade.profit ? z.string().parse(trade.profit) : null,
    entryTime: z.date().parse(trade.entryTime),
    exitTime: trade.exitTime ? z.date().parse(trade.exitTime) : null,
  };
};

/**
 * Validation Error Handler
 */

export const handleValidationError = (error: z.ZodError) => {
  const issues = error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));

  return {
    success: false,
    errors: issues,
    message: "Validation failed",
  };
};

/**
 * Type Guards
 */

export const isValidCronExpression = (cron: string): boolean => {
  const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
  return cronRegex.test(cron);
};

export const isValidSymbol = (symbol: string): boolean => {
  return /^[A-Z]{1,10}\/[A-Z]{1,10}$/.test(symbol);
};

export const isValidTradeType = (type: string): boolean => {
  return ["buy", "sell", "long", "short"].includes(type);
};

export const isValidPercentage = (value: number): boolean => {
  return value >= 0 && value <= 100;
};

export const isValidPrice = (price: number): boolean => {
  return price > 0 && isFinite(price);
};

export const isValidQuantity = (quantity: number): boolean => {
  return quantity > 0 && isFinite(quantity);
};
