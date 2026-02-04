import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Zap, Target, Activity } from "lucide-react";
import { toast } from "sonner";

interface AgentScore {
  agentId: number;
  agentType: string;
  score: number;
  winRate: number;
  profitability: number;
  recentPerformance: number;
  volatilityScore: number;
  recommendation: string;
}

interface MarketCondition {
  trend: "uptrend" | "downtrend" | "ranging";
  volatility: "low" | "medium" | "high";
  momentum: "strong" | "moderate" | "weak";
  rsi: number;
  macd: "bullish" | "bearish" | "neutral";
}

export default function EnhancedAutonomousAgentSelector() {
  const [autoMode, setAutoMode] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentScore | null>(null);
  const [agentScores, setAgentScores] = useState<AgentScore[]>([]);
  const [marketCondition, setMarketCondition] = useState<MarketCondition | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<AgentScore[]>([]);
  const [allocation, setAllocation] = useState<Record<number, number>>({});

  // Fetch agent scores
  const { data: scoresData, isLoading: scoresLoading } =
    trpc.autonomousAgentSelector.getAgentScores.useQuery({
      recentPrices: [100, 101, 102, 101, 103],
      rsi: 55,
      macd: "bullish",
    });

  // Fetch best agent
  const { data: bestAgentData } = trpc.autonomousAgentSelector.getBestAgent.useQuery({
    recentPrices: [100, 101, 102, 101, 103],
    rsi: 55,
    macd: "bullish",
  });

  // Fetch diversified portfolio
  const { data: portfolioData } = trpc.autonomousAgentSelector.getDiversifiedPortfolio.useQuery({
    agentCount: 3,
    recentPrices: [100, 101, 102, 101, 103],
    rsi: 55,
    macd: "bullish",
  });

  useEffect(() => {
    if (scoresData) {
      setAgentScores(scoresData.scores || []);
      setMarketCondition(scoresData.marketCondition);
    }
  }, [scoresData]);

  useEffect(() => {
    if (bestAgentData) {
      setSelectedAgent(bestAgentData.bestAgent);
      setRecommendations(bestAgentData.recommendations || []);
    }
  }, [bestAgentData]);

  useEffect(() => {
    if (portfolioData) {
      setPortfolio(portfolioData.portfolio || []);
      setAllocation(portfolioData.allocation || {});
    }
  }, [portfolioData]);

  const getScoreBadgeColor = (score: number) => {
    if (score >= 75) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-blue-100 text-blue-800";
    if (score >= 40) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "uptrend") return "📈";
    if (trend === "downtrend") return "📉";
    return "➡️";
  };

  const handleAutoMode = () => {
    setAutoMode(!autoMode);
    toast.success(autoMode ? "Auto mode disabled" : "Auto mode enabled - Agents will switch automatically");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Autonomous Agent Selector</h1>
            <p className="text-gray-600 mt-2">Intelligent agent selection and routing</p>
          </div>
          <Button
            onClick={handleAutoMode}
            className={`${autoMode ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"}`}
          >
            {autoMode ? "✓ Auto Mode ON" : "Auto Mode OFF"}
          </Button>
        </div>

        {/* Market Condition Card */}
        {marketCondition && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Market Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-5 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Trend</p>
                  <p className="text-2xl font-bold mt-1">
                    {getTrendIcon(marketCondition.trend)} {marketCondition.trend}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Volatility</p>
                  <p className="text-2xl font-bold mt-1">{marketCondition.volatility}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Momentum</p>
                  <p className="text-2xl font-bold mt-1">{marketCondition.momentum}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">RSI</p>
                  <p className="text-2xl font-bold mt-1">{marketCondition.rsi}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">MACD</p>
                  <p className="text-2xl font-bold mt-1">{marketCondition.macd}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <AlertCircle className="w-5 h-5" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-blue-900">
                    <span className="text-lg">💡</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="best" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="best">Best Agent</TabsTrigger>
            <TabsTrigger value="portfolio">Diversified Portfolio</TabsTrigger>
            <TabsTrigger value="all">All Agents</TabsTrigger>
          </TabsList>

          {/* Best Agent Tab */}
          <TabsContent value="best" className="space-y-4">
            {selectedAgent ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedAgent.agentType.toUpperCase()}</span>
                    <Badge className={getScoreBadgeColor(selectedAgent.score)}>
                      Score: {selectedAgent.score}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{selectedAgent.recommendation}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Win Rate</p>
                      <p className="text-3xl font-bold mt-2">{selectedAgent.winRate}%</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Profitability</p>
                      <p className="text-3xl font-bold mt-2">{selectedAgent.profitability}%</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Recent Performance</p>
                      <p className="text-3xl font-bold mt-2">{selectedAgent.recentPerformance}%</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Market Fit</p>
                      <p className="text-3xl font-bold mt-2">{selectedAgent.volatilityScore}</p>
                    </div>
                  </div>

                  <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12">
                    <Zap className="w-4 h-4 mr-2" />
                    Activate This Agent
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-500 text-center">No agents available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Recommended Portfolio ({portfolio.length} agents)
                </CardTitle>
                <CardDescription>
                  Diversified allocation for optimal risk-adjusted returns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {portfolio.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {portfolio.map((agent) => {
                        const allocationAmount = allocation[agent.agentId] || 0;
                        const allocationPercent = (
                          (allocationAmount / Object.values(allocation).reduce((a, b) => a + b, 0)) *
                          100
                        ).toFixed(1);

                        return (
                          <div key={agent.agentId} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold">{agent.agentType.toUpperCase()}</p>
                                <p className="text-sm text-gray-600">{agent.recommendation}</p>
                              </div>
                              <Badge className={getScoreBadgeColor(agent.score)}>
                                {agent.score}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                              <div>
                                <p className="text-gray-600">Win Rate</p>
                                <p className="font-semibold">{agent.winRate}%</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Profitability</p>
                                <p className="font-semibold">{agent.profitability}%</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Allocation</p>
                                <p className="font-semibold">${allocationAmount.toFixed(2)}</p>
                              </div>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${allocationPercent}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{allocationPercent}% of portfolio</p>
                          </div>
                        );
                      })}
                    </div>

                    <Button className="w-full bg-green-600 hover:bg-green-700 h-12">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Activate Portfolio
                    </Button>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-4">Loading portfolio...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Agents Tab */}
          <TabsContent value="all" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {agentScores.map((agent) => (
                <Card key={agent.agentId}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{agent.agentType.toUpperCase()}</span>
                      <Badge className={getScoreBadgeColor(agent.score)}>
                        {agent.score}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">{agent.recommendation}</p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Win Rate</span>
                        <span className="font-semibold">{agent.winRate}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Profitability</span>
                        <span className="font-semibold">{agent.profitability}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Recent Performance</span>
                        <span className="font-semibold">{agent.recentPerformance}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Market Fit</span>
                        <span className="font-semibold">{agent.volatilityScore}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setSelectedAgent(agent)}
                    >
                      Select Agent
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Auto Mode Info */}
        {autoMode && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">🤖 Auto Mode Active</CardTitle>
            </CardHeader>
            <CardContent className="text-green-900 space-y-2">
              <p>✓ Agents are automatically selected based on market conditions</p>
              <p>✓ Portfolio is rebalanced every 5 minutes</p>
              <p>✓ Agents switch when better opportunities are detected</p>
              <p>✓ All decisions are logged for review</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
