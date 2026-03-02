/**
 * Advanced Indicator Ensemble System
 * Combines multiple indicators with intelligent weighting for better trading signals
 */

import {
  calculateAllIndicators,
  PriceData,
} from './technicalIndicators';

export interface IndicatorSignal {
  indicator: string;
  signal: -1 | 0 | 1; // -1: sell, 0: hold, 1: buy
  strength: number; // 0-1
  confidence: number; // 0-1
  reasoning: string;
}

export interface EnsembleResult {
  finalSignal: -1 | 0 | 1;
  confidence: number;
  signals: IndicatorSignal[];
  weights: Record<string, number>;
  marketRegime: 'trend' | 'range' | 'volatile';
  recommendation: string;
}

/**
 * Advanced Indicator Ensemble
 * Uses voting system with adaptive weights
 */
export class AdvancedIndicatorEnsemble {
  private readonly baseWeights: Record<string, number> = {
    rsi: 0.15,
    macd: 0.20,
    bollingerBands: 0.15,
    stochastic: 0.15,
    ema: 0.15,
    atr: 0.10,
    divergence: 0.10,
  };

  private priceHistory: number[] = [];
  private indicatorHistory: any[] = [];

  /**
   * Analyze price data and generate ensemble signal
   */
  analyzeEnsemble(data: PriceData[], prices: number[]): EnsembleResult {
    // Store history for divergence detection
    this.priceHistory = prices;

    // Calculate all indicators
    const indicators = calculateAllIndicators(data, prices);
    this.indicatorHistory.push(indicators);

    // Generate individual signals
    const signals: IndicatorSignal[] = [];

    // RSI Signal
    signals.push(this.getRSISignal(indicators.rsi));

    // MACD Signal
    signals.push(this.getMACDSignal(indicators.macd));

    // Bollinger Bands Signal
    signals.push(this.getBollingerSignal(indicators.bollingerBands, prices[prices.length - 1]));

    // Stochastic Signal
    signals.push(this.getStochasticSignal(indicators.stochastic));

    // EMA Signal
    signals.push(this.getEMASignal(indicators.ema12, indicators.ema26, indicators.sma20));

    // ATR Signal (volatility-based)
    signals.push(this.getATRSignal(indicators.atr, indicators.bollingerBands.middle));

    // Divergence Signal
    signals.push(this.getDivergenceSignal(indicators, prices));

    // Detect market regime
    const marketRegime = this.detectMarketRegime(indicators);

    // Adjust weights based on market regime
    const adjustedWeights = this.adjustWeightsForRegime(marketRegime);

    // Calculate ensemble signal
    const result = this.calculateEnsembleSignal(signals, adjustedWeights, marketRegime);

    return result;
  }

  /**
   * RSI Signal Generation
   */
  private getRSISignal(rsi: number): IndicatorSignal {
    let signal: -1 | 0 | 1 = 0;
    let strength = 0;
    let confidence = 0;
    let reasoning = '';

    if (rsi < 30) {
      signal = 1; // Oversold - BUY
      strength = (30 - rsi) / 30;
      confidence = Math.min(0.9, strength * 1.2);
      reasoning = `RSI oversold at ${rsi.toFixed(2)}`;
    } else if (rsi > 70) {
      signal = -1; // Overbought - SELL
      strength = (rsi - 70) / 30;
      confidence = Math.min(0.9, strength * 1.2);
      reasoning = `RSI overbought at ${rsi.toFixed(2)}`;
    } else if (rsi > 50) {
      signal = 1; // Bullish
      strength = (rsi - 50) / 50;
      confidence = strength * 0.6;
      reasoning = `RSI bullish at ${rsi.toFixed(2)}`;
    } else {
      signal = -1; // Bearish
      strength = (50 - rsi) / 50;
      confidence = strength * 0.6;
      reasoning = `RSI bearish at ${rsi.toFixed(2)}`;
    }

    return { indicator: 'RSI', signal, strength, confidence, reasoning };
  }

