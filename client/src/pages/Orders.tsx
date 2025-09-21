import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OrdersResponse, PurchasesResponse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Package, Eye } from "lucide-react";

export default function Orders() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [status, setStatus] = useState("draft");

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

  const { data: orders, isLoading: ordersLoading } = useQuery<OrdersResponse>({
    queryKey: ['/api/orders'],
  });

  const { data: purchases } = useQuery<PurchasesResponse>({
    queryKey: ['/api/purchases'],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { orderNumber: string; status: string }) => {
      return await apiRequest('POST', '/api/orders', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setShowCreateModal(false);
      setOrderNumber("");
      setStatus("draft");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const handleCreateOrder = () => {
    if (!orderNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter an order number",
        variant: "destructive",
      });
      return;
    }

    createOrderMutation.mutate({ orderNumber: orderNumber.trim(), status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderPurchases = (orderId: string) => {
    return purchases?.filter((purchase: any) => purchase.orderId === orderId) || [];
  };

  const getOrderValue = (orderId: string) => {
    const orderPurchases = getOrderPurchases(orderId);
    return orderPurchases.reduce((sum: number, purchase: any) => sum + parseFloat(purchase.total), 0);
  };

  const getOrderWeight = (orderId: string) => {
    const orderPurchases = getOrderPurchases(orderId);
    return orderPurchases.reduce((sum: number, purchase: any) => sum + parseFloat(purchase.weight), 0);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex" data-testid="orders">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Orders</h2>
              <p className="text-sm text-muted-foreground">Manage your business orders and track progress</p>
            </div>
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-order">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Order
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Order</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="orderNumber">Order Number</Label>
                    <Input
                      id="orderNumber"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="ORD-2024-001"
                      data-testid="input-order-number"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Initial Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateOrder} 
                      disabled={createOrderMutation.isPending}
                      data-testid="button-save-order"
                    >
                      {createOrderMutation.isPending ? "Creating..." : "Create Order"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-background p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="total-orders">
                      {orders?.length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Orders</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="active-orders">
                      {orders?.filter((order: any) => order.status === 'active' || order.status === 'in_progress').length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed Orders</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="completed-orders">
                      {orders?.filter((order: any) => order.status === 'completed').length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-full">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Draft Orders</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="draft-orders">
                      {orders?.filter((order: any) => order.status === 'draft').length || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-500/10 rounded-full">
                    <Package className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Order Management</h3>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
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
                          Order Number
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Created Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Purchases
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Total Weight (kg)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Total Value
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {orders?.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                            No orders found
                          </td>
                        </tr>
                      ) : (
                        orders?.map((order: any) => (
                          <tr key={order.id} className="hover:bg-muted/50" data-testid={`order-${order.id}`}>
                            <td className="px-4 py-4 text-sm font-medium">
                              {order.orderNumber}
                            </td>
                            <td className="px-4 py-4">
                              <Badge className={getStatusColor(order.status)}>
                                {order.status.replace(/_/g, ' ').toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              {getOrderPurchases(order.id).length}
                            </td>
                            <td className="px-4 py-4 text-sm">
                              {getOrderWeight(order.id).toLocaleString()}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium">
                              ${getOrderValue(order.id).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-4">
                              <Button variant="ghost" size="sm" data-testid={`view-order-${order.id}`}>
                                <Eye className="w-4 h-4" />
                              </Button>
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
    </div>
  );
}
