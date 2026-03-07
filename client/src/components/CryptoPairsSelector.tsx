import React, { useState } from "react";
import { CRYPTO_PAIRS, getPairsByCategory, getPairsByExchange } from "@shared/cryptoPairs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Star } from "lucide-react";

interface CryptoPairsSelectorProps {
  onSelectPair?: (pair: typeof CRYPTO_PAIRS[0]) => void;
  selectedPairs?: string[];
}

export default function CryptoPairsSelector({
  onSelectPair,
  selectedPairs = [],
}: CryptoPairsSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("major");
  const [favorites, setFavorites] = useState<string[]>([]);

  const categories = ["major", "altcoin", "defi", "layer2", "emerging"] as const;

  const filteredPairs = CRYPTO_PAIRS.filter((pair) => {
    const matchesSearch =
      pair.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pair.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = pair.category === selectedCategory;
    return matchesSearch && matchesCategory && pair.active;
  });

  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  const isFavorite = (symbol: string) => favorites.includes(symbol);
  const isSelected = (symbol: string) => selectedPairs.includes(symbol);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cryptocurrency Trading Pairs</CardTitle>
        <CardDescription>Select trading pairs for your agents</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search pairs (BTC, Ethereum, etc.)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="major">Major</TabsTrigger>
            <TabsTrigger value="altcoin">Altcoins</TabsTrigger>
            <TabsTrigger value="defi">DeFi</TabsTrigger>
            <TabsTrigger value="layer2">Layer 2</TabsTrigger>
            <TabsTrigger value="emerging">Emerging</TabsTrigger>
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-3">
              {/* Favorites Section */}
              {favorites.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Favorites</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {CRYPTO_PAIRS.filter(
                      (p) => isFavorite(p.symbol) && p.category === category && p.active
                    ).map((pair) => (
                      <button
                        key={pair.id}
                        onClick={() => onSelectPair?.(pair)}
                        className={`p-3 rounded-lg border-2 transition ${
                          isSelected(pair.symbol)
                            ? "border-blue-500 bg-blue-50"
                            : "border-yellow-300 bg-yellow-50 hover:border-yellow-400"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="text-left">
                            <p className="font-bold text-sm">{pair.baseAsset}</p>
                            <p className="text-xs text-gray-600">{pair.name}</p>
                          </div>
                          <Star
                            className="w-3 h-3 fill-yellow-400 text-yellow-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(pair.symbol);
                            }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Pairs */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">All Pairs</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                  {filteredPairs.map((pair) => (
                    <button
                      key={pair.id}
                      onClick={() => onSelectPair?.(pair)}
                      className={`p-3 rounded-lg border-2 transition ${
                        isSelected(pair.symbol)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="text-left">
                          <p className="font-bold text-sm">{pair.baseAsset}</p>
                          <p className="text-xs text-gray-600">{pair.name}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Min: {pair.minTrade} {pair.baseAsset}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(pair.symbol);
                          }}
                          className="mt-1"
                        >
                          <Star
                            className={`w-3 h-3 ${
                              isFavorite(pair.symbol)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Total Pairs</p>
            <p className="text-2xl font-bold">{CRYPTO_PAIRS.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Selected</p>
            <p className="text-2xl font-bold">{selectedPairs.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Favorites</p>
            <p className="text-2xl font-bold">{favorites.length}</p>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            💡 <strong>Tip:</strong> Star your favorite pairs for quick access. Each pair has
            minimum and maximum trade limits.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