  /**
   * MACD Signal Generation
   */
  private getMACDSignal(macd: { line: number; signal: number; histogram: number }): IndicatorSignal {
    let signal: -1 | 0 | 1 = 0;
    let strength = 0;
    let confidence = 0;
    let reasoning = '';

    if (macd.histogram > 0 && macd.line > macd.signal) {
      signal = 1; // Bullish crossover
      strength = Math.min(1, Math.abs(macd.histogram) * 10);
      confidence = 0.7 + strength * 0.2;
      reasoning = `MACD bullish histogram: ${macd.histogram.toFixed(4)}`;
    } else if (macd.histogram < 0 && macd.line < macd.signal) {
      signal = -1; // Bearish crossover
      strength = Math.min(1, Math.abs(macd.histogram) * 10);
      confidence = 0.7 + strength * 0.2;
      reasoning = `MACD bearish histogram: ${macd.histogram.toFixed(4)}`;
    } else {
      signal = 0; // Neutral
      confidence = 0.3;
      reasoning = 'MACD neutral';
    }

    return { indicator: 'MACD', signal, strength, confidence, reasoning };
  }

  /**
   * Bollinger Bands Signal Generation
   */
  private getBollingerSignal(
    bb: { upper: number; middle: number; lower: number },
    currentPrice: number
  ): IndicatorSignal {
    let signal: -1 | 0 | 1 = 0;
    let strength = 0;
    let confidence = 0;
    let reasoning = '';

    const bbRange = bb.upper - bb.lower;
    const pricePosition = (currentPrice - bb.lower) / bbRange;

    if (currentPrice < bb.lower) {
      signal = 1; // Price below lower band - BUY
      strength = (bb.lower - currentPrice) / bbRange;
      confidence = 0.8;
      reasoning = `Price below lower Bollinger Band`;
    } else if (currentPrice > bb.upper) {
      signal = -1; // Price above upper band - SELL
      strength = (currentPrice - bb.upper) / bbRange;
      confidence = 0.8;
      reasoning = `Price above upper Bollinger Band`;
    } else if (pricePosition < 0.3) {
      signal = 1; // Near lower band
      strength = 0.3 - pricePosition;
      confidence = 0.6;
      reasoning = `Price near lower Bollinger Band`;
    } else if (pricePosition > 0.7) {
      signal = -1; // Near upper band
      strength = pricePosition - 0.7;
      confidence = 0.6;
      reasoning = `Price near upper Bollinger Band`;
    } else {
      signal = 0;
      confidence = 0.4;
      reasoning = 'Price in middle of Bollinger Bands';
    }

    return { indicator: 'BollingerBands', signal, strength, confidence, reasoning };
  }

  /**
   * Stochastic Signal Generation
   */
  private getStochasticSignal(stochastic: { k: number; d: number }): IndicatorSignal {
    let signal: -1 | 0 | 1 = 0;
    let strength = 0;
    let confidence = 0;
    let reasoning = '';

    if (stochastic.k < 20) {
      signal = 1; // Oversold
      strength = (20 - stochastic.k) / 20;
      confidence = 0.7;
      reasoning = `Stochastic oversold at ${stochastic.k.toFixed(2)}`;
    } else if (stochastic.k > 80) {
      signal = -1; // Overbought
      strength = (stochastic.k - 80) / 20;
      confidence = 0.7;
      reasoning = `Stochastic overbought at ${stochastic.k.toFixed(2)}`;
    } else if (stochastic.k > stochastic.d && stochastic.k < 50) {
      signal = 1; // Bullish crossover
      strength = 0.5;
      confidence = 0.6;
      reasoning = `Stochastic bullish crossover`;
    } else if (stochastic.k < stochastic.d && stochastic.k > 50) {
      signal = -1; // Bearish crossover
      strength = 0.5;
      confidence = 0.6;
      reasoning = `Stochastic bearish crossover`;
    } else {
      signal = 0;
      confidence = 0.3;
      reasoning = 'Stochastic neutral';
    }

    return { indicator: 'Stochastic', signal, strength, confidence, reasoning };
  }

