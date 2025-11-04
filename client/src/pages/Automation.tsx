import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Play, Pause, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function Automation() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [cronExpression, setCronExpression] = useState("0 0 * * *");
  const [initialCapital, setInitialCapital] = useState(100);
  const [selectedAgents, setSelectedAgents] = useState<number[]>([]);

  const { data: agents, isLoading: agentsLoading } = trpc.automation.getAgentConfigs.useQuery();
  const { data: schedules, isLoading: schedulesLoading } = trpc.automation.getAutomationSchedules.useQuery();
  const utils = trpc.useUtils();

  const createSchedule = trpc.automation.createAutomationSchedule.useMutation({
    onSuccess: () => {
      setIsDialogOpen(false);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Automation & Autonomous Agents</h1>
            <p className="text-gray-600 mt-1">
              Configure and manage autonomous trading agents with AI/RL strategies
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
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
        </div>

        {/* Active Schedules */}
        <Card>
          <CardHeader>
            <CardTitle>Active Schedules</CardTitle>
            <CardDescription>
              Manage your autonomous trading schedules
            </CardDescription>
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
                <Button onClick={() => setIsDialogOpen(true)}>
                  Create Your First Schedule
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div>
    </DashboardLayout>
  );
}
