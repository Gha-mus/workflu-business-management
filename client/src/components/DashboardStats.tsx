import { useQuery } from "@tanstack/react-query";
import type { OrdersResponse, FinancialSummaryResponse, TradingActivityResponse } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { TranslatedText } from "@/components/TranslatedText";
import { 
  DollarSign, 
  Package, 
  Warehouse, 
  TrendingUp 
} from "lucide-react";

export function DashboardStats() {
  // Use the new financial summary endpoint for consistency
  const { data: financialSummary, isLoading: financialLoading } = useQuery<FinancialSummaryResponse>({
    queryKey: ['/api/reports/financial/summary'],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<OrdersResponse>({
    queryKey: ['/api/orders'],
  });

  const { data: tradingActivity, isLoading: tradingLoading } = useQuery<TradingActivityResponse>({
    queryKey: ['/api/reports/trading/activity'],
  });

  const activeOrders = orders?.filter((order: any) => order.status !== 'completed')?.length || 0;
  
  // Get values from financial summary for consistency
  const currentBalance = financialSummary?.summary?.currentBalance || 0;
  const inventoryValue = financialSummary?.summary?.totalInventoryValue || 0;

  const stats = [
    {
      title: "Working Capital",
      value: financialLoading ? "Loading..." : `$${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      change: "+2.5% from last month",
      changeType: "positive",
      icon: DollarSign,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
      testId: "stat-capital"
    },
    {
      title: "Active Orders",
      value: ordersLoading ? "Loading..." : activeOrders.toString(),
      change: tradingActivity ? `${tradingActivity.orderFulfillment.fulfillmentRate.toFixed(1)}% fulfillment rate` : "3 pending shipping",
      changeType: "neutral",
      icon: Package,
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-600",
      testId: "stat-orders"
    },
    {
      title: "Inventory Value",
      value: financialLoading ? "Loading..." : `$${inventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      change: tradingActivity ? `${tradingActivity.volumeAnalysis.totalVolume.toLocaleString()} kg total` : "Real-time valuation",
      changeType: "neutral",
      icon: Warehouse,
      bgColor: "bg-green-500/10",
      iconColor: "text-green-600",
      testId: "stat-inventory"
    },
    {
      title: "Net Position",
      value: financialLoading ? "Loading..." : `$${(financialSummary?.summary?.netPosition || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      change: "Capital + Inventory - Outstanding",
      changeType: (financialSummary?.summary?.netPosition || 0) >= 0 ? "positive" : "negative",
      icon: TrendingUp,
      bgColor: "bg-amber-500/10",
      iconColor: "text-amber-600",
      testId: "stat-revenue"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} data-testid={stat.testId}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    <TranslatedText>{stat.title}</TranslatedText>
                  </p>
                  <p className="text-2xl font-bold text-foreground" data-testid={`${stat.testId}-value`}>
                    {stat.value}
                  </p>
                  <p className={`text-sm mt-1 ${
                    stat.changeType === 'positive' 
                      ? 'text-green-600' 
                      : stat.changeType === 'negative'
                      ? 'text-red-600'
                      : 'text-muted-foreground'
                  }`}>
                    <TranslatedText>{stat.change}</TranslatedText>
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
