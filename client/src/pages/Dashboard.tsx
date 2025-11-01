import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, TrendingUp, Wallet, Zap } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [initialFiat, setInitialFiat] = useState(20);

  // Mutation to start a new simulation
  const startSimulation = trpc.trading.startSimulation.useMutation({
    onSuccess: (data) => {
      setSelectedSession(data.sessionId);
      setIsDialogOpen(false);
      setSessionName("");
      setInitialFiat(20);
      // Refetch sessions
      trpc.useUtils().trading.getSessions.invalidate();
    },
  });

  // Fetch trading sessions
  const { data: sessions, isLoading: sessionsLoading } = trpc.trading.getSessions.useQuery();
  
  // Fetch metrics for selected session
  const { data: sessionMetrics, isLoading: metricsLoading } = trpc.trading.getSessionMetrics.useQuery(
    { sessionId: selectedSession! },
    { enabled: !!selectedSession }
  );

  // Fetch agent comparison
  const { data: agentComparison } = trpc.trading.getAgentComparison.useQuery(
    { sessionId: selectedSession! },
    { enabled: !!selectedSession }
  );

  // Fetch portfolio evolution
  const { data: portfolioEvolution } = trpc.trading.getPortfolioEvolution.useQuery(
    { sessionId: selectedSession! },
    { enabled: !!selectedSession }
  );

  // Prepare data for charts
  const agentComparisonData = agentComparison?.map(agent => ({
    name: agent.name,
    roi: (agent.roi * 100).toFixed(2),
    winRate: (agent.winRate * 100).toFixed(2),
    trades: agent.trades,
  })) || [];

  const portfolioData = portfolioEvolution?.map(snapshot => ({
    timestamp: new Date(snapshot.timestamp).toLocaleTimeString(),
    [snapshot.agent]: parseFloat(snapshot.netWorth.toString()),
  })) || [];

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Trading Dashboard</h1>
            <p className="text-gray-600">Multi-Agent Cryptocurrency Trading Bot</p>
          </div>
        </div>

        {/* Session Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Trading Sessions</CardTitle>
            <CardDescription>Select a session to view detailed metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" />
                <span>Loading sessions...</span>
              </div>
            ) : sessions && sessions.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Your Sessions</h3>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">+ New Session</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Start New Trading Simulation</DialogTitle>
                        <DialogDescription>
                          Configure your trading session parameters
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="sessionName">Session Name</Label>
                          <Input
                            id="sessionName"
                            placeholder="e.g., BTC Trading Session 1"
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="initialFiat">Initial Capital (USDT)</Label>
                          <Input
                            id="initialFiat"
                            type="number"
                            min="1"
                            max="10000"
                            value={initialFiat}
                            onChange={(e) => setInitialFiat(parseFloat(e.target.value))}
                          />
                        </div>
                        <Button
                          onClick={() => {
                            if (sessionName.trim()) {
                              startSimulation.mutate({
                                sessionName,
                                initialFiat,
                              });
                            }
                          }}
                          disabled={startSimulation.isPending || !sessionName.trim()}
                        >
                          {startSimulation.isPending ? (
                            <>
                              <Loader2 className="animate-spin mr-2" />
                              Starting...
                            </>
                          ) : (
                            "Start Simulation"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessions.map(session => (
                    <button
                    key={session.id}
                    onClick={() => setSelectedSession(session.id)}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedSession === session.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-semibold">{session.sessionName}</p>
                      <p className="text-sm text-gray-600">{session.symbol}</p>
                      <p className="text-sm text-gray-500">Episode {session.episodeNumber}</p>
                      <p className="text-lg font-bold text-green-600 mt-2">
                        {(parseFloat(session.totalROI.toString()) * 100).toFixed(2)}% ROI
                      </p>
                    </div>
                  </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No trading sessions yet</p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Start New Session</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start New Trading Simulation</DialogTitle>
                      <DialogDescription>
                        Configure your trading session parameters
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="sessionName">Session Name</Label>
                        <Input
                          id="sessionName"
                          placeholder="e.g., BTC Trading Session 1"
                          value={sessionName}
                          onChange={(e) => setSessionName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="initialFiat">Initial Capital (USDT)</Label>
                        <Input
                          id="initialFiat"
                          type="number"
                          min="1"
                          max="10000"
                          value={initialFiat}
                          onChange={(e) => setInitialFiat(parseFloat(e.target.value))}
                        />
                      </div>
                      <Button
                        onClick={() => {
                          if (sessionName.trim()) {
                            startSimulation.mutate({
                              sessionName,
                              initialFiat,
                            });
                          }
                        }}
                        disabled={startSimulation.isPending || !sessionName.trim()}
                      >
                        {startSimulation.isPending ? (
                          <>
                            <Loader2 className="animate-spin mr-2" />
                            Starting...
                          </>
                        ) : (
                          "Start Simulation"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metrics Overview */}
        {selectedSession && sessionMetrics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total ROI</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(parseFloat(sessionMetrics.metrics?.[0]?.roi || "0") * 100).toFixed(2)}%
                  </div>
                  <p className="text-xs text-gray-600">Return on Investment</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                  <Zap className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {sessionMetrics.metrics?.reduce((sum, m) => sum + m.tradesCount, 0) || 0}
                  </div>
                  <p className="text-xs text-gray-600">Transactions executed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
                  <Wallet className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${parseFloat(sessionMetrics.metrics?.[0]?.reinvestmentProfit || "0").toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-600">Reinvestment profit</p>
                </CardContent>
              </Card>
            </div>

            {/* Agent Performance Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance Comparison</CardTitle>
                <CardDescription>ROI and Win Rate by Agent</CardDescription>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : agentComparisonData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={agentComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="roi" fill="#3b82f6" name="ROI (%)" />
                      <Bar dataKey="winRate" fill="#10b981" name="Win Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-600">No agent data available</p>
                )}
              </CardContent>
            </Card>

            {/* Portfolio Evolution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Evolution</CardTitle>
                <CardDescription>Net Worth Over Time</CardDescription>
              </CardHeader>
              <CardContent>
                {portfolioData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={portfolioData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {Object.keys(portfolioData[0] || {})
                        .filter(key => key !== 'timestamp')
                        .map((agent, idx) => (
                          <Line
                            key={agent}
                            type="monotone"
                            dataKey={agent}
                            stroke={COLORS[idx % COLORS.length]}
                            dot={false}
                          />
                        ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-600 py-8">No portfolio data available</p>
                )}
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest trading activity</CardDescription>
              </CardHeader>
              <CardContent>
                {sessionMetrics.transactions && sessionMetrics.transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Agent</th>
                          <th className="text-left py-2">Type</th>
                          <th className="text-right py-2">Amount</th>
                          <th className="text-right py-2">Price</th>
                          <th className="text-right py-2">Fee</th>
                          <th className="text-left py-2">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessionMetrics.transactions.slice(0, 10).map(tx => (
                          <tr key={tx.id} className="border-b hover:bg-gray-50">
                            <td className="py-2">{tx.agentName}</td>
                            <td className="py-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                tx.transactionType.includes('buy') ? 'bg-green-100 text-green-800' :
                                tx.transactionType.includes('sell') ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {tx.transactionType}
                              </span>
                            </td>
                            <td className="text-right py-2">{parseFloat(tx.amount.toString()).toFixed(6)}</td>
                            <td className="text-right py-2">${parseFloat(tx.price.toString()).toFixed(2)}</td>
                            <td className="text-right py-2">${parseFloat(tx.fee.toString()).toFixed(4)}</td>
                            <td className="py-2 text-gray-600">{new Date(tx.timestamp).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-600 py-8">No transactions yet</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
