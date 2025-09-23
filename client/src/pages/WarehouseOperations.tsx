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
  Warehouse, 
  Package, 
  Truck, 
  BarChart3, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Search,
  Filter,
  Plus,
  Edit,
  Trash,
  RotateCcw,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Activity,
  ShieldCheck,
  Database,
  FileText,
  RefreshCw,
  QrCode
} from 'lucide-react';

// Zod schemas for forms
const stockFilterSchema = z.object({
  status: z.string().optional(),
  warehouse: z.string().optional(),
  qualityGrade: z.string().optional(),
});

const inventoryAdjustmentSchema = z.object({
  warehouseStockId: z.string().min(1, 'Stock item is required'),
  adjustmentType: z.enum(['cycle_count', 'reconciliation', 'correction', 'write_off']),
  quantityAfter: z.string().min(1, 'New quantity is required'),
  reason: z.string().min(1, 'Reason is required'),
  justification: z.string().optional(),
});

const stockTransferSchema = z.object({
  transferType: z.enum(['warehouse_to_warehouse', 'location_to_location', 'batch_split', 'batch_merge']),
  fromWarehouseStockId: z.string().min(1, 'Source stock is required'),
  toWarehouseStockId: z.string().optional(),
  quantityKg: z.string().min(1, 'Quantity is required'),
  reason: z.string().min(1, 'Reason is required'),
});

const processingOperationSchema = z.object({
  operationType: z.enum(['washing', 'drying', 'hulling', 'sorting', 'milling']),
  batchId: z.string().min(1, 'Batch is required'),
  inputQuantityKg: z.string().min(1, 'Input quantity is required'),
  processingCostUsd: z.string().optional(),
  laborCostUsd: z.string().optional(),
  notes: z.string().optional(),
});

const qualityInspectionSchema = z.object({
  warehouseStockId: z.string().min(1, 'Stock item is required'),
  inspectionType: z.enum(['incoming', 'processing', 'outgoing', 'quality_control']),
  qualityGrade: z.enum(['grade_1', 'grade_2', 'grade_3', 'specialty', 'commercial', 'ungraded']),
  moistureContent: z.string().optional(),
  defectRate: z.string().optional(),
  cupQualityScore: z.string().optional(),
  recommendations: z.string().optional(),
});

type StockItem = {
  id: string;
  purchaseId: string;
  orderId: string;
  supplierId: string;
  batchId?: string;
  warehouse: 'FIRST' | 'FINAL';
  status: string;
  qualityGrade?: string;
  qtyKgTotal: string;
  qtyKgClean: string;
  qtyKgNonClean: string;
  qtyKgReserved: string;
  qtyKgConsumed: string;
  cartonsCount?: number;
  unitCostCleanUsd?: string;
  createdAt: string;
  lastActivityAt?: string;
};

type InventoryAdjustment = {
  id: string;
  adjustmentNumber: string;
  adjustmentType: string;
  status: string;
  quantityBefore: string;
  quantityAfter: string;
  adjustmentQuantity: string;
  reason: string;
  createdAt: string;
  approvedAt?: string;
};

type ProcessingOperation = {
  id: string;
  operationNumber: string;
  operationType: string;
  status: string;
  inputQuantityKg: string;
  outputQuantityKg?: string;
  yieldPercentage?: string;
  totalCostUsd?: string;
  startedAt?: string;
  completedAt?: string;
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    AWAITING_DECISION: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    AWAITING_FILTER: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    NON_CLEAN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    READY_FOR_SALE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };
  
  return (
    <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  );
};

