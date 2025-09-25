from abc import ABC, abstractmethod
from typing import Dict, Any
from ...utils.logger import setup_logger

logger = setup_logger('base_strategy')

class BaseStrategy(ABC):
    """Base class for all trading strategies."""

    def __init__(self, exchange, portfolio_manager, risk_manager, market_data_collector, config):
        self.exchange = exchange
        self.portfolio_manager = portfolio_manager
        self.risk_manager = risk_manager
        self.market_data_collector = market_data_collector
        self.config = config

    @abstractmethod
    async def execute(self):
        """Execute the trading strategy logic."""
        pass

    async def cleanup(self):
        """Cleanup resources specific to the strategy."""
        pass


