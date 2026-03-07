import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Brain } from "lucide-react";
import { toast } from "sonner";

export default function AITradingAnalysis() {
  const { user } = useAuth();
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [currentPrice, setCurrentPrice] = useState("45000");
  const [bid, setBid] = useState("44950");
  const [ask, setAsk] = useState("45050");
  const [volume24h, setVolume24h] = useState("1000000");
  const [change24h, setChange24h] = useState("2.5");
  const [selectedModel, setSelectedModel] = useState<"deepseek" | "qwen">("deepseek");

  const analyzeMarketMutation = trpc.llmTrading.analyzeMarket.useMutation({
    onSuccess: (data) => {
      toast.success(`Market analysis complete: ${data.action}`);
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const { data: availableModels, isLoading: modelsLoading } =
    trpc.llmTrading.getAvailableModels.useQuery();

  const handleAnalyze = () => {
    if (!symbol || !currentPrice || !bid || !ask) {
      toast.error("Please fill in all required fields");
      return;
    }

    analyzeMarketMutation.mutate({
      marketData: {
        symbol,
        currentPrice: parseFloat(currentPrice),
        bid: parseFloat(bid),
        ask: parseFloat(ask),
        volume24h: parseFloat(volume24h) || 0,
        change24h: parseFloat(change24h) || 0,
      },
      model: selectedModel,
    });
  };

  const signal = analyzeMarketMutation.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navigation */}
      <nav className="bg-slate-800/50 backdrop-blur border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold text-white">AI Trading Analysis</span>
          </div>
          <span className="text-slate-300">Welcome, {user?.name || "User"}</span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AI-Powered Market Analysis</h1>
          <p className="text-slate-400">
            Leverage DeepSeek and Qwen for intelligent trading decisions
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <Card className="lg:col-span-1 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Market Data</CardTitle>
              <CardDescription>Enter current market conditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Symbol */}
              <div>
                <Label htmlFor="symbol" className="text-slate-300">
                  Symbol
                </Label>
                <Input
                  id="symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="BTCUSDT"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {/* Current Price */}
              <div>
                <Label htmlFor="currentPrice" className="text-slate-300">
                  Current Price
                </Label>
                <Input
                  id="currentPrice"
                  type="number"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  placeholder="45000"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {/* Bid */}
              <div>
                <Label htmlFor="bid" className="text-slate-300">
                  Bid Price
                </Label>
                <Input
                  id="bid"
                  type="number"
                  value={bid}
                  onChange={(e) => setBid(e.target.value)}
                  placeholder="44950"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {/* Ask */}
              <div>
                <Label htmlFor="ask" className="text-slate-300">
                  Ask Price
                </Label>
                <Input
                  id="ask"
                  type="number"
                  value={ask}
                  onChange={(e) => setAsk(e.target.value)}
                  placeholder="45050"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {/* Volume */}
              <div>
                <Label htmlFor="volume" className="text-slate-300">
                  24h Volume
                </Label>
                <Input
                  id="volume"
                  type="number"
                  value={volume24h}
                  onChange={(e) => setVolume24h(e.target.value)}
                  placeholder="1000000"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {/* 24h Change */}
              <div>
                <Label htmlFor="change" className="text-slate-300">
                  24h Change (%)
                </Label>
                <Input
                  id="change"
                  type="number"
                  value={change24h}
                  onChange={(e) => setChange24h(e.target.value)}
                  placeholder="2.5"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {/* Model Selection */}
              <div>
                <Label className="text-slate-300 mb-2 block">AI Model</Label>
                <div className="space-y-2">
                  {!modelsLoading &&
                    availableModels?.map((model) => (
                      <label key={model.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value={model.id}
                          checked={selectedModel === model.id}
                          onChange={(e) => setSelectedModel(e.target.value as "deepseek" | "qwen")}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-300">
                          {model.name} - {model.description}
                        </span>
                      </label>
                    ))}
                </div>
              </div>

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={analyzeMarketMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {analyzeMarketMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze Market
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {signal ? (
              <>
                {/* Trading Signal */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white">Trading Signal</CardTitle>
                        <CardDescription>AI-generated trading recommendation</CardDescription>
                      </div>
                      <Badge
                        variant={
                          signal.action === "BUY"
                            ? "default"
                            : signal.action === "SELL"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-lg px-3 py-1"
                      >
                        {signal.action === "BUY" && <TrendingUp className="h-4 w-4 mr-1" />}
                        {signal.action === "SELL" && <TrendingDown className="h-4 w-4 mr-1" />}
                        {signal.action}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Confidence */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-300">Confidence Level</span>
                        <span className="text-white font-semibold">{signal.confidence}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            signal.confidence > 70
                              ? "bg-green-500"
                              : signal.confidence > 40
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${signal.confidence}%` }}
                        />
                      </div>
                    </div>

                    {/* Reason */}
                    <div>
                      <Label className="text-slate-300">Analysis</Label>
                      <p className="text-slate-300 mt-2 p-3 bg-slate-700/50 rounded">
                        {signal.reason}
                      </p>
                    </div>

                    {/* Price Targets */}
                    {signal.entryPrice && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-700/50 p-3 rounded">
                          <p className="text-slate-400 text-sm">Entry Price</p>
                          <p className="text-white font-semibold">${signal.entryPrice.toFixed(2)}</p>
                        </div>
                        {signal.stopLoss && (
                          <div className="bg-red-900/30 p-3 rounded border border-red-700/50">
                            <p className="text-slate-400 text-sm">Stop Loss</p>
                            <p className="text-red-400 font-semibold">${signal.stopLoss.toFixed(2)}</p>
                          </div>
                        )}
                        {signal.takeProfit && (
                          <div className="bg-green-900/30 p-3 rounded border border-green-700/50">
                            <p className="text-slate-400 text-sm">Take Profit</p>
                            <p className="text-green-400 font-semibold">${signal.takeProfit.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Risk/Reward */}
                    {signal.riskRewardRatio && (
                      <div className="bg-slate-700/50 p-3 rounded">
                        <p className="text-slate-400 text-sm">Risk/Reward Ratio</p>
                        <p className="text-white font-semibold">1:{signal.riskRewardRatio.toFixed(2)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Model Info */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Analysis Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Model Used</span>
                      <span className="text-white font-semibold capitalize">{selectedModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Symbol</span>
                      <span className="text-white font-semibold">{symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Timeframe</span>
                      <span className="text-white font-semibold">{signal.timeframe || "1h"}</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-slate-800 border-slate-700 lg:col-span-2">
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2">No analysis yet</p>
                  <p className="text-sm text-slate-500">Enter market data and click "Analyze Market" to get AI trading signals</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Model Capabilities */}
        <Card className="mt-12 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">AI Model Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {availableModels?.map((model) => (
                <div key={model.id} className="bg-slate-700/50 p-4 rounded">
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                    {model.name}
                  </h3>
                  <p className="text-slate-400 text-sm mb-3">{model.description}</p>
                  <div className="space-y-1">
                    {model.capabilities.map((cap) => (
                      <div key={cap} className="text-sm text-slate-300">
                        • {cap.replace(/_/g, " ")}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
