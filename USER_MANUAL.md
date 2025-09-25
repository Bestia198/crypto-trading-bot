# Cryptocurrency Trading Bot - User Manual

**Version:** 1.0  
**Date:** September 2025  
**Author:** Manus AI

## Table of Contents

1. [Introduction](#introduction)
2. [System Requirements](#system-requirements)
3. [Installation Guide](#installation-guide)
4. [Configuration](#configuration)
5. [Getting Started](#getting-started)
6. [Trading Strategies](#trading-strategies)
7. [Risk Management](#risk-management)
8. [API Usage](#api-usage)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)
10. [Troubleshooting](#troubleshooting)
11. [FAQ](#frequently-asked-questions)

## Introduction

Welcome to the Advanced Cryptocurrency Trading Bot, a sophisticated automated trading system designed for cryptocurrency markets. This bot provides professional-grade trading capabilities with comprehensive risk management, making it suitable for both individual traders and small institutions.

### Key Features

- **Multiple Trading Strategies**: Simple Moving Average (SMA) and Relative Strength Index (RSI) strategies
- **Advanced Risk Management**: Multi-layered protection with position sizing, stop-loss, and portfolio limits
- **Real-time Market Data**: Live price feeds and technical indicators
- **Comprehensive Backtesting**: Test strategies against historical data
- **RESTful API**: Complete programmatic access to all functionality
- **Secure Authentication**: JWT-based security with user management
- **Database Integration**: PostgreSQL for persistent storage, Redis for caching
- **Exchange Integration**: Binance testnet support with extensible architecture

### Target Users

This trading bot is designed for:
- Individual cryptocurrency traders seeking automation
- Small trading firms requiring reliable automated strategies
- Developers building custom trading applications
- Researchers studying cryptocurrency market behavior

## System Requirements

### Hardware Requirements

**Minimum Requirements:**
- CPU: 2 cores, 2.0 GHz
- RAM: 4 GB
- Storage: 10 GB available space
- Network: Stable internet connection (minimum 1 Mbps)

**Recommended Requirements:**
- CPU: 4 cores, 3.0 GHz or higher
- RAM: 8 GB or more
- Storage: 50 GB SSD
- Network: High-speed internet connection (10 Mbps or higher)

### Software Requirements

- **Operating System**: Linux (Ubuntu 20.04+), macOS (10.15+), or Windows 10+
- **Python**: Version 3.11 or higher
- **PostgreSQL**: Version 12 or higher
- **Redis**: Version 6.0 or higher
- **Docker**: Optional but recommended for deployment

## Installation Guide

### Method 1: Docker Installation (Recommended)

1. **Install Docker and Docker Compose**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install docker.io docker-compose
   
   # macOS (using Homebrew)
   brew install docker docker-compose
   ```

2. **Clone the Repository**
   ```bash
   git clone https://github.com/your-repo/crypto-trading-bot.git
   cd crypto-trading-bot
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Start the System**
   ```bash
   docker-compose up -d
   ```

### Method 2: Manual Installation

1. **Install System Dependencies**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install python3.11 python3.11-pip postgresql redis-server
   
   # macOS (using Homebrew)
   brew install python@3.11 postgresql redis
   ```

2. **Clone and Setup**
   ```bash
   git clone https://github.com/your-repo/crypto-trading-bot.git
   cd crypto-trading-bot
   python3.11 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r backend/requirements.txt
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   sudo -u postgres createdb trading_bot
   sudo -u postgres createuser trading_user
   sudo -u postgres psql -c "ALTER USER trading_user PASSWORD 'your_password';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE trading_bot TO trading_user;"
   ```

4. **Configuration**
   ```bash
   cp .env.example .env
   # Edit .env file with your database credentials and API keys
   ```

## Configuration

### Environment Variables

The system uses environment variables for configuration. Copy `.env.example` to `.env` and modify the following settings:

#### Exchange Configuration
```bash
# Binance API Keys (get from https://testnet.binance.vision/)
BINANCE_API_KEY=your_binance_testnet_api_key
BINANCE_API_SECRET=your_binance_testnet_secret_key
```

#### Database Configuration
```bash
# PostgreSQL Database
DATABASE_URL=postgresql://trading_user:your_password@localhost:5432/trading_bot

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### Security Configuration
```bash
# JWT Security (generate a strong secret key)
JWT_SECRET_KEY=your_very_strong_secret_key_here
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Trading Configuration
```bash
# Account Settings
INITIAL_BALANCE=5.0
MAX_POSITIONS=2
MIN_POSITION_SIZE=0.5
MAX_POSITION_SIZE=2.0

# Risk Management
MAX_PORTFOLIO_RISK=40.0
MAX_POSITION_RISK=20.0
MAX_DAILY_LOSS=10.0
STOP_LOSS_PERCENT=5.0
TAKE_PROFIT_PERCENT=10.0
```

### Strategy Configuration

Edit `backend/config/config.yaml` to configure trading strategies:

```yaml
strategies:
  simple_ma:
    enabled: true
    symbols: ["BTCUSDT", "ETHUSDT"]
    short_period: 5
    long_period: 10
    min_volume: 1000000
    
  rsi:
    enabled: false
    symbols: ["BTCUSDT", "ETHUSDT"]
    rsi_period: 14
    overbought_threshold: 70
    oversold_threshold: 30
    min_volume: 1000000
```

## Getting Started

### 1. Initial Setup

After installation and configuration, start the system:

```bash
# Using Docker
docker-compose up -d

# Manual installation
cd crypto-trading-bot
source venv/bin/activate
python -m backend.main
```

### 2. Verify Installation

Check that all services are running:

```bash
# Check application logs
docker-compose logs trading-bot

# Test API health
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "API is healthy"
}
```

### 3. Authentication

Get an access token for API usage:

```bash
curl -X POST "http://localhost:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user&password=password"
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

### 4. Monitor Portfolio

Check your portfolio status:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/portfolio/summary
```

## Trading Strategies

### Simple Moving Average (SMA) Strategy

The SMA strategy identifies trends by comparing short-term and long-term moving averages.

**How it works:**
- **Buy Signal**: Short MA crosses above Long MA
- **Sell Signal**: Short MA crosses below Long MA
- **Risk Management**: Automatic stop-loss and take-profit levels

**Configuration Parameters:**
- `short_period`: Period for short-term moving average (default: 5)
- `long_period`: Period for long-term moving average (default: 10)
- `min_volume`: Minimum 24h volume required for trading
- `symbols`: List of trading pairs to monitor

**Best Practices:**
- Works well in trending markets
- Less effective in sideways/ranging markets
- Combine with volume analysis for better signals

### Relative Strength Index (RSI) Strategy

The RSI strategy uses momentum oscillation to identify overbought and oversold conditions.

**How it works:**
- **Buy Signal**: RSI below oversold threshold (default: 30)
- **Sell Signal**: RSI above overbought threshold (default: 70)
- **Risk Management**: Integrated stop-loss and take-profit

**Configuration Parameters:**
- `rsi_period`: Period for RSI calculation (default: 14)
- `overbought_threshold`: RSI level indicating overbought condition (default: 70)
- `oversold_threshold`: RSI level indicating oversold condition (default: 30)
- `min_volume`: Minimum volume requirement

**Best Practices:**
- Effective in ranging markets
- Use divergence analysis for better timing
- Combine with trend analysis for confirmation

### Strategy Backtesting

Before live trading, backtest your strategies:

```python
from backend.backtesting.backtester import Backtester

# Initialize backtester
backtester = Backtester(
    strategy_name="simple_ma",
    symbol="BTCUSDT",
    start_date="2024-01-01",
    end_date="2024-12-31",
    initial_balance=5.0
)

# Run backtest
results = await backtester.run_backtest()
print(f"Total Return: {results['total_return']:.2%}")
print(f"Max Drawdown: {results['max_drawdown']:.2%}")
print(f"Sharpe Ratio: {results['sharpe_ratio']:.2f}")
```

## Risk Management

The trading bot includes comprehensive risk management to protect your capital:

### Position-Level Risk Management

- **Maximum Position Size**: Limits individual trade size (default: $2.00)
- **Minimum Position Size**: Prevents tiny trades (default: $0.50)
- **Stop-Loss Protection**: Automatic loss limiting (default: 5%)
- **Take-Profit Targets**: Automatic profit taking (default: 10%)

### Portfolio-Level Risk Management

- **Maximum Portfolio Risk**: Limits total exposure (default: 40%)
- **Position Limits**: Maximum concurrent positions (default: 2)
- **Correlation Analysis**: Prevents overexposure to similar assets

### Daily Risk Controls

- **Daily Loss Limits**: Stops trading after significant losses (default: 10%)
- **Drawdown Protection**: Pauses trading during losing streaks
- **Recovery Mechanisms**: Gradual position size increases after losses

### Customizing Risk Parameters

Edit your `.env` file or use the API to adjust risk settings:

```bash
# Conservative settings
MAX_PORTFOLIO_RISK=20.0
MAX_POSITION_RISK=10.0
MAX_DAILY_LOSS=5.0
STOP_LOSS_PERCENT=3.0

# Aggressive settings
MAX_PORTFOLIO_RISK=60.0
MAX_POSITION_RISK=30.0
MAX_DAILY_LOSS=15.0
STOP_LOSS_PERCENT=7.0
```

## API Usage

The trading bot provides a comprehensive RESTful API for programmatic access.

### Authentication

All API endpoints (except `/health` and `/token`) require authentication:

```bash
# Get token
TOKEN=$(curl -s -X POST "http://localhost:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user&password=password" | jq -r '.access_token')

# Use token in requests
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/portfolio/summary
```

### Key API Endpoints

#### Portfolio Management
```bash
# Get portfolio summary
GET /portfolio/summary

# Check if position can be opened
GET /trading/can_open_position?amount_usd=1.0
```

#### Market Data
```bash
# Get market data for specific symbol
GET /market_data/BTCUSDT

# Get all market data
GET /market_data

# Check trading conditions
GET /trading/good_time_to_trade/BTCUSDT
```

#### Strategy Analysis
```bash
# Get SMA strategy recommendation
GET /strategy/simple_ma/recommendation/BTCUSDT
```

#### Trade History
```bash
# Get recent trades
GET /trades?limit=50
```

### API Response Examples

**Portfolio Summary:**
```json
{
  "balance": {
    "total": 5.0,
    "available": 4.5,
    "in_positions": 0.5
  },
  "open_positions_count": 1,
  "total_unrealized_pnl": 0.05,
  "total_realized_pnl": 0.15,
  "positions": {
    "BTCUSDT": {
      "side": "buy",
      "amount": 0.001,
      "entry_price": 50000.0,
      "current_price": 50500.0,
      "unrealized_pnl": 0.5
    }
  }
}
```

**Market Data:**
```json
{
  "symbol": "BTCUSDT",
  "price": 50000.0,
  "volume": 1500000.0,
  "sma_5": 49800.0,
  "sma_10": 49500.0,
  "rsi_14": 65.5,
  "timestamp": 1640995200
}
```

## Monitoring and Maintenance

### System Monitoring

#### Application Logs
```bash
# View real-time logs
docker-compose logs -f trading-bot

# View specific component logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

#### Performance Monitoring
```bash
# Check system resources
docker stats

# Monitor database performance
docker-compose exec postgres psql -U trading_user -d trading_bot -c "
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del 
FROM pg_stat_user_tables;"
```

#### Health Checks
```bash
# Application health
curl http://localhost:8000/health

# Database connectivity
docker-compose exec postgres pg_isready

# Redis connectivity
docker-compose exec redis redis-cli ping
```

### Regular Maintenance

#### Daily Tasks
- Monitor trading performance and P&L
- Check system logs for errors
- Verify exchange connectivity
- Review risk management alerts

#### Weekly Tasks
- Analyze strategy performance
- Update market data archives
- Review and rotate log files
- Check system resource usage

#### Monthly Tasks
- Database maintenance and optimization
- Security updates and patches
- Backup verification and testing
- Configuration review and optimization

### Backup Procedures

#### Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U trading_user trading_bot > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U trading_user trading_bot < backup_20241201.sql
```

#### Configuration Backup
```bash
# Backup configuration files
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env backend/config/
```

### Performance Optimization

#### Database Optimization
```sql
-- Analyze table statistics
ANALYZE;

-- Reindex tables
REINDEX DATABASE trading_bot;

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### Redis Optimization
```bash
# Check memory usage
docker-compose exec redis redis-cli info memory

# Optimize memory settings
docker-compose exec redis redis-cli config set maxmemory-policy allkeys-lru
```

## Troubleshooting

### Common Issues

#### Application Won't Start

**Symptoms:** Application exits immediately or fails to start
**Causes:** Configuration errors, missing dependencies, port conflicts
**Solutions:**
1. Check configuration files for syntax errors
2. Verify all required environment variables are set
3. Ensure PostgreSQL and Redis are running
4. Check port availability (8000, 5432, 6379)

```bash
# Check configuration
python -c "from backend.utils.config import config; print('Config loaded successfully')"

# Check port usage
netstat -tulpn | grep :8000
```

#### Database Connection Errors

**Symptoms:** "Failed to connect to database" errors
**Causes:** Incorrect credentials, database not running, network issues
**Solutions:**
1. Verify database credentials in `.env`
2. Check PostgreSQL service status
3. Test database connectivity manually

```bash
# Test database connection
docker-compose exec postgres psql -U trading_user -d trading_bot -c "SELECT version();"

# Check PostgreSQL logs
docker-compose logs postgres
```

#### Exchange API Errors

**Symptoms:** "Exchange connection failed" or API rate limit errors
**Causes:** Invalid API keys, network issues, exchange maintenance
**Solutions:**
1. Verify API keys are correct and active
2. Check exchange status and maintenance schedules
3. Review API rate limits and usage

```bash
# Test API keys manually
curl -H "X-MBX-APIKEY: your_api_key" \
  "https://testnet.binance.vision/api/v3/account"
```

#### High Memory Usage

**Symptoms:** System becomes slow, out of memory errors
**Causes:** Memory leaks, large data sets, insufficient resources
**Solutions:**
1. Monitor memory usage patterns
2. Adjust data retention policies
3. Increase system memory if needed

```bash
# Monitor memory usage
docker stats --no-stream

# Check for memory leaks
docker-compose exec trading-bot python -c "
import psutil
print(f'Memory usage: {psutil.virtual_memory().percent}%')
"
```

### Debugging Tools

#### Enable Debug Logging
```bash
# Set debug level in .env
DEBUG=true

# Or set log level in config.yaml
logging:
  level: DEBUG
```

#### Database Debugging
```sql
-- Check active connections
SELECT * FROM pg_stat_activity WHERE datname = 'trading_bot';

-- Monitor query performance
SELECT query, total_time, mean_time, calls 
FROM pg_stat_statements 
WHERE query LIKE '%trades%' 
ORDER BY total_time DESC;
```

#### API Debugging
```bash
# Test API endpoints
curl -v -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/portfolio/summary

# Check API logs
docker-compose logs trading-bot | grep "rest_api"
```

### Getting Help

If you encounter issues not covered in this troubleshooting section:

1. **Check Logs**: Always start by examining application and system logs
2. **Review Configuration**: Verify all configuration files and environment variables
3. **Test Components**: Isolate issues by testing individual components
4. **Documentation**: Consult the technical documentation and API reference
5. **Community Support**: Reach out to the community forums or support channels

## Frequently Asked Questions

### General Questions

**Q: What is the minimum account balance needed to start trading?**
A: The system is designed for small accounts starting with $5 USD. However, we recommend starting with at least $10-20 to allow for proper position sizing and risk management.

**Q: Can I run multiple strategies simultaneously?**
A: Yes, you can enable multiple strategies in the configuration. The system will coordinate between strategies to prevent conflicts and manage overall portfolio risk.

**Q: How often does the bot make trades?**
A: Trading frequency depends on market conditions and strategy settings. The SMA strategy typically generates 1-5 signals per day per symbol, while RSI may be more active in volatile markets.

### Technical Questions

**Q: Can I add custom trading strategies?**
A: Yes, the system supports custom strategies. Create a new class inheriting from `BaseStrategy` and implement the required methods. See the existing strategies for examples.

**Q: How do I backup my trading data?**
A: Use the provided backup scripts to create regular backups of your PostgreSQL database and configuration files. Store backups securely and test restoration procedures regularly.

**Q: Can I run the bot on a VPS?**
A: Yes, the bot is designed for VPS deployment. Ensure your VPS has adequate resources and a stable internet connection. Consider using Docker for easier deployment and management.

### Trading Questions

**Q: What happens if my internet connection is lost?**
A: The bot includes reconnection mechanisms and will attempt to resume operation when connectivity is restored. However, you may miss trading opportunities during outages.

**Q: How do I know if the bot is making good trades?**
A: Monitor the portfolio summary API endpoint and review trade history regularly. The system provides comprehensive performance metrics including profit/loss, win rate, and risk-adjusted returns.

**Q: Can I override the bot's trading decisions?**
A: The bot operates autonomously based on configured strategies and risk parameters. You can modify configurations or disable strategies, but manual trade intervention requires direct exchange interaction.

---

**For additional support and updates, please visit our documentation repository and community forums.**

