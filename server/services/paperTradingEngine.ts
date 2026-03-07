// Using native JavaScript for decimal operations

/**
 * Paper Trading Engine - Simulates trading with live market prices
 * Supports 7-day simulation period with real-time price feeds
 */

export interface PaperTradingConfig {
  sessionName: string;
  initialCapital: number;
  durationDays: number;
  symbols: string[];
}

export interface LivePrice {
  symbol: string;
  price: number;
  timestamp: number;
  change24h: number;
  high24h: number;
  low24h: number;
}

export interface PaperTrade {
  id: string;
  symbol: string;
  tradeType: "buy" | "sell" | "long" | "short";
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  profit: number;
  profitPercent: number;
  status: "open" | "closed" | "cancelled";
  confidence: number;
  entryTime: Date;
  exitTime?: Date;
}

export interface PaperTradingMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  roi: number;
  sharpeRatio: number;
  maxDrawdown: number;
  currentBalance: number;
}

export class PaperTradingEngine {
  private sessionId: string;
  private initialCapital: number;
  private currentBalance: number;
  private trades: PaperTrade[] = [];
  private portfolio: Map<string, number> = new Map(); // symbol -> quantity
  private priceHistory: Map<string, LivePrice[]> = new Map();
  private startDate: Date;
  private endDate: Date;
  private dailyBalances: number[] = [];

  constructor(config: PaperTradingConfig) {
    this.sessionId = `paper_${Date.now()}`;
    this.initialCapital = config.initialCapital;
    this.currentBalance = config.initialCapital;
    this.startDate = new Date();
    this.endDate = new Date(this.startDate.getTime() + config.durationDays * 24 * 60 * 60 * 1000);
    this.dailyBalances = [this.initialCapital];

    // Initialize portfolio
    for (const symbol of config.symbols) {
      this.portfolio.set(symbol, 0);
      this.priceHistory.set(symbol, []);
    }
  }

  /**
   * Execute a paper trade with current market price
   */
  executeTrade(
    symbol: string,
    tradeType: "buy" | "sell" | "long" | "short",
    quantity: number,
    currentPrice: number,
    confidence: number = 0.5
  ): PaperTrade | null {
    // Check if session is still active
    if (new Date() > this.endDate) {
      console.log("[PaperTrading] Session expired");
      return null;
    }

    // Validate trade
    if (tradeType === "buy" || tradeType === "long") {
      const cost = quantity * currentPrice;
      if (cost > this.currentBalance) {
        console.log(`[PaperTrading] Insufficient balance for ${symbol} buy order`);
        return null;
      }
    }

    const trade: PaperTrade = {
      id: `trade_${this.trades.length + 1}`,
      symbol,
      tradeType,
      entryPrice: currentPrice,
      quantity,
      profit: 0,
      profitPercent: 0,
      status: "open",
      confidence,
      entryTime: new Date(),
    };

    // Update balance
    if (tradeType === "buy" || tradeType === "long") {
      const cost = quantity * currentPrice;
      this.currentBalance = this.currentBalance - cost;
      const currentQty = this.portfolio.get(symbol) || 0;
      this.portfolio.set(symbol, currentQty + quantity);
    } else {
      const proceeds = quantity * currentPrice;
      this.currentBalance = this.currentBalance + proceeds;
      const currentQty = this.portfolio.get(symbol) || 0;
      this.portfolio.set(symbol, Math.max(0, currentQty - quantity));
    }

    this.trades.push(trade);
    return trade;
  }

  /**
   * Close an open paper trade
   */
  closeTrade(tradeId: string, exitPrice: number): PaperTrade | null {
    const trade = this.trades.find((t) => t.id === tradeId);
    if (!trade || trade.status !== "open") {
      return null;
    }

    trade.exitPrice = exitPrice;
    trade.exitTime = new Date();
    trade.status = "closed";

    // Calculate profit/loss
    if (trade.tradeType === "buy" || trade.tradeType === "long") {
      const profit = trade.quantity * (exitPrice - trade.entryPrice);
      trade.profit = profit;
      trade.profitPercent = ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
    } else {
      const profit = trade.quantity * (trade.entryPrice - exitPrice);
      trade.profit = profit;
      trade.profitPercent = ((trade.entryPrice - exitPrice) / trade.entryPrice) * 100;
    }

    // Update balance
    this.currentBalance = this.currentBalance + trade.profit;

    return trade;
  }

