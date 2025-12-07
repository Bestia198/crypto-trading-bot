import { invokeLLM } from "./_core/llm";

/**
 * Autonomous Agent Service
 * Uses DeepSeek/Qwen LLM to analyze market conditions and automatically select trading strategies
 */

export interface MarketData {
  currentPrice: number;
  priceHistory: number[];
  volatility: number;
  riskPreference: "low" | "medium" | "high";
  previousTrades?: {
    winRate: number;
    totalProfit: number;
    confidence: number;
  }[];
}

export interface StrategyRecommendation {
  strategy: "RL" | "Momentum" | "MeanReversion" | "DeepSeek";
  confidence: number;
  reasoning: string;
  parameters: {
    learningRate?: number;
    stopLossPct?: number;
    takeProfitPct?: number;
  };
}

/**
 * Analyze market conditions and recommend optimal trading strategy using LLM
 */
export async function selectOptimalStrategy(
  marketData: MarketData
): Promise<StrategyRecommendation> {
  try {
    // Calculate technical indicators
    const priceChange = marketData.priceHistory.length > 1 
      ? ((marketData.currentPrice - marketData.priceHistory[0]) / marketData.priceHistory[0]) * 100
      : 0;
    
    const avgPrice = marketData.priceHistory.reduce((a, b) => a + b, 0) / marketData.priceHistory.length;
    const trend = marketData.currentPrice > avgPrice ? "uptrend" : "downtrend";

    const prompt = `You are an expert cryptocurrency trading advisor. Analyze the following market conditions and recommend the best trading strategy.

Market Data:
- Current Price: $${marketData.currentPrice}
- Price Change (24h): ${priceChange.toFixed(2)}%
- Volatility: ${marketData.volatility}%
- Trend: ${trend}
- Risk Preference: ${marketData.riskPreference}

Available Strategies:
1. RL (Reinforcement Learning) - Adaptive strategy that learns from market patterns
2. Momentum - Follows price trends and momentum indicators
3. MeanReversion - Trades when price deviates from average
4. DeepSeek - Advanced AI-powered strategy with deep market analysis

Based on the market conditions, recommend the BEST strategy. Respond in JSON format:
{
  "strategy": "RL|Momentum|MeanReversion|DeepSeek",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "parameters": {
    "learningRate": 0.01-0.1,
    "stopLossPct": 1-5,
    "takeProfitPct": 2-10
  }
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a cryptocurrency trading expert. Provide strategic recommendations in valid JSON format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "strategy_recommendation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              strategy: {
                type: "string",
                enum: ["RL", "Momentum", "MeanReversion", "DeepSeek"],
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
              },
              reasoning: {
                type: "string",
              },
              parameters: {
                type: "object",
                properties: {
                  learningRate: { type: "number" },
                  stopLossPct: { type: "number" },
                  takeProfitPct: { type: "number" },
                },
              },
            },
            required: ["strategy", "confidence", "reasoning", "parameters"],
          },
        },
      },
    });

    // Parse LLM response
    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return getDefaultStrategy(marketData);
    }

    const parsed = JSON.parse(content);
    return {
      strategy: parsed.strategy,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      parameters: parsed.parameters,
    };
  } catch (error) {
    console.error("[AutonomousAgent] Error selecting strategy:", error);
    return getDefaultStrategy(marketData);
  }
}

/**
 * Get default strategy based on market conditions
 */
function getDefaultStrategy(marketData: MarketData): StrategyRecommendation {
  const priceChange = marketData.priceHistory.length > 1 
    ? ((marketData.currentPrice - marketData.priceHistory[0]) / marketData.priceHistory[0]) * 100
    : 0;

  if (marketData.volatility > 5) {
    return {
      strategy: "MeanReversion",
      confidence: 0.8,
      reasoning: "High volatility detected - mean reversion strategy recommended",
      parameters: {
        stopLossPct: 3,
        takeProfitPct: 4,
      },
    };
  } else if (Math.abs(priceChange) > 2) {
    return {
      strategy: "Momentum",
      confidence: 0.85,
      reasoning: "Strong price momentum detected - momentum strategy recommended",
      parameters: {
        learningRate: 0.05,
        stopLossPct: 2,
        takeProfitPct: 5,
      },
    };
  } else {
    return {
      strategy: "RL",
      confidence: 0.75,
      reasoning: "Stable market conditions - RL strategy for adaptive learning",
      parameters: {
        learningRate: 0.03,
        stopLossPct: 2,
        takeProfitPct: 3,
      },
    };
  }
}

/**
 * Generate trading signal based on market analysis
 */
export async function generateTradingSignal(marketData: MarketData): Promise<{
  action: "buy" | "sell" | "hold";
  confidence: number;
  reasoning: string;
}> {
  try {
    const avgPrice = marketData.priceHistory.reduce((a, b) => a + b, 0) / marketData.priceHistory.length;
    const deviation = ((marketData.currentPrice - avgPrice) / avgPrice) * 100;

    const prompt = `Analyze the following market data and generate a trading signal.

Current Price: $${marketData.currentPrice}
Average Price: $${avgPrice.toFixed(2)}
Price Deviation: ${deviation.toFixed(2)}%
Volatility: ${marketData.volatility}%
Risk Preference: ${marketData.riskPreference}

Provide a trading signal in JSON format:
{
  "action": "buy|sell|hold",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a cryptocurrency trading signal generator. Provide signals in valid JSON format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "trading_signal",
          strict: true,
          schema: {
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["buy", "sell", "hold"],
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
              },
              reasoning: {
                type: "string",
              },
            },
            required: ["action", "confidence", "reasoning"],
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      return {
        action: "hold",
        confidence: 0.5,
        reasoning: "Unable to generate signal - holding position",
      };
    }

    const parsed = JSON.parse(content);
    return {
      action: parsed.action,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    console.error("[AutonomousAgent] Error generating trading signal:", error);
    return {
      action: "hold",
      confidence: 0.5,
      reasoning: "Error in signal generation - holding position",
    };
  }
}
