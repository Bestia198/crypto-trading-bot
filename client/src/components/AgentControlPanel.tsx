import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Power, Zap, TrendingUp, Target } from "lucide-react";

interface Agent {
  id: number;
  agentName: string;
  agentType: string;
  isEnabled: boolean;
  learningRate?: string | null;
  stopLossPct?: string | null;
  takeProfitPct?: string | null;
}

export function AgentControlPanel() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [allEnabled, setAllEnabled] = useState(false);

  const getAgentsQuery = trpc.automation.getAgentConfigs.useQuery();
  const startMutation = trpc.agentExecution.startExecution.useMutation();
  const stopMutation = trpc.agentExecution.stopExecution.useMutation();

  useEffect(() => {
    if (getAgentsQuery.data) {
      setAgents(getAgentsQuery.data as Agent[]);
      const allRunning = getAgentsQuery.data.every((a: Agent) => a.isEnabled);
      setAllEnabled(allRunning);
      setLoading(false);
    }
  }, [getAgentsQuery.data]);

  const handleToggleAgent = async (agent: Agent) => {
    try {
      if (agent.isEnabled) {
        await stopMutation.mutateAsync({ agentId: agent.id });
      } else {
        await startMutation.mutateAsync({ agentId: agent.id });
      }
      // Refetch agents
      getAgentsQuery.refetch();
    } catch (error) {
      console.error("Error toggling agent:", error);
    }
  };

  const handleToggleAll = async () => {
    try {
      for (const agent of agents) {
        if (allEnabled) {
          // Disable all
          if (agent.isEnabled) {
            await stopMutation.mutateAsync({ agentId: agent.id });
          }
        } else {
          // Enable all
          if (!agent.isEnabled) {
            await startMutation.mutateAsync({ agentId: agent.id });
          }
        }
      }
      setAllEnabled(!allEnabled);
      getAgentsQuery.refetch();
    } catch (error) {
      console.error("Error toggling all agents:", error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Control Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Agent Control Panel
            </CardTitle>
            <CardDescription>Manage all your trading agents</CardDescription>
          </div>
          <Button
            onClick={handleToggleAll}
            className={`${
              allEnabled
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
            size="sm"
          >
            <Power className="h-4 w-4 mr-2" />
            {allEnabled ? "Disable All" : "Enable All"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`flex items-center justify-between p-4 rounded-lg border-2 transition ${
              agent.isEnabled
                ? "border-green-300 bg-green-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    agent.isEnabled ? "bg-green-500" : "bg-gray-400"
                  }`}
                ></div>
                <h3 className="font-semibold text-gray-900">{agent.agentName}</h3>
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                  {agent.agentType}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1 ml-5">
                {agent.agentType === "RL" && "Reinforcement Learning Agent"}
                {agent.agentType === "Momentum" && "Momentum-based Trading"}
                {agent.agentType === "MeanReversion" && "Mean Reversion Strategy"}
                {agent.agentType === "DeepSeek" && "AI-powered with DeepSeek LLM"}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right text-xs">
                <div className="text-gray-600">
                  Stop Loss: {agent.stopLossPct || "5"}%
                </div>
                <div className="text-gray-600">
                  Take Profit: {agent.takeProfitPct || "10"}%
                </div>
              </div>

              <Button
                onClick={() => handleToggleAgent(agent)}
                disabled={startMutation.isPending || stopMutation.isPending}
                className={`${
                  agent.isEnabled
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
                size="sm"
              >
                <Power className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">
                  {agent.isEnabled ? "Stop" : "Start"}
                </span>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>

      {/* Status Summary */}
      <div className="px-6 py-4 border-t bg-white rounded-b-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {agents.filter((a) => a.isEnabled).length}
            </div>
            <div className="text-xs text-gray-600">Active Agents</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{agents.length}</div>
            <div className="text-xs text-gray-600">Total Agents</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {agents.filter((a) => !a.isEnabled).length}
            </div>
            <div className="text-xs text-gray-600">Inactive</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
