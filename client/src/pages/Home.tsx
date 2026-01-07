import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Loader2, TrendingUp, Zap, BarChart3, Settings, Users, Wallet, Shield, Rocket, ArrowRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

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
                  Manage multiple agents with shared or separate portfolios. Track allocation and rebalance easily.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-red-600 mb-2" />
                <CardTitle>Market Signals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  AI-generated trading signals based on technical analysis, market trends, and sentiment analysis.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition">
              <CardHeader>
                <Rocket className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle>24/7 Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Your agents trade around the clock. No manual intervention needed. Set and forget.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center space-y-4 py-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white">
            <h2 className="text-3xl font-bold">Ready to automate your trading?</h2>
            <p className="text-lg opacity-90">Start with $30 USD and deploy your first trading agent today.</p>
            <Button size="lg" variant="secondary" onClick={() => window.location.href = getLoginUrl()}>
              Launch Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
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

          <Link href="/trading-simulation">
            <Card className="hover:shadow-lg transition cursor-pointer h-full">
              <CardHeader>
                <TrendingUp className="h-6 w-6 text-red-600 mb-2" />
                <CardTitle className="text-lg">Trading Simulation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Generate and test trading data</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Overview Cards */}
        <DashboardMetrics />

        {/* Recent Activity */}
        <RecentActivitySection />
      </div>
    </div>
  );
}

function DashboardMetrics() {
  const { data: metrics, isLoading } = trpc.dashboard.getMetrics.useQuery();

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Active Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900">{metrics?.activeAgents || 0}</div>
          <p className="text-xs text-gray-500 mt-1">Running 24/7</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Portfolio Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">${(metrics?.portfolioValue || 0).toFixed(2)}</div>
          <p className="text-xs text-gray-500 mt-1">Total balance</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Win Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">{(metrics?.winRate || 0).toFixed(1)}%</div>
          <p className="text-xs text-gray-500 mt-1">Average across agents</p>
        </CardContent>
      </Card>
    </div>
  );
}

function RecentActivitySection() {
  const { data: activities, isLoading } = trpc.dashboard.getRecentActivity.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>No trading activity yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Start your agents to see trading activity here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest trading activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">{activity.type} {activity.symbol}</p>
                <p className="text-sm text-gray-500">{new Date(activity.executedAt).toLocaleString()}</p>
              </div>
              <span className={`font-semibold ${(activity.profit || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(activity.profit || 0) > 0 ? '+' : ''} ${(activity.profit || 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
