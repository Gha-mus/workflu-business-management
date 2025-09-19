import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { 
  CapitalEntriesResponse, 
  CapitalBalanceResponse, 
  PurchasesResponse, 
  SuppliersResponse, 
  OrdersResponse, 
  WarehouseStockResponse 
} from "@shared/schema";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Warehouse,
  Download,
  Calendar
} from "lucide-react";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: capitalEntries } = useQuery<CapitalEntriesResponse>({
    queryKey: ['/api/capital/entries'],
  });

  const { data: capitalBalance } = useQuery<CapitalBalanceResponse>({
    queryKey: ['/api/capital/balance'],
  });

  const { data: purchases } = useQuery<PurchasesResponse>({
    queryKey: ['/api/purchases'],
  });

  const { data: suppliers } = useQuery<SuppliersResponse>({
    queryKey: ['/api/suppliers'],
  });

  const { data: orders } = useQuery<OrdersResponse>({
    queryKey: ['/api/orders'],
  });

  const { data: warehouseStock } = useQuery<WarehouseStockResponse>({
    queryKey: ['/api/warehouse/stock'],
  });

  // Prepare chart data
  const monthlyPurchases = purchases?.reduce((acc: any, purchase: any) => {
    const month = new Date(purchase.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = { month, amount: 0, weight: 0, count: 0 };
    }
    acc[month].amount += parseFloat(purchase.total);
    acc[month].weight += parseFloat(purchase.weight);
    acc[month].count += 1;
    return acc;
  }, {}) || {};

  const monthlyData = Object.values(monthlyPurchases).slice(-6);

  const supplierData = suppliers?.map((supplier: any) => {
    const supplierPurchases = purchases?.filter((p: any) => p.supplierId === supplier.id) || [];
    const totalAmount = supplierPurchases.reduce((sum: number, p: any) => sum + parseFloat(p.total), 0);
    const totalWeight = supplierPurchases.reduce((sum: number, p: any) => sum + parseFloat(p.weight), 0);
    return {
      name: supplier.name,
      amount: totalAmount,
      weight: totalWeight,
      count: supplierPurchases.length
    };
  }).filter((s: any) => s.count > 0) || [];

  const fundingSourceData = purchases?.reduce((acc: any, purchase: any) => {
    const source = purchase.fundingSource === 'capital' ? 'Capital' : 'External';
    if (!acc[source]) {
      acc[source] = { name: source, value: 0, count: 0 };
    }
    acc[source].value += parseFloat(purchase.total);
    acc[source].count += 1;
    return acc;
  }, {}) || {};

  const fundingData = Object.values(fundingSourceData);

  const inventoryByStatus = warehouseStock?.reduce((acc: any, stock: any) => {
    const status = stock.status.replace(/_/g, ' ');
    if (!acc[status]) {
      acc[status] = { name: status, value: 0 };
    }
    acc[status].value += parseFloat(stock.qtyKgClean);
    return acc;
  }, {}) || {};

  const inventoryData = Object.values(inventoryByStatus);

  const kpis = [
    {
      title: "Capital Utilization",
      value: capitalBalance?.balance ? 
        `${((purchases?.reduce((sum: number, p: any) => sum + parseFloat(p.amountPaid), 0) || 0) / capitalBalance.balance * 100).toFixed(1)}%` 
        : "0%",
      change: "+5.2% from last month",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Average Purchase Price",
      value: purchases?.length ? 
        `$${(purchases.reduce((sum: number, p: any) => sum + parseFloat(p.pricePerKg), 0) / purchases.length).toFixed(2)}/kg` 
        : "$0.00/kg",
      change: "-2.1% from last month",
      icon: TrendingUp,
      color: "text-red-600"
    },
    {
      title: "Total Orders",
      value: orders?.length || 0,
      change: "+3 from last month",
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Inventory Turnover",
      value: "15.2 days",
      change: "-1.3 days from last month",
      icon: Warehouse,
      color: "text-purple-600"
    }
  ];

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex" data-testid="reports">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Reports & Analytics</h2>
              <p className="text-sm text-muted-foreground">Business intelligence and performance insights</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select defaultValue="last-30-days">
                <SelectTrigger className="w-40" data-testid="period-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 days</SelectItem>
                  <SelectItem value="last-year">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" data-testid="export-button">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-background p-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, index) => {
                  const Icon = kpi.icon;
                  return (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{kpi.title}</p>
                            <p className="text-2xl font-bold text-foreground" data-testid={`kpi-${index}`}>
                              {kpi.value}
                            </p>
                            <p className={`text-sm mt-1 ${kpi.color}`}>
                              {kpi.change}
                            </p>
                          </div>
                          <div className="p-3 bg-muted rounded-full">
                            <Icon className="w-6 h-6 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Monthly Purchase Trends</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="amount" fill="#3B82F6" name="Amount ($)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Funding Sources</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={fundingData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {fundingData.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Capital Movement</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Current Balance</span>
                        <span className="font-bold text-lg" data-testid="financial-balance">
                          ${(capitalBalance?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Capital In</span>
                        <span className="font-medium text-green-600">
                          ${capitalEntries?.filter((e: any) => e.type === 'CapitalIn')
                            .reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0)
                            .toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Capital Out</span>
                        <span className="font-medium text-red-600">
                          ${capitalEntries?.filter((e: any) => e.type === 'CapitalOut')
                            .reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0)
                            .toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Purchase Summary</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Purchases</span>
                        <span className="font-bold text-lg">
                          ${purchases?.reduce((sum: number, p: any) => sum + parseFloat(p.total), 0)
                            .toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Amount Paid</span>
                        <span className="font-medium text-green-600">
                          ${purchases?.reduce((sum: number, p: any) => sum + parseFloat(p.amountPaid), 0)
                            .toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Outstanding</span>
                        <span className="font-medium text-red-600">
                          ${purchases?.reduce((sum: number, p: any) => sum + parseFloat(p.remaining), 0)
                            .toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="operations" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Inventory by Status</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={inventoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {inventoryData.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Order Status Distribution</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['draft', 'active', 'in_progress', 'completed', 'cancelled'].map((status) => {
                        const count = orders?.filter((o: any) => o.status === status).length || 0;
                        const percentage = orders?.length ? (count / orders.length * 100).toFixed(1) : '0';
                        return (
                          <div key={status} className="flex justify-between items-center">
                            <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">{count}</span>
                              <span className="text-xs text-muted-foreground">({percentage}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="suppliers" className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Supplier Performance</h3>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Supplier
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Purchases
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Total Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Total Weight (kg)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Avg Price/kg
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {supplierData.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                              No supplier data available
                            </td>
                          </tr>
                        ) : (
                          supplierData.map((supplier: any, index: number) => (
                            <tr key={index} className="hover:bg-muted/50">
                              <td className="px-4 py-4 text-sm font-medium">
                                {supplier.name}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {supplier.count}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                ${supplier.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {supplier.weight.toLocaleString()}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                ${(supplier.amount / supplier.weight).toFixed(2)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
