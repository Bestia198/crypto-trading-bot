import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Activity, TrendingUp, TrendingDown } from "lucide-react";

interface Trade {
  id: number;
  type: string;
  symbol: string;
  profit: number | null;
  executedAt: Date | string;
  agentId: number;
}

export function TradeExecutionLog() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const activitiesQuery = trpc.dashboard.getRecentActivity.useQuery(undefined, {
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
  });

  useEffect(() => {
    if (activitiesQuery.data) {
      setTrades(activitiesQuery.data.map((t: any) => ({
        ...t,
        executedAt: typeof t.executedAt === 'string' ? t.executedAt : t.executedAt.toISOString(),
      })));
      setLoading(false);
    }
  }, [activitiesQuery.data]);

  if (loading) {
    return (
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-600" />
            Trade Execution Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-600" />
            Trade Execution Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No trades executed yet. Enable agents to start trading.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-600" />
            Trade Execution Log
          </CardTitle>
          <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
            {trades.length} trades
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className={`p-3 rounded-lg border-l-4 bg-white transition ${
                (trade.profit || 0) > 0
                  ? "border-l-green-500 hover:bg-green-50"
                  : "border-l-red-500 hover:bg-red-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {(trade.profit || 0) > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-semibold text-gray-900 uppercase">
                      {trade.type}
                    </span>
                    <span className="text-sm text-gray-600">{trade.symbol}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {typeof trade.executedAt === 'string' ? new Date(trade.executedAt).toLocaleTimeString() : trade.executedAt.toLocaleTimeString()}
                  </div>
                </div>
                <div
                  className={`text-right font-bold ${
                    (trade.profit || 0) > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {(trade.profit || 0) > 0 ? "+" : ""}
                  ${(trade.profit || 0).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
