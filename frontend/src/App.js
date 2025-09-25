import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [status, setStatus] = useState('Loading...');
  const [portfolio, setPortfolio] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [trades, setTrades] = useState(null);

  useEffect(() => {
    fetch('/status')
      .then(res => res.json())
      .then(data => setStatus(data.message))
      .catch(err => setStatus('Failed to connect to backend.'));

    fetch('/portfolio')
      .then(res => res.json())
      .then(data => setPortfolio(data))
      .catch(err => console.error('Error fetching portfolio:', err));

    fetch('/market_data')
      .then(res => res.json())
      .then(data => setMarketData(data))
      .catch(err => console.error('Error fetching market data:', err));

    fetch('/trades')
      .then(res => res.json())
      .then(data => setTrades(data))
      .catch(err => console.error('Error fetching trades:', err));

  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Crypto Trading Bot Dashboard</h1>
        <p>Backend Status: {status}</p>

        <h2>Portfolio Summary</h2>
        {portfolio ? (
          <div>
            <p>Total Balance: ${portfolio.balance.total.toFixed(2)} USDT</p>
            <p>Available Balance: ${portfolio.balance.available.toFixed(2)} USDT</p>
            <p>Open Positions: {portfolio.open_positions_count}</p>
            <p>Total Unrealized PnL: ${portfolio.total_unrealized_pnl.toFixed(2)}</p>
            <p>Total Realized PnL: ${portfolio.total_realized_pnl.toFixed(2)}</p>
            <h3>Open Positions:</h3>
            {portfolio.positions.length > 0 ? (
              <ul>
                {portfolio.positions.map((pos, index) => (
                  <li key={index}>
                    {pos.side} {pos.amount.toFixed(4)} {pos.symbol} @ ${pos.entry_price.toFixed(4)} (Current: ${pos.current_price.toFixed(4)}) - PnL: ${pos.unrealized_pnl.toFixed(2)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No open positions.</p>
            )}
          </div>
        ) : (
          <p>Loading portfolio data...</p>
        )}

        <h2>Market Data</h2>
        {marketData ? (
          <div>
            {Object.keys(marketData).length > 0 ? (
              <ul>
                {Object.keys(marketData).map(symbol => (
                  <li key={symbol}>
                    <strong>{symbol}</strong>: Price: ${marketData[symbol].price.toFixed(4)}, Volume: {marketData[symbol].volume.toFixed(2)}
                    {marketData[symbol].small_account_info && (
                      <span> (Min Order: ${marketData[symbol].small_account_info.min_order_usd.toFixed(2)})</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No market data available.</p>
            )}
          </div>
        ) : (
          <p>Loading market data...</p>
        )}

        <h2>Recent Trades</h2>
        {trades ? (
          <div>
            {trades.length > 0 ? (
              <ul>
                {trades.map((trade, index) => (
                  <li key={index}>
                    {trade.timestamp}: {trade.side} {trade.amount.toFixed(4)} {trade.symbol} @ ${trade.entry_price.toFixed(4)} - PnL: ${trade.realized_pnl.toFixed(2)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent trades.</p>
            )}
          </div>
        ) : (
          <p>Loading trade data...</p>
        )}

      </header>
    </div>
  );
}

export default App;


