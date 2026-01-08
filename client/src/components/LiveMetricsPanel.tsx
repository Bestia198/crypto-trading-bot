import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, Zap, Target } from "lucide-react";

export function LiveMetricsPanel() {
  const [metrics, setMetrics] = useState<any>(null);
  const [prevMetrics, setPrevMetrics] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const metricsQuery = trpc.dashboard.getMetrics.useQuery(undefined, {
    refetchInterval: 3000, // Refetch every 3 seconds
  });

  useEffect(() => {
    if (metricsQuery.data) {
      setPrevMetrics(metrics);
      setMetrics(metricsQuery.data);
      setLastUpdate(new Date());
    }
  }, [metricsQuery.data]);

  const getChangeIndicator = (current: number, previous: number | null) => {
    if (!previous || previous === 0) return null;
    const change = current - previous;
    if (change > 0) {
      return (
        <div className="flex items-center text-green-600 text-sm">
          <TrendingUp className="h-4 w-4 mr-1" />
          +{change.toFixed(2)}
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-600 text-sm">
          <TrendingDown className="h-4 w-4 mr-1" />
          {change.toFixed(2)}
        </div>
      );
    }
    return null;
  };

  if (!metrics) {
    return (
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Live Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Live Metrics
          </CardTitle>
          <span className="text-xs text-gray-500">
            Updated: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Portfolio Value */}
        <div className="p-4 rounded-lg bg-white border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Portfolio Value</div>
              <div className="text-3xl font-bold text-purple-600 mt-1">
                ${(metrics.portfolioValue || 0).toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              {getChangeIndicator(
                metrics.portfolioValue || 0,
                prevMetrics?.portfolioValue || null
              )}
            </div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="p-4 rounded-lg bg-white border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Win Rate</div>
              <div className="text-3xl font-bold text-green-600 mt-1">
                {(metrics.winRate || 0).toFixed(1)}%
              </div>
            </div>
            <div className="text-right">
              {getChangeIndicator(
                metrics.winRate || 0,
                prevMetrics?.winRate || null
              )}
            </div>
          </div>
        </div>

        {/* Total Trades */}
        <div className="p-4 rounded-lg bg-white border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Trades</div>
              <div className="text-3xl font-bold text-blue-600 mt-1">
                {metrics.totalTrades || 0}
              </div>
            </div>
            <div className="text-right">
              {getChangeIndicator(
                metrics.totalTrades || 0,
                prevMetrics?.totalTrades || null
              )}
            </div>
          </div>
        </div>

        {/* Total Profit */}
        <div className="p-4 rounded-lg bg-white border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Profit</div>
              <div
                className={`text-3xl font-bold mt-1 ${
                  (metrics.totalProfit || 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                ${(metrics.totalProfit || 0).toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              {getChangeIndicator(
                metrics.totalProfit || 0,
                prevMetrics?.totalProfit || null
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
