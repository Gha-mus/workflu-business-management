import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import type { Purchase, Supplier, Order, PurchasePayment, InsertPurchase, InsertPurchasePayment } from "@shared/schema";
import { 
  cartonsToKg, 
  kgToCartons, 
  calculateCartonEquivalents, 
  validateKgInput, 
  validateCartonInput, 
  roundKg,
  CARTON_WEIGHTS 
} from "@shared/measurementUnits";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, DollarSign, Edit, Eye, Trash2, Filter, X } from "lucide-react";
import { BackButton } from '@/components/ui/back-button';

// Purchase form schema for new purchases with carton validation
const purchaseFormSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  orderId: z.string().optional(),
  weight: z.string()
    .min(1, "Weight is required")
    .refine((val) => {
      const kg = parseFloat(val);
      return !isNaN(kg) && kg > 0 && validateKgInput(kg);
    }, "Weight must be a positive number greater than 0 with up to 3 decimal places"),
  pricePerKg: z.string()
    .min(1, "Price per kg is required")
    .refine((val) => parseFloat(val) > 0, "Price per kg must be greater than 0"),
  currency: z.enum(["USD", "ETB"]),
  paymentMethod: z.enum(["cash", "credit", "advance", "other"]),
  fundingSource: z.enum(["capital", "external"]),
  country: z.string().optional(),
  quality: z.string().optional(),
  notes: z.string().optional(),
});

