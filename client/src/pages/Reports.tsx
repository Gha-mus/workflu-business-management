import { useEffect, useState } from "react";
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
  Calendar,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Users,
  FileText,
  ArrowUpDown,
  RefreshCw
} from "lucide-react";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  
  // State for report configuration
  const [dateRange, setDateRange] = useState({ 
    startDate: '', 
    endDate: '' 
  });
  const [selectedPeriod, setSelectedPeriod] = useState('last-30-days');
  const [activeTab, setActiveTab] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);

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

  // Date range helpers
  useEffect(() => {
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    let start = new Date();
    
    switch (selectedPeriod) {
      case 'last-7-days':
        start.setDate(start.getDate() - 7);
        break;
      case 'last-30-days':
        start.setDate(start.getDate() - 30);
        break;
      case 'last-90-days':
        start.setDate(start.getDate() - 90);
        break;
      case 'last-year':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }
    
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end
    });
  }, [selectedPeriod]);

  // Export functionality
  const handleExport = async (reportType: string, format: string = 'json') => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/reports/export/${reportType}?format=${format}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: `${reportType} report exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

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

  // Enhanced reporting queries
  const { data: financialSummary, isLoading: financialLoading } = useQuery({
    queryKey: ['/api/reports/financial/summary', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.set('startDate', dateRange.startDate);
      if (dateRange.endDate) params.set('endDate', dateRange.endDate);
      const url = `/api/reports/financial/summary${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch financial summary');
      return response.json();
    }
  });

  const { data: cashFlow, isLoading: cashFlowLoading } = useQuery({
    queryKey: ['/api/reports/financial/cashflow', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/reports/financial/cashflow?period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Failed to fetch cash flow');
      return response.json();
    }
  });

  const { data: inventoryAnalytics, isLoading: inventoryLoading } = useQuery({
    queryKey: ['/api/reports/inventory/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/reports/inventory/analytics');
      if (!response.ok) throw new Error('Failed to fetch inventory analytics');
      return response.json();
    }
  });

  const { data: supplierPerformance, isLoading: supplierLoading } = useQuery({
    queryKey: ['/api/reports/suppliers/performance'],
    queryFn: async () => {
      const response = await fetch('/api/reports/suppliers/performance');
      if (!response.ok) throw new Error('Failed to fetch supplier performance');
      return response.json();
    }
  });

  const { data: tradingActivity, isLoading: tradingLoading } = useQuery({
    queryKey: ['/api/reports/trading/activity'],
    queryFn: async () => {
      const response = await fetch('/api/reports/trading/activity');
      if (!response.ok) throw new Error('Failed to fetch trading activity');
      return response.json();
    }
  });

  // Enhanced KPIs with real-time calculations
  const enhancedKpis = [
    {
      title: "Net Position",
      value: financialSummary?.summary?.netPosition ? 
        `$${financialSummary.summary.netPosition.toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
        : "Loading...",
      change: "Capital + Inventory - Outstanding",
      icon: DollarSign,
      color: "text-green-600",
      loading: financialLoading
    },
    {
      title: "Inventory Value",
      value: financialSummary?.summary?.totalInventoryValue ? 
        `$${financialSummary.summary.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
        : "Loading...",
      change: inventoryAnalytics ? `${(inventoryAnalytics.warehouseSummary.first.totalKg + inventoryAnalytics.warehouseSummary.final.totalKg).toLocaleString()} kg total` : "",
      icon: Warehouse,
      color: "text-blue-600",
      loading: financialLoading || inventoryLoading
    },
    {
      title: "Filter Yield",
      value: inventoryAnalytics?.filterAnalysis?.averageYield ? 
        `${inventoryAnalytics.filterAnalysis.averageYield.toFixed(1)}%` 
        : "Loading...",
      change: inventoryAnalytics ? `${inventoryAnalytics.filterAnalysis.totalFiltered} operations` : "",
      icon: Activity,
      color: "text-purple-600",
      loading: inventoryLoading
    },
    {
      title: "Order Fulfillment",
      value: tradingActivity?.orderFulfillment?.fulfillmentRate ? 
        `${tradingActivity.orderFulfillment.fulfillmentRate.toFixed(1)}%` 
        : "Loading...",
      change: tradingActivity ? `${tradingActivity.orderFulfillment.stats.completed}/${tradingActivity.orderFulfillment.stats.total} completed` : "",
      icon: Package,
      color: "text-green-600",
      loading: tradingLoading
    }
  ];

  // Prepare enhanced chart data
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

  // Legacy KPIs for backward compatibility
  const legacyKpis = [
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

  // Use enhanced KPIs when data is available, fallback to legacy
  const kpis = financialSummary ? enhancedKpis : legacyKpis;

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
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
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
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                data-testid="refresh-button"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('financial', 'json')}
                  disabled={isExporting}
                  data-testid="export-financial-button"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Financial
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('inventory', 'json')}
                  disabled={isExporting}
                  data-testid="export-inventory-button"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Inventory
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-background p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
              <TabsTrigger value="trading">Trading</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Enhanced KPI Cards */}
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
                              {kpi.loading ? (
                                <div className="animate-pulse bg-muted h-8 w-24 rounded" />
                              ) : (
                                kpi.value
                              )}
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

              {/* Financial Summary Cards */}
              {financialSummary && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Financial Position</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Working Capital</span>
                          <span className="font-bold">
                            ${financialSummary.summary.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Inventory Value</span>
                          <span className="font-medium">
                            ${financialSummary.summary.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Outstanding</span>
                          <span className="font-medium text-red-600">
                            ${financialSummary.summary.totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Net Position</span>
                            <span className="font-bold text-lg">
                              ${financialSummary.summary.netPosition.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Currency Breakdown</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">USD Purchases</span>
                          <span className="font-medium">
                            ${financialSummary.currencyBreakdown.usd.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {financialSummary.currencyBreakdown.usd.count} transactions
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">ETB Purchases (USD)</span>
                          <span className="font-medium">
                            ${financialSummary.currencyBreakdown.etb.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {financialSummary.currencyBreakdown.etb.count} transactions @ {financialSummary.exchangeRate} ETB/USD
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Performance Metrics</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Capital Utilization</span>
                          <span className="font-medium">
                            {financialSummary.summary.currentBalance > 0 ? 
                              ((financialSummary.summary.capitalOut / (financialSummary.summary.currentBalance + financialSummary.summary.capitalOut)) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Payment Rate</span>
                          <span className="font-medium">
                            {financialSummary.summary.totalPurchases > 0 ? 
                              ((financialSummary.summary.totalPaid / financialSummary.summary.totalPurchases) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Inventory Turnover</span>
                          <span className="font-medium">
                            {financialSummary.summary.totalInventoryValue > 0 && financialSummary.summary.totalPurchases > 0 ? 
                              (financialSummary.summary.totalInventoryValue / (financialSummary.summary.totalPurchases / 365)).toFixed(1)
                              : 0} days
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

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

            <TabsContent value="inventory" className="space-y-6">
              {/* Inventory Analytics */}
              {inventoryAnalytics ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold">Warehouse Summary</h3>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium text-sm text-muted-foreground">First Warehouse</h4>
                            <div className="mt-2 grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Items</p>
                                <p className="text-lg font-bold">{inventoryAnalytics.warehouseSummary.first.count}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Weight</p>
                                <p className="text-lg font-bold">{inventoryAnalytics.warehouseSummary.first.totalKg.toLocaleString()} kg</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Value</p>
                                <p className="text-lg font-bold">${inventoryAnalytics.warehouseSummary.first.totalValue.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium text-sm text-muted-foreground">Final Warehouse</h4>
                            <div className="mt-2 grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Items</p>
                                <p className="text-lg font-bold">{inventoryAnalytics.warehouseSummary.final.count}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Weight</p>
                                <p className="text-lg font-bold">{inventoryAnalytics.warehouseSummary.final.totalKg.toLocaleString()} kg</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Value</p>
                                <p className="text-lg font-bold">${inventoryAnalytics.warehouseSummary.final.totalValue.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold">Status Distribution</h3>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={Object.entries(inventoryAnalytics.statusSummary).map(([status, data]: [string, any]) => ({
                                  name: status.replace(/_/g, ' '),
                                  value: data.totalKg
                                }))}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {Object.keys(inventoryAnalytics.statusSummary).map((_, index) => (
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

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold">Filter Performance</h3>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">{inventoryAnalytics.filterAnalysis.averageYield.toFixed(1)}%</p>
                            <p className="text-sm text-muted-foreground">Average Filter Yield</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">{inventoryAnalytics.filterAnalysis.totalFiltered}</p>
                            <p className="text-sm text-muted-foreground">Total Filter Operations</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold">Inventory Aging</h3>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(inventoryAnalytics.aging).map(([range, count]) => (
                            <div key={range} className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">{range} days</span>
                              <span className="font-medium">{count} items</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <div className="animate-pulse bg-muted h-96 rounded" />
              )}
            </TabsContent>

            <TabsContent value="trading" className="space-y-6">
              {/* Trading Activity Analytics */}
              {tradingActivity ? (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold">Order Fulfillment</h3>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-blue-600">{tradingActivity.orderFulfillment.fulfillmentRate.toFixed(1)}%</p>
                          <p className="text-sm text-muted-foreground">Fulfillment Rate</p>
                        </div>
                        <div className="mt-4 space-y-2">
                          {Object.entries(tradingActivity.orderFulfillment.stats).map(([status, count]) => (
                            <div key={status} className="flex justify-between items-center">
                              <span className="text-sm capitalize text-muted-foreground">{status.replace('_', ' ')}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold">Currency Distribution</h3>
                      </CardHeader>
                      <CardContent>
                        {Object.entries(tradingActivity.currencyDistribution).map(([currency, data]: [string, any]) => (
                          <div key={currency} className="mb-4">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{currency}</span>
                              <span className="text-sm">{data.count} orders</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {data.weight.toLocaleString()} kg • ${data.amount.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold">Profitability</h3>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Inventory Value</span>
                            <span className="font-medium">${tradingActivity.profitability.totalInventoryValue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Purchase Cost</span>
                            <span className="font-medium">${tradingActivity.profitability.totalPurchaseCost.toLocaleString()}</span>
                          </div>
                          <div className="border-t pt-3">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Est. Margin</span>
                              <span className="font-bold text-lg">{tradingActivity.profitability.estimatedMargin.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Volume Trends</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={tradingActivity.volumeTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="volume" fill="#3B82F6" name="Volume (kg)" />
                            <Bar dataKey="count" fill="#10B981" name="Orders" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="animate-pulse bg-muted h-96 rounded" />
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Business Intelligence Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Cash Flow Trends</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      {cashFlow ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={cashFlow.periods}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name]} />
                            <Legend />
                            <Line type="monotone" dataKey="capitalIn" stroke="#10B981" name="Capital In" />
                            <Line type="monotone" dataKey="capitalOut" stroke="#EF4444" name="Capital Out" />
                            <Line type="monotone" dataKey="netFlow" stroke="#3B82F6" name="Net Flow" strokeWidth={3} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="animate-pulse bg-muted h-full rounded" />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">ROI Analysis</h3>
                  </CardHeader>
                  <CardContent>
                    {financialSummary ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-green-600">
                            {financialSummary.summary.totalInventoryValue > 0 && financialSummary.summary.totalPurchases > 0 ? 
                              (((financialSummary.summary.totalInventoryValue - financialSummary.summary.totalPurchases) / financialSummary.summary.totalPurchases) * 100).toFixed(1)
                              : 0}%
                          </p>
                          <p className="text-sm text-muted-foreground">Return on Investment</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Capital Efficiency</span>
                            <span className="font-medium">
                              {financialSummary.summary.currentBalance > 0 ? 
                                (financialSummary.summary.totalInventoryValue / financialSummary.summary.currentBalance).toFixed(2)
                                : 0}x
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Working Capital Ratio</span>
                            <span className="font-medium">
                              {financialSummary.summary.totalOutstanding > 0 ? 
                                (financialSummary.summary.currentBalance / financialSummary.summary.totalOutstanding).toFixed(2)
                                : '∞'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="animate-pulse bg-muted h-40 rounded" />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Performance Benchmarks */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Performance Benchmarks</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {inventoryAnalytics?.filterAnalysis?.averageYield ? 
                          inventoryAnalytics.filterAnalysis.averageYield.toFixed(1) : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">Filter Efficiency</p>
                      <p className="text-xs mt-1 text-muted-foreground">Target: 85%</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {supplierPerformance?.suppliers ? 
                          (supplierPerformance.suppliers.reduce((sum: number, s: any) => sum + s.performance.paymentRate, 0) / supplierPerformance.suppliers.length).toFixed(1)
                          : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Payment Rate</p>
                      <p className="text-xs mt-1 text-muted-foreground">Target: 90%</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {tradingActivity?.orderFulfillment?.fulfillmentRate ? 
                          tradingActivity.orderFulfillment.fulfillmentRate.toFixed(1) : 0}%
                      </p>
                      <p className="text-sm text-muted-foreground">Order Fulfillment</p>
                      <p className="text-xs mt-1 text-muted-foreground">Target: 95%</p>
                    </div>
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
