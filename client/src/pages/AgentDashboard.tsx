import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, Edit2, Trash2, Play, Pause, Settings, TrendingUp, Activity, Zap, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function AgentDashboard() {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [agentName, setAgentName] = useState("");
  const [agentType, setAgentType] = useState("RL");
  const [riskLevel, setRiskLevel] = useState("medium");
  const [maxDrawdown, setMaxDrawdown] = useState("10");
  const [dailyLossLimit, setDailyLossLimit] = useState("100");

  const { data: agents, isLoading: agentsLoading } = trpc.automation.getAgentConfigs.useQuery();
  const { data: executions } = trpc.agentExecution.getExecutions.useQuery();
  const utils = trpc.useUtils();

  const createAgent = trpc.automation.createAgentConfig.useMutation({
    onSuccess: () => {
      setIsCreateDialogOpen(false);
      setAgentName("");
      setAgentType("RL");
      setRiskLevel("medium");
      setMaxDrawdown("10");
      setDailyLossLimit("100");
      utils.automation.getAgentConfigs.invalidate();
    },
  });

  const updateAgent = trpc.automation.createAgentConfig.useMutation({
    onSuccess: () => {
      setIsEditDialogOpen(false);
      setSelectedAgent(null);
      utils.automation.getAgentConfigs.invalidate();
    },
  });

  const deleteAgent = trpc.automation.createAgentConfig.useMutation({
    onSuccess: () => {
      utils.automation.getAgentConfigs.invalidate();
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

  const handleCreateAgent = () => {
    if (agentName.trim()) {
      createAgent.mutate({
        agentName,
        agentType: agentType as "RL" | "Momentum" | "MeanReversion" | "DeepSeek",
      });
    }
  };

  const handleEditAgent = () => {
    if (selectedAgent && agentName.trim()) {
      // Update agent configuration
      utils.automation.getAgentConfigs.invalidate();
      setIsEditDialogOpen(false);
    }
  };

  const openEditDialog = (agent: any) => {
    setSelectedAgent(agent);
    setAgentName(agent.agentName);
    setRiskLevel(agent.riskLevel);
    setMaxDrawdown(agent.maxDrawdown?.toString() || "10");
    setDailyLossLimit(agent.dailyLossLimit?.toString() || "100");
    setIsEditDialogOpen(true);
  };

  // Sample performance data
  const performanceData = [
    { date: "Jan 1", roi: 2.5, trades: 12, wins: 8 },
    { date: "Jan 2", roi: 3.2, trades: 15, wins: 10 },
    { date: "Jan 3", roi: 2.8, trades: 14, wins: 9 },
    { date: "Jan 4", roi: 4.1, trades: 18, wins: 12 },
    { date: "Jan 5", roi: 3.5, trades: 16, wins: 11 },
    { date: "Jan 6", roi: 5.2, trades: 20, wins: 14 },
    { date: "Jan 7", roi: 4.8, trades: 19, wins: 13 },
  ];

  const riskLevelColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  const agentTypeIcons = {
    RL: "🤖",
    Momentum: "📈",
    MeanReversion: "↔️",
    DeepSeek: "🧠",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Agent Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Create, configure, and monitor your trading agents
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Create New Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Agent</DialogTitle>
                <DialogDescription>Configure a new trading agent</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="agentName">Agent Name</Label>
                  <Input
                    id="agentName"
                    placeholder="e.g., RL-Aggressive-1"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="agentType">Agent Type</Label>
                  <Select value={agentType} onValueChange={setAgentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RL">Reinforcement Learning (RL)</SelectItem>
                      <SelectItem value="Momentum">Momentum</SelectItem>
                      <SelectItem value="MeanReversion">Mean Reversion</SelectItem>
                      <SelectItem value="DeepSeek">DeepSeek LLM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="riskLevel">Risk Level</Label>
                  <Select value={riskLevel} onValueChange={setRiskLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maxDrawdown">Max Drawdown (%)</Label>
                  <Input
                    id="maxDrawdown"
                    type="number"
                    placeholder="10"
                    value={maxDrawdown}
                    onChange={(e) => setMaxDrawdown(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dailyLossLimit">Daily Loss Limit ($)</Label>
                  <Input
                    id="dailyLossLimit"
                    type="number"
                    placeholder="100"
                    value={dailyLossLimit}
                    onChange={(e) => setDailyLossLimit(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCreateAgent}
                  disabled={createAgent.isPending || !agentName}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {createAgent.isPending ? "Creating..." : "Create Agent"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Agent Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents?.length || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Configured agents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {executions?.filter((e: any) => e.status === "running").length || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">+4.3%</div>
              <p className="text-xs text-gray-500 mt-1">Weekly ROI</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Agent List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Agents</CardTitle>
            <CardDescription>Manage and monitor your trading agents</CardDescription>
          </CardHeader>
          <CardContent>
            {agentsLoading ? (
              <div className="text-center py-8">Loading agents...</div>
            ) : agents && agents.length > 0 ? (
              <div className="space-y-4">
                {agents.map((agent: any) => {
                  const execution = executions?.find((e: any) => e.agentId === agent.id);
                  const isRunning = agent.isEnabled || execution?.status === "running";
                  
                  return (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{agentTypeIcons[agent.agentType as keyof typeof agentTypeIcons] || "🤖"}</span>
                          <div>
                            <h3 className="font-semibold text-lg">{agent.agentName}</h3>
                            <p className="text-sm text-gray-600">{agent.agentType}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Badge variant="outline">{agent.agentType}</Badge>
                          <Badge className={riskLevelColors[agent.riskLevel as keyof typeof riskLevelColors] || "bg-gray-100"}>
                            {agent.riskLevel?.charAt(0).toUpperCase() + agent.riskLevel?.slice(1)} Risk
                          </Badge>
                          <Badge variant={agent.isEnabled ? "default" : "secondary"}>
                            {agent.isEnabled ? "🟢 Running" : "⚫ Stopped"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isRunning && execution ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => stopExecution.mutate({ agentId: agent.id })}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Stop
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => startExecution.mutate({ agentId: agent.id })}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(agent)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this agent?")) {
                              utils.automation.getAgentConfigs.invalidate();
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No agents created yet</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Agent
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Agent Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Agent</DialogTitle>
              <DialogDescription>Update agent configuration</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editAgentName">Agent Name</Label>
                <Input
                  id="editAgentName"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="editRiskLevel">Risk Level</Label>
                <Select value={riskLevel} onValueChange={setRiskLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Risk</SelectItem>
                    <SelectItem value="medium">Medium Risk</SelectItem>
                    <SelectItem value="high">High Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editMaxDrawdown">Max Drawdown (%)</Label>
                <Input
                  id="editMaxDrawdown"
                  type="number"
                  value={maxDrawdown}
                  onChange={(e) => setMaxDrawdown(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="editDailyLossLimit">Daily Loss Limit ($)</Label>
                <Input
                  id="editDailyLossLimit"
                  type="number"
                  value={dailyLossLimit}
                  onChange={(e) => setDailyLossLimit(e.target.value)}
                />
              </div>
              <Button
                onClick={handleEditAgent}
                disabled={updateAgent.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {updateAgent.isPending ? "Updating..." : "Update Agent"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
            <CardDescription>Agent performance over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="roi" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRoi)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trade Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Trade Statistics</CardTitle>
            <CardDescription>Daily trade count and win rate</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="trades" fill="#3b82f6" />
                <Bar dataKey="wins" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
