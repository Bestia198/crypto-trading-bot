/**
 * Advanced Risk Management Service
 * Implements dynamic position sizing, stop-loss, take-profit, and drawdown management
 */

export interface RiskParameters {
  maxRiskPerTrade: number; // % of wallet
  maxDrawdown: number; // % of peak balance
  stopLossPercentage: number; // % below entry
  takeProfitPercentage: number; // % above entry
  maxPositionSize: number; // % of wallet
  maxDailyLoss: number; // % of wallet
  correlationThreshold: number; // For portfolio diversification
}

export interface PositionSizing {
  positionSize: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
}

export interface PortfolioRisk {
  currentDrawdown: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  volatility: number;
  correlation: number;
}

export class RiskManager {
  private defaultParams: RiskParameters = {
    maxRiskPerTrade: 2,
    maxDrawdown: 20,
    stopLossPercentage: 2,
    takeProfitPercentage: 5,
    maxPositionSize: 10,
    maxDailyLoss: 5,
    correlationThreshold: 0.7,
  };

  private peakBalance: number = 0;
  private currentBalance: number = 0;
  private dailyLoss: number = 0;
  private tradeHistory: Array<{ profit: number; date: Date }> = [];

  constructor(params?: Partial<RiskParameters>) {
    this.defaultParams = { ...this.defaultParams, ...params };
  }

  /**
   * Calculate optimal position size using Kelly Criterion
   */
  calculatePositionSize(
    walletBalance: number,
    entryPrice: number,
    stopLoss: number,
    winRate: number,
    avgWin: number,
    avgLoss: number
  ): PositionSizing {
    // Kelly Criterion: f* = (bp - q) / b
    // where b = odds, p = win probability, q = loss probability
    const b = avgWin / avgLoss;
    const p = winRate / 100;
    const q = 1 - p;

    let kellyCriterion = (b * p - q) / b;
    kellyCriterion = Math.max(0, Math.min(kellyCriterion, 0.25)); // Cap at 25%

    // Fractional Kelly (use 50% of Kelly for safety)
    const positionPercentage = kellyCriterion * 0.5;
    const positionSize = walletBalance * positionPercentage;

    // Respect max position size
    const maxPosition = (walletBalance * this.defaultParams.maxPositionSize) / 100;
    const finalPositionSize = Math.min(positionSize, maxPosition);

    // Calculate stop-loss and take-profit
    const riskAmount = finalPositionSize * (this.defaultParams.stopLossPercentage / 100);
    const stopLossPrice = entryPrice - riskAmount / (finalPositionSize / entryPrice);
    const takeProfitPrice = entryPrice + (riskAmount * this.defaultParams.takeProfitPercentage) / this.defaultParams.stopLossPercentage / (finalPositionSize / entryPrice);

    const riskRewardRatio = Math.abs(takeProfitPrice - entryPrice) / Math.abs(entryPrice - stopLossPrice);

    return {
      positionSize: finalPositionSize,
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      riskRewardRatio,
    };
  }

  /**
   * Calculate dynamic stop-loss based on volatility
   */
  calculateDynamicStopLoss(
    entryPrice: number,
    atr: number,
    multiplier: number = 2
  ): number {
    return entryPrice - atr * multiplier;
  }

  /**
   * Calculate dynamic take-profit based on risk-reward ratio
   */
  calculateDynamicTakeProfit(
    entryPrice: number,
    stopLoss: number,
    targetRiskRewardRatio: number = 2
  ): number {
    const riskAmount = entryPrice - stopLoss;
    return entryPrice + riskAmount * targetRiskRewardRatio;
  }

  /**
   * Check if trade should be executed based on risk parameters
   */
  canExecuteTrade(
    walletBalance: number,
    positionSize: number,
    dailyLossAmount: number
  ): boolean {
    // Check max position size
    if (positionSize > (walletBalance * this.defaultParams.maxPositionSize) / 100) {
      return false;
    }

    // Check daily loss limit
    const dailyLossPercentage = (dailyLossAmount / walletBalance) * 100;
    if (dailyLossPercentage > this.defaultParams.maxDailyLoss) {
      return false;
    }

    // Check max drawdown
    const drawdown = this.calculateDrawdown(walletBalance);
    if (drawdown > this.defaultParams.maxDrawdown) {
      return false;
    }

    return true;
  }

  /**
   * Calculate current drawdown
   */
  calculateDrawdown(currentBalance: number): number {
    if (this.peakBalance === 0) {
      this.peakBalance = currentBalance;
      return 0;
    }

    if (currentBalance > this.peakBalance) {
      this.peakBalance = currentBalance;
      return 0;
    }

    return ((this.peakBalance - currentBalance) / this.peakBalance) * 100;
  }

