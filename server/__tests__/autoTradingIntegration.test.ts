import { describe, it, expect, beforeEach } from 'vitest';
import { AutoTradingEngine } from '../autoTradingEngine';
import {
  calculateAllIndicators,
  generateSignal,
  calculateSignalConfidence,
  PriceData,
} from '../services/technicalIndicators';
import { OptimizedRLAgent, StrategySelector } from '../services/optimizedRLAgent';
import { RiskManager } from '../services/riskManagement';

describe('AutoTradingEngine Integration Tests', () => {
  let engine: AutoTradingEngine;

  beforeEach(() => {
    engine = new AutoTradingEngine();
  });

  describe('Engine Initialization', () => {
    it('should initialize without errors', () => {
      expect(engine).toBeDefined();
      expect(engine.getMetrics()).toBeDefined();
    });

    it('should have correct initial metrics', () => {
      const metrics = engine.getMetrics();
      expect(metrics.isRunning).toBe(false);
      expect(metrics.agentsCount).toBe(0);
    });
  });

  describe('Technical Indicators Integration', () => {
    it('should generate market data correctly', () => {
      const prices: number[] = [];
      let price = 45000;

      for (let i = 0; i < 50; i++) {
        const change = (Math.random() - 0.5) * 200;
        price = Math.max(40000, price + change);
        prices.push(price);
      }

      const data: PriceData[] = prices.map((close, i) => ({
        timestamp: Date.now() - (50 - i) * 60000,
        open: close - 50,
        high: close + 100,
        low: close - 100,
        close,
        volume: 1000000 + Math.random() * 500000,
      }));

      const indicators = calculateAllIndicators(data, prices);

      expect(indicators.rsi).toBeGreaterThanOrEqual(0);
      expect(indicators.rsi).toBeLessThanOrEqual(100);
      expect(indicators.macd.line).toBeDefined();
      expect(indicators.bollingerBands.upper).toBeGreaterThan(indicators.bollingerBands.lower);
      expect(indicators.atr).toBeGreaterThan(0);
      expect(indicators.stochastic.k).toBeGreaterThanOrEqual(0);
    });

    it('should generate trading signals from indicators', () => {
      const mockIndicators = {
        rsi: 35,
        macd: { line: 0.5, signal: 0.3, histogram: 0.2 },
        bollingerBands: { upper: 110, middle: 105, lower: 100 },
        atr: 2,
        stochastic: { k: 25, d: 30 },
        ema12: 106,
        ema26: 104,
        sma20: 105,
        sma50: 103,
      };

      const signal = generateSignal(mockIndicators);
      expect([-1, 0, 1]).toContain(signal);

      const confidence = calculateSignalConfidence(mockIndicators);
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('RL Agent Integration', () => {
    it('should create and use RL agent', () => {
      const agent = new OptimizedRLAgent(0.1, 0.95, 0.1);
      expect(agent).toBeDefined();

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

    it('should train RL agent on experiences', () => {
      const agent = new OptimizedRLAgent(0.1, 0.95, 0.1);
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

      // Store multiple experiences
      for (let i = 0; i < 50; i++) {
        const action = Math.random() > 0.5 ? 1 : -1;
        const reward = Math.random() * 10 - 5;
        agent.storeExperience(state, action, reward, state, false);
      }

      // Train on batch
      agent.trainBatch(32);

      const metrics = agent.getMetrics();
      expect(metrics.qTableSize).toBeGreaterThan(0);
      expect(metrics.experienceReplaySize).toBeGreaterThan(0);
    });
  });

  describe('Risk Management Integration', () => {
    it('should calculate position size correctly', () => {
      const riskManager = new RiskManager();
      const positioning = riskManager.calculatePositionSize(1000, 100, 98, 60, 5, 3);

      expect(positioning.positionSize).toBeGreaterThan(0);
      expect(positioning.positionSize).toBeLessThanOrEqual(100);
      expect(positioning.stopLoss).toBeLessThan(100);
      expect(positioning.takeProfit).toBeGreaterThan(100);
      expect(positioning.riskRewardRatio).toBeGreaterThan(0);
    });

    it('should validate trade execution', () => {
      const riskManager = new RiskManager();

      // Should allow trade within limits
      const canExecute1 = riskManager.canExecuteTrade(1000, 50, 0);
      expect(canExecute1).toBe(true);

      // Should block trade exceeding position size
      const canExecute2 = riskManager.canExecuteTrade(1000, 150, 0);
      expect(canExecute2).toBe(false);
    });

    it('should calculate portfolio risk metrics', () => {
      const riskManager = new RiskManager();
      const balanceHistory = [1000, 1050, 1020, 1100, 1080, 1150, 1120];
      const returns = [0.05, -0.03, 0.08, -0.02, 0.07, -0.02];

      const risk = riskManager.calculatePortfolioRisk(balanceHistory, returns);

      expect(risk.currentDrawdown).toBeGreaterThanOrEqual(0);
      expect(risk.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(risk.sharpeRatio).toBeDefined();
      expect(risk.sortinoRatio).toBeDefined();
      expect(risk.volatility).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Strategy Selection', () => {
    it('should select appropriate strategy based on market regime', () => {
      const volatileIndicators = {
        rsi: 50,
        macd: { line: 0, signal: 0, histogram: 0 },
        bollingerBands: { upper: 110, middle: 105, lower: 100 },
        atr: 5, // High volatility
        stochastic: { k: 50, d: 50 },
        ema12: 110, // Strong trend
        ema26: 104,
        sma20: 105,
        sma50: 103,
      };

      const strategy = StrategySelector.selectStrategy(volatileIndicators);
      expect(['momentum', 'meanReversion', 'rl']).toContain(strategy);
    });

    it('should identify market regime correctly', () => {
      const indicators = {
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

      const regime = StrategySelector.getMarketRegime(indicators);
      expect(['trend', 'range', 'volatile']).toContain(regime);
    });

    it('should calculate optimal position size', () => {
      const positionSize = StrategySelector.calculatePositionSize(1000, 0.02, 2);
      expect(positionSize).toBeGreaterThan(0);
      expect(positionSize).toBeLessThanOrEqual(100);
    });
  });

  describe('Automatic Ecosystem', () => {
    it('should track profit correctly', () => {
      const riskManager = new RiskManager();
      riskManager.updateBalance(1000);

      riskManager.recordTrade(50); // Winning trade
      riskManager.recordTrade(-20); // Losing trade

      const metrics = riskManager.getMetrics();
      expect(metrics.tradeCount).toBe(2);
      expect(metrics.winRate).toBe(50);
    });

    it('should calculate drawdown correctly', () => {
      const riskManager = new RiskManager();

      riskManager.updateBalance(1000);
      let dd = riskManager.calculateDrawdown(900);
      expect(dd).toBeGreaterThan(0);

      riskManager.updateBalance(1100);
      dd = riskManager.calculateDrawdown(1050);
      expect(dd).toBe(0); // New peak reached
    });
  });

  describe('Engine Metrics', () => {
    it('should return correct metrics', () => {
      const metrics = engine.getMetrics();

      expect(metrics).toHaveProperty('isRunning');
      expect(metrics).toHaveProperty('agentsCount');
      expect(metrics).toHaveProperty('profitTrackers');

      expect(typeof metrics.isRunning).toBe('boolean');
      expect(typeof metrics.agentsCount).toBe('number');
    });
  });

  describe('Integration Workflow', () => {
    it('should complete full trading workflow', () => {
      // 1. Create RL agent
      const agent = new OptimizedRLAgent(0.1, 0.95, 0.1);

      // 2. Create risk manager
      const riskManager = new RiskManager();
      riskManager.updateBalance(1000);

      // 3. Generate market data
      const prices: number[] = [];
      let price = 45000;
      for (let i = 0; i < 50; i++) {
        const change = (Math.random() - 0.5) * 200;
        price = Math.max(40000, price + change);
        prices.push(price);
      }

      const data: PriceData[] = prices.map((close, i) => ({
        timestamp: Date.now() - (50 - i) * 60000,
        open: close - 50,
        high: close + 100,
        low: close - 100,
        close,
        volume: 1000000 + Math.random() * 500000,
      }));

      // 4. Calculate indicators
      const indicators = calculateAllIndicators(data, prices);

      // 5. Generate signal
      const signal = generateSignal(indicators);
      const confidence = calculateSignalConfidence(indicators);

      // 6. Get RL action
      const state = {
        rsi: indicators.rsi,
        macdHistogram: indicators.macd.histogram,
        bollingerPosition:
          (indicators.bollingerBands.middle - indicators.bollingerBands.lower) /
          (indicators.bollingerBands.upper - indicators.bollingerBands.lower) * 2 - 1,
        stochasticK: indicators.stochastic.k,
        trendStrength: (indicators.ema12 - indicators.ema26) / indicators.ema26,
        volatility: indicators.atr / indicators.bollingerBands.middle,
        recentProfit: 0,
        winRate: 50,
      };

      const rlAction = agent.selectAction(state, true);

      // 7. Combine signals
      let finalAction = 0;
      if (signal !== 0 && confidence > 0.6) {
        finalAction = signal;
      } else if (rlAction !== 0) {
        finalAction = rlAction;
      }

      // 8. Calculate position size
      const positioning = riskManager.calculatePositionSize(1000, 45000, 44100, 60, 5, 3);

      // 9. Verify workflow completed
      expect(agent).toBeDefined();
      expect(riskManager).toBeDefined();
      expect(indicators).toBeDefined();
      expect(signal).toBeDefined();
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(state).toBeDefined();
      expect(rlAction).toBeDefined();
      expect(positioning.positionSize).toBeGreaterThan(0);
    });
  });
});
