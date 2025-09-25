import pandas as pd
from datetime import datetime
from typing import List, Dict, Any

from backend.trading.strategies.base_strategy import BaseStrategy
from backend.trading.portfolio_manager import PortfolioManager
from backend.trading.risk_manager import RiskManager
from backend.utils.logger import setup_logger

logger = setup_logger("backtester")

class Backtester:
    def __init__(self, initial_capital: float, strategy: BaseStrategy, risk_manager: RiskManager, data: pd.DataFrame):
        self.initial_capital = initial_capital
        self.strategy = strategy
        self.risk_manager = risk_manager
        self.data = data.sort_values(by='timestamp')
        self.portfolio_manager = PortfolioManager(initial_capital)
        self.trades: List[Dict[str, Any]] = []

    def run_backtest(self):
        logger.info(f"Rozpoczynanie backtestu z kapitałem początkowym: {self.initial_capital}")
        for index, row in self.data.iterrows():
            timestamp = row['timestamp']
            current_price = row['close']

            # Update portfolio with current price
            self.portfolio_manager.update_current_price(current_price)

            # Get signal from strategy
            signal = self.strategy.generate_signal(row)

            if signal == 'buy':
                # Check risk manager for buy permission
                if self.risk_manager.can_open_position(self.portfolio_manager.current_capital, current_price):
                    # Calculate amount to buy (e.g., 5 USD as per initial bot description)
                    amount_usd = 5.0 # Fixed amount for small accounts
                    amount_crypto = amount_usd / current_price

                    # Execute trade
                    trade = self.portfolio_manager.open_position(current_price, amount_crypto)
                    if trade:
                        self.trades.append({
                            'timestamp': timestamp,
                            'type': 'buy',
                            'price': current_price,
                            'amount_crypto': amount_crypto,
                            'amount_usd': amount_usd,
                            'capital_after_trade': self.portfolio_manager.current_capital
                        })
                        logger.info(f"Kupiono {amount_crypto:.4f} BTC po {current_price:.2f} USD w {timestamp}")

            elif signal == 'sell':
                # Check risk manager for sell permission and if there are open positions
                if self.portfolio_manager.has_open_positions() and self.risk_manager.can_close_position(self.portfolio_manager.current_capital, current_price):
                    # Close all open positions for simplicity in backtest
                    closed_trade = self.portfolio_manager.close_all_positions(current_price)
                    if closed_trade:
                        self.trades.append({
                            'timestamp': timestamp,
                            'type': 'sell',
                            'price': current_price,
                            'amount_crypto': closed_trade['amount_crypto'],
                            'amount_usd': closed_trade['amount_usd'],
                            'profit_loss_usd': closed_trade['profit_loss_usd'],
                            'capital_after_trade': self.portfolio_manager.current_capital
                        })
                        logger.info(f"Sprzedano {closed_trade['amount_crypto']:.4f} BTC po {current_price:.2f} USD w {timestamp}. Zysk/Strata: {closed_trade['profit_loss_usd']:.2f} USD")

        logger.info("Backtest zakończony.")
        return self.trades, self.portfolio_manager.current_capital

    def get_performance_metrics(self, trades: List[Dict[str, Any]], final_capital: float):
        total_profit_loss = final_capital - self.initial_capital
        num_trades = len(trades)
        winning_trades = [t for t in trades if t.get('profit_loss_usd', 0) > 0]
        losing_trades = [t for t in trades if t.get('profit_loss_usd', 0) < 0]

        win_rate = len(winning_trades) / len(losing_trades) if len(losing_trades) > 0 else (1 if len(winning_trades) > 0 else 0)
        if num_trades > 0:
            win_rate = len(winning_trades) / num_trades
        else:
            win_rate = 0

        avg_profit_per_trade = sum([t.get('profit_loss_usd', 0) for t in winning_trades]) / len(winning_trades) if len(winning_trades) > 0 else 0
        avg_loss_per_trade = sum([t.get('profit_loss_usd', 0) for t in losing_trades]) / len(losing_trades) if len(losing_trades) > 0 else 0

        return {
            'initial_capital': self.initial_capital,
            'final_capital': final_capital,
            'total_profit_loss': total_profit_loss,
            'num_trades': num_trades,
            'winning_trades': len(winning_trades),
            'losing_trades': len(losing_trades),
            'win_rate': win_rate,
            'avg_profit_per_trade': avg_profit_per_trade,
            'avg_loss_per_trade': avg_loss_per_trade
        }


# Example Usage (for testing purposes, not part of the main bot logic)
if __name__ == '__main__':
    # Mock Strategy
    class MockStrategy(BaseStrategy):
        def __init__(self):
            super().__init__('MockStrategy')
            self.buy_signal_count = 0
            self.sell_signal_count = 0

        def generate_signal(self, data: pd.Series) -> str:
            # Simple mock: buy on first data point, sell on second, then no more signals
            if self.buy_signal_count == 0:
                self.buy_signal_count += 1
                return 'buy'
            elif self.sell_signal_count == 0 and self.buy_signal_count == 1:
                self.sell_signal_count += 1
                return 'sell'
            return 'hold'

    # Mock Data (simplified OHLCV data)
    mock_data = pd.DataFrame([
        {'timestamp': datetime(2025, 1, 1, 10, 0, 0), 'open': 100, 'high': 105, 'low': 98, 'close': 102, 'volume': 1000},
        {'timestamp': datetime(2025, 1, 1, 10, 1, 0), 'open': 102, 'high': 108, 'low': 100, 'close': 105, 'volume': 1200},
        {'timestamp': datetime(2025, 1, 1, 10, 2, 0), 'open': 105, 'high': 110, 'low': 103, 'close': 108, 'volume': 1500},
        {'timestamp': datetime(2025, 1, 1, 10, 3, 0), 'open': 108, 'high': 112, 'low': 106, 'close': 107, 'volume': 1100},
        {'timestamp': datetime(2025, 1, 1, 10, 4, 0), 'open': 107, 'high': 109, 'low': 105, 'close': 106, 'volume': 900},
    ])

    mock_risk_manager = RiskManager(max_risk_per_trade=0.01, max_risk_per_portfolio=0.05)
    mock_strategy = MockStrategy()

    backtester = Backtester(initial_capital=1000, strategy=mock_strategy, risk_manager=mock_risk_manager, data=mock_data)
    trades, final_capital = backtester.run_backtest()
    performance = backtester.get_performance_metrics(trades, final_capital)

    print("\n--- Wyniki Backtestu ---")
    print(f"Kapitał początkowy: {performance['initial_capital']:.2f} USD")
    print(f"Kapitał końcowy: {performance['final_capital']:.2f} USD")
    print(f"Całkowity Zysk/Strata: {performance['total_profit_loss']:.2f} USD")
    print(f"Liczba transakcji: {performance['num_trades']}")
    print(f"Liczba wygrywających transakcji: {performance['winning_trades']}")
    print(f"Liczba przegrywających transakcji: {performance['losing_trades']}")
    print(f"Współczynnik wygranych: {performance['win_rate']:.2f}")
    print(f"Średni zysk na transakcję: {performance['avg_profit_per_trade']:.2f} USD")
    print(f"Średnia strata na transakcję: {performance['avg_loss_per_trade']:.2f} USD")

    print("\n--- Szczegóły Transakcji ---")
    for trade in trades:
        print(trade)


