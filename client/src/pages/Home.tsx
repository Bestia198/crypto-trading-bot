import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Loader2, TrendingUp, Zap, BarChart3, Settings, Users, Wallet, Shield, Rocket, ArrowRight } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Navigation */}
        <nav className="flex justify-between items-center px-6 py-4 bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-900">{APP_TITLE}</span>
          </div>
          <Button onClick={() => window.location.href = getLoginUrl()}>
            Sign In
          </Button>
        </nav>

        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Autonomous Trading Agents
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Powered by AI & RL
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Deploy intelligent trading bots that learn and adapt. Automate your crypto trading with advanced machine learning algorithms.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => window.location.href = getLoginUrl()} className="bg-blue-600 hover:bg-blue-700">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <Zap className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>AI-Powered Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Deploy multiple autonomous trading agents using Reinforcement Learning, Momentum, and LLM strategies.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Real-Time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Monitor performance metrics, win rates, confidence levels, and ROI in real-time dashboards.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <Shield className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Risk Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Set stop-loss limits, daily loss caps, and maximum drawdown thresholds for each agent.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <Wallet className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle>Portfolio Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Manage deposits, withdrawals, and track your complete trading portfolio with detailed history.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <Rocket className="h-8 w-8 text-red-600 mb-2" />
                <CardTitle>Automated Trading</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Set up cron-based trading schedules and let your agents trade autonomously 24/7.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle>Performance Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Track detailed trading results with entry/exit prices, profit/loss, and confidence metrics.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-white text-center mb-20">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of traders using AI-powered agents to maximize returns.
            </p>
            <Button size="lg" variant="secondary" onClick={() => window.location.href = getLoginUrl()}>
              Sign Up Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-900">{APP_TITLE}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user?.name || "User"}</span>
            <Button variant="outline" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your autonomous trading agents and portfolio</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/dashboard">
            <Card className="hover:shadow-lg transition cursor-pointer h-full">
              <CardHeader>
                <BarChart3 className="h-6 w-6 text-blue-600 mb-2" />
                <CardTitle className="text-lg">Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">View trading metrics and performance</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/automation">
            <Card className="hover:shadow-lg transition cursor-pointer h-full">
              <CardHeader>
                <Zap className="h-6 w-6 text-green-600 mb-2" />
                <CardTitle className="text-lg">Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Manage agents and schedules</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/agents">
            <Card className="hover:shadow-lg transition cursor-pointer h-full">
              <CardHeader>
                <Users className="h-6 w-6 text-purple-600 mb-2" />
                <CardTitle className="text-lg">Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Create and configure agents</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings">
            <Card className="hover:shadow-lg transition cursor-pointer h-full">
              <CardHeader>
                <Settings className="h-6 w-6 text-orange-600 mb-2" />
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Manage account preferences</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/auto-agent">
            <Card className="hover:shadow-lg transition cursor-pointer h-full">
              <CardHeader>
                <Zap className="h-6 w-6 text-pink-600 mb-2" />
                <CardTitle className="text-lg">Auto Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">AI-powered agent selection</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">5</div>
              <p className="text-xs text-gray-500 mt-1">Running 24/7</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">$12,450.50</div>
              <p className="text-xs text-gray-500 mt-1">+8.5% this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">68.5%</div>
              <p className="text-xs text-gray-500 mt-1">Average across agents</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest trading activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">RL-Agent-1 executed 5 trades</p>
                  <p className="text-sm text-gray-500">2 hours ago</p>
                </div>
                <span className="text-green-600 font-semibold">+$245.50</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Momentum-Agent started</p>
                  <p className="text-sm text-gray-500">4 hours ago</p>
                </div>
                <span className="text-blue-600">🟢 Running</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Deposit received</p>
                  <p className="text-sm text-gray-500">1 day ago</p>
                </div>
                <span className="text-green-600 font-semibold">+$1,000.00</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