// Payment form schema for recording payments
const paymentFormSchema = z.object({
  amount: z.string()
    .min(1, "Amount is required")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0"),
  paymentMethod: z.enum(["cash", "credit", "advance", "other"]),
  fundingSource: z.enum(["capital", "external"]),
  currency: z.enum(["USD", "ETB"]),
  reference: z.string().optional(),
  description: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;
type PaymentFormData = z.infer<typeof paymentFormSchema>;

export default function Purchases() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Modal states
  const [showNewPurchaseModal, setShowNewPurchaseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isPaymentValid, setIsPaymentValid] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    supplier: "all-suppliers",
    status: "all-statuses", // paid, partial, unpaid
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Carton input helper states
  const [inputMethod, setInputMethod] = useState<'kg' | 'cartons'>('kg');
  const [cartonCount, setCartonCount] = useState('');
  const [showCartonEquivalents, setShowCartonEquivalents] = useState(false);

  // Forms
  const purchaseForm = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      currency: "USD",
      paymentMethod: "cash",
      fundingSource: "capital",
    },
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      currency: "USD",
      paymentMethod: "cash",
      fundingSource: "capital",
    },
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

  // Watch payment amount for real-time validation
  const watchedAmount = useWatch({
    control: paymentForm.control,
    name: 'amount'
  });

  // Real-time payment validation
  useEffect(() => {
    if (selectedPurchase && showPaymentModal) {
      if (watchedAmount) {
        const paymentAmount = parseFloat(watchedAmount);
        const remaining = parseFloat(selectedPurchase.remaining);
        setIsPaymentValid(paymentAmount <= remaining && paymentAmount > 0);
      } else {
        setIsPaymentValid(true);
      }
    }
  }, [watchedAmount, selectedPurchase, showPaymentModal]);

  // Queries
  const { data: purchases, isLoading: purchasesLoading } = useQuery<Purchase[]>({
    queryKey: ['/api/purchases', filters],
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ['/api/purchases/suppliers'],
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: ['/api/sales/orders'],
  });

  const { data: exchangeRate } = useQuery<{ rate: number }>({
    queryKey: ['/api/settings/exchange-rate'],
  });

  const { data: purchasePayments } = useQuery<PurchasePayment[]>({
    queryKey: [`/api/purchases/${selectedPurchase?.id}/payments`, selectedPurchase?.id],
    enabled: !!selectedPurchase?.id,
  });

  // Mutations
  const createPurchaseMutation = useMutation({
    mutationFn: async (data: PurchaseFormData) => {
      const purchaseData = {
        ...data,
        weight: data.weight,
        pricePerKg: data.pricePerKg,
        total: (parseFloat(data.weight) * parseFloat(data.pricePerKg)).toString(),
        amountPaid: "0",
        remaining: (parseFloat(data.weight) * parseFloat(data.pricePerKg)).toString(),
      };
      return apiRequest('POST', `/api/purchases`, purchaseData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Purchase created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
      setShowNewPurchaseModal(false);
      purchaseForm.reset();
      // Reset carton input states
      setInputMethod('kg');
      setCartonCount('');
      setShowCartonEquivalents(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create purchase",
        variant: "destructive",
      });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      if (!selectedPurchase) throw new Error("No purchase selected");
      return apiRequest('POST', `/api/purchases/${selectedPurchase.id}/payments`, {
        ...data,
        amount: data.amount,
        purchaseId: selectedPurchase.id,
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Payment recorded successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
      queryClient.invalidateQueries({ queryKey: [`/api/purchases/${selectedPurchase?.id}/payments`, selectedPurchase?.id] });
      setShowPaymentModal(false);
      paymentForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const editPurchaseMutation = useMutation({
    mutationFn: async (data: PurchaseFormData) => {
      if (!selectedPurchase) throw new Error("No purchase selected");
      const updatedData = {
        ...data,
        weight: data.weight,
        pricePerKg: data.pricePerKg,
        total: (parseFloat(data.weight) * parseFloat(data.pricePerKg)).toString(),
        remaining: (parseFloat(data.weight) * parseFloat(data.pricePerKg) - parseFloat(selectedPurchase.amountPaid)).toString(),
      };
      return apiRequest('PATCH', `/api/purchases/${selectedPurchase.id}`, updatedData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Purchase updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
      setShowEditModal(false);
      setSelectedPurchase(null);
      purchaseForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update purchase",
        variant: "destructive",
      });
    },
  });

  const cancelPurchaseMutation = useMutation({
    mutationFn: async (purchaseId: string) => {
      return apiRequest('DELETE', `/api/purchases/${purchaseId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Purchase cancelled successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to cancel purchase",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers?.find(s => s.id === supplierId);
    return supplier?.name || 'Unknown Supplier';
  };

  const getOrderNumber = (orderId: string) => {
    const order = orders?.find(o => o.id === orderId);
    return order?.orderNumber || 'N/A';
  };

  const getPaymentStatus = (purchase: Purchase) => {
    const paid = parseFloat(purchase.amountPaid);
    const total = parseFloat(purchase.total);
    if (paid >= total) return 'paid';
    if (paid > 0) return 'partial';
    return 'unpaid';
  };

  const formatCurrency = (amount: string | number, currency: string = 'USD') => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${currency} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const filteredPurchases = purchases?.filter(purchase => {
    if (filters.dateFrom && new Date(purchase.date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(purchase.date) > new Date(filters.dateTo)) return false;
    if (filters.supplier && filters.supplier !== "all-suppliers" && purchase.supplierId !== filters.supplier) return false;
    if (filters.status && filters.status !== "all-statuses" && getPaymentStatus(purchase) !== filters.status) return false;
    return true;
  });

  const handleNewPurchase = (data: PurchaseFormData) => {
    // Weight is now auto-synced from carton input, so validation should pass
    createPurchaseMutation.mutate(data);
  };

  const handleRecordPayment = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowPaymentModal(true);
    paymentForm.reset({
      currency: purchase.currency as "USD" | "ETB",
      paymentMethod: "cash",
      fundingSource: purchase.fundingSource as "capital" | "external",
    });
  };

  const handleEditPurchase = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowEditModal(true);
    purchaseForm.reset({
      supplierId: purchase.supplierId,
      orderId: purchase.orderId || "",
      weight: purchase.weight,
      pricePerKg: purchase.pricePerKg,
      currency: purchase.currency as "USD" | "ETB",
      paymentMethod: purchase.paymentMethod as any,
      fundingSource: purchase.fundingSource as "capital" | "external",
      country: purchase.country || "",
      quality: purchase.quality || "",
    });
  };

  const handleViewDetails = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowDetailsModal(true);
  };

  const handleCancelPurchase = (purchase: Purchase) => {
    if (confirm(`Are you sure you want to cancel purchase ${purchase.purchaseNumber}? This will reverse stock and ledger entries.`)) {
      cancelPurchaseMutation.mutate(purchase.id);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex" data-testid="purchases-page">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <BackButton to="/" text="Back to Dashboard" mobileIconOnly={true} />
              <div>
                <h2 className="text-2xl font-bold text-foreground">Purchases</h2>
                <p className="text-sm text-muted-foreground">Manage purchase operations with complete audit trail</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="button-toggle-filters"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button onClick={() => setShowNewPurchaseModal(true)} data-testid="button-new-purchase">
                <Plus className="w-4 h-4 mr-2" />
                New Purchase
              </Button>
            </div>
          </div>
        </header>

        {/* Filters */}
        {showFilters && (
          <div className="bg-muted/50 border-b border-border px-6 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Date From</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  data-testid="filter-date-from"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date To</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  data-testid="filter-date-to"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Supplier</label>
                <Select value={filters.supplier} onValueChange={(value) => setFilters(prev => ({ ...prev, supplier: value }))}>
                  <SelectTrigger data-testid="filter-supplier">
                    <SelectValue placeholder="All suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-suppliers">All suppliers</SelectItem>
                    {suppliers?.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger data-testid="filter-status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-statuses">All statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ dateFrom: "", dateTo: "", supplier: "all-suppliers", status: "all-statuses" })}
                data-testid="button-clear-filters"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto bg-background p-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              {purchasesLoading ? (
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Supplier Name</TableHead>
                        <TableHead>Weight (kg)</TableHead>
                        <TableHead>Price per kg</TableHead>
                        <TableHead>Total Purchase Value</TableHead>
                        <TableHead>Amount Paid</TableHead>
                        <TableHead>Remaining Balance</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Funding Source</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPurchases?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                            No purchases found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPurchases?.map((purchase) => {
                          const status = getPaymentStatus(purchase);
                          return (
                            <TableRow key={purchase.id} data-testid={`purchase-row-${purchase.id}`}>
                              <TableCell>
                                {new Date(purchase.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="link" 
                                  className="p-0 h-auto"
                                  onClick={() => handleViewDetails(purchase)}
                                  data-testid={`supplier-link-${purchase.id}`}
                                >
                                  {getSupplierName(purchase.supplierId)}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {parseFloat(purchase.weight).toLocaleString()} kg
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {kgToCartons(parseFloat(purchase.weight), 'C20').toFixed(1)} C20 = {' '}
                                    {kgToCartons(parseFloat(purchase.weight), 'C8').toFixed(1)} C8
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatCurrency(purchase.pricePerKg, purchase.currency)}
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(purchase.total, purchase.currency)}
                              </TableCell>
                              <TableCell className="text-green-600">
                                {formatCurrency(purchase.amountPaid, purchase.currency)}
                              </TableCell>
                              <TableCell className="text-red-600">
                                {formatCurrency(purchase.remaining, purchase.currency)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {purchase.paymentMethod}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={purchase.fundingSource === 'capital' ? 'default' : 'secondary'}
                                  className="capitalize"
                                >
                                  {purchase.fundingSource}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditPurchase(purchase)}
                                    data-testid={`button-edit-${purchase.id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewDetails(purchase)}
                                    data-testid={`button-view-${purchase.id}`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {parseFloat(purchase.remaining) > 0 && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRecordPayment(purchase)}
                                      data-testid={`button-payment-${purchase.id}`}
                                    >
                                      <DollarSign className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCancelPurchase(purchase)}
                                    data-testid={`button-cancel-${purchase.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* New Purchase Modal */}
      <Dialog open={showNewPurchaseModal} onOpenChange={(open) => {
        setShowNewPurchaseModal(open);
        if (!open) {
          // Reset form and carton helper states on modal close
          purchaseForm.reset();
          setInputMethod('kg');
          setCartonCount('');
          setShowCartonEquivalents(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="new-purchase-modal">
          <DialogHeader>
            <DialogTitle>New Purchase</DialogTitle>
          </DialogHeader>
          <Form {...purchaseForm}>
            <form onSubmit={purchaseForm.handleSubmit(handleNewPurchase)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={purchaseForm.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-supplier">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers?.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={purchaseForm.control}
                  name="orderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-order">
                            <SelectValue placeholder="Select order" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no-order">No order</SelectItem>
                          {orders?.map(order => (
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
              </div>

              {/* Input Method Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant={inputMethod === 'kg' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setInputMethod('kg');
                      setCartonCount('');
                    }}
                    data-testid="button-input-kg"
                  >
                    Input by kg
                  </Button>
                  <Button
                    type="button"
                    variant={inputMethod === 'cartons' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setInputMethod('cartons');
                      purchaseForm.setValue('weight', '');
                    }}
                    data-testid="button-input-cartons"
                  >
                    Input by C20 Cartons
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCartonEquivalents(!showCartonEquivalents)}
                    data-testid="button-toggle-equivalents"
                  >
                    {showCartonEquivalents ? 'Hide' : 'Show'} Conversions
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {inputMethod === 'kg' ? (
                  <FormField
                    control={purchaseForm.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg) *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            step="0.001" 
                            data-testid="input-weight"
                            onChange={(e) => {
                              field.onChange(e);
                              if (e.target.value) {
                                const kg = parseFloat(e.target.value);
                                if (!isNaN(kg)) {
                                  setCartonCount(kgToCartons(kg, 'C20').toFixed(2));
                                }
                              } else {
                                setCartonCount('');
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        {showCartonEquivalents && field.value && (
                          <p className="text-xs text-muted-foreground">
                            = {kgToCartons(parseFloat(field.value), 'C20').toFixed(2)} C20 cartons
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">C20 Cartons *</label>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      value={cartonCount}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCartonCount(value);
                        
                        if (value) {
                          const cartons = parseFloat(value);
                          if (!isNaN(cartons) && validateCartonInput(cartons)) {
                            const kg = cartonsToKg(cartons, 'C20');
                            // Auto-sync to weight field with validation to satisfy form schema
                            purchaseForm.setValue('weight', roundKg(kg).toString(), { shouldValidate: true });
                          } else {
                            purchaseForm.setValue('weight', '', { shouldValidate: true });
                          }
                        } else {
                          purchaseForm.setValue('weight', '', { shouldValidate: true });
                        }
                      }}
                      data-testid="input-carton-count"
                      className={cartonCount && !validateCartonInput(parseFloat(cartonCount)) ? 
                        "border-red-500 focus:border-red-500" : ""}
                    />
                    {cartonCount && !validateCartonInput(parseFloat(cartonCount)) && (
                      <p className="text-xs text-red-600">
                        Please enter a valid positive integer number of cartons
                      </p>
                    )}
                    {showCartonEquivalents && cartonCount && validateCartonInput(parseFloat(cartonCount)) && (
                      <p className="text-xs text-muted-foreground">
                        = {cartonsToKg(parseFloat(cartonCount), 'C20')} kg
                      </p>
                    )}
                  </div>
                )}

                <FormField
                  control={purchaseForm.control}
                  name="pricePerKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per kg *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" data-testid="input-price-per-kg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={purchaseForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-currency">
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

              {exchangeRate && (
                <div className="bg-muted p-3 rounded">
                  <p className="text-sm">
                    <strong>FX Rate:</strong> 1 USD = {exchangeRate.rate} ETB (read-only from central settings)
                  </p>
                  {purchaseForm.watch('currency') === 'ETB' && purchaseForm.watch('weight') && purchaseForm.watch('pricePerKg') && (
                    <p className="text-sm text-blue-600">
                      <strong>USD Equivalent:</strong> {formatCurrency((parseFloat(purchaseForm.watch('weight') || '0') * parseFloat(purchaseForm.watch('pricePerKg') || '0') / exchangeRate.rate).toString(), 'USD')}
                    </p>
                  )}
                  {purchaseForm.watch('currency') === 'USD' && purchaseForm.watch('weight') && purchaseForm.watch('pricePerKg') && (
                    <p className="text-sm text-blue-600">
                      <strong>ETB Equivalent:</strong> {formatCurrency((parseFloat(purchaseForm.watch('weight') || '0') * parseFloat(purchaseForm.watch('pricePerKg') || '0') * exchangeRate.rate).toString(), 'ETB')}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={purchaseForm.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-method">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash (immediate full payment)</SelectItem>
                          <SelectItem value="credit">Credit (0 now, full later)</SelectItem>
                          <SelectItem value="advance">Advance (partial upfront, rest later)</SelectItem>
                          <SelectItem value="other">Other (free text)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={purchaseForm.control}
                  name="fundingSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funding Source *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-funding-source">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="capital">Capital (system balance)</SelectItem>
                          <SelectItem value="external">External (loan/partner funds)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={purchaseForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-country" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={purchaseForm.control}
                  name="quality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quality</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-quality" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={purchaseForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewPurchaseModal(false)}
                  data-testid="button-cancel-purchase"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPurchaseMutation.isPending}
                  data-testid="button-create-purchase"
                >
                  {createPurchaseMutation.isPending ? 'Creating...' : 'Create Purchase'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent data-testid="payment-modal">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          
          {selectedPurchase && (
            <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit((data) => {
                // Validate overpayment
                const amount = parseFloat(data.amount);
                const remaining = parseFloat(selectedPurchase.remaining);
                if (amount > remaining) {
                  paymentForm.setError("amount", {
                    message: `Payment amount cannot exceed remaining balance of ${formatCurrency(selectedPurchase.remaining, selectedPurchase.currency)}`
                  });
                  return;
                }
                recordPaymentMutation.mutate(data);
              })} className="space-y-4">
                <div className="bg-muted p-4 rounded">
                  <h4 className="font-medium mb-2">Purchase Details</h4>
                  <p className="text-sm">Supplier: {getSupplierName(selectedPurchase.supplierId)}</p>
                  <p className="text-sm">Total: {formatCurrency(selectedPurchase.total, selectedPurchase.currency)}</p>
                  <p className="text-sm">Already Paid: {formatCurrency(selectedPurchase.amountPaid, selectedPurchase.currency)}</p>
                  <p className="text-sm font-medium text-red-600">Remaining: {formatCurrency(selectedPurchase.remaining, selectedPurchase.currency)}</p>
                  {!isPaymentValid && watchedAmount && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-600 font-medium">⚠️ Payment amount exceeds remaining balance!</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={paymentForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Amount *</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" data-testid="input-payment-amount" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentForm.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-payment-currency">
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={paymentForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-payment-method-modal">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                            <SelectItem value="advance">Advance</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentForm.control}
                    name="fundingSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Funding Source *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-funding-source-modal">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="capital">Capital</SelectItem>
                            <SelectItem value="external">External</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={paymentForm.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Number</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-payment-reference" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={paymentForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-payment-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPaymentModal(false)}
                    data-testid="button-cancel-payment"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={recordPaymentMutation.isPending || !isPaymentValid}
                    data-testid="button-record-payment"
                  >
                    {recordPaymentMutation.isPending ? 'Recording...' : !isPaymentValid ? 'Invalid Amount' : 'Record Payment'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Purchase Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="details-modal">
          <DialogHeader>
            <DialogTitle>Purchase Details</DialogTitle>
          </DialogHeader>
          
          {selectedPurchase && (
            <div className="space-y-6">
              {/* Purchase Information */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Purchase Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purchase Number:</span>
                      <span className="font-medium">{selectedPurchase.purchaseNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{new Date(selectedPurchase.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Supplier:</span>
                      <span>{getSupplierName(selectedPurchase.supplierId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order:</span>
                      <span>{selectedPurchase.orderId ? getOrderNumber(selectedPurchase.orderId) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Country:</span>
                      <span>{selectedPurchase.country || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quality:</span>
                      <span>{selectedPurchase.quality || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Financial Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weight:</span>
                      <span>{parseFloat(selectedPurchase.weight).toLocaleString()} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price per kg:</span>
                      <span>{formatCurrency(selectedPurchase.pricePerKg, selectedPurchase.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Value:</span>
                      <span className="font-medium">{formatCurrency(selectedPurchase.total, selectedPurchase.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Paid:</span>
                      <span className="text-green-600">{formatCurrency(selectedPurchase.amountPaid, selectedPurchase.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Remaining:</span>
                      <span className="text-red-600">{formatCurrency(selectedPurchase.remaining, selectedPurchase.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exchange Rate:</span>
                      <span>{selectedPurchase.exchangeRate || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  {purchasePayments?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No payments recorded</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Funding</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchasePayments?.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                            <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                            <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                            <TableCell className="capitalize">{payment.fundingSource}</TableCell>
                            <TableCell>{payment.reference || 'N/A'}</TableCell>
                            <TableCell>{payment.description || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Purchase Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="edit-purchase-modal">
          <DialogHeader>
            <DialogTitle>Edit Purchase</DialogTitle>
          </DialogHeader>
          <Form {...purchaseForm}>
            <form onSubmit={purchaseForm.handleSubmit((data) => editPurchaseMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={purchaseForm.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-supplier-edit">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers?.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={purchaseForm.control}
                  name="orderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-order-edit">
                            <SelectValue placeholder="Select order" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no-order">No order</SelectItem>
                          {orders?.map(order => (
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
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={purchaseForm.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg) *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" data-testid="input-weight-edit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={purchaseForm.control}
                  name="pricePerKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per kg *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" data-testid="input-price-per-kg-edit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={purchaseForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-currency-edit">
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

              {exchangeRate && (
                <div className="bg-muted p-3 rounded">
                  <p className="text-sm">
                    <strong>FX Rate:</strong> 1 USD = {exchangeRate.rate} ETB (read-only from central settings)
                  </p>
                  {purchaseForm.watch('currency') === 'ETB' && purchaseForm.watch('weight') && purchaseForm.watch('pricePerKg') && (
                    <p className="text-sm text-blue-600">
                      <strong>USD Equivalent:</strong> {formatCurrency((parseFloat(purchaseForm.watch('weight') || '0') * parseFloat(purchaseForm.watch('pricePerKg') || '0') / exchangeRate.rate).toString(), 'USD')}
                    </p>
                  )}
                  {purchaseForm.watch('currency') === 'USD' && purchaseForm.watch('weight') && purchaseForm.watch('pricePerKg') && (
                    <p className="text-sm text-blue-600">
                      <strong>ETB Equivalent:</strong> {formatCurrency((parseFloat(purchaseForm.watch('weight') || '0') * parseFloat(purchaseForm.watch('pricePerKg') || '0') * exchangeRate.rate).toString(), 'ETB')}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={purchaseForm.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-method-edit">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash (immediate full payment)</SelectItem>
                          <SelectItem value="credit">Credit (0 now, full later)</SelectItem>
                          <SelectItem value="advance">Advance (partial upfront, rest later)</SelectItem>
                          <SelectItem value="other">Other (free text)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={purchaseForm.control}
                  name="fundingSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funding Source *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-funding-source-edit">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="capital">Capital (system balance)</SelectItem>
                          <SelectItem value="external">External (loan/partner funds)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={purchaseForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-country-edit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={purchaseForm.control}
                  name="quality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quality</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-quality-edit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={purchaseForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-notes-edit" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedPurchase(null);
                    purchaseForm.reset();
                  }}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editPurchaseMutation.isPending}
                  data-testid="button-save-edit"
                >
                  {editPurchaseMutation.isPending ? 'Updating...' : 'Update Purchase'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}