import { describe, it, expect, beforeEach } from 'vitest';
import { PaperTradingConnector, createExchangeConnector } from '../services/exchangeService';

describe('Exchange Integration', () => {
  describe('Paper Trading Connector', () => {
    let connector: PaperTradingConnector;

    beforeEach(() => {
      connector = new PaperTradingConnector('binance', 30);
    });

    it('should initialize with correct balance', async () => {
      const balance = await connector.getBalance();
      expect(balance).toHaveLength(1);
      expect(balance[0].asset).toBe('USDT');
      expect(balance[0].free).toBe(30);
      expect(balance[0].total).toBe(30);
    });

    it('should get market data for a symbol', async () => {
      const data = await connector.getMarketData('BTCUSDT');
      expect(data.symbol).toBe('BTCUSDT');
      expect(data.price).toBeGreaterThan(0);
      expect(data.bid).toBeGreaterThan(0);
      expect(data.ask).toBeGreaterThan(data.bid);
      expect(data.volume24h).toBeGreaterThanOrEqual(0);
    });

    it('should get multiple market data', async () => {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
      const data = await connector.getMultipleMarketData(symbols);
      expect(data).toHaveLength(3);
      expect(data[0].symbol).toBe('BTCUSDT');
      expect(data[1].symbol).toBe('ETHUSDT');
      expect(data[2].symbol).toBe('BNBUSDT');
    });

    it('should place a BUY order', async () => {
      const order = await connector.placeOrder({
        symbol: 'BTCUSDT',
        type: 'BUY',
        quantity: 0.001,
        orderType: 'market',
      });

      expect(order.orderId).toBeDefined();
      expect(order.symbol).toBe('BTCUSDT');
      expect(order.type).toBe('BUY');
      expect(order.quantity).toBe(0.001);
      expect(order.status).toBe('filled');
    });

    it('should place a SELL order', async () => {
      // First buy some BTC
      await connector.placeOrder({
        symbol: 'BTCUSDT',
        type: 'BUY',
        quantity: 0.001,
        orderType: 'market',
      });

      // Then sell it
      const order = await connector.placeOrder({
        symbol: 'BTCUSDT',
        type: 'SELL',
        quantity: 0.001,
        orderType: 'market',
      });

      expect(order.type).toBe('SELL');
      expect(order.status).toBe('filled');
    });

    it('should reject order with insufficient balance', async () => {
      try {
        await connector.placeOrder({
          symbol: 'BTCUSDT',
          type: 'BUY',
          quantity: 1000, // Way too much
          orderType: 'market',
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Insufficient balance');
      }
    });

    it('should track order history', async () => {
      await connector.placeOrder({
        symbol: 'BTCUSDT',
        type: 'BUY',
        quantity: 0.001,
        orderType: 'market',
      });

      await connector.placeOrder({
        symbol: 'ETHUSDT',
        type: 'BUY',
        quantity: 0.01,
        orderType: 'market',
      });

      const history = await connector.getOrderHistory();
      expect(history).toHaveLength(2);
      expect(history[0].symbol).toBe('BTCUSDT');
      expect(history[1].symbol).toBe('ETHUSDT');
    });

    it('should cancel an order', async () => {
      const order = await connector.placeOrder({
        symbol: 'BTCUSDT',
        type: 'BUY',
        quantity: 0.001,
        orderType: 'market',
      });

      const cancelled = await connector.cancelOrder(order.orderId);
      expect(cancelled).toBe(true);
    });

    it('should validate connection', async () => {
      const isValid = await connector.validateConnection();
      expect(isValid).toBe(true);
    });

    it('should update portfolio after trades', async () => {
      // Buy BTC
      await connector.placeOrder({
        symbol: 'BTCUSDT',
        type: 'BUY',
        quantity: 0.001,
        orderType: 'market',
      });

      const balance = await connector.getBalance();
      const btc = balance.find(b => b.asset === 'BTC');
      const usdt = balance.find(b => b.asset === 'USDT');

      expect(btc?.free).toBe(0.001);
      expect(usdt?.free).toBeLessThan(30);
    });
  });

  describe('Exchange Connector Factory', () => {
    it('should create paper trading connector for Binance', async () => {
      const connector = await createExchangeConnector({
        exchange: 'binance',
        apiKey: 'test',
        apiSecret: 'test',
        mode: 'paper',
      });

      expect(connector).toBeDefined();
      const isValid = await connector.validateConnection();
      expect(isValid).toBe(true);
    });

    it('should create paper trading connector for Kraken', async () => {
      const connector = await createExchangeConnector({
        exchange: 'kraken',
        apiKey: 'test',
        apiSecret: 'test',
        mode: 'paper',
      });

      expect(connector).toBeDefined();
      const isValid = await connector.validateConnection();
      expect(isValid).toBe(true);
    });

    it('should create paper trading connector for Coinbase', async () => {
      const connector = await createExchangeConnector({
        exchange: 'coinbase',
        apiKey: 'test',
        apiSecret: 'test',
        passphrase: 'test',
        mode: 'paper',
      });

      expect(connector).toBeDefined();
      const isValid = await connector.validateConnection();
      expect(isValid).toBe(true);
    });

    it('should create paper trading connector for Bybit', async () => {
      const connector = await createExchangeConnector({
        exchange: 'bybit',
        apiKey: 'test',
        apiSecret: 'test',
        mode: 'paper',
      });

      expect(connector).toBeDefined();
      const isValid = await connector.validateConnection();
      expect(isValid).toBe(true);
    });
  });

  describe('Multi-Exchange Scenarios', () => {
    it('should handle multiple exchanges simultaneously', async () => {
      const binance = new PaperTradingConnector('binance', 30);
      const kraken = new PaperTradingConnector('kraken', 30);

      // Trade on both exchanges
      const binanceOrder = await binance.placeOrder({
        symbol: 'BTCUSDT',
        type: 'BUY',
        quantity: 0.001,
        orderType: 'market',
      });

      const krakenOrder = await kraken.placeOrder({
        symbol: 'ETHUSDT',
        type: 'BUY',
        quantity: 0.01,
        orderType: 'market',
      });

      expect(binanceOrder.exchange).toBe('binance');
      expect(krakenOrder.exchange).toBe('kraken');

      // Check balances are independent
      const binanceBalance = await binance.getBalance();
      const krakenBalance = await kraken.getBalance();

      expect(binanceBalance[0].free).not.toBe(krakenBalance[0].free);
    });

    it('should track order history per exchange', async () => {
      const binance = new PaperTradingConnector('binance', 30);
      const kraken = new PaperTradingConnector('kraken', 30);

      await binance.placeOrder({
        symbol: 'BTCUSDT',
        type: 'BUY',
        quantity: 0.001,
        orderType: 'market',
      });

      await kraken.placeOrder({
        symbol: 'ETHUSDT',
        type: 'BUY',
        quantity: 0.01,
        orderType: 'market',
      });

      const binanceHistory = await binance.getOrderHistory();
      const krakenHistory = await kraken.getOrderHistory();

      expect(binanceHistory).toHaveLength(1);
      expect(krakenHistory).toHaveLength(1);
      expect(binanceHistory[0].symbol).toBe('BTCUSDT');
      expect(krakenHistory[0].symbol).toBe('ETHUSDT');
    });
  });

  describe('Error Handling', () => {
    let connector: PaperTradingConnector;

    beforeEach(() => {
      connector = new PaperTradingConnector('binance', 30);
    });

    it('should handle negative quantity', async () => {
      try {
        await connector.placeOrder({
          symbol: 'BTCUSDT',
          type: 'BUY',
          quantity: -0.001,
          orderType: 'market',
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle zero quantity', async () => {
      try {
        await connector.placeOrder({
          symbol: 'BTCUSDT',
          type: 'BUY',
          quantity: 0,
          orderType: 'market',
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid symbol gracefully', async () => {
      const data = await connector.getMarketData('INVALID');
      expect(data.symbol).toBe('INVALID');
      expect(data.price).toBeGreaterThan(0);
    });
  });
});
