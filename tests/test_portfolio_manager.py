import pytest
import asyncio
from unittest.mock import Mock, AsyncMock
from datetime import datetime

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from backend.trading.portfolio_manager import PortfolioManager
from backend.utils.config import config

class TestPortfolioManager:
    
    @pytest.fixture
    def mock_exchange(self):
        exchange = Mock()
        exchange.connected = True
        exchange.get_balance = AsyncMock(return_value={'USDT': 5.0, 'total': 5.0})
        return exchange
    
    @pytest.fixture
    def mock_storage_manager(self):
        storage = Mock()
        storage.get_trades = AsyncMock(return_value=[])
        storage.save_trade = AsyncMock(return_value=True)
        return storage
    
    @pytest.fixture
    def mock_database_manager(self):
        database = Mock()
        return database
    
    @pytest.fixture
    def mock_config(self):
        return {
            'trading': {
                'initial_balance': 5.0,
                'max_positions': 2,
                'min_position_size': 0.5,
                'max_position_size': 2.0
            }
        }
    
    @pytest.fixture
    def portfolio_manager(self, mock_exchange, mock_storage_manager, mock_database_manager, mock_config):
        return PortfolioManager(mock_exchange, mock_storage_manager, mock_database_manager, mock_config)
    
    @pytest.mark.asyncio
    async def test_initialization(self, portfolio_manager, mock_exchange):
        await portfolio_manager.initialize()
        
        assert portfolio_manager.portfolio['balance']['total'] == 5.0
        assert portfolio_manager.portfolio['balance']['available'] == 5.0
        mock_exchange.get_balance.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_can_open_position_valid(self, portfolio_manager):
        await portfolio_manager.initialize()
        
        # Test valid position size
        assert portfolio_manager.can_open_position(1.0) == True
        
        # Test minimum position size
        assert portfolio_manager.can_open_position(0.5) == True
        
        # Test maximum position size
        assert portfolio_manager.can_open_position(2.0) == True
    
    @pytest.mark.asyncio
    async def test_can_open_position_invalid(self, portfolio_manager):
        await portfolio_manager.initialize()
        
        # Test below minimum
        assert portfolio_manager.can_open_position(0.3) == False
        
        # Test above maximum
        assert portfolio_manager.can_open_position(3.0) == False
        
        # Test insufficient balance
        assert portfolio_manager.can_open_position(6.0) == False
    
    @pytest.mark.asyncio
    async def test_add_position(self, portfolio_manager):
        await portfolio_manager.initialize()
        
        await portfolio_manager.add_position(
            symbol="BTC/USDT",
            side="buy",
            amount=0.001,
            entry_price=50000.0,
            order_id="test_order_1"
        )
        
        assert "BTC/USDT" in portfolio_manager.portfolio["positions"]
        position = portfolio_manager.portfolio["positions"]["BTC/USDT"]
        assert position["side"] == "buy"
        assert position["amount"] == 0.001
        assert position["entry_price"] == 50000.0
        assert position["order_id"] == "test_order_1"
    
    @pytest.mark.asyncio
    async def test_update_position(self, portfolio_manager):
        await portfolio_manager.initialize()
        
        # Add a position first
        await portfolio_manager.add_position(
            symbol="BTC/USDT",
            side="buy",
            amount=0.001,
            entry_price=50000.0,
            order_id="test_order_1"
        )
        
        # Update position with new price
        await portfolio_manager.update_position("BTC/USDT", 51000.0)
        
        position = portfolio_manager.portfolio["positions"]["BTC/USDT"]
        assert position["current_price"] == 51000.0
        assert position["unrealized_pnl"] == 1.0  # (51000 - 50000) * 0.001
    
    @pytest.mark.asyncio
    async def test_close_position(self, portfolio_manager, mock_storage_manager):
        await portfolio_manager.initialize()
        
        # Add a position first
        await portfolio_manager.add_position(
            symbol="BTC/USDT",
            side="buy",
            amount=0.001,
            entry_price=50000.0,
            order_id="test_order_1"
        )
        
        # Close the position
        await portfolio_manager.close_position("BTC/USDT", 51000.0, "close_order_1")
        
        # Position should be removed
        assert "BTC/USDT" not in portfolio_manager.portfolio["positions"]
        
        # Trade should be recorded
        assert len(portfolio_manager.portfolio["trades"]) == 1
        trade = portfolio_manager.portfolio["trades"][0]
        assert trade["symbol"] == "BTC/USDT"
        assert trade["exit_price"] == 51000.0
        assert trade["realized_pnl"] == 1.0
        
        # Storage manager should be called
        mock_storage_manager.save_trade.assert_called_once()
    
    def test_get_portfolio_summary(self, portfolio_manager):
        summary = portfolio_manager.get_portfolio_summary()
        
        assert "balance" in summary
        assert "open_positions_count" in summary
        assert "total_unrealized_pnl" in summary
        assert "total_realized_pnl" in summary
        assert "positions" in summary
        
        assert summary["open_positions_count"] == 0
        assert summary["total_unrealized_pnl"] == 0
        assert summary["total_realized_pnl"] == 0
    
    @pytest.mark.asyncio
    async def test_max_positions_limit(self, portfolio_manager):
        await portfolio_manager.initialize()
        
        # Add maximum number of positions
        await portfolio_manager.add_position("BTC/USDT", "buy", 0.001, 50000.0, "order1")
        await portfolio_manager.add_position("ETH/USDT", "buy", 0.01, 3000.0, "order2")
        
        # Should not be able to open more positions
        assert portfolio_manager.can_open_position(1.0) == False

if __name__ == "__main__":
    pytest.main([__file__])

