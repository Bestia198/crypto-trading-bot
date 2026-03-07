/**
 * Multi-Timeframe Analysis Service
 * Analyzes price data across multiple timeframes for better signal confirmation
 */

import { AdvancedIndicatorEnsemble, EnsembleResult } from './advancedIndicatorEnsemble';
import { PriceData } from './technicalIndicators';

export interface TimeframeSignal {
  timeframe: '1h' | '4h' | '1d';
  signal: EnsembleResult;
  strength: number;
}

export interface MultiTimeframeResult {
  signals: TimeframeSignal[];
  finalSignal: -1 | 0 | 1;
  confidence: number;
  alignment: number; // 0-1: how aligned are the signals
  recommendation: string;
  details: string;
}

/**
 * Multi-Timeframe Analysis
 * Combines signals from multiple timeframes for better accuracy
 */
export class MultiTimeframeAnalysis {
  private ensembles: Map<string, AdvancedIndicatorEnsemble> = new Map();
  private priceHistory: Map<string, PriceData[]> = new Map();

  constructor() {
    this.ensembles.set('1h', new AdvancedIndicatorEnsemble());
    this.ensembles.set('4h', new AdvancedIndicatorEnsemble());
    this.ensembles.set('1d', new AdvancedIndicatorEnsemble());
  }

  /**
   * Analyze across multiple timeframes
   */
  analyzeMultiTimeframe(
    data1h: PriceData[],
    data4h: PriceData[],
    data1d: PriceData[]
  ): MultiTimeframeResult {
    // Get prices from data
    const prices1h = data1h.map(d => d.close);
    const prices4h = data4h.map(d => d.close);
    const prices1d = data1d.map(d => d.close);

    // Store history
    this.priceHistory.set('1h', data1h);
    this.priceHistory.set('4h', data4h);
    this.priceHistory.set('1d', data1d);

    // Get ensemble signals for each timeframe
    const signal1h = this.ensembles.get('1h')!.analyzeEnsemble(data1h, prices1h);
    const signal4h = this.ensembles.get('4h')!.analyzeEnsemble(data4h, prices4h);
    const signal1d = this.ensembles.get('1d')!.analyzeEnsemble(data1d, prices1d);

    // Create timeframe signals
    const signals: TimeframeSignal[] = [
      { timeframe: '1h', signal: signal1h, strength: signal1h.confidence },
      { timeframe: '4h', signal: signal4h, strength: signal4h.confidence },
      { timeframe: '1d', signal: signal1d, strength: signal1d.confidence },
    ];

    // Calculate alignment and final signal
    const result = this.calculateMultiTimeframeSignal(signals);

    return result;
  }

  /**
   * Calculate final signal from multiple timeframes
   */
  private calculateMultiTimeframeSignal(signals: TimeframeSignal[]): MultiTimeframeResult {
    // Weight signals by timeframe importance
    const weights = {
      '1h': 0.30,
      '4h': 0.35,
      '1d': 0.35,
    };

    // Calculate weighted votes
    let buyVotes = 0;
    let sellVotes = 0;
    let totalWeight = 0;
    let alignmentScore = 0;

    for (const ts of signals) {
      const weight = weights[ts.timeframe];
      const signal = ts.signal;

      if (signal.finalSignal === 1) {
        buyVotes += weight * signal.confidence;
      } else if (signal.finalSignal === -1) {
        sellVotes += weight * signal.confidence;
      }

      totalWeight += weight;
    }

    // Check alignment (how many signals agree)
    const buySignals = signals.filter(s => s.signal.finalSignal === 1).length;
    const sellSignals = signals.filter(s => s.signal.finalSignal === -1).length;
    const holdSignals = signals.filter(s => s.signal.finalSignal === 0).length;

    alignmentScore = Math.max(buySignals, sellSignals, holdSignals) / signals.length;

    // Determine final signal
    let finalSignal: -1 | 0 | 1 = 0;
    let confidence = 0;
    let recommendation = '';
    let details = '';

    if (buyVotes > sellVotes * 1.3 && alignmentScore > 0.5) {
      finalSignal = 1;
      confidence = Math.min(1, buyVotes / totalWeight);
      recommendation = `STRONG BUY - Multiple timeframes aligned`;
      details = this.generateDetails(signals, 'BUY');
    } else if (sellVotes > buyVotes * 1.3 && alignmentScore > 0.5) {
      finalSignal = -1;
      confidence = Math.min(1, sellVotes / totalWeight);
      recommendation = `STRONG SELL - Multiple timeframes aligned`;
      details = this.generateDetails(signals, 'SELL');
    } else if (buyVotes > sellVotes && alignmentScore > 0.4) {
      finalSignal = 1;
      confidence = Math.min(1, (buyVotes - sellVotes) / totalWeight);
      recommendation = `BUY - Majority of timeframes bullish`;
      details = this.generateDetails(signals, 'BUY');
    } else if (sellVotes > buyVotes && alignmentScore > 0.4) {
      finalSignal = -1;
      confidence = Math.min(1, (sellVotes - buyVotes) / totalWeight);
      recommendation = `SELL - Majority of timeframes bearish`;
      details = this.generateDetails(signals, 'SELL');
    } else {
      finalSignal = 0;
      confidence = 0.5;
      recommendation = `HOLD - Mixed signals across timeframes`;
      details = this.generateDetails(signals, 'HOLD');
    }

    return {
      signals,
      finalSignal,
      confidence,
      alignment: alignmentScore,
      recommendation,
      details,
    };
  }

  /**
   * Generate detailed explanation
   */
  private generateDetails(signals: TimeframeSignal[], action: string): string {
    const details: string[] = [];

    for (const ts of signals) {
      const signal = ts.signal;
      const marketRegime = signal.marketRegime;
      const confidence = (signal.confidence * 100).toFixed(0);

      details.push(
        `${ts.timeframe}: ${signal.recommendation} (${marketRegime} market, ${confidence}% confidence)`
      );
    }

    return details.join(' | ');
  }

  /**
   * Get timeframe hierarchy signal
   * Higher timeframes have more weight in decision making
   */
  getTimeframeHierarchy(signals: TimeframeSignal[]): {
    hierarchy: string;
    strength: number;
  } {
    // Check if higher timeframes align
    const signal1d = signals.find(s => s.timeframe === '1d')?.signal.finalSignal;
    const signal4h = signals.find(s => s.timeframe === '4h')?.signal.finalSignal;
    const signal1h = signals.find(s => s.timeframe === '1h')?.signal.finalSignal;

    let hierarchy = '';
    let strength = 0;

    if (signal1d === signal4h && signal4h === signal1h) {
      hierarchy = 'PERFECT_ALIGNMENT';
      strength = 1.0;
    } else if (signal1d === signal4h) {
      hierarchy = 'STRONG_ALIGNMENT';
      strength = 0.85;
    } else if (signal4h === signal1h) {
      hierarchy = 'MEDIUM_ALIGNMENT';
      strength = 0.7;
    } else {
      hierarchy = 'WEAK_ALIGNMENT';
      strength = 0.5;
    }

    return { hierarchy, strength };
  }

  /**
   * Detect timeframe divergence
   */
  detectDivergence(signals: TimeframeSignal[]): {
    hasDivergence: boolean;
    type: 'bullish' | 'bearish' | 'none';
    description: string;
  } {
    const signal1d = signals.find(s => s.timeframe === '1d')?.signal.finalSignal;
    const signal4h = signals.find(s => s.timeframe === '4h')?.signal.finalSignal;
    const signal1h = signals.find(s => s.timeframe === '1h')?.signal.finalSignal;

    // Bullish divergence: Higher timeframe bearish, lower timeframe bullish
    if (signal1d === -1 && signal1h === 1) {
      return {
        hasDivergence: true,
        type: 'bullish',
        description: 'Daily bearish but 1h bullish - potential reversal',
      };
    }

    // Bearish divergence: Higher timeframe bullish, lower timeframe bearish
    if (signal1d === 1 && signal1h === -1) {
      return {
        hasDivergence: true,
        type: 'bearish',
        description: 'Daily bullish but 1h bearish - potential pullback',
      };
    }

    return {
      hasDivergence: false,
      type: 'none',
      description: 'No timeframe divergence detected',
    };
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ensembleCount: this.ensembles.size,
      priceHistorySize: this.priceHistory.size,
      timeframes: Array.from(this.ensembles.keys()),
    };
  }
}
