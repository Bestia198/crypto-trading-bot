import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
import uvicorn

from .utils.logger import setup_logger
from .utils.config import config
from .data.storage_manager import StorageManager
from .data.database_manager import DatabaseManager
from .data.market_data_collector import MarketDataCollector
from .exchanges.binance_testnet import BinanceTestnet
from .trading.portfolio_manager import PortfolioManager
from .trading.risk_manager import RiskManager
from .trading.strategy_manager import StrategyManager
from .api.rest_api import router as api_router

logger = setup_logger("main")

# Initialize components globally
storage_manager: StorageManager = None
database_manager: DatabaseManager = None
exchange: BinanceTestnet = None
market_data_collector: MarketDataCollector = None
portfolio_manager: PortfolioManager = None
risk_manager: RiskManager = None
strategy_manager: StrategyManager = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global storage_manager, database_manager, exchange, market_data_collector, portfolio_manager, risk_manager, strategy_manager

    logger.info("Starting up application...")

    # 1. Initialize Storage Manager (Redis)
    storage_manager = StorageManager()
    try:
        await storage_manager.initialize()
    except Exception as e:
        logger.critical(f"Failed to initialize Storage Manager: {e}. Exiting.")
        yield
        return

    # 2. Initialize Database Manager (PostgreSQL)
    database_manager = DatabaseManager()
    if not database_manager.engine:
        logger.critical("Failed to initialize Database Manager. Exiting.")
        yield
        return

    # 3. Initialize Exchange (Binance Testnet)
    api_key = config.get("exchanges.binance.api_key")
    api_secret = config.get("exchanges.binance.api_secret")
    testnet_enabled = config.get("exchanges.binance.testnet", True)
    exchange = BinanceTestnet(api_key, api_secret, testnet=testnet_enabled)
    if not await exchange.initialize():
        logger.critical("Failed to initialize Exchange. Exiting.")
        yield
        return

    # 4. Initialize Portfolio Manager
    portfolio_manager = PortfolioManager(exchange, storage_manager, database_manager, config)
    await portfolio_manager.initialize()

    # 5. Initialize Risk Manager
    risk_manager = RiskManager(portfolio_manager)

    # 6. Initialize Market Data Collector
    market_data_collector = MarketDataCollector(storage_manager, database_manager, exchange)
    await market_data_collector.initialize()
    asyncio.create_task(market_data_collector.start()) # Start data collection in background

    # 7. Initialize Strategy Manager
    strategy_manager = StrategyManager(exchange, portfolio_manager, risk_manager, market_data_collector, config)

    # Start periodic strategy execution
    async def strategy_loop():
        while True:
            try:
                await strategy_manager.run_strategies()
            except Exception as e:
                logger.error(f"Error during strategy execution: {e}")
            await asyncio.sleep(config.get("trading.strategy_interval", 60)) # Run strategies every 60 seconds

    asyncio.create_task(strategy_loop())

    logger.info("Application startup complete.")
    yield

    logger.info("Shutting down application...")
    # Cleanup resources
    await market_data_collector.cleanup()
    await strategy_manager.cleanup()
    await portfolio_manager.cleanup()
    await exchange.cleanup()
    await storage_manager.cleanup()
    database_manager.cleanup()
    logger.info("Application shutdown complete.")

app = FastAPI(lifespan=lifespan)

# Include API routes
app.include_router(api_router)

@app.get("/status")
async def get_status():
    return {"status": "ok", "message": "Crypto Trading Bot is running"}

@app.get("/portfolio")
async def get_portfolio():
    if portfolio_manager:
        return portfolio_manager.get_portfolio_summary()
    return {"error": "Portfolio manager not initialized"}

@app.get("/market_data")
async def get_market_data():
    if market_data_collector:
        return await market_data_collector.get_current_data()
    return {"error": "Market data collector not initialized"}

@app.get("/trades")
async def get_trades():
    if database_manager:
        trades = database_manager.get_trades()
        return [{
            "id": trade.id,
            "timestamp": trade.timestamp.isoformat(),
            "symbol": trade.symbol,
            "side": trade.side,
            "entry_price": trade.entry_price,
            "exit_price": trade.exit_price,
            "amount": trade.amount,
            "profit_loss_usd": trade.profit_loss_usd,
            "is_open": trade.is_open
        } for trade in trades]
    return {"error": "Database manager not initialized"}

if __name__ == "__main__":
    host = config.get("server.host", "0.0.0.0")
    port = config.get("server.port", 8000)
    log_level = config.get("logging.level", "info").lower()
    uvicorn.run(app, host=host, port=port, log_level=log_level)


