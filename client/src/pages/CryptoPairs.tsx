import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CRYPTO_PAIRS, getPairsByCategory } from "@shared/cryptoPairs";
import CryptoPairsSelector from "@/components/CryptoPairsSelector";
import { TrendingUp, TrendingDown, DollarSign, Zap } from "lucide-react";

export default function CryptoPairs() {
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("major");

  const categories = ["major", "altcoin", "defi", "layer2", "emerging"] as const;
  const categoryNames: Record<string, string> = {
    major: "Major Cryptocurrencies",
    altcoin: "Altcoins",
    defi: "DeFi Tokens",
    layer2: "Layer 2 Solutions",
    emerging: "Emerging Assets",
  };

  const handleSelectPair = (pair: (typeof CRYPTO_PAIRS)[0]) => {
    setSelectedPairs((prev) =>
      prev.includes(pair.symbol)
        ? prev.filter((s) => s !== pair.symbol)
        : [...prev, pair.symbol]
    );
  };

  const categoryPairs = getPairsByCategory(selectedCategory as any);
  const selectedCategoryPairs = categoryPairs.filter((p) => selectedPairs.includes(p.symbol));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Cryptocurrency Pairs</h1>
          <p className="text-gray-600 mt-2">
            Manage and select trading pairs for your autonomous agents
          </p>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Pairs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{CRYPTO_PAIRS.length}</p>
              <p className="text-xs text-gray-500 mt-1">Available for trading</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Selected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{selectedPairs.length}</p>
              <p className="text-xs text-gray-500 mt-1">For your agents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Major Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{getPairsByCategory("major").length}</p>
              <p className="text-xs text-gray-500 mt-1">BTC, ETH, SOL, etc.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">DeFi Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{getPairsByCategory("defi").length}</p>
              <p className="text-xs text-gray-500 mt-1">LINK, UNI, AAVE, etc.</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pair Selector */}
          <div className="lg:col-span-2">
            <CryptoPairsSelector
              selectedPairs={selectedPairs}
              onSelectPair={handleSelectPair}
            />
          </div>

          {/* Selected Pairs Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Selected Pairs ({selectedPairs.length})</CardTitle>
                <CardDescription>Your active trading pairs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedPairs.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No pairs selected yet
                    </p>
                  ) : (
                    selectedPairs.map((symbol) => {
                      const pair = CRYPTO_PAIRS.find((p) => p.symbol === symbol);
                      if (!pair) return null;

                      return (
                        <div
                          key={symbol}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-semibold text-sm">{pair.baseAsset}</p>
                            <p className="text-xs text-gray-600">{pair.name}</p>
                          </div>
                          <button
                            onClick={() => handleSelectPair(pair)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {selectedPairs.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Button
                      onClick={() => setSelectedPairs([])}
                      variant="outline"
                      className="w-full"
                    >
                      Clear All
                    </Button>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Apply Selection
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trading Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trading Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Quote Asset</p>
                    <p className="text-xs text-gray-600">All pairs use USDT</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium">Precision</p>
                    <p className="text-xs text-gray-600">8 decimal places</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Trading Hours</p>
                    <p className="text-xs text-gray-600">24/7 availability</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-sm font-medium">Exchanges</p>
                    <p className="text-xs text-gray-600">
                      Binance, Kraken, Coinbase, Bybit
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Category Details */}
        <Card>
          <CardHeader>
            <CardTitle>{categoryNames[selectedCategory]}</CardTitle>
            <CardDescription>
              {categoryPairs.length} trading pairs available in this category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryPairs.map((pair) => (
                <div
                  key={pair.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                    selectedPairs.includes(pair.symbol)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  onClick={() => handleSelectPair(pair)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-lg">{pair.baseAsset}</p>
                      <p className="text-sm text-gray-600">{pair.name}</p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        selectedPairs.includes(pair.symbol)
                          ? "bg-blue-200 text-blue-800"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {selectedPairs.includes(pair.symbol) ? "Selected" : "Available"}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600">
                    <p>Min Trade: {pair.minTrade} {pair.baseAsset}</p>
                    <p>Max Trade: {pair.maxTrade} {pair.baseAsset}</p>
                    <p>Exchanges: {pair.exchanges.length}</p>
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
