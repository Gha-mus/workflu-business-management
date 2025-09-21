import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Phone,
  Mail,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { BackButton } from '@/components/ui/back-button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Customer as CustomerType, SalesOrder as SalesOrderType, InsertCustomer, InsertSalesOrder } from "@shared/schema";
import { insertCustomerSchema, insertSalesOrderSchema } from "@shared/schema";
import { z } from "zod";

interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
  category: string;
  creditLimit: string;
  paymentTerms: string;
  isActive: boolean;
  totalOrdersCount: number;
  totalRevenueUsd: string;
  averageOrderValueUsd: string;
  address: string;
  website: string;
  notes: string;
  salesRepId: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomerCommunication {
  id: string;
  customerId: string;
  type: string;
  subject: string;
  content: string;
  status: string;
  followUpDate: string;
  completedAt: string;
  createdAt: string;
  userId: string;
}

interface CustomerPerformance {
  customerId: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  lastOrderDate: string;
  paymentHistory: string;
  creditUtilization: number;
}

interface SalesOrder {
  id: string;
  salesOrderNumber: string;
  customerId: string;
  status: string;
  orderDate: string;
  totalAmount: string;
  currency: string;
  priority: string;
  salesRepId: string;
  createdAt: string;
}

interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
  qualityGrade: string;
}

interface RevenueTransaction {
  id: string;
  transactionNumber: string;
  customerId: string;
  salesOrderId: string;
  type: string;
  amount: string;
  currency: string;
  status: string;
  transactionDate: string;
}

