import pytest
import asyncio
from unittest.mock import AsyncMock

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from backend.utils.helpers import (
    safe_float, safe_int, calculate_percentage_change, 
    format_currency, format_percentage, truncate_float,
    retry_async, calculate_position_size, calculate_pnl
)

class TestHelpers:
    
    def test_safe_float_valid_inputs(self):
        assert safe_float(5.5) == 5.5
        assert safe_float("10.25") == 10.25
        assert safe_float(42) == 42.0
        assert safe_float("100") == 100.0
    
    def test_safe_float_invalid_inputs(self):
        assert safe_float(None) == 0.0
        assert safe_float("invalid") == 0.0
        assert safe_float("") == 0.0
        assert safe_float("abc123") == 123.0  # Extracts numbers
        assert safe_float([]) == 0.0
    
    def test_safe_float_with_default(self):
        assert safe_float(None, 10.0) == 10.0
        assert safe_float("invalid", 5.5) == 5.5
    
    def test_safe_int_valid_inputs(self):
        assert safe_int(5) == 5
        assert safe_int(5.7) == 5
        assert safe_int("10") == 10
        assert safe_int("10.8") == 10
    
    def test_safe_int_invalid_inputs(self):
        assert safe_int(None) == 0
        assert safe_int("invalid") == 0
        assert safe_int("") == 0
    
    def test_safe_int_with_default(self):
        assert safe_int(None, 100) == 100
        assert safe_int("invalid", 50) == 50
    
    def test_calculate_percentage_change(self):
        assert calculate_percentage_change(100, 110) == 10.0
        assert calculate_percentage_change(100, 90) == -10.0
        assert calculate_percentage_change(50, 75) == 50.0
        assert calculate_percentage_change(0, 10) == 0.0  # Avoid division by zero
    
    def test_format_currency(self):
        assert format_currency(1234.56) == "1,234.56 USD"
        assert format_currency(1000, "EUR") == "1,000.00 EUR"
        assert format_currency(123.456, "BTC", 4) == "123.4560 BTC"
    
    def test_format_percentage(self):
        assert format_percentage(15.5) == "15.50%"
        assert format_percentage(100, 0) == "100%"
        assert format_percentage(33.333, 1) == "33.3%"
    
    def test_truncate_float(self):
        assert truncate_float(1.23456789, 4) == 1.2345
        assert truncate_float(10.999, 2) == 10.99
        assert truncate_float(5.0, 3) == 5.0
    
    @pytest.mark.asyncio
    async def test_retry_async_success(self):
        call_count = 0
        
        async def successful_function():
            nonlocal call_count
            call_count += 1
            return "success"
        
        result = await retry_async(successful_function, max_retries=3)
        assert result == "success"
        assert call_count == 1
    
    @pytest.mark.asyncio
    async def test_retry_async_eventual_success(self):
        call_count = 0
        
        async def eventually_successful_function():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise Exception("Temporary failure")
            return "success"
        
        result = await retry_async(eventually_successful_function, max_retries=3, delay=0.01)
        assert result == "success"
        assert call_count == 3
    
    @pytest.mark.asyncio
    async def test_retry_async_max_retries_exceeded(self):
        call_count = 0
        
        async def always_failing_function():
            nonlocal call_count
            call_count += 1
            raise Exception("Always fails")
        
        with pytest.raises(Exception, match="Always fails"):
            await retry_async(always_failing_function, max_retries=2, delay=0.01)
        
        assert call_count == 2
    
    def test_calculate_position_size_valid(self):
        # $1000 account, 2% risk, $50 entry, $45 stop loss
        position_size = calculate_position_size(1000, 2, 50, 45)
        expected = (1000 * 0.02) / (50 - 45)  # $20 risk / $5 risk per unit = 4 units
        assert position_size == expected
    
    def test_calculate_position_size_invalid_inputs(self):
        assert calculate_position_size(0, 2, 50, 45) == 0.0  # Zero balance
        assert calculate_position_size(1000, 2, 0, 45) == 0.0  # Zero entry price
        assert calculate_position_size(1000, 2, 50, 0) == 0.0  # Zero stop loss
        assert calculate_position_size(1000, 2, 50, 50) == 0.0  # No risk difference
    
    def test_calculate_pnl_buy_position(self):
        # Buy 1 unit at $50, current price $55
        pnl = calculate_pnl(50, 55, 1, "buy")
        assert pnl == 5.0
        
        # Buy 2 units at $100, current price $90
        pnl = calculate_pnl(100, 90, 2, "buy")
        assert pnl == -20.0
    
    def test_calculate_pnl_sell_position(self):
        # Sell 1 unit at $50, current price $45
        pnl = calculate_pnl(50, 45, 1, "sell")
        assert pnl == 5.0
        
        # Sell 2 units at $100, current price $110
        pnl = calculate_pnl(100, 110, 2, "sell")
        assert pnl == -20.0
    
    def test_calculate_pnl_invalid_side(self):
        pnl = calculate_pnl(50, 55, 1, "invalid")
        assert pnl == 0.0

if __name__ == "__main__":
    pytest.main([__file__])

