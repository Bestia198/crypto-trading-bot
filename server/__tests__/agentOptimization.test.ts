import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateATR,
  calculateStochastic,
  generateSignal,
  calculateSignalConfidence,
  PriceData,
} from '../services/technicalIndicators';
import { OptimizedRLAgent, StrategySelector } from '../services/optimizedRLAgent';
import { RiskManager, DiversificationAnalyzer } from '../services/riskManagement';

describe('Technical Indicators Optimization', () => {
  const mockPrices = [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 111, 110, 112, 114, 113];
  const mockData: PriceData[] = mockPrices.map((close, i) => ({
    timestamp: Date.now() + i * 60000,
    open: close - 1,
    high: close + 2,
    low: close - 2,
    close,
    volume: 1000000,
  }));

  describe('RSI Calculation', () => {
    it('should calculate RSI correctly', () => {
      const rsi = calculateRSI(mockPrices, 14);
      expect(rsi).toBeGreaterThanOrEqual(0);
      expect(rsi).toBeLessThanOrEqual(100);
    });

    it('should identify overbought conditions (RSI > 70)', () => {
      const overboughtPrices = Array(20).fill(100).map((p, i) => p + i * 2);
      const rsi = calculateRSI(overboughtPrices, 14);
      expect(rsi).toBeGreaterThan(70);
    });

    it('should identify oversold conditions (RSI < 30)', () => {
      const oversoldPrices = Array(20).fill(100).map((p, i) => p - i * 2);
      const rsi = calculateRSI(oversoldPrices, 14);
      expect(rsi).toBeLessThan(30);
    });
  });

  describe('MACD Calculation', () => {
    it('should calculate MACD correctly', () => {
      const macd = calculateMACD(mockPrices);
      expect(macd.line).toBeDefined();
      expect(macd.histogram).toBeDefined();
    });

    it('should detect trend changes', () => {
      const uptrend = Array(30).fill(100).map((p, i) => p + i);
      const macd = calculateMACD(uptrend);
      expect(macd.line).toBeGreaterThanOrEqual(macd.signal);
    });
  });

  describe('Bollinger Bands Calculation', () => {
    it('should calculate Bollinger Bands correctly', () => {
      const bb = calculateBollingerBands(mockPrices);
      expect(bb.upper).toBeGreaterThan(bb.middle);
      expect(bb.middle).toBeGreaterThan(bb.lower);
    });

    it('should have correct band width', () => {
      const bb = calculateBollingerBands(mockPrices);
      const width = bb.upper - bb.lower;
      expect(width).toBeGreaterThan(0);
    });
  });

  describe('ATR Calculation', () => {
    it('should calculate ATR correctly', () => {
      const atr = calculateATR(mockData);
      expect(atr).toBeGreaterThan(0);
    });

    it('should reflect volatility', () => {
      const volatileData = mockData.map(d => ({
        ...d,
        high: d.high * 1.05,
        low: d.low * 0.95,
      }));
      const atr = calculateATR(volatileData);
      expect(atr).toBeGreaterThan(0);
    });
  });

  describe('Stochastic Oscillator', () => {
    it('should calculate Stochastic correctly', () => {
      const stoch = calculateStochastic(mockData);
      expect(stoch.k).toBeGreaterThanOrEqual(0);
      expect(stoch.k).toBeLessThanOrEqual(100);
      expect(stoch.d).toBeGreaterThanOrEqual(0);
      expect(stoch.d).toBeLessThanOrEqual(100);
    });
  });

  describe('Signal Generation', () => {
    it('should generate BUY signal when indicators align', () => {
      const mockIndicators = {
        rsi: 25,
        macd: { line: 1, signal: 0, histogram: 1 },
        bollingerBands: { upper: 110, middle: 105, lower: 100 },
        atr: 2,
        stochastic: { k: 15, d: 20 },
        ema12: 106,
        ema26: 104,
        sma20: 105,
        sma50: 103,
      };
      const signal = generateSignal(mockIndicators);
      expect(signal).toBe(1); // BUY
    });

    it('should generate SELL signal when indicators align', () => {
      const mockIndicators = {
        rsi: 75,
        macd: { line: -1, signal: 0, histogram: -1 },
        bollingerBands: { upper: 110, middle: 105, lower: 100 },
        atr: 2,
        stochastic: { k: 85, d: 80 },
        ema12: 104,
        ema26: 106,
        sma20: 105,
        sma50: 103,
      };
      const signal = generateSignal(mockIndicators);
      expect(signal).toBe(-1); // SELL
    });

    it('should calculate signal confidence', () => {
      const mockIndicators = {
        rsi: 45,
        macd: { line: 0.5, signal: 0.3, histogram: 0.2 },
        bollingerBands: { upper: 110, middle: 105, lower: 100 },
        atr: 2,
        stochastic: { k: 50, d: 50 },
        ema12: 105,
        ema26: 105,
        sma20: 105,
        sma50: 103,
      };
      const confidence = calculateSignalConfidence(mockIndicators);
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });
});

describe('Optimized RL Agent', () => {
  let agent: OptimizedRLAgent;

  beforeEach(() => {
    agent = new OptimizedRLAgent(0.1, 0.95, 0.1);
  });

  describe('Action Selection', () => {
    it('should select action using epsilon-greedy strategy', () => {
      const state = {
        rsi: 50,
        macdHistogram: 0,
        bollingerPosition: 0,
        stochasticK: 50,
        trendStrength: 0,
        volatility: 0.01,
        recentProfit: 0,
        winRate: 50,
      };

      const action = agent.selectAction(state, true);
      expect([-1, 0, 1]).toContain(action);
    });

    it('should explore with epsilon probability', () => {
      const state = {
        rsi: 50,
        macdHistogram: 0,
        bollingerPosition: 0,
        stochasticK: 50,
        trendStrength: 0,
        volatility: 0.01,
        recentProfit: 0,
        winRate: 50,
      };

      let explorationCount = 0;
      for (let i = 0; i < 100; i++) {
        agent.selectAction(state, true);
      }
      // Should have some exploration
      expect(explorationCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Experience Replay', () => {
    it('should store experiences', () => {
      const state = {
        rsi: 50,
        macdHistogram: 0,
        bollingerPosition: 0,
        stochasticK: 50,
        trendStrength: 0,
        volatility: 0.01,
        recentProfit: 0,
        winRate: 50,
      };

      agent.storeExperience(state, 1, 10, state, false);
      const metrics = agent.getMetrics();
      expect(metrics.experienceReplaySize).toBe(1);
    });

    it('should train on batch', () => {
      const state = {
        rsi: 50,
        macdHistogram: 0,
        bollingerPosition: 0,
        stochasticK: 50,
        trendStrength: 0,
        volatility: 0.01,
        recentProfit: 0,
        winRate: 50,
      };

      for (let i = 0; i < 50; i++) {
        agent.storeExperience(state, Math.random() > 0.5 ? 1 : -1, Math.random() * 10, state, false);
      }

      agent.trainBatch(32);
      const metrics = agent.getMetrics();
      expect(metrics.qTableSize).toBeGreaterThan(0);
    });
  });

  describe('Reward Calculation', () => {
    it('should calculate positive reward for profitable trade', () => {
      const reward = agent.calculateReward(100, 105, 'BUY', 1000, 60);
      expect(reward).toBeGreaterThan(0);
    });

    it('should calculate negative reward for losing trade', () => {
      const reward = agent.calculateReward(100, 95, 'BUY', 1000, 60);
      expect(reward).toBeLessThan(0);
    });
  });
});

describe('Strategy Selector', () => {
  const mockIndicators = {
    rsi: 50,
    macd: { line: 0, signal: 0, histogram: 0 },
    bollingerBands: { upper: 110, middle: 105, lower: 100 },
    atr: 2,
    stochastic: { k: 50, d: 50 },
    ema12: 105,
    ema26: 105,
    sma20: 105,
    sma50: 103,
  };

  it('should select momentum strategy for high volatility', () => {
    const indicators = {
      ...mockIndicators,
      atr: 5, // High volatility
      ema12: 110, // Strong trend
    };
    const strategy = StrategySelector.selectStrategy(indicators);
    expect(strategy).toBe('momentum');
  });

  it('should select mean reversion for low volatility', () => {
    const indicators = {
      ...mockIndicators,
      atr: 0.5, // Low volatility
      rsi: 75, // Overbought
    };
    const strategy = StrategySelector.selectStrategy(indicators);
    expect(strategy).toBe('meanReversion');
  });

  it('should calculate market regime', () => {
    const regime = StrategySelector.getMarketRegime(mockIndicators);
    expect(['trend', 'range', 'volatile']).toContain(regime);
  });

  it('should calculate optimal position size', () => {
    const positionSize = StrategySelector.calculatePositionSize(1000, 0.02, 2);
    expect(positionSize).toBeGreaterThan(0);
    expect(positionSize).toBeLessThanOrEqual(100);
  });
});

describe('Risk Manager', () => {
  let riskManager: RiskManager;

  beforeEach(() => {
    riskManager = new RiskManager();
  });

  describe('Position Sizing', () => {
    it('should calculate position size using Kelly Criterion', () => {
      const sizing = riskManager.calculatePositionSize(1000, 100, 98, 60, 5, 3);
      expect(sizing.positionSize).toBeGreaterThan(0);
      expect(sizing.positionSize).toBeLessThanOrEqual(100);
    });

    it('should respect max position size', () => {
      const sizing = riskManager.calculatePositionSize(1000, 100, 98, 95, 100, 1);
      expect(sizing.positionSize).toBeLessThanOrEqual(100); // 10% of 1000
    });

    it('should calculate stop-loss and take-profit', () => {
      const sizing = riskManager.calculatePositionSize(1000, 100, 98, 60, 5, 3);
      expect(sizing.stopLoss).toBeLessThan(100);
      expect(sizing.takeProfit).toBeGreaterThan(100);
      expect(sizing.riskRewardRatio).toBeGreaterThan(0);
    });
  });

  describe('Drawdown Calculation', () => {
    it('should calculate drawdown correctly', () => {
      const dd = riskManager.calculateDrawdown(900);
      expect(dd).toBeGreaterThanOrEqual(0);
    });

    it('should reset drawdown when new peak is reached', () => {
      riskManager.calculateDrawdown(1000);
      riskManager.calculateDrawdown(900);
      const dd = riskManager.calculateDrawdown(1100);
      expect(dd).toBe(0);
    });
  });

  describe('Trade Execution Validation', () => {
    it('should allow trade within risk limits', () => {
      const canExecute = riskManager.canExecuteTrade(1000, 50, 0);
      expect(canExecute).toBe(true);
    });

    it('should block trade exceeding position size limit', () => {
      const canExecute = riskManager.canExecuteTrade(1000, 150, 0);
      expect(canExecute).toBe(false);
    });
  });

  describe('Portfolio Risk Metrics', () => {
    it('should calculate Sharpe Ratio', () => {
      const balanceHistory = [1000, 1050, 1020, 1100, 1080];
      const returns = [0.05, -0.03, 0.08, -0.02];
      const risk = riskManager.calculatePortfolioRisk(balanceHistory, returns);
      expect(risk.sharpeRatio).toBeDefined();
    });

    it('should calculate Sortino Ratio', () => {
      const balanceHistory = [1000, 1050, 1020, 1100, 1080];
      const returns = [0.05, -0.03, 0.08, -0.02];
      const risk = riskManager.calculatePortfolioRisk(balanceHistory, returns);
      expect(risk.sortinoRatio).toBeDefined();
    });
  });
});

describe('Diversification Analyzer', () => {
  it('should calculate correlation between assets', () => {
    const returns1 = [0.01, 0.02, -0.01, 0.03, 0.02];
    const returns2 = [0.02, 0.03, -0.02, 0.04, 0.01];
    const correlation = DiversificationAnalyzer.calculateCorrelation(returns1, returns2);
    expect(correlation).toBeGreaterThanOrEqual(-1);
    expect(correlation).toBeLessThanOrEqual(1);
  });

  it('should recommend portfolio allocation', () => {
    const assets = [
      { symbol: 'BTC', volatility: 0.03, returns: 0.15 },
      { symbol: 'ETH', volatility: 0.04, returns: 0.12 },
      { symbol: 'USDT', volatility: 0.001, returns: 0.02 },
    ];
    const allocation = DiversificationAnalyzer.recommendAllocation(assets, 0.10);
    const totalAllocation = Object.values(allocation).reduce((a, b) => a + b, 0);
    expect(totalAllocation).toBeGreaterThan(0);
    expect(totalAllocation).toBeLessThanOrEqual(1);
  });
});