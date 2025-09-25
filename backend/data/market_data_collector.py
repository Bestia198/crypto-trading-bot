import asyncio
from typing import Dict, Any, List
from datetime import datetime
from ..utils.logger import setup_logger
from ..utils.helpers import safe_float
import pandas as pd
import pandas_ta as ta

logger = setup_logger("market_data_collector")

class MarketDataCollector:
    """Collects and manages market data for small account trading"""
    
    def __init__(self, storage_manager, database_manager, exchange):
        self.storage_manager = storage_manager
        self.database_manager = database_manager
        self.exchange = exchange
        self.running = False
        
        # Symbols optimized for $5 account
        self.symbols = ["BTC/USDT", "ETH/USDT", "BNB/USDT"]
        self.update_interval = 30  # 30 seconds
        self.ohlcv_interval = "1m" # 1-minute OHLCV data
        
        self.market_data = {}
        self.price_history = {}
    
    async def initialize(self):
        """Initialize market data collector"""
        try:
            logger.info("Initializing market data collector")
            
            # Load existing data from storage
            stored_data = await self.storage_manager.get_market_data()
            if stored_data:
                self.market_data = stored_data
            
            logger.info(f"Market data collector initialized for {len(self.symbols)} symbols")
            
        except Exception as e:
            logger.error(f"Error initializing market data collector: {e}")
    
    async def start(self):
        """Start collecting market data"""
        if self.running:
            return
        
        self.running = True
        logger.info("Starting market data collection")
        
        # Start collection tasks
        asyncio.create_task(self._collection_loop())
        asyncio.create_task(self._ohlcv_collection_loop())
    
    async def stop(self):
        """Stop collecting market data"""
        self.running = False
        logger.info("Market data collection stopped")
    
    async def _collection_loop(self):
        """Main collection loop for ticker data"""
        while self.running:
            try:
                await self._collect_ticker_data()
                await asyncio.sleep(self.update_interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in ticker collection loop: {e}")
                await asyncio.sleep(5)

    async def _ohlcv_collection_loop(self):
        """Main collection loop for OHLCV data"""
        while self.running:
            try:
                await self._collect_ohlcv_data()
                await asyncio.sleep(60) # Collect OHLCV every minute
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in OHLCV collection loop: {e}")
                await asyncio.sleep(5)
    
    async def _collect_ticker_data(self):
        """Collect ticker data for all symbols"""
        try:
            for symbol in self.symbols:
                try:
                    # Get ticker data
                    ticker = await self.exchange.get_ticker(symbol)
                    
                    if ticker and ticker.get("price"):
                        # Process and store data
                        processed_data = self._process_ticker_data(symbol, ticker)
                        
                        # Update local storage
                        self.market_data[symbol] = processed_data
                        
                        # Update price history (for in-memory indicators)
                        self._update_price_history(symbol, processed_data["price"])
                        
                        # Save to Redis
                        await self.storage_manager.save_market_data(symbol, processed_data)
                        
                except Exception as e:
                    logger.error(f"Error collecting ticker data for {symbol}: {e}")
            
            logger.debug(f"Market data updated for {len(self.market_data)} symbols")
            
        except Exception as e:
            logger.error(f"Error in ticker data collection: {e}")

    async def _collect_ohlcv_data(self):
        """Collect OHLCV data for all symbols and store in PostgreSQL"""
        try:
            for symbol in self.symbols:
                try:
                    ohlcv = await self.exchange.get_ohlcv(symbol, self.ohlcv_interval, limit=1) # Get latest candle
                    if ohlcv and len(ohlcv) > 0:
                        candle = ohlcv[0]
                        data_to_save = {
                            "timestamp": datetime.fromtimestamp(candle[0] / 1000), # Convert ms to seconds
                            "symbol": symbol,
                            "open": candle[1],
                            "high": candle[2],
                            "low": candle[3],
                            "close": candle[4],
                            "volume": candle[5]
                        }
                        self.database_manager.add_market_data(data_to_save)
                        logger.debug(f"OHLCV data saved for {symbol} at {data_to_save['timestamp']}")
                except Exception as e:
                    logger.error(f"Error collecting OHLCV data for {symbol}: {e}")
        except Exception as e:
            logger.error(f"Error in OHLCV data collection: {e}")
    
    def _process_ticker_data(self, symbol: str, ticker: Dict[str, Any]) -> Dict[str, Any]:
        """Process raw ticker data"""
        current_price = safe_float(ticker.get("price"))
        
        # Calculate additional metrics
        processed = {
            "symbol": symbol,
            "price": current_price,
            "bid": safe_float(ticker.get("bid")),
            "ask": safe_float(ticker.get("ask")),
            "volume": safe_float(ticker.get("volume")),
            "change": safe_float(ticker.get("change")),
            "percentage": safe_float(ticker.get("percentage")),
            "timestamp": datetime.utcnow().isoformat(),
            "last_update": datetime.utcnow().timestamp()
        }
        
        # Add technical indicators for small account
        if symbol in self.price_history:
            history = self.price_history[symbol]
            prices = pd.Series([item["price"] for item in history])

            if len(prices) >= 20:
                processed.update(self._calculate_simple_indicators(history))
            if len(prices) >= 14: # RSI typically uses 14 periods
                rsi_data = ta.rsi(prices, length=14)
                if not rsi_data.empty:
                    processed["rsi_14"] = rsi_data.iloc[-1]
            
            if len(prices) >= 26: # MACD typically uses 12, 26, 9 periods
                macd_data = ta.macd(prices, fast=12, slow=26, signal=9)
                if not macd_data.empty:
                    processed["macd"] = macd_data["MACD_12_26_9"].iloc[-1]
                    processed["macd_hist"] = macd_data["MACDH_12_26_9"].iloc[-1]
                    processed["macd_signal"] = macd_data["MACDS_12_26_9"].iloc[-1]

            if len(prices) >= 20: # Bollinger Bands typically use 20 periods
                bbands_data = ta.bbands(prices, length=20, std=2)
                if not bbands_data.empty:
                    processed["bb_lower"] = bbands_data["BBL_20_2.0"].iloc[-1]
                    processed["bb_middle"] = bbands_data["BBM_20_2.0"].iloc[-1]
                    processed["bb_upper"] = bbands_data["BBU_20_2.0"].iloc[-1]

        # Add trading recommendations for small account
        processed["small_account_info"] = self._get_small_account_info(symbol, current_price)
        
        return processed
    
    def _update_price_history(self, symbol: str, price: float):
        """Update price history for technical analysis"""
        if symbol not in self.price_history:
            self.price_history[symbol] = []
        
        self.price_history[symbol].append({
            "price": price,
            "timestamp": datetime.utcnow().timestamp()
        })
        
        # Keep only last 50 prices (for simple indicators and RSI)
        if len(self.price_history[symbol]) > 50:
            self.price_history[symbol] = self.price_history[symbol][-50:]
    
    def _calculate_simple_indicators(self, history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate simple technical indicators"""
        prices = [item["price"] for item in history[-20:]]  # Last 20 prices
        
        indicators = {}
        
        # Simple Moving Averages
        if len(prices) >= 5:
            indicators["sma_5"] = sum(prices[-5:]) / 5
        
        if len(prices) >= 10:
            indicators["sma_10"] = sum(prices[-10:]) / 10
        
        if len(prices) >= 20:
            indicators["sma_20"] = sum(prices[-20:]) / 20
        
        # Price trend (simple)
        if len(prices) >= 3:
            recent_avg = sum(prices[-3:]) / 3
            older_avg = sum(prices[-6:-3]) / 3 if len(prices) >= 6 else recent_avg
            
            if recent_avg > older_avg * 1.01:
                indicators["trend"] = "UP"
            elif recent_avg < older_avg * 0.99:
                indicators["trend"] = "DOWN"
            else:
                indicators["trend"] = "SIDEWAYS"
        
        # Volatility (simple)
        if len(prices) >= 10:
            avg_price = sum(prices[-10:]) / 10
            variance = sum((p - avg_price) ** 2 for p in prices[-10:]) / 10
            indicators["volatility"] = (variance ** 0.5) / avg_price * 100
        
        return indicators
    
    def _get_small_account_info(self, symbol: str, price: float) -> Dict[str, Any]:
        """Get trading info specific to small accounts"""
        # Calculate minimum order requirements
        min_notional = 5.0  # Binance minimum
        min_quantity = min_notional / price
        
        # Calculate what $1 and $2 would buy
        quantity_1usd = 1.0 / price
        quantity_2usd = 2.0 / price
        
        return {
            "min_order_usd": min_notional,
            "min_quantity": min_quantity,
            "quantity_for_1usd": quantity_1usd,
            "quantity_for_2usd": quantity_2usd,
            "suitable_for_small_account": price < 1000,  # Arbitrary threshold
            "recommended_position_size": min(2.0, min_notional * 1.1)
        }
    
    async def get_current_data(self, symbol: str = None) -> Dict[str, Any]:
        """Get current market data"""
        if symbol:
            return self.market_data.get(symbol, {})
        return self.market_data.copy()
    
    async def get_price_history(self, symbol: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get price history for symbol"""
        if symbol in self.price_history:
            return self.price_history[symbol][-limit:]
        return []
    
    async def is_good_time_to_trade(self, symbol: str) -> Dict[str, Any]:
        """Determine if it\"s a good time to trade for small account"""
        data = self.market_data.get(symbol, {})
        
        if not data:
            return {"good_time": False, "reason": "No market data available"}
        
        # Check volatility
        volatility = data.get("volatility", 0)
        if volatility > 5:  # More than 5% volatility
            return {"good_time": False, "reason": "High volatility - risky for small account"}
        
        # Check volume
        volume = data.get("volume", 0)
        if volume < 100000:  # Low volume threshold
            return {"good_time": False, "reason": "Low volume - poor liquidity"}
        
        # Check trend
        trend = data.get("trend", "UNKNOWN")
        if trend == "SIDEWAYS":
            return {"good_time": False, "reason": "Sideways market - wait for clear direction"}
        
        # Check spread (bid-ask)
        bid = data.get("bid", 0)
        ask = data.get("ask", 0)
        if bid > 0 and ask > 0:
            spread_percent = ((ask - bid) / bid) * 100
            if spread_percent > 0.1:  # More than 0.1% spread
                return {"good_time": False, "reason": "Wide spread - high trading costs"}
        
        return {
            "good_time": True,
            "trend": trend,
            "volatility": volatility,
            "volume": volume,
            "recommendation": f"Good time to trade {symbol} - {trend} trend with moderate volatility"
        }
    
    async def cleanup(self):
        """Cleanup resources"""
        await self.stop()
        logger.info("Market data collector cleanup completed")




