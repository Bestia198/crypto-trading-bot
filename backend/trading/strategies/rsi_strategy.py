import asyncio
from typing import Dict, Any
from .base_strategy import BaseStrategy
from ...utils.logger import setup_logger
from ...exchanges.base_exchange import OrderSide, OrderType

logger = setup_logger("rsi_strategy")

class RSIStrategy(BaseStrategy):
    """Relative Strength Index (RSI) Strategy."""

    def __init__(self, exchange, portfolio_manager, risk_manager, market_data_collector, config):
        super().__init__(exchange, portfolio_manager, risk_manager, market_data_collector, config)
        self.strategy_config = config.get("strategies.rsi", {})
        self.symbols = self.strategy_config.get("symbols", [])
        self.rsi_period = self.strategy_config.get("rsi_period", 14)
        self.overbought_threshold = self.strategy_config.get("overbought_threshold", 70)
        self.oversold_threshold = self.strategy_config.get("oversold_threshold", 30)
        self.min_volume = self.strategy_config.get("min_volume", 1000000)

    async def execute(self):
        """Execute the RSI strategy logic."""
        for symbol in self.symbols:
            logger.info(f"Executing RSI Strategy for {symbol}")
            market_data = await self.market_data_collector.get_current_data(symbol)

            if not market_data:
                logger.warning(f"No market data for {symbol}. Skipping strategy execution.")
                continue

            # Check if suitable for small account (based on price threshold)
            if not market_data.get("small_account_info", {}).get("suitable_for_small_account", False):
                logger.info(f"{symbol} not suitable for small account based on price. Skipping.")
                continue

            # Check if it's a good time to trade based on general market conditions
            trade_readiness = await self.market_data_collector.is_good_time_to_trade(symbol)
            if not trade_readiness.get("good_time", False):
                logger.info(f"Not a good time to trade {symbol}: {trade_readiness.get('reason')}. Skipping.")
                continue

            current_price = market_data.get("price")
            rsi = market_data.get(f"rsi_{self.rsi_period}")
            volume = market_data.get("volume")

            if not all([current_price, rsi, volume]):
                logger.warning(f"Missing required data for {symbol}. Skipping strategy execution.")
                continue

            if volume < self.min_volume:
                logger.info(f"Volume for {symbol} ({volume}) is below minimum ({self.min_volume}). Skipping.")
                continue

            # Determine position size based on recommended size for small accounts
            recommended_position_size_usd = market_data.get("small_account_info", {}).get("recommended_position_size", 1.0)
            # Convert USD amount to asset quantity
            amount_to_trade = recommended_position_size_usd / current_price

            # Check if we have an open position for this symbol
            open_positions = self.portfolio_manager.portfolio["positions"]
            has_open_position = symbol in open_positions

            # Buy signal: RSI crosses below oversold threshold
            if rsi < self.oversold_threshold and not has_open_position:
                logger.info(f"BUY signal for {symbol}. RSI ({rsi:.2f}) < Oversold ({self.oversold_threshold})")
                if self.portfolio_manager.can_open_position(recommended_position_size_usd):
                    # Calculate stop loss and take profit
                    stop_loss_price = self.risk_manager.get_stop_loss_price(current_price, OrderSide.BUY.value)
                    take_profit_price = self.risk_manager.get_take_profit_price(current_price, OrderSide.BUY.value)

                    # Check risk before placing order
                    risk_check = self.risk_manager.check_trade_risk(symbol, current_price, stop_loss_price, amount_to_trade)
                    if risk_check["allowed"]:
                        logger.info(f"Placing BUY order for {amount_to_trade:.4f} {symbol} at {current_price:.4f}")
                        order_result = await self.exchange.place_order(symbol, OrderSide.BUY.value, OrderType.MARKET.value, amount_to_trade)
                        if order_result and order_result.get("status") == "filled":
                            await self.portfolio_manager.add_position(
                                symbol, OrderSide.BUY.value, amount_to_trade, current_price, order_result["id"]
                            )
                            logger.info(f"BUY order for {symbol} filled. Order ID: {order_result['id']}")
                        else:
                            logger.error(f"Failed to fill BUY order for {symbol}: {order_result.get('info', 'Unknown error')}")
                    else:
                        logger.warning(f"BUY order for {symbol} rejected due to risk: {risk_check['reason']}")
                else:
                    logger.warning(f"Cannot open BUY position for {symbol}: Portfolio manager rules.")

            # Sell signal: RSI crosses above overbought threshold
            elif rsi > self.overbought_threshold and has_open_position and open_positions[symbol]["side"] == OrderSide.BUY.value:
                logger.info(f"SELL signal for {symbol}. RSI ({rsi:.2f}) > Overbought ({self.overbought_threshold})")
                position = open_positions[symbol]
                # For simplicity, we close the entire position
                amount_to_close = position["amount"]

                logger.info(f"Placing SELL order for {amount_to_close:.4f} {symbol} at {current_price:.4f}")
                order_result = await self.exchange.place_order(symbol, OrderSide.SELL.value, OrderType.MARKET.value, amount_to_close)
                if order_result and order_result.get("status") == "filled":
                    await self.portfolio_manager.close_position(
                        symbol, current_price, order_result["id"]
                    )
                    logger.info(f"SELL order for {symbol} filled. Order ID: {order_result['id']}")
                else:
                    logger.error(f"Failed to fill SELL order for {symbol}: {order_result.get('info', 'Unknown error')}")

            # Check for Stop Loss / Take Profit on existing positions
            if has_open_position:
                position = open_positions[symbol]
                if position["side"] == OrderSide.BUY.value:
                    stop_loss_price = self.risk_manager.get_stop_loss_price(position["entry_price"], OrderSide.BUY.value)
                    take_profit_price = self.risk_manager.get_take_profit_price(position["entry_price"], OrderSide.BUY.value)

                    if current_price <= stop_loss_price:
                        logger.warning(f"STOP LOSS triggered for {symbol} at {current_price:.4f}")
                        # Place market sell order to close position
                        order_result = await self.exchange.place_order(symbol, OrderSide.SELL.value, OrderType.MARKET.value, position["amount"])
                        if order_result and order_result.get("status") == "filled":
                            await self.portfolio_manager.close_position(symbol, current_price, order_result["id"])
                            logger.info(f"Position for {symbol} closed by SL. Order ID: {order_result['id']}")
                        else:
                            logger.error(f"Failed to close {symbol} position by SL: {order_result.get('info', 'Unknown error')}")

                    elif current_price >= take_profit_price:
                        logger.warning(f"TAKE PROFIT triggered for {symbol} at {current_price:.4f}")
                        # Place market sell order to close position
                        order_result = await self.exchange.place_order(symbol, OrderSide.SELL.value, OrderType.MARKET.value, position["amount"])
                        if order_result and order_result.get("status") == "filled":
                            await self.portfolio_manager.close_position(symbol, current_price, order_result["id"])
                            logger.info(f"Position for {symbol} closed by TP. Order ID: {order_result['id']}")
                        else:
                            logger.error(f"Failed to close {symbol} position by TP: {order_result.get('info', 'Unknown error')}")

                # Add logic for SELL positions if your strategy supports shorting

    async def cleanup(self):
        """Cleanup resources specific to the strategy."""
        logger.info("RSI Strategy cleanup completed.")


