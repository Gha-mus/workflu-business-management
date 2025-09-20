import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// Using shared schemas for proper validation
import { insertSupplySchema, insertOperatingExpenseSchema, insertSupplyPurchaseSchema, insertSupplyConsumptionSchema, type InsertSupply } from '@shared/schema';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  DollarSign, 
  Package, 
  Users, 
  Building, 
  TrendingUp, 
  AlertTriangle,
  Calculator,
  BarChart3,
  PieChart,
  Calendar,
  FileText,
  ArrowRight,
  Warehouse,
  Clock,
  Percent,
  CheckCircle,
  XCircle,
  Target,
  Activity
} from 'lucide-react';

// Form schemas using shared schema with numeric coercion 
const supplySchema = insertSupplySchema.extend({
  reorderPoint: z.coerce.number().min(0).transform(val => val.toString()),
  unitCostUsd: z.coerce.number().positive().transform(val => val.toString()),
  quantityOnHand: z.coerce.number().min(0).default(0).transform(val => val.toString()),
  minimumStock: z.coerce.number().min(0).default(0).transform(val => val.toString()),
  conversionFactor: z.coerce.number().positive().optional().transform(val => val ? val.toString() : undefined)
});

const operatingExpenseSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('USD'),
  exchangeRate: z.number().positive().optional(),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  fundingSource: z.string().min(1, 'Funding source is required'),
  orderId: z.string().optional(),
  allocationToOrders: z.record(z.number()).optional(),
  expenseDate: z.date().default(() => new Date()),
  periodStart: z.date().optional(),
  periodEnd: z.date().optional()
});

const supplyPurchaseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  supplyId: z.string().min(1, 'Supply item is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  currency: z.string().default('USD'),
  exchangeRate: z.number().positive().optional(),
  fundingSource: z.string().min(1, 'Funding source is required'),
  purchaseDate: z.date().default(() => new Date())
});

const supplyConsumptionSchema = z.object({
  supplyId: z.string().min(1, 'Supply item is required'),
  orderId: z.string().min(1, 'Order is required'),
  quantityConsumed: z.number().positive('Quantity must be positive'),
  packingOperation: z.string().min(1, 'Packing operation is required'),
  cartonsProcessed: z.number().int().positive().optional(),
  consumptionType: z.string().default('manual')
});

