import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const EXCHANGES = [
  { id: 'binance', name: 'Binance', icon: '📊', description: 'Largest crypto exchange' },
  { id: 'kraken', name: 'Kraken', icon: '🦑', description: 'Secure & reliable' },
  { id: 'coinbase', name: 'Coinbase', icon: '💰', description: 'User-friendly' },
  { id: 'bybit', name: 'Bybit', icon: '⚡', description: 'Derivatives & spot' },
];

export default function ExchangeSettings() {
  const { user } = useAuth();
  const [selectedExchange, setSelectedExchange] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [tradingMode, setTradingMode] = useState<"paper" | "live">("paper");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: connectedExchanges, isLoading } = trpc.exchange.getConnectedExchanges.useQuery();
  const connectMutation = trpc.exchange.connectExchange.useMutation({
    onSuccess: (data) => {
      toast.success(`Connected to ${data.exchange} in ${data.mode} mode`);
      setIsDialogOpen(false);
      setApiKey("");
      setApiSecret("");
      setPassphrase("");
      setSelectedExchange(null);
    },
    onError: (error) => {
      toast.error(`Failed to connect: ${error.message}`);
    },
  });

  const disconnectMutation = trpc.exchange.disconnectExchange.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(`Failed to disconnect: ${error.message}`);
    },
  });

  const handleConnect = () => {
    if (!selectedExchange || !apiKey || !apiSecret) {
      toast.error("Please fill in all required fields");
      return;
    }

    connectMutation.mutate({
      exchange: selectedExchange as any,
      apiKey,
      apiSecret,
      passphrase: passphrase || undefined,
      mode: tradingMode,
    });
  };

  const handleDisconnect = (exchange: string) => {
    disconnectMutation.mutate({ exchange: exchange as any });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">Exchange Settings</span>
          </div>
          <span className="text-gray-600">Welcome, {user?.name || "User"}</span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Connected Exchanges</h1>
          <p className="text-gray-600">Manage your cryptocurrency exchange connections</p>
        </div>

        {/* Connected Exchanges */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {isLoading ? (
            <div className="col-span-2 flex items-center justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
          ) : connectedExchanges && connectedExchanges.length > 0 ? (
            connectedExchanges.map((exchange) => (
              <Card key={exchange.exchange} className="hover:shadow-lg transition">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="capitalize">{exchange.exchange}</CardTitle>
                      <CardDescription>
                        {exchange.mode === "paper" ? "📝 Paper Trading" : "💰 Live Trading"}
                      </CardDescription>
                    </div>
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Badge variant={exchange.mode === "paper" ? "secondary" : "destructive"}>
                        {exchange.mode.toUpperCase()}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 hover:text-red-700"
                      onClick={() => handleDisconnect(exchange.exchange)}
                      disabled={disconnectMutation.isPending}
                    >
                      {disconnectMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-2">
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No exchanges connected yet</p>
                <p className="text-sm text-gray-500">Connect an exchange to start trading</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Available Exchanges */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Exchanges</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {EXCHANGES.map((exchange) => {
              const isConnected = connectedExchanges?.some(e => e.exchange === exchange.id);
              return (
                <Dialog key={exchange.id} open={selectedExchange === exchange.id && isDialogOpen} onOpenChange={(open) => {
                  if (!open) setSelectedExchange(null);
                  setIsDialogOpen(open);
                }}>
                  <DialogTrigger asChild>
                    <Card
                      className={`cursor-pointer hover:shadow-lg transition ${isConnected ? 'opacity-50' : ''}`}
                      onClick={() => {
                        if (!isConnected) {
                          setSelectedExchange(exchange.id);
                          setIsDialogOpen(true);
                        }
                      }}
                    >
                      <CardHeader>
                        <div className="text-4xl mb-2">{exchange.icon}</div>
                        <CardTitle>{exchange.name}</CardTitle>
                        <CardDescription>{exchange.description}</CardDescription>
                      </CardHeader>
                      {isConnected && (
                        <CardContent>
                          <Badge className="w-full justify-center">Connected</Badge>
                        </CardContent>
                      )}
                    </Card>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Connect to {exchange.name}</DialogTitle>
                      <DialogDescription>
                        Enter your API credentials to connect your {exchange.name} account
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      {/* Trading Mode Selection */}
                      <div>
                        <Label className="mb-2 block">Trading Mode</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              value="paper"
                              checked={tradingMode === "paper"}
                              onChange={(e) => setTradingMode(e.target.value as "paper" | "live")}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">📝 Paper Trading (Simulated)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              value="live"
                              checked={tradingMode === "live"}
                              onChange={(e) => setTradingMode(e.target.value as "paper" | "live")}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">💰 Live Trading (Real Money)</span>
                          </label>
                        </div>
                      </div>

                      {/* API Key */}
                      <div>
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                          id="apiKey"
                          type="password"
                          placeholder="Enter your API key"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                        />
                      </div>

                      {/* API Secret */}
                      <div>
                        <Label htmlFor="apiSecret">API Secret</Label>
                        <Input
                          id="apiSecret"
                          type="password"
                          placeholder="Enter your API secret"
                          value={apiSecret}
                          onChange={(e) => setApiSecret(e.target.value)}
                        />
                      </div>

                      {/* Passphrase (Coinbase) */}
                      {exchange.id === 'coinbase' && (
                        <div>
                          <Label htmlFor="passphrase">Passphrase (Coinbase only)</Label>
                          <Input
                            id="passphrase"
                            type="password"
                            placeholder="Enter your passphrase"
                            value={passphrase}
                            onChange={(e) => setPassphrase(e.target.value)}
                          />
                        </div>
                      )}

                      {/* Connect Button */}
                      <Button
                        onClick={handleConnect}
                        disabled={connectMutation.isPending}
                        className="w-full"
                      >
                        {connectMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Connect to {exchange.name}
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        </div>

        {/* Info Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">How to Get API Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-blue-800">
            <div>
              <p className="font-semibold mb-2">Binance:</p>
              <p>1. Go to Account → API Management</p>
              <p>2. Create new API key with trading permissions</p>
              <p>3. Copy API Key and Secret</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Kraken:</p>
              <p>1. Go to Settings → API</p>
              <p>2. Generate new API key</p>
              <p>3. Enable trading permissions</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Coinbase:</p>
              <p>1. Go to Settings → API</p>
              <p>2. Create API key with trading permissions</p>
              <p>3. Copy Key, Secret, and Passphrase</p>
            </div>
            <div>
              <p className="font-semibold mb-2">Bybit:</p>
              <p>1. Go to Account → API</p>
              <p>2. Create new API key</p>
              <p>3. Enable spot trading permissions</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
