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
import {
  insertRevenueTransactionSchema,
  insertWithdrawalRecordSchema,
  insertReinvestmentSchema,
  insertSalesOrderSchema,
  insertCustomerSchema
} from '@shared/schema';
import { 
  DollarSign, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  CreditCard, 
  Receipt, 
  RefreshCw, 
  Plus, 
  Eye, 
  Edit, 
  Download, 
  ArrowUpRight,
  ArrowDownRight,
  BarChart3, 
  PieChart,
  Activity,
  Building,
  User,
  Calendar,
  Filter,
  Search,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Minus,
  ArrowRightLeft,
  Target,
  Percent
} from 'lucide-react';

// Schemas aligned with shared schema field names and types
const customerReceiptSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  salesOrderId: z.string().optional(),
  type: z.literal('payment').default('payment'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'credit_card', 'check', 'trade_credit']).default('bank_transfer'),
  paymentReference: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  notes: z.string().optional(),
});

const customerRefundSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  salesOrderId: z.string().optional(),
  type: z.literal('refund').default('refund'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'credit_card', 'check', 'trade_credit']).default('bank_transfer'),
  paymentReference: z.string().optional(),
  description: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
});

const withdrawalRequestSchema = z.object({
  partner: z.string().min(1, 'Partner name is required'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  paymentMethod: z.enum(['bank_transfer', 'cash', 'check']).default('bank_transfer'),
  bankAccount: z.string().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
});

const reinvestmentSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  transferCost: z.string().default('0'),
  feeCurrency: z.string().default('USD'),
  feeExchangeRate: z.string().optional(),
  allocationPolicy: z.enum(['aggregate', 'pro_rata', 'specified']).default('aggregate'),
  note: z.string().optional(),
  counterparty: z.string().optional(),
  bankReference: z.string().optional(),
});

const salesOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  orderDate: z.string().optional(),
  requestedDeliveryDate: z.string().optional(),
  currency: z.string().default('USD'),
  exchangeRate: z.string().optional(),
  paymentTerms: z.enum(['net_15', 'net_30', 'net_45', 'net_60', 'cash_on_delivery', 'advance_payment', 'credit']).default('net_30'),
  shippingAddress: z.string().optional(),
  shippingMethod: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type Customer = {
  id: string;
  customerNumber: string;
  name: string;
  tradeName?: string;
  category: string;
  email?: string;
  phone?: string;
  totalOrdersCount: number;
  totalRevenueUsd: string;
  averageOrderValueUsd: string;
  currentCredit: string;
  creditLimit: string;
  isActive: boolean;
  lastOrderDate?: string;
};

type SalesOrder = {
  id: string;
  salesOrderNumber: string;
  customerId: string;
  status: string;
  orderDate: string;
  totalAmount: string;
  totalAmountUsd: string;
  amountPaid: string;
  balanceDue: string;
  currency: string;
  paymentTerms: string;
  requestedDeliveryDate?: string;
  confirmedDeliveryDate?: string;
  deliveredAt?: string;
};

type RevenueTransaction = {
  id: string;
  revEntryId: string;
  date: string;
  type: string;
  amount: string;
  amountUsd: string;
  currency: string;
  customerId?: string;
  salesOrderId?: string;
  description: string;
  accountingPeriod: string;
};

type WithdrawalRecord = {
  id: string;
  withdrawalId: string;
  partner: string;
  amount: string;
  amountUsd: string;
  currency: string;
  purpose: string;
  status: string;
  paymentMethod: string;
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
};

type Reinvestment = {
  id: string;
  reinvestId: string;
  amount: string;
  amountUsd: string;
  currency: string;
  transferCost?: string;
  reinvestmentType: string;
  purpose: string;
  status: string;
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    fulfilled: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  
  return (
    <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  );
};

