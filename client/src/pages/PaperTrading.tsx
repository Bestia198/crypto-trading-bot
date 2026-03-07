import DashboardLayout from "@/components/DashboardLayout";
import PaperTradingDashboard from "@/components/PaperTradingDashboard";

export default function PaperTrading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Paper Trading</h1>
          <p className="text-muted-foreground mt-2">
            Test your trading strategies with simulated trades on real market prices for 7 days
          </p>
        </div>
        <PaperTradingDashboard />
      </div>
    </DashboardLayout>
  );
}