  /**
   * EMA Signal Generation
   */
  private getEMASignal(ema12: number, ema26: number, sma20: number): IndicatorSignal {
    let signal: -1 | 0 | 1 = 0;
    let strength = 0;
    let confidence = 0;
    let reasoning = '';

    const emaDiff = ema12 - ema26;
    const emaDiffPercent = Math.abs(emaDiff) / ema26;

    if (ema12 > ema26 && ema26 > sma20) {
      signal = 1; // Strong uptrend
      strength = Math.min(1, emaDiffPercent * 100);
      confidence = 0.8;
      reasoning = `EMA12 > EMA26 > SMA20 - Strong uptrend`;
    } else if (ema12 < ema26 && ema26 < sma20) {
      signal = -1; // Strong downtrend
      strength = Math.min(1, emaDiffPercent * 100);
      confidence = 0.8;
      reasoning = `EMA12 < EMA26 < SMA20 - Strong downtrend`;
    } else if (ema12 > ema26) {
      signal = 1; // Weak uptrend
      strength = emaDiffPercent * 0.5;
      confidence = 0.6;
      reasoning = `EMA12 > EMA26 - Weak uptrend`;
    } else if (ema12 < ema26) {
      signal = -1; // Weak downtrend
      strength = emaDiffPercent * 0.5;
      confidence = 0.6;
      reasoning = `EMA12 < EMA26 - Weak downtrend`;
    } else {
      signal = 0;
      confidence = 0.3;
      reasoning = 'EMA neutral';
    }

    return { indicator: 'EMA', signal, strength, confidence, reasoning };
  }

  /**
   * ATR Signal Generation (Volatility-based)
   */
  private getATRSignal(atr: number, middleBB: number): IndicatorSignal {
    const atrPercent = (atr / middleBB) * 100;
    let signal: -1 | 0 | 1 = 0;
    let strength = 0;
    let confidence = 0;
    let reasoning = '';

    if (atrPercent > 3) {
      signal = 0; // High volatility - wait for clearer signal
      strength = 0;
      confidence = 0.3;
      reasoning = `High volatility (ATR ${atrPercent.toFixed(2)}%) - wait for confirmation`;
    } else if (atrPercent < 1) {
      signal = 0; // Low volatility - potential breakout coming
      strength = 0;
      confidence = 0.4;
      reasoning = `Low volatility (ATR ${atrPercent.toFixed(2)}%) - potential breakout`;
    } else {
      signal = 0;
      confidence = 0.5;
      reasoning = `Normal volatility (ATR ${atrPercent.toFixed(2)}%)`;
    }

    return { indicator: 'ATR', signal, strength, confidence, reasoning };
  }

  /**
   * Divergence Signal Generation
   */
  private getDivergenceSignal(indicators: any, prices: number[]): IndicatorSignal {
    let signal: -1 | 0 | 1 = 0;
    let strength = 0;
    let confidence = 0;
    let reasoning = '';

    if (this.indicatorHistory.length < 2) {
      return { indicator: 'Divergence', signal: 0, strength: 0, confidence: 0, reasoning: 'Not enough history' };
    }

    const prevIndicators = this.indicatorHistory[this.indicatorHistory.length - 2];
    const currentPrice = prices[prices.length - 1];
    const prevPrice = prices[prices.length - 2];

    // Bullish divergence: Price lower but RSI higher
    if (currentPrice < prevPrice && indicators.rsi > prevIndicators.rsi) {
      signal = 1;
      strength = Math.min(1, (indicators.rsi - prevIndicators.rsi) / 10);
      confidence = 0.7;
      reasoning = 'Bullish divergence detected';
    }
    // Bearish divergence: Price higher but RSI lower
    else if (currentPrice > prevPrice && indicators.rsi < prevIndicators.rsi) {
      signal = -1;
      strength = Math.min(1, (prevIndicators.rsi - indicators.rsi) / 10);
      confidence = 0.7;
      reasoning = 'Bearish divergence detected';
    } else {
      signal = 0;
      confidence = 0.3;
      reasoning = 'No divergence detected';
    }

    return { indicator: 'Divergence', signal, strength, confidence, reasoning };
  }

