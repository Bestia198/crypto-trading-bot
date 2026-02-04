import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Play, Square, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function TradingControlPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"start" | "stop" | null>(null);

  // Queries
  const statusQuery = trpc.tradingControl.getStatus.useQuery();
  const statsQuery = trpc.tradingControl.getStats.useQuery();

  // Mutations
  const startTradingMutation = trpc.tradingControl.startTrading.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        statusQuery.refetch();
        statsQuery.refetch();
      } else {
        toast.error(data.error || "Failed to start trading");
      }
      setIsLoading(false);
      setShowConfirmDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || "Error starting trading");
      setIsLoading(false);
      setShowConfirmDialog(false);
    },
  });

  const stopTradingMutation = trpc.tradingControl.stopTrading.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        statusQuery.refetch();
        statsQuery.refetch();
      } else {
        toast.error(data.error || "Failed to stop trading");
      }
      setIsLoading(false);
      setShowConfirmDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || "Error stopping trading");
      setIsLoading(false);
      setShowConfirmDialog(false);
    },
  });

  const handleStartTrading = () => {
    setConfirmAction("start");
    setShowConfirmDialog(true);
  };

  const handleStopTrading = () => {
    setConfirmAction("stop");
    setShowConfirmDialog(true);
  };

  const confirmAction_ = () => {
    setIsLoading(true);
    if (confirmAction === "start") {
      startTradingMutation.mutate({});
    } else if (confirmAction === "stop") {
      stopTradingMutation.mutate({});
    }
  };

  const cancelAction = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const status = statusQuery.data;
  const stats = statsQuery.data;
  const isTrading = status?.isTrading ?? false;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isTrading ? "bg-green-500 animate-pulse" : "bg-gray-400"
            }`}
          />
          Trading Control
        </CardTitle>
        <CardDescription>
          {isTrading ? "Trading is active" : "Trading is inactive"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Info */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Active Agents</p>
            <p className="text-2xl font-bold">{status?.activeAgents ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Agents</p>
            <p className="text-2xl font-bold">{status?.totalAgents ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Trades</p>
            <p className="text-2xl font-bold">{stats?.totalTrades ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Win Rate</p>
            <p className="text-2xl font-bold">{stats?.winRate ?? 0}%</p>
          </div>
        </div>

        {/* Profit Display */}
        <div className="p-3 bg-slate-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Profit</p>
          <p
            className={`text-3xl font-bold ${
              (stats?.totalProfit ?? 0) >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ${stats?.totalProfit?.toFixed(2) ?? "0.00"}
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleStartTrading}
            disabled={isTrading || isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Trading
          </Button>

          <Button
            onClick={handleStopTrading}
            disabled={!isTrading || isLoading}
            variant="destructive"
            className="flex-1"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop Trading
          </Button>

          <Button
            onClick={() => {
              statusQuery.refetch();
              statsQuery.refetch();
            }}
            variant="outline"
            size="icon"
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Last Update */}
        <p className="text-xs text-gray-500 text-center">
          Last updated: {status?.lastUpdate?.toLocaleTimeString()}
        </p>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  Confirm Action
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  {confirmAction === "start"
                    ? "Are you sure you want to start trading? All agents will be activated."
                    : "Are you sure you want to stop trading? All agents will be deactivated."}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={confirmAction_}
                    disabled={isLoading}
                    className={
                      confirmAction === "start"
                        ? "flex-1 bg-green-600 hover:bg-green-700"
                        : "flex-1 bg-red-600 hover:bg-red-700"
                    }
                  >
                    {isLoading ? "Processing..." : "Confirm"}
                  </Button>
                  <Button
                    onClick={cancelAction}
                    disabled={isLoading}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
