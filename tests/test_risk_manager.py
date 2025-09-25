import pytest
from unittest.mock import Mock
import time

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from backend.trading.risk_manager import RiskManager

class TestRiskManager:
    
    @pytest.fixture
    def mock_portfolio_manager(self):
        portfolio = Mock()
        portfolio.portfolio = {
            "balance": {"total": 5.0, "available": 5.0},
            "positions": {}
        }
        return portfolio
    
    @pytest.fixture
    def risk_manager(self, mock_portfolio_manager):
        return RiskManager(mock_portfolio_manager)
    
    def test_initialization(self, risk_manager):
        assert risk_manager.max_portfolio_risk == 40.0
        assert risk_manager.max_position_risk == 20.0
        assert risk_manager.stop_loss_percent == 5.0
        assert risk_manager.take_profit_percent == 10.0
        assert risk_manager.daily_initial_balance == 5.0
    
    def test_check_trade_risk_valid(self, risk_manager):
        # Test a valid trade with low risk
        result = risk_manager.check_trade_risk(
            symbol="BTC/USDT",
            entry_price=50000.0,
            stop_loss_price=47500.0,  # 5% stop loss
            amount=0.0004  # $20 position with 5% risk = $1 potential loss
        )
        
        assert result["allowed"] == True
        assert "potential_loss_usd" in result
        assert "position_risk_percent" in result
    
    def test_check_trade_risk_high_position_risk(self, risk_manager):
        # Test a trade with high position risk
        result = risk_manager.check_trade_risk(
            symbol="BTC/USDT",
            entry_price=50000.0,
            stop_loss_price=40000.0,  # 20% stop loss
            amount=0.002  # Large position
        )
        
        assert result["allowed"] == False
        assert "Position risk" in result["reason"]
    
    def test_check_trade_risk_insufficient_balance(self, risk_manager):
        # Test with zero balance
        risk_manager.portfolio_manager.portfolio["balance"]["total"] = 0.0
        
        result = risk_manager.check_trade_risk(
            symbol="BTC/USDT",
            entry_price=50000.0,
            stop_loss_price=47500.0,
            amount=0.0001
        )
        
        assert result["allowed"] == False
        assert "Insufficient balance" in result["reason"]
    
    def test_get_stop_loss_price_buy(self, risk_manager):
        entry_price = 50000.0
        stop_loss = risk_manager.get_stop_loss_price(entry_price, "buy")
        expected = entry_price * (1 - 0.05)  # 5% below entry
        assert stop_loss == expected
    
    def test_get_stop_loss_price_sell(self, risk_manager):
        entry_price = 50000.0
        stop_loss = risk_manager.get_stop_loss_price(entry_price, "sell")
        expected = entry_price * (1 + 0.05)  # 5% above entry
        assert stop_loss == expected
    
    def test_get_take_profit_price_buy(self, risk_manager):
        entry_price = 50000.0
        take_profit = risk_manager.get_take_profit_price(entry_price, "buy")
        expected = entry_price * (1 + 0.10)  # 10% above entry
        assert take_profit == expected
    
    def test_get_take_profit_price_sell(self, risk_manager):
        entry_price = 50000.0
        take_profit = risk_manager.get_take_profit_price(entry_price, "sell")
        expected = entry_price * (1 - 0.10)  # 10% below entry
        assert take_profit == expected
    
    def test_get_trailing_stop_price_buy(self, risk_manager):
        current_price = 52000.0
        entry_price = 50000.0
        trailing_stop = risk_manager.get_trailing_stop_price(current_price, entry_price, "buy")
        expected = current_price * (1 - 0.02)  # 2% below current price
        assert trailing_stop == expected
    
    def test_get_trailing_stop_price_sell(self, risk_manager):
        current_price = 48000.0
        entry_price = 50000.0
        trailing_stop = risk_manager.get_trailing_stop_price(current_price, entry_price, "sell")
        expected = current_price * (1 + 0.02)  # 2% above current price
        assert trailing_stop == expected
    
    def test_check_daily_loss_limit_normal(self, risk_manager):
        # Normal case - no loss limit reached
        assert risk_manager.check_daily_loss_limit() == False
    
    def test_check_daily_loss_limit_reached(self, risk_manager):
        # Simulate a large loss
        risk_manager.portfolio_manager.portfolio["balance"]["total"] = 4.0  # 20% loss from initial 5.0
        risk_manager.daily_high_balance = 5.0
        
        # Should trigger daily loss limit (10%)
        assert risk_manager.check_daily_loss_limit() == True
    
    def test_portfolio_risk_with_existing_positions(self, risk_manager):
        # Add existing position with unrealized loss
        risk_manager.portfolio_manager.portfolio["positions"] = {
            "ETH/USDT": {"unrealized_pnl": -0.5}  # $0.5 loss
        }
        
        # Test new trade that would exceed portfolio risk
        result = risk_manager.check_trade_risk(
            symbol="BTC/USDT",
            entry_price=50000.0,
            stop_loss_price=40000.0,  # Large potential loss
            amount=0.004  # Large position
        )
        
        # Should be rejected due to combined portfolio risk
        assert result["allowed"] == False

if __name__ == "__main__":
    pytest.main([__file__])