const WarehouseCard = ({ warehouse, stockData }: { warehouse: 'FIRST' | 'FINAL', stockData: StockItem[] }) => {
  const warehouseStock = stockData.filter(stock => stock.warehouse === warehouse);
  const totalKg = warehouseStock.reduce((sum, stock) => sum + parseFloat(stock.qtyKgTotal), 0);
  const cleanKg = warehouseStock.reduce((sum, stock) => sum + parseFloat(stock.qtyKgClean), 0);
  const availableKg = warehouseStock.reduce((sum, stock) => 
    sum + (parseFloat(stock.qtyKgTotal) - parseFloat(stock.qtyKgReserved) - parseFloat(stock.qtyKgConsumed)), 0);

  return (
    <Card data-testid={`card-warehouse-${warehouse.toLowerCase()}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Warehouse className="h-5 w-5" />
          {warehouse} Warehouse
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold" data-testid={`text-total-stock-${warehouse.toLowerCase()}`}>
              {totalKg.toFixed(1)} kg
            </div>
            <p className="text-sm text-muted-foreground">Total Stock</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600" data-testid={`text-clean-stock-${warehouse.toLowerCase()}`}>
              {cleanKg.toFixed(1)} kg
            </div>
            <p className="text-sm text-muted-foreground">Clean Stock</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600" data-testid={`text-available-stock-${warehouse.toLowerCase()}`}>
              {availableKg.toFixed(1)} kg
            </div>
            <p className="text-sm text-muted-foreground">Available</p>
          </div>
          <div>
            <div className="text-lg font-semibold" data-testid={`text-stock-items-${warehouse.toLowerCase()}`}>
              {warehouseStock.length}
            </div>
            <p className="text-sm text-muted-foreground">Stock Items</p>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Utilization</span>
            <span>{((totalKg / 10000) * 100).toFixed(1)}%</span>
          </div>
          <Progress value={(totalKg / 10000) * 100} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

export default function WarehouseOperations() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stockFilter, setStockFilter] = useState({ status: 'all-status', warehouse: 'all-warehouses', qualityGrade: '' });
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms
  const adjustmentForm = useForm({
    resolver: zodResolver(inventoryAdjustmentSchema),
    defaultValues: {
      warehouseStockId: '',
      adjustmentType: 'cycle_count' as const,
      quantityAfter: '',
      reason: '',
      justification: '',
    }
  });

  const transferForm = useForm({
    resolver: zodResolver(stockTransferSchema),
    defaultValues: {
      transferType: 'warehouse_to_warehouse' as const,
      fromWarehouseStockId: '',
      toWarehouseStockId: '',
      quantityKg: '',
      reason: '',
    }
  });

  const processingForm = useForm({
    resolver: zodResolver(processingOperationSchema),
    defaultValues: {
      operationType: 'sorting' as const,
      batchId: '',
      inputQuantityKg: '',
      processingCostUsd: '',
      laborCostUsd: '',
      notes: '',
    }
  });

  const inspectionForm = useForm({
    resolver: zodResolver(qualityInspectionSchema),
    defaultValues: {
      warehouseStockId: '',
      inspectionType: 'quality_control' as const,
      qualityGrade: 'ungraded' as const,
      moistureContent: '',
      defectRate: '',
      cupQualityScore: '',
      recommendations: '',
    }
  });

  // Queries
  const { data: warehouseStock = [], isLoading: isLoadingStock } = useQuery({
    queryKey: ['/api/warehouse/stock', stockFilter],
    refetchInterval: 10000, // Refresh every 10 seconds
  }) as { data: StockItem[], isLoading: boolean };

  const { data: inventoryAdjustments = [], isLoading: isLoadingAdjustments } = useQuery({
    queryKey: ['/api/warehouse/inventory-adjustments'],
  }) as { data: InventoryAdjustment[], isLoading: boolean };

  const { data: stockTransfers = [], isLoading: isLoadingTransfers } = useQuery({
    queryKey: ['/api/warehouse/stock-transfers'],
  }) as { data: any[], isLoading: boolean };

  const { data: processingOperations = [], isLoading: isLoadingProcessing } = useQuery({
    queryKey: ['/api/warehouse/processing-operations'],
  }) as { data: ProcessingOperation[], isLoading: boolean };

  const { data: inventoryAnalytics } = useQuery({
    queryKey: ['/api/reports/inventory/analytics'],
  }) as { data: any };

  const { data: batches = [] } = useQuery({
    queryKey: ['/api/warehouse/batches'],
  }) as { data: any[] };

  const { data: qualityStandards = [] } = useQuery({
    queryKey: ['/api/warehouse/quality-standards'],
  }) as { data: any[] };

  // Mutations
  const createAdjustmentMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/warehouse/inventory-adjustments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: 'Inventory adjustment created successfully!' });
      adjustmentForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/inventory-adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/stock'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create adjustment', description: error.message, variant: 'destructive' });
    }
  });

  const createTransferMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/warehouse/stock-transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: 'Stock transfer created successfully!' });
      transferForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/stock-transfers'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create transfer', description: error.message, variant: 'destructive' });
    }
  });

  const createProcessingMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/warehouse/processing-operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: 'Processing operation created successfully!' });
      processingForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/processing-operations'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create operation', description: error.message, variant: 'destructive' });
    }
  });

  const createInspectionMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/warehouse/quality-inspections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: 'Quality inspection created successfully!' });
      inspectionForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/stock'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create inspection', description: error.message, variant: 'destructive' });
    }
  });

  const filteredStock = warehouseStock.filter((stock: StockItem) => {
    if (stockFilter.status && stockFilter.status !== 'all-status' && stock.status !== stockFilter.status) return false;
    if (stockFilter.warehouse && stockFilter.warehouse !== 'all-warehouses' && stock.warehouse !== stockFilter.warehouse) return false;
    if (stockFilter.qualityGrade && stock.qualityGrade !== stockFilter.qualityGrade) return false;
    return true;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="title-warehouse-operations">Warehouse Operations</h1>
          <p className="text-muted-foreground">Comprehensive inventory management and warehouse operations control</p>
        </div>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh All
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="stock" data-testid="tab-stock">Stock Management</TabsTrigger>
          <TabsTrigger value="adjustments" data-testid="tab-adjustments">Adjustments</TabsTrigger>
          <TabsTrigger value="transfers" data-testid="tab-transfers">Transfers</TabsTrigger>
          <TabsTrigger value="processing" data-testid="tab-processing">Processing</TabsTrigger>
          <TabsTrigger value="quality" data-testid="tab-quality">Quality Control</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WarehouseCard warehouse="FIRST" stockData={warehouseStock} />
            <WarehouseCard warehouse="FINAL" stockData={warehouseStock} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card data-testid="card-pending-operations">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  Pending Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Inventory Adjustments</span>
                    <Badge variant="secondary" data-testid="badge-pending-adjustments">
                      {inventoryAdjustments.filter((adj: InventoryAdjustment) => adj.status === 'pending').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Stock Transfers</span>
                    <Badge variant="secondary" data-testid="badge-pending-transfers">
                      {stockTransfers.filter((transfer: any) => transfer.status === 'pending').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Processing Operations</span>
                    <Badge variant="secondary" data-testid="badge-pending-processing">
                      {processingOperations.filter((op: ProcessingOperation) => op.status === 'planned').length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-alerts">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Low Stock Items</span>
                    <Badge variant="destructive" data-testid="badge-low-stock">
                      {warehouseStock.filter((stock: StockItem) => parseFloat(stock.qtyKgTotal) < 50).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Awaiting Decision</span>
                    <Badge variant="outline" data-testid="badge-awaiting-decision">
                      {warehouseStock.filter((stock: StockItem) => stock.status === 'AWAITING_DECISION').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Quality Issues</span>
                    <Badge variant="destructive" data-testid="badge-quality-issues">
                      {warehouseStock.filter((stock: StockItem) => stock.qualityGrade === 'ungraded').length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-kpis">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Key Performance Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Stock Turnover</span>
                    <span className="font-semibold" data-testid="text-stock-turnover">
                      {inventoryAnalytics?.stockTurnover?.toFixed(1) || '0.0'}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Processing Yield</span>
                    <span className="font-semibold text-green-600" data-testid="text-processing-yield">
                      {inventoryAnalytics?.averageYield?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Quality Score</span>
                    <span className="font-semibold text-blue-600" data-testid="text-quality-score">
                      {inventoryAnalytics?.averageQualityScore?.toFixed(1) || '0.0'}/5
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Stock Management
              </CardTitle>
              <div className="flex gap-4">
                <Select value={stockFilter.status} onValueChange={(value) => setStockFilter({...stockFilter, status: value})}>
                  <SelectTrigger className="w-48" data-testid="select-stock-status">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-status">All Status</SelectItem>
                    <SelectItem value="AWAITING_DECISION">Awaiting Decision</SelectItem>
                    <SelectItem value="AWAITING_FILTER">Awaiting Filter</SelectItem>
                    <SelectItem value="NON_CLEAN">Non-Clean</SelectItem>
                    <SelectItem value="READY_FOR_SALE">Ready for Sale</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={stockFilter.warehouse} onValueChange={(value) => setStockFilter({...stockFilter, warehouse: value})}>
                  <SelectTrigger className="w-48" data-testid="select-stock-warehouse">
                    <SelectValue placeholder="Filter by warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-warehouses">All Warehouses</SelectItem>
                    <SelectItem value="FIRST">First Warehouse</SelectItem>
                    <SelectItem value="FINAL">Final Warehouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStock ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading stock data...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStock.map((stock: StockItem) => (
                    <div key={stock.id} className="border rounded-lg p-4 space-y-3" data-testid={`stock-item-${stock.id}`}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">Order: {stock.orderId.substring(0, 8)}</h3>
                            <StatusBadge status={stock.status} />
                            <Badge variant="outline">{stock.warehouse}</Badge>
                            {stock.qualityGrade && (
                              <Badge variant="secondary">{stock.qualityGrade.replace('_', ' ').toUpperCase()}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Purchase: {stock.purchaseId.substring(0, 8)} | 
                            Supplier: {stock.supplierId.substring(0, 8)}
                            {stock.batchId && ` | Batch: ${stock.batchId.substring(0, 8)}`}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-lg font-bold">{parseFloat(stock.qtyKgTotal).toFixed(1)} kg</div>
                          <div className="text-sm text-muted-foreground">
                            Clean: {parseFloat(stock.qtyKgClean).toFixed(1)} kg
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Non-Clean:</span>
                          <div>{parseFloat(stock.qtyKgNonClean).toFixed(1)} kg</div>
                        </div>
                        <div>
                          <span className="font-medium">Reserved:</span>
                          <div>{parseFloat(stock.qtyKgReserved).toFixed(1)} kg</div>
                        </div>
                        <div>
                          <span className="font-medium">Consumed:</span>
                          <div>{parseFloat(stock.qtyKgConsumed).toFixed(1)} kg</div>
                        </div>
                        <div>
                          <span className="font-medium">Available:</span>
                          <div className="font-semibold text-green-600">
                            {(parseFloat(stock.qtyKgTotal) - parseFloat(stock.qtyKgReserved) - parseFloat(stock.qtyKgConsumed)).toFixed(1)} kg
                          </div>
                        </div>
                      </div>
                      
                      {stock.cartonsCount && (
                        <div className="text-sm">
                          <span className="font-medium">Cartons:</span> {stock.cartonsCount}
                          {stock.unitCostCleanUsd && (
                            <span className="ml-4"><span className="font-medium">Unit Cost:</span> ${parseFloat(stock.unitCostCleanUsd).toFixed(2)}/kg</span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedStock(stock.id)} data-testid={`button-view-details-${stock.id}`}>
                          <FileText className="mr-1 h-3 w-3" />
                          Details
                        </Button>
                        {stock.status === 'AWAITING_DECISION' && (
                          <Button size="sm" variant="outline" data-testid={`button-filter-${stock.id}`}>
                            <Filter className="mr-1 h-3 w-3" />
                            Process
                          </Button>
                        )}
                        {stock.warehouse === 'FIRST' && stock.status === 'READY_FOR_SALE' && (
                          <Button size="sm" variant="outline" data-testid={`button-move-final-${stock.id}`}>
                            <ArrowRight className="mr-1 h-3 w-3" />
                            Move to Final
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {filteredStock.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No stock items found matching your filters.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  New Inventory Adjustment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...adjustmentForm}>
                  <form onSubmit={adjustmentForm.handleSubmit((data) => createAdjustmentMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={adjustmentForm.control as any}
                      name="warehouseStockId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Item</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-adjustment-stock">
                                <SelectValue placeholder="Select stock item to adjust" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {warehouseStock.map((stock: StockItem) => (
                                <SelectItem key={stock.id} value={stock.id}>
                                  {stock.orderId.substring(0, 8)} - {stock.warehouse} - {parseFloat(stock.qtyKgTotal).toFixed(1)} kg
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={adjustmentForm.control as any}
                      name="adjustmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adjustment Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-adjustment-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cycle_count">Cycle Count</SelectItem>
                              <SelectItem value="reconciliation">Reconciliation</SelectItem>
                              <SelectItem value="correction">Correction</SelectItem>
                              <SelectItem value="write_off">Write-off</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={adjustmentForm.control as any}
                      name="quantityAfter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Quantity (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.1" 
                              placeholder="Enter corrected quantity"
                              data-testid="input-adjustment-quantity"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={adjustmentForm.control as any}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Explain why this adjustment is needed..."
                              data-testid="textarea-adjustment-reason"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={adjustmentForm.control as any}
                      name="justification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Justification (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Additional details or supporting documentation..."
                              data-testid="textarea-adjustment-justification"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={createAdjustmentMutation.isPending} data-testid="button-create-adjustment">
                      {createAdjustmentMutation.isPending ? 'Creating...' : 'Create Adjustment'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Recent Adjustments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAdjustments ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading adjustments...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inventoryAdjustments.slice(0, 5).map((adjustment: InventoryAdjustment) => (
                      <div key={adjustment.id} className="border rounded p-3 space-y-2" data-testid={`adjustment-item-${adjustment.id}`}>
                        <div className="flex justify-between items-center">
                          <div className="font-medium">{adjustment.adjustmentNumber}</div>
                          <StatusBadge status={adjustment.status} />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {adjustment.adjustmentType.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Before: {parseFloat(adjustment.quantityBefore).toFixed(1)} kg</span>
                          <span>After: {parseFloat(adjustment.quantityAfter).toFixed(1)} kg</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{adjustment.reason}</div>
                        {adjustment.status === 'pending' && (
                          <Button size="sm" variant="outline" className="w-full" data-testid={`button-approve-adjustment-${adjustment.id}`}>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Approve
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    {inventoryAdjustments.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No inventory adjustments found.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  New Stock Transfer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...transferForm}>
                  <form onSubmit={transferForm.handleSubmit((data) => createTransferMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={transferForm.control as any}
                      name="transferType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transfer Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-transfer-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="warehouse_to_warehouse">Warehouse to Warehouse</SelectItem>
                              <SelectItem value="location_to_location">Location to Location</SelectItem>
                              <SelectItem value="batch_split">Batch Split</SelectItem>
                              <SelectItem value="batch_merge">Batch Merge</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={transferForm.control as any}
                      name="fromWarehouseStockId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Stock</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-source-stock">
                                <SelectValue placeholder="Select source stock item" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {warehouseStock.map((stock: StockItem) => (
                                <SelectItem key={stock.id} value={stock.id}>
                                  {stock.orderId.substring(0, 8)} - {stock.warehouse} - {parseFloat(stock.qtyKgTotal).toFixed(1)} kg
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={transferForm.control as any}
                      name="quantityKg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transfer Quantity (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.1" 
                              placeholder="Enter quantity to transfer"
                              data-testid="input-transfer-quantity"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={transferForm.control as any}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason for Transfer</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Explain the purpose of this transfer..."
                              data-testid="textarea-transfer-reason"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={createTransferMutation.isPending} data-testid="button-create-transfer">
                      {createTransferMutation.isPending ? 'Creating...' : 'Create Transfer'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Transfers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingTransfers ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading transfers...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stockTransfers.slice(0, 5).map((transfer: any) => (
                      <div key={transfer.id} className="border rounded p-3 space-y-2" data-testid={`transfer-item-${transfer.id}`}>
                        <div className="flex justify-between items-center">
                          <div className="font-medium">{transfer.transferNumber}</div>
                          <StatusBadge status={transfer.status} />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {transfer.transferType.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div className="text-sm">
                          Quantity: {parseFloat(transfer.quantityKg).toFixed(1)} kg
                        </div>
                        <div className="text-sm text-muted-foreground">{transfer.reason}</div>
                        {transfer.status === 'pending' && (
                          <Button size="sm" variant="outline" className="w-full" data-testid={`button-execute-transfer-${transfer.id}`}>
                            <ArrowRight className="mr-1 h-3 w-3" />
                            Execute Transfer
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    {stockTransfers.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No stock transfers found.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="processing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  New Processing Operation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...processingForm}>
                  <form onSubmit={processingForm.handleSubmit((data) => createProcessingMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={processingForm.control as any}
                      name="operationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Operation Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-operation-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="washing">Washing</SelectItem>
                              <SelectItem value="drying">Drying</SelectItem>
                              <SelectItem value="hulling">Hulling</SelectItem>
                              <SelectItem value="sorting">Sorting</SelectItem>
                              <SelectItem value="milling">Milling</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={processingForm.control as any}
                      name="batchId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batch</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-processing-batch">
                                <SelectValue placeholder="Select batch to process" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {batches.map((batch: any) => (
                                <SelectItem key={batch.id} value={batch.id}>
                                  {batch.batchNumber} - {parseFloat(batch.totalQuantityKg).toFixed(1)} kg
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={processingForm.control as any}
                      name="inputQuantityKg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Input Quantity (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              step="0.1" 
                              placeholder="Enter input quantity"
                              data-testid="input-processing-quantity"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={processingForm.control as any}
                        name="processingCostUsd"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Processing Cost ($)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00"
                                data-testid="input-processing-cost"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={processingForm.control as any}
                        name="laborCostUsd"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Labor Cost ($)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00"
                                data-testid="input-labor-cost"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={processingForm.control as any}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Additional processing notes..."
                              data-testid="textarea-processing-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={createProcessingMutation.isPending} data-testid="button-create-processing">
                      {createProcessingMutation.isPending ? 'Creating...' : 'Start Processing Operation'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Active Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingProcessing ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading operations...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {processingOperations.slice(0, 5).map((operation: ProcessingOperation) => (
                      <div key={operation.id} className="border rounded p-3 space-y-2" data-testid={`processing-item-${operation.id}`}>
                        <div className="flex justify-between items-center">
                          <div className="font-medium">{operation.operationNumber}</div>
                          <StatusBadge status={operation.status} />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {operation.operationType.toUpperCase()}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Input: {parseFloat(operation.inputQuantityKg).toFixed(1)} kg</span>
                          {operation.outputQuantityKg && (
                            <span>Output: {parseFloat(operation.outputQuantityKg).toFixed(1)} kg</span>
                          )}
                        </div>
                        {operation.yieldPercentage && (
                          <div className="text-sm text-green-600">
                            Yield: {parseFloat(operation.yieldPercentage).toFixed(1)}%
                          </div>
                        )}
                        {operation.status === 'in_progress' && (
                          <Button size="sm" variant="outline" className="w-full" data-testid={`button-complete-processing-${operation.id}`}>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Complete Operation
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    {processingOperations.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No processing operations found.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  New Quality Inspection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...inspectionForm}>
                  <form onSubmit={inspectionForm.handleSubmit((data) => createInspectionMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={inspectionForm.control as any}
                      name="warehouseStockId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Item</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-inspection-stock">
                                <SelectValue placeholder="Select stock item to inspect" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {warehouseStock.map((stock: StockItem) => (
                                <SelectItem key={stock.id} value={stock.id}>
                                  {stock.orderId.substring(0, 8)} - {stock.warehouse} - {parseFloat(stock.qtyKgTotal).toFixed(1)} kg
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={inspectionForm.control as any}
                      name="inspectionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inspection Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-inspection-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="incoming">Incoming</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="outgoing">Outgoing</SelectItem>
                              <SelectItem value="quality_control">Quality Control</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={inspectionForm.control as any}
                      name="qualityGrade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quality Grade</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-quality-grade">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="grade_1">Grade 1</SelectItem>
                              <SelectItem value="grade_2">Grade 2</SelectItem>
                              <SelectItem value="grade_3">Grade 3</SelectItem>
                              <SelectItem value="specialty">Specialty</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                              <SelectItem value="ungraded">Ungraded</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={inspectionForm.control as any}
                        name="moistureContent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Moisture %</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.1" 
                                placeholder="12.0"
                                data-testid="input-moisture-content"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={inspectionForm.control as any}
                        name="defectRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Defect Rate %</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.1" 
                                placeholder="2.5"
                                data-testid="input-defect-rate"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={inspectionForm.control as any}
                        name="cupQualityScore"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cup Score</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.1" 
                                placeholder="85.0"
                                data-testid="input-cup-quality-score"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={inspectionForm.control as any}
                      name="recommendations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recommendations</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Quality inspection recommendations..."
                              data-testid="textarea-inspection-recommendations"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={createInspectionMutation.isPending} data-testid="button-create-inspection">
                      {createInspectionMutation.isPending ? 'Creating...' : 'Create Quality Inspection'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quality Standards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {qualityStandards.map((standard: any) => (
                    <div key={standard.id} className="border rounded p-3 space-y-2" data-testid={`quality-standard-${standard.id}`}>
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{standard.name}</div>
                        <Badge variant={standard.isActive ? 'default' : 'secondary'}>
                          {standard.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Grade: {standard.grade.replace('_', ' ').toUpperCase()}
                      </div>
                      {standard.minScore && standard.maxScore && (
                        <div className="text-sm">
                          Score Range: {parseFloat(standard.minScore).toFixed(1)} - {parseFloat(standard.maxScore).toFixed(1)}
                        </div>
                      )}
                      <div className="text-sm">
                        Price Multiplier: {parseFloat(standard.priceMultiplier).toFixed(4)}x
                      </div>
                      <div className="text-xs text-muted-foreground">{standard.description}</div>
                    </div>
                  ))}
                  
                  {qualityStandards.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No quality standards configured.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card data-testid="card-inventory-metrics">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Inventory Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Stock Value</span>
                    <span className="font-bold" data-testid="text-total-stock-value">
                      ${inventoryAnalytics?.totalStockValue?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Stock Turnover Rate</span>
                    <span className="font-semibold text-blue-600" data-testid="text-turnover-rate">
                      {inventoryAnalytics?.stockTurnover?.toFixed(2) || '0.00'}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average Yield</span>
                    <span className="font-semibold text-green-600" data-testid="text-average-yield">
                      {inventoryAnalytics?.averageYield?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-quality-metrics">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Average Quality Score</span>
                    <span className="font-bold" data-testid="text-average-quality">
                      {inventoryAnalytics?.averageQualityScore?.toFixed(1) || '0.0'}/5.0
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Grade 1 Stock</span>
                    <span className="font-semibold text-green-600" data-testid="text-grade1-stock">
                      {warehouseStock.filter((s: StockItem) => s.qualityGrade === 'grade_1').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Ungraded Stock</span>
                    <span className="font-semibold text-orange-600" data-testid="text-ungraded-stock">
                      {warehouseStock.filter((s: StockItem) => s.qualityGrade === 'ungraded').length}
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
                    <span className="text-sm">Processing Efficiency</span>
                    <span className="font-bold" data-testid="text-processing-efficiency">
                      {inventoryAnalytics?.processingEfficiency?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Storage Utilization</span>
                    <span className="font-semibold text-blue-600" data-testid="text-storage-utilization">
                      {((warehouseStock.reduce((sum: number, stock: StockItem) => 
                        sum + parseFloat(stock.qtyKgTotal), 0) / 20000) * 100).toFixed(1) || '0.0'}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active Batches</span>
                    <span className="font-semibold" data-testid="text-active-batches">
                      {batches.filter((batch: any) => batch.isActive).length}
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
                Warehouse Performance Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Stock Distribution</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>First Warehouse</span>
                      <span>{warehouseStock.filter((s: StockItem) => s.warehouse === 'FIRST').length} items</span>
                    </div>
                    <Progress 
                      value={(warehouseStock.filter((s: StockItem) => s.warehouse === 'FIRST').length / warehouseStock.length) * 100} 
                      className="h-2" 
                    />
                    <div className="flex justify-between text-sm">
                      <span>Final Warehouse</span>
                      <span>{warehouseStock.filter((s: StockItem) => s.warehouse === 'FINAL').length} items</span>
                    </div>
                    <Progress 
                      value={(warehouseStock.filter((s: StockItem) => s.warehouse === 'FINAL').length / warehouseStock.length) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Status Breakdown</h3>
                  <div className="space-y-2">
                    {['AWAITING_DECISION', 'AWAITING_FILTER', 'NON_CLEAN', 'READY_FOR_SALE'].map(status => {
                      const count = warehouseStock.filter((s: StockItem) => s.status === status).length;
                      const percentage = warehouseStock.length > 0 ? (count / warehouseStock.length) * 100 : 0;
                      
                      return (
                        <div key={status}>
                          <div className="flex justify-between text-sm">
                            <span>{status.replace('_', ' ')}</span>
                            <span>{count} items</span>
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