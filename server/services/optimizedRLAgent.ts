/**
 * Optimized RL Agent with Advanced Learning
 * Implements Q-learning with experience replay and target networks
 */

import {
  calculateAllIndicators,
  generateSignal,
  calculateSignalConfidence,
  PriceData,
  TechnicalIndicators,
} from './technicalIndicators';

export interface AgentState {
  rsi: number;
  macdHistogram: number;
  bollingerPosition: number; // -1 to 1
  stochasticK: number;
  trendStrength: number;
  volatility: number;
  recentProfit: number;
  winRate: number;
}

export interface Experience {
  state: AgentState;
  action: number; // -1 (SELL), 0 (HOLD), 1 (BUY)
  reward: number;
  nextState: AgentState;
  done: boolean;
}

export class OptimizedRLAgent {
  private qTable: Map<string, number[]> = new Map();
  private experienceReplay: Experience[] = [];
  private maxReplaySize: number = 10000;
  private learningRate: number = 0.1;
  private discountFactor: number = 0.95;
  private epsilon: number = 0.1; // Exploration rate
  private epsilonDecay: number = 0.995;
  private minEpsilon: number = 0.01;
  private updateCounter: number = 0;
  private targetUpdateFrequency: number = 100;
  private targetQTable: Map<string, number[]> = new Map();

  constructor(
    learningRate: number = 0.1,
    discountFactor: number = 0.95,
    epsilon: number = 0.1
  ) {
    this.learningRate = learningRate;
    this.discountFactor = discountFactor;
    this.epsilon = epsilon;
  }

  /**
   * Convert state to string key for Q-table lookup
   */
  private stateToKey(state: AgentState): string {
    return JSON.stringify({
      rsi: Math.round(state.rsi / 5) * 5,
      macdHistogram: Math.round(state.macdHistogram * 100) / 100,
      bollingerPosition: Math.round(state.bollingerPosition * 10) / 10,
      stochasticK: Math.round(state.stochasticK / 5) * 5,
      trendStrength: Math.round(state.trendStrength * 10) / 10,
      volatility: Math.round(state.volatility * 10) / 10,
    });
  }

  /**
   * Extract state from price data and indicators
   */
  private extractState(
    indicators: TechnicalIndicators,
    recentProfit: number,
    winRate: number
  ): AgentState {
    const bollingerPosition =
      (indicators.bollingerBands.middle - indicators.bollingerBands.lower) /
      (indicators.bollingerBands.upper - indicators.bollingerBands.lower) * 2 - 1;

    return {
      rsi: indicators.rsi,
      macdHistogram: indicators.macd.histogram,
      bollingerPosition,
      stochasticK: indicators.stochastic.k,
      trendStrength: (indicators.ema12 - indicators.ema26) / indicators.ema26,
      volatility: indicators.atr / indicators.bollingerBands.middle,
      recentProfit,
      winRate,
    };
  }

  /**
   * Select action using epsilon-greedy strategy
   */
  selectAction(state: AgentState, training: boolean = true): number {
    const key = this.stateToKey(state);
    const useExploration = training && Math.random() < this.epsilon;

    if (useExploration) {
      // Explore: random action
      return [-1, 0, 1][Math.floor(Math.random() * 3)];
    }

    // Exploit: best action from Q-table
    if (!this.qTable.has(key)) {
      this.qTable.set(key, [0, 0, 0]); // Initialize Q-values for [SELL, HOLD, BUY]
    }

    const qValues = this.qTable.get(key)!;
    const maxQ = Math.max(...qValues);
    const bestActions = qValues
      .map((q, i) => (q === maxQ ? i - 1 : null))
      .filter(a => a !== null);

    return bestActions[Math.floor(Math.random() * bestActions.length)] as number;
  }

  /**
   * Store experience in replay buffer
   */
  storeExperience(
    state: AgentState,
    action: number,
    reward: number,
    nextState: AgentState,
    done: boolean
  ): void {
    this.experienceReplay.push({ state, action, reward, nextState, done });

    if (this.experienceReplay.length > this.maxReplaySize) {
      this.experienceReplay.shift();
    }
  }

