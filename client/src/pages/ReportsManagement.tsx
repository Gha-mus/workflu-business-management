import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { BackButton } from '@/components/ui/back-button';
import { 
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  Calendar,
  DollarSign,
  Package,
  Users,
  Building,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  Filter,
  Search,
  Settings,
  Share,
  Archive,
  Target,
  Activity,
  Zap,
  Layers,
  Database,
  Globe,
  Shield,
  LineChart,
  BookOpen,
  CreditCard,
  Truck,
  Factory,
  Star,
  Percent,
  Calculator,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Mail,
  Bell,
  Monitor
} from 'lucide-react';

// Zod schemas for forms
const exportRequestSchema = z.object({
  reportType: z.enum(['financial_summary', 'trading_activity', 'inventory_analytics', 'supplier_performance', 'compliance_dashboard', 'executive_summary']),
  format: z.enum(['csv', 'json', 'xlsx', 'pdf']).default('xlsx'),
  filters: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    period: z.string().optional(),
    category: z.string().optional(),
  }).optional(),
  includeCharts: z.boolean().default(true),
  emailTo: z.string().email().optional(),
  note: z.string().optional(),
});

const scheduledReportSchema = z.object({
  reportType: z.enum(['financial_summary', 'trading_activity', 'inventory_analytics', 'supplier_performance', 'compliance_dashboard', 'executive_summary']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  format: z.enum(['csv', 'json', 'xlsx', 'pdf']).default('xlsx'),
  emailTo: z.string().email().min(1, 'Email is required'),
  name: z.string().min(1, 'Report name is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FinancialSummary = {
  currentBalance: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  grossMargin: number;
  operatingMargin: number;
  cashFlow: number;
  periodData: any[];
};

type TradingActivity = {
  stats: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    averageOrderValue: number;
    totalOrderValue: number;
  };
  orderFulfillment: {
    fulfillmentRate: number;
    avgDeliveryTime: number;
    onTimeDelivery: number;
  };
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    orderCount: number;
    totalValue: number;
  }>;
  recentActivity: any[];
};

type InventoryAnalytics = {
  totalStockValue: number;
  stockTurnover: number;
  topMovingItems: any[];
  lowStockAlerts: any[];
  warehouseUtilization: {
    firstWarehouse: number;
    finalWarehouse: number;
  };
  qualityMetrics: {
    passRate: number;
    avgFilterYield: number;
    damageRate: number;
  };
};

type SupplierPerformance = {
  topSuppliers: Array<{
    supplierId: string;
    supplierName: string;
    reliability: number;
    qualityScore: number;
    totalPurchases: number;
    avgDeliveryTime: number;
  }>;
  performanceMetrics: {
    avgReliability: number;
    avgQuality: number;
    onTimeDelivery: number;
  };
  riskAnalysis: any[];
};

type ComplianceDashboard = {
  overallScore: number;
  expiringDocuments: number;
  pendingApprovals: number;
  recentAlerts: any[];
  complianceAreas: Array<{
    area: string;
    score: number;
    status: string;
  }>;
};

type ExportJob = {
  id: string;
  reportType: string;
  status: string;
  format: string;
  requestedAt: string;
  completedAt?: string;
  downloadUrl?: string;
  emailTo?: string;
  fileSize?: number;
};

const MetricCard = ({ title, value, currency, change, icon: Icon, trend, color = 'blue' }: {
  title: string;
  value: string | number;
  currency?: string;
  change?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}) => {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Activity;
  const colorClass = `text-${color}-600`;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold">
                {currency && currency !== 'count' && `${currency} `}
                {typeof value === 'number' ? value.toLocaleString() : value}
              </span>
              {change && (
                <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
                  <TrendIcon className="h-4 w-4" />
                  <span>{change}</span>
                </div>
              )}
            </div>
          </div>
          <div className={`p-2 rounded-lg bg-${color}-50 dark:bg-${color}-900/20`}>
            <Icon className={`h-6 w-6 ${colorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };
  
  return (
    <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  );
};

export default function ReportsManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [reportFilter, setReportFilter] = useState({ category: '', period: 'current' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms
  const exportForm = useForm({
    resolver: zodResolver(exportRequestSchema),
    defaultValues: {
      reportType: 'financial_summary' as const,
      format: 'xlsx' as const,
      filters: {
        startDate: '',
        endDate: '',
        period: 'current',
        category: '',
      },
      includeCharts: true,
      emailTo: '',
      note: '',
    }
  });

  const scheduledReportForm = useForm({
    resolver: zodResolver(scheduledReportSchema),
    defaultValues: {
      reportType: 'financial_summary' as const,
      frequency: 'monthly' as const,
      format: 'xlsx' as const,
      emailTo: '',
      name: '',
      description: '',
      isActive: true,
    }
  });

  // Queries
  const { data: financialSummary, isLoading: isLoadingFinancial } = useQuery({
    queryKey: ['/api/reports/financial/summary', reportFilter],
    refetchInterval: 60000, // Refresh every minute
  }) as { data: FinancialSummary, isLoading: boolean };

  const { data: tradingActivity, isLoading: isLoadingTrading } = useQuery({
    queryKey: ['/api/reports/trading/activity'],
    refetchInterval: 60000,
  }) as { data: TradingActivity, isLoading: boolean };

  const { data: inventoryAnalytics, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['/api/reports/inventory/analytics'],
    refetchInterval: 60000,
  }) as { data: InventoryAnalytics, isLoading: boolean };

  const { data: supplierPerformance, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['/api/reports/suppliers/performance'],
  }) as { data: SupplierPerformance, isLoading: boolean };

  const { data: complianceDashboard } = useQuery({
    queryKey: ['/api/compliance/dashboard'],
  }) as { data: ComplianceDashboard };

  const { data: executiveSummary } = useQuery({
    queryKey: ['/api/ai/executive-summary'],
  }) as { data: any };

  const { data: exportJobs = [] } = useQuery({
    queryKey: ['/api/export-jobs'],
  }) as { data: ExportJob[] };

  const { data: exportHistory = [] } = useQuery({
    queryKey: ['/api/exports/history'],
  }) as { data: any[] };

  const { data: financialPeriods = [] } = useQuery({
    queryKey: ['/api/financial/periods'],
  }) as { data: any[] };

  const { data: currentPeriod } = useQuery({
    queryKey: ['/api/financial/periods/current'],
  }) as { data: any };

  // Mutations
  const exportReportMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/exports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: 'Export request submitted successfully!' });
      exportForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/export-jobs'] });
    },
    onError: (error: unknown) => {
      toast({ title: 'Failed to submit export request', description: error instanceof Error ? error.message : String(error), variant: 'destructive' });
    }
  });

  const createScheduledReportMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/export-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: 'Scheduled report created successfully!' });
      scheduledReportForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/export-jobs'] });
    },
    onError: (error: unknown) => {
      toast({ title: 'Failed to create scheduled report', description: error instanceof Error ? error.message : String(error), variant: 'destructive' });
    }
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-start gap-4">
          <BackButton to="/" text="Back to Dashboard" mobileIconOnly={true} />
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="title-reports-management">Reports Management</h1>
            <p className="text-muted-foreground">Comprehensive business intelligence, analytics, and scheduled reporting</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48" data-testid="select-period">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Period</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="last_quarter">Last Quarter</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh All
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="financial" data-testid="tab-financial">Financial</TabsTrigger>
          <TabsTrigger value="trading" data-testid="tab-trading">Trading</TabsTrigger>
          <TabsTrigger value="inventory" data-testid="tab-inventory">Inventory</TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance" data-testid="tab-compliance">Compliance</TabsTrigger>
          <TabsTrigger value="exports" data-testid="tab-exports">Exports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Current Balance"
              value={financialSummary?.currentBalance?.toFixed(2) || '0.00'}
              currency="$"
              change={financialSummary?.netIncome > 0 ? `+${((financialSummary.netIncome / Math.max(financialSummary.totalRevenue, 1)) * 100).toFixed(1)}%` : undefined}
              icon={DollarSign}
              trend={financialSummary?.netIncome > 0 ? 'up' : 'down'}
              color="green"
            />
            <MetricCard
              title="Total Orders"
              value={tradingActivity?.stats?.totalOrders || 0}
              currency="count"
              change={`${tradingActivity?.stats?.completedOrders || 0} completed`}
              icon={Package}
              trend="up"
              color="blue"
            />
            <MetricCard
              title="Stock Value"
              value={inventoryAnalytics?.totalStockValue?.toFixed(2) || '0.00'}
              currency="$"
              change={`${inventoryAnalytics?.stockTurnover?.toFixed(1) || '0.0'}x turnover`}
              icon={Factory}
              trend="up"
              color="purple"
            />
            <MetricCard
              title="Compliance Score"
              value={`${complianceDashboard?.overallScore || 0}%`}
              currency="count"
              change={complianceDashboard?.expiringDocuments ? `${complianceDashboard.expiringDocuments} expiring` : 'All current'}
              icon={Shield}
              trend={complianceDashboard?.overallScore >= 90 ? 'up' : 'neutral'}
              color="orange"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-executive-summary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {executiveSummary?.summary ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm leading-relaxed">{executiveSummary.summary}</p>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Generating executive summary...</p>
                    </div>
                  )}
                  
                  {executiveSummary?.keyMetrics && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          ${executiveSummary.keyMetrics.revenue?.toFixed(0) || '0'}
                        </div>
                        <div className="text-sm text-muted-foreground">Monthly Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {executiveSummary.keyMetrics.orders || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">Orders Processed</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-key-insights">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Key Business Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">Revenue Growth</div>
                      <div className="text-sm text-muted-foreground">Month-over-month performance</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        +{((financialSummary?.totalRevenue || 0) > 0 ? ((financialSummary?.netIncome || 0) / financialSummary.totalRevenue * 100) : 0).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Net Margin</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">Order Fulfillment</div>
                      <div className="text-sm text-muted-foreground">Delivery performance</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {tradingActivity?.orderFulfillment?.fulfillmentRate?.toFixed(1) || '0.0'}%
                      </div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">Inventory Efficiency</div>
                      <div className="text-sm text-muted-foreground">Stock optimization</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">
                        {inventoryAnalytics?.stockTurnover?.toFixed(1) || '0.0'}x
                      </div>
                      <div className="text-sm text-muted-foreground">Turnover Rate</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">Quality Performance</div>
                      <div className="text-sm text-muted-foreground">Product quality metrics</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600">
                        {inventoryAnalytics?.qualityMetrics?.passRate?.toFixed(1) || '0.0'}%
                      </div>
                      <div className="text-sm text-muted-foreground">Pass Rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-recent-activities">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Report Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exportHistory.slice(0, 5).map((export_item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`export-history-${index}`}>
                    <div className="space-y-1">
                      <div className="font-medium">{export_item.reportType?.replace('_', ' ')?.toUpperCase() || 'Report'}</div>
                      <div className="text-sm text-muted-foreground">
                        {export_item.format?.toUpperCase()} • {new Date(export_item.requestedAt || Date.now()).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={export_item.status || 'completed'} />
                      {export_item.downloadUrl && (
                        <Button size="sm" variant="outline" data-testid={`button-download-${index}`}>
                          <Download className="mr-1 h-3 w-3" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {exportHistory.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No export history found.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {isLoadingFinancial ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading financial reports...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Revenue"
                  value={financialSummary?.totalRevenue?.toFixed(2) || '0.00'}
                  currency="$"
                  change="+12.5%"
                  icon={DollarSign}
                  trend="up"
                  color="green"
                />
                <MetricCard
                  title="Total Expenses"
                  value={financialSummary?.totalExpenses?.toFixed(2) || '0.00'}
                  currency="$"
                  change="+8.2%"
                  icon={CreditCard}
                  trend="up"
                  color="red"
                />
                <MetricCard
                  title="Net Income"
                  value={financialSummary?.netIncome?.toFixed(2) || '0.00'}
                  currency="$"
                  change="+15.3%"
                  icon={TrendingUp}
                  trend={financialSummary?.netIncome > 0 ? 'up' : 'down'}
                  color="blue"
                />
                <MetricCard
                  title="Cash Flow"
                  value={financialSummary?.cashFlow?.toFixed(2) || '0.00'}
                  currency="$"
                  change="+5.7%"
                  icon={Activity}
                  trend="up"
                  color="purple"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card data-testid="card-financial-breakdown">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Financial Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Gross Margin</span>
                          <span className="font-bold text-green-600" data-testid="text-gross-margin">
                            {financialSummary?.grossMargin?.toFixed(1) || '0.0'}%
                          </span>
                        </div>
                        <Progress value={financialSummary?.grossMargin || 0} className="h-2" />
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Operating Margin</span>
                          <span className="font-bold text-blue-600" data-testid="text-operating-margin">
                            {financialSummary?.operatingMargin?.toFixed(1) || '0.0'}%
                          </span>
                        </div>
                        <Progress value={financialSummary?.operatingMargin || 0} className="h-2" />
                      </div>
                      
                      <Separator />
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600" data-testid="text-revenue-total">
                            ${financialSummary?.totalRevenue?.toFixed(0) || '0'}
                          </div>
                          <div className="text-muted-foreground">Total Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-600" data-testid="text-expenses-total">
                            ${financialSummary?.totalExpenses?.toFixed(0) || '0'}
                          </div>
                          <div className="text-muted-foreground">Total Expenses</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-period-comparison">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Period Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Current Period</span>
                        <Badge variant="default">{currentPeriod?.name || 'Current'}</Badge>
                      </div>
                      
                      <div className="space-y-3">
                        {financialSummary?.periodData?.slice(0, 4).map((period, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border rounded">
                            <span className="text-sm">{period.period || `Period ${index + 1}`}</span>
                            <div className="text-right">
                              <div className="font-semibold">${period.revenue?.toFixed(0) || '0'}</div>
                              <div className="text-xs text-muted-foreground">Revenue</div>
                            </div>
                          </div>
                        )) || (
                          <div className="text-center py-4 text-muted-foreground">
                            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No period data available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card data-testid="card-financial-details">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Detailed Financial Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-green-600">Revenue Streams</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Product Sales</span>
                          <span className="font-medium">${(financialSummary?.totalRevenue * 0.8)?.toFixed(0) || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service Revenue</span>
                          <span className="font-medium">${(financialSummary?.totalRevenue * 0.15)?.toFixed(0) || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Other Income</span>
                          <span className="font-medium">${(financialSummary?.totalRevenue * 0.05)?.toFixed(0) || '0'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-semibold text-red-600">Expense Categories</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Cost of Goods</span>
                          <span className="font-medium">${(financialSummary?.totalExpenses * 0.6)?.toFixed(0) || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Operating Expenses</span>
                          <span className="font-medium">${(financialSummary?.totalExpenses * 0.25)?.toFixed(0) || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Administrative</span>
                          <span className="font-medium">${(financialSummary?.totalExpenses * 0.15)?.toFixed(0) || '0'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-semibold text-blue-600">Key Ratios</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Current Ratio</span>
                          <span className="font-medium">1.5:1</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Debt-to-Equity</span>
                          <span className="font-medium">0.3:1</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ROI</span>
                          <span className="font-medium">{((financialSummary?.netIncome || 0) / Math.max(financialSummary?.totalRevenue || 1, 1) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="trading" className="space-y-6">
          {isLoadingTrading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading trading reports...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Orders"
                  value={tradingActivity?.stats?.totalOrders || 0}
                  currency="count"
                  change="+12 this month"
                  icon={Package}
                  trend="up"
                  color="blue"
                />
                <MetricCard
                  title="Completed Orders"
                  value={tradingActivity?.stats?.completedOrders || 0}
                  currency="count"
                  change={`${((tradingActivity?.stats?.completedOrders || 0) / Math.max(tradingActivity?.stats?.totalOrders || 1, 1) * 100).toFixed(1)}% rate`}
                  icon={CheckCircle}
                  trend="up"
                  color="green"
                />
                <MetricCard
                  title="Average Order Value"
                  value={tradingActivity?.stats?.averageOrderValue?.toFixed(2) || '0.00'}
                  currency="$"
                  change="+8.5%"
                  icon={DollarSign}
                  trend="up"
                  color="purple"
                />
                <MetricCard
                  title="Fulfillment Rate"
                  value={`${tradingActivity?.orderFulfillment?.fulfillmentRate?.toFixed(1) || '0.0'}%`}
                  currency="count"
                  change={`${tradingActivity?.orderFulfillment?.avgDeliveryTime?.toFixed(0) || '0'} days avg`}
                  icon={Truck}
                  trend="up"
                  color="orange"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card data-testid="card-order-statistics">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Order Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-blue-600" data-testid="text-pending-orders">
                            {tradingActivity?.stats?.pendingOrders || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Pending Orders</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <div className="text-2xl font-bold text-red-600" data-testid="text-cancelled-orders">
                            {tradingActivity?.stats?.cancelledOrders || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Cancelled Orders</div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Order Success Rate</span>
                          <span className="font-bold text-green-600">
                            {((tradingActivity?.stats?.completedOrders || 0) / Math.max(tradingActivity?.stats?.totalOrders || 1, 1) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={(tradingActivity?.stats?.completedOrders || 0) / Math.max(tradingActivity?.stats?.totalOrders || 1, 1) * 100} 
                          className="h-2" 
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">On-Time Delivery</span>
                          <span className="font-bold text-blue-600">
                            {tradingActivity?.orderFulfillment?.onTimeDelivery?.toFixed(1) || '0.0'}%
                          </span>
                        </div>
                        <Progress 
                          value={tradingActivity?.orderFulfillment?.onTimeDelivery || 0} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-top-customers">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Top Customers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tradingActivity?.topCustomers?.slice(0, 5).map((customer, index) => (
                        <div key={customer.customerId} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`top-customer-${index}`}>
                          <div className="space-y-1">
                            <div className="font-medium">{customer.customerName}</div>
                            <div className="text-sm text-muted-foreground">
                              {customer.orderCount} orders
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              ${customer.totalValue?.toFixed(2) || '0.00'}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Value</div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No customer data available.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card data-testid="card-recent-trading-activity">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Trading Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tradingActivity?.recentActivity?.slice(0, 10).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`trading-activity-${index}`}>
                        <div className="space-y-1">
                          <div className="font-medium">{activity.orderNumber || `Order #${index + 1}`}</div>
                          <div className="text-sm text-muted-foreground">
                            {activity.customerName || 'Customer'} • {new Date(activity.date || Date.now()).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-bold">${activity.value?.toFixed(2) || '0.00'}</div>
                            <div className="text-sm text-muted-foreground">{activity.status || 'Completed'}</div>
                          </div>
                          <StatusBadge status={activity.status || 'completed'} />
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No recent trading activity found.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {isLoadingInventory ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading inventory reports...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Stock Value"
                  value={inventoryAnalytics?.totalStockValue?.toFixed(2) || '0.00'}
                  currency="$"
                  change="+5.2%"
                  icon={Database}
                  trend="up"
                  color="blue"
                />
                <MetricCard
                  title="Stock Turnover"
                  value={`${inventoryAnalytics?.stockTurnover?.toFixed(1) || '0.0'}x`}
                  currency="count"
                  change="+0.3x this month"
                  icon={RefreshCw}
                  trend="up"
                  color="green"
                />
                <MetricCard
                  title="Quality Pass Rate"
                  value={`${inventoryAnalytics?.qualityMetrics?.passRate?.toFixed(1) || '0.0'}%`}
                  currency="count"
                  change="+2.1%"
                  icon={Star}
                  trend="up"
                  color="purple"
                />
                <MetricCard
                  title="Damage Rate"
                  value={`${inventoryAnalytics?.qualityMetrics?.damageRate?.toFixed(1) || '0.0'}%`}
                  currency="count"
                  change="-0.5%"
                  icon={AlertTriangle}
                  trend="down"
                  color="orange"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card data-testid="card-warehouse-utilization">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Factory className="h-5 w-5" />
                      Warehouse Utilization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">First Warehouse</span>
                          <span className="font-bold text-blue-600" data-testid="text-first-warehouse-util">
                            {inventoryAnalytics?.warehouseUtilization?.firstWarehouse?.toFixed(1) || '0.0'}%
                          </span>
                        </div>
                        <Progress value={inventoryAnalytics?.warehouseUtilization?.firstWarehouse || 0} className="h-2" />
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Final Warehouse</span>
                          <span className="font-bold text-green-600" data-testid="text-final-warehouse-util">
                            {inventoryAnalytics?.warehouseUtilization?.finalWarehouse?.toFixed(1) || '0.0'}%
                          </span>
                        </div>
                        <Progress value={inventoryAnalytics?.warehouseUtilization?.finalWarehouse || 0} className="h-2" />
                      </div>
                      
                      <Separator />
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {Math.round((inventoryAnalytics?.warehouseUtilization?.firstWarehouse || 0) / 100 * 1000)}
                          </div>
                          <div className="text-muted-foreground">First (kg)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {Math.round((inventoryAnalytics?.warehouseUtilization?.finalWarehouse || 0) / 100 * 800)}
                          </div>
                          <div className="text-muted-foreground">Final (kg)</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-quality-metrics">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Quality Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 border rounded-lg">
                          <div className="text-2xl font-bold text-green-600" data-testid="text-quality-pass-rate">
                            {inventoryAnalytics?.qualityMetrics?.passRate?.toFixed(1) || '0.0'}%
                          </div>
                          <div className="text-sm text-muted-foreground">Pass Rate</div>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <div className="text-2xl font-bold text-blue-600" data-testid="text-filter-yield">
                            {inventoryAnalytics?.qualityMetrics?.avgFilterYield?.toFixed(1) || '0.0'}%
                          </div>
                          <div className="text-sm text-muted-foreground">Filter Yield</div>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <div className="text-2xl font-bold text-orange-600" data-testid="text-damage-rate">
                            {inventoryAnalytics?.qualityMetrics?.damageRate?.toFixed(1) || '0.0'}%
                          </div>
                          <div className="text-sm text-muted-foreground">Damage Rate</div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <h4 className="font-medium">Quality Targets</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Target Pass Rate</span>
                            <span className="text-green-600 font-medium">≥95%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Target Filter Yield</span>
                            <span className="text-blue-600 font-medium">≥85%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max Damage Rate</span>
                            <span className="text-orange-600 font-medium">≤3%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card data-testid="card-top-moving-items">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Top Moving Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {inventoryAnalytics?.topMovingItems?.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`moving-item-${index}`}>
                          <div className="space-y-1">
                            <div className="font-medium">{item.itemName || `Item ${index + 1}`}</div>
                            <div className="text-sm text-muted-foreground">
                              SKU: {item.sku || `SKU-${index + 1}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">
                              {item.quantity?.toFixed(0) || '0'} kg
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ${item.value?.toFixed(2) || '0.00'}
                            </div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No moving items data available.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-low-stock-alerts">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Low Stock Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {inventoryAnalytics?.lowStockAlerts?.slice(0, 5).map((alert, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-900/10" data-testid={`low-stock-alert-${index}`}>
                          <div className="space-y-1">
                            <div className="font-medium">{alert.itemName || `Item ${index + 1}`}</div>
                            <div className="text-sm text-muted-foreground">
                              Current: {alert.currentStock?.toFixed(0) || '0'} kg
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-orange-600">
                              {alert.reorderPoint?.toFixed(0) || '0'} kg
                            </div>
                            <div className="text-sm text-muted-foreground">Reorder Point</div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                          <p>All items are sufficiently stocked.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {isLoadingSuppliers ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading performance reports...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Avg Reliability"
                  value={`${supplierPerformance?.performanceMetrics?.avgReliability?.toFixed(1) || '0.0'}%`}
                  currency="count"
                  change="+2.1%"
                  icon={Target}
                  trend="up"
                  color="blue"
                />
                <MetricCard
                  title="Avg Quality Score"
                  value={`${supplierPerformance?.performanceMetrics?.avgQuality?.toFixed(1) || '0.0'}%`}
                  currency="count"
                  change="+1.5%"
                  icon={Star}
                  trend="up"
                  color="green"
                />
                <MetricCard
                  title="On-Time Delivery"
                  value={`${supplierPerformance?.performanceMetrics?.onTimeDelivery?.toFixed(1) || '0.0'}%`}
                  currency="count"
                  change="+3.2%"
                  icon={Clock}
                  trend="up"
                  color="purple"
                />
                <MetricCard
                  title="Total Suppliers"
                  value={supplierPerformance?.topSuppliers?.length || 0}
                  currency="count"
                  change="+2 active"
                  icon={Building}
                  trend="up"
                  color="orange"
                />
              </div>

              <Card data-testid="card-supplier-performance">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Supplier Performance Rankings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {supplierPerformance?.topSuppliers?.slice(0, 10).map((supplier, index) => (
                      <div key={supplier.supplierId} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`supplier-performance-${index}`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{supplier.supplierName}</span>
                            <Badge variant={index < 3 ? 'default' : 'secondary'}>
                              #{index + 1}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {supplier.totalPurchases} purchases • Avg delivery: {supplier.avgDeliveryTime?.toFixed(0) || '0'} days
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-blue-600">
                              {supplier.reliability?.toFixed(1) || '0.0'}%
                            </div>
                            <div className="text-xs text-muted-foreground">Reliability</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-600">
                              {supplier.qualityScore?.toFixed(1) || '0.0'}%
                            </div>
                            <div className="text-xs text-muted-foreground">Quality</div>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-muted-foreground">
                        <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No supplier performance data available.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card data-testid="card-performance-trends">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5" />
                      Performance Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Reliability Trend</span>
                          <span className="text-blue-600 font-medium">↗ Improving</span>
                        </div>
                        <Progress value={supplierPerformance?.performanceMetrics?.avgReliability || 0} className="h-2" />
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Quality Trend</span>
                          <span className="text-green-600 font-medium">↗ Improving</span>
                        </div>
                        <Progress value={supplierPerformance?.performanceMetrics?.avgQuality || 0} className="h-2" />
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Delivery Performance</span>
                          <span className="text-purple-600 font-medium">↗ Improving</span>
                        </div>
                        <Progress value={supplierPerformance?.performanceMetrics?.onTimeDelivery || 0} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-risk-analysis">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Risk Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {supplierPerformance?.riskAnalysis?.slice(0, 5).map((risk, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`risk-analysis-${index}`}>
                          <div className="space-y-1">
                            <div className="font-medium">{risk.supplier || `Supplier ${index + 1}`}</div>
                            <div className="text-sm text-muted-foreground">
                              {risk.riskType || 'Performance Risk'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={risk.level === 'high' ? 'destructive' : risk.level === 'medium' ? 'default' : 'secondary'}>
                              {risk.level || 'Low'} Risk
                            </Badge>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                          <p>No high-risk suppliers identified.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Overall Score"
              value={`${complianceDashboard?.overallScore || 0}%`}
              currency="count"
              change={complianceDashboard?.overallScore >= 90 ? '+2.1%' : 'Needs attention'}
              icon={Shield}
              trend={complianceDashboard?.overallScore >= 90 ? 'up' : 'neutral'}
              color="green"
            />
            <MetricCard
              title="Expiring Documents"
              value={complianceDashboard?.expiringDocuments || 0}
              currency="count"
              change="Next 30 days"
              icon={FileText}
              trend={complianceDashboard?.expiringDocuments > 5 ? 'up' : 'neutral'}
              color="orange"
            />
            <MetricCard
              title="Pending Approvals"
              value={complianceDashboard?.pendingApprovals || 0}
              currency="count"
              change="Requires action"
              icon={Clock}
              trend={complianceDashboard?.pendingApprovals > 0 ? 'up' : 'neutral'}
              color="blue"
            />
            <MetricCard
              title="Recent Alerts"
              value={complianceDashboard?.recentAlerts?.length || 0}
              currency="count"
              change="Last 7 days"
              icon={Bell}
              trend={complianceDashboard?.recentAlerts?.length > 3 ? 'up' : 'neutral'}
              color="red"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-compliance-areas">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Compliance Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceDashboard?.complianceAreas?.map((area, index) => (
                    <div key={index} className="space-y-2" data-testid={`compliance-area-${index}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{area.area}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{area.score}%</span>
                          <StatusBadge status={area.status} />
                        </div>
                      </div>
                      <Progress value={area.score} className="h-2" />
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No compliance area data available.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-recent-compliance-alerts">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Recent Compliance Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceDashboard?.recentAlerts?.slice(0, 5).map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`compliance-alert-${index}`}>
                      <div className="space-y-1">
                        <div className="font-medium">{alert.title || `Alert ${index + 1}`}</div>
                        <div className="text-sm text-muted-foreground">
                          {alert.description || 'Compliance issue detected'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'default' : 'secondary'}>
                          {alert.severity || 'Low'}
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                      <p>No recent compliance alerts.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-compliance-checklist">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Compliance Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-green-600">Completed Items</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 border rounded text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Financial period reconciliation</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 border rounded text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Supplier verification documents</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 border rounded text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Inventory audit compliance</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 border rounded text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Quality control documentation</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-orange-600">Pending Items</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 border rounded text-sm">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span>Annual regulatory filing</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 border rounded text-sm">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span>Export license renewal</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 border rounded text-sm">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span>Employee training records</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 border rounded text-sm">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span>Insurance policy update</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...exportForm}>
                  <form onSubmit={exportForm.handleSubmit((data) => exportReportMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={exportForm.control as any}
                      name="reportType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Report Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-export-report-type">
                                <SelectValue placeholder="Select report type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="financial_summary">Financial Summary</SelectItem>
                              <SelectItem value="trading_activity">Trading Activity</SelectItem>
                              <SelectItem value="inventory_analytics">Inventory Analytics</SelectItem>
                              <SelectItem value="supplier_performance">Supplier Performance</SelectItem>
                              <SelectItem value="compliance_dashboard">Compliance Dashboard</SelectItem>
                              <SelectItem value="executive_summary">Executive Summary</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={exportForm.control as any}
                        name="format"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Format</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-export-format">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                                <SelectItem value="csv">CSV</SelectItem>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="json">JSON</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={exportForm.control as any}
                        name="filters.period"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Period</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-export-period">
                                  <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="current">Current Period</SelectItem>
                                <SelectItem value="last_month">Last Month</SelectItem>
                                <SelectItem value="last_quarter">Last Quarter</SelectItem>
                                <SelectItem value="last_year">Last Year</SelectItem>
                                <SelectItem value="custom">Custom Range</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={exportForm.control as any}
                      name="emailTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email To (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email" 
                              placeholder="recipient@example.com"
                              data-testid="input-export-email"
                            />
                          </FormControl>
                          <FormDescription>
                            Leave empty to download directly
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={exportForm.control as any}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Additional notes for this export..."
                              data-testid="textarea-export-note"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={exportReportMutation.isPending} data-testid="button-export-report">
                      {exportReportMutation.isPending ? 'Exporting...' : 'Export Report'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...scheduledReportForm}>
                  <form onSubmit={scheduledReportForm.handleSubmit((data) => createScheduledReportMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={scheduledReportForm.control as any}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Report Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Monthly Financial Report"
                              data-testid="input-scheduled-report-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={scheduledReportForm.control as any}
                        name="reportType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Report Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-scheduled-report-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="financial_summary">Financial Summary</SelectItem>
                                <SelectItem value="trading_activity">Trading Activity</SelectItem>
                                <SelectItem value="inventory_analytics">Inventory Analytics</SelectItem>
                                <SelectItem value="supplier_performance">Supplier Performance</SelectItem>
                                <SelectItem value="compliance_dashboard">Compliance Dashboard</SelectItem>
                                <SelectItem value="executive_summary">Executive Summary</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={scheduledReportForm.control as any}
                        name="frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequency</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-scheduled-frequency">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={scheduledReportForm.control as any}
                      name="emailTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email To</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email" 
                              placeholder="recipient@example.com"
                              data-testid="input-scheduled-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={scheduledReportForm.control as any}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Description of scheduled report..."
                              data-testid="textarea-scheduled-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={createScheduledReportMutation.isPending} data-testid="button-create-scheduled-report">
                      {createScheduledReportMutation.isPending ? 'Creating...' : 'Create Scheduled Report'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-export-history">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Export History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exportJobs.slice(0, 10).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`export-job-${job.id}`}>
                    <div className="space-y-1">
                      <div className="font-medium">{job.reportType.replace('_', ' ').toUpperCase()}</div>
                      <div className="text-sm text-muted-foreground">
                        {job.format.toUpperCase()} • Requested: {new Date(job.requestedAt).toLocaleDateString()}
                        {job.completedAt && ` • Completed: ${new Date(job.completedAt).toLocaleDateString()}`}
                        {job.emailTo && ` • Sent to: ${job.emailTo}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={job.status} />
                      {job.downloadUrl && job.status === 'completed' && (
                        <Button size="sm" variant="outline" data-testid={`button-download-job-${job.id}`}>
                          <Download className="mr-1 h-3 w-3" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {exportJobs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No export jobs found.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}