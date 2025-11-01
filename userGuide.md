# Crypto Trading Bot Dashboard - User Guide

**Website URL:** https://3000-icvxb0et2h14vjbr24xxu-e6adb518.manusvm.computer

**Purpose:** Monitor and manage multi-agent cryptocurrency trading strategies with real-time performance metrics, portfolio visualization, and transaction history.

**Access:** Login required via Manus OAuth authentication.

---

## Powered by Manus

This application is built with a cutting-edge technology stack designed for high-performance trading analytics:

**Frontend:** React 19 with TypeScript and Tailwind CSS 4 for responsive, modern UI components

**Backend:** Express 4 with tRPC 11 for type-safe API procedures and real-time data synchronization

**Database:** MySQL with Drizzle ORM for robust data persistence and complex queries

**Authentication:** Manus OAuth integration for secure user management and session handling

**Visualization:** Recharts library for interactive financial charts and performance analytics

**Deployment:** Auto-scaling infrastructure with global CDN for reliable, fast access worldwide

---

## Using Your Website

### 1. Dashboard Overview

After logging in, click **"Go to Dashboard"** from the home page to access the main trading interface. The dashboard displays your trading sessions and detailed performance metrics for each active session.

### 2. Starting a New Trading Simulation

To begin a new trading session:

1. Click **"+ New Session"** button in the Trading Sessions section
2. Enter a descriptive **"Session Name"** (e.g., "BTC Trading Session 1")
3. Set your **"Initial Capital"** in USDT (default: $20, range: $1-$10,000)
4. Click **"Start Simulation"** to begin the automated trading

The system will immediately execute the multi-agent trading bot and generate performance metrics across all trading strategies (RL Agents, Momentum, Mean Reversion, DeepSeek AI, and Consensus).

### 3. Viewing Session Metrics

Once a session is created, select it from the grid to view:

- **Total ROI:** Aggregate return on investment across all agents
- **Total Trades:** Combined number of transactions executed
- **Portfolio Value:** Current reinvestment profit in USDT

### 4. Agent Performance Comparison

The **"Agent Performance Comparison"** chart shows each agent's ROI and win rate side-by-side. This helps you identify which trading strategies performed best during the session.

### 5. Portfolio Evolution Chart

The **"Portfolio Evolution"** line chart displays how each agent's net worth changed over time. Use this to visualize trading activity and identify periods of gain or loss.

### 6. Transaction History

The **"Recent Transactions"** table logs every trade executed during the session, including:

- Agent name that executed the trade
- Transaction type (buy, sell, short, close_short, etc.)
- Amount and price
- Associated fees
- Exact timestamp

Click on any transaction row to see additional details about the trade.

---

## Managing Your Website

### Settings Panel

Access your preferences via the **Settings** option in the Management UI:

- **Theme:** Switch between light and dark mode
- **Notifications:** Enable/disable trading alerts
- **Default Symbol:** Set your preferred trading pair (default: BTC/USDT)
- **Default Capital:** Configure the default initial capital for new sessions

### Dashboard Panel

Monitor your application's performance and visibility:

- View analytics (unique visitors, page views)
- Check deployment status
- Manage domain settings

### Database Panel

Access the full database UI to:

- View all trading sessions, agent metrics, and transactions
- Query historical data
- Export data for external analysis

---

## Next Steps

Talk to Manus AI anytime to request changes or add features. Here are some popular enhancements:

- **Live Trading Integration:** Connect to real exchanges (Binance, Kraken) for actual trading
- **Advanced Risk Management:** Implement dynamic stop-loss and take-profit levels
- **Strategy Backtesting:** Test strategies against historical data before deployment
- **Portfolio Alerts:** Receive notifications when ROI thresholds are reached
- **Custom Indicators:** Add technical indicators (Bollinger Bands, Stochastic, etc.)

Start by creating your first trading session and exploring how different agents perform on your preferred cryptocurrency pair. The more sessions you run, the better insights you'll gain into which strategies work best for your trading style.