const RevenueMetricCard = ({ title, value, currency, change, icon: Icon, trend }: {
  title: string;
  value: string | number;
  currency?: string;
  change?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
}) => {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;

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
          <div className={`p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20`}>
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function RevenueManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [customerFilter, setCustomerFilter] = useState({ category: '', isActive: 'true' });
  const [orderFilter, setOrderFilter] = useState({ status: '', customerId: '' });
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms
  const receiptForm = useForm({
    resolver: zodResolver(customerReceiptSchema),
    defaultValues: {
      customerId: '',
      salesOrderId: '',
      type: 'payment' as const,
      amount: '',
      currency: 'USD',
      exchangeRate: '',
      paymentMethod: 'bank_transfer' as const,
      paymentReference: '',
      description: '',
      notes: '',
    }
  });

  const refundForm = useForm({
    resolver: zodResolver(customerRefundSchema),
    defaultValues: {
      customerId: '',
      salesOrderId: '',
      type: 'refund' as const,
      amount: '',
      currency: 'USD',
      exchangeRate: '',
      paymentMethod: 'bank_transfer' as const,
      paymentReference: '',
      description: '',
      notes: '',
    }
  });

  const withdrawalForm = useForm({
    resolver: zodResolver(withdrawalRequestSchema),
    defaultValues: {
      partner: '',
      amount: '',
      currency: 'USD',
      exchangeRate: '',
      paymentMethod: 'bank_transfer' as const,
      bankAccount: '',
      reference: '',
      note: '',
    }
  });

  const reinvestmentForm = useForm({
    resolver: zodResolver(reinvestmentSchema),
    defaultValues: {
      amount: '',
      transferCost: '0',
      feeCurrency: 'USD',
      feeExchangeRate: '',
      allocationPolicy: 'aggregate' as const,
      note: '',
      counterparty: '',
      bankReference: '',
    }
  });

  const salesOrderForm = useForm({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: {
      customerId: '',
      orderDate: '',
      requestedDeliveryDate: '',
      currency: 'USD',
      exchangeRate: '',
      paymentTerms: 'net_30' as const,
      shippingAddress: '',
      shippingMethod: '',
      reference: '',
      notes: '',
    }
  });

  // Queries
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['/api/customers', customerFilter],
    refetchInterval: 30000, // Refresh every 30 seconds
  }) as { data: Customer[], isLoading: boolean };

  const { data: salesOrders = [], isLoading: isLoadingSalesOrders } = useQuery({
    queryKey: ['/api/sales-orders', orderFilter],
    refetchInterval: 30000,
  }) as { data: SalesOrder[], isLoading: boolean };

  const { data: revenueTransactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['/api/revenue/transactions'],
  }) as { data: RevenueTransaction[], isLoading: boolean };

  const { data: revenueLedger = [] } = useQuery({
    queryKey: ['/api/revenue/ledger'],
  }) as { data: any[] };

  const { data: withdrawalRecords = [] } = useQuery({
    queryKey: ['/api/revenue/withdrawals'],
  }) as { data: WithdrawalRecord[] };

  const { data: reinvestments = [] } = useQuery({
    queryKey: ['/api/revenue/reinvestments'],
  }) as { data: Reinvestment[] };

  const { data: revenueAnalytics } = useQuery({
    queryKey: ['/api/revenue/analytics'],
  }) as { data: any };

  const { data: revenueBalance } = useQuery({
    queryKey: ['/api/revenue/balance'],
  }) as { data: any };

  // Mutations
  const createReceiptMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/revenue/customer-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: 'Customer receipt recorded successfully!' });
      receiptForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/revenue'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to record receipt', description: error.message, variant: 'destructive' });
    }
  });

  const createRefundMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/revenue/customer-refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: 'Customer refund processed successfully!' });
      refundForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/revenue'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to process refund', description: error.message, variant: 'destructive' });
    }
  });

  const createWithdrawalMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/revenue/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: 'Withdrawal request submitted successfully!' });
      withdrawalForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/revenue/withdrawals'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to submit withdrawal', description: error.message, variant: 'destructive' });
    }
  });

  const createReinvestmentMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/revenue/reinvestments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: 'Reinvestment request submitted successfully!' });
      reinvestmentForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/revenue/reinvestments'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to submit reinvestment', description: error.message, variant: 'destructive' });
    }
  });

  const createSalesOrderMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/sales-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: 'Sales order created successfully!' });
      salesOrderForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/sales-orders'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create sales order', description: error.message, variant: 'destructive' });
    }
  });

  // Calculate totals and metrics
  const totalRevenue = revenueTransactions
    .filter(t => t.type === 'customer_receipt')
    .reduce((sum, t) => sum + parseFloat(t.amountUsd), 0);

  const totalRefunds = revenueTransactions
    .filter(t => t.type === 'customer_refund')
    .reduce((sum, t) => sum + parseFloat(t.amountUsd), 0);

  const totalWithdrawals = withdrawalRecords
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + parseFloat(w.amountUsd), 0);

  const totalReinvestments = reinvestments
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + parseFloat(r.amountUsd), 0);

  const netRevenue = totalRevenue - totalRefunds - totalWithdrawals;
  const activeCustomers = customers.filter(c => c.isActive).length;
  const pendingOrdersValue = salesOrders
    .filter(o => o.status === 'confirmed')
    .reduce((sum, o) => sum + parseFloat(o.totalAmountUsd), 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="title-revenue-management">Revenue Management</h1>
          <p className="text-muted-foreground">Comprehensive customer collections, withdrawals, reinvestments, and revenue tracking</p>
        </div>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh All
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customers">Customers</TabsTrigger>
          <TabsTrigger value="sales" data-testid="tab-sales">Sales Orders</TabsTrigger>
          <TabsTrigger value="collections" data-testid="tab-collections">Collections</TabsTrigger>
          <TabsTrigger value="withdrawals" data-testid="tab-withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="reinvestments" data-testid="tab-reinvestments">Reinvestments</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <RevenueMetricCard
              title="Total Revenue"
              value={totalRevenue.toFixed(2)}
              currency="$"
              change="+12.5%"
              icon={DollarSign}
              trend="up"
            />
            <RevenueMetricCard
              title="Net Revenue"
              value={netRevenue.toFixed(2)}
              currency="$"
              change="+8.2%"
              icon={TrendingUp}
              trend="up"
            />
            <RevenueMetricCard
              title="Active Customers"
              value={activeCustomers}
              currency="count"
              change="+3"
              icon={Users}
              trend="up"
            />
            <RevenueMetricCard
              title="Pending Orders"
              value={pendingOrdersValue.toFixed(2)}
              currency="$"
              change="+15.3%"
              icon={ShoppingCart}
              trend="up"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card data-testid="card-recent-revenue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Recent Revenue Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`revenue-transaction-${transaction.id}`}>
                      <div className="space-y-1">
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.type.replace('_', ' ').toUpperCase()} • {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          ${parseFloat(transaction.amountUsd).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.currency !== 'USD' && `${transaction.amount} ${transaction.currency}`}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {revenueTransactions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No revenue transactions found.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-revenue-balance">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Revenue Balance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Current Revenue Balance</span>
                    <span className="text-2xl font-bold text-blue-600" data-testid="text-current-balance">
                      ${revenueBalance?.currentBalance?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Receipts</span>
                      <span className="font-semibold text-green-600" data-testid="text-total-receipts">
                        ${totalRevenue.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Refunds</span>
                      <span className="font-semibold text-red-600" data-testid="text-total-refunds">
                        -${totalRefunds.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Withdrawals</span>
                      <span className="font-semibold text-orange-600" data-testid="text-total-withdrawals">
                        -${totalWithdrawals.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Reinvestments</span>
                      <span className="font-semibold text-blue-600" data-testid="text-total-reinvestments">
                        -${totalReinvestments.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Available for Withdrawal</span>
                    <span className="text-lg font-bold text-green-600" data-testid="text-available-balance">
                      ${Math.max(0, netRevenue).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card data-testid="card-pending-approvals">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Pending Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Withdrawal Requests</span>
                    <Badge variant="secondary" data-testid="badge-pending-withdrawals">
                      {withdrawalRecords.filter(w => w.status === 'pending').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Reinvestment Requests</span>
                    <Badge variant="secondary" data-testid="badge-pending-reinvestments">
                      {reinvestments.filter(r => r.status === 'pending').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Large Orders</span>
                    <Badge variant="secondary" data-testid="badge-large-orders">
                      {salesOrders.filter(o => o.status === 'draft' && parseFloat(o.totalAmountUsd) > 10000).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-customer-metrics">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-blue-500" />
                  Customer Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Top Customer Revenue</span>
                    <span className="font-semibold" data-testid="text-top-customer-revenue">
                      ${Math.max(...customers.map(c => parseFloat(c.totalRevenueUsd)), 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average Order Value</span>
                    <span className="font-semibold" data-testid="text-average-order-value">
                      ${(totalRevenue / Math.max(salesOrders.length, 1)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Credit Utilization</span>
                    <span className="font-semibold text-orange-600" data-testid="text-credit-utilization">
                      {((customers.reduce((sum, c) => sum + parseFloat(c.currentCredit), 0) / 
                         customers.reduce((sum, c) => sum + parseFloat(c.creditLimit), 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-payment-terms">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-green-500" />
                  Payment Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Immediate Payment</span>
                    <span className="font-semibold" data-testid="text-immediate-payment">
                      {salesOrders.filter(o => o.paymentTerms === 'immediate').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Net 30 Days</span>
                    <span className="font-semibold" data-testid="text-net30-payment">
                      {salesOrders.filter(o => o.paymentTerms === 'net_30').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Advance Payment</span>
                    <span className="font-semibold text-green-600" data-testid="text-advance-payment">
                      {salesOrders.filter(o => o.paymentTerms === 'advance').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Management
              </CardTitle>
              <div className="flex gap-4">
                <Select value={customerFilter.category} onValueChange={(value) => setCustomerFilter({...customerFilter, category: value})}>
                  <SelectTrigger className="w-48" data-testid="select-customer-category">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                    <SelectItem value="export">Export</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={customerFilter.isActive} onValueChange={(value) => setCustomerFilter({...customerFilter, isActive: value})}>
                  <SelectTrigger className="w-48" data-testid="select-customer-status">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Customers</SelectItem>
                    <SelectItem value="true">Active Only</SelectItem>
                    <SelectItem value="false">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingCustomers ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading customers...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {customers.map((customer: Customer) => (
                    <div key={customer.id} className="border rounded-lg p-4 space-y-3" data-testid={`customer-item-${customer.id}`}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{customer.name}</h3>
                            <Badge variant="outline">{customer.category.toUpperCase()}</Badge>
                            <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                              {customer.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Customer #: {customer.customerNumber}
                            {customer.tradeName && ` | ${customer.tradeName}`}
                          </p>
                          <div className="flex gap-4 text-sm">
                            {customer.email && <span>📧 {customer.email}</span>}
                            {customer.phone && <span>📞 {customer.phone}</span>}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-lg font-bold text-green-600">
                            ${parseFloat(customer.totalRevenueUsd).toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total Revenue
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Orders:</span>
                          <div>{customer.totalOrdersCount}</div>
                        </div>
                        <div>
                          <span className="font-medium">Avg Order:</span>
                          <div>${parseFloat(customer.averageOrderValueUsd).toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="font-medium">Credit Used:</span>
                          <div className={parseFloat(customer.currentCredit) > parseFloat(customer.creditLimit) * 0.8 ? 'text-orange-600 font-semibold' : ''}>
                            ${parseFloat(customer.currentCredit).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Credit Limit:</span>
                          <div>${parseFloat(customer.creditLimit).toFixed(2)}</div>
                        </div>
                      </div>
                      
                      {customer.lastOrderDate && (
                        <div className="text-sm text-muted-foreground">
                          Last Order: {new Date(customer.lastOrderDate).toLocaleDateString()}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedCustomer(customer.id)} data-testid={`button-view-customer-${customer.id}`}>
                          <Eye className="mr-1 h-3 w-3" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-new-order-${customer.id}`}>
                          <Plus className="mr-1 h-3 w-3" />
                          New Order
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-record-payment-${customer.id}`}>
                          <Receipt className="mr-1 h-3 w-3" />
                          Record Payment
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {customers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No customers found matching your filters.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Sales Order Management
              </CardTitle>
              <div className="flex gap-4">
                <Select value={orderFilter.status} onValueChange={(value) => setOrderFilter({...orderFilter, status: value})}>
                  <SelectTrigger className="w-48" data-testid="select-order-status">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="fulfilled">Fulfilled</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={orderFilter.customerId} onValueChange={(value) => setOrderFilter({...orderFilter, customerId: value})}>
                  <SelectTrigger className="w-48" data-testid="select-order-customer">
                    <SelectValue placeholder="Filter by customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Customers</SelectItem>
                    {customers.slice(0, 20).map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSalesOrders ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading sales orders...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {salesOrders.map((order: SalesOrder) => {
                    const customer = customers.find(c => c.id === order.customerId);
                    const paymentProgress = (parseFloat(order.amountPaid) / parseFloat(order.totalAmountUsd)) * 100;
                    
                    return (
                      <div key={order.id} className="border rounded-lg p-4 space-y-3" data-testid={`sales-order-${order.id}`}>
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">Order: {order.salesOrderNumber}</h3>
                              <StatusBadge status={order.status} />
                              <Badge variant="outline">{order.paymentTerms.replace('_', ' ').toUpperCase()}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Customer: {customer?.name || 'Unknown'} | 
                              Ordered: {new Date(order.orderDate).toLocaleDateString()}
                              {order.requestedDeliveryDate && ` | Delivery: ${new Date(order.requestedDeliveryDate).toLocaleDateString()}`}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-lg font-bold">
                              ${parseFloat(order.totalAmountUsd).toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {order.currency !== 'USD' && `${order.totalAmount} ${order.currency}`}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Payment Progress</span>
                            <span>{paymentProgress.toFixed(1)}% (${parseFloat(order.amountPaid).toFixed(2)} / ${parseFloat(order.totalAmountUsd).toFixed(2)})</span>
                          </div>
                          <Progress value={paymentProgress} className="h-2" />
                          {parseFloat(order.balanceDue) > 0 && (
                            <div className="text-sm text-orange-600 font-medium">
                              Balance Due: ${parseFloat(order.balanceDue).toFixed(2)}
                            </div>
                          )}
                        </div>
                        
                        {order.deliveredAt && (
                          <div className="text-sm text-green-600">
                            ✅ Delivered on {new Date(order.deliveredAt).toLocaleDateString()}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order.id)} data-testid={`button-view-order-${order.id}`}>
                            <Eye className="mr-1 h-3 w-3" />
                            View Details
                          </Button>
                          {order.status === 'draft' && (
                            <Button size="sm" variant="outline" data-testid={`button-confirm-order-${order.id}`}>
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Confirm Order
                            </Button>
                          )}
                          {parseFloat(order.balanceDue) > 0 && (
                            <Button size="sm" variant="outline" data-testid={`button-record-payment-order-${order.id}`}>
                              <CreditCard className="mr-1 h-3 w-3" />
                              Record Payment
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {salesOrders.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No sales orders found matching your filters.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collections" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Record Customer Receipt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...receiptForm}>
                  <form onSubmit={receiptForm.handleSubmit((data) => createReceiptMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={receiptForm.control as any}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-receipt-customer">
                                <SelectValue placeholder="Select customer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.name} ({customer.customerNumber})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={receiptForm.control as any}
                      name="salesOrderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sales Order (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-receipt-order">
                                <SelectValue placeholder="Link to specific order" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">No specific order</SelectItem>
                              {salesOrders.slice(0, 20).map((order) => (
                                <SelectItem key={order.id} value={order.id}>
                                  {order.salesOrderNumber} - ${parseFloat(order.totalAmountUsd).toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={receiptForm.control as any}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00"
                                data-testid="input-receipt-amount"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={receiptForm.control as any}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-receipt-currency">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="ETB">ETB</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={receiptForm.control as any}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-receipt-payment-method">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="check">Check</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="mobile_money">Mobile Money</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={receiptForm.control as any}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Payment for order #..."
                              data-testid="textarea-receipt-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={receiptForm.control as any}
                      name="reference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Transaction reference, check number, etc."
                              data-testid="input-receipt-reference"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={createReceiptMutation.isPending} data-testid="button-create-receipt">
                      {createReceiptMutation.isPending ? 'Recording...' : 'Record Receipt'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownRight className="h-5 w-5" />
                  Process Customer Refund
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...refundForm}>
                  <form onSubmit={refundForm.handleSubmit((data) => createRefundMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={refundForm.control as any}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-refund-customer">
                                <SelectValue placeholder="Select customer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.name} ({customer.customerNumber})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={refundForm.control as any}
                      name="salesOrderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Related Sales Order (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-refund-order">
                                <SelectValue placeholder="Select related order" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">No specific order</SelectItem>
                              {salesOrders.slice(0, 20).map((order) => (
                                <SelectItem key={order.id} value={order.id}>
                                  {order.salesOrderNumber} - ${parseFloat(order.totalAmountUsd).toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={refundForm.control as any}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Refund Amount</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00"
                                data-testid="input-refund-amount"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={refundForm.control as any}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-refund-currency">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="ETB">ETB</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={refundForm.control as any}
                      name="refundMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Refund Method</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-refund-method">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="check">Check</SelectItem>
                              <SelectItem value="card">Card Refund</SelectItem>
                              <SelectItem value="mobile_money">Mobile Money</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={refundForm.control as any}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Refund Reason</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Reason for refund..."
                              data-testid="textarea-refund-reason"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={createRefundMutation.isPending} data-testid="button-create-refund">
                      {createRefundMutation.isPending ? 'Processing...' : 'Process Refund'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownRight className="h-5 w-5" />
                  Request Partner Withdrawal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...withdrawalForm}>
                  <form onSubmit={withdrawalForm.handleSubmit((data) => createWithdrawalMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={withdrawalForm.control as any}
                      name="partner"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Partner Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter partner/owner name"
                              data-testid="input-withdrawal-partner"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={withdrawalForm.control as any}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Withdrawal Amount</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00"
                                data-testid="input-withdrawal-amount"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={withdrawalForm.control as any}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-withdrawal-currency">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="ETB">ETB</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={withdrawalForm.control as any}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-withdrawal-payment-method">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="check">Check</SelectItem>
                              <SelectItem value="mobile_money">Mobile Money</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={withdrawalForm.control as any}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purpose</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Purpose of withdrawal..."
                              data-testid="textarea-withdrawal-purpose"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={withdrawalForm.control as any}
                      name="bankDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Details (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Bank name, account number, etc."
                              data-testid="textarea-withdrawal-bank-details"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={createWithdrawalMutation.isPending} data-testid="button-create-withdrawal">
                      {createWithdrawalMutation.isPending ? 'Submitting...' : 'Submit Withdrawal Request'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Withdrawals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {withdrawalRecords.slice(0, 5).map((withdrawal) => (
                    <div key={withdrawal.id} className="border rounded p-3 space-y-2" data-testid={`withdrawal-item-${withdrawal.id}`}>
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{withdrawal.withdrawalId}</div>
                        <StatusBadge status={withdrawal.status} />
                      </div>
                      <div className="text-sm">
                        <strong>Partner:</strong> {withdrawal.partner}
                      </div>
                      <div className="text-sm">
                        <strong>Amount:</strong> ${parseFloat(withdrawal.amountUsd).toFixed(2)}
                        {withdrawal.currency !== 'USD' && ` (${withdrawal.amount} ${withdrawal.currency})`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {withdrawal.purpose}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Requested: {new Date(withdrawal.requestedAt).toLocaleDateString()}
                        {withdrawal.approvedAt && ` | Approved: ${new Date(withdrawal.approvedAt).toLocaleDateString()}`}
                        {withdrawal.completedAt && ` | Completed: ${new Date(withdrawal.completedAt).toLocaleDateString()}`}
                      </div>
                      {withdrawal.status === 'pending' && (
                        <Button size="sm" variant="outline" className="w-full" data-testid={`button-approve-withdrawal-${withdrawal.id}`}>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Approve Withdrawal
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {withdrawalRecords.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <ArrowDownRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No withdrawal records found.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reinvestments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Request Reinvestment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...reinvestmentForm}>
                  <form onSubmit={reinvestmentForm.handleSubmit((data) => createReinvestmentMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={reinvestmentForm.control as any}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reinvestment Amount</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00"
                                data-testid="input-reinvestment-amount"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={reinvestmentForm.control as any}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-reinvestment-currency">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="ETB">ETB</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={reinvestmentForm.control as any}
                      name="transferCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transfer Cost (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00"
                              data-testid="input-reinvestment-transfer-cost"
                            />
                          </FormControl>
                          <FormDescription>
                            Bank fees, wire transfer costs, etc.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={reinvestmentForm.control as any}
                      name="reinvestmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reinvestment Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-reinvestment-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="capital_increase">Capital Increase</SelectItem>
                              <SelectItem value="equipment_purchase">Equipment Purchase</SelectItem>
                              <SelectItem value="business_expansion">Business Expansion</SelectItem>
                              <SelectItem value="debt_repayment">Debt Repayment</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={reinvestmentForm.control as any}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purpose</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Detailed purpose of reinvestment..."
                              data-testid="textarea-reinvestment-purpose"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={reinvestmentForm.control as any}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Additional notes or details..."
                              data-testid="textarea-reinvestment-note"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={createReinvestmentMutation.isPending} data-testid="button-create-reinvestment">
                      {createReinvestmentMutation.isPending ? 'Submitting...' : 'Submit Reinvestment Request'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Recent Reinvestments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reinvestments.slice(0, 5).map((reinvestment) => (
                    <div key={reinvestment.id} className="border rounded p-3 space-y-2" data-testid={`reinvestment-item-${reinvestment.id}`}>
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{reinvestment.reinvestId}</div>
                        <StatusBadge status={reinvestment.status} />
                      </div>
                      <div className="text-sm">
                        <strong>Type:</strong> {reinvestment.reinvestmentType.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-sm">
                        <strong>Amount:</strong> ${parseFloat(reinvestment.amountUsd).toFixed(2)}
                        {reinvestment.currency !== 'USD' && ` (${reinvestment.amount} ${reinvestment.currency})`}
                        {reinvestment.transferCost && ` + $${parseFloat(reinvestment.transferCost).toFixed(2)} fees`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {reinvestment.purpose}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Requested: {new Date(reinvestment.requestedAt).toLocaleDateString()}
                        {reinvestment.approvedAt && ` | Approved: ${new Date(reinvestment.approvedAt).toLocaleDateString()}`}
                        {reinvestment.completedAt && ` | Completed: ${new Date(reinvestment.completedAt).toLocaleDateString()}`}
                      </div>
                      {reinvestment.status === 'pending' && (
                        <Button size="sm" variant="outline" className="w-full" data-testid={`button-approve-reinvestment-${reinvestment.id}`}>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Approve Reinvestment
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {reinvestments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No reinvestment records found.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card data-testid="card-revenue-metrics">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Revenue Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Monthly Growth</span>
                    <span className="font-bold text-green-600" data-testid="text-monthly-growth">
                      +{revenueAnalytics?.monthlyGrowth?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Customer Retention</span>
                    <span className="font-semibold text-blue-600" data-testid="text-customer-retention">
                      {revenueAnalytics?.customerRetention?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Collection Rate</span>
                    <span className="font-semibold text-green-600" data-testid="text-collection-rate">
                      {revenueAnalytics?.collectionRate?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-payment-metrics">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Payment Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Average Days to Pay</span>
                    <span className="font-bold" data-testid="text-avg-days-to-pay">
                      {revenueAnalytics?.averageDaysToPay?.toFixed(0) || '0'} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Overdue Percentage</span>
                    <span className="font-semibold text-orange-600" data-testid="text-overdue-percentage">
                      {revenueAnalytics?.overduePercentage?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Credit Utilization</span>
                    <span className="font-semibold text-blue-600" data-testid="text-credit-utilization-analytics">
                      {revenueAnalytics?.creditUtilization?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-efficiency-metrics">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Efficiency Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Revenue per Customer</span>
                    <span className="font-bold" data-testid="text-revenue-per-customer">
                      ${(totalRevenue / Math.max(activeCustomers, 1)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Order Fulfillment Rate</span>
                    <span className="font-semibold text-green-600" data-testid="text-fulfillment-rate">
                      {((salesOrders.filter(o => o.status === 'delivered').length / Math.max(salesOrders.length, 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Return Rate</span>
                    <span className="font-semibold text-orange-600" data-testid="text-return-rate">
                      {((totalRefunds / Math.max(totalRevenue, 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Revenue Performance Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Customer Categories</h3>
                  <div className="space-y-2">
                    {['retail', 'wholesale', 'export', 'direct'].map(category => {
                      const categoryCustomers = customers.filter(c => c.category === category);
                      const categoryRevenue = categoryCustomers.reduce((sum, c) => sum + parseFloat(c.totalRevenueUsd), 0);
                      const percentage = totalRevenue > 0 ? (categoryRevenue / totalRevenue) * 100 : 0;
                      
                      return (
                        <div key={category}>
                          <div className="flex justify-between text-sm">
                            <span>{category.toUpperCase()}</span>
                            <span>${categoryRevenue.toFixed(2)} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Payment Terms Distribution</h3>
                  <div className="space-y-2">
                    {['immediate', 'net_15', 'net_30', 'net_60', 'advance'].map(term => {
                      const termOrders = salesOrders.filter(o => o.paymentTerms === term);
                      const termValue = termOrders.reduce((sum, o) => sum + parseFloat(o.totalAmountUsd), 0);
                      const totalOrderValue = salesOrders.reduce((sum, o) => sum + parseFloat(o.totalAmountUsd), 1);
                      const percentage = (termValue / totalOrderValue) * 100;
                      
                      return (
                        <div key={term}>
                          <div className="flex justify-between text-sm">
                            <span>{term.replace('_', ' ').toUpperCase()}</span>
                            <span>{termOrders.length} orders (${termValue.toFixed(2)})</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}