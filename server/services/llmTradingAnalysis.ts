/**
 * LLM Trading Analysis Service
 * Integrates DeepSeek and Qwen for AI-powered cryptocurrency trading automation
 */

import { invokeLLM } from "../_core/llm";

export type LLMModel = 'deepseek' | 'qwen';

export interface MarketAnalysisInput {
  symbol: string;
  currentPrice: number;
  bid: number;
  ask: number;
  volume24h: number;
  change24h: number;
  previousPrice?: number;
  rsi?: number;
  macd?: number;
  bollingerBands?: { upper: number; middle: number; lower: number };
  timeframe?: string;
}

export interface TradingSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  reason: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskRewardRatio?: number;
  timeframe?: string;
}

export interface RiskAssessment {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  volatility: number; // 0-100
  recommendation: string;
  maxPositionSize: number; // percentage
  suggestedStopLoss: number;
}

export interface PortfolioRecommendation {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  weight: number; // portfolio allocation percentage
  reasoning: string;
  riskScore: number;
}

/**
 * Analyze market conditions using LLM
 */
export async function analyzeMarketWithLLM(
  input: MarketAnalysisInput,
  model: LLMModel = 'deepseek'
): Promise<TradingSignal> {
  const prompt = buildMarketAnalysisPrompt(input);

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `You are an expert cryptocurrency trader and technical analyst. Analyze market data and provide trading signals with precise entry/exit points. Always respond with valid JSON.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'trading_signal',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['BUY', 'SELL', 'HOLD'],
                description: 'Trading action',
              },
              confidence: {
                type: 'number',
                minimum: 0,
                maximum: 100,
                description: 'Confidence level (0-100)',
              },
              reason: {
                type: 'string',
                description: 'Detailed reasoning for the signal',
              },
              entryPrice: {
                type: 'number',
                description: 'Suggested entry price',
              },
              stopLoss: {
                type: 'number',
                description: 'Suggested stop loss price',
              },
              takeProfit: {
                type: 'number',
                description: 'Suggested take profit price',
              },
              riskRewardRatio: {
                type: 'number',
                description: 'Risk to reward ratio',
              },
              timeframe: {
                type: 'string',
                description: 'Recommended timeframe',
              },
            },
            required: ['action', 'confidence', 'reason'],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content === 'string') {
      return JSON.parse(content);
    }
    throw new Error('Invalid response format from LLM');
  } catch (error) {
    console.error('[LLM Trading Analysis] Error:', error);
    // Return default HOLD signal on error
    return {
      action: 'HOLD',
      confidence: 0,
      reason: 'Unable to analyze market due to LLM error',
    };
  }
}

/**
 * Assess risk for a trading position
 */
export async function assessRiskWithLLM(
  input: MarketAnalysisInput,
  proposedPosition: { size: number; entryPrice: number; stopLoss: number },
  model: LLMModel = 'qwen'
): Promise<RiskAssessment> {
  const prompt = buildRiskAssessmentPrompt(input, proposedPosition);

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `You are a risk management expert in cryptocurrency trading. Assess trading risks and provide recommendations. Always respond with valid JSON.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'risk_assessment',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              riskLevel: {
                type: 'string',
                enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                description: 'Overall risk level',
              },
              volatility: {
                type: 'number',
                minimum: 0,
                maximum: 100,
                description: 'Volatility score',
              },
              recommendation: {
                type: 'string',
                description: 'Risk management recommendation',
              },
              maxPositionSize: {
                type: 'number',
                description: 'Maximum position size as percentage',
              },
              suggestedStopLoss: {
                type: 'number',
                description: 'Suggested stop loss price',
              },
            },
            required: ['riskLevel', 'volatility', 'recommendation', 'maxPositionSize', 'suggestedStopLoss'],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content === 'string') {
      return JSON.parse(content);
    }
    throw new Error('Invalid response format from LLM');
  } catch (error) {
    console.error('[LLM Risk Assessment] Error:', error);
    // Return conservative risk assessment on error
    return {
      riskLevel: 'HIGH',
      volatility: 75,
      recommendation: 'Unable to assess risk due to LLM error. Use caution.',
      maxPositionSize: 1,
      suggestedStopLoss: proposedPosition.entryPrice * 0.95,
    };
  }
}

/**
 * Generate portfolio recommendations
 */