export default function OperatingExpenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('supplies');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [allocationMethod, setAllocationMethod] = useState<'weighted' | 'time' | 'manual'>('weighted');

  // Queries
  const { data: supplies } = useQuery({
    queryKey: ['/api/operating-expenses/supplies'],
    select: (data: any[]) => data || []
  });

  const { data: operatingExpenses } = useQuery({
    queryKey: ['/api/operating-expenses'],
    select: (data: any[]) => data || []
  });

  const { data: expenseCategories } = useQuery({
    queryKey: ['/api/operating-expense-categories'],
    select: (data: any[]) => data || []
  });

  const { data: orders } = useQuery({
    queryKey: ['/api/orders'],
    select: (data: any[]) => data || []
  });

  const { data: suppliers } = useQuery({
    queryKey: ['/api/suppliers'],
    select: (data: any[]) => data || []
  });

  // Forms
  const supplyForm = useForm({
    resolver: zodResolver(supplySchema),
    defaultValues: {
      name: '',
      supplyType: '',
      unitOfMeasure: '',
      quantityOnHand: '0',
      reorderPoint: '10',
      minimumStock: '0',
      unitCostUsd: '0',
      description: ''
    }
  });

  const expenseForm = useForm({
    resolver: zodResolver(operatingExpenseSchema),
    defaultValues: {
      currency: 'USD',
      paymentMethod: 'cash',
      fundingSource: 'capital'
    }
  });

  const purchaseForm = useForm({
    resolver: zodResolver(supplyPurchaseSchema),
    defaultValues: {
      currency: 'USD',
      fundingSource: 'capital'
    }
  });

  const consumptionForm = useForm({
    resolver: zodResolver(supplyConsumptionSchema),
    defaultValues: {
      packingOperation: 'packing',
      consumptionType: 'manual'
    }
  });

  // Mutations
  const createSupplyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/operating-expenses/supplies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create supply');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/operating-expenses/supplies'] });
      supplyForm.reset();
      toast({ title: 'Success', description: 'Supply created successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create supply', variant: 'destructive' });
    }
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/operating-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create expense');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/operating-expenses'] });
      expenseForm.reset();
      toast({ title: 'Success', description: 'Operating expense recorded successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to record expense', variant: 'destructive' });
    }
  });

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/operating-expenses/supply-purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create supply purchase');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/operating-expenses/supplies'] });
      purchaseForm.reset();
      toast({ title: 'Success', description: 'Supply purchase recorded successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to record purchase', variant: 'destructive' });
    }
  });

  const recordConsumptionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/operating-expenses/supply-consumption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to record consumption');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/operating-expenses/supplies'] });
      consumptionForm.reset();
      toast({ title: 'Success', description: 'Supply consumption recorded successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to record consumption', variant: 'destructive' });
    }
  });

  // Calculations
  const suppliesStats = useMemo(() => {
    if (!supplies) return { totalValue: 0, lowStock: 0, totalItems: 0 };
    
    const totalValue = supplies.reduce((sum, supply) => sum + parseFloat(supply.totalValueUsd || '0'), 0);
    const lowStock = supplies.filter(supply => 
      parseFloat(supply.quantityOnHand || '0') <= parseFloat(supply.reorderPoint || '0')
    ).length;
    
    return {
      totalValue,
      lowStock,
      totalItems: supplies.length
    };
  }, [supplies]);

  const expensesStats = useMemo(() => {
    if (!operatingExpenses) return { totalExpenses: 0, thisMonth: 0, pendingApproval: 0 };
    
    const totalExpenses = operatingExpenses.reduce((sum, expense) => sum + parseFloat(expense.amountUsd || '0'), 0);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonth = operatingExpenses
      .filter(expense => {
        const expenseDate = new Date(expense.expenseDate);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, expense) => sum + parseFloat(expense.amountUsd || '0'), 0);
    
    const pendingApproval = operatingExpenses.filter(expense => !expense.isApproved).length;
    
    return { totalExpenses, thisMonth, pendingApproval };
  }, [operatingExpenses]);

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Operating Expenses</h2>
          <p className="text-muted-foreground">
            Manage supplies, labor costs, rent allocation, and operating expenses
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Supplies Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-supplies-value">
              ${suppliesStats.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {suppliesStats.totalItems} items in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="text-low-stock">
              {suppliesStats.lowStock}
            </div>
            <p className="text-xs text-muted-foreground">
              Items below reorder point
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-monthly-expenses">
              ${expensesStats.thisMonth.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Current month total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-approval">
              {expensesStats.pendingApproval}
            </div>
            <p className="text-xs text-muted-foreground">
              Expenses awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="supplies" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Supplies
          </TabsTrigger>
          <TabsTrigger value="labor" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Labor
          </TabsTrigger>
          <TabsTrigger value="rent" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Rent
          </TabsTrigger>
          <TabsTrigger value="aggregated" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Aggregated
          </TabsTrigger>
        </TabsList>

        {/* Supplies Tab */}
        <TabsContent value="supplies" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Supplies Balance Board */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Warehouse className="h-5 w-5" />
                    Supplies Balance Board
                  </CardTitle>
                  <CardDescription>
                    Current stock levels and reorder alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {supplies && supplies.length > 0 ? supplies.map((supply: any) => (
                      <div key={supply.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{supply.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {supply.supplyType} • {supply.unitOfMeasure}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">
                              {parseFloat(supply.quantityOnHand || '0').toLocaleString()} units
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ${parseFloat(supply.unitCostUsd || '0').toFixed(2)} per unit
                            </div>
                          </div>
                          <div className="w-24">
                            <Progress 
                              value={Math.min((parseFloat(supply.quantityOnHand || '0') / Math.max(parseFloat(supply.reorderPoint || '1') * 2, 1)) * 100, 100)}
                              className="h-2"
                            />
                            <div className="text-xs text-center mt-1">
                              Reorder at {supply.reorderPoint}
                            </div>
                          </div>
                          {parseFloat(supply.quantityOnHand || '0') <= parseFloat(supply.reorderPoint || '0') && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Low Stock
                            </Badge>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No supplies found. Create your first supply item.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              {/* Add Supply */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Supply Item</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...supplyForm}>
                    <form onSubmit={supplyForm.handleSubmit((data) => createSupplyMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={supplyForm.control as any}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supply Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Cartons, labels, tape..." data-testid="input-supply-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={supplyForm.control as any}
                        name="supplyType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-supply-type">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cartons_8kg">8kg Cartons</SelectItem>
                                <SelectItem value="cartons_20kg">20kg Cartons</SelectItem>
                                <SelectItem value="labels">Labels</SelectItem>
                                <SelectItem value="wraps">Wraps</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={supplyForm.control as any}
                          name="unitOfMeasure"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="piece, pack, box" data-testid="input-supply-unit" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={supplyForm.control}
                          name="reorderPoint"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reorder Point</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  data-testid="input-reorder-point"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={supplyForm.control as any}
                          name="unitCostUsd"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Cost (USD)</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  step="0.01"
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  data-testid="input-unit-cost"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={supplyForm.control}
                          name="quantityOnHand"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Initial Quantity</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  data-testid="input-initial-quantity"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={createSupplyMutation.isPending}
                        className="w-full"
                        data-testid="button-create-supply"
                      >
                        {createSupplyMutation.isPending ? 'Creating...' : 'Create Supply Item'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Quick Purchase */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Purchase Supplies</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...purchaseForm}>
                    <form onSubmit={purchaseForm.handleSubmit((data) => createPurchaseMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={purchaseForm.control as any}
                        name="supplierId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supplier</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-supplier">
                                  <SelectValue placeholder="Select supplier" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {suppliers?.map((supplier: any) => (
                                  <SelectItem key={supplier.id} value={supplier.id}>
                                    {supplier.companyName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={purchaseForm.control as any}
                        name="supplyId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supply Item</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-supply-item">
                                  <SelectValue placeholder="Select item" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {supplies?.map((supply: any) => (
                                  <SelectItem key={supply.id} value={supply.id}>
                                    {supply.name} ({supply.unitOfMeasure})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={purchaseForm.control as any}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  data-testid="input-purchase-quantity"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={purchaseForm.control as any}
                          name="unitPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Price</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  step="0.01"
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  data-testid="input-unit-price"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={purchaseForm.control}
                        name="fundingSource"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Funding Source</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-funding-source">
                                  <SelectValue placeholder="Select source" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="capital">Working Capital</SelectItem>
                                <SelectItem value="external">External Funding</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={createPurchaseMutation.isPending}
                        className="w-full"
                        data-testid="button-create-purchase"
                      >
                        {createPurchaseMutation.isPending ? 'Recording...' : 'Record Purchase'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Record Consumption */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Record Consumption</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...consumptionForm}>
                    <form onSubmit={consumptionForm.handleSubmit((data) => recordConsumptionMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={consumptionForm.control as any}
                        name="supplyId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supply Used</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-consumption-supply">
                                  <SelectValue placeholder="Select supply" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {supplies?.map((supply: any) => (
                                  <SelectItem key={supply.id} value={supply.id}>
                                    {supply.name} ({supply.quantityOnHand} available)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={consumptionForm.control as any}
                        name="orderId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-consumption-order">
                                  <SelectValue placeholder="Select order" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {orders?.map((order: any) => (
                                  <SelectItem key={order.id} value={order.id}>
                                    {order.orderNumber}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={consumptionForm.control as any}
                          name="quantityConsumed"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity Used</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  data-testid="input-consumption-quantity"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={consumptionForm.control as any}
                          name="cartonsProcessed"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cartons Processed</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number"
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  data-testid="input-cartons-processed"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={recordConsumptionMutation.isPending}
                        className="w-full"
                        data-testid="button-record-consumption"
                      >
                        {recordConsumptionMutation.isPending ? 'Recording...' : 'Record Consumption'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Labor Tab */}
        <TabsContent value="labor" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Labor Cost Management
                  </CardTitle>
                  <CardDescription>
                    Track worker payments and allocate to orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {operatingExpenses && operatingExpenses.filter((exp: any) => exp.categoryId?.includes('labor')).length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Worker/Description</TableHead>
                            <TableHead>Amount (USD)</TableHead>
                            <TableHead>Order Allocation</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {operatingExpenses
                            .filter((exp: any) => exp.categoryId?.includes('labor'))
                            .map((expense: any) => (
                            <TableRow key={expense.id}>
                              <TableCell>
                                {new Date(expense.expenseDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{expense.description}</div>
                              </TableCell>
                              <TableCell>
                                ${parseFloat(expense.amountUsd || '0').toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {expense.orderId ? (
                                  <Badge variant="outline">Direct Order</Badge>
                                ) : expense.allocationToOrders ? (
                                  <Badge variant="secondary">Multiple Orders</Badge>
                                ) : (
                                  <Badge variant="destructive">Unallocated</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {expense.isApproved ? (
                                  <Badge variant="default" className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Approved
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No labor expenses recorded yet.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Labor Payment Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Record Labor Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...expenseForm}>
                    <form onSubmit={expenseForm.handleSubmit((data) => createExpenseMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={expenseForm.control as any}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Labor Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-labor-category">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {expenseCategories?.filter((cat: any) => 
                                  cat.categoryName.toLowerCase().includes('labor') && 
                                  cat.id && 
                                  cat.id.trim() !== ''
                                ).map((category: any) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.categoryName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={expenseForm.control as any}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Worker/Task Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Worker name, task type (filtering/loading/cartonizing), hours worked..."
                                data-testid="input-labor-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={expenseForm.control as any}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Amount</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  step="0.01"
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  data-testid="input-labor-amount"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={expenseForm.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Currency</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-labor-currency">
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
                        control={expenseForm.control}
                        name="fundingSource"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Funding Source</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-labor-funding">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="capital">Working Capital</SelectItem>
                                <SelectItem value="external">External Funding</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={expenseForm.control as any}
                        name="orderId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Allocate to Order (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-labor-order">
                                  <SelectValue placeholder="Select order or leave blank for manual allocation" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="manual">Manual allocation later</SelectItem>
                                {orders?.filter((order: any) => order.id && order.id.trim() !== '').map((order: any) => (
                                  <SelectItem key={order.id} value={order.id}>
                                    {order.orderNumber}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        disabled={createExpenseMutation.isPending}
                        className="w-full"
                        data-testid="button-record-labor"
                      >
                        {createExpenseMutation.isPending ? 'Recording...' : 'Record Labor Payment'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Rent Tab */}
        <TabsContent value="rent" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Rent & Facility Costs
                  </CardTitle>
                  <CardDescription>
                    Manage rent payments and allocation to orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {operatingExpenses && operatingExpenses.filter((exp: any) => exp.categoryId?.includes('rent')).length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Period</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount (USD)</TableHead>
                            <TableHead>Allocation Method</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {operatingExpenses
                            .filter((exp: any) => exp.categoryId?.includes('rent'))
                            .map((expense: any) => (
                            <TableRow key={expense.id}>
                              <TableCell>
                                {expense.periodStart && expense.periodEnd ? (
                                  <div>
                                    <div className="font-medium">
                                      {new Date(expense.periodStart).toLocaleDateString()} - 
                                    </div>
                                    <div>
                                      {new Date(expense.periodEnd).toLocaleDateString()}
                                    </div>
                                  </div>
                                ) : (
                                  new Date(expense.expenseDate).toLocaleDateString()
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{expense.description}</div>
                              </TableCell>
                              <TableCell>
                                ${parseFloat(expense.amountUsd || '0').toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {expense.allocationToOrders ? (
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    <PieChart className="h-3 w-3" />
                                    Weighted
                                  </Badge>
                                ) : expense.orderId ? (
                                  <Badge variant="outline">Direct</Badge>
                                ) : (
                                  <Badge variant="destructive">Unallocated</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {expense.isApproved ? (
                                  <Badge variant="default" className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Approved
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No rent expenses recorded yet.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rent Allocation Wizard */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rent Allocation Wizard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Allocation Method Selection */}
                    <div>
                      <Label className="text-sm font-medium">Allocation Method</Label>
                      <div className="grid gap-2 mt-2">
                        <Button
                          variant={allocationMethod === 'weighted' ? 'default' : 'outline'}
                          onClick={() => setAllocationMethod('weighted')}
                          className="justify-start"
                          data-testid="button-weighted-allocation"
                        >
                          <Percent className="h-4 w-4 mr-2" />
                          Weighted (by kg)
                        </Button>
                        <Button
                          variant={allocationMethod === 'time' ? 'default' : 'outline'}
                          onClick={() => setAllocationMethod('time')}
                          className="justify-start"
                          data-testid="button-time-allocation"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Time-based (by days)
                        </Button>
                        <Button
                          variant={allocationMethod === 'manual' ? 'default' : 'outline'}
                          onClick={() => setAllocationMethod('manual')}
                          className="justify-start"
                          data-testid="button-manual-allocation"
                        >
                          <Calculator className="h-4 w-4 mr-2" />
                          Manual Control
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Rent Payment Form */}
                    <Form {...expenseForm}>
                      <form onSubmit={expenseForm.handleSubmit((data) => createExpenseMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={expenseForm.control as any}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rent Category</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-rent-category">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {expenseCategories?.filter((cat: any) => cat.categoryName.toLowerCase().includes('rent')).map((category: any) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.categoryName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={expenseForm.control as any}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location/Entity</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Warehouse location, lessor name, contract details..."
                                  data-testid="input-rent-description"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={expenseForm.control as any}
                            name="periodStart"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Period Start</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="date"
                                    value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : ''}
                                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                    data-testid="input-period-start"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={expenseForm.control as any}
                            name="periodEnd"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Period End</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="date"
                                    value={field.value ? (field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value) : ''}
                                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                    data-testid="input-period-end"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={expenseForm.control as any}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rent Amount</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  step="0.01"
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  data-testid="input-rent-amount"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={expenseForm.control}
                          name="fundingSource"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Funding Source</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-rent-funding">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="capital">Working Capital</SelectItem>
                                  <SelectItem value="external">External Funding</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          disabled={createExpenseMutation.isPending}
                          className="w-full"
                          data-testid="button-record-rent"
                        >
                          {createExpenseMutation.isPending ? 'Recording...' : 'Record Rent Payment'}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Aggregated Tab */}
        <TabsContent value="aggregated" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Expense Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Expense Summary
                </CardTitle>
                <CardDescription>
                  Monthly breakdown by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenseCategories?.map((category: any) => {
                    const categoryExpenses = operatingExpenses?.filter((exp: any) => exp.categoryId === category.id) || [];
                    const totalAmount = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amountUsd || '0'), 0);
                    const maxAmount = Math.max(...(expenseCategories?.map((cat: any) => 
                      operatingExpenses?.filter((exp: any) => exp.categoryId === cat.id)
                        ?.reduce((sum, exp) => sum + parseFloat(exp.amountUsd || '0'), 0) || 0
                    ) || [1]));
                    
                    return (
                      <div key={category.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{category.categoryName}</div>
                          <div className="text-sm font-bold">${totalAmount.toLocaleString()}</div>
                        </div>
                        <Progress value={(totalAmount / maxAmount) * 100} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {categoryExpenses.length} expense{categoryExpenses.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Cost per Order Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Cost per Order Analysis
                </CardTitle>
                <CardDescription>
                  Operating expenses allocated to orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders?.slice(0, 5).map((order: any) => {
                    const orderExpenses = operatingExpenses?.filter((exp: any) => exp.orderId === order.id) || [];
                    const totalCost = orderExpenses.reduce((sum, exp) => sum + parseFloat(exp.amountUsd || '0'), 0);
                    const orderWeight = parseFloat(order.totalNetWeightKg || '0');
                    const costPerKg = orderWeight > 0 ? totalCost / orderWeight : 0;
                    
                    return (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{order.orderNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {orderWeight.toLocaleString()} kg
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${totalCost.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">
                            ${costPerKg.toFixed(2)}/kg
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Key Performance Indicators */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Key Performance Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${(expensesStats.thisMonth / Math.max(orders?.length || 1, 1)).toFixed(0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Cost per Order</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {((expensesStats.thisMonth / expensesStats.totalExpenses) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Monthly vs Total</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      ${(supplies?.reduce((sum, s) => sum + (parseFloat(s.quantityOnHand || '0') * parseFloat(s.unitCostUsd || '0')), 0) || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Inventory Value</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(((operatingExpenses?.filter(exp => exp.isApproved).length || 0) / Math.max(operatingExpenses?.length || 1, 1)) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Approval Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}