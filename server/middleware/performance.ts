/**
 * Performance Monitoring Utility
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;

  startTimer() {
    return Date.now();
  }

  recordMetric(
    name: string,
    startTime: number,
    success: boolean = true,
    error?: string
  ) {
    const duration = Date.now() - startTime;

    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
      success,
      error,
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (duration > 1000) {
      console.warn(`[Performance] Slow operation: ${name} took ${duration}ms`);
    }
  }

  getMetrics(name?: string) {
    if (!name) {
      return this.metrics;
    }

    return this.metrics.filter((m) => m.name === name);
  }

  getAverageTime(name: string) {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  getSuccessRate(name: string) {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 100;

    const successful = metrics.filter((m) => m.success).length;
    return (successful / metrics.length) * 100;
  }

  getSummary() {
    const summary: Record<string, any> = {};

    const uniqueNames = new Set(this.metrics.map((m) => m.name));
    const namesArray = Array.from(uniqueNames);

    namesArray.forEach((name) => {
      const metrics = this.getMetrics(name);
      summary[name] = {
        count: metrics.length,
        avgTime: this.getAverageTime(name),
        successRate: this.getSuccessRate(name),
        minTime: Math.min(...metrics.map((m) => m.duration)),
        maxTime: Math.max(...metrics.map((m) => m.duration)),
      };
    });

    return summary;
  }

  clear() {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Middleware for automatic performance tracking
 */
export function trackPerformance(name: string) {
  return async (fn: () => Promise<any>) => {
    const startTime = performanceMonitor.startTimer();
    try {
      const result = await fn();
      performanceMonitor.recordMetric(name, startTime, true);
      return result;
    } catch (error) {
      performanceMonitor.recordMetric(
        name,
        startTime,
        false,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  };
}

/**
 * Query Optimization Tips
 */
export const queryOptimizationTips = {
  useIndexes: "Add database indexes on frequently queried columns (userId, isEnabled, symbol)",
  batchQueries: "Combine multiple queries into single batch operations",
  selectColumns: "Select only needed columns instead of SELECT *",
  limitResults: "Use LIMIT to reduce data transfer",
  caching: "Cache frequently accessed data with TTL",
  pagination: "Implement pagination for large result sets",
};

/**
 * Frontend Performance Tips
 */
export const frontendOptimizationTips = {
  codeSpitting: "Split code into smaller chunks for faster loading",
  lazyLoading: "Load components only when needed",
  memoization: "Use React.memo to prevent unnecessary re-renders",
  virtualizing: "Virtualize long lists to improve rendering performance",
  imageOptimization: "Compress and optimize images",
  bundleAnalysis: "Analyze bundle size and remove unused dependencies",
  caching: "Implement service workers for offline support",
};
