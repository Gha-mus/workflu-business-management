import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { 
  WarehouseStockResponse, 
  SuppliersResponse,
  QualityStandard,
  WarehouseBatch,
  QualityInspection,
  InventoryConsumption,
  ProcessingOperation,
  StockTransfer,
  InventoryAdjustment 
} from "@shared/schema";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Package, 
  Filter, 
  ArrowRight, 
  Warehouse as WarehouseIcon,
  Star,
  ClipboardCheck,
  Zap,
  BarChart3,
  ArrowLeftRight,
  Settings,
  Search,
  Calendar,
  TrendingUp,
  X
} from "lucide-react";

export default function Warehouse() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, userRole, hasAnyRole } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [filterData, setFilterData] = useState({ cleanKg: '', nonCleanKg: '' });
  const [filterYield, setFilterYield] = useState<string>('0');
  
  // UI Filtering/Search state
  const [uiFilters, setUiFilters] = useState<{
    supplier?: string;
    status?: string;
    orderId?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});
  
  // Advanced warehouse operations state
  const [qualityGradingDialogOpen, setQualityGradingDialogOpen] = useState(false);
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [consumptionDialogOpen, setConsumptionDialogOpen] = useState(false);
  const [processingDialogOpen, setProcessingDialogOpen] = useState(false);
  const [traceabilityDialogOpen, setTraceabilityDialogOpen] = useState(false);
  
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [selectedOperation, setSelectedOperation] = useState<any>(null);
  
  const [qualityGradeData, setQualityGradeData] = useState({ grade: '', score: '', notes: '' });
  const [inspectionData, setInspectionData] = useState({
    inspectionType: 'incoming',
    moistureContent: '',
    defectCount: '',
    cupQuality: '',
    notes: ''
  });
  const [batchData, setBatchData] = useState({
    batchNumber: '',
    supplierId: '',
    qualityGrade: '',
    totalQuantityKg: '',
    notes: ''
  });
  const [consumptionData, setConsumptionData] = useState({
    consumptionType: 'sale',
    quantity: '',
    allocatedTo: '',
    notes: ''
  });
  const [processingData, setProcessingData] = useState({
    operationType: 'washing',
    inputQuantityKg: '',
    expectedOutputKg: '',
    processingCostUsd: '',
    notes: ''
  });

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

  // Query declarations - must be before useEffects that reference error variables
  const { data: warehouseStock, isLoading: stockLoading, refetch, error: stockError } = useQuery<WarehouseStockResponse>({
    queryKey: ['/api/warehouse/stock'],
    retry: (failureCount, error: any) => {
      // Don't retry on 403 errors
      if (error?.message?.includes('403')) return false;
      return failureCount < 3;
    },
  });

  const { data: suppliers, error: suppliersError } = useQuery<SuppliersResponse>({
    queryKey: ['/api/suppliers'],
    retry: (failureCount, error: any) => {
      // Don't retry on 403 errors
      if (error?.message?.includes('403')) return false;
      return failureCount < 3;
    },
  });

  // Handle 403 errors for data access
  useEffect(() => {
    if (stockError?.message?.includes('403')) {
      toast({
        title: "Access Restricted",
        description: `Warehouse stock access requires warehouse role. Current role: ${userRole || 'unknown'}`,
        variant: "destructive",
      });
    }
  }, [stockError, userRole, toast]);

  useEffect(() => {
    if (suppliersError?.message?.includes('403')) {
      toast({
        title: "Access Restricted", 
        description: `Supplier access requires warehouse role. Current role: ${userRole || 'unknown'}`,
        variant: "destructive",
      });
    }
  }, [suppliersError, userRole, toast]);

  // Advanced warehouse operations queries
  const { data: qualityStandards } = useQuery<QualityStandard[]>({
    queryKey: ['/api/warehouse/quality-standards'],
  });

  const { data: warehouseBatches } = useQuery<WarehouseBatch[]>({
    queryKey: ['/api/warehouse/batches'],
  });

  const { data: qualityInspections } = useQuery<QualityInspection[]>({
    queryKey: ['/api/warehouse/quality-inspections'],
  });

  const { data: inventoryConsumption } = useQuery<InventoryConsumption[]>({
    queryKey: ['/api/warehouse/inventory-consumption'],
  });

  const { data: processingOperations } = useQuery<ProcessingOperation[]>({
    queryKey: ['/api/warehouse/processing-operations'],
  });

  const { data: stockTransfers } = useQuery<StockTransfer[]>({
    queryKey: ['/api/warehouse/stock-transfers'],
  });

  const { data: inventoryAdjustments } = useQuery<InventoryAdjustment[]>({
    queryKey: ['/api/warehouse/inventory-adjustments'],
  });

  const { data: consumptionAnalytics } = useQuery<{
    totalConsumed?: number;
    averageCostPerKg?: number;
    fifoCompliance?: number;
  }>({
    queryKey: ['/api/warehouse/consumption-analytics'],
  });

  const { data: stockAging } = useQuery<any[]>({
    queryKey: ['/api/warehouse/stock-aging'],
  });

  const { data: advancedAnalytics } = useQuery({
    queryKey: ['/api/warehouse/analytics/advanced'],
  });

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers?.find((s: any) => s.id === supplierId);
    return supplier?.name || 'Unknown Supplier';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AWAITING_DECISION':
        return 'bg-yellow-100 text-yellow-800';
      case 'AWAITING_FILTER':
        return 'bg-orange-100 text-orange-800';
      case 'READY_TO_SHIP':
        return 'bg-green-100 text-green-800';
      case 'NON_CLEAN':
        return 'bg-red-100 text-red-800';
      case 'READY_FOR_SALE':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filterStockByStatus = (status: string) => {
    return warehouseStock?.filter((stock: any) => stock.status === status) || [];
  };

  const filterStockByWarehouse = (warehouse: string) => {
    return warehouseStock?.filter((stock: any) => stock.warehouse === warehouse) || [];
  };

  const getTotalWeight = (stocks: any[]) => {
    return stocks.reduce((sum, stock) => sum + parseFloat(stock.qtyKgClean), 0);
  };

  const getTotalValue = (stocks: any[]) => {
    return stocks.reduce((sum, stock) => {
      const weight = parseFloat(stock.qtyKgClean);
      const cost = parseFloat(stock.unitCostCleanUsd || '0');
      return sum + (weight * cost);
    }, 0);
  };

  // Mutation for status updates
  const statusUpdateMutation = useMutation({
    mutationFn: async ({ stockId, status }: { stockId: string; status: string }) => {
      return apiRequest('PATCH', `/api/warehouse/stock/${stockId}/status`, { status });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Stock status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/stock'] });
      refetch();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update stock status",
        variant: "destructive" 
      });
    }
  });

  // Mutation for filtering operations
  const filterMutation = useMutation({
    mutationFn: async ({ purchaseId, outputCleanKg, outputNonCleanKg }: { purchaseId: string; outputCleanKg: string; outputNonCleanKg: string }) => {
      return apiRequest('POST', '/api/warehouse/filter', { purchaseId, outputCleanKg, outputNonCleanKg });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Filter operation completed successfully" });
      setFilterDialogOpen(false);
      setFilterData({ cleanKg: '', nonCleanKg: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/stock'] });
      refetch();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to execute filter operation",
        variant: "destructive" 
      });
    }
  });

  // Mutation for moving to final warehouse
  const moveMutation = useMutation({
    mutationFn: async ({ stockId }: { stockId: string }) => {
      return apiRequest('POST', '/api/warehouse/move-to-final', { stockId });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Stock moved to final warehouse successfully" });
      setMoveDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/stock'] });
      refetch();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to move stock to final warehouse",
        variant: "destructive" 
      });
    }
  });

  // Advanced warehouse mutations
  const qualityGradingMutation = useMutation({
    mutationFn: async ({ stockId, qualityGrade, qualityScore }: { stockId: string; qualityGrade: string; qualityScore?: string }) => {
      return apiRequest('PATCH', `/api/warehouse/stock/${stockId}/assign-quality-grade`, { qualityGrade, qualityScore });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Quality grade assigned successfully" });
      setQualityGradingDialogOpen(false);
      setQualityGradeData({ grade: '', score: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/stock'] });
      refetch();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to assign quality grade",
        variant: "destructive" 
      });
    }
  });

  const inspectionMutation = useMutation({
    mutationFn: async (inspectionData: any) => {
      return apiRequest('POST', '/api/warehouse/quality-inspections', inspectionData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Quality inspection created successfully" });
      setInspectionDialogOpen(false);
      setInspectionData({ inspectionType: 'incoming', moistureContent: '', defectCount: '', cupQuality: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/quality-inspections'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create quality inspection",
        variant: "destructive" 
      });
    }
  });

  const batchMutation = useMutation({
    mutationFn: async (batchData: any) => {
      return apiRequest('POST', '/api/warehouse/batches', batchData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Warehouse batch created successfully" });
      setBatchDialogOpen(false);
      setBatchData({ batchNumber: '', supplierId: '', qualityGrade: '', totalQuantityKg: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/batches'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create warehouse batch",
        variant: "destructive" 
      });
    }
  });

  const consumptionMutation = useMutation({
    mutationFn: async ({ warehouseStockId, quantity, consumptionType, allocatedTo }: { 
      warehouseStockId: string; 
      quantity: string; 
      consumptionType: string; 
      allocatedTo?: string 
    }) => {
      return apiRequest('POST', '/api/warehouse/inventory-consumption/fifo', { warehouseStockId, quantity, consumptionType, allocatedTo });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Inventory consumption recorded successfully" });
      setConsumptionDialogOpen(false);
      setConsumptionData({ consumptionType: 'sale', quantity: '', allocatedTo: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/inventory-consumption'] });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/stock'] });
      refetch();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to record inventory consumption",
        variant: "destructive" 
      });
    }
  });

  const processingMutation = useMutation({
    mutationFn: async (operationData: any) => {
      return apiRequest('POST', '/api/warehouse/processing-operations', operationData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Processing operation created successfully" });
      setProcessingDialogOpen(false);
      setProcessingData({ operationType: 'washing', inputQuantityKg: '', expectedOutputKg: '', processingCostUsd: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/processing-operations'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create processing operation",
        variant: "destructive" 
      });
    }
  });

  const traceabilityMutation = useMutation({
    mutationFn: async ({ stockId }: { stockId: string }) => {
      return apiRequest('GET', `/api/warehouse/trace/stock/${stockId}/origin`);
    },
    onSuccess: (data) => {
      // Handle traceability data display
      console.log('Traceability data:', data);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to trace stock origin",
        variant: "destructive" 
      });
    }
  });

  const handleStatusChange = (stockId: string, status: string) => {
    statusUpdateMutation.mutate({ stockId, status });
  };

  const handleFilterSubmit = () => {
    if (!selectedStock || !filterData.cleanKg || !filterData.nonCleanKg) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    
    const totalOutput = parseFloat(filterData.cleanKg) + parseFloat(filterData.nonCleanKg);
    const totalInput = parseFloat(selectedStock.qtyKgTotal);
    
    if (totalOutput > totalInput) {
      toast({ 
        title: "Error", 
        description: "Filter output cannot exceed input weight",
        variant: "destructive" 
      });
      return;
    }
    
    filterMutation.mutate({
      purchaseId: selectedStock.purchaseId,
      outputCleanKg: filterData.cleanKg,
      outputNonCleanKg: filterData.nonCleanKg
    });
  };

  const handleMoveToFinal = (stock: any) => {
    moveMutation.mutate({ stockId: stock.id });
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Stock filtering by status and warehouse
  const firstWarehouse = filterStockByWarehouse('FIRST');
  const finalWarehouse = filterStockByWarehouse('FINAL');
  
  const awaitingDecision = filterStockByStatus('AWAITING_DECISION');
  const awaitingFilter = filterStockByStatus('AWAITING_FILTER');
  const readyToShip = filterStockByStatus('READY_TO_SHIP');
  const nonClean = filterStockByStatus('NON_CLEAN');
  const readyForSale = filterStockByStatus('READY_FOR_SALE');

  return (
    <div className="h-full flex" data-testid="warehouse">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Warehouse</h2>
              <p className="text-sm text-muted-foreground">Manage inventory through first and final warehouse</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-background p-6">
          <Tabs defaultValue="first-warehouse" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="first-warehouse">First Warehouse</TabsTrigger>
              <TabsTrigger value="final-warehouse">Final Warehouse</TabsTrigger>
              <TabsTrigger value="quality-control">Quality Control</TabsTrigger>
              <TabsTrigger value="batch-management">Batches</TabsTrigger>
              <TabsTrigger value="consumption-tracking">Consumption</TabsTrigger>
              <TabsTrigger value="processing-operations">Processing</TabsTrigger>
            </TabsList>
            
            <TabsContent value="first-warehouse" className="space-y-6">
              {/* UI Filtering/Search Tools */}
              <Card>
                <CardHeader className="pb-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">SEARCH & FILTER TOOLS</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Supplier Filter */}
                    <div>
                      <Label htmlFor="supplier-filter" className="text-xs">Filter by Supplier</Label>
                      <Select 
                        onValueChange={(value) => setUiFilters(prev => ({ ...prev, supplier: value === 'all' ? '' : value }))}
                        value={uiFilters.supplier || 'all'}
                      >
                        <SelectTrigger id="supplier-filter" data-testid="supplier-filter">
                          <SelectValue placeholder="All Suppliers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Suppliers</SelectItem>
                          {suppliers?.map((supplier: any) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <Label htmlFor="status-filter" className="text-xs">Filter by Status</Label>
                      <Select 
                        onValueChange={(value) => setUiFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}
                        value={uiFilters.status || 'all'}
                      >
                        <SelectTrigger id="status-filter" data-testid="status-filter">
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="AWAITING_DECISION">Awaiting Decision</SelectItem>
                          <SelectItem value="AWAITING_FILTER">Awaiting Filter</SelectItem>
                          <SelectItem value="READY_TO_SHIP">Ready to Ship</SelectItem>
                          <SelectItem value="NON_CLEAN">Non-Clean</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Order ID Search */}
                    <div>
                      <Label htmlFor="order-search" className="text-xs">Search by Order ID</Label>
                      <Input
                        id="order-search"
                        type="text"
                        placeholder="Enter Order ID"
                        value={uiFilters.orderId || ''}
                        onChange={(e) => setUiFilters(prev => ({ ...prev, orderId: e.target.value }))}
                        data-testid="order-search"
                      />
                    </div>

                    {/* Date Range */}
                    <div>
                      <Label htmlFor="date-filter" className="text-xs">Filter by Date Range</Label>
                      <Input
                        id="date-filter"
                        type="date"
                        value={uiFilters.dateFrom || ''}
                        onChange={(e) => setUiFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                        data-testid="date-filter"
                      />
                    </div>

                    {/* Clear Filters Button */}
                    <div className="md:col-span-4 flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setUiFilters({})}
                        data-testid="clear-filters"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Awaiting Decision</div>
                    <div className="text-2xl font-bold" data-testid="awaiting-decision-count">
                      {getTotalWeight(awaitingDecision).toFixed(0)} kg
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Awaiting Filter</div>
                    <div className="text-2xl font-bold" data-testid="awaiting-filter-count">
                      {getTotalWeight(awaitingFilter).toFixed(0)} kg
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Ready to Ship</div>
                    <div className="text-2xl font-bold" data-testid="ready-to-ship-count">
                      {getTotalWeight(readyToShip).toFixed(0)} kg
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Non-Clean</div>
                    <div className="text-2xl font-bold" data-testid="non-clean-count">
                      {getTotalWeight(nonClean).toFixed(0)} kg
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stock Table */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">First Warehouse Inventory</h3>
                </CardHeader>
                <CardContent>
                  {stockLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-muted rounded w-full mb-2" />
                          <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                              Supplier
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                              Total Weight (kg)
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                              Clean Weight (kg)
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                              Non-Clean Weight (kg)
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                              Unit Cost (USD)
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                              Cartons
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {(() => {
                            // Apply UI filters to the warehouse stock
                            let filteredStock = warehouseStock?.filter((stock: any) => stock.warehouse === 'FIRST') || [];
                            
                            // Apply supplier filter
                            if (uiFilters.supplier) {
                              filteredStock = filteredStock.filter((stock: any) => stock.supplierId === uiFilters.supplier);
                            }
                            
                            // Apply status filter
                            if (uiFilters.status) {
                              filteredStock = filteredStock.filter((stock: any) => stock.status === uiFilters.status);
                            }
                            
                            // Apply order ID filter
                            if (uiFilters.orderId) {
                              filteredStock = filteredStock.filter((stock: any) => 
                                stock.purchaseId?.toLowerCase().includes(uiFilters.orderId!.toLowerCase())
                              );
                            }
                            
                            // Apply date range filter
                            if (uiFilters.dateFrom) {
                              filteredStock = filteredStock.filter((stock: any) => {
                                const stockDate = new Date(stock.createdAt || '');
                                const filterDate = new Date(uiFilters.dateFrom!);
                                return stockDate >= filterDate;
                              });
                            }
                            
                            if (filteredStock.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                    {Object.keys(uiFilters).length > 0 
                                      ? 'No inventory matches your filters'
                                      : 'No inventory found in first warehouse'
                                    }
                                  </td>
                                </tr>
                              );
                            }
                            
                            return filteredStock.map((stock: any) => (
                              <tr key={stock.id} className="hover:bg-muted/50" data-testid={`stock-${stock.id}`}>
                                <td className="px-4 py-4 text-sm">
                                  {getSupplierName(stock.supplierId)}
                                </td>
                                <td className="px-4 py-4">
                                  <Badge className={getStatusColor(stock.status)}>
                                    {stock.status.replace(/_/g, ' ')}
                                  </Badge>
                                </td>
                                <td className="px-4 py-4 text-sm">
                                  {parseFloat(stock.qtyKgTotal).toLocaleString()}
                                </td>
                                <td className="px-4 py-4 text-sm">
                                  {parseFloat(stock.qtyKgClean).toLocaleString()}
                                </td>
                                <td className="px-4 py-4 text-sm">
                                  {parseFloat(stock.qtyKgNonClean).toLocaleString()}
                                </td>
                                <td className="px-4 py-4 text-sm">
                                  ${parseFloat(stock.unitCostCleanUsd || '0').toFixed(2)}
                                </td>
                                <td className="px-4 py-4 text-sm">
                                  {stock.cartonsCount || 0}
                                </td>
                                <td className="px-4 py-4 text-sm space-x-2">
                                  {stock.status === 'AWAITING_DECISION' && (
                                    <div className="flex gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleStatusChange(stock.id, 'READY_TO_SHIP')}
                                        data-testid={`button-ready-to-ship-${stock.id}`}
                                      >
                                        <Package className="h-3 w-3 mr-1" />
                                        Ready to Ship
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleStatusChange(stock.id, 'AWAITING_FILTER')}
                                        data-testid={`button-awaiting-filter-${stock.id}`}
                                      >
                                        <Filter className="h-3 w-3 mr-1" />
                                        Needs Filter
                                      </Button>
                                    </div>
                                  )}
                                  {stock.status === 'AWAITING_FILTER' && (
                                    <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
                                      <DialogTrigger asChild>
                                        <Button 
                                          size="sm" 
                                          onClick={() => setSelectedStock(stock)}
                                          data-testid={`button-filter-${stock.id}`}
                                        >
                                          <Filter className="h-3 w-3 mr-1" />
                                          Execute Filter
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-md">
                                        <DialogHeader>
                                          <DialogTitle>Execute Filter Operation</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          {/* Stock Details */}
                                          <div className="p-3 bg-muted rounded-lg space-y-2">
                                            <div className="flex justify-between text-sm">
                                              <span className="text-muted-foreground">Supplier:</span>
                                              <span className="font-medium">{getSupplierName(selectedStock?.supplierId)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                              <span className="text-muted-foreground">Order ID:</span>
                                              <span className="font-mono">{selectedStock?.purchaseId || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                              <span className="text-muted-foreground">Input Weight:</span>
                                              <span className="font-semibold">{selectedStock?.qtyKgTotal} kg</span>
                                            </div>
                                          </div>

                                          {/* Filter Inputs */}
                                          <div>
                                            <Label htmlFor="cleanKg">Clean Weight (Export Quality)</Label>
                                            <Input
                                              id="cleanKg"
                                              type="number"
                                              step="0.1"
                                              value={filterData.cleanKg}
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                setFilterData(prev => ({ ...prev, cleanKg: value }));
                                                // Calculate yield percentage
                                                if (value && selectedStock?.qtyKgTotal) {
                                                  const yield_ = (parseFloat(value) / parseFloat(selectedStock.qtyKgTotal) * 100).toFixed(2);
                                                  setFilterYield(yield_);
                                                }
                                              }}
                                              placeholder="Enter clean weight in kg"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">Retains all purchase cost allocations</p>
                                          </div>
                                          <div>
                                            <Label htmlFor="nonCleanKg">Non-Clean Weight (Local Sale)</Label>
                                            <Input
                                              id="nonCleanKg"
                                              type="number"
                                              step="0.1"
                                              value={filterData.nonCleanKg}
                                              onChange={(e) => setFilterData(prev => ({ ...prev, nonCleanKg: e.target.value }))}
                                              placeholder="Enter non-clean weight in kg"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">Valued at zero (waste/local sale)</p>
                                          </div>

                                          {/* Validation & Yield Display */}
                                          {filterData.cleanKg && filterData.nonCleanKg && (
                                            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2">
                                              <div className="flex justify-between text-sm">
                                                <span>Total Output:</span>
                                                <span className="font-medium">
                                                  {(parseFloat(filterData.cleanKg || '0') + parseFloat(filterData.nonCleanKg || '0')).toFixed(2)} kg
                                                </span>
                                              </div>
                                              <div className="flex justify-between text-sm">
                                                <span>Filter Yield %:</span>
                                                <span className="font-semibold text-green-600 dark:text-green-400">
                                                  {filterYield}%
                                                </span>
                                              </div>
                                              {(parseFloat(filterData.cleanKg || '0') + parseFloat(filterData.nonCleanKg || '0')) > parseFloat(selectedStock?.qtyKgTotal || '0') && (
                                                <p className="text-xs text-red-600 dark:text-red-400">
                                                  ⚠️ Total output exceeds input weight!
                                                </p>
                                              )}
                                            </div>
                                          )}

                                          <Button 
                                            onClick={handleFilterSubmit}
                                            disabled={
                                              filterMutation.isPending || 
                                              !filterData.cleanKg || 
                                              !filterData.nonCleanKg ||
                                              (parseFloat(filterData.cleanKg || '0') + parseFloat(filterData.nonCleanKg || '0')) > parseFloat(selectedStock?.qtyKgTotal || '0')
                                            }
                                            className="w-full"
                                          >
                                            {filterMutation.isPending ? (
                                              <>
                                                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-r-transparent" />
                                                Processing Filter...
                                              </>
                                            ) : (
                                              'Execute Filter Operation'
                                            )}
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                  {stock.status === 'READY_TO_SHIP' && (
                                    <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
                                      <DialogTrigger asChild>
                                        <Button 
                                          size="sm"
                                          onClick={() => setSelectedStock(stock)}
                                          data-testid={`button-move-final-${stock.id}`}
                                        >
                                          <ArrowRight className="h-3 w-3 mr-1" />
                                          Move to Final
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Move to Final Warehouse</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <p>Move {selectedStock?.qtyKgClean} kg to the final warehouse?</p>
                                          <div className="flex gap-2">
                                            <Button 
                                              onClick={() => handleMoveToFinal(selectedStock)}
                                              disabled={moveMutation.isPending}
                                              className="flex-1"
                                            >
                                              {moveMutation.isPending ? 'Moving...' : 'Confirm Move'}
                                            </Button>
                                            <Button 
                                              variant="outline" 
                                              onClick={() => setMoveDialogOpen(false)}
                                              className="flex-1"
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                  
                                  {/* Traceability Button - Available for all stock items */}
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedStock(stock);
                                      setTraceabilityDialogOpen(true);
                                      traceabilityMutation.mutate({ stockId: stock.id });
                                    }}
                                    data-testid={`button-trace-${stock.id}`}
                                    className="mt-1"
                                  >
                                    <Search className="h-3 w-3 mr-1" />
                                    Trace Origin
                                  </Button>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quality-control" className="space-y-6">
              {/* Quality Control Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Pending Inspections</div>
                        <div className="text-2xl font-bold">
                          {qualityInspections?.filter((i: any) => i.status === 'pending').length || 0}
                        </div>
                      </div>
                      <ClipboardCheck className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Approved Quality</div>
                        <div className="text-2xl font-bold">
                          {qualityInspections?.filter((i: any) => i.status === 'approved').length || 0}
                        </div>
                      </div>
                      <Star className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Quality Standards</div>
                        <div className="text-2xl font-bold">
                          {qualityStandards?.filter((s: any) => s.isActive).length || 0}
                        </div>
                      </div>
                      <Settings className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quality Actions */}
              <div className="flex flex-wrap gap-3">
                <Dialog open={qualityGradingDialogOpen} onOpenChange={setQualityGradingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-assign-quality-grade">
                      <Star className="h-4 w-4 mr-2" />
                      Assign Quality Grade
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Assign Quality Grade</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="stock-select">Select Stock Item</Label>
                        <Select onValueChange={(value) => setSelectedStock(warehouseStock?.find((s: any) => s.id === value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose stock item" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouseStock?.map((stock: any) => (
                              <SelectItem key={stock.id} value={stock.id}>
                                {getSupplierName(stock.supplierId)} - {stock.qtyKgClean}kg
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="quality-grade">Quality Grade</Label>
                        <Select onValueChange={(value) => setQualityGradeData(prev => ({ ...prev, grade: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select quality grade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AA">AA Grade (Premium)</SelectItem>
                            <SelectItem value="AB">AB Grade (High Quality)</SelectItem>
                            <SelectItem value="B">B Grade (Good Quality)</SelectItem>
                            <SelectItem value="C">C Grade (Standard)</SelectItem>
                            <SelectItem value="PB">PB Grade (Peaberry)</SelectItem>
                            <SelectItem value="TT">TT Grade (Screen 15)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="quality-score">Quality Score (0-100)</Label>
                        <Input
                          id="quality-score"
                          type="number"
                          min="0"
                          max="100"
                          value={qualityGradeData.score}
                          onChange={(e) => setQualityGradeData(prev => ({ ...prev, score: e.target.value }))}
                          placeholder="Enter quality score"
                        />
                      </div>
                      <div>
                        <Label htmlFor="quality-notes">Quality Notes</Label>
                        <Textarea
                          id="quality-notes"
                          value={qualityGradeData.notes}
                          onChange={(e) => setQualityGradeData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Add quality assessment notes"
                        />
                      </div>
                      <Button 
                        onClick={() => {
                          if (!selectedStock || !qualityGradeData.grade) {
                            toast({ title: "Error", description: "Please select stock and quality grade", variant: "destructive" });
                            return;
                          }
                          qualityGradingMutation.mutate({
                            stockId: selectedStock.id,
                            qualityGrade: qualityGradeData.grade,
                            qualityScore: qualityGradeData.score
                          });
                        }}
                        disabled={qualityGradingMutation.isPending}
                        className="w-full"
                      >
                        {qualityGradingMutation.isPending ? 'Assigning...' : 'Assign Quality Grade'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={inspectionDialogOpen} onOpenChange={setInspectionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" data-testid="button-create-inspection">
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Create Inspection
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Quality Inspection</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="inspection-type">Inspection Type</Label>
                        <Select onValueChange={(value) => setInspectionData(prev => ({ ...prev, inspectionType: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select inspection type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="incoming">Incoming Goods Inspection</SelectItem>
                            <SelectItem value="processing">Processing Quality Check</SelectItem>
                            <SelectItem value="storage">Storage Condition Check</SelectItem>
                            <SelectItem value="pre_shipment">Pre-Shipment Inspection</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="moisture-content">Moisture Content (%)</Label>
                          <Input
                            id="moisture-content"
                            type="number"
                            step="0.1"
                            value={inspectionData.moistureContent}
                            onChange={(e) => setInspectionData(prev => ({ ...prev, moistureContent: e.target.value }))}
                            placeholder="12.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="defect-count">Defect Count</Label>
                          <Input
                            id="defect-count"
                            type="number"
                            value={inspectionData.defectCount}
                            onChange={(e) => setInspectionData(prev => ({ ...prev, defectCount: e.target.value }))}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="cup-quality">Cup Quality Score (0-100)</Label>
                        <Input
                          id="cup-quality"
                          type="number"
                          min="0"
                          max="100"
                          value={inspectionData.cupQuality}
                          onChange={(e) => setInspectionData(prev => ({ ...prev, cupQuality: e.target.value }))}
                          placeholder="85"
                        />
                      </div>
                      <div>
                        <Label htmlFor="inspection-notes">Inspection Notes</Label>
                        <Textarea
                          id="inspection-notes"
                          value={inspectionData.notes}
                          onChange={(e) => setInspectionData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Add detailed inspection notes"
                        />
                      </div>
                      <Button 
                        onClick={() => {
                          if (!selectedStock) {
                            toast({ title: "Error", description: "Please select a stock item first", variant: "destructive" });
                            return;
                          }
                          inspectionMutation.mutate({
                            ...inspectionData,
                            warehouseStockId: selectedStock.id,
                            testResults: {
                              moistureContent: inspectionData.moistureContent,
                              defectCount: inspectionData.defectCount,
                              cupQuality: inspectionData.cupQuality
                            }
                          });
                        }}
                        disabled={inspectionMutation.isPending}
                        className="w-full"
                      >
                        {inspectionMutation.isPending ? 'Creating...' : 'Create Inspection'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Quality Inspections Table */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Quality Inspections</h3>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Quality Grade
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Overall Score
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Inspector
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {qualityInspections?.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                              No quality inspections found
                            </td>
                          </tr>
                        ) : (
                          qualityInspections?.map((inspection: any) => (
                            <tr key={inspection.id} className="hover:bg-muted/50">
                              <td className="px-4 py-4 text-sm">
                                {inspection.inspectionType?.replace('_', ' ')}
                              </td>
                              <td className="px-4 py-4">
                                <Badge 
                                  className={
                                    inspection.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    inspection.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }
                                >
                                  {inspection.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {inspection.qualityGrade || 'Not graded'}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {inspection.overallScore ? `${inspection.overallScore}/100` : 'Not scored'}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                Inspector {inspection.inspectorId?.slice(-4)}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {new Date(inspection.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {inspection.status === 'pending' && (
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline">
                                      Complete
                                    </Button>
                                    <Button size="sm">
                                      Approve
                                    </Button>
                                  </div>
                                )}
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

            <TabsContent value="batch-management" className="space-y-6">
              {/* Batch Management Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Active Batches</div>
                        <div className="text-2xl font-bold">
                          {warehouseBatches?.filter((b: any) => b.isActive).length || 0}
                        </div>
                      </div>
                      <Package className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Total Quantity (kg)</div>
                        <div className="text-2xl font-bold">
                          {warehouseBatches?.reduce((sum: number, b: any) => sum + parseFloat(b.totalQuantityKg || '0'), 0).toFixed(0) || 0}
                        </div>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Premium Grade</div>
                        <div className="text-2xl font-bold">
                          {warehouseBatches?.filter((b: any) => ['AA', 'AB'].includes(b.qualityGrade)).length || 0}
                        </div>
                      </div>
                      <Star className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Average Quality</div>
                        <div className="text-2xl font-bold">
                          {warehouseBatches?.length ? 
                            (warehouseBatches.filter((b: any) => b.qualityScore).reduce((sum: number, b: any) => sum + parseFloat(b.qualityScore || '0'), 0) / 
                            warehouseBatches.filter((b: any) => b.qualityScore).length).toFixed(1) : '0'
                          }
                        </div>
                      </div>
                      <BarChart3 className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Batch Actions */}
              <div className="flex flex-wrap gap-3">
                <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-batch">
                      <Package className="h-4 w-4 mr-2" />
                      Create New Batch
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Warehouse Batch</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="batch-number">Batch Number</Label>
                        <Input
                          id="batch-number"
                          value={batchData.batchNumber}
                          onChange={(e) => setBatchData(prev => ({ ...prev, batchNumber: e.target.value }))}
                          placeholder="Enter batch number (e.g., BT-2024-001)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="batch-supplier">Supplier</Label>
                        <Select onValueChange={(value) => setBatchData(prev => ({ ...prev, supplierId: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers?.map((supplier: any) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="batch-grade">Quality Grade</Label>
                          <Select onValueChange={(value) => setBatchData(prev => ({ ...prev, qualityGrade: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Grade" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AA">AA Grade</SelectItem>
                              <SelectItem value="AB">AB Grade</SelectItem>
                              <SelectItem value="B">B Grade</SelectItem>
                              <SelectItem value="C">C Grade</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="batch-quantity">Total Quantity (kg)</Label>
                          <Input
                            id="batch-quantity"
                            type="number"
                            value={batchData.totalQuantityKg}
                            onChange={(e) => setBatchData(prev => ({ ...prev, totalQuantityKg: e.target.value }))}
                            placeholder="1000"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="batch-notes">Batch Notes</Label>
                        <Textarea
                          id="batch-notes"
                          value={batchData.notes}
                          onChange={(e) => setBatchData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Add batch notes and origin information"
                        />
                      </div>
                      <Button 
                        onClick={() => {
                          if (!batchData.batchNumber || !batchData.supplierId) {
                            toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
                            return;
                          }
                          batchMutation.mutate(batchData);
                        }}
                        disabled={batchMutation.isPending}
                        className="w-full"
                      >
                        {batchMutation.isPending ? 'Creating...' : 'Create Batch'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" data-testid="button-split-batch">
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Split Batch
                </Button>
              </div>

              {/* Batches Table */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Warehouse Batches</h3>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Batch Number
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Supplier
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Quality Grade
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Total Quantity (kg)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Remaining (kg)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {warehouseBatches?.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                              No warehouse batches found
                            </td>
                          </tr>
                        ) : (
                          warehouseBatches?.map((batch: any) => (
                            <tr key={batch.id} className="hover:bg-muted/50">
                              <td className="px-4 py-4 text-sm font-mono">
                                {batch.batchNumber}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {getSupplierName(batch.supplierId)}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                <Badge className={
                                  ['AA', 'AB'].includes(batch.qualityGrade) ? 'bg-green-100 text-green-800' :
                                  batch.qualityGrade === 'B' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }>
                                  {batch.qualityGrade}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {parseFloat(batch.totalQuantityKg).toLocaleString()}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {parseFloat(batch.remainingQuantityKg || batch.totalQuantityKg).toLocaleString()}
                              </td>
                              <td className="px-4 py-4">
                                <Badge className={batch.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {batch.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 text-sm space-x-2">
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
                                <Button size="sm" variant="outline">
                                  Split
                                </Button>
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

            <TabsContent value="consumption-tracking" className="space-y-6">
              {/* Consumption Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Today's Consumption</div>
                        <div className="text-2xl font-bold">
                          {consumptionAnalytics?.totalConsumed?.toFixed(0) || 0} kg
                        </div>
                      </div>
                      <TrendingUp className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Cost/kg (USD)</div>
                        <div className="text-2xl font-bold">
                          ${consumptionAnalytics?.averageCostPerKg?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                      <BarChart3 className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">FIFO Compliance</div>
                        <div className="text-2xl font-bold">
                          {consumptionAnalytics?.fifoCompliance?.toFixed(1) || 100}%
                        </div>
                      </div>
                      <ClipboardCheck className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Stock Aging Days</div>
                        <div className="text-2xl font-bold">
                          {stockAging?.length ? 
                            (stockAging.reduce((sum: number, item: any) => sum + item.daysInStock, 0) / stockAging.length).toFixed(0) : 0
                          }
                        </div>
                      </div>
                      <Calendar className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Consumption Actions */}
              <div className="flex flex-wrap gap-3">
                <Dialog open={consumptionDialogOpen} onOpenChange={setConsumptionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-record-consumption">
                      <Zap className="h-4 w-4 mr-2" />
                      Record Consumption
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Inventory Consumption (FIFO)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="stock-for-consumption">Select Stock Item</Label>
                        <Select onValueChange={(value) => setSelectedStock(warehouseStock?.find((s: any) => s.id === value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose stock for consumption" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouseStock?.map((stock: any) => (
                              <SelectItem key={stock.id} value={stock.id}>
                                {getSupplierName(stock.supplierId)} - {stock.qtyKgClean}kg (${stock.unitCostCleanUsd})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="consumption-type">Consumption Type</Label>
                          <Select onValueChange={(value) => setConsumptionData(prev => ({ ...prev, consumptionType: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sale">Sale/Order</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="sampling">Sampling</SelectItem>
                              <SelectItem value="loss">Loss/Waste</SelectItem>
                              <SelectItem value="transfer">Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="consumption-quantity">Quantity (kg)</Label>
                          <Input
                            id="consumption-quantity"
                            type="number"
                            step="0.1"
                            value={consumptionData.quantity}
                            onChange={(e) => setConsumptionData(prev => ({ ...prev, quantity: e.target.value }))}
                            placeholder="Enter quantity"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="allocated-to">Allocated To</Label>
                        <Input
                          id="allocated-to"
                          value={consumptionData.allocatedTo}
                          onChange={(e) => setConsumptionData(prev => ({ ...prev, allocatedTo: e.target.value }))}
                          placeholder="Order ID, Customer, or Department"
                        />
                      </div>
                      <div>
                        <Label htmlFor="consumption-notes">Consumption Notes</Label>
                        <Textarea
                          id="consumption-notes"
                          value={consumptionData.notes}
                          onChange={(e) => setConsumptionData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Add consumption details and reasons"
                        />
                      </div>
                      <Button 
                        onClick={() => {
                          if (!selectedStock || !consumptionData.quantity || !consumptionData.consumptionType) {
                            toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
                            return;
                          }
                          consumptionMutation.mutate({
                            warehouseStockId: selectedStock.id,
                            quantity: consumptionData.quantity,
                            consumptionType: consumptionData.consumptionType,
                            allocatedTo: consumptionData.allocatedTo
                          });
                        }}
                        disabled={consumptionMutation.isPending}
                        className="w-full"
                      >
                        {consumptionMutation.isPending ? 'Recording...' : 'Record Consumption'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" data-testid="button-view-aging">
                  <Calendar className="h-4 w-4 mr-2" />
                  Stock Aging Report
                </Button>

                <Button variant="outline" data-testid="button-fifo-analysis">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  FIFO Analysis
                </Button>
              </div>

              {/* Recent Consumption Table */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Recent Inventory Consumption</h3>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Quantity (kg)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Cost (USD)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Allocated To
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            FIFO Compliant
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {inventoryConsumption?.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                              No inventory consumption records found
                            </td>
                          </tr>
                        ) : (
                          inventoryConsumption?.slice(0, 10).map((consumption: any) => (
                            <tr key={consumption.id} className="hover:bg-muted/50">
                              <td className="px-4 py-4 text-sm">
                                {new Date(consumption.consumedAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                <Badge className={
                                  consumption.consumptionType === 'sale' ? 'bg-green-100 text-green-800' :
                                  consumption.consumptionType === 'processing' ? 'bg-blue-100 text-blue-800' :
                                  consumption.consumptionType === 'loss' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }>
                                  {consumption.consumptionType}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {parseFloat(consumption.quantityKg).toLocaleString()}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                ${parseFloat(consumption.totalCostUsd || '0').toFixed(2)}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {consumption.allocatedTo || 'Not specified'}
                              </td>
                              <td className="px-4 py-4">
                                <Badge className={consumption.isFifoCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {consumption.isFifoCompliant ? 'Yes' : 'No'}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 text-sm">
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
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

            <TabsContent value="processing-operations" className="space-y-6">
              {/* Processing Operations Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Active Operations</div>
                        <div className="text-2xl font-bold">
                          {processingOperations?.filter((op: any) => op.status === 'in_progress').length || 0}
                        </div>
                      </div>
                      <Zap className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Processing Volume</div>
                        <div className="text-2xl font-bold">
                          {processingOperations?.reduce((sum: number, op: any) => sum + parseFloat(op.inputQuantityKg || '0'), 0).toFixed(0) || 0} kg
                        </div>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Avg Yield Rate</div>
                        <div className="text-2xl font-bold">
                          {processingOperations?.length ? 
                            (processingOperations.filter((op: any) => op.yieldPercentage)
                              .reduce((sum: number, op: any) => sum + parseFloat(op.yieldPercentage || '0'), 0) / 
                              processingOperations.filter((op: any) => op.yieldPercentage).length).toFixed(1) : '0'
                          }%
                        </div>
                      </div>
                      <BarChart3 className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Processing Cost</div>
                        <div className="text-2xl font-bold">
                          ${processingOperations?.reduce((sum: number, op: any) => sum + parseFloat(op.processingCostUsd || '0'), 0).toFixed(0) || 0}
                        </div>
                      </div>
                      <Settings className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Processing Actions */}
              <div className="flex flex-wrap gap-3">
                <Dialog open={processingDialogOpen} onOpenChange={setProcessingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-processing-operation">
                      <Zap className="h-4 w-4 mr-2" />
                      Create Processing Operation
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Processing Operation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="operation-type">Operation Type</Label>
                        <Select onValueChange={(value) => setProcessingData(prev => ({ ...prev, operationType: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select operation type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="washing">Washing</SelectItem>
                            <SelectItem value="drying">Drying</SelectItem>
                            <SelectItem value="hulling">Hulling</SelectItem>
                            <SelectItem value="grading">Grading</SelectItem>
                            <SelectItem value="sorting">Sorting</SelectItem>
                            <SelectItem value="roasting">Roasting</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="processing-batch">Select Batch</Label>
                        <Select onValueChange={(value) => setSelectedBatch(warehouseBatches?.find((b: any) => b.id === value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose batch for processing" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouseBatches?.filter((b: any) => b.isActive).map((batch: any) => (
                              <SelectItem key={batch.id} value={batch.id}>
                                {batch.batchNumber} - {batch.totalQuantityKg}kg ({batch.qualityGrade})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="input-quantity">Input Quantity (kg)</Label>
                          <Input
                            id="input-quantity"
                            type="number"
                            step="0.1"
                            value={processingData.inputQuantityKg}
                            onChange={(e) => setProcessingData(prev => ({ ...prev, inputQuantityKg: e.target.value }))}
                            placeholder="1000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="expected-output">Expected Output (kg)</Label>
                          <Input
                            id="expected-output"
                            type="number"
                            step="0.1"
                            value={processingData.expectedOutputKg}
                            onChange={(e) => setProcessingData(prev => ({ ...prev, expectedOutputKg: e.target.value }))}
                            placeholder="850"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="processing-cost">Processing Cost (USD)</Label>
                        <Input
                          id="processing-cost"
                          type="number"
                          step="0.01"
                          value={processingData.processingCostUsd}
                          onChange={(e) => setProcessingData(prev => ({ ...prev, processingCostUsd: e.target.value }))}
                          placeholder="150.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="processing-notes">Processing Notes</Label>
                        <Textarea
                          id="processing-notes"
                          value={processingData.notes}
                          onChange={(e) => setProcessingData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Add processing details, parameters, and quality expectations"
                        />
                      </div>
                      <Button 
                        onClick={() => {
                          if (!selectedBatch || !processingData.operationType || !processingData.inputQuantityKg) {
                            toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
                            return;
                          }
                          processingMutation.mutate({
                            ...processingData,
                            batchId: selectedBatch.id
                          });
                        }}
                        disabled={processingMutation.isPending}
                        className="w-full"
                      >
                        {processingMutation.isPending ? 'Creating...' : 'Create Processing Operation'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" data-testid="button-processing-analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Processing Analytics
                </Button>

                <Button variant="outline" data-testid="button-yield-optimization">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Yield Optimization
                </Button>
              </div>

              {/* Processing Operations Table */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Processing Operations</h3>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Operation Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Batch
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Input (kg)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Output (kg)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Yield %
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Cost (USD)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {processingOperations?.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                              No processing operations found
                            </td>
                          </tr>
                        ) : (
                          processingOperations?.map((operation: any) => (
                            <tr key={operation.id} className="hover:bg-muted/50">
                              <td className="px-4 py-4 text-sm">
                                {operation.operationType}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {operation.batchNumber || 'N/A'}
                              </td>
                              <td className="px-4 py-4">
                                <Badge className={
                                  operation.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  operation.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  operation.status === 'failed' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }>
                                  {operation.status.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {parseFloat(operation.inputQuantityKg).toLocaleString()}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {operation.outputQuantityKg ? parseFloat(operation.outputQuantityKg).toLocaleString() : 'TBD'}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {operation.yieldPercentage ? `${operation.yieldPercentage}%` : 'TBD'}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                ${parseFloat(operation.processingCostUsd || '0').toFixed(2)}
                              </td>
                              <td className="px-4 py-4 text-sm space-x-2">
                                {operation.status === 'planned' && (
                                  <Button size="sm" variant="outline">
                                    Start
                                  </Button>
                                )}
                                {operation.status === 'in_progress' && (
                                  <Button size="sm">
                                    Complete
                                  </Button>
                                )}
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
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

            <TabsContent value="final-warehouse" className="space-y-6">
              {/* Summary Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Ready for Sale</div>
                  <div className="text-2xl font-bold" data-testid="ready-for-sale-count">
                    {getTotalWeight(readyForSale).toFixed(0)} kg
                  </div>
                </CardContent>
              </Card>

              {/* Stock Table */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Final Warehouse Inventory</h3>
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
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Clean Weight (kg)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Unit Cost (USD)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Cartons
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {warehouseStock?.filter((stock: any) => stock.warehouse === 'FINAL')?.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                              No inventory found in final warehouse
                            </td>
                          </tr>
                        ) : (
                          warehouseStock?.filter((stock: any) => stock.warehouse === 'FINAL')?.map((stock: any) => (
                            <tr key={stock.id} className="hover:bg-muted/50">
                              <td className="px-4 py-4 text-sm">
                                {getSupplierName(stock.supplierId)}
                              </td>
                              <td className="px-4 py-4">
                                <Badge className={getStatusColor(stock.status)}>
                                  {stock.status.replace(/_/g, ' ')}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {parseFloat(stock.qtyKgClean).toLocaleString()}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                ${parseFloat(stock.unitCostCleanUsd || '0').toFixed(2)}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {stock.cartonsCount || 0}
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

          {/* Comprehensive Traceability Dialog */}
          <Dialog open={traceabilityDialogOpen} onOpenChange={setTraceabilityDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Stock Traceability & Origin Tracking
                </DialogTitle>
              </DialogHeader>
              
              {traceabilityMutation.isPending ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                  <span>Loading traceability data...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stock Overview */}
                  {selectedStock && (
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold">Stock Overview</h3>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Stock ID</div>
                            <div className="font-mono">{selectedStock.id.slice(0, 8)}...</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Supplier</div>
                            <div>{getSupplierName(selectedStock.supplierId)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Clean Weight</div>
                            <div>{selectedStock.qtyKgClean} kg</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Current Status</div>
                            <Badge className={getStatusColor(selectedStock.status)}>
                              {selectedStock.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Purchase Origin */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Purchase Origin
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Purchase Date</div>
                            <div>{selectedStock?.createdAt ? new Date(selectedStock.createdAt).toLocaleDateString() : 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Unit Cost (Clean)</div>
                            <div>${selectedStock?.unitCostCleanUsd || '0.00'}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Total Value</div>
                            <div>${selectedStock ? (parseFloat(selectedStock.qtyKgClean) * parseFloat(selectedStock.unitCostCleanUsd)).toFixed(2) : '0.00'}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Purchase Notes</div>
                          <div className="mt-1 p-2 bg-muted rounded text-sm">
                            Original purchase from {getSupplierName(selectedStock?.supplierId || '')} - Quality assessed and received into first warehouse
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quality History */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Quality Assessment History
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {qualityInspections?.filter((inspection: any) => inspection.warehouseStockId === selectedStock?.id)
                          .map((inspection: any) => (
                            <div key={inspection.id} className="border-l-4 border-blue-200 pl-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium">{inspection.inspectionType?.replace('_', ' ').toUpperCase()}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(inspection.createdAt).toLocaleDateString()} - Inspector {inspection.inspectorId?.slice(-4)}
                                  </div>
                                </div>
                                <Badge className={
                                  inspection.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  inspection.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }>
                                  {inspection.status}
                                </Badge>
                              </div>
                              {inspection.testResults && (
                                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Moisture:</span> {inspection.testResults.moistureContent}%
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Defects:</span> {inspection.testResults.defectCount}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Cup Quality:</span> {inspection.testResults.cupQuality}/100
                                  </div>
                                </div>
                              )}
                              {inspection.qualityGrade && (
                                <div className="mt-2">
                                  <span className="text-sm text-muted-foreground">Quality Grade:</span>
                                  <Badge className="ml-2">{inspection.qualityGrade}</Badge>
                                </div>
                              )}
                            </div>
                          )) || (
                          <div className="text-center text-muted-foreground py-4">
                            No quality inspections recorded for this stock item
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Warehouse Operations Timeline */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <WarehouseIcon className="h-5 w-5" />
                        Warehouse Operations Timeline
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border-l-4 border-green-200 pl-4">
                          <div className="font-medium">INITIAL RECEIPT</div>
                          <div className="text-sm text-muted-foreground">
                            {selectedStock?.createdAt ? new Date(selectedStock.createdAt).toLocaleDateString() : 'N/A'} - Received into first warehouse
                          </div>
                          <div className="text-sm mt-1">
                            Quantity: {selectedStock?.qtyKgClean} kg clean, {selectedStock?.qtyKgNonClean} kg non-clean
                          </div>
                        </div>

                        {selectedStock?.status === 'FILTERED' && (
                          <div className="border-l-4 border-blue-200 pl-4">
                            <div className="font-medium">FILTERING COMPLETED</div>
                            <div className="text-sm text-muted-foreground">
                              Filtering operation completed - Stock processed and graded
                            </div>
                          </div>
                        )}

                        {selectedStock?.status === 'READY_TO_SHIP' && (
                          <div className="border-l-4 border-purple-200 pl-4">
                            <div className="font-medium">READY FOR SHIPPING</div>
                            <div className="text-sm text-muted-foreground">
                              Stock prepared and ready for final warehouse transfer
                            </div>
                          </div>
                        )}

                        {/* Processing Operations */}
                        {processingOperations?.filter((op: any) => op.warehouseStockId === selectedStock?.id)
                          .map((operation: any) => (
                            <div key={operation.id} className="border-l-4 border-orange-200 pl-4">
                              <div className="font-medium">{operation.operationType.toUpperCase()} OPERATION</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(operation.createdAt).toLocaleDateString()} - {operation.status}
                              </div>
                              <div className="text-sm mt-1">
                                Input: {operation.inputQuantityKg} kg → Output: {operation.outputQuantityKg || 'In Progress'} kg
                              </div>
                            </div>
                          )) || null}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Consumption & Allocation */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Consumption & Allocation History
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {inventoryConsumption?.filter((consumption: any) => consumption.warehouseStockId === selectedStock?.id)
                          .map((consumption: any) => (
                            <div key={consumption.id} className="border-l-4 border-red-200 pl-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium">{consumption.consumptionType.toUpperCase()}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(consumption.consumedAt).toLocaleDateString()} - {consumption.quantityKg} kg consumed
                                  </div>
                                </div>
                                <Badge className={consumption.isFifoCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {consumption.isFifoCompliant ? 'FIFO Compliant' : 'Non-FIFO'}
                                </Badge>
                              </div>
                              {consumption.allocatedTo && (
                                <div className="text-sm mt-1">
                                  <span className="text-muted-foreground">Allocated to:</span> {consumption.allocatedTo}
                                </div>
                              )}
                              <div className="text-sm mt-1">
                                <span className="text-muted-foreground">Cost:</span> ${consumption.totalCostUsd || '0.00'}
                              </div>
                            </div>
                          )) || (
                          <div className="text-center text-muted-foreground py-4">
                            No consumption records found for this stock item
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Batch Information */}
                  {warehouseBatches?.find((batch: any) => batch.warehouseStockId === selectedStock?.id) && (
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Batch Information
                        </h3>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const batch = warehouseBatches?.find((b: any) => b.warehouseStockId === selectedStock?.id);
                          return batch ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm text-muted-foreground">Batch Number</div>
                                <div className="font-mono">{batch.batchNumber}</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Quality Grade</div>
                                <Badge>{batch.qualityGrade}</Badge>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Total Quantity</div>
                                <div>{batch.totalQuantityKg} kg</div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Batch Status</div>
                                <Badge className={batch.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {batch.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </CardContent>
                    </Card>
                  )}

                  {/* Complete Audit Trail */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5" />
                        Complete Audit Trail
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between p-2 bg-muted/30 rounded">
                          <span>Stock Creation</span>
                          <span>{selectedStock?.createdAt ? new Date(selectedStock.createdAt).toLocaleString() : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/30 rounded">
                          <span>Last Status Update</span>
                          <span>{selectedStock?.updatedAt ? new Date(selectedStock.updatedAt).toLocaleString() : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/30 rounded">
                          <span>Quality Inspections</span>
                          <span>{qualityInspections?.filter((i: any) => i.warehouseStockId === selectedStock?.id).length || 0} completed</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/30 rounded">
                          <span>Processing Operations</span>
                          <span>{processingOperations?.filter((o: any) => o.warehouseStockId === selectedStock?.id).length || 0} performed</span>
                        </div>
                        <div className="flex justify-between p-2 bg-muted/30 rounded">
                          <span>Consumption Events</span>
                          <span>{inventoryConsumption?.filter((c: any) => c.warehouseStockId === selectedStock?.id).length || 0} recorded</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
