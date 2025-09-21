import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import type { PurchasesResponse, SuppliersResponse } from "@shared/schema";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, DollarSign } from "lucide-react";
import { BackButton } from '@/components/ui/back-button';
import { NewPurchaseModal } from "@/components/modals/NewPurchaseModal";

// Settlement form schema with proper validation  
const settlementSchema = z.object({
  amount: z.number()
    .positive("Settlement amount must be greater than 0")
    .refine((val) => val <= 999999999, "Settlement amount is too large"),
  paymentCurrency: z.enum(["USD", "ETB"]),
});

export default function Purchases() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [settlementModal, setSettlementModal] = useState<{open: boolean, purchase: any | null}>({open: false, purchase: null});

  const settlementForm = useForm<z.infer<typeof settlementSchema>>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      amount: 0,
      paymentCurrency: "USD",
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
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: purchases, isLoading: purchasesLoading } = useQuery<PurchasesResponse>({
    queryKey: ['/api/purchases'],
  });

  const { data: suppliers } = useQuery<SuppliersResponse>({
    queryKey: ['/api/suppliers'],
  });

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers?.find((s: any) => s.id === supplierId);
    return supplier?.name || 'Unknown Supplier';
  };

  const settlePurchaseMutation = useMutation({
    mutationFn: async (data: {purchaseId: string, amount: number, currency: string}) => {
      return await apiRequest('POST', `/api/purchases/${data.purchaseId}/settle`, {
        amount: data.amount,
        currency: data.currency,
        settlementNotes: `Settlement payment of ${data.currency} ${data.amount.toFixed(2)}`
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Purchase settlement recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/capital/entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/capital/balance'] });
      setSettlementModal({open: false, purchase: null});
      settlementForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to record settlement",
        variant: "destructive",
      });
    },
  });

  const handleSettlement = (purchase: any) => {
    setSettlementModal({open: true, purchase});
    // Set form defaults based on purchase data
    settlementForm.reset({
      amount: parseFloat(purchase.remaining),
      paymentCurrency: purchase.currency as "USD" | "ETB", // Default to purchase currency
    });
  };

  const submitSettlement = (data: z.infer<typeof settlementSchema>) => {
    if (!settlementModal.purchase) return;
    
    // Validate amount doesn't exceed remaining balance
    const remainingBalance = parseFloat(settlementModal.purchase.remaining);
    if (data.amount > remainingBalance) {
      settlementForm.setError("amount", {
        message: `Settlement amount cannot exceed remaining balance of ${settlementModal.purchase.currency} ${remainingBalance.toFixed(2)}`
      });
      return;
    }
    
    settlePurchaseMutation.mutate({
      purchaseId: settlementModal.purchase.id,
      amount: data.amount,
      currency: data.paymentCurrency
    });
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex" data-testid="purchases">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <BackButton to="/" text="Back to Dashboard" mobileIconOnly={true} />
              <div>
                <h2 className="text-2xl font-bold text-foreground">Purchases</h2>
                <p className="text-sm text-muted-foreground">Manage your purchase operations and supplier relationships</p>
              </div>
            </div>
            <Button onClick={() => setShowPurchaseModal(true)} data-testid="button-new-purchase">
              <Plus className="w-4 h-4 mr-2" />
              New Purchase
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-background p-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Purchase History</h3>
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
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Supplier
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Weight (kg)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Price/kg
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Paid
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Remaining
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Payment
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Funding
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {purchases?.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                            No purchases found
                          </td>
                        </tr>
                      ) : (
                        purchases?.map((purchase: any) => (
                          <tr key={purchase.id} className="hover:bg-muted/50" data-testid={`purchase-${purchase.id}`}>
                            <td className="px-4 py-4 text-sm">
                              {new Date(purchase.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              {getSupplierName(purchase.supplierId)}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              {parseFloat(purchase.weight).toLocaleString()}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              {purchase.currency} {parseFloat(purchase.pricePerKg).toFixed(2)}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium">
                              ${parseFloat(purchase.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-4 text-sm text-green-600">
                              ${parseFloat(purchase.amountPaid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-4 text-sm text-red-600">
                              ${parseFloat(purchase.remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-4">
                              <Badge variant="outline" className="capitalize">
                                {purchase.paymentMethod}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              <Badge 
                                variant={purchase.fundingSource === 'capital' ? 'default' : 'secondary'}
                                className="capitalize"
                              >
                                {purchase.fundingSource}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              {parseFloat(purchase.remaining) > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSettlement(purchase)}
                                  data-testid={`button-settle-${purchase.id}`}
                                >
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  Settle
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {showPurchaseModal && (
        <NewPurchaseModal 
          open={showPurchaseModal} 
          onClose={() => setShowPurchaseModal(false)} 
        />
      )}

      {/* Settlement Modal */}
      <Dialog open={settlementModal.open} onOpenChange={(open) => setSettlementModal({open, purchase: null})}>
        <DialogContent data-testid="settlement-modal">
          <DialogHeader>
            <DialogTitle>Settle Purchase Payment</DialogTitle>
          </DialogHeader>
          
          {settlementModal.purchase && (
            <Form {...settlementForm}>
              <form onSubmit={settlementForm.handleSubmit(submitSettlement)} className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Purchase Details</h4>
                  <p className="text-sm">Supplier: {getSupplierName(settlementModal.purchase.supplierId)}</p>
                  <p className="text-sm">Total: {settlementModal.purchase.currency} {parseFloat(settlementModal.purchase.total).toFixed(2)}</p>
                  <p className="text-sm">Already Paid: {settlementModal.purchase.currency} {parseFloat(settlementModal.purchase.amountPaid).toFixed(2)}</p>
                  <p className="text-sm font-medium text-red-600">Remaining: {settlementModal.purchase.currency} {parseFloat(settlementModal.purchase.remaining).toFixed(2)}</p>
                </div>

                <FormField
                  control={settlementForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Settlement Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                          data-testid="input-settlement-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={settlementForm.control}
                  name="paymentCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Currency</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-payment-currency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="ETB">ETB (Birr)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                      {field.value !== settlementModal.purchase.currency && (
                        <p className="text-xs text-blue-600">
                          💱 Cross-currency settlement: {field.value} payment will be converted to {settlementModal.purchase.currency} using central exchange rate
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <div>
                  <Label>Funding Source</Label>
                  <div className="p-2 bg-muted rounded border">
                    <p className="text-sm font-medium capitalize">
                      {settlementModal.purchase.fundingSource === 'capital' ? 'Working Capital' : 'External Funding'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Settlement will use the same funding source as the original purchase
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setSettlementModal({open: false, purchase: null})}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={settlePurchaseMutation.isPending}
                    data-testid="button-submit-settlement"
                  >
                    {settlePurchaseMutation.isPending ? 'Processing...' : 'Record Settlement'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
