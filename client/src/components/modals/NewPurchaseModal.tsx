import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Decimal from "decimal.js";
import type { SuppliersResponse, OrdersResponse, SettingsResponse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Please select a supplier"),
  orderId: z.string().min(1, "Please select an order"),
  weight: z.string().min(1, "Weight is required"),
  pricePerKg: z.string().min(1, "Price per kg is required"),
  currency: z.enum(["USD", "ETB"]),
  paymentMethod: z.enum(["cash", "advance", "credit"]),
  fundingSource: z.enum(["capital", "external"]),
  amountPaid: z.string().min(1, "Amount paid is required"),
  quality: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // Client-side validation will be supplemented by backend exchange rate validation
  return true;
}, {
  message: "All fields are required",
});

type PurchaseForm = z.infer<typeof purchaseSchema>;

interface NewPurchaseModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewPurchaseModal({ open, onClose }: NewPurchaseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [total, setTotal] = useState(0);

  const { data: suppliers } = useQuery<SuppliersResponse>({
    queryKey: ['/api/suppliers'],
  });

  const { data: orders } = useQuery<OrdersResponse>({
    queryKey: ['/api/orders'],
  });

  const { data: settings } = useQuery<SettingsResponse>({
    queryKey: ['/api/settings'],
  });

  const form = useForm<PurchaseForm>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      currency: "USD",
      paymentMethod: "cash",
      fundingSource: "capital",
      weight: "",
      pricePerKg: "",
      amountPaid: "",
    },
  });

  const weight = form.watch("weight");
  const pricePerKg = form.watch("pricePerKg");
  const currency = form.watch("currency");

  useEffect(() => {
    try {
      if (!weight || !pricePerKg) {
        setTotal(0);
        return;
      }

      const weightDecimal = new Decimal(weight);
      const priceDecimal = new Decimal(pricePerKg);
      let calculatedTotal = weightDecimal.mul(priceDecimal);
      
      // Convert to USD if currency is ETB
      if (currency === "ETB" && settings?.exchangeRate) {
        const exchangeRate = new Decimal(settings.exchangeRate);
        calculatedTotal = calculatedTotal.div(exchangeRate);
      }
      
      setTotal(calculatedTotal.toNumber());
    } catch (error) {
      // Handle invalid number inputs gracefully
      setTotal(0);
    }
  }, [weight, pricePerKg, currency, settings?.exchangeRate]);

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: PurchaseForm) => {
      const exchangeRate = currency === "ETB" ? settings?.exchangeRate : undefined;
      
      // Client-side validation for ETB purchases
      if (data.currency === "ETB" && (!settings?.exchangeRate || settings.exchangeRate === 0)) {
        throw new Error("Exchange rate not available for ETB purchases. Please contact admin.");
      }
      
      return await apiRequest('POST', '/api/purchases', {
        ...data,
        exchangeRate: exchangeRate ? String(exchangeRate) : undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Purchase created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/capital/entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/capital/balance'] });
      form.reset();
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create purchase",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PurchaseForm) => {
    createPurchaseMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="new-purchase-modal">
        <DialogHeader>
          <DialogTitle>New Purchase</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-supplier">
                          <SelectValue placeholder="Select supplier..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers?.map((supplier: any) => (
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
                control={form.control}
                name="orderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order ID</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-order">
                          <SelectValue placeholder="Link to order..." />
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                        data-testid="input-weight"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricePerKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per kg</FormLabel>
                    <div className="flex">
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field: currencyField }) => (
                          <Select onValueChange={currencyField.onChange} defaultValue={currencyField.value}>
                            <SelectTrigger className="w-20 rounded-r-none border-r-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="ETB">ETB</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          className="rounded-l-none" 
                          {...field} 
                          data-testid="input-price"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Total Amount {currency === "ETB" ? "(converted to USD for comparison)" : ""}
                </label>
                <Input 
                  type="text" 
                  value={total > 0 ? `$${total.toFixed(2)} USD` : ""} 
                  placeholder="Calculated automatically" 
                  readOnly 
                  className="bg-muted text-muted-foreground"
                  data-testid="input-total"
                />
                {currency === "ETB" && total > 0 && settings?.exchangeRate && (
                  <p className="text-xs text-muted-foreground">
                    Original: {(total * settings.exchangeRate).toFixed(2)} ETB (@ {settings.exchangeRate} ETB/USD)
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="advance">Advance</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fundingSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Source</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-funding-source">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="capital">From Capital</SelectItem>
                        <SelectItem value="external">External Funding</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="amountPaid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Paid ({currency})</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...field} 
                      data-testid="input-amount-paid"
                    />
                  </FormControl>
                  {currency === "ETB" && field.value && settings?.exchangeRate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ≈ ${(parseFloat(field.value) / settings.exchangeRate).toFixed(2)} USD
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="quality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quality/Classification</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-quality">
                          <SelectValue placeholder="Select quality..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="economic">Economic</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Country of purchase" {...field} data-testid="input-country" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3} 
                      placeholder="Additional notes about this purchase..." 
                      {...field} 
                      data-testid="textarea-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createPurchaseMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPurchaseMutation.isPending}
                data-testid="button-submit"
              >
                {createPurchaseMutation.isPending ? "Creating..." : "Create Purchase"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
