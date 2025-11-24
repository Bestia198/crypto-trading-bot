import axios from "axios";

const BINANCE_API_URL = "https://api.binance.com/api/v3";

export interface BinancePrice {
  symbol: string;
  price: number;
  timestamp: number;
}

export interface BinanceKline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  volatility: number;
}

/**
 * Fetch current price from Binance
 */
export async function getPrice(symbol: string = "BTCUSDT"): Promise<number> {
  try {
    const response = await axios.get(`${BINANCE_API_URL}/ticker/price`, {
      params: { symbol },
      timeout: 5000,
    });
    return parseFloat(response.data.price);
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    // Return fallback price
    return symbol === "BTCUSDT" ? 45000 : 2500;
  }
}

/**
 * Fetch 24h market data from Binance
 */
export async function getMarketData(symbol: string = "BTCUSDT"): Promise<MarketData> {
  try {
    const [priceResponse, ticker24hResponse] = await Promise.all([
      axios.get(`${BINANCE_API_URL}/ticker/price`, {
        params: { symbol },
        timeout: 5000,
      }),
      axios.get(`${BINANCE_API_URL}/ticker/24hr`, {
        params: { symbol },
        timeout: 5000,
      }),
    ]);

    const price = parseFloat(priceResponse.data.price);
    const data24h = ticker24hResponse.data;

    return {
      symbol,
      price,
      change24h: parseFloat(data24h.priceChangePercent),
      volume24h: parseFloat(data24h.quoteAssetVolume),
      high24h: parseFloat(data24h.highPrice),
      low24h: parseFloat(data24h.lowPrice),
      volatility: calculateVolatility(
        parseFloat(data24h.highPrice),
        parseFloat(data24h.lowPrice),
        price
      ),
    };
  } catch (error) {
    console.error(`Error fetching market data for ${symbol}:`, error);
    // Return fallback data
    return {
      symbol,
      price: symbol === "BTCUSDT" ? 45000 : 2500,
      change24h: 0,
      volume24h: 0,
      high24h: 0,
      low24h: 0,
      volatility: 2,
    };
  }
}

/**
 * Fetch kline data for technical analysis
 */
export async function getKlines(
  symbol: string = "BTCUSDT",
  interval: string = "1h",
  limit: number = 24
): Promise<BinanceKline[]> {
  try {
    const response = await axios.get(`${BINANCE_API_URL}/klines`, {
      params: { symbol, interval, limit },
      timeout: 5000,
    });

    return response.data.map((kline: any[]) => ({
      openTime: kline[0],
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[7]),
      closeTime: kline[6],
    }));
  } catch (error) {
    console.error(`Error fetching klines for ${symbol}:`, error);
    return [];
  }
}

/**
 * Calculate volatility from high/low prices
 */
function calculateVolatility(high: number, low: number, close: number): number {
  if (close === 0) return 0;
  return ((high - low) / close) * 100;
}

/**
 * Analyze market trend
 */
export async function analyzeMarketTrend(symbol: string = "BTCUSDT"): Promise<{
  trend: "uptrend" | "downtrend" | "sideways";
  strength: number;
  volatility: number;
}> {
  try {
    const klines = await getKlines(symbol, "1h", 24);
    if (klines.length === 0) {
      return { trend: "sideways", strength: 0, volatility: 2 };
    }

    const closes = klines.map(k => k.close);
    const sma12 = calculateSMA(closes, 12);
    const sma26 = calculateSMA(closes, 26);

    const volatility = calculateVolatility(
      Math.max(...closes),
      Math.min(...closes),
      closes[closes.length - 1]
    );

    let trend: "uptrend" | "downtrend" | "sideways" = "sideways";
    let strength = 0;

    if (sma12 > sma26) {
      trend = "uptrend";
      strength = Math.min(100, ((sma12 - sma26) / sma26) * 1000);
    } else if (sma12 < sma26) {
      trend = "downtrend";
      strength = Math.min(100, ((sma26 - sma12) / sma26) * 1000);
    }

    return { trend, strength, volatility };
  } catch (error) {
    console.error("Error analyzing market trend:", error);
    return { trend: "sideways", strength: 0, volatility: 2 };
  }
}

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

/**
 * Get multiple market data for comparison
 */
export async function getMultipleMarketData(symbols: string[]): Promise<MarketData[]> {
  return Promise.all(symbols.map(symbol => getMarketData(symbol)));
}
