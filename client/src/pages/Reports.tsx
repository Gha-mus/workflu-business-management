import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { 
  CapitalEntriesResponse, 
  CapitalBalanceResponse, 
  PurchasesResponse, 
  SuppliersResponse, 
  OrdersResponse, 
  WarehouseStockResponse,
  FinancialSummaryResponse,
  InventoryAnalyticsResponse,
  TradingActivityResponse
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
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Shield,
  AlertCircle
} from "lucide-react";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // State for report configuration
  const [dateRange, setDateRange] = useState({ 
    startDate: '', 
    endDate: '' 
  });
  const [selectedPeriod, setSelectedPeriod] = useState('last-30-days');
  const [activeTab, setActiveTab] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);
  
  // State for validation
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [validationStatus, setValidationStatus] = useState<string>('');
  const [showValidationResults, setShowValidationResults] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/auth/login");
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

  // Validation functionality
  const handleValidateWorkflow = async () => {
    setIsValidating(true);
    setValidationProgress(0);
    setValidationStatus('Initializing validation...');

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setValidationProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 2000);

      setValidationStatus('Processing business document...');
      
      const response = await fetch('/api/ai/validate-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      clearInterval(progressInterval);
      setValidationProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Validation failed');
      }

      const result = await response.json();
      
      setValidationStatus('Validation completed successfully!');
      
      toast({
        title: "Validation Complete",
        description: `Workflow validation completed with status: ${result.overallStatus}`,
      });

      // Refresh validation data
      await refetchValidation();
      setShowValidationResults(true);
      
    } catch (error: unknown) {
      console.error('Validation error:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('rate limit') || errorMessage.includes('recently')) {
        toast({
          title: "Rate Limited",
          description: "Validation was run recently. Please wait before running again.",
          variant: "destructive",
        });
      } else if (error.message.includes('OpenAI API key')) {
        toast({
          title: "AI Service Error",
          description: "AI service not configured. Please contact administrator.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Validation Failed",
          description: error.message || "Failed to validate workflow",
          variant: "destructive",
        });
      }
      
      setValidationStatus('Validation failed');
    } finally {
      setIsValidating(false);
      setTimeout(() => {
        setValidationProgress(0);
        setValidationStatus('');
      }, 3000);
    }
  };

  // Export validation results
  const handleExportValidation = async (validationId: string, format: string = 'json') => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/ai/validation/${validationId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format }),
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Export failed');
      
      const result = await response.json();
      
      if (format === 'json' && result.validationReport) {
        // Direct download for JSON format
        const blob = new Blob([JSON.stringify(result.validationReport, null, 2)], { 
          type: 'application/json' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `validation_report_${validationId}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      toast({
        title: "Export Successful",
        description: `Validation report exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export validation report",
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
  const { data: financialSummary, isLoading: financialLoading } = useQuery<FinancialSummaryResponse>({
    queryKey: ['/api/reports/financial/summary', dateRange.startDate, dateRange.endDate].filter(Boolean),
  });

  const { data: cashFlow, isLoading: cashFlowLoading } = useQuery({
    queryKey: ['/api/reports/financial/cashflow', 'period=' + selectedPeriod],
  });

  const { data: inventoryAnalytics, isLoading: inventoryLoading } = useQuery<InventoryAnalyticsResponse>({
    queryKey: ['/api/reports/inventory/analytics'],
  });

  const { data: supplierPerformance, isLoading: supplierLoading } = useQuery({
    queryKey: ['/api/reports/suppliers/performance'],
  });

  // Comprehensive Financial Reporting Queries
  const { data: financialKpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['/api/financial/kpis'],
  });

  const { data: profitLossStatements, isLoading: plLoading } = useQuery({
    queryKey: ['/api/financial/profit-loss'],
  });

  const { data: cashFlowForecast, isLoading: cashFlowForecastLoading } = useQuery({
    queryKey: ['/api/financial/cashflow/forecast', 'days=90'],
  });

  const { data: marginAnalysis, isLoading: marginLoading } = useQuery({
    queryKey: ['/api/financial/margins'],
  });

  const { data: roiAnalysis, isLoading: roiLoading } = useQuery({
    queryKey: ['/api/financial/roi'],
  });

  const { data: breakEvenAnalysis, isLoading: breakEvenLoading } = useQuery({
    queryKey: ['/api/financial/breakeven'],
  });

  const { data: currencyExposure, isLoading: currencyLoading } = useQuery({
    queryKey: ['/api/financial/currency-exposure'],
  });

  const { data: tradingActivity, isLoading: tradingLoading } = useQuery<TradingActivityResponse>({
    queryKey: ['/api/reports/trading/activity'],
  });

  // Validation queries
  const { data: latestValidation, isLoading: validationLoading, refetch: refetchValidation } = useQuery({
    queryKey: ['/api/ai/validation/latest'],
    enabled: isAuthenticated
  });

  const { data: validationHistory } = useQuery({
    queryKey: ['/api/ai/validation/history', 'limit=5'],
    enabled: isAuthenticated
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
      change: inventoryAnalytics?.warehouseSummary ? `${(inventoryAnalytics.warehouseSummary.first.totalKg + inventoryAnalytics.warehouseSummary.final.totalKg).toLocaleString()} kg total` : "",
      icon: Warehouse,
      color: "text-blue-600",
      loading: financialLoading || inventoryLoading
    },
    {
      title: "Filter Yield",
      value: inventoryAnalytics?.filterAnalysis?.averageYield ? 
        `${inventoryAnalytics.filterAnalysis.averageYield.toFixed(1)}%` 
        : "Loading...",
      change: inventoryAnalytics?.filterAnalysis ? `${inventoryAnalytics.filterAnalysis.totalFiltered} operations` : "",
      icon: Activity,
      color: "text-purple-600",
      loading: inventoryLoading
    },
    {
      title: "Order Fulfillment",
      value: tradingActivity?.orderFulfillment?.fulfillmentRate ? 
        `${tradingActivity.orderFulfillment.fulfillmentRate.toFixed(1)}%` 
        : "Loading...",
      change: tradingActivity?.orderFulfillment ? `${tradingActivity.orderFulfillment.stats.completed}/${tradingActivity.orderFulfillment.stats.total} completed` : "",
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
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
              <TabsTrigger value="trading">Trading</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
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
                              {!financialSummary ? (
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
                                <p className="text-lg font-bold">${inventoryAnalytics.warehouseSummary.first.valueUsd.toLocaleString()}</p>
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
                                <p className="text-lg font-bold">${inventoryAnalytics.warehouseSummary.final.valueUsd.toLocaleString()}</p>
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
                                data={inventoryAnalytics?.statusBreakdown ? inventoryAnalytics.statusBreakdown.map((item: any) => ({
                                  name: item.status.replace(/_/g, ' '),
                                  value: item.totalKg
                                })) : []}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {inventoryAnalytics?.statusBreakdown ? inventoryAnalytics.statusBreakdown.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                )) : null}
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
                          {inventoryAnalytics?.statusBreakdown ? inventoryAnalytics.statusBreakdown.map((item, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">{item.status.replace(/_/g, ' ')}</span>
                              <span className="font-medium">{item.count} items</span>
                            </div>
                          )) : <p className="text-sm text-muted-foreground">No aging data available</p>}
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
                          {tradingActivity?.orderFulfillment?.stats ? Object.entries(tradingActivity.orderFulfillment.stats).map(([status, count]) => (
                            <div key={status} className="flex justify-between items-center">
                              <span className="text-sm capitalize text-muted-foreground">{status.replace('_', ' ')}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          )) : <p className="text-sm text-muted-foreground">No order data available</p>}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold">Currency Distribution</h3>
                      </CardHeader>
                      <CardContent>
                        {tradingActivity?.timeAnalysis ? Object.entries(tradingActivity.timeAnalysis).slice(0, 3).map(([period, data]: [string, any]) => (
                          <div key={period} className="mb-4">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{period}</span>
                              <span className="text-sm">{typeof data === 'object' ? Object.keys(data).length : data} items</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Time period analysis data
                            </div>
                          </div>
                        )) : <p className="text-sm text-muted-foreground">No currency data available</p>}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold">Profitability</h3>
                      </CardHeader>
                      <CardContent>
                        {tradingActivity?.volumeAnalysis ? (
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total Volume</span>
                              <span className="font-medium">{(tradingActivity.volumeAnalysis.totalVolume || 0).toLocaleString()} kg</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Average Order Size</span>
                              <span className="font-medium">{(tradingActivity.volumeAnalysis.averageOrderSize || 0).toLocaleString()} kg</span>
                            </div>
                            <div className="border-t pt-3">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium">Largest Order</span>
                                <span className="font-bold text-lg">{(tradingActivity.volumeAnalysis.largestOrder || 0).toLocaleString()} kg</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No volume data available</p>
                        )}
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
                          <BarChart data={tradingActivity?.timeAnalysis ? Object.entries(tradingActivity.timeAnalysis).map(([month, data]) => ({ month, volume: (data as any)?.volume || 0, count: (data as any)?.count || 0 })) : []}>
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
                          <LineChart data={Array.isArray(cashFlow) ? cashFlow : []}>
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
                        {Array.isArray(supplierPerformance) && supplierPerformance.length ? 
                          (supplierPerformance.reduce((sum: number, s: any) => sum + (s.performance?.paymentRate || 0), 0) / supplierPerformance.length).toFixed(1)
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

            <TabsContent value="validation" className="space-y-6">
              {/* Validation Header and Controls */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Workflow Validation</h2>
                  <p className="text-muted-foreground">
                    Compare system implementation against business requirements document
                  </p>
                </div>
                <Button
                  onClick={handleValidateWorkflow}
                  disabled={isValidating}
                  data-testid="button-validate-workflow"
                  className="flex items-center gap-2"
                >
                  {isValidating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      Validate Against Document
                    </>
                  )}
                </Button>
              </div>

              {/* Validation Progress */}
              {isValidating && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium">Validation in Progress</p>
                          <p className="text-sm text-muted-foreground">{validationStatus}</p>
                        </div>
                        <span className="text-sm font-medium">{validationProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${validationProgress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Latest Validation Results */}
              {latestValidation && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Latest Validation Results</h3>
                        <div className="flex items-center gap-2">
                          <div 
                            className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            Pending
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExportValidation(latestValidation.validationId)}
                            disabled={isExporting}
                            data-testid="button-export-validation"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Completed: {new Date(latestValidation.completedAt).toLocaleString()}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold text-red-600">
                            {latestValidation.summary?.criticalGaps || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">Critical Gaps</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold text-yellow-600">
                            {latestValidation.summary?.highPriorityGaps || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">High Priority</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">
                            {latestValidation.summary?.totalGaps || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">Total Gaps</p>
                        </div>
                      </div>

                      {latestValidation.summary?.recommendations && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Key Recommendations</h4>
                          <ul className="space-y-1">
                            {latestValidation.summary.recommendations.slice(0, 3).map((rec: string, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 mt-0.5 text-blue-500" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Stage-by-Stage Analysis */}
                  {latestValidation.gapReport?.stages && (
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold">Stage Analysis</h3>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {latestValidation?.gapReport?.stages ? Object.entries(latestValidation.gapReport.stages).map(([stageName, stageData]: [string, any]) => (
                            <div key={stageName} className="border rounded-lg p-4">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="font-medium capitalize">{stageName.replace('_', ' ')}</h4>
                                <div className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${
                                  stageData.status === 'matched' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : stageData.status === 'partial' 
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {stageData.status === 'matched' && <CheckCircle className="h-3 w-3" />}
                                  {stageData.status === 'partial' && <AlertTriangle className="h-3 w-3" />}
                                  {stageData.status === 'missing' && <XCircle className="h-3 w-3" />}
                                  {stageData.status}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {stageData.missingItems && stageData.missingItems.length > 0 && (
                                  <div>
                                    <p className="font-medium text-red-600 mb-2">Missing Items</p>
                                    <ul className="space-y-1">
                                      {stageData.missingItems.slice(0, 3).map((item: string, index: number) => (
                                        <li key={index} className="text-muted-foreground">• {item}</li>
                                      ))}
                                      {stageData.missingItems.length > 3 && (
                                        <li className="text-muted-foreground italic">
                                          +{stageData.missingItems.length - 3} more items
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                )}

                                {stageData.remediation && stageData.remediation.length > 0 && (
                                  <div>
                                    <p className="font-medium text-blue-600 mb-2">Remediation Steps</p>
                                    <ul className="space-y-1">
                                      {stageData.remediation.slice(0, 2).map((step: string, index: number) => (
                                        <li key={index} className="text-muted-foreground">• {step}</li>
                                      ))}
                                      {stageData.remediation.length > 2 && (
                                        <li className="text-muted-foreground italic">
                                          +{stageData.remediation.length - 2} more steps
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>

                              {stageData.severity && (
                                <div className="mt-3 pt-3 border-t">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                    stageData.severity === 'critical' 
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                      : stageData.severity === 'high' 
                                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                      : stageData.severity === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                  }`}>
                                    Severity: {stageData.severity}
                                  </span>
                                </div>
                              )}
                            </div>
                          )) : <p className="text-sm text-muted-foreground">No stage analysis available</p>}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Validation History */}
              {validationHistory && validationHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Validation History</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {validationHistory.map((validation: any) => (
                        <div key={validation.validationId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-2 ${
                              validation.overallStatus === 'matched' 
                                ? 'text-green-600'
                                : validation.overallStatus === 'partial' 
                                ? 'text-yellow-600'
                                : 'text-red-600'
                            }`}>
                              {validation.overallStatus === 'matched' && <CheckCircle className="h-4 w-4" />}
                              {validation.overallStatus === 'partial' && <AlertTriangle className="h-4 w-4" />}
                              {validation.overallStatus === 'missing' && <XCircle className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="font-medium">
                                {validation.overallStatus.charAt(0).toUpperCase() + validation.overallStatus.slice(1)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(validation.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {validation.summary?.totalGaps || 0} gaps
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleExportValidation(validation.validationId)}
                              data-testid={`button-export-${validation.validationId}`}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Validation Results */}
              {!latestValidation && !validationLoading && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Validation Results</h3>
                      <p className="text-muted-foreground mb-4">
                        Run your first workflow validation to compare the system against business requirements.
                      </p>
                      <Button
                        onClick={handleValidateWorkflow}
                        disabled={isValidating}
                        data-testid="button-first-validation"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Start Validation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
