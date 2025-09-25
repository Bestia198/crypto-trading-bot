import asyncio
from typing import Dict, Any, List
from datetime import datetime
from ..utils.logger import setup_logger
from ..utils.helpers import safe_float, calculate_pnl

logger = setup_logger("portfolio_manager")

class PortfolioManager:
    """Manages the trading portfolio, balances, and positions."""

    def __init__(self, exchange, storage_manager, database_manager, config):
        self.exchange = exchange
        self.storage_manager = storage_manager
        self.database_manager = database_manager
        self.config = config
        self.portfolio = {
            "balance": {
                "total": safe_float(config.get("trading.initial_balance", 5.0)),
                "available": safe_float(config.get("trading.initial_balance", 5.0)),
                "locked": 0.0
            },
            "positions": {},
            "trades": []
        }
        self.max_positions = config.get('trading.max_positions', 2)
        self.min_position_size = config.get('trading.min_position_size', 0.5)
        self.max_position_size = config.get("trading.max_position_size", 2.0)

    async def initialize(self):
        """Initialize portfolio by fetching balances and positions from exchange."""
        logger.info("Initializing portfolio manager...")
        try:
            # Fetch actual balance from exchange if connected
            if self.exchange.connected:
                exchange_balance = await self.exchange.get_balance()
                if exchange_balance:
                    self.portfolio["balance"]["total"] = safe_float(exchange_balance.get('USDT', 0.0))
                    self.portfolio["balance"]["available"] = safe_float(exchange_balance.get('USDT', 0.0))
                    logger.info(f"Fetched initial balance from exchange: {self.portfolio['balance']['total']}")

            # Load past trades from storage
            past_trades = await self.storage_manager.get_trades()
            if past_trades:
                self.portfolio["trades"].extend(past_trades)
                logger.info(f"Loaded {len(past_trades)} past trades from storage.")

            logger.info("Portfolio manager initialized.")
        except Exception as e:
            logger.error(f"Error initializing portfolio manager: {e}")

    async def update_balance(self):
        """Update account balance from exchange."""
        if not self.exchange.connected:
            logger.warning("Cannot update balance: Not connected to exchange.")
            return

        try:
            exchange_balance = await self.exchange.get_balance()
            if exchange_balance:
                self.portfolio["balance"]["total"] = safe_float(exchange_balance.get('USDT', 0.0))
                # For simplicity, assuming available is total for now, refine with actual locked funds later
                self.portfolio["balance"]["available"] = safe_float(exchange_balance.get('USDT', 0.0))
                self.portfolio["balance"]["locked"] = 0.0 # Reset locked, will be recalculated from open orders/positions
                logger.debug(f"Balance updated: {self.portfolio['balance']['total']}")
        except Exception as e:
            logger.error(f"Error updating balance: {e}")

    async def add_position(self, symbol: str, side: str, amount: float, entry_price: float, order_id: str):
        """Add a new position to the portfolio."""
        if symbol in self.portfolio["positions"]:
            logger.warning(f"Position for {symbol} already exists. Consider updating instead.")
            return

        self.portfolio["positions"][symbol] = {
            'symbol': symbol,
            'side': side,
            "amount": amount,
            'entry_price': entry_price,
            'current_price': entry_price, # Initialize with entry price
            'unrealized_pnl': 0.0,
            'order_id': order_id,
            'timestamp': datetime.utcnow().isoformat()
        }
        logger.info(f"Added new position: {side} {amount} {symbol} at {entry_price}")
        await self.update_balance() # Balance might change after opening a position

    async def update_position(self, symbol: str, current_price: float):
        """Update an existing position with current market data."""
        if symbol not in self.portfolio["positions"]:
            logger.warning(f"Position for {symbol} not found.")
            return

        position = self.portfolio["positions"][symbol]
        position['current_price'] = current_price
        position['unrealized_pnl'] = calculate_pnl(
            position['entry_price'], current_price, position["amount"], position['side']
        )
        logger.debug(f"Updated position for {symbol}. PnL: {position['unrealized_pnl']:.2f}")

    async def close_position(self, symbol: str, exit_price: float, trade_id: str):
        """Close a position and record the trade."""
        if symbol not in self.portfolio["positions"]:
            logger.warning(f"Cannot close position: {symbol} not found.")
            return

        position = self.portfolio["positions"].pop(symbol)
        realized_pnl = calculate_pnl(
            position['entry_price'], exit_price, position["amount"], position['side']
        )

        trade_data = {
           "id": trade_id,
            'symbol': symbol,
            'side': position['side'],
            "amount": position["amount"],
            'entry_price': position['entry_price'],
            'exit_price': exit_price,
            'realized_pnl': realized_pnl,
            'timestamp': datetime.utcnow().isoformat()
        }
        self.portfolio["trades"].append(trade_data)
        await self.storage_manager.save_trade(trade_data)

        logger.info(f"Closed position for {symbol}. Realized PnL: {realized_pnl:.2f}")
        await self.update_balance() # Balance might change after closing a position

    def get_portfolio_summary(self) -> Dict[str, Any]:
        """Get a summary of the current portfolio."""
        total_unrealized_pnl = sum(p['unrealized_pnl'] for p in self.portfolio["positions"].values())
        return {
            "balance": self.portfolio["balance"],
            'open_positions_count': len(self.portfolio["positions"]),
            'total_unrealized_pnl': total_unrealized_pnl,
            'total_realized_pnl': sum(t['realized_pnl'] for t in self.portfolio["trades"]),
            "positions": list(self.portfolio["positions"].values())
        }

    def can_open_position(self, amount_usd: float) -> bool:
        """Check if a new position can be opened based on limits."""
        if len(self.portfolio["positions"]) >= self.max_positions:
            logger.warning("Cannot open new position: Max positions limit reached.")
            return False

        if amount_usd < self.min_position_size:
            logger.warning(f"Cannot open new position: Amount ${amount_usd:.2f} is below minimum position size ${self.min_position_size:.2f}.")
            return False

        if amount_usd > self.max_position_size:
            logger.warning(f"Cannot open new position: Amount ${amount_usd:.2f} exceeds maximum position size ${self.max_position_size:.2f}.")
            return False

        # Check if enough available balance
        if amount_usd > self.portfolio["balance"]["available"]:
            logger.warning(f"Cannot open new position: Insufficient available balance. Needed: ${amount_usd:.2f}, Available: ${self.portfolio['balance']['available']:.2f}.")
            return False

        return True

    async def cleanup(self):
        """Cleanup resources."""
        logger.info("Portfolio manager cleanup completed.")


