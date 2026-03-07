/**
 * Improved Trading Strategies with Fixes
 * Addresses whipsaw protection, trend filtering, and confirmation logic
 */

export interface TradeSignal {
  action: "buy" | "sell" | "hold";
  confidence: number;
  reasoning: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface StrategyState {
  lastSignal?: "buy" | "sell" | "hold";
  confirmationCount: number;
  lastTrendDirection?: "up" | "down" | "neutral";
  priceHistory: number[];
}

/**
 * IMPROVED MOMENTUM STRATEGY
 * FIXED: Added confirmation candle requirement to prevent whipsaws
 */
export function improvedMomentumStrategy(
  prices: number[],
  state: StrategyState,
  confirmationCandles: number = 2,
  minPriceChange: number = 2
): TradeSignal {
  if (prices.length < 20) {
    return {
      action: "hold",
      confidence: 0,
      reasoning: "Insufficient price data for momentum analysis",
    };
  }

  // Calculate momentum
  const recentPrices = prices.slice(-20);
  const firstPrice = recentPrices[0];
  const lastPrice = recentPrices[recentPrices.length - 1];
  const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;

  // Determine trend direction
  const trendDirection = priceChange > 0 ? "up" : priceChange < 0 ? "down" : "neutral";

  // FIXED: Confirmation requirement
  let signal: "buy" | "sell" | "hold" = "hold";
  let confidence = 0;
  let reasoning = "";

  if (Math.abs(priceChange) > minPriceChange) {
    // Check if trend continues (confirmation)
    if (trendDirection === state.lastTrendDirection) {
      state.confirmationCount++;
    } else {
      state.confirmationCount = 1;
    }

    if (state.confirmationCount >= confirmationCandles) {
      if (trendDirection === "up") {
        signal = "buy";
        confidence = Math.min(0.95, 0.5 + Math.abs(priceChange) / 10);
        reasoning = `Momentum BUY signal confirmed (${state.confirmationCount} candles, ${priceChange.toFixed(2)}% change)`;
      } else if (trendDirection === "down") {
        signal = "sell";
        confidence = Math.min(0.95, 0.5 + Math.abs(priceChange) / 10);
        reasoning = `Momentum SELL signal confirmed (${state.confirmationCount} candles, ${priceChange.toFixed(2)}% change)`;
      }
    } else {
      reasoning = `Momentum signal detected but awaiting confirmation (${state.confirmationCount}/${confirmationCandles})`;
    }
  } else {
    state.confirmationCount = 0;
    reasoning = "Insufficient momentum for trade signal";
  }

  state.lastTrendDirection = trendDirection;
  state.lastSignal = signal;

  return {
    action: signal,
    confidence,
    reasoning,
    stopLoss: 2,
    takeProfit: 5,
  };
}

/**
 * IMPROVED MEAN REVERSION STRATEGY
 * FIXED: Added trend filter to prevent trading against strong trends
 */
export function improvedMeanReversionStrategy(
  prices: number[],
  state: StrategyState,
  stdDevMultiplier: number = 2,
  trendPeriod: number = 20
): TradeSignal {
  if (prices.length < 30) {
    return {
      action: "hold",
      confidence: 0,
      reasoning: "Insufficient price data for mean reversion analysis",
    };
  }

  // Calculate moving average and standard deviation
  const recentPrices = prices.slice(-30);
  const mean = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
  const variance =
    recentPrices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / recentPrices.length;
  const stdDev = Math.sqrt(variance);

  // Current price deviation from mean
  const currentPrice = prices[prices.length - 1];
  const deviation = ((currentPrice - mean) / mean) * 100;

  // FIXED: Add trend filter
  const trendPrices = prices.slice(-trendPeriod);
  const trendStart = trendPrices[0];
  const trendEnd = trendPrices[trendPrices.length - 1];
  const trendChange = ((trendEnd - trendStart) / trendStart) * 100;
  const isStrongUptrend = trendChange > 3;
  const isStrongDowntrend = trendChange < -3;

  let signal: "buy" | "sell" | "hold" = "hold";
  let confidence = 0;
  let reasoning = "";

  // Mean reversion buy signal (price too low)
  if (deviation < -stdDevMultiplier && !isStrongDowntrend) {
    signal = "buy";
    confidence = Math.min(0.9, 0.5 + Math.abs(deviation) / 10);
    reasoning = `Mean Reversion BUY: Price ${Math.abs(deviation).toFixed(2)}% below mean (${stdDevMultiplier}σ threshold)`;
  }
  // Mean reversion sell signal (price too high)
  else if (deviation > stdDevMultiplier && !isStrongUptrend) {
    signal = "sell";
    confidence = Math.min(0.9, 0.5 + Math.abs(deviation) / 10);
    reasoning = `Mean Reversion SELL: Price ${deviation.toFixed(2)}% above mean (${stdDevMultiplier}σ threshold)`;
  } else if (isStrongUptrend) {
    reasoning = `Price too high but strong uptrend detected - avoiding short`;
  } else if (isStrongDowntrend) {
    reasoning = `Price too low but strong downtrend detected - avoiding long`;
  } else {
    reasoning = `Price within normal range (${deviation.toFixed(2)}% from mean)`;
  }

  return {
    action: signal,
    confidence,
    reasoning,
    stopLoss: 3,
    takeProfit: 4,
  };
}

/**
 * IMPROVED RL STRATEGY WITH ENHANCED STATE SPACE
 * Added more technical indicators for better decision making
 */
export function improvedRLStrategy(
  prices: number[],
  rsiValue: number,
  macdValue: number,
  bollingerBands: { upper: number; lower: number; middle: number },
  confidence: number = 0.5
): TradeSignal {
  if (prices.length < 20) {
    return {
      action: "hold",
      confidence: 0,
      reasoning: "Insufficient data for RL strategy",
    };
  }

  let signal: "buy" | "sell" | "hold" = "hold";
  let reasoning = "";

  // Multi-factor analysis
  const rsiOversold = rsiValue < 30;
  const rsiOverbought = rsiValue > 70;
  const macdBullish = macdValue > 0;
  const priceNearLower = prices[prices.length - 1] < bollingerBands.lower * 1.02;
  const priceNearUpper = prices[prices.length - 1] > bollingerBands.upper * 0.98;

  // Buy signal: RSI oversold + MACD bullish + price near lower band
  if (rsiOversold && macdBullish && priceNearLower) {
    signal = "buy";
    confidence = Math.min(0.95, confidence + 0.3);
    reasoning = `RL BUY: RSI oversold (${rsiValue.toFixed(0)}), MACD bullish, price near lower Bollinger Band`;
  }
  // Sell signal: RSI overbought + MACD bearish + price near upper band
  else if (rsiOverbought && !macdBullish && priceNearUpper) {
    signal = "sell";
    confidence = Math.min(0.95, confidence + 0.3);
    reasoning = `RL SELL: RSI overbought (${rsiValue.toFixed(0)}), MACD bearish, price near upper Bollinger Band`;
  } else {
    reasoning = `RL holding: RSI=${rsiValue.toFixed(0)}, MACD=${macdValue > 0 ? "bullish" : "bearish"}`;
  }

  return {
    action: signal,
    confidence,
    reasoning,
    stopLoss: 2,
    takeProfit: 5,
  };
}

/**
 * COMPOSITE STRATEGY
 * Combines multiple strategies for better signal quality
 */
export function compositeStrategy(
  prices: number[],
  state: StrategyState,
  rsiValue: number,
  macdValue: number,
  bollingerBands: { upper: number; lower: number; middle: number }
): TradeSignal {
  // Get signals from all strategies
  const momentumSignal = improvedMomentumStrategy(prices, state);
  const meanReversionSignal = improvedMeanReversionStrategy(prices, state);
  const rlSignal = improvedRLStrategy(prices, rsiValue, macdValue, bollingerBands);

  // Vote on the best signal
  const buyVotes = [
    momentumSignal.action === "buy" ? 1 : 0,
    meanReversionSignal.action === "buy" ? 1 : 0,
    rlSignal.action === "buy" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const sellVotes = [
    momentumSignal.action === "sell" ? 1 : 0,
    meanReversionSignal.action === "sell" ? 1 : 0,
    rlSignal.action === "sell" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  let signal: "buy" | "sell" | "hold" = "hold";
  let confidence = 0;
  let reasoning = "";

  // Require at least 2 out of 3 strategies to agree
  if (buyVotes >= 2) {
    signal = "buy";
    confidence = 0.5 + (buyVotes * 0.15);
    reasoning = `Composite BUY: ${buyVotes}/3 strategies agree (Momentum: ${momentumSignal.action}, MeanRev: ${meanReversionSignal.action}, RL: ${rlSignal.action})`;
  } else if (sellVotes >= 2) {
    signal = "sell";
    confidence = 0.5 + (sellVotes * 0.15);
    reasoning = `Composite SELL: ${sellVotes}/3 strategies agree (Momentum: ${momentumSignal.action}, MeanRev: ${meanReversionSignal.action}, RL: ${rlSignal.action})`;
  } else {
    reasoning = `No consensus: Momentum=${momentumSignal.action}, MeanRev=${meanReversionSignal.action}, RL=${rlSignal.action}`;
  }

  return {
    action: signal,
    confidence: Math.min(0.95, confidence),
    reasoning,
    stopLoss: 2.5,
    takeProfit: 4.5,
  };
}

/**
 * Calculate technical indicators
 */
export function calculateTechnicalIndicators(prices: number[]): {
  rsi: number;
  macd: number;
  bollingerBands: { upper: number; lower: number; middle: number };
  trend: "up" | "down" | "neutral";
} {
  // RSI (14-period)
  const rsi = calculateRSI(prices, 14);

  // MACD
  const macd = calculateMACD(prices);

  // Bollinger Bands (20-period, 2 std dev)
  const bollingerBands = calculateBollingerBands(prices, 20, 2);

  // Trend
  const trend = calculateTrend(prices);

  return { rsi, macd, bollingerBands, trend };
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const gains = changes.filter((c) => c > 0).reduce((a, b) => a + b, 0) / period;
  const losses = Math.abs(changes.filter((c) => c < 0).reduce((a, b) => a + b, 0)) / period;

  const rs = gains / (losses || 1);
  return 100 - 100 / (1 + rs);
}

function calculateMACD(prices: number[]): number {
  if (prices.length < 26) return 0;

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  return ema12 - ema26;
}

function calculateEMA(prices: number[], period: number): number {
  const multiplier = 2 / (period + 1);
  let ema = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * multiplier + ema * (1 - multiplier);
  }

  return ema;
}

function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): { upper: number; lower: number; middle: number } {
  if (prices.length < period) {
    return { upper: 0, lower: 0, middle: 0 };
  }

  const recentPrices = prices.slice(-period);
  const middle = recentPrices.reduce((a, b) => a + b, 0) / period;
  const variance =
    recentPrices.reduce((sum, p) => sum + Math.pow(p - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    middle,
    upper: middle + stdDev * stdDevMultiplier,
    lower: middle - stdDev * stdDevMultiplier,
  };
}

function calculateTrend(prices: number[]): "up" | "down" | "neutral" {
  if (prices.length < 20) return "neutral";

  const recentPrices = prices.slice(-20);
  const firstPrice = recentPrices[0];
  const lastPrice = recentPrices[recentPrices.length - 1];
  const change = ((lastPrice - firstPrice) / firstPrice) * 100;

  if (change > 2) return "up";
  if (change < -2) return "down";
  return "neutral";
}