  /**
   * Detect market regime
   */
  private detectMarketRegime(indicators: any): 'trend' | 'range' | 'volatile' {
    const emaDiff = Math.abs(indicators.ema12 - indicators.ema26);
    const emaDiffPercent = emaDiff / indicators.ema26;
    const atrPercent = (indicators.atr / indicators.bollingerBands.middle) * 100;

    if (atrPercent > 2.5) {
      return 'volatile';
    } else if (emaDiffPercent > 0.02) {
      return 'trend';
    } else {
      return 'range';
    }
  }

  /**
   * Adjust weights based on market regime
   */
  private adjustWeightsForRegime(regime: 'trend' | 'range' | 'volatile'): Record<string, number> {
    const weights = { ...this.baseWeights };

    switch (regime) {
      case 'trend':
        // In trending markets, EMA and MACD are more reliable
        weights.ema = 0.25;
        weights.macd = 0.25;
        weights.rsi = 0.10;
        weights.bollingerBands = 0.10;
        break;
      case 'range':
        // In ranging markets, RSI and Stochastic are more reliable
        weights.rsi = 0.25;
        weights.stochastic = 0.25;
        weights.bollingerBands = 0.20;
        weights.ema = 0.10;
        break;
      case 'volatile':
        // In volatile markets, use all indicators equally
        weights.rsi = 0.15;
        weights.macd = 0.15;
        weights.bollingerBands = 0.20;
        weights.stochastic = 0.15;
        weights.ema = 0.15;
        weights.atr = 0.15;
        break;
    }

    // Normalize weights
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    for (const key in weights) {
      weights[key] = weights[key] / sum;
    }

    return weights;
  }

  /**
   * Calculate ensemble signal from individual signals
   */
  private calculateEnsembleSignal(
    signals: IndicatorSignal[],
    weights: Record<string, number>,
    marketRegime: 'trend' | 'range' | 'volatile'
  ): EnsembleResult {
    // Weighted voting
    let buyVotes = 0;
    let sellVotes = 0;
    let totalConfidence = 0;

    for (const signal of signals) {
      const weight = weights[signal.indicator] || 0.1;
      const weightedConfidence = signal.confidence * weight;

      if (signal.signal === 1) {
        buyVotes += weightedConfidence;
      } else if (signal.signal === -1) {
        sellVotes += weightedConfidence;
      }

      totalConfidence += weightedConfidence;
    }

    // Determine final signal
    let finalSignal: -1 | 0 | 1 = 0;
    let confidence = 0;
    let recommendation = '';

    if (buyVotes > sellVotes * 1.2) {
      finalSignal = 1;
      confidence = Math.min(1, buyVotes / totalConfidence);
      recommendation = `STRONG BUY (${(confidence * 100).toFixed(1)}% confidence)`;
    } else if (sellVotes > buyVotes * 1.2) {
      finalSignal = -1;
      confidence = Math.min(1, sellVotes / totalConfidence);
      recommendation = `STRONG SELL (${(confidence * 100).toFixed(1)}% confidence)`;
    } else if (buyVotes > sellVotes) {
      finalSignal = 1;
      confidence = Math.min(1, (buyVotes - sellVotes) / totalConfidence);
      recommendation = `BUY (${(confidence * 100).toFixed(1)}% confidence)`;
    } else if (sellVotes > buyVotes) {
      finalSignal = -1;
      confidence = Math.min(1, (sellVotes - buyVotes) / totalConfidence);
      recommendation = `SELL (${(confidence * 100).toFixed(1)}% confidence)`;
    } else {
      finalSignal = 0;
      confidence = 0.5;
      recommendation = 'HOLD (conflicting signals)';
    }

    return {
      finalSignal,
      confidence,
      signals,
      weights,
      marketRegime,
      recommendation,
    };
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics() {
    return {
      historySize: this.indicatorHistory.length,
      priceHistorySize: this.priceHistory.length,
      baseWeights: this.baseWeights,
    };
  }
}
