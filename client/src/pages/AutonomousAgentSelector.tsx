import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Zap, Play, Pause, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import DashboardLayout from "@/components/DashboardLayout";

export default function AutonomousAgentSelector() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentPrice, setCurrentPrice] = useState("45000");
  const [volatility, setVolatility] = useState("2.5");
  const [riskPreference, setRiskPreference] = useState<"low" | "medium" | "high">("medium");
  const [priceHistory, setPriceHistory] = useState([44500, 44800, 45000, 45200, 45100, 45400]);

  const selectStrategy = trpc.autonomousAgent.selectStrategy.useMutation();
  const generateSignal = trpc.autonomousAgent.generateSignal.useMutation();

  const handleSelectStrategy = async () => {
    try {
      await selectStrategy.mutateAsync({
        currentPrice: parseFloat(currentPrice),
        priceHistory,
        volatility: parseFloat(volatility),
        riskPreference,
      });
    } catch (error) {
      console.error("Error selecting strategy:", error);
    }
  };

  const handleGenerateSignal = async () => {
    try {
      await generateSignal.mutateAsync({
        currentPrice: parseFloat(currentPrice),
        priceHistory,
        volatility: parseFloat(volatility),
        riskPreference,
      });
    } catch (error) {
      console.error("Error generating signal:", error);
    }
  };

  const chartData = priceHistory.map((price, index) => ({
    time: `T${index}`,
    price,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="text-purple-600" />
              Autonomous Agent Selector
            </h1>
            <p className="text-gray-600">AI-powered automatic agent and strategy selection based on market conditions</p>
          </div>
          <Button
            size="lg"
            variant={isEnabled ? "destructive" : "default"}
            onClick={() => setIsEnabled(!isEnabled)}
            className="gap-2"
          >
            {isEnabled ? (
              <>
                <Pause className="h-4 w-4" />
                Turn Off
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Turn On
              </>
            )}
          </Button>
        </div>

        {/* Status */}
        <Card className={isEnabled ? "border-green-500 bg-green-50" : "border-gray-200"}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isEnabled ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-lg font-semibold text-green-600">Autonomous Agent Active</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-gray-400" />
                    <span className="text-lg font-semibold text-gray-600">Autonomous Agent Inactive</span>
                  </>
                )}
              </div>
              <Badge variant={isEnabled ? "default" : "secondary"}>
                {isEnabled ? "🟢 Running" : "⚫ Stopped"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Market Analysis Input */}
        <Card>
          <CardHeader>
            <CardTitle>Market Analysis Input</CardTitle>
            <CardDescription>Provide current market data for analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Current Price ($)</Label>
                <Input
                  type="number"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  placeholder="45000"
                />
              </div>
              <div>
                <Label>Volatility (%)</Label>
                <Input
                  type="number"
                  value={volatility}
                  onChange={(e) => setVolatility(e.target.value)}
                  placeholder="2.5"
                  step="0.1"
                />
              </div>
              <div>
                <Label>Risk Preference</Label>
                <Select value={riskPreference} onValueChange={(v) => setRiskPreference(v as any)}>
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
            </div>

            <div>
              <Label>Price History (last 12 periods)</Label>
              <div className="grid grid-cols-6 gap-2">
                {priceHistory.map((price, index) => (
                  <Input
                    key={index}
                    type="number"
                    value={price}
                    onChange={(e) => {
                      const newHistory = [...priceHistory];
                      newHistory[index] = parseFloat(e.target.value);
                      setPriceHistory(newHistory);
                    }}
                  />
                ))}
              </div>
            </div>

            <Button onClick={handleSelectStrategy} className="w-full" size="lg" disabled={!isEnabled}>
              <Zap className="h-4 w-4 mr-2" />
              Select Autonomous Strategy
            </Button>
          </CardContent>
        </Card>

        {/* Price History Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Price History</CardTitle>
            <CardDescription>Visual representation of price movement</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="price" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Strategy Recommendation */}
        {selectStrategy.data && (
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-purple-900">Recommended Strategy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-purple-700">Strategy</Label>
                  <p className="text-2xl font-bold text-purple-900">{selectStrategy.data.strategy}</p>
                </div>
                <div>
                  <Label className="text-purple-700">Confidence</Label>
                  <p className="text-2xl font-bold text-purple-900">{(selectStrategy.data.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>
              <div>
                <Label className="text-purple-700">Reasoning</Label>
                <p className="text-purple-800">{selectStrategy.data.reasoning}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {selectStrategy.data.parameters.learningRate && (
                  <div>
                    <Label className="text-sm text-purple-700">Learning Rate</Label>
                    <p className="font-semibold text-purple-900">{selectStrategy.data.parameters.learningRate}</p>
                  </div>
                )}
                {selectStrategy.data.parameters.stopLossPct && (
                  <div>
                    <Label className="text-sm text-purple-700">Stop Loss</Label>
                    <p className="font-semibold text-purple-900">{selectStrategy.data.parameters.stopLossPct}%</p>
                  </div>
                )}
                {selectStrategy.data.parameters.takeProfitPct && (
                  <div>
                    <Label className="text-sm text-purple-700">Take Profit</Label>
                    <p className="font-semibold text-purple-900">{selectStrategy.data.parameters.takeProfitPct}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trading Signal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Generate Trading Signal
            </CardTitle>
            <CardDescription>Get AI-powered buy/sell/hold recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGenerateSignal} className="w-full" size="lg" disabled={!isEnabled}>
              Generate Signal
            </Button>

            {generateSignal.data && (
              <div className="mt-4 p-4 rounded-lg bg-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-700">Action</Label>
                    <p className="text-2xl font-bold capitalize text-gray-900">{generateSignal.data.action}</p>
                  </div>
                  <div>
                    <Label className="text-gray-700">Confidence</Label>
                    <p className="text-2xl font-bold text-gray-900">{(generateSignal.data.confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>
                <div className="mt-2">
                  <Label className="text-gray-700">Reasoning</Label>
                  <p className="text-gray-800">{generateSignal.data.reasoning}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 space-y-2">
            <p>• The system analyzes current market conditions (trending up/down, volatile, sideways)</p>
            <p>• Based on market condition, it recommends the best performing agent</p>
            <p>• Ensemble strategies provide backup agents for risk diversification</p>
            <p>• All recommendations consider your risk preference and agent performance history</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
