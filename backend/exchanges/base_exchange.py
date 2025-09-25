from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from enum import Enum
import asyncio
from ..utils.logger import setup_logger

logger = setup_logger("base_exchange")

class OrderType(Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"
    TAKE_PROFIT = "take_profit"

class OrderSide(Enum):
    BUY = "buy"
    SELL = "sell"

class OrderStatus(Enum):
    PENDING = "pending"
    OPEN = "open"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"

class BaseExchange(ABC):
    """Base class for all exchange implementations"""
    
    def __init__(self, api_key: str, api_secret: str, testnet: bool = True):
        self.api_key = api_key
        self.api_secret = api_secret
        self.testnet = testnet
        self.exchange = None
        self.connected = False
        
        # Trading limits for $5 account
        self.max_position_size = 2.0
        self.min_order_size = 0.5
        self.max_total_exposure = 5.0
    
    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize exchange connection"""
        pass
    
    @abstractmethod
    async def get_balance(self) -> Dict[str, float]:
        """Get account balance"""
        pass
    
    @abstractmethod
    async def get_ticker(self, symbol: str) -> Dict[str, Any]:
        """Get ticker data for symbol"""
        pass
    
    @abstractmethod
    async def place_order(self, symbol: str, side: str, order_type: str, 
                         amount: float, price: float = None) -> Dict[str, Any]:
        """Place an order"""
        pass
    
    @abstractmethod
    async def cancel_order(self, order_id: str, symbol: str) -> bool:
        """Cancel an order"""
        pass
    
    @abstractmethod
    async def get_order_status(self, order_id: str, symbol: str) -> Dict[str, Any]:
        """Get order status"""
        pass
    
    @abstractmethod
    async def get_open_orders(self, symbol: str = None) -> List[Dict[str, Any]]:
        """Get open orders"""
        pass
    
    @abstractmethod
    async def get_positions(self) -> List[Dict[str, Any]]:
        """Get open positions"""
        pass
    
    @abstractmethod
    async def get_ohlcv(self, symbol: str, timeframe: str = "1m", limit: int = 100) -> List[List[float]]:
        """Get OHLCV data for symbol"""
        pass
    
    def validate_order_size(self, amount_usd: float) -> bool:
        """Validate order size for $5 account"""
        if amount_usd < self.min_order_size:
            logger.warning(f"Order size ${amount_usd:.2f} below minimum ${self.min_order_size:.2f}")
            return False
        return True

    async def cleanup(self):
        """Cleanup resources"""
        pass


