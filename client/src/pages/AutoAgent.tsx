import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Zap, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Loader2, Brain, Lightbulb } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AutoAgent() {
  const { user } = useAuth();
  const [currentPrice, setCurrentPrice] = useState<string>("45000");
  const [volatility, setVolatility] = useState<string>("2.5");
  const [riskPreference, setRiskPreference] = useState("medium");
  const [priceHistory, setPriceHistory] = useState<number[]>([
    44500, 44800, 45000, 45200, 45100, 45400, 45600, 45500, 45700, 45900, 46000, 45800,
  ]);
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);

  const selectStrategy = trpc.agentSelection.selectAutonomousStrategy.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSelectedStrategy(data.strategy);
      }
    },
  });

  const analyzeMarket = trpc.agentSelection.analyzeMarketCondition.useQuery(
    {
      prices: priceHistory,
      volatility: parseFloat(volatility),
    },
    { enabled: false }
  );

  const handleSelectStrategy = () => {
    selectStrategy.mutate({
      currentPrice: parseFloat(currentPrice),
      priceHistory,
      volatility: parseFloat(volatility),
      riskPreference: riskPreference as any,
    });
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case "trending_up":
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "trending_down":
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case "volatile":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case "sideways":
        return <Lightbulb className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  };

  // Sample price data for chart
  const chartData = priceHistory.map((price, index) => ({
    time: `T${index}`,
    price,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Autonomous Agent Selector
          </h1>
          <p className="text-gray-600 mt-1">
            AI-powered automatic agent and strategy selection based on market conditions
          </p>
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Market Analysis Input</CardTitle>
            <CardDescription>Provide current market data for analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currentPrice">Current Price ($)</Label>
                <Input
                  id="currentPrice"
                  type="number"
                  placeholder="45000"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="volatility">Volatility (%)</Label>
                <Input
                  id="volatility"
                  type="number"
                  placeholder="2.5"
                  value={volatility}
                  onChange={(e) => setVolatility(e.target.value)}
                  step="0.1"
                />
              </div>

              <div>
                <Label htmlFor="riskPreference">Risk Preference</Label>
                <Select value={riskPreference} onValueChange={setRiskPreference}>
                  <SelectTrigger id="riskPreference">
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
              <div className="grid grid-cols-6 gap-2 mt-2">
                {priceHistory.map((price, index) => (
                  <Input
                    key={index}
                    type="number"
                    value={price}
                    onChange={(e) => {
                      const newHistory = [...priceHistory];
                      newHistory[index] = parseFloat(e.target.value) || 0;
                      setPriceHistory(newHistory);
                    }}
                    placeholder={`P${index + 1}`}
                    className="text-sm"
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleSelectStrategy}
              disabled={selectStrategy.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              {selectStrategy.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Select Autonomous Strategy
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Price Chart */}
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
                <Line type="monotone" dataKey="price" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Strategy Recommendation */}
        {selectedStrategy && (
          <div className="space-y-4">
            {/* Primary Strategy */}
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                    <div>
                      <CardTitle>Recommended Strategy</CardTitle>
                      <CardDescription>Primary agent selection</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-purple-600">
                    {(selectedStrategy.primary.confidence * 100).toFixed(1)}% Confidence
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Agent</p>
                    <p className="text-lg font-semibold">{selectedStrategy.primary.agentName}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="text-lg font-semibold">{selectedStrategy.primary.agentType}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Market Condition</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getConditionIcon(selectedStrategy.marketCondition)}
                      <p className="font-semibold capitalize">
                        {selectedStrategy.marketCondition.replace("_", " ")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Strategy</p>
                    <p className="text-lg font-semibold">{selectedStrategy.primary.strategy}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Reason</p>
                  <p className="text-gray-700">{selectedStrategy.primary.reason}</p>
                </div>

                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Activate This Strategy
                </Button>
              </CardContent>
            </Card>

            {/* Ensemble Strategies */}
            <Card>
              <CardHeader>
                <CardTitle>Ensemble Backup Strategies</CardTitle>
                <CardDescription>Alternative agents for diversification</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedStrategy.ensemble.map((agent: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">{agent.agentName}</p>
                          <p className="text-sm text-gray-600">{agent.agentType}</p>
                        </div>
                        <Badge variant="outline">
                          {(agent.confidence * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{agent.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Strategy Details */}
            <Card>
              <CardHeader>
                <CardTitle>Strategy Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Market Condition</p>
                    <p className="text-lg font-semibold capitalize mt-1">
                      {selectedStrategy.marketCondition.replace("_", " ")}
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Overall Confidence</p>
                    <p className="text-lg font-semibold mt-1">
                      {(selectedStrategy.confidence * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Selected At</p>
                    <p className="text-sm font-semibold mt-1">
                      {new Date(selectedStrategy.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">Ensemble Size</p>
                    <p className="text-lg font-semibold mt-1">
                      {selectedStrategy.ensemble.length} agents
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Card */}
        {!selectedStrategy && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 space-y-2">
              <p>
                • The system analyzes current market conditions (trending up/down, volatile, sideways)
              </p>
              <p>
                • Based on market condition, it recommends the best performing agent
              </p>
              <p>
                • Ensemble strategies provide backup agents for risk diversification
              </p>
              <p>
                • All recommendations consider your risk preference and agent performance history
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
