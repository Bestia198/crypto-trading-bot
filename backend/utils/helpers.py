import asyncio
from typing import Any, Optional
from decimal import Decimal, InvalidOperation
import logging

logger = logging.getLogger(__name__)

def safe_float(value: Any, default: float = 0.0) -> float:
    """Safely convert value to float"""
    if value is None:
        return default
    
    try:
        if isinstance(value, (int, float)):
            return float(value)
        elif isinstance(value, str):
            cleaned = ''.join(c for c in value if c.isdigit() or c in '.-')
            return float(cleaned) if cleaned and cleaned != '-' else default
        else:
            return float(value)
    except (ValueError, TypeError, InvalidOperation):
        return default

def safe_int(value: Any, default: int = 0) -> int:
    """Safely convert value to int"""
    try:
        return int(safe_float(value, default))
    except (ValueError, TypeError):
        return default

def calculate_percentage_change(old_value: float, new_value: float) -> float:
    """Calculate percentage change between two values"""
    if old_value == 0:
        return 0.0
    return ((new_value - old_value) / old_value) * 100

def format_currency(amount: float, currency: str = "USD", decimals: int = 2) -> str:
    """Format amount as currency"""
    return f"{amount:,.{decimals}f} {currency}"

def format_percentage(value: float, decimals: int = 2) -> str:
    """Format value as percentage"""
    return f"{value:.{decimals}f}%"

def truncate_float(value: float, decimals: int = 8) -> float:
    """Truncate float to specified decimal places"""
    multiplier = 10 ** decimals
    return int(value * multiplier) / multiplier

async def retry_async(func, max_retries: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """Retry async function with exponential backoff"""
    last_exception = None
    
    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            last_exception = e
            if attempt < max_retries - 1:
                wait_time = delay * (backoff ** attempt)
                logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
            else:
                logger.error(f"All {max_retries} attempts failed")
    
    raise last_exception

def calculate_position_size(account_balance: float, risk_percent: float, 
                          entry_price: float, stop_loss_price: float) -> float:
    """Calculate position size based on risk management"""
    if entry_price <= 0 or stop_loss_price <= 0 or account_balance <= 0:
        return 0.0
    
    risk_per_unit = abs(entry_price - stop_loss_price)
    
    if risk_per_unit == 0:
        return 0.0
    
    max_risk_amount = account_balance * (risk_percent / 100)
    position_size = max_risk_amount / risk_per_unit
    
    return position_size

def calculate_pnl(entry_price: float, current_price: float, quantity: float, side: str) -> float:
    """Calculate profit/loss for a position"""
    if side.lower() == 'buy':
        return (current_price - entry_price) * quantity
    elif side.lower() == 'sell':
        return (entry_price - current_price) * quantity
    else:
        return 0.0

