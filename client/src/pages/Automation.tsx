import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Play, Pause, Trash2, Plus, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Automation() {
  const { user } = useAuth();
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [walletAction, setWalletAction] = useState<"deposit" | "withdrawal">("deposit");
  const [scheduleName, setScheduleName] = useState("");
  const [cronExpression, setCronExpression] = useState("0 0 * * *");
  const [initialCapital, setInitialCapital] = useState(100);
  const [walletAmount, setWalletAmount] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<number[]>([]);

  const { data: agents, isLoading: agentsLoading } = trpc.automation.getAgentConfigs.useQuery();
  const { data: schedules, isLoading: schedulesLoading } = trpc.automation.getAutomationSchedules.useQuery();
  const { data: walletBalance } = trpc.wallet.getBalance.useQuery();
  const { data: walletTransactions } = trpc.wallet.getTransactions.useQuery({ limit: 10 });
  
  const utils = trpc.useUtils();

  const createSchedule = trpc.automation.createAutomationSchedule.useMutation({
    onSuccess: () => {
      setIsScheduleDialogOpen(false);
      setScheduleName("");
      setCronExpression("0 0 * * *");
      setInitialCapital(100);
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

  const portfolioData = [
    { name: "Stocks", value: 4000 },
    { name: "Crypto", value: 3000 },
    { name: "Cash", value: 2000 },
  ];

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
              Configure and manage autonomous trading agents with AI/RL strategies
            </p>
          </div>
        </div>

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
              <Dialog open={isWalletDialogOpen} onOpenChange={setIsWalletDialogOpen}>
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
                    <DialogDescription>
                      Add funds to your trading wallet
                    </DialogDescription>
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
                    <DialogDescription>
                      Withdraw funds from your trading wallet
                    </DialogDescription>
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

        {/* Agent Control Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Automation Schedules</CardTitle>
              <CardDescription>Create and manage autonomous trading schedules</CardDescription>
            </div>
            <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Automation Schedule</DialogTitle>
                  <DialogDescription>
                    Set up an autonomous trading schedule with your selected agents
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="scheduleName">Schedule Name</Label>
                    <Input
                      id="scheduleName"
                      placeholder="e.g., Daily BTC Trading"
                      value={scheduleName}
                      onChange={(e) => setScheduleName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cronExpression">Cron Expression</Label>
                    <Input
                      id="cronExpression"
                      placeholder="0 0 * * * (daily at midnight)"
                      value={cronExpression}
                      onChange={(e) => setCronExpression(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: minute hour day month weekday
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="initialCapital">Initial Capital (USDT)</Label>
                    <Input
                      id="initialCapital"
                      type="number"
                      min="1"
                      max="100000"
                      value={initialCapital}
                      onChange={(e) => setInitialCapital(parseFloat(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label>Select Agents</Label>
                    <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                      {agentsLoading ? (
                        <p className="text-sm text-gray-500">Loading agents...</p>
                      ) : agents && agents.length > 0 ? (
                        agents.map((agent: any) => (
                          <label
                            key={agent.id}
                            className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedAgents.includes(agent.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAgents([...selectedAgents, agent.id]);
                                } else {
                                  setSelectedAgents(
                                    selectedAgents.filter((id) => id !== agent.id)
                                  );
                                }
                              }}
                              className="rounded"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{agent.agentName}</p>
                              <p className="text-xs text-gray-500">{agent.agentType}</p>
                            </div>
                          </label>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">
                          No agents configured. Create one first.
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateSchedule}
                    disabled={
                      createSchedule.isPending ||
                      !scheduleName.trim() ||
                      selectedAgents.length === 0
                    }
                    className="w-full"
                  >
                    {createSchedule.isPending ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        Creating...
                      </>
                    ) : (
                      "Create Schedule"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {schedulesLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" />
                <span>Loading schedules...</span>
              </div>
            ) : schedules && schedules.length > 0 ? (
              <div className="space-y-4">
                {schedules.map((schedule: any) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{schedule.scheduleName}</h3>
                      <p className="text-sm text-gray-600">
                        Cron: {schedule.cronExpression}
                      </p>
                      <p className="text-sm text-gray-600">
                        Capital: ${schedule.initialCapital}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">
                          {schedule.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toggleSchedule.mutate({
                            scheduleId: schedule.id,
                            isActive: !schedule.isActive,
                          })
                        }
                      >
                        {schedule.isActive ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteSchedule.mutate({ scheduleId: schedule.id })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No schedules configured yet</p>
                <Button onClick={() => setIsScheduleDialogOpen(true)}>
                  Create Your First Schedule
                </Button>
              </div>
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
                    label={({ name, value }) => `${name}: $${value}`}
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {schedules?.filter((s: any) => s.isActive).length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {agents?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(roiData.reduce((sum, a) => sum + a.roi, 0) / roiData.length).toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