  /**
   * Train agent using experience replay
   */
  trainBatch(batchSize: number = 32): void {
    if (this.experienceReplay.length < batchSize) return;

    // Sample random batch
    const batch: Experience[] = [];
    for (let i = 0; i < batchSize; i++) {
      const idx = Math.floor(Math.random() * this.experienceReplay.length);
      batch.push(this.experienceReplay[idx]);
    }

    // Update Q-values
    for (const experience of batch) {
      const stateKey = this.stateToKey(experience.state);
      const nextStateKey = this.stateToKey(experience.nextState);

      if (!this.qTable.has(stateKey)) {
        this.qTable.set(stateKey, [0, 0, 0]);
      }

      const qValues = this.qTable.get(stateKey)!;
      const actionIndex = experience.action + 1; // Convert [-1, 0, 1] to [0, 1, 2]

      let maxNextQ = 0;
      if (this.qTable.has(nextStateKey)) {
        maxNextQ = Math.max(...this.qTable.get(nextStateKey)!);
      }

      const oldQ = qValues[actionIndex];
      const newQ = oldQ + this.learningRate * (experience.reward + this.discountFactor * maxNextQ - oldQ);
      qValues[actionIndex] = newQ;
    }

    // Decay epsilon
    this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.epsilonDecay);

    // Update target network periodically
    this.updateCounter++;
    if (this.updateCounter % this.targetUpdateFrequency === 0) {
      this.targetQTable = new Map(this.qTable);
    }
  }

  /**
   * Calculate reward based on trade outcome
   */
  calculateReward(
    entryPrice: number,
    exitPrice: number,
    position: 'BUY' | 'SELL',
    walletBalance: number,
    previousWinRate: number
  ): number {
    let reward = 0;

    if (position === 'BUY') {
      const profit = (exitPrice - entryPrice) / entryPrice;
      reward = profit * 100; // Scale profit to reward
    } else {
      const profit = (entryPrice - exitPrice) / entryPrice;
      reward = profit * 100;
    }

    // Bonus for consistent wins
    if (reward > 0) {
      reward += previousWinRate * 10;
    }

    // Penalty for losses
    if (reward < 0) {
      reward -= Math.abs(reward) * 0.5;
    }

    // Normalize by wallet balance
    reward = reward / (walletBalance / 1000);

    return reward;
  }

  /**
   * Get agent performance metrics
   */
  getMetrics(): {
    qTableSize: number;
    experienceReplaySize: number;
    epsilon: number;
    explorationRate: number;
  } {
    return {
      qTableSize: this.qTable.size,
      experienceReplaySize: this.experienceReplay.length,
      epsilon: this.epsilon,
      explorationRate: this.epsilon,
    };
  }

  /**
   * Reset agent
   */
  reset(): void {
    this.qTable.clear();
    this.experienceReplay = [];
    this.epsilon = 0.1;
    this.updateCounter = 0;
  }
}

/**
 * Advanced Agent Strategy Selector
 * Chooses best strategy based on market conditions
 */
export class StrategySelector {
  /**
   * Select best strategy based on market regime
   */
  static selectStrategy(indicators: TechnicalIndicators): string {
    const volatility = indicators.atr / indicators.bollingerBands.middle;
    const trend = indicators.ema12 - indicators.ema26;
    const rsi = indicators.rsi;

    // High volatility + strong trend = Momentum strategy
    if (volatility > 0.02 && Math.abs(trend) > 0.01) {
      return 'momentum';
    }

    // Low volatility + mean reversion = Mean Reversion strategy
    if (volatility < 0.01 && (rsi > 70 || rsi < 30)) {
      return 'meanReversion';
    }

    // Default = RL strategy
    return 'rl';
  }

  /**
   * Calculate market regime
   */
  static getMarketRegime(indicators: TechnicalIndicators): 'trend' | 'range' | 'volatile' {
    const volatility = indicators.atr / indicators.bollingerBands.middle;
    const trend = Math.abs(indicators.ema12 - indicators.ema26) / indicators.ema26;

    if (volatility > 0.025) {
      return 'volatile';
    } else if (trend > 0.01) {
      return 'trend';
    } else {
      return 'range';
    }
  }

  /**
   * Calculate optimal position size based on risk
   */
  static calculatePositionSize(
    walletBalance: number,
    volatility: number,
    maxRiskPercentage: number = 2
  ): number {
    const riskAmount = (walletBalance * maxRiskPercentage) / 100;
    const positionSize = riskAmount / Math.max(volatility, 0.01);
    return Math.min(positionSize, walletBalance * 0.1); // Max 10% of wallet
  }
}
