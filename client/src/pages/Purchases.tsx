import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { PurchasesResponse, SuppliersResponse } from "@shared/schema";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { NewPurchaseModal } from "@/components/modals/NewPurchaseModal";

export default function Purchases() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

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
            <div>
              <h2 className="text-2xl font-bold text-foreground">Purchases</h2>
              <p className="text-sm text-muted-foreground">Manage your purchase operations and supplier relationships</p>
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {purchases?.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
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
    </div>
  );
}
