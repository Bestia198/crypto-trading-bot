from typing import Dict, Any
from ..utils.logger import setup_logger
from ..utils.config import config as global_config
from .strategies.simple_ma_strategy import SimpleMAStrategy
from .strategies.rsi_strategy import RSIStrategy # Import now

logger = setup_logger("strategy_manager")

class StrategyManager:
    """Zarządza i uruchamia strategie handlowe."""

    def __init__(self, exchange, portfolio_manager, risk_manager, market_data_collector, config=None):
        self.exchange = exchange
        self.portfolio_manager = portfolio_manager
        self.risk_manager = risk_manager
        self.market_data_collector = market_data_collector
        self.config: Any = config or global_config
        self.strategies: Dict[str, Any] = {}
        self._load_strategies()

    def _load_strategies(self):
        """Ładowanie włączonych strategii z konfiguracji."""
        strategy_configs = self.config.get("strategies", {})
        simple_ma_enabled = self.config.get("strategies.simple_ma.enabled", False)
        if simple_ma_enabled:
            self.strategies["simple_ma"] = SimpleMAStrategy(
                exchange=self.exchange,
                portfolio_manager=self.portfolio_manager,
                risk_manager=self.risk_manager,
                market_data_collector=self.market_data_collector,
                config=self.config
            )
            logger.info("Załadowano strategię Simple MA.")
        
        rsi_enabled = self.config.get("strategies.rsi.enabled", False)
        if rsi_enabled:
            self.strategies["rsi"] = RSIStrategy(
                exchange=self.exchange,
                portfolio_manager=self.portfolio_manager,
                risk_manager=self.risk_manager,
                market_data_collector=self.market_data_collector,
                config=self.config
            )
            logger.info("Załadowano strategię RSI.")

    async def run_strategies(self):
        """Uruchom wszystkie włączone strategie."""
        for name, strategy in self.strategies.items():
            logger.info(f"Uruchamianie strategii: {name}")
            await strategy.execute()

    async def cleanup(self):
        """Sprzątanie zasobów strategii."""
        for strategy in self.strategies.values():
            await strategy.cleanup()
        logger.info("Zakończono sprzątanie StrategyManager.")


