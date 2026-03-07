import { TRPCError } from "@trpc/server";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

/**
 * Rate Limiting Configuration
 */
export const RATE_LIMITS = {
  // API endpoints
  createAgentConfig: { requests: 10, windowMs: 60000 }, // 10 requests per minute
  createAutomationSchedule: { requests: 5, windowMs: 60000 }, // 5 requests per minute
  toggleSchedule: { requests: 20, windowMs: 60000 }, // 20 requests per minute
  startExecution: { requests: 30, windowMs: 60000 }, // 30 requests per minute
  stopExecution: { requests: 30, windowMs: 60000 }, // 30 requests per minute
  deposit: { requests: 5, windowMs: 3600000 }, // 5 requests per hour
  withdraw: { requests: 5, windowMs: 3600000 }, // 5 requests per hour
  
  // Default for other endpoints
  default: { requests: 100, windowMs: 60000 }, // 100 requests per minute
};

/**
 * Rate Limiter Function
 */
export function createRateLimiter(
  endpoint: keyof typeof RATE_LIMITS | "default",
  userId: string
) {
  return () => {
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
    const key = `${endpoint}:${userId}`;
    const now = Date.now();

    if (!rateLimitStore[key]) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      return { allowed: true, remaining: config.requests - 1 };
    }

    const record = rateLimitStore[key];

    // Reset if window has passed
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + config.windowMs;
      return { allowed: true, remaining: config.requests - 1 };
    }

    // Check if limit exceeded
    if (record.count >= config.requests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
      });
    }

    record.count++;
    return { allowed: true, remaining: config.requests - record.count };
  };
}

/**
 * Cleanup old entries (run periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const key in rateLimitStore) {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
