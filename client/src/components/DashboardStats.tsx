import { useQuery } from "@tanstack/react-query";
import type { CapitalBalanceResponse, OrdersResponse, WarehouseStockResponse } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DollarSign, 
  Package, 
  Warehouse, 
  TrendingUp 
} from "lucide-react";

export function DashboardStats() {
  const { data: capitalBalance, isLoading: capitalLoading } = useQuery<CapitalBalanceResponse>({
    queryKey: ['/api/capital/balance'],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<OrdersResponse>({
    queryKey: ['/api/orders'],
  });

  const { data: warehouseStock, isLoading: stockLoading } = useQuery<WarehouseStockResponse>({
    queryKey: ['/api/warehouse/stock'],
  });

  const activeOrders = orders?.filter((order: any) => order.status !== 'completed')?.length || 0;
  
  const inventoryValue = warehouseStock?.reduce((sum: number, stock: any) => 
    sum + (parseFloat(stock.qtyKgClean) * parseFloat(stock.unitCostCleanUsd || '0')), 0
  ) || 0;

  const totalWeight = warehouseStock?.reduce((sum: number, stock: any) => 
    sum + parseFloat(stock.qtyKgClean), 0
  ) || 0;

  const stats = [
    {
      title: "Working Capital",
      value: capitalLoading ? "Loading..." : `$${(capitalBalance?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
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
      change: "3 pending shipping",
      changeType: "neutral",
      icon: Package,
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-600",
      testId: "stat-orders"
    },
    {
      title: "Inventory Value",
      value: stockLoading ? "Loading..." : `$${inventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      change: `${totalWeight.toLocaleString()} kg total`,
      changeType: "neutral",
      icon: Warehouse,
      bgColor: "bg-green-500/10",
      iconColor: "text-green-600",
      testId: "stat-inventory"
    },
    {
      title: "Monthly Revenue",
      value: "$67,890.00",
      change: "+15.3% from last month",
      changeType: "positive",
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
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
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
                    {stat.change}
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
