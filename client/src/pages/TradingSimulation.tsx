import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Play, RefreshCw, TrendingUp } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function TradingSimulation() {
  const { user } = useAuth();
  const [isSimulating, setIsSimulating] = useState(false);

  // tRPC queries and mutations
  const seedDemoMutation = trpc.trading.seedDemoData.useMutation();
  const executeTradeMutation = trpc.trading.executeTrade.useMutation();
  const tradingResultsQuery = trpc.trading.getTradingResults.useQuery();
  const tradingStatsQuery = trpc.trading.getTradingStats.useQuery();
  const agentConfigsQuery = trpc.automation.getAgentConfigs.useQuery();

  const handleSeedDemoData = async () => {
    setIsSimulating(true);
    try {
      await seedDemoMutation.mutateAsync();
      // Refresh data
      await tradingResultsQuery.refetch();
      await tradingStatsQuery.refetch();
    } catch (error) {
      console.error("Error seeding demo data:", error);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExecuteTrade = async (agentId: number) => {
    setIsSimulating(true);
    try {
      await executeTradeMutation.mutateAsync({ agentId });
      // Refresh data
      await tradingResultsQuery.refetch();
      await tradingStatsQuery.refetch();
    } catch (error) {
      console.error("Error executing trade:", error);
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
            onClick={handleSeedDemoData}
            disabled={isSimulating}
            className="gap-2"
          >
            {isSimulating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Seed Demo Data
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
                <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${stats.totalProfit.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Net profit/loss</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Agent Trading Buttons */}
        {agents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Execute Trades by Agent</CardTitle>
              <CardDescription>Run individual trades for each agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <Button
                    key={agent.id}
                    onClick={() => handleExecuteTrade(agent.id)}
                    disabled={isSimulating}
                    variant="outline"
                    className="gap-2"
                  >
                    {isSimulating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Trade: {agent.agentName}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trading Results Table */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Trading Results</CardTitle>
              <CardDescription>Latest {Math.min(10, results.length)} trades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Symbol</th>
                      <th className="text-left py-2 px-4">Entry Price</th>
                      <th className="text-left py-2 px-4">Exit Price</th>
                      <th className="text-left py-2 px-4">Quantity</th>
                      <th className="text-left py-2 px-4">Profit</th>
                      <th className="text-left py-2 px-4">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.slice(0, 10).map((result) => (
                      <tr key={result.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-4">{result.symbol}</td>
                        <td className="py-2 px-4">${parseFloat(result.entryPrice.toString()).toFixed(2)}</td>
                        <td className="py-2 px-4">${parseFloat((result.exitPrice || 0).toString()).toFixed(2)}</td>
                        <td className="py-2 px-4">{parseFloat(result.quantity.toString()).toFixed(4)}</td>
                        <td className={`py-2 px-4 font-semibold ${parseFloat((result.profit || 0).toString()) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          ${parseFloat((result.profit || 0).toString()).toFixed(2)}
                        </td>
                        <td className="py-2 px-4">{((parseFloat((result.confidence || 0).toString())) * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {results.length === 0 && !tradingResultsQuery.isLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                No Trading Data Yet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Click "Seed Demo Data" to generate sample trading data and see how agents perform.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
