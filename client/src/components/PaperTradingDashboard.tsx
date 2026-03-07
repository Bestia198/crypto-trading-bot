import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Play, Square, TrendingUp, Percent, DollarSign } from "lucide-react";

interface SessionConfig {
  sessionName: string;
  initialCapital: number;
  durationDays: number;
}

export default function PaperTradingDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>({
    sessionName: "Paper Trading Session",
    initialCapital: 10000,
    durationDays: 7,
  });
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  // Fetch user's paper trading sessions
  const { data: sessions, refetch: refetchSessions } = trpc.paperTrading.getSessions.useQuery();

  // Fetch active session metrics
  const { data: metrics, refetch: refetchMetrics } = trpc.paperTrading.getMetrics.useQuery(
    { sessionId: activeSessionId || 0 },
    { enabled: !!activeSessionId }
  );

  // Fetch session trades
  const { data: trades, refetch: refetchTrades } = trpc.paperTrading.getTrades.useQuery(
    { sessionId: activeSessionId || 0 },
    { enabled: !!activeSessionId }
  );

  // Create session mutation
  const createSessionMutation = trpc.paperTrading.createSession.useMutation({
    onSuccess: (data) => {
      toast.success("Paper trading session started!");
      setActiveSessionId(data.sessionId);
      setIsRunning(true);
      refetchSessions();
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Complete session mutation
  const completeSessionMutation = trpc.paperTrading.completeSession.useMutation({
    onSuccess: () => {
      toast.success("Paper trading session completed!");
      setIsRunning(false);
      setActiveSessionId(null);
      refetchSessions();
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Auto-refetch metrics and trades when session is running
  useEffect(() => {
    if (!isRunning || !activeSessionId) return;

    const interval = setInterval(() => {
      refetchMetrics();
      refetchTrades();
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning, activeSessionId, refetchMetrics, refetchTrades]);

  const handleStartSession = () => {
    createSessionMutation.mutate({
      sessionName: sessionConfig.sessionName,
      initialCapital: sessionConfig.initialCapital,
      durationDays: sessionConfig.durationDays,
      symbols: ["BTC/USDT", "ETH/USDT", "XRP/USDT"],
    });
  };

  const handleEndSession = () => {
    if (activeSessionId) {
      completeSessionMutation.mutate({ sessionId: activeSessionId });
    }
  };

  const chartData = metrics
    ? [
        {
          name: "Performance",
          profit: metrics.totalProfit,
          roi: metrics.roi,
          balance: metrics.currentBalance,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Session Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Paper Trading Configuration</CardTitle>
          <CardDescription>Set up your 7-day paper trading simulation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sessionName">Session Name</Label>
              <Input
                id="sessionName"
                value={sessionConfig.sessionName}
                onChange={(e) => setSessionConfig({ ...sessionConfig, sessionName: e.target.value })}
                placeholder="Enter session name"
                disabled={isRunning}
              />
            </div>

            <div>
              <Label htmlFor="initialCapital">Initial Capital ($)</Label>
              <Input
                id="initialCapital"
                type="number"
                value={sessionConfig.initialCapital}
                onChange={(e) =>
                  setSessionConfig({
                    ...sessionConfig,
                    initialCapital: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="10000"
                disabled={isRunning}
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (Days)</Label>
              <Select
                value={sessionConfig.durationDays.toString()}
                onValueChange={(value) =>
                  setSessionConfig({
                    ...sessionConfig,
                    durationDays: parseInt(value),
                  })
                }
                disabled={isRunning}
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleStartSession}
              disabled={isRunning || createSessionMutation.isPending}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              Start Session
            </Button>
            <Button
              onClick={handleEndSession}
              disabled={!isRunning || completeSessionMutation.isPending}
              variant="destructive"
              className="gap-2"
            >
              <Square className="w-4 h-4" />
              End Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className={`text-2xl font-bold ${metrics.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ${metrics.totalProfit.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold">{metrics.winRate.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">ROI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className={`text-2xl font-bold ${metrics.roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {metrics.roi.toFixed(2)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold">${metrics.currentBalance.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Trading performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="profit" fill="#10b981" name="Total Profit ($)" />
                <Bar dataKey="roi" fill="#3b82f6" name="ROI (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Trade History */}
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
          <CardDescription>Recent trades from paper trading session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Symbol</th>
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">Quantity</th>
                  <th className="text-left py-2 px-2">Entry Price</th>
                  <th className="text-left py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {trades && trades.length > 0 ? (
                  trades.map((trade: any) => (
                    <tr key={trade.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">{trade.symbol}</td>
                      <td className="py-2 px-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            trade.tradeType === "buy" || trade.tradeType === "long"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {trade.tradeType.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-2">{trade.quantity.toFixed(4)}</td>
                      <td className="py-2 px-2">${trade.entryPrice.toFixed(2)}</td>
                      <td className="py-2 px-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            trade.status === "closed"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {trade.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      No trades yet. Start a paper trading session to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      {sessions && sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Your paper trading sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{session.sessionName}</p>
                    <p className="text-sm text-muted-foreground">
                      Capital: ${session.initialCapital} | Status: {session.status}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveSessionId(session.id)}
                    disabled={!isRunning}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
