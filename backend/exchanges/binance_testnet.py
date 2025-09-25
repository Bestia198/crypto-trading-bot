
import ccxt.async_support as ccxt
from typing import Dict, Any, List, Optional
from .base_exchange import BaseExchange, OrderType, OrderSide, OrderStatus
from ..utils.logger import setup_logger
from ..utils.helpers import safe_float, retry_async

logger = setup_logger('binance_testnet')

class BinanceTestnet(BaseExchange):
    """Binance Testnet exchange implementation"""

    def __init__(self, api_key: str, api_secret: str, testnet: bool = True):
        super().__init__(api_key, api_secret, testnet)
        self.exchange_id = 'binance'
        self.exchange_class = getattr(ccxt, self.exchange_id)
        self.exchange = None

    async def initialize(self) -> bool:
        """Initialize Binance Testnet connection"""
        try:
            self.exchange = self.exchange_class({
                'apiKey': self.api_key,
                'secret': self.api_secret,
                'enableRateLimit': True,
                'options': {
                    'defaultType': 'future',  # Use futures for testnet
                    'adjustForTimeDifference': True,
                },
                'urls': {
                    'api': {
                        'public': 'https://testnet.binancefuture.com/fapi/v1',
                        'private': 'https://testnet.binancefuture.com/fapi/v1'
                    }
                }
            })

            if self.testnet:
                self.exchange.set_sandbox_mode(True)

            await self.exchange.load_markets()
            self.connected = True
            logger.info(f"Connected to Binance Testnet: {self.exchange.id}")
            return True

        except Exception as e:
            logger.error(f"Failed to connect to Binance Testnet: {e}")
            self.connected = False
            return False

    async def get_balance(self) -> Dict[str, float]:
        """Get account balance"""
        if not self.connected:
            return {}

        try:
            balance = await retry_async(lambda: self.exchange.fetch_balance())

            # Filter for USDT and other relevant assets
            usdt_balance = safe_float(balance.get('USDT', {}).get('free', 0.0))

            # For a $5 account, we might only care about USDT
            return {"USDT": usdt_balance, "total": usdt_balance}

        except Exception as e:
            logger.error(f"Error getting balance from Binance Testnet: {e}")
            return {}

    async def get_ticker(self, symbol: str) -> Dict[str, Any]:
        """Get ticker data for symbol"""
        if not self.connected:
            return {}

        try:
            ticker = await retry_async(lambda: self.exchange.fetch_ticker(symbol))
            return {
                'symbol': ticker['symbol'],
                'price': safe_float(ticker['last']),
                'bid': safe_float(ticker['bid']),
                'ask': safe_float(ticker['ask']),
                'volume': safe_float(ticker['quoteVolume']),
                'change': safe_float(ticker['change']),
                'percentage': safe_float(ticker['percentage']),
                'timestamp': ticker['timestamp']
            }
        except Exception as e:
            logger.error(f"Error getting ticker for {symbol} from Binance Testnet: {e}")
            return {}

    async def place_order(self, symbol: str, side: str, order_type: str,
                         amount: float, price: float = None) -> Dict[str, Any]:
        """Place an order"""
        if not self.connected:
            return {"status": OrderStatus.REJECTED.value, "info": "Not connected to exchange"}

        if not self.validate_order_size(amount * (price if price else 1)): # Validate USD value
            return {"status": OrderStatus.REJECTED.value, "info": "Order size validation failed"}

        try:
            order = None
            if order_type == OrderType.MARKET.value:
                order = await retry_async(lambda: self.exchange.create_market_order(symbol, side, amount))
            elif order_type == OrderType.LIMIT.value and price:
                order = await retry_async(lambda: self.exchange.create_limit_order(symbol, side, amount, price))
            else:
                logger.warning(f"Unsupported order type or missing price for limit order: {order_type}")
                return {"status": OrderStatus.REJECTED.value, "info": "Unsupported order type"}

            return {
                'id': order['id'],
                'symbol': order['symbol'],
                'type': order['type'],
                'side': order['side'],
                'amount': safe_float(order['amount']),
                'price': safe_float(order['price']),
                'filled': safe_float(order['filled']),
                'remaining': safe_float(order['remaining']),
                'status': order['status'].lower(),
                'timestamp': order['timestamp']
            }
        except Exception as e:
            logger.error(f"Error placing order on Binance Testnet: {e}")
            return {"status": OrderStatus.REJECTED.value, "info": str(e)}

    async def cancel_order(self, order_id: str, symbol: str) -> bool:
        """Cancel an order"""
        if not self.connected:
            return False

        try:
            await retry_async(lambda: self.exchange.cancel_order(order_id, symbol))
            logger.info(f"Order {order_id} for {symbol} cancelled on Binance Testnet")
            return True
        except Exception as e:
            logger.error(f"Error cancelling order {order_id} for {symbol} on Binance Testnet: {e}")
            return False

    async def get_order_status(self, order_id: str, symbol: str) -> Dict[str, Any]:
        """Get order status"""
        if not self.connected:
            return {"status": OrderStatus.REJECTED.value, "info": "Not connected to exchange"}

        try:
            order = await retry_async(lambda: self.exchange.fetch_order(order_id, symbol))
            return {
                'id': order['id'],
                'symbol': order['symbol'],
                'type': order['type'],
                'side': order['side'],
                'amount': safe_float(order['amount']),
                'price': safe_float(order['price']),
                'filled': safe_float(order['filled']),
                'remaining': safe_float(order['remaining']),
                'status': order['status'].lower(),
                'timestamp': order['timestamp']
            }
        except Exception as e:
            logger.error(f"Error getting order status for {order_id} on Binance Testnet: {e}")
            return {"status": OrderStatus.REJECTED.value, "info": str(e)}

    async def get_open_orders(self, symbol: str = None) -> List[Dict[str, Any]]:
        """Get open orders"""
        if not self.connected:
            return []

        try:
            orders = await retry_async(lambda: self.exchange.fetch_open_orders(symbol))
            return [{
                'id': order['id'],
                'symbol': order['symbol'],
                'type': order['type'],
                'side': order['side'],
                'amount': safe_float(order['amount']),
                'price': safe_float(order['price']),
                'filled': safe_float(order['filled']),
                'remaining': safe_float(order['remaining']),
                'status': order['status'].lower(),
                'timestamp': order['timestamp']
            } for order in orders]
        except Exception as e:
            logger.error(f"Error getting open orders from Binance Testnet: {e}")
            return []

    async def get_positions(self) -> List[Dict[str, Any]]:
        """Get open positions"""
        if not self.connected:
            return []

        try:
            # Binance futures positions are part of fetch_balance
            balance = await retry_async(lambda: self.exchange.fetch_balance())
            positions = []

            # Iterate through all assets to find positions
            for currency, data in balance.items():
                if 'info' in data and 'positions' in data['info']:
                    for position_data in data['info']['positions']:
                        if safe_float(position_data.get('positionAmt')) != 0:
                            positions.append({
                                'symbol': position_data.get('symbol'),
                                'entry_price': safe_float(position_data.get('entryPrice')),
                                'amount': safe_float(position_data.get('positionAmt')),
                                'side': 'long' if safe_float(position_data.get('positionAmt')) > 0 else 'short',
                                'unrealized_pnl': safe_float(position_data.get('unrealizedProfit')),
                                'timestamp': balance.get('timestamp')
                            })
            return positions
        except Exception as e:
            logger.error(f"Error getting positions from Binance Testnet: {e}")
            return []

    async def get_ohlcv(self, symbol: str, timeframe: str = "1m", limit: int = 100) -> List[List[float]]:
        """Get OHLCV data for symbol"""
        if not self.connected:
            return []

        try:
            ohlcv = await retry_async(lambda: self.exchange.fetch_ohlcv(symbol, timeframe, limit=limit))
            return ohlcv
        except Exception as e:
            logger.error(f"Error getting OHLCV data for {symbol} from Binance Testnet: {e}")
            return []

    async def cleanup(self):
        """Cleanup resources"""
        if self.exchange:
            await self.exchange.close()
            logger.info("Binance Testnet connection closed")