export async function generatePortfolioRecommendations(
  symbols: string[],
  marketData: MarketAnalysisInput[],
  model: LLMModel = 'deepseek'
): Promise<PortfolioRecommendation[]> {
  const prompt = buildPortfolioPrompt(symbols, marketData);

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `You are a portfolio manager specializing in cryptocurrency. Provide balanced portfolio recommendations with allocation weights. Always respond with valid JSON array.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'portfolio_recommendations',
          strict: true,
          schema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                symbol: {
                  type: 'string',
                  description: 'Trading pair symbol',
                },
                action: {
                  type: 'string',
                  enum: ['BUY', 'SELL', 'HOLD'],
                  description: 'Recommended action',
                },
                weight: {
                  type: 'number',
                  description: 'Portfolio allocation percentage',
                },
                reasoning: {
                  type: 'string',
                  description: 'Reasoning for recommendation',
                },
                riskScore: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100,
                  description: 'Risk score',
                },
              },
              required: ['symbol', 'action', 'weight', 'reasoning', 'riskScore'],
              additionalProperties: false,
            },
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content === 'string') {
      return JSON.parse(content);
    }
    throw new Error('Invalid response format from LLM');
  } catch (error) {
    console.error('[LLM Portfolio Recommendations] Error:', error);
    return [];
  }
}

/**
 * Build market analysis prompt
 */
function buildMarketAnalysisPrompt(input: MarketAnalysisInput): string {
  return `
Analyze the following cryptocurrency market data and provide a trading signal:

Symbol: ${input.symbol}
Current Price: $${input.currentPrice}
Bid: $${input.bid}
Ask: $${input.ask}
24h Volume: ${input.volume24h}
24h Change: ${input.change24h}%
${input.rsi ? `RSI: ${input.rsi}` : ''}
${input.macd ? `MACD: ${input.macd}` : ''}
${input.bollingerBands ? `Bollinger Bands - Upper: ${input.bollingerBands.upper}, Middle: ${input.bollingerBands.middle}, Lower: ${input.bollingerBands.lower}` : ''}
Timeframe: ${input.timeframe || '1h'}

Provide a trading signal with:
1. Action (BUY, SELL, or HOLD)
2. Confidence level (0-100)
3. Detailed reasoning
4. Entry price
5. Stop loss price
6. Take profit price
7. Risk/reward ratio
8. Recommended timeframe

Consider technical indicators, market trends, and risk factors.
`;
}

/**
 * Build risk assessment prompt
 */
function buildRiskAssessmentPrompt(
  input: MarketAnalysisInput,
  position: { size: number; entryPrice: number; stopLoss: number }
): string {
  return `
Assess the risk for the following trading position:

Symbol: ${input.symbol}
Current Price: $${input.currentPrice}
24h Change: ${input.change24h}%
24h Volume: ${input.volume24h}
Volatility (24h): ${Math.abs(input.change24h)}%

Position Details:
- Size: ${position.size} units
- Entry Price: $${position.entryPrice}
- Stop Loss: $${position.stopLoss}
- Potential Loss: ${(((position.stopLoss - position.entryPrice) / position.entryPrice) * 100).toFixed(2)}%

Provide a risk assessment with:
1. Risk level (LOW, MEDIUM, HIGH, CRITICAL)
2. Volatility score (0-100)
3. Risk management recommendation
4. Maximum position size (as percentage)
5. Suggested stop loss price

Consider market volatility, position size, and current market conditions.
`;
}

/**
 * Build portfolio recommendation prompt
 */
function buildPortfolioPrompt(symbols: string[], marketData: MarketAnalysisInput[]): string {
  const marketSummary = marketData
    .map(
      (m) => `
${m.symbol}:
- Price: $${m.currentPrice}
- 24h Change: ${m.change24h}%
- Volume: ${m.volume24h}
`
    )
    .join('\n');

  return `
Create a balanced portfolio recommendation for the following cryptocurrencies:

${marketSummary}

Provide recommendations with:
1. Symbol
2. Action (BUY, SELL, HOLD)
3. Portfolio weight (allocation percentage)
4. Reasoning
5. Risk score (0-100)

Ensure the total weight adds up to 100% for BUY positions.
Consider diversification, risk management, and market conditions.
`;
}

/**
 * Analyze sentiment from market data
 */
export async function analyzeSentimentWithLLM(
  symbol: string,
  recentTrades: Array<{ price: number; volume: number; timestamp: Date }>,
  model: LLMModel = 'qwen'
): Promise<{ sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; score: number; analysis: string }> {
  const prompt = `
Analyze the market sentiment for ${symbol} based on recent trading activity:

${recentTrades
  .slice(-10)
  .map((t) => `Price: $${t.price}, Volume: ${t.volume}, Time: ${t.timestamp.toISOString()}`)
  .join('\n')}

Provide sentiment analysis with:
1. Sentiment (BULLISH, BEARISH, NEUTRAL)
2. Score (-100 to 100, where -100 is extremely bearish and 100 is extremely bullish)
3. Analysis explanation

Consider price trends, volume patterns, and momentum.
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are a market sentiment analyst. Analyze trading data and provide sentiment scores. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'sentiment_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              sentiment: {
                type: 'string',
                enum: ['BULLISH', 'BEARISH', 'NEUTRAL'],
              },
              score: {
                type: 'number',
                minimum: -100,
                maximum: 100,
              },
              analysis: {
                type: 'string',
              },
            },
            required: ['sentiment', 'score', 'analysis'],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content === 'string') {
      return JSON.parse(content);
    }
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('[LLM Sentiment Analysis] Error:', error);
    return {
      sentiment: 'NEUTRAL',
      score: 0,
      analysis: 'Unable to analyze sentiment due to error',
    };
  }
}
