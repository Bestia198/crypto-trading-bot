import asyncio
import json
import aioredis
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from ..utils.logger import setup_logger
from ..utils.config import config

logger = setup_logger("storage_manager")

class StorageManager:
    """Manages data storage using Redis"""
    
    def __init__(self):
        self.redis = None
        self.connected = False
        
        self.redis_host = config.get("database.redis.host", "localhost")
        self.redis_port = config.get("database.redis.port", 6379)
        self.redis_db = config.get("database.redis.db", 0)
        self.redis_password = config.get("database.redis.password")
    
    async def initialize(self):
        """Initialize Redis connection"""
        try:
            self.redis = await aioredis.create_redis_pool(
                f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}",
                password=self.redis_password,
                encoding='utf-8'
            )
            
            await self.redis.ping()
            self.connected = True
            
            logger.info(f"Connected to Redis at {self.redis_host}:{self.redis_port}")
            
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    async def set_cache(self, key: str, value: Any, expire: int = 3600):
        """Set cache value with expiration"""
        try:
            if not self.connected:
                return False
            
            json_value = json.dumps(value, default=str)
            await self.redis.setex(key, expire, json_value)
            return True
            
        except Exception as e:
            logger.error(f"Error setting cache {key}: {e}")
            return False
    
    async def get_cache(self, key: str) -> Optional[Any]:
        """Get cache value"""
        try:
            if not self.connected:
                return None
            
            value = await self.redis.get(key)
            if value:
                return json.loads(value)
            return None
            
        except Exception as e:
            logger.error(f"Error getting cache {key}: {e}")
            return None
    
    async def delete_cache(self, key: str) -> bool:
        """Delete cache key"""
        try:
            if not self.connected:
                return False
            
            result = await self.redis.delete(key)
            return result > 0
            
        except Exception as e:
            logger.error(f"Error deleting cache {key}: {e}")
            return False
    
    async def save_trade(self, trade_data: Dict[str, Any]) -> bool:
        """Save trade data"""
        try:
            trade_id = trade_data.get("id", f"trade_{datetime.utcnow().timestamp()}")
            key = f"trade:{trade_id}"
            
            return await self.set_cache(key, trade_data, expire=86400 * 30)
            
        except Exception as e:
            logger.error(f"Error saving trade: {e}")
            return False
    
    async def get_trades(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent trades"""
        try:
            if not self.connected:
                return []
            
            keys = await self.redis.keys("trade:*")
            trades = []
            
            for key in keys[-limit:]:
                trade_data = await self.get_cache(key)
                if trade_data:
                    trades.append(trade_data)
            
            trades.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            return trades
            
        except Exception as e:
            logger.error(f"Error getting trades: {e}")
            return []
    
    async def save_market_data(self, symbol: str, data: Dict[str, Any]) -> bool:
        """Save market data for symbol"""
        try:
            key = f"market_data:{symbol}"
            data["timestamp"] = datetime.utcnow().isoformat()
            
            return await self.set_cache(key, data, expire=300)
            
        except Exception as e:
            logger.error(f"Error saving market data for {symbol}: {e}")
            return False
    
    async def get_market_data(self, symbol: str = None) -> Dict[str, Any]:
        """Get market data"""
        try:
            if not self.connected:
                return {}
            
            if symbol:
                key = f"market_data:{symbol}"
                return await self.get_cache(key) or {}
            else:
                keys = await self.redis.keys("market_data:*")
                market_data = {}
                
                for key in keys:
                    symbol_name = key.split(":")[1]
                    data = await self.get_cache(key)
                    if data:
                        market_data[symbol_name] = data
                
                return market_data
                
        except Exception as e:
            logger.error(f"Error getting market data: {e}")
            return {}
    
    async def cleanup(self):
        """Cleanup resources"""
        try:
            if self.redis:
                self.redis.close()
                await self.redis.wait_closed()
                self.connected = False
                logger.info("Redis connection closed")
                
        except Exception as e:
            logger.error(f"Error closing Redis connection: {e}")