  /**
   * Calculate portfolio risk metrics
   */
  calculatePortfolioRisk(
    balanceHistory: number[],
    returns: number[]
  ): PortfolioRisk {
    const currentBalance = balanceHistory[balanceHistory.length - 1];
    const peakBalance = Math.max(...balanceHistory);
    const currentDrawdown = ((peakBalance - currentBalance) / peakBalance) * 100;
    const maxDrawdown = this.calculateMaxDrawdown(balanceHistory);

    // Calculate Sharpe Ratio (assuming 2% risk-free rate)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn - 0.02) / stdDev : 0;

    // Calculate Sortino Ratio (only downside volatility)
    const downReturns = returns.filter(r => r < 0);
    const downVariance = downReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downReturns.length;
    const downStdDev = Math.sqrt(downVariance);
    const sortinoRatio = downStdDev > 0 ? (avgReturn - 0.02) / downStdDev : 0;

    return {
      currentDrawdown,
      maxDrawdown,
      sharpeRatio,
      sortinoRatio,
      volatility: stdDev,
      correlation: 0, // Placeholder
    };
  }

  /**
   * Calculate maximum drawdown from balance history
   */
  private calculateMaxDrawdown(balanceHistory: number[]): number {
    let maxDD = 0;
    let peak = balanceHistory[0];

    for (const balance of balanceHistory) {
      if (balance > peak) {
        peak = balance;
      }
      const dd = ((peak - balance) / peak) * 100;
      maxDD = Math.max(maxDD, dd);
    }

    return maxDD;
  }

  /**
   * Record trade for risk tracking
   */
  recordTrade(profit: number): void {
    this.tradeHistory.push({ profit, date: new Date() });

    if (profit < 0) {
      this.dailyLoss += Math.abs(profit);
    }

    // Reset daily loss at end of day
    const now = new Date();
    if (this.tradeHistory.length > 0) {
      const lastTrade = this.tradeHistory[this.tradeHistory.length - 1];
      if (now.getDate() !== lastTrade.date.getDate()) {
        this.dailyLoss = 0;
      }
    }
  }

  /**
   * Get risk metrics
   */
  getMetrics(): {
    currentDrawdown: number;
    dailyLoss: number;
    tradeCount: number;
    winRate: number;
  } {
    const wins = this.tradeHistory.filter(t => t.profit > 0).length;
    const winRate = this.tradeHistory.length > 0 ? (wins / this.tradeHistory.length) * 100 : 0;

    return {
      currentDrawdown: this.calculateDrawdown(this.currentBalance),
      dailyLoss: this.dailyLoss,
      tradeCount: this.tradeHistory.length,
      winRate,
    };
  }

  /**
   * Update current balance
   */
  updateBalance(balance: number): void {
    this.currentBalance = balance;
    if (this.peakBalance === 0) {
      this.peakBalance = balance;
    }
  }

  /**
   * Reset risk manager
   */
  reset(): void {
    this.peakBalance = 0;
    this.currentBalance = 0;
    this.dailyLoss = 0;
    this.tradeHistory = [];
  }
}

/**
 * Portfolio Diversification Analyzer
 */
export class DiversificationAnalyzer {
  /**
   * Calculate correlation between assets
   */
  static calculateCorrelation(returns1: number[], returns2: number[]): number {
    const n = Math.min(returns1.length, returns2.length);
    if (n === 0) return 0;

    const mean1 = returns1.slice(-n).reduce((a, b) => a + b, 0) / n;
    const mean2 = returns2.slice(-n).reduce((a, b) => a + b, 0) / n;

    let covariance = 0;
    let var1 = 0;
    let var2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = returns1[returns1.length - n + i] - mean1;
      const diff2 = returns2[returns2.length - n + i] - mean2;
      covariance += diff1 * diff2;
      var1 += diff1 * diff1;
      var2 += diff2 * diff2;
    }

    const stdDev1 = Math.sqrt(var1 / n);
    const stdDev2 = Math.sqrt(var2 / n);

    return stdDev1 > 0 && stdDev2 > 0 ? covariance / (n * stdDev1 * stdDev2) : 0;
  }

  /**
   * Recommend portfolio allocation
   */
  static recommendAllocation(
    assets: Array<{ symbol: string; volatility: number; returns: number }>,
    targetReturn: number
  ): Record<string, number> {
    const allocation: Record<string, number> = {};
    const totalVolatility = assets.reduce((sum, a) => sum + a.volatility, 0);

    for (const asset of assets) {
      // Inverse volatility weighting
      allocation[asset.symbol] = (1 - asset.volatility / totalVolatility) / assets.length;
    }

    return allocation;
  }
}
