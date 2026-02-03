import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { createExchangeConnector, ExchangeConfig, TradingMode } from "../services/exchangeService";
import { TRPCError } from "@trpc/server";

// Validation schemas
const exchangeConfigSchema = z.object({
  exchange: z.enum(['binance', 'kraken', 'coinbase', 'bybit']),
  apiKey: z.string().min(1, "API Key is required"),
  apiSecret: z.string().min(1, "API Secret is required"),
  passphrase: z.string().optional(),
  mode: z.enum(['paper', 'live']),
});

const orderSchema = z.object({
  symbol: z.string().min(1),
  type: z.enum(['BUY', 'SELL']),
  quantity: z.number().positive(),
  price: z.number().positive().optional(),
  orderType: z.enum(['market', 'limit']),
});

// In-memory store for exchange connectors (in production, use database)
const exchangeConnectors = new Map<string, any>();

export const exchangeRouter = router({
  // Connect to exchange
  connectExchange: protectedProcedure
    .input(exchangeConfigSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const connector = await createExchangeConnector(input);
        const isValid = await connector.validateConnection();

        if (!isValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid exchange credentials',
          });
        }

        // Store connector with user ID and exchange
        const key = `${ctx.user.id}-${input.exchange}`;
        exchangeConnectors.set(key, { connector, config: input });

        return {
          success: true,
          exchange: input.exchange,
          mode: input.mode,
          message: `Connected to ${input.exchange} in ${input.mode} mode`,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to connect to exchange: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  // Disconnect from exchange
  disconnectExchange: protectedProcedure
    .input(z.object({ exchange: z.enum(['binance', 'kraken', 'coinbase', 'bybit']) }))
    .mutation(({ ctx, input }) => {
      const key = `${ctx.user.id}-${input.exchange}`;
      exchangeConnectors.delete(key);
      return { success: true, message: `Disconnected from ${input.exchange}` };
    }),

  // Get market data
  getMarketData: protectedProcedure
    .input(z.object({
      exchange: z.enum(['binance', 'kraken', 'coinbase', 'bybit']),
      symbol: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const key = `${ctx.user.id}-${input.exchange}`;
      const exchangeData = exchangeConnectors.get(key);

      if (!exchangeData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Not connected to ${input.exchange}`,
        });
      }

      try {
        const marketData = await exchangeData.connector.getMarketData(input.symbol);
        return marketData;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to get market data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  // Get multiple market data
  getMultipleMarketData: protectedProcedure
    .input(z.object({
      exchange: z.enum(['binance', 'kraken', 'coinbase', 'bybit']),
      symbols: z.array(z.string()),
    }))
    .query(async ({ ctx, input }) => {
      const key = `${ctx.user.id}-${input.exchange}`;
      const exchangeData = exchangeConnectors.get(key);

      if (!exchangeData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Not connected to ${input.exchange}`,
        });
      }

      try {
        const marketData = await exchangeData.connector.getMultipleMarketData(input.symbols);
        return marketData;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to get market data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  // Place order
  placeOrder: protectedProcedure
    .input(z.object({
      exchange: z.enum(['binance', 'kraken', 'coinbase', 'bybit']),
      order: orderSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const key = `${ctx.user.id}-${input.exchange}`;
      const exchangeData = exchangeConnectors.get(key);

      if (!exchangeData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Not connected to ${input.exchange}`,
        });
      }

      try {
        const response = await exchangeData.connector.placeOrder(input.order);
        return response;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to place order: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  // Cancel order
  cancelOrder: protectedProcedure
    .input(z.object({
      exchange: z.enum(['binance', 'kraken', 'coinbase', 'bybit']),
      orderId: z.string(),
      symbol: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const key = `${ctx.user.id}-${input.exchange}`;
      const exchangeData = exchangeConnectors.get(key);

      if (!exchangeData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Not connected to ${input.exchange}`,
        });
      }

      try {
        const success = await exchangeData.connector.cancelOrder(input.orderId, input.symbol);
        return { success, message: success ? 'Order cancelled' : 'Failed to cancel order' };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to cancel order: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  // Get balance
  getBalance: protectedProcedure
    .input(z.object({
      exchange: z.enum(['binance', 'kraken', 'coinbase', 'bybit']),
    }))
    .query(async ({ ctx, input }) => {
      const key = `${ctx.user.id}-${input.exchange}`;
      const exchangeData = exchangeConnectors.get(key);

      if (!exchangeData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Not connected to ${input.exchange}`,
        });
      }

      try {
        const balance = await exchangeData.connector.getBalance();
        return balance;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  // Get order history
  getOrderHistory: protectedProcedure
    .input(z.object({
      exchange: z.enum(['binance', 'kraken', 'coinbase', 'bybit']),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const key = `${ctx.user.id}-${input.exchange}`;
      const exchangeData = exchangeConnectors.get(key);

      if (!exchangeData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Not connected to ${input.exchange}`,
        });
      }

      try {
        const orders = await exchangeData.connector.getOrderHistory(input.limit);
        return orders;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to get order history: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  // Get connected exchanges
  getConnectedExchanges: protectedProcedure.query(({ ctx }) => {
    const prefix = `${ctx.user.id}-`;
    const exchanges = Array.from(exchangeConnectors.keys())
      .filter(key => key.startsWith(prefix))
      .map(key => {
        const exchange = key.replace(prefix, '');
        const data = exchangeConnectors.get(key);
        return {
          exchange,
          mode: data.config.mode,
          connected: true,
        };
      });
    return exchanges;
  }),
});
