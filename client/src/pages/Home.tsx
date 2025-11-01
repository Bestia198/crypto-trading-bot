import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, BarChart3, Zap, Shield } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";

/**
 * Landing page for the Crypto Trading Bot Dashboard
 */
export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {APP_LOGO && <img src={APP_LOGO} alt="logo" className="h-8 w-8" />}
            <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="default">Dashboard</Button>
                </Link>
                <Button variant="outline" onClick={() => logout()}>
                  Logout
                </Button>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button>Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {isAuthenticated ? (
          // Authenticated view
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Welcome to Crypto Trading Bot</h2>
              <p className="text-xl text-gray-600 mb-8">
                Multi-agent cryptocurrency trading with AI-powered strategies
              </p>
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8">
                  Go to Dashboard
                </Button>
              </Link>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Real-Time Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Track ROI, win rates, and portfolio performance in real-time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle>Multi-Agent Trading</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Leverage RL agents, Momentum, Mean Reversion, and AI strategies
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Zap className="h-8 w-8 text-yellow-600 mb-2" />
                  <CardTitle>Advanced Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Visualize trading history, agent performance, and portfolio evolution
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-purple-600 mb-2" />
                  <CardTitle>Risk Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Built-in stop-loss and take-profit mechanisms for safety
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // Unauthenticated view
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Intelligent Crypto Trading</h2>
              <p className="text-xl text-gray-600 mb-8">
                Harness the power of multi-agent reinforcement learning and AI-driven strategies
              </p>
              <a href={getLoginUrl()}>
                <Button size="lg" className="text-lg px-8">
                  Get Started
                </Button>
              </a>
            </div>

            {/* Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
              <div>
                <h3 className="text-2xl font-bold mb-4">Why Choose Our Bot?</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Advanced RL agents trained on real market data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Multiple trading strategies working in consensus</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Comprehensive risk management tools</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Real-time performance analytics and insights</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-4">Key Features</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold">→</span>
                    <span>Support for multiple trading pairs (BTC, ETH, etc.)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold">→</span>
                    <span>Backtesting and historical analysis</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold">→</span>
                    <span>Customizable agent configurations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold">→</span>
                    <span>Detailed transaction logs and audit trails</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Start Trading?</h3>
              <p className="text-lg mb-6">
                Sign in to access your personalized trading dashboard and start optimizing your portfolio
              </p>
              <a href={getLoginUrl()}>
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Sign In Now
                </Button>
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>&copy; 2025 Crypto Trading Bot. Powered by Manus AI.</p>
        </div>
      </footer>
    </div>
  );
}
