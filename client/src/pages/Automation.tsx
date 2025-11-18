import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Play, Pause, Trash2, Plus, DollarSign, TrendingUp, TrendingDown, Activity, Target, Zap } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Automation() {
  const { user } = useAuth();
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);
  const [walletAction, setWalletAction] = useState<"deposit" | "withdrawal">("deposit");
  const [scheduleName, setScheduleName] = useState("");
  const [cronExpression, setCronExpression] = useState("0 0 * * *");
  const [initialCapital, setInitialCapital] = useState(30);
  const [walletAmount, setWalletAmount] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<number[]>([]);

  const { data: agents, isLoading: agentsLoading } = trpc.automation.getAgentConfigs.useQuery();
  const { data: schedules, isLoading: schedulesLoading } = trpc.automation.getAutomationSchedules.useQuery();
  const { data: walletBalance } = trpc.wallet.getBalance.useQuery();
  const { data: walletTransactions } = trpc.wallet.getTransactions.useQuery({ limit: 10 });
  const { data: executions } = trpc.agentExecution.getExecutions.useQuery();
  const { data: tradingResults } = trpc.agentExecution.getTradingResults.useQuery();
  const { data: portfolio } = trpc.agentExecution.getPortfolio.useQuery();
  
  const utils = trpc.useUtils();

  const createSchedule = trpc.automation.createAutomationSchedule.useMutation({
    onSuccess: () => {
      setIsScheduleDialogOpen(false);
      setScheduleName("");
      setCronExpression("0 0 * * *");
      setInitialCapital(30);
      setSelectedAgents([]);
      utils.automation.getAutomationSchedules.invalidate();
    },
  });

  const toggleSchedule = trpc.automation.toggleSchedule.useMutation({
    onSuccess: () => {
      utils.automation.getAutomationSchedules.invalidate();
    },
  });

  const deleteSchedule = trpc.automation.deleteSchedule.useMutation({
    onSuccess: () => {
      utils.automation.getAutomationSchedules.invalidate();
    },
  });

  const startExecution = trpc.agentExecution.startExecution.useMutation({
    onSuccess: () => {
      utils.agentExecution.getExecutions.invalidate();
    },
  });

  const stopExecution = trpc.agentExecution.stopExecution.useMutation({
    onSuccess: () => {
      utils.agentExecution.getExecutions.invalidate();
    },
  });

  const depositMutation = trpc.wallet.deposit.useMutation({
    onSuccess: () => {
      setIsWalletDialogOpen(false);
      setWalletAmount("");
      utils.wallet.getBalance.invalidate();
      utils.wallet.getTransactions.invalidate();
    },
  });

  const withdrawalMutation = trpc.wallet.withdraw.useMutation({
    onSuccess: () => {
      setIsWalletDialogOpen(false);
      setWalletAmount("");
      utils.wallet.getBalance.invalidate();
      utils.wallet.getTransactions.invalidate();
    },
  });

  const handleCreateSchedule = () => {
    if (scheduleName.trim() && selectedAgents.length > 0) {
      createSchedule.mutate({
        scheduleName,
        cronExpression,
        initialCapital,
        agentIds: selectedAgents,
      });
    }
  };

  const handleWalletTransaction = () => {
    const amount = parseFloat(walletAmount);
    if (amount > 0) {
      if (walletAction === "deposit") {
        depositMutation.mutate({ amount });
      } else {
        withdrawalMutation.mutate({ amount });
      }
    }
  };

  // Calculate metrics
  const totalTrades = tradingResults?.length || 0;
  const winningTrades = tradingResults?.filter((t: any) => parseFloat(t.profit?.toString() || "0") > 0).length || 0;
  const losingTrades = totalTrades - winningTrades;
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(2) : "0";
  const totalProfit = tradingResults?.reduce((sum: number, t: any) => sum + parseFloat(t.profit?.toString() || "0"), 0) || 0;
  const avgConfidence = executions && executions.length > 0 
    ? (executions.reduce((sum: number, e: any) => sum + parseFloat(e.confidence?.toString() || "0"), 0) / executions.length).toFixed(2)
    : "0";

  // Sample data for charts
  const roiData = [
    { agent: "RL-1", roi: 12.5 },
    { agent: "RL-2", roi: 8.3 },
    { agent: "Momentum", roi: 15.2 },
    { agent: "MeanReversion", roi: 6.8 },
    { agent: "DeepSeek", roi: 10.1 },
  ];

  const performanceData = [
    { name: "RL-1", trades: 45, wins: 28, losses: 17 },
    { name: "RL-2", trades: 38, wins: 22, losses: 16 },
    { name: "Momentum", trades: 52, wins: 35, losses: 17 },
    { name: "MeanReversion", trades: 31, wins: 18, losses: 13 },
    { name: "DeepSeek", trades: 42, wins: 26, losses: 16 },
  ];

  const portfolioData = portfolio?.map((asset: any) => ({
    name: asset.symbol,
    value: parseFloat(asset.totalValue?.toString() || "0"),
  })) || [];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const currentBalance = walletBalance?.[0];
  const totalBalance = currentBalance && currentBalance.totalBalance ? parseFloat(currentBalance.totalBalance.toString()) : 0;
  const availableBalance = currentBalance && currentBalance.availableBalance ? parseFloat(currentBalance.availableBalance.toString()) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Automation & Autonomous Agents</h1>
            <p className="text-gray-600 mt-1">
              Control autonomous trading agents with real-time performance metrics
            </p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{winRate}%</div>
              <p className="text-xs text-gray-500 mt-1">{winningTrades}/{totalTrades} trades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{avgConfidence}%</div>
              <p className="text-xs text-gray-500 mt-1">Avg algorithm confidence</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${totalProfit.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">From all trades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Active Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {executions?.filter((e: any) => e.status === "running").length || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Currently running</p>
            </CardContent>
          </Card>
        </div>

        {/* Agent Control Section */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Control Panel</CardTitle>
            <CardDescription>Start and manage autonomous trading agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agents && agents.length > 0 ? (
                agents.map((agent: any) => {
                  const execution = executions?.find((e: any) => e.agentId === agent.id);
                  const isRunning = execution?.status === "running";
                  
                  return (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{agent.agentName}</h3>
                        <p className="text-sm text-gray-600">{agent.agentType}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={isRunning ? "default" : "outline"}>
                            {isRunning ? "Running" : "Stopped"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isRunning ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => stopExecution.mutate({ executionId: execution.id })}
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Stop
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => startExecution.mutate({ agentId: agent.id })}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-4">No agents configured</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Wallet Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Wallet Management
            </CardTitle>
            <CardDescription>Manage your trading capital</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold text-blue-600">${totalBalance.toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-green-600">${availableBalance.toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600">Locked Balance</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${(totalBalance - availableBalance).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Dialog open={isWalletDialogOpen && walletAction === "deposit"} onOpenChange={setIsWalletDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => setWalletAction("deposit")}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Deposit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Deposit Funds</DialogTitle>
                    <DialogDescription>Add funds to your trading wallet</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="depositAmount">Amount (USDT)</Label>
                      <Input
                        id="depositAmount"
                        type="number"
                        placeholder="Enter amount"
                        value={walletAmount}
                        onChange={(e) => setWalletAmount(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleWalletTransaction}
                      disabled={depositMutation.isPending || !walletAmount}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {depositMutation.isPending ? (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          Processing...
                        </>
                      ) : (
                        "Confirm Deposit"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isWalletDialogOpen && walletAction === "withdrawal"} onOpenChange={setIsWalletDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => setWalletAction("withdrawal")}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    <TrendingDown className="mr-2 h-4 w-4" />
                    Withdraw
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>Withdraw funds from your trading wallet</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="withdrawAmount">Amount (USDT)</Label>
                      <Input
                        id="withdrawAmount"
                        type="number"
                        placeholder="Enter amount"
                        value={walletAmount}
                        onChange={(e) => setWalletAmount(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleWalletTransaction}
                      disabled={withdrawalMutation.isPending || !walletAmount}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      {withdrawalMutation.isPending ? (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          Processing...
                        </>
                      ) : (
                        "Confirm Withdrawal"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Trading Results */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Trading Results</CardTitle>
              <CardDescription>Recent trades executed by agents</CardDescription>
            </div>
            <Dialog open={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">View All Results</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Trading Results History</DialogTitle>
                </DialogHeader>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">Symbol</th>
                        <th className="p-2 text-left">Type</th>
                        <th className="p-2 text-right">Entry</th>
                        <th className="p-2 text-right">Exit</th>
                        <th className="p-2 text-right">Profit</th>
                        <th className="p-2 text-right">Confidence</th>
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradingResults && tradingResults.length > 0 ? (
                        tradingResults.map((result: any) => (
                          <tr key={result.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">{result.symbol}</td>
                            <td className="p-2 capitalize">{result.tradeType}</td>
                            <td className="p-2 text-right">${parseFloat(result.entryPrice?.toString() || "0").toFixed(2)}</td>
                            <td className="p-2 text-right">
                              {result.exitPrice ? `$${parseFloat(result.exitPrice.toString()).toFixed(2)}` : "-"}
                            </td>
                            <td className={`p-2 text-right font-semibold ${parseFloat(result.profit?.toString() || "0") >= 0 ? "text-green-600" : "text-red-600"}`}>
                              ${parseFloat(result.profit?.toString() || "0").toFixed(2)}
                            </td>
                            <td className="p-2 text-right">{parseFloat(result.confidence?.toString() || "0").toFixed(2)}%</td>
                            <td className="p-2">
                              <Badge variant={result.status === "closed" ? "default" : "outline"}>
                                {result.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-gray-500">
                            No trading results yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {tradingResults && tradingResults.length > 0 ? (
              <div className="space-y-3">
                {tradingResults.slice(0, 5).map((result: any) => (
                  <div key={result.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <p className="font-medium">{result.symbol}</p>
                      <p className="text-xs text-gray-500">
                        Entry: ${parseFloat(result.entryPrice?.toString() || "0").toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${parseFloat(result.profit?.toString() || "0") >= 0 ? "text-green-600" : "text-red-600"}`}>
                        ${parseFloat(result.profit?.toString() || "0").toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Confidence: {parseFloat(result.confidence?.toString() || "0").toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No trading results yet</p>
            )}
          </CardContent>
        </Card>

        {/* Portfolio View */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Assets</CardTitle>
            <CardDescription>Your current asset allocation</CardDescription>
          </CardHeader>
          <CardContent>
            {portfolio && portfolio.length > 0 ? (
              <div className="space-y-4">
                {portfolio.map((asset: any) => {
                  const totalValue = parseFloat(asset.totalValue?.toString() || "0");
                  const unrealizedProfit = parseFloat(asset.unrealizedProfit?.toString() || "0");
                  
                  return (
                    <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{asset.symbol}</h3>
                        <p className="text-sm text-gray-600">
                          {parseFloat(asset.quantity?.toString() || "0").toFixed(8)} units @ ${parseFloat(asset.currentPrice?.toString() || "0").toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${totalValue.toFixed(2)}</p>
                        <p className={`text-sm ${unrealizedProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {unrealizedProfit >= 0 ? "+" : ""}{unrealizedProfit.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No assets in portfolio</p>
            )}
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ROI Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Agent ROI Performance</CardTitle>
              <CardDescription>Return on Investment by Agent</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={roiData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="roi" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Win Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Trading Performance</CardTitle>
              <CardDescription>Wins vs Losses by Agent</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="wins" fill="#10b981" />
                  <Bar dataKey="losses" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Portfolio Allocation */}
          {portfolioData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Allocation</CardTitle>
                <CardDescription>Asset distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={portfolioData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {portfolioData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest wallet activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {walletTransactions && walletTransactions.length > 0 ? (
                  walletTransactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium capitalize">{tx.transactionType}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className={`font-bold ${tx.transactionType === "deposit" ? "text-green-600" : "text-red-600"}`}>
                        {tx.transactionType === "deposit" ? "+" : "-"}${parseFloat(tx.amount.toString()).toFixed(2)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No transactions yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
