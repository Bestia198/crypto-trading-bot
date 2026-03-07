/**
 * Technical Indicators Service
 * Provides advanced technical analysis for trading signals
 */

export interface PriceData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: { line: number; signal: number; histogram: number };
  bollingerBands: { upper: number; middle: number; lower: number };
  atr: number;
  stochastic: { k: number; d: number };
  ema12: number;
  ema26: number;
  sma20: number;
  sma50: number;
}

/**
 * Calculate RSI (Relative Strength Index)
 * Measures momentum and overbought/oversold conditions
 * Range: 0-100 (>70 = overbought, <30 = oversold)
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * Identifies trend changes and momentum
 */
export function calculateMACD(
  prices: number[],
  fast: number = 12,
  slow: number = 26,
  signal: number = 9
): { line: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, fast);
  const ema26 = calculateEMA(prices, slow);
  const macdLine = ema12 - ema26;

  // Calculate signal line (EMA of MACD)
  const macdValues = [];
  for (let i = Math.max(slow - 1, 0); i < prices.length; i++) {
    const e12 = calculateEMA(prices.slice(0, i + 1), fast);
    const e26 = calculateEMA(prices.slice(0, i + 1), slow);
    macdValues.push(e12 - e26);
  }

  const signalLine = calculateEMA(macdValues, signal);
  const histogram = macdLine - signalLine;

  return { line: macdLine, signal: signalLine, histogram };
}

/**
 * Calculate Bollinger Bands
 * Identifies volatility and support/resistance levels
 */
export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number; middle: number; lower: number } {
  const sma = calculateSMA(prices, period);
  const variance =
    prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
  const std = Math.sqrt(variance);

  return {
    upper: sma + std * stdDev,
    middle: sma,
    lower: sma - std * stdDev,
  };
}

/**
 * Calculate ATR (Average True Range)
 * Measures volatility
 */
export function calculateATR(
  data: PriceData[],
  period: number = 14
): number {
  if (data.length < period) return 0;

  const trueRanges = [];
  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
  return atr;
}

/**
 * Calculate Stochastic Oscillator
 * Identifies overbought/oversold conditions
 */
export function calculateStochastic(
  data: PriceData[],
  period: number = 14,
  smoothK: number = 3,
  smoothD: number = 3
): { k: number; d: number } {
  if (data.length < period) return { k: 50, d: 50 };

  const recentData = data.slice(-period);
  const high = Math.max(...recentData.map(d => d.high));
  const low = Math.min(...recentData.map(d => d.low));
  const close = data[data.length - 1].close;

  const k = high === low ? 50 : ((close - low) / (high - low)) * 100;

  // Smooth K
  const kValues = [];
  for (let i = period; i < data.length; i++) {
    const h = Math.max(...data.slice(i - period, i).map(d => d.high));
    const l = Math.min(...data.slice(i - period, i).map(d => d.low));
    const c = data[i].close;
    kValues.push(h === l ? 50 : ((c - l) / (h - l)) * 100);
  }

  const smoothedK = calculateSMA(kValues.slice(-smoothK), smoothK);
  const smoothedD = calculateSMA(kValues.slice(-smoothD), smoothD);

  return { k: smoothedK, d: smoothedD };
}

/**
 * Calculate EMA (Exponential Moving Average)
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];

  const k = 2 / (period + 1);
  let ema = calculateSMA(prices.slice(0, period), period);

  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return ema;
}

/**
 * Calculate SMA (Simple Moving Average)
 */
export function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];

  const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

/**
 * Calculate all technical indicators
 */
export function calculateAllIndicators(
  data: PriceData[],
  prices: number[]
): TechnicalIndicators {
  return {
    rsi: calculateRSI(prices, 14),
    macd: calculateMACD(prices, 12, 26, 9),
    bollingerBands: calculateBollingerBands(prices, 20, 2),
    atr: calculateATR(data, 14),
    stochastic: calculateStochastic(data, 14, 3, 3),
    ema12: calculateEMA(prices, 12),
    ema26: calculateEMA(prices, 26),
    sma20: calculateSMA(prices, 20),
    sma50: calculateSMA(prices, 50),
  };
}

/**
 * Generate trading signal based on indicators
 * Returns: 1 = BUY, -1 = SELL, 0 = HOLD
 */
export function generateSignal(indicators: TechnicalIndicators): number {
  let signal = 0;
  let confidence = 0;

  // RSI signals
  if (indicators.rsi < 30) {
    signal += 1;
    confidence += 0.2;
  } else if (indicators.rsi > 70) {
    signal -= 1;
    confidence += 0.2;
  }

  // MACD signals
  if (indicators.macd.histogram > 0 && indicators.macd.line > indicators.macd.signal) {
    signal += 1;
    confidence += 0.2;
  } else if (indicators.macd.histogram < 0 && indicators.macd.line < indicators.macd.signal) {
    signal -= 1;
    confidence += 0.2;
  }

  // Bollinger Bands signals
  const currentPrice = (indicators.bollingerBands.upper + indicators.bollingerBands.lower) / 2;
  if (currentPrice < indicators.bollingerBands.lower) {
    signal += 1;
    confidence += 0.2;
  } else if (currentPrice > indicators.bollingerBands.upper) {
    signal -= 1;
    confidence += 0.2;
  }

  // Stochastic signals
  if (indicators.stochastic.k < 20) {
    signal += 1;
    confidence += 0.2;
  } else if (indicators.stochastic.k > 80) {
    signal -= 1;
    confidence += 0.2;
  }

  // EMA trend signals
  if (indicators.ema12 > indicators.ema26) {
    signal += 1;
    confidence += 0.2;
  } else {
    signal -= 1;
    confidence += 0.2;
  }

  // Normalize signal: -1 (SELL), 0 (HOLD), 1 (BUY)
  return signal > 0 ? 1 : signal < 0 ? -1 : 0;
}

/**
 * Calculate signal confidence (0-1)
 */
export function calculateSignalConfidence(indicators: TechnicalIndicators): number {
  let confidence = 0;
  let count = 0;

  // RSI confidence
  if (indicators.rsi < 30 || indicators.rsi > 70) {
    confidence += 0.2;
    count++;
  }

  // MACD confidence
  if (Math.abs(indicators.macd.histogram) > 0.01) {
    confidence += 0.2;
    count++;
  }

  // Bollinger Bands confidence
  if (indicators.bollingerBands.upper > indicators.bollingerBands.lower) {
    confidence += 0.2;
    count++;
  }

  // Stochastic confidence
  if (indicators.stochastic.k < 20 || indicators.stochastic.k > 80) {
    confidence += 0.2;
    count++;
  }

  // EMA trend confidence
  if (Math.abs(indicators.ema12 - indicators.ema26) > 0.01) {
    confidence += 0.2;
    count++;
  }

  return count > 0 ? confidence / count : 0.5;
}