  /**
   * Update live prices for all symbols
   */
  updatePrices(prices: LivePrice[]): void {
    for (const price of prices) {
      const history = this.priceHistory.get(price.symbol) || [];
      history.push(price);
      this.priceHistory.set(price.symbol, history);

      // Update unrealized P&L for open positions
      this.updateUnrealizedPL(price.symbol, price.price);
    }
  }

  /**
   * Update unrealized P&L for open positions
   */
  private updateUnrealizedPL(symbol: string, currentPrice: number): void {
    const openTrades = this.trades.filter((t) => t.symbol === symbol && t.status === "open");

    for (const trade of openTrades) {
      if (trade.tradeType === "buy" || trade.tradeType === "long") {
        trade.profit = trade.quantity * (currentPrice - trade.entryPrice);
        trade.profitPercent = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
      } else {
        trade.profit = trade.quantity * (trade.entryPrice - currentPrice);
        trade.profitPercent = ((trade.entryPrice - currentPrice) / trade.entryPrice) * 100;
      }
    }
  }

  /**
   * Get current portfolio value
   */
  getPortfolioValue(currentPrices: Map<string, number>): number {
    let totalValue = this.currentBalance;

    this.portfolio.forEach((quantity, symbol) => {
      const price = currentPrices.get(symbol) || 0;
      const value = quantity * price;
      totalValue += value;
    });

    return totalValue;
  }

  /**
   * Calculate performance metrics
   */
  getMetrics(): PaperTradingMetrics {
    const closedTrades = this.trades.filter((t) => t.status === "closed");
    const winningTrades = closedTrades.filter((t) => t.profit > 0).length;
    const losingTrades = closedTrades.filter((t) => t.profit < 0).length;
    const totalProfit = closedTrades.filter((t) => t.profit > 0).reduce((sum, t) => sum + t.profit, 0);
    const totalLoss = Math.abs(
      closedTrades.filter((t) => t.profit < 0).reduce((sum, t) => sum + t.profit, 0)
    );

    const roi = ((this.currentBalance - this.initialCapital) / this.initialCapital) * 100;
    const sharpeRatio = this.calculateSharpeRatio();
    const maxDrawdown = this.calculateMaxDrawdown();

    return {
      totalTrades: this.trades.length,
      winningTrades,
      losingTrades,
      winRate: closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0,
      totalProfit,
      totalLoss,
      roi,
      sharpeRatio,
      maxDrawdown,
      currentBalance: this.currentBalance,
    };
  }

  /**
   * Calculate Sharpe Ratio (simplified)
   */
  private calculateSharpeRatio(): number {
    if (this.dailyBalances.length < 2) return 0;

    const returns: number[] = [];
    for (let i = 1; i < this.dailyBalances.length; i++) {
      const ret = (this.dailyBalances[i] - this.dailyBalances[i - 1]) / this.dailyBalances[i - 1];
      returns.push(ret);
    }

    if (returns.length === 0) return 0;

    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Risk-free rate (annual) = 2%
    const riskFreeRate = 0.02 / 252; // Daily risk-free rate

    return stdDev > 0 ? (meanReturn - riskFreeRate) / stdDev : 0;
  }

  /**
   * Calculate Maximum Drawdown
   */
  private calculateMaxDrawdown(): number {
    if (this.dailyBalances.length < 2) return 0;

    let maxDrawdown = 0;
    let peak = this.dailyBalances[0];

    for (let i = 1; i < this.dailyBalances.length; i++) {
      if (this.dailyBalances[i] > peak) {
        peak = this.dailyBalances[i];
      }

      const drawdown = ((peak - this.dailyBalances[i]) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  /**
   * Record daily balance for metrics calculation
   */
  recordDailyBalance(): void {
    this.dailyBalances.push(this.currentBalance);
  }

  /**
   * Check if session is still active
   */
  isActive(): boolean {
    return new Date() <= this.endDate;
  }

  /**
   * Get session info
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      startDate: this.startDate,
      endDate: this.endDate,
      daysRemaining: Math.ceil((this.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      isActive: this.isActive(),
    };
  }

  /**
   * Get all trades
   */
  getTrades(): PaperTrade[] {
    return this.trades;
  }

  /**
   * Get portfolio
   */
  getPortfolio(): Map<string, number> {
    return this.portfolio;
  }
}
