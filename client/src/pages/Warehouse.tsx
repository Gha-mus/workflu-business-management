import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { WarehouseStockResponse, SuppliersResponse } from "@shared/schema";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Warehouse() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: warehouseStock, isLoading: stockLoading } = useQuery<WarehouseStockResponse>({
    queryKey: ['/api/warehouse/stock'],
  });

  const { data: suppliers } = useQuery<SuppliersResponse>({
    queryKey: ['/api/suppliers'],
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

  const getTotalWeight = (stocks: any[]) => {
    return stocks.reduce((sum, stock) => sum + parseFloat(stock.qtyKgClean), 0);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="first-warehouse">First Warehouse</TabsTrigger>
              <TabsTrigger value="final-warehouse">Final Warehouse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="first-warehouse" className="space-y-6">
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
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {warehouseStock?.filter((stock: any) => stock.warehouse === 'FIRST')?.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                No inventory found in first warehouse
                              </td>
                            </tr>
                          ) : (
                            warehouseStock?.filter((stock: any) => stock.warehouse === 'FIRST')?.map((stock: any) => (
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
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
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
        </div>
      </main>
    </div>
  );
}