export default function Sales() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showCustomerDetailModal, setShowCustomerDetailModal] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

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

  // Data queries
  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ['/api/sales/customers'],
    enabled: !!user,
  });

  const { data: salesOrders, isLoading: ordersLoading } = useQuery<SalesOrder[]>({
    queryKey: ['/api/sales/orders'],
    enabled: !!user,
  });

  const { data: revenueTransactions } = useQuery<RevenueTransaction[]>({
    queryKey: ['/api/revenue/transactions'],
    enabled: !!user,
  });

  const { data: salesAnalytics } = useQuery<{totalRevenueUsd?: number}>({
    queryKey: ['/api/sales/analytics'],
    enabled: !!user,
  });

  // Additional queries for selected customer
  const { data: customerCommunications } = useQuery<CustomerCommunication[]>({
    queryKey: ['/api/sales/customers', selectedCustomer?.id, 'communications'],
    enabled: !!selectedCustomer?.id,
  });

  const { data: customerPerformance } = useQuery<CustomerPerformance>({
    queryKey: ['/api/sales/customers', selectedCustomer?.id, 'performance'],
    enabled: !!selectedCustomer?.id,
  });

  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: InsertCustomer) => {
      return await apiRequest('POST', '/api/sales/customers', customerData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/sales/customers'] });
      setShowNewCustomerModal(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create customer", variant: "destructive" });
    },
  });

  const createSalesOrderMutation = useMutation({
    mutationFn: async (orderData: InsertSalesOrder) => {
      return await apiRequest('POST', '/api/sales/orders', orderData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Sales order created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/sales/orders'] });
      setShowNewOrderModal(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create sales order", variant: "destructive" });
    },
  });

  // Helper functions
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      confirmed: "bg-blue-100 text-blue-800",
      fulfilled: "bg-green-100 text-green-800",
      delivered: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      draft: Clock,
      confirmed: CheckCircle,
      fulfilled: Package,
      delivered: CheckCircle,
      cancelled: XCircle,
    };
    const IconComponent = icons[status] || AlertCircle;
    return <IconComponent className="w-4 h-4" />;
  };

  const filteredCustomers = customers?.filter(customer => {
    const query = customerSearchQuery.toLowerCase();
    return (customer.name || '').toLowerCase().includes(query) ||
           (customer.email || '').toLowerCase().includes(query) ||
           (customer.contactPerson || '').toLowerCase().includes(query);
  }) || [];

  const filteredOrders = salesOrders?.filter(order =>
    orderStatusFilter === "all" || order.status === orderStatusFilter
  ) || [];

  // Calculate dashboard metrics
  const totalCustomers = customers?.length || 0;
  const activeCustomers = customers?.filter(c => c.isActive)?.length || 0;
  const totalOrders = salesOrders?.length || 0;
  // Use USD normalized amounts from server-side analytics instead of summing mixed currencies
  const totalRevenue = salesAnalytics?.totalRevenueUsd || 0;
  const pendingOrders = salesOrders?.filter(o => o.status === 'confirmed')?.length || 0;

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex" data-testid="sales">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4" data-testid="sales-header">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <BackButton to="/" text="Back to Dashboard" mobileIconOnly={true} />
              <div>
                <h2 className="text-2xl font-bold text-foreground">Sales Pipeline</h2>
                <p className="text-sm text-muted-foreground">Manage customers, orders, and revenue performance</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowNewCustomerModal(true)}
                data-testid="button-new-customer"
              >
                <Users className="w-4 h-4 mr-2" />
                New Customer
              </Button>
              <Button 
                onClick={() => setShowNewOrderModal(true)}
                data-testid="button-new-order"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Order
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-background p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full max-w-lg">
              <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="customers" data-testid="tab-customers">Customers</TabsTrigger>
              <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
              <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6 mt-6">
              {/* Sales Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card data-testid="metric-total-customers">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalCustomers}</div>
                    <p className="text-xs text-muted-foreground">
                      {activeCustomers} active
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="metric-total-orders">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalOrders}</div>
                    <p className="text-xs text-muted-foreground">
                      {pendingOrders} pending
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="metric-total-revenue">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      All time
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="metric-avg-order-value">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : '0'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Per order
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="metric-conversion-rate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {totalCustomers > 0 ? ((totalOrders / totalCustomers) * 100).toFixed(1) : '0'}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Orders per customer
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {filteredOrders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{order.salesOrderNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.orderDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${parseFloat(order.totalAmount).toLocaleString()}</p>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {customers?.sort((a, b) => parseFloat(b.totalRevenueUsd || '0') - parseFloat(a.totalRevenueUsd || '0'))
                        .slice(0, 5).map((customer) => (
                        <div key={customer.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {customer.totalOrdersCount} orders
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${parseFloat(customer.totalRevenueUsd || '0').toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Revenue</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="customers" className="space-y-6 mt-6">
              {/* Customer Search and Filters */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <CardTitle>Customer Management</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search customers..."
                          value={customerSearchQuery}
                          onChange={(e) => setCustomerSearchQuery(e.target.value)}
                          className="pl-10 w-64"
                          data-testid="input-customer-search"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {customersLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-muted rounded w-full mb-2" />
                          <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Orders</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCustomers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{customer.name}</p>
                                <p className="text-sm text-muted-foreground">{customer.customerNumber}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center text-sm">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {customer.email}
                                </div>
                                <div className="flex items-center text-sm">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {customer.phone}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{customer.category}</Badge>
                            </TableCell>
                            <TableCell>{customer.totalOrdersCount}</TableCell>
                            <TableCell>${parseFloat(customer.totalRevenueUsd || '0').toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={customer.isActive ? "default" : "secondary"}>
                                {customer.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    setSelectedCustomer(customer);
                                    setShowCustomerDetailModal(true);
                                  }}
                                  data-testid={`button-view-customer-${customer.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    setSelectedCustomer(customer);
                                    setShowCommunicationModal(true);
                                  }}
                                  data-testid={`button-contact-customer-${customer.id}`}
                                >
                                  <Phone className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" data-testid={`button-edit-customer-${customer.id}`}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6 mt-6">
              {/* Orders Management */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <CardTitle>Sales Orders</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                        <SelectTrigger className="w-32" data-testid="select-order-status">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="fulfilled">Fulfilled</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order Number</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => {
                          const customer = customers?.find(c => c.id === order.customerId);
                          return (
                            <TableRow key={order.id}>
                              <TableCell>
                                <p className="font-medium">{order.salesOrderNumber}</p>
                              </TableCell>
                              <TableCell>{customer?.name || 'Unknown'}</TableCell>
                              <TableCell>{format(new Date(order.orderDate), 'MMM dd, yyyy')}</TableCell>
                              <TableCell>${parseFloat(order.totalAmount).toLocaleString()}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(order.status)}
                                  <Badge className={getStatusColor(order.status)}>
                                    {order.status}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={order.priority === 'high' ? 'destructive' : 'outline'}>
                                  {order.priority}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button variant="ghost" size="sm" data-testid={`button-view-order-${order.id}`}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" data-testid={`button-edit-order-${order.id}`}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-6">
              {/* Sales Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Sales performance charts will be displayed here</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Customer Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Customer analytics will be displayed here</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* New Customer Modal */}
      <Dialog open={showNewCustomerModal} onOpenChange={setShowNewCustomerModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer profile for your sales pipeline.
            </DialogDescription>
          </DialogHeader>
          <NewCustomerForm 
            onSubmit={(data) => createCustomerMutation.mutate(data)}
            isLoading={createCustomerMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* New Sales Order Modal */}
      <Dialog open={showNewOrderModal} onOpenChange={setShowNewOrderModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Sales Order</DialogTitle>
            <DialogDescription>
              Create a new sales order for an existing customer.
            </DialogDescription>
          </DialogHeader>
          <NewSalesOrderForm 
            customers={customers || []}
            onSubmit={(data) => createSalesOrderMutation.mutate(data)}
            isLoading={createSalesOrderMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Customer Detail Modal */}
      <Dialog open={showCustomerDetailModal} onOpenChange={setShowCustomerDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              Comprehensive customer information and performance metrics.
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerDetailView 
              customer={selectedCustomer}
              communications={customerCommunications || []}
              performance={customerPerformance}
              onClose={() => setShowCustomerDetailModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Communication Modal */}
      <Dialog open={showCommunicationModal} onOpenChange={setShowCommunicationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Communication</DialogTitle>
            <DialogDescription>
              Record a communication with {selectedCustomer?.name}.
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <CommunicationForm 
              customer={selectedCustomer}
              onSubmit={(data) => {
                // TODO: Add communication mutation
                setShowCommunicationModal(false);
              }}
              isLoading={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// New Customer Form Component
function NewCustomerForm({ onSubmit, isLoading }: { onSubmit: (data: InsertCustomer) => void; isLoading: boolean }) {
  const customerFormSchema = insertCustomerSchema.extend({
    name: z.string().min(1, 'Company name is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().min(1, 'Phone number is required'),
    contactPerson: z.string().min(1, 'Contact person is required'),
  });

  const form = useForm<InsertCustomer>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      contactPerson: '',
      category: 'retail',
      creditLimit: '',
      paymentTerms: 'net_30',
      notes: '',
      salesRepId: '',
      createdBy: '',
    },
  });

  const handleSubmit = (data: InsertCustomer) => {
    // Additional client-side validation
    if (!data.name?.trim()) {
      form.setError('name', { message: 'Company name is required' });
      return;
    }
    if (!data.phone?.trim()) {
      form.setError('phone', { message: 'Phone number is required' });
      return;
    }
    if (!data.contactPerson?.trim()) {
      form.setError('contactPerson', { message: 'Contact person is required' });
      return;
    }
    
    // Convert empty fields to null for database foreign key constraints
    const processedData = {
      ...data,
      creditLimit: data.creditLimit === '' ? null : data.creditLimit,
      salesRepId: data.salesRepId === '' ? null : data.salesRepId,
    };
    
    onSubmit(processedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} data-testid="input-customer-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} data-testid="input-contact-person" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" value={field.value || ''} data-testid="input-customer-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} data-testid="input-customer-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-customer-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="creditLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credit Limit ($)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" value={field.value || ''} data-testid="input-credit-limit" />
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
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ''} data-testid="textarea-customer-notes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isLoading} data-testid="button-submit-customer">
            {isLoading ? 'Creating...' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// New Sales Order Form Component
function NewSalesOrderForm({ 
  customers, 
  onSubmit, 
  isLoading 
}: { 
  customers: Customer[]; 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    customerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    priority: 'medium',
    currency: 'USD',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="customerId">Customer</Label>
        <Select 
          value={formData.customerId} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
        >
          <SelectTrigger data-testid="select-order-customer">
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="orderDate">Order Date</Label>
          <Input
            id="orderDate"
            type="date"
            value={formData.orderDate}
            onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
            required
            data-testid="input-order-date"
          />
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
            <SelectTrigger data-testid="select-order-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          data-testid="textarea-order-notes"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isLoading || !formData.customerId} data-testid="button-submit-order">
          {isLoading ? 'Creating...' : 'Create Order'}
        </Button>
      </div>
    </form>
  );
}

// Customer Detail View Component
function CustomerDetailView({ 
  customer, 
  communications, 
  performance, 
  onClose 
}: { 
  customer: Customer; 
  communications: CustomerCommunication[];
  performance?: CustomerPerformance;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-xl font-bold">
              {customer.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-semibold">{customer.name}</h3>
            <p className="text-sm text-muted-foreground">{customer.customerNumber}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={customer.isActive ? "default" : "secondary"}>
                {customer.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline">{customer.category}</Badge>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">${parseFloat(customer.totalRevenueUsd || '0').toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">{customer.totalOrdersCount} orders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{customer.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{customer.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{customer.contactPerson}</span>
            </div>
            <div className="pt-2">
              <p className="text-sm font-medium">Address</p>
              <p className="text-sm text-muted-foreground">{customer.address || 'Not provided'}</p>
            </div>
            {customer.website && (
              <div className="flex items-center space-x-2">
                <span className="text-sm">🌐</span>
                <a href={customer.website} target="_blank" rel="noopener noreferrer" 
                   className="text-sm text-blue-600 hover:underline">
                  {customer.website}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Business Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Credit Limit</p>
              <p className="text-sm text-muted-foreground">${parseFloat(customer.creditLimit || '0').toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Payment Terms</p>
              <p className="text-sm text-muted-foreground">{customer.paymentTerms} days</p>
            </div>
            <div>
              <p className="text-sm font-medium">Average Order Value</p>
              <p className="text-sm text-muted-foreground">${parseFloat(customer.averageOrderValueUsd || '0').toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Customer Since</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
            {customer.notes && (
              <div>
                <p className="text-sm font-medium">Notes</p>
                <p className="text-sm text-muted-foreground">{customer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Total Orders</p>
              <p className="text-sm text-muted-foreground">{customer.totalOrdersCount}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Revenue</p>
              <p className="text-sm text-muted-foreground">${parseFloat(customer.totalRevenueUsd || '0').toLocaleString()}</p>
            </div>
            {performance && (
              <>
                <div>
                  <p className="text-sm font-medium">Last Order</p>
                  <p className="text-sm text-muted-foreground">
                    {performance.lastOrderDate ? format(new Date(performance.lastOrderDate), 'MMM dd, yyyy') : 'No orders'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Credit Utilization</p>
                  <p className="text-sm text-muted-foreground">{performance.creditUtilization}%</p>
                </div>
              </>
            )}
            <div>
              <p className="text-sm font-medium">Status</p>
              <Badge variant={customer.isActive ? "default" : "secondary"} className="text-xs">
                {customer.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Communications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Communications</CardTitle>
        </CardHeader>
        <CardContent>
          {communications.length > 0 ? (
            <div className="space-y-3">
              {communications.slice(0, 5).map((comm) => (
                <div key={comm.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {comm.type === 'email' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{comm.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(comm.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{comm.content}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className="text-xs">{comm.type}</Badge>
                      <Badge variant="outline" className="text-xs">{comm.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Phone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No communications recorded yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button>Edit Customer</Button>
      </div>
    </div>
  );
}

// Communication Form Component
function CommunicationForm({ 
  customer, 
  onSubmit, 
  isLoading 
}: { 
  customer: Customer; 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    type: 'call',
    subject: '',
    content: '',
    followUpDate: '',
    status: 'completed',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      customerId: customer.id,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Communication Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger data-testid="select-communication-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Phone Call</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="note">Note</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger data-testid="select-communication-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
          placeholder="e.g., Follow-up on order inquiry"
          required
          data-testid="input-communication-subject"
        />
      </div>

      <div>
        <Label htmlFor="content">Details</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Describe the communication details..."
          rows={4}
          required
          data-testid="textarea-communication-content"
        />
      </div>

      {formData.status === 'scheduled' && (
        <div>
          <Label htmlFor="followUpDate">Follow-up Date</Label>
          <Input
            id="followUpDate"
            type="datetime-local"
            value={formData.followUpDate}
            onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
            data-testid="input-follow-up-date"
          />
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isLoading} data-testid="button-submit-communication">
          {isLoading ? 'Saving...' : 'Save Communication'}
        </Button>
      </div>
    </form>
  );
}