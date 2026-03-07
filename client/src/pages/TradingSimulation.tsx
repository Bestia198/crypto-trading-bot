import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Play, RefreshCw, TrendingUp } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

export default function TradingSimulation() {
  const { user } = useAuth();
  const [isSimulating, setIsSimulating] = useState(false);

  // tRPC queries and mutations
  const generateTradesMutation = trpc.autoTrade.generateTradesForAllAgents.useMutation();
  const tradingResultsQuery = trpc.trading.getTradingResults.useQuery();
  const tradingStatsQuery = trpc.trading.getTradingStats.useQuery();
  const agentConfigsQuery = trpc.automation.getAgentConfigs.useQuery();

  const handleGenerateTrades = async () => {
    setIsSimulating(true);
    try {
      const result = await generateTradesMutation.mutateAsync();
      toast.success(`Generated ${result.tradesGenerated} trades with ${result.profitGenerated > 0 ? "+" : ""}${result.profitGenerated.toFixed(2)} USDT profit`);
      // Refresh data
      await tradingResultsQuery.refetch();
      await tradingStatsQuery.refetch();
    } catch (error) {
      console.error("Error generating trades:", error);
      toast.error("Failed to generate trades");
    } finally {
      setIsSimulating(false);
    }
  };

  const stats = tradingStatsQuery.data;
  const results = tradingResultsQuery.data || [];
  const agents = agentConfigsQuery.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Trading Simulation</h1>
          <p className="text-muted-foreground">Generate and execute demo trades for testing</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={handleGenerateTrades}
            disabled={isSimulating}
            className="gap-2"
          >
            {isSimulating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Generate Trades for All Agents
          </Button>
        </div>

        {/* Trading Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTrades}</div>
                <p className="text-xs text-muted-foreground">Completed trades</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Winning trades</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.totalProfit > 0 ? "text-green-600" : "text-red-600"}`}>
                  {stats.totalProfit > 0 ? "+" : ""}{stats.totalProfit.toFixed(2)} USDT
                </div>
                <p className="text-xs text-muted-foreground">Net profit/loss</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trading Results Table */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Trading Results</CardTitle>
              <CardDescription>All executed trades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Agent</th>
                      <th className="text-left py-2 px-2">Symbol</th>
                      <th className="text-left py-2 px-2">Type</th>
                      <th className="text-right py-2 px-2">Entry Price</th>
                      <th className="text-right py-2 px-2">Exit Price</th>
                      <th className="text-right py-2 px-2">Quantity</th>
                      <th className="text-right py-2 px-2">Profit</th>
                      <th className="text-right py-2 px-2">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((trade) => (
                      <tr key={trade.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2">{trade.agentId}</td>
                        <td className="py-2 px-2">{trade.symbol}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-1 rounded text-xs ${trade.tradeType === "buy" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {trade.tradeType.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-right py-2 px-2">${parseFloat(trade.entryPrice?.toString() || "0").toFixed(2)}</td>
                        <td className="text-right py-2 px-2">${parseFloat(trade.exitPrice?.toString() || "0").toFixed(2)}</td>
                        <td className="text-right py-2 px-2">{parseFloat(trade.quantity?.toString() || "0").toFixed(4)}</td>
                        <td className={`text-right py-2 px-2 font-semibold ${parseFloat(trade.profit?.toString() || "0") > 0 ? "text-green-600" : "text-red-600"}`}>
                          {parseFloat(trade.profit?.toString() || "0") > 0 ? "+" : ""}{parseFloat(trade.profit?.toString() || "0").toFixed(2)}
                        </td>
                        <td className="text-right py-2 px-2">{(parseFloat(trade.confidence?.toString() || "0") * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {results.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No trades generated yet. Click the button above to generate demo trades.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
