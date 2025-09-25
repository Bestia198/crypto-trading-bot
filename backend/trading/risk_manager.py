from typing import Dict, Any
from datetime import datetime
from ..utils.logger import setup_logger
from ..utils.config import config
from ..utils.helpers import calculate_percentage_change
import time

logger = setup_logger("risk_manager")

class RiskManager:
    """Manages trading risks based on predefined rules."""

    def __init__(self, portfolio_manager):
        self.portfolio_manager = portfolio_manager
        self.max_portfolio_risk = config.get("trading.risk.max_portfolio_risk", 40.0)
        self.max_position_risk = config.get("trading.risk.max_position_risk", 20.0)
        self.max_daily_loss_percent = config.get("trading.risk.max_daily_loss_percent", 10.0)
        self.stop_loss_percent = config.get("trading.risk.stop_loss_percent", 5.0)
        self.take_profit_percent = config.get("trading.risk.take_profit_percent", 10.0)
        self.trailing_stop_percent = config.get("trading.risk.trailing_stop_percent", 2.0)

        self.daily_initial_balance = self.portfolio_manager.portfolio["balance"]["total"]
        self.daily_high_balance = self.daily_initial_balance
        self.last_daily_reset_timestamp = time.time()

    def _reset_daily_metrics(self):
        """Resets daily metrics if a new day has started."""
        current_day = datetime.fromtimestamp(time.time()).day
        last_reset_day = datetime.fromtimestamp(self.last_daily_reset_timestamp).day

        if current_day != last_reset_day:
            self.daily_initial_balance = self.portfolio_manager.portfolio["balance"]["total"]
            self.daily_high_balance = self.daily_initial_balance
            self.last_daily_reset_timestamp = time.time()
            logger.info("Daily risk metrics reset.")

    def check_trade_risk(self, symbol: str, entry_price: float, stop_loss_price: float, amount: float) -> Dict[str, Any]:
        """Check risk for a potential trade."""
        self._reset_daily_metrics()
        current_balance = self.portfolio_manager.portfolio["balance"]["total"]
        if current_balance <= 0:
            return {"allowed": False, "reason": "Insufficient balance"}

        # Calculate potential loss for this position
        potential_loss_per_unit = abs(entry_price - stop_loss_price)
        potential_loss_total = potential_loss_per_unit * amount

        # Check individual position risk
        position_risk_percent = (potential_loss_total / current_balance) * 100
        if position_risk_percent > self.max_position_risk:
            logger.warning(f"Trade for {symbol} rejected: Position risk ({position_risk_percent:.2f}%) exceeds max allowed ({self.max_position_risk}%).")
            return {"allowed": False, "reason": f"Position risk ({position_risk_percent:.2f}%) exceeds max allowed ({self.max_position_risk}%)"}

        # Check overall portfolio risk (sum of current unrealized losses + potential new loss)
        current_unrealized_pnl = sum(p["unrealized_pnl"] for p in self.portfolio_manager.portfolio["positions"].values())
        total_potential_loss = abs(current_unrealized_pnl) + potential_loss_total
        portfolio_risk_percent = (total_potential_loss / self.daily_initial_balance) * 100

        if portfolio_risk_percent > self.max_portfolio_risk:
            logger.warning(f"Trade for {symbol} rejected: Portfolio risk ({portfolio_risk_percent:.2f}%) exceeds max allowed ({self.max_portfolio_risk}%).")
            return {"allowed": False, "reason": f"Portfolio risk ({portfolio_risk_percent:.2f}%) exceeds max allowed ({self.max_portfolio_risk}%)"}

        return {"allowed": True, "potential_loss_usd": potential_loss_total, "position_risk_percent": position_risk_percent}

    def check_daily_loss_limit(self) -> bool:
        """Check if daily loss limit has been reached (based on daily high balance)."""
        self._reset_daily_metrics()
        current_balance = self.portfolio_manager.portfolio["balance"]["total"]
        
        # Update daily high balance
        if current_balance > self.daily_high_balance:
            self.daily_high_balance = current_balance

        # Calculate drawdown from daily high
        drawdown_percent = calculate_percentage_change(self.daily_high_balance, current_balance) * -1

        if drawdown_percent >= self.max_daily_loss_percent:
            logger.warning(f"Daily loss limit reached! Current drawdown: {drawdown_percent:.2f}% (Max: {self.max_daily_loss_percent}%).")
            return True
        return False

    def get_stop_loss_price(self, entry_price: float, side: str) -> float:
        """Calculate static stop loss price based on entry and percentage."""
        if side.lower() == "buy":
            return entry_price * (1 - self.stop_loss_percent / 100)
        elif side.lower() == "sell":
            return entry_price * (1 + self.stop_loss_percent / 100)
        return 0.0

    def get_take_profit_price(self, entry_price: float, side: str) -> float:
        """Calculate take profit price based on entry and percentage."""
        if side.lower() == "buy":
            return entry_price * (1 + self.take_profit_percent / 100)
        elif side.lower() == "sell":
            return entry_price * (1 - self.take_profit_percent / 100)
        return 0.0

    def get_trailing_stop_price(self, current_price: float, entry_price: float, side: str) -> float:
        """Calculate trailing stop price."""
        if side.lower() == "buy":
            # For a long position, trailing stop moves up with price
            return current_price * (1 - self.trailing_stop_percent / 100)
        elif side.lower() == "sell":
            # For a short position, trailing stop moves down with price
            return current_price * (1 + self.trailing_stop_percent / 100)
        return 0.0

    def cleanup(self):
        """Cleanup resources."""
        logger.info("Risk manager cleanup completed.")


