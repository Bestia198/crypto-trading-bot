/**
 * Cryptocurrency Trading Pairs Configuration
 * Comprehensive list of supported trading pairs across major exchanges
 */

export interface CryptoPair {
  id: string;
  symbol: string;
  name: string;
  baseAsset: string;
  quoteAsset: string;
  minTrade: number;
  maxTrade: number;
  precision: number;
  category: "major" | "altcoin" | "defi" | "layer2" | "emerging";
  exchanges: string[];
  active: boolean;
}

export const CRYPTO_PAIRS: CryptoPair[] = [
  // Major Cryptocurrencies
  {
    id: "BTC/USDT",
    symbol: "BTC/USDT",
    name: "Bitcoin",
    baseAsset: "BTC",
    quoteAsset: "USDT",
    minTrade: 0.001,
    maxTrade: 1000,
    precision: 8,
    category: "major",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "ETH/USDT",
    symbol: "ETH/USDT",
    name: "Ethereum",
    baseAsset: "ETH",
    quoteAsset: "USDT",
    minTrade: 0.01,
    maxTrade: 10000,
    precision: 8,
    category: "major",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "BNB/USDT",
    symbol: "BNB/USDT",
    name: "Binance Coin",
    baseAsset: "BNB",
    quoteAsset: "USDT",
    minTrade: 0.01,
    maxTrade: 5000,
    precision: 8,
    category: "major",
    exchanges: ["binance", "kraken", "bybit"],
    active: true,
  },
  {
    id: "SOL/USDT",
    symbol: "SOL/USDT",
    name: "Solana",
    baseAsset: "SOL",
    quoteAsset: "USDT",
    minTrade: 0.1,
    maxTrade: 50000,
    precision: 8,
    category: "major",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "XRP/USDT",
    symbol: "XRP/USDT",
    name: "Ripple",
    baseAsset: "XRP",
    quoteAsset: "USDT",
    minTrade: 1,
    maxTrade: 1000000,
    precision: 8,
    category: "major",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "ADA/USDT",
    symbol: "ADA/USDT",
    name: "Cardano",
    baseAsset: "ADA",
    quoteAsset: "USDT",
    minTrade: 1,
    maxTrade: 500000,
    precision: 8,
    category: "major",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "DOGE/USDT",
    symbol: "DOGE/USDT",
    name: "Dogecoin",
    baseAsset: "DOGE",
    quoteAsset: "USDT",
    minTrade: 1,
    maxTrade: 1000000,
    precision: 8,
    category: "major",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },

  // DeFi Tokens
  {
    id: "LINK/USDT",
    symbol: "LINK/USDT",
    name: "Chainlink",
    baseAsset: "LINK",
    quoteAsset: "USDT",
    minTrade: 0.1,
    maxTrade: 10000,
    precision: 8,
    category: "defi",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "UNI/USDT",
    symbol: "UNI/USDT",
    name: "Uniswap",
    baseAsset: "UNI",
    quoteAsset: "USDT",
    minTrade: 0.1,
    maxTrade: 10000,
    precision: 8,
    category: "defi",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "AAVE/USDT",
    symbol: "AAVE/USDT",
    name: "Aave",
    baseAsset: "AAVE",
    quoteAsset: "USDT",
    minTrade: 0.01,
    maxTrade: 1000,
    precision: 8,
    category: "defi",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "SUSHI/USDT",
    symbol: "SUSHI/USDT",
    name: "SushiSwap",
    baseAsset: "SUSHI",
    quoteAsset: "USDT",
    minTrade: 0.1,
    maxTrade: 50000,
    precision: 8,
    category: "defi",
    exchanges: ["binance", "kraken", "bybit"],
    active: true,
  },
  {
    id: "CURVE/USDT",
    symbol: "CURVE/USDT",
    name: "Curve",
    baseAsset: "CRV",
    quoteAsset: "USDT",
    minTrade: 1,
    maxTrade: 100000,
    precision: 8,
    category: "defi",
    exchanges: ["binance", "kraken", "bybit"],
    active: true,
  },

  // Layer 2 Solutions
  {
    id: "MATIC/USDT",
    symbol: "MATIC/USDT",
    name: "Polygon",
    baseAsset: "MATIC",
    quoteAsset: "USDT",
    minTrade: 1,
    maxTrade: 500000,
    precision: 8,
    category: "layer2",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "ARB/USDT",
    symbol: "ARB/USDT",
    name: "Arbitrum",
    baseAsset: "ARB",
    quoteAsset: "USDT",
    minTrade: 1,
    maxTrade: 100000,
    precision: 8,
    category: "layer2",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "OP/USDT",
    symbol: "OP/USDT",
    name: "Optimism",
    baseAsset: "OP",
    quoteAsset: "USDT",
    minTrade: 1,
    maxTrade: 100000,
    precision: 8,
    category: "layer2",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },

  // Emerging & Altcoins
  {
    id: "AVAX/USDT",
    symbol: "AVAX/USDT",
    name: "Avalanche",
    baseAsset: "AVAX",
    quoteAsset: "USDT",
    minTrade: 0.1,
    maxTrade: 10000,
    precision: 8,
    category: "emerging",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "NEAR/USDT",
    symbol: "NEAR/USDT",
    name: "NEAR Protocol",
    baseAsset: "NEAR",
    quoteAsset: "USDT",
    minTrade: 0.1,
    maxTrade: 50000,
    precision: 8,
    category: "emerging",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "FTM/USDT",
    symbol: "FTM/USDT",
    name: "Fantom",
    baseAsset: "FTM",
    quoteAsset: "USDT",
    minTrade: 1,
    maxTrade: 500000,
    precision: 8,
    category: "emerging",
    exchanges: ["binance", "kraken", "bybit"],
    active: true,
  },
  {
    id: "ATOM/USDT",
    symbol: "ATOM/USDT",
    name: "Cosmos",
    baseAsset: "ATOM",
    quoteAsset: "USDT",
    minTrade: 0.1,
    maxTrade: 50000,
    precision: 8,
    category: "emerging",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "DOT/USDT",
    symbol: "DOT/USDT",
    name: "Polkadot",
    baseAsset: "DOT",
    quoteAsset: "USDT",
    minTrade: 0.1,
    maxTrade: 50000,
    precision: 8,
    category: "emerging",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "ALGO/USDT",
    symbol: "ALGO/USDT",
    name: "Algorand",
    baseAsset: "ALGO",
    quoteAsset: "USDT",
    minTrade: 1,
    maxTrade: 500000,
    precision: 8,
    category: "emerging",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "VET/USDT",
    symbol: "VET/USDT",
    name: "VeChain",
    baseAsset: "VET",
    quoteAsset: "USDT",
    minTrade: 1,
    maxTrade: 1000000,
    precision: 8,
    category: "emerging",
    exchanges: ["binance", "kraken", "bybit"],
    active: true,
  },
  {
    id: "THETA/USDT",
    symbol: "THETA/USDT",
    name: "Theta",
    baseAsset: "THETA",
    quoteAsset: "USDT",
    minTrade: 0.1,
    maxTrade: 50000,
    precision: 8,
    category: "emerging",
    exchanges: ["binance", "kraken", "bybit"],
    active: true,
  },
  {
    id: "ZEC/USDT",
    symbol: "ZEC/USDT",
    name: "Zcash",
    baseAsset: "ZEC",
    quoteAsset: "USDT",
    minTrade: 0.01,
    maxTrade: 1000,
    precision: 8,
    category: "emerging",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "XMR/USDT",
    symbol: "XMR/USDT",
    name: "Monero",
    baseAsset: "XMR",
    quoteAsset: "USDT",
    minTrade: 0.01,
    maxTrade: 1000,
    precision: 8,
    category: "emerging",
    exchanges: ["kraken", "bybit"],
    active: true,
  },
  {
    id: "DASH/USDT",
    symbol: "DASH/USDT",
    name: "Dash",
    baseAsset: "DASH",
    quoteAsset: "USDT",
    minTrade: 0.01,
    maxTrade: 1000,
    precision: 8,
    category: "emerging",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "BCH/USDT",
    symbol: "BCH/USDT",
    name: "Bitcoin Cash",
    baseAsset: "BCH",
    quoteAsset: "USDT",
    minTrade: 0.01,
    maxTrade: 1000,
    precision: 8,
    category: "emerging",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "LTC/USDT",
    symbol: "LTC/USDT",
    name: "Litecoin",
    baseAsset: "LTC",
    quoteAsset: "USDT",
    minTrade: 0.01,
    maxTrade: 10000,
    precision: 8,
    category: "emerging",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "ETC/USDT",
    symbol: "ETC/USDT",
    name: "Ethereum Classic",
    baseAsset: "ETC",
    quoteAsset: "USDT",
    minTrade: 0.1,
    maxTrade: 50000,
    precision: 8,
    category: "emerging",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "MANA/USDT",
    symbol: "MANA/USDT",
    name: "Decentraland",
    baseAsset: "MANA",
    quoteAsset: "USDT",
    minTrade: 1,
    maxTrade: 500000,
    precision: 8,
    category: "emerging",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "SAND/USDT",
    symbol: "SAND/USDT",
    name: "The Sandbox",
    baseAsset: "SAND",
    quoteAsset: "USDT",
    minTrade: 1,
    maxTrade: 500000,
    precision: 8,
    category: "emerging",
    exchanges: ["binance", "kraken", "bybit"],
    active: true,
  },
  {
    id: "ENJ/USDT",
    symbol: "ENJ/USDT",
    name: "Enjin",
    baseAsset: "ENJ",
    quoteAsset: "USDT",
    minTrade: 1,
    maxTrade: 500000,
    precision: 8,
    category: "emerging",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
  {
    id: "FLOW/USDT",
    symbol: "FLOW/USDT",
    name: "Flow",
    baseAsset: "FLOW",
    quoteAsset: "USDT",
    minTrade: 0.1,
    maxTrade: 50000,
    precision: 8,
    category: "emerging",
    exchanges: ["binance", "kraken", "coinbase", "bybit"],
    active: true,
  },
];

/**
 * Get pair by symbol
 */
export function getPairBySymbol(symbol: string): CryptoPair | undefined {
  return CRYPTO_PAIRS.find((p) => p.symbol === symbol);
}

/**
 * Get all active pairs
 */
export function getActivePairs(): CryptoPair[] {
  return CRYPTO_PAIRS.filter((p) => p.active);
}

/**
 * Get pairs by category
 */
export function getPairsByCategory(
  category: CryptoPair["category"]
): CryptoPair[] {
  return CRYPTO_PAIRS.filter((p) => p.category === category && p.active);
}

/**
 * Get pairs by exchange
 */
export function getPairsByExchange(exchange: string): CryptoPair[] {
  return CRYPTO_PAIRS.filter(
    (p) => p.exchanges.includes(exchange) && p.active
  );
}

/**
 * Get all unique base assets
 */
export function getAllBaseAssets(): string[] {
  const assetsSet = new Set(CRYPTO_PAIRS.map((p) => p.baseAsset));
  return Array.from(assetsSet).sort();
}

/**
 * Get all unique exchanges
 */
export function getAllExchanges(): string[] {
  const exchangesSet = new Set<string>();
  CRYPTO_PAIRS.forEach((p) => p.exchanges.forEach((e) => exchangesSet.add(e)));
  return Array.from(exchangesSet).sort();
}
