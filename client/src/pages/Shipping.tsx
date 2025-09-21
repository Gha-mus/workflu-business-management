import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { 
  Carrier, 
  Shipment, 
  ShipmentWithDetailsResponse,
  WarehouseStock,
  ShippingAnalyticsResponse 
} from "@shared/schema";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Truck, 
  Ship, 
  Plane, 
  Package2, 
  Plus, 
  Eye, 
  Edit, 
  Star,
  MapPin,
  Calendar,
  DollarSign,
  BarChart3,
  Users,
  AlertCircle
} from "lucide-react";

export default function Shipping() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [createCarrierOpen, setCreateCarrierOpen] = useState(false);
  const [createShipmentOpen, setCreateShipmentOpen] = useState(false);
  const [addCostOpen, setAddCostOpen] = useState(false);
  const [addTrackingOpen, setAddTrackingOpen] = useState(false);
  const [addLegOpen, setAddLegOpen] = useState(false);
  const [addArrivalCostOpen, setAddArrivalCostOpen] = useState(false);
  const [startInspectionOpen, setStartInspectionOpen] = useState(false);
  const [viewCommissionsOpen, setViewCommissionsOpen] = useState(false);

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

  // Queries
  const { data: carriers, isLoading: carriersLoading } = useQuery<Carrier[]>({
    queryKey: ['/api/carriers'],
  });

  const { data: shipments, isLoading: shipmentsLoading } = useQuery<Shipment[]>({
    queryKey: ['/api/shipments'],
  });

  const { data: availableStock } = useQuery<WarehouseStock[]>({
    queryKey: ['/api/warehouse/stock/available-for-shipping'],
  });

  const { data: analytics } = useQuery<ShippingAnalyticsResponse>({
    queryKey: ['/api/shipping/analytics'],
  });

  const { data: shipmentLegs } = useQuery({
    queryKey: ['/api/shipping/legs', selectedShipment],
    enabled: !!selectedShipment,
  });

  const { data: arrivalCosts } = useQuery({
    queryKey: ['/api/shipping/arrival-costs', selectedShipment],
    enabled: !!selectedShipment,
  });

  const { data: inspections } = useQuery({
    queryKey: ['/api/shipping/inspections'],
  });

  const { data: shipmentDetails } = useQuery<ShipmentWithDetailsResponse>({
    queryKey: ['/api/shipments', selectedShipment],
    enabled: !!selectedShipment,
  });

  // Helper functions
  const getShipmentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'delayed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'sea_freight':
        return <Ship className="h-4 w-4" />;
      case 'air_freight':
        return <Plane className="h-4 w-4" />;
      case 'land_transport':
        return <Truck className="h-4 w-4" />;
      case 'courier':
        return <Package2 className="h-4 w-4" />;
      default:
        return <Package2 className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: string, currency: string = 'USD') => {
    return `${parseFloat(amount).toFixed(2)} ${currency}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shipping & Logistics</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage shipments, carriers, and delivery tracking</p>
          </div>

          <Tabs defaultValue="shipments" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="shipments" data-testid="tab-shipments">Shipments</TabsTrigger>
              <TabsTrigger value="carriers" data-testid="tab-carriers">Carriers</TabsTrigger>
              <TabsTrigger value="legs" data-testid="tab-legs">Multi-Leg</TabsTrigger>
              <TabsTrigger value="costs" data-testid="tab-costs">Costs</TabsTrigger>
              <TabsTrigger value="inspections" data-testid="tab-inspections">Inspections</TabsTrigger>
              <TabsTrigger value="tracking" data-testid="tab-tracking">Tracking</TabsTrigger>
              <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Shipments Tab */}
            <TabsContent value="shipments" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Shipments Overview</h2>
                <Dialog open={createShipmentOpen} onOpenChange={setCreateShipmentOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-shipment">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Shipment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Shipment</DialogTitle>
                    </DialogHeader>
                    <CreateShipmentForm 
                      carriers={carriers || []}
                      availableStock={availableStock || []}
                      carriersLoading={carriersLoading}
                      onClose={() => setCreateShipmentOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Shipments</p>
                        <p className="text-2xl font-bold" data-testid="text-total-shipments">
                          {analytics?.summary.totalShipments || 0}
                        </p>
                      </div>
                      <Package2 className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">In Transit</p>
                        <p className="text-2xl font-bold" data-testid="text-in-transit">
                          {analytics?.summary.inTransit || 0}
                        </p>
                      </div>
                      <Truck className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Delivered</p>
                        <p className="text-2xl font-bold" data-testid="text-delivered">
                          {analytics?.summary.delivered || 0}
                        </p>
                      </div>
                      <MapPin className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost (USD)</p>
                        <p className="text-2xl font-bold" data-testid="text-total-cost">
                          ${analytics?.summary.totalCostUsd?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {shipmentsLoading ? (
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">Loading shipments...</div>
                    </CardContent>
                  </Card>
                ) : shipments?.length === 0 ? (
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center text-gray-500">
                        No shipments found. Create your first shipment to get started.
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  shipments?.map((shipment) => (
                    <Card key={shipment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {getMethodIcon(shipment.method)}
                            <div>
                              <h3 className="font-semibold" data-testid={`text-shipment-number-${shipment.id}`}>
                                {shipment.shipmentNumber}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {shipment.originAddress} → {shipment.destinationAddress}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge className={getShipmentStatusColor(shipment.status)} data-testid={`badge-status-${shipment.id}`}>
                              {shipment.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <div className="text-right">
                              <p className="text-sm font-medium">{shipment.totalWeight} kg</p>
                              <p className="text-xs text-gray-500">
                                Est. Departure: {formatDate(shipment.estimatedDepartureDate)}
                              </p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedShipment(shipment.id)}
                              data-testid={`button-view-shipment-${shipment.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Multi-Leg Shipping Tab */}
            <TabsContent value="legs" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Multi-Leg Shipping</h2>
                <div className="flex space-x-2">
                  <Dialog open={addLegOpen} onOpenChange={setAddLegOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-leg">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Shipping Leg
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Shipping Leg</DialogTitle>
                      </DialogHeader>
                      <AddShippingLegForm 
                        shipments={shipments || []}
                        onClose={() => setAddLegOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                  <Dialog open={viewCommissionsOpen} onOpenChange={setViewCommissionsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" data-testid="button-view-commissions">
                        <DollarSign className="h-4 w-4 mr-2" />
                        View Commissions
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Commission Summary</DialogTitle>
                      </DialogHeader>
                      <CommissionSummaryView 
                        shipments={shipments || []}
                        onClose={() => setViewCommissionsOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {selectedShipment && shipmentLegs && (
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Legs for {shipments?.find(s => s.id === selectedShipment)?.shipmentNumber}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {shipmentLegs.length === 0 ? (
                        <div className="text-center text-gray-500">No shipping legs found. Add the first leg to get started.</div>
                      ) : (
                        shipmentLegs.map((leg: any) => (
                          <div key={leg.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg" data-testid={`leg-item-${leg.id}`}>
                            <div>
                              <h4 className="font-medium">Leg {leg.legNumber}: {leg.originPort} → {leg.destinationPort}</h4>
                              <p className="text-sm text-gray-600">Carrier: {leg.carrierName} | Weight: {leg.chargeableWeightKg}kg</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${leg.ratePerKg}/kg</p>
                              <p className="text-sm text-gray-600">Commission: {leg.transferCommissionPercent}%</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {!selectedShipment && (
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center text-gray-500">
                      Select a shipment from the Shipments tab to view and manage its shipping legs.
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Carriers Tab */}
            <TabsContent value="carriers" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Carrier Management</h2>
                <Dialog open={createCarrierOpen} onOpenChange={setCreateCarrierOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-carrier">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Carrier
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Carrier</DialogTitle>
                    </DialogHeader>
                    <CreateCarrierForm onClose={() => setCreateCarrierOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {carriersLoading ? (
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center">Loading carriers...</div>
                    </CardContent>
                  </Card>
                ) : carriers?.length === 0 ? (
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center text-gray-500">
                        No carriers found. Add your first carrier to get started.
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  carriers?.map((carrier) => (
                    <Card key={carrier.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg" data-testid={`text-carrier-name-${carrier.id}`}>
                            {carrier.name}
                          </CardTitle>
                          {carrier.isPreferred && (
                            <Badge variant="secondary" data-testid={`badge-preferred-${carrier.id}`}>
                              <Star className="h-3 w-3 mr-1" />
                              Preferred
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{carrier.contactPerson}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{carrier.address}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < parseFloat(carrier.rating || '0')
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-gray-500 ml-1">
                                ({carrier.rating || '0'})
                              </span>
                            </div>
                            <Badge variant={carrier.isActive ? "default" : "secondary"}>
                              {carrier.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Inspections Tab */}
            <TabsContent value="inspections" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Shipment Inspections</h2>
                <div className="flex space-x-2">
                  <Dialog open={startInspectionOpen} onOpenChange={setStartInspectionOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-start-inspection">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Start Inspection
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Start Shipment Inspection</DialogTitle>
                      </DialogHeader>
                      <StartInspectionForm 
                        shipments={shipments || []}
                        onClose={() => setStartInspectionOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                  <Dialog open={addArrivalCostOpen} onOpenChange={setAddArrivalCostOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" data-testid="button-add-arrival-cost">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Add Arrival Cost
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Arrival Cost</DialogTitle>
                      </DialogHeader>
                      <AddArrivalCostForm 
                        shipments={shipments || []}
                        onClose={() => setAddArrivalCostOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {inspections && inspections.length > 0 ? (
                  inspections.map((inspection: any) => (
                    <Card key={inspection.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold" data-testid={`inspection-number-${inspection.id}`}>
                              {inspection.inspectionNumber}
                            </h3>
                            <p className="text-sm text-gray-600">Location: {inspection.inspectionLocation}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge 
                              className={`${
                                inspection.status === 'completed' ? 'bg-green-100 text-green-800' :
                                inspection.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                              data-testid={`inspection-status-${inspection.id}`}
                            >
                              {inspection.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-center text-gray-500">
                        No inspections found. Start your first inspection to get started.
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Costs Tab */}
            <TabsContent value="costs" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Shipping Costs</h2>
                <Dialog open={addCostOpen} onOpenChange={setAddCostOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-cost">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Cost
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Shipping Cost</DialogTitle>
                    </DialogHeader>
                    <AddShippingCostForm 
                      shipments={shipments || []}
                      onClose={() => setAddCostOpen(false)} 
                    />
                  </DialogContent>
                </Dialog>
              </div>

                      <div className="grid grid-cols-1 gap-6">
                {analytics?.costBreakdown && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Cost Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {analytics.costBreakdown.map((cost) => (
                          <div key={cost.costType} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                              {cost.costType.replace('_', ' ')}
                            </p>
                            <p className="text-xl font-bold" data-testid={`text-cost-${cost.costType}`}>
                              ${cost.totalUsd.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {cost.percentage.toFixed(1)}% of total
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedShipment && arrivalCosts && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Arrival Costs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {arrivalCosts.length === 0 ? (
                          <div className="text-center text-gray-500">No arrival costs recorded for this shipment.</div>
                        ) : (
                          arrivalCosts.map((cost: any) => (
                            <div key={cost.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg" data-testid={`arrival-cost-${cost.id}`}>
                              <div>
                                <h4 className="font-medium capitalize">{cost.costType.replace('_', ' ')}</h4>
                                <p className="text-sm text-gray-600">{cost.vendorName} | {cost.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">${cost.amount} {cost.currency}</p>
                                <p className="text-sm text-gray-600">{cost.documentReference}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Tracking Tab */}
            <TabsContent value="tracking" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Delivery Tracking</h2>
                <Dialog open={addTrackingOpen} onOpenChange={setAddTrackingOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-tracking">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tracking Update
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Tracking Update</DialogTitle>
                    </DialogHeader>
                    <AddTrackingForm 
                      shipments={shipments || []}
                      onClose={() => setAddTrackingOpen(false)} 
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {shipmentDetails && (
                <ShipmentDetailsView 
                  shipment={shipmentDetails}
                  onClose={() => setSelectedShipment(null)}
                />
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <h2 className="text-2xl font-semibold">Shipping Analytics</h2>
              
              {analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Carrier Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.carrierPerformance?.map((carrier, index) => (
                          <div key={carrier.carrierId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <p className="font-medium">{carrier.carrierName}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {carrier.totalShipments} shipments
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{carrier.onTimeDeliveryRate.toFixed(1)}%</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">On-time rate</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Delivery Time Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {analytics.deliveryTimeAnalysis?.averageDeliveryDays?.toFixed(1) || 0} days
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Average delivery time</p>
                        </div>
                        
                        {analytics.deliveryTimeAnalysis?.byMethod?.map((method) => (
                          <div key={method.method} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-2">
                              {getMethodIcon(method.method)}
                              <span className="capitalize">{method.method.replace('_', ' ')}</span>
                            </div>
                            <span className="font-medium">{method.averageDays.toFixed(1)} days</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

// Component for creating new carriers
function CreateCarrierForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    serviceTypes: [] as string[],
    isPreferred: false,
    isActive: true,
    rating: '0',
  });

  const createCarrierMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/carriers', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/carriers'] });
      toast({ title: "Carrier created successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to create carrier", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCarrierMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Carrier Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            data-testid="input-carrier-name"
          />
        </div>
        <div>
          <Label htmlFor="contactPerson">Contact Person</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            required
            data-testid="input-contact-person"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            data-testid="input-email"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            data-testid="input-phone"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          data-testid="input-address"
        />
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.isPreferred}
            onChange={(e) => setFormData({ ...formData, isPreferred: e.target.checked })}
            data-testid="checkbox-preferred"
          />
          <span>Preferred Carrier</span>
        </label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createCarrierMutation.isPending}
          data-testid="button-submit-carrier"
        >
          {createCarrierMutation.isPending ? 'Creating...' : 'Create Carrier'}
        </Button>
      </div>
    </form>
  );
}

// Component for creating new shipments
function CreateShipmentForm({ 
  carriers, 
  availableStock, 
  carriersLoading,
  onClose 
}: { 
  carriers: Carrier[];
  availableStock: WarehouseStock[];
  carriersLoading: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    orderId: '',
    carrierId: '',
    method: '' as 'sea_freight' | 'air_freight' | 'land_transport' | 'courier',
    originAddress: '',
    destinationAddress: '',
    estimatedDepartureDate: '',
    estimatedArrivalDate: '',
    notes: '',
    warehouseStockItems: [] as { warehouseStockId: string; quantity: string; packingDetails?: string }[],
    totalWeight: '',
    cartonsCount: '',
    trackingNumber: '',
    totalVolume: '',
  });

  const createShipmentMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/shipments/from-stock', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/warehouse/stock/available-for-shipping'] });
      toast({ title: "Shipment created successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to create shipment", variant: "destructive" });
    },
  });

  const addStockItem = () => {
    setFormData({
      ...formData,
      warehouseStockItems: [...formData.warehouseStockItems, { warehouseStockId: '', quantity: '' }],
    });
  };

  const removeStockItem = (index: number) => {
    setFormData({
      ...formData,
      warehouseStockItems: formData.warehouseStockItems.filter((_, i) => i !== index),
    });
  };

  const updateStockItem = (index: number, field: string, value: string) => {
    const updated = [...formData.warehouseStockItems];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, warehouseStockItems: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.warehouseStockItems.length === 0) {
      toast({ title: "Please add at least one warehouse stock item", variant: "destructive" });
      return;
    }
    if (!formData.totalWeight) {
      toast({ title: "Please enter total weight", variant: "destructive" });
      return;
    }
    
    // Prepare data for submission
    const submitData = {
      ...formData,
      totalWeight: parseFloat(formData.totalWeight),
      cartonsCount: formData.cartonsCount ? parseInt(formData.cartonsCount) : 0,
      totalVolume: formData.totalVolume ? parseFloat(formData.totalVolume) : undefined,
    };
    
    createShipmentMutation.mutate(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="orderId">Order ID</Label>
          <Input
            id="orderId"
            value={formData.orderId}
            onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
            required
            data-testid="input-order-id"
          />
        </div>
        <div>
          <Label htmlFor="carrier">Carrier</Label>
          <Select 
            value={formData.carrierId} 
            onValueChange={(value) => setFormData({ ...formData, carrierId: value })}
            required
            disabled={carriersLoading || !carriers?.length}
          >
            <SelectTrigger data-testid="select-carrier">
              <SelectValue placeholder={
                carriersLoading 
                  ? "Loading carriers..." 
                  : !carriers?.length 
                    ? "No carriers available" 
                    : "Select carrier"
              } />
            </SelectTrigger>
            <SelectContent>
              {carriers?.map((carrier) => (
                <SelectItem key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </SelectItem>
              )) || []}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="totalWeight">Total Weight (kg)</Label>
          <Input
            id="totalWeight"
            type="number"
            step="0.01"
            value={formData.totalWeight}
            onChange={(e) => setFormData({ ...formData, totalWeight: e.target.value })}
            required
            data-testid="input-total-weight"
          />
        </div>
        <div>
          <Label htmlFor="cartonsCount">Cartons Count</Label>
          <Input
            id="cartonsCount"
            type="number"
            value={formData.cartonsCount}
            onChange={(e) => setFormData({ ...formData, cartonsCount: e.target.value })}
            required
            data-testid="input-cartons-count"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="trackingNumber">Tracking Number (Optional)</Label>
          <Input
            id="trackingNumber"
            value={formData.trackingNumber || ''}
            onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
            data-testid="input-tracking-number"
          />
        </div>
        <div>
          <Label htmlFor="totalVolume">Total Volume (m³)</Label>
          <Input
            id="totalVolume"
            type="number"
            step="0.01"
            value={formData.totalVolume || ''}
            onChange={(e) => setFormData({ ...formData, totalVolume: e.target.value })}
            data-testid="input-total-volume"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="method">Shipping Method</Label>
          <Select 
            value={formData.method} 
            onValueChange={(value: any) => setFormData({ ...formData, method: value })}
            required
          >
            <SelectTrigger data-testid="select-method">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sea_freight">Sea Freight</SelectItem>
              <SelectItem value="air_freight">Air Freight</SelectItem>
              <SelectItem value="land_transport">Land Transport</SelectItem>
              <SelectItem value="courier">Courier</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="originAddress">Origin Address</Label>
          <Textarea
            id="originAddress"
            value={formData.originAddress}
            onChange={(e) => setFormData({ ...formData, originAddress: e.target.value })}
            required
            data-testid="input-origin"
          />
        </div>
        <div>
          <Label htmlFor="destinationAddress">Destination Address</Label>
          <Textarea
            id="destinationAddress"
            value={formData.destinationAddress}
            onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
            required
            data-testid="input-destination"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="estimatedDeparture">Estimated Departure Date</Label>
          <Input
            id="estimatedDeparture"
            type="date"
            value={formData.estimatedDepartureDate}
            onChange={(e) => setFormData({ ...formData, estimatedDepartureDate: e.target.value })}
            data-testid="input-departure-date"
          />
        </div>
        <div>
          <Label htmlFor="estimatedArrival">Estimated Arrival Date</Label>
          <Input
            id="estimatedArrival"
            type="date"
            value={formData.estimatedArrivalDate}
            onChange={(e) => setFormData({ ...formData, estimatedArrivalDate: e.target.value })}
            data-testid="input-arrival-date"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Warehouse Stock Items</Label>
          <Button type="button" onClick={addStockItem} size="sm" data-testid="button-add-stock-item">
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
        
        {formData.warehouseStockItems.length === 0 && (
          <div className="text-center p-4 border-2 border-dashed rounded-lg text-gray-500">
            No stock items added. Click "Add Item" to include warehouse stock in this shipment.
          </div>
        )}

        {formData.warehouseStockItems.map((item, index) => (
          <div key={index} className="grid grid-cols-3 gap-2 items-end">
            <div>
              <Label>Stock Item</Label>
              <Select 
                value={item.warehouseStockId} 
                onValueChange={(value) => updateStockItem(index, 'warehouseStockId', value)}
              >
                <SelectTrigger data-testid={`select-stock-${index}`}>
                  <SelectValue placeholder="Select stock" />
                </SelectTrigger>
                <SelectContent>
                  {availableStock.map((stock) => (
                    <SelectItem key={stock.id} value={stock.id}>
                      {stock.orderId} - {stock.qtyKgClean}kg available
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity (kg)</Label>
              <Input
                type="number"
                step="0.01"
                value={item.quantity}
                onChange={(e) => updateStockItem(index, 'quantity', e.target.value)}
                required
                data-testid={`input-quantity-${index}`}
              />
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => removeStockItem(index)}
              size="sm"
              data-testid={`button-remove-stock-${index}`}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          data-testid="input-notes"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createShipmentMutation.isPending}
          data-testid="button-submit-shipment"
        >
          {createShipmentMutation.isPending ? 'Creating...' : 'Create Shipment'}
        </Button>
      </div>
    </form>
  );
}

// Component for adding shipping costs
function AddShippingCostForm({ 
  shipments, 
  onClose 
}: { 
  shipments: Shipment[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    shipmentId: '',
    costType: '' as 'freight' | 'insurance' | 'customs' | 'handling' | 'other',
    amount: '',
    currency: 'USD' as 'USD' | 'ETB',
    exchangeRate: '',
    description: '',
    paymentMethod: 'cash' as 'cash' | 'advance' | 'credit',
    amountPaid: '',
    fundingSource: 'capital' as 'capital' | 'external',
  });

  const addCostMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/shipping-costs', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipping/analytics'] });
      toast({ title: "Shipping cost added successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to add shipping cost", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCostMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="shipment">Shipment</Label>
        <Select 
          value={formData.shipmentId} 
          onValueChange={(value) => setFormData({ ...formData, shipmentId: value })}
          required
        >
          <SelectTrigger data-testid="select-cost-shipment">
            <SelectValue placeholder="Select shipment" />
          </SelectTrigger>
          <SelectContent>
            {shipments.map((shipment) => (
              <SelectItem key={shipment.id} value={shipment.id}>
                {shipment.shipmentNumber} - {shipment.originAddress} → {shipment.destinationAddress}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="costType">Cost Type</Label>
          <Select 
            value={formData.costType} 
            onValueChange={(value: any) => setFormData({ ...formData, costType: value })}
            required
          >
            <SelectTrigger data-testid="select-cost-type">
              <SelectValue placeholder="Select cost type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="freight">Freight</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="customs">Customs</SelectItem>
              <SelectItem value="handling">Handling</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="fundingSource">Funding Source</Label>
          <Select 
            value={formData.fundingSource} 
            onValueChange={(value: any) => setFormData({ ...formData, fundingSource: value })}
            required
          >
            <SelectTrigger data-testid="select-funding-source">
              <SelectValue placeholder="Select funding source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="capital">Working Capital</SelectItem>
              <SelectItem value="external">External Funding</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
            data-testid="input-cost-amount"
          />
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select 
            value={formData.currency} 
            onValueChange={(value: any) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger data-testid="select-currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="ETB">ETB</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.currency === 'ETB' && (
          <div>
            <Label htmlFor="exchangeRate">Exchange Rate</Label>
            <Input
              id="exchangeRate"
              type="number"
              step="0.01"
              value={formData.exchangeRate}
              onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
              required
              data-testid="input-exchange-rate"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select 
            value={formData.paymentMethod} 
            onValueChange={(value: any) => setFormData({ ...formData, paymentMethod: value })}
          >
            <SelectTrigger data-testid="select-payment-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="advance">Advance Payment</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="amountPaid">Amount Paid</Label>
          <Input
            id="amountPaid"
            type="number"
            step="0.01"
            value={formData.amountPaid}
            onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
            data-testid="input-amount-paid"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          data-testid="input-description"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={addCostMutation.isPending}
          data-testid="button-submit-cost"
        >
          {addCostMutation.isPending ? 'Adding...' : 'Add Cost'}
        </Button>
      </div>
    </form>
  );
}

// Component for adding tracking updates
function AddTrackingForm({ 
  shipments, 
  onClose 
}: { 
  shipments: Shipment[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    shipmentId: '',
    status: '',
    location: '',
    description: '',
    isCustomerNotified: false,
    proofOfDelivery: '',
    exceptionDetails: '',
  });

  const addTrackingMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/delivery-tracking', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
      toast({ title: "Tracking update added successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to add tracking update", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTrackingMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="shipment">Shipment</Label>
        <Select 
          value={formData.shipmentId} 
          onValueChange={(value) => setFormData({ ...formData, shipmentId: value })}
          required
        >
          <SelectTrigger data-testid="select-tracking-shipment">
            <SelectValue placeholder="Select shipment" />
          </SelectTrigger>
          <SelectContent>
            {shipments.map((shipment) => (
              <SelectItem key={shipment.id} value={shipment.id}>
                {shipment.shipmentNumber} - {shipment.status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Input
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            placeholder="e.g., In transit, Customs clearance"
            required
            data-testid="input-tracking-status"
          />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Current location"
            data-testid="input-location"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detailed tracking update"
          data-testid="input-tracking-description"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isCustomerNotified"
          checked={formData.isCustomerNotified}
          onChange={(e) => setFormData({ ...formData, isCustomerNotified: e.target.checked })}
          data-testid="checkbox-customer-notified"
        />
        <Label htmlFor="isCustomerNotified">Customer Notified</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={addTrackingMutation.isPending}
          data-testid="button-submit-tracking"
        >
          {addTrackingMutation.isPending ? 'Adding...' : 'Add Update'}
        </Button>
      </div>
    </form>
  );
}

// Component for viewing shipment details
function ShipmentDetailsView({ 
  shipment, 
  onClose 
}: { 
  shipment: ShipmentWithDetailsResponse;
  onClose: () => void;
}) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Shipment Details: {shipment.shipmentNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Shipment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={`${shipment.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                    shipment.status === 'in_transit' ? 'bg-blue-100 text-blue-800' : 
                    'bg-yellow-100 text-yellow-800'}`}>
                    {shipment.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Method:</span>
                  <span className="capitalize">{shipment.method.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Weight:</span>
                  <span>{shipment.totalWeight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Carrier:</span>
                  <span>{shipment.carrier.name}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-gray-600">Origin:</span>
                  <p className="text-sm">{shipment.originAddress}</p>
                </div>
                <div>
                  <span className="text-gray-600">Destination:</span>
                  <p className="text-sm">{shipment.destinationAddress}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Departure:</span>
                  <span className="text-sm">{formatDate(shipment.estimatedDepartureDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Arrival:</span>
                  <span className="text-sm">{formatDate(shipment.estimatedArrivalDate)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {shipment.costs && shipment.costs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Shipping Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {shipment.costs.map((cost) => (
                    <div key={cost.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium capitalize">{cost.costType.replace('_', ' ')}</span>
                        {cost.description && <p className="text-sm text-gray-600">{cost.description}</p>}
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{cost.amount} {cost.currency}</span>
                        {cost.currency !== 'USD' && (
                          <p className="text-sm text-gray-600">${cost.amountUsd} USD</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {shipment.tracking && shipment.tracking.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tracking History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shipment.tracking.map((track) => (
                    <div key={track.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{track.status}</span>
                          {track.location && (
                            <span className="text-sm text-gray-600">• {track.location}</span>
                          )}
                        </div>
                        {track.description && (
                          <p className="text-sm text-gray-600 mt-1">{track.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(track.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {track.isCustomerNotified && (
                        <Badge variant="secondary" className="text-xs">
                          Notified
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Component for adding shipping legs (multi-leg workflow)
function AddShippingLegForm({ 
  shipments, 
  onClose 
}: { 
  shipments: Shipment[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    shipmentId: '',
    legNumber: '',
    carrierName: '',
    vesselName: '',
    originPort: '',
    destinationPort: '',
    chargeableWeightKg: '',
    ratePerKg: '',
    legBaseCost: '',
    transferCommissionPercent: '',
    estimatedDepartureDate: '',
    estimatedArrivalDate: '',
    notes: '',
  });

  const addLegMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/shipping/legs', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipping/legs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shipping', 'commission-summary'] });
      toast({ title: "Shipping leg added successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to add shipping leg", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLegMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="shipment">Shipment</Label>
        <Select 
          value={formData.shipmentId} 
          onValueChange={(value) => setFormData({ ...formData, shipmentId: value })}
          required
        >
          <SelectTrigger data-testid="select-leg-shipment">
            <SelectValue placeholder="Select shipment" />
          </SelectTrigger>
          <SelectContent>
            {shipments.map((shipment) => (
              <SelectItem key={shipment.id} value={shipment.id}>
                {shipment.shipmentNumber} - {shipment.originAddress} → {shipment.destinationAddress}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="legNumber">Leg Number</Label>
          <Input
            id="legNumber"
            type="number"
            value={formData.legNumber}
            onChange={(e) => setFormData({ ...formData, legNumber: e.target.value })}
            required
            data-testid="input-leg-number"
          />
        </div>
        <div>
          <Label htmlFor="carrierName">Carrier Name</Label>
          <Input
            id="carrierName"
            value={formData.carrierName}
            onChange={(e) => setFormData({ ...formData, carrierName: e.target.value })}
            required
            data-testid="input-carrier-name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="originPort">Origin Port</Label>
          <Input
            id="originPort"
            value={formData.originPort}
            onChange={(e) => setFormData({ ...formData, originPort: e.target.value })}
            required
            data-testid="input-origin-port"
          />
        </div>
        <div>
          <Label htmlFor="destinationPort">Destination Port</Label>
          <Input
            id="destinationPort"
            value={formData.destinationPort}
            onChange={(e) => setFormData({ ...formData, destinationPort: e.target.value })}
            required
            data-testid="input-destination-port"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="chargeableWeightKg">Chargeable Weight (kg)</Label>
          <Input
            id="chargeableWeightKg"
            type="number"
            step="0.01"
            value={formData.chargeableWeightKg}
            onChange={(e) => setFormData({ ...formData, chargeableWeightKg: e.target.value })}
            required
            data-testid="input-chargeable-weight"
          />
        </div>
        <div>
          <Label htmlFor="ratePerKg">Rate per Kg (USD)</Label>
          <Input
            id="ratePerKg"
            type="number"
            step="0.0001"
            value={formData.ratePerKg}
            onChange={(e) => setFormData({ ...formData, ratePerKg: e.target.value })}
            required
            data-testid="input-rate-per-kg"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="legBaseCost">Leg Base Cost (USD)</Label>
          <Input
            id="legBaseCost"
            type="number"
            step="0.01"
            value={formData.legBaseCost}
            onChange={(e) => setFormData({ ...formData, legBaseCost: e.target.value })}
            required
            data-testid="input-leg-base-cost"
          />
        </div>
        <div>
          <Label htmlFor="transferCommissionPercent">Commission (%)</Label>
          <Input
            id="transferCommissionPercent"
            type="number"
            step="0.01"
            value={formData.transferCommissionPercent}
            onChange={(e) => setFormData({ ...formData, transferCommissionPercent: e.target.value })}
            data-testid="input-commission-percent"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          data-testid="input-leg-notes"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={addLegMutation.isPending}
          data-testid="button-submit-leg"
        >
          {addLegMutation.isPending ? 'Adding...' : 'Add Leg'}
        </Button>
      </div>
    </form>
  );
}

// Component for commission summary view
function CommissionSummaryView({ 
  shipments, 
  onClose 
}: { 
  shipments: Shipment[];
  onClose: () => void;
}) {
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  
  const { data: commissionSummary } = useQuery({
    queryKey: ['/api/shipping', selectedShipmentId, 'commission-summary'],
    enabled: !!selectedShipmentId,
  });

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="shipment">Select Shipment</Label>
        <Select 
          value={selectedShipmentId} 
          onValueChange={setSelectedShipmentId}
        >
          <SelectTrigger data-testid="select-commission-shipment">
            <SelectValue placeholder="Select shipment to view commissions" />
          </SelectTrigger>
          <SelectContent>
            {shipments.map((shipment) => (
              <SelectItem key={shipment.id} value={shipment.id}>
                {shipment.shipmentNumber} - {shipment.originAddress} → {shipment.destinationAddress}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {commissionSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Commission Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Commission</p>
                  <p className="text-xl font-bold">${commissionSummary.totalCommissionUsd?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Rate</p>
                  <p className="text-xl font-bold">${commissionSummary.averageRatePerKg?.toFixed(4) || '0.0000'}/kg</p>
                </div>
              </div>
              <div className="text-center text-gray-500">
                Full commission calculation details would be displayed here with leg-by-leg breakdown.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

// Component for starting inspections
function StartInspectionForm({ 
  shipments, 
  onClose 
}: { 
  shipments: Shipment[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    shipmentId: '',
    inspectionLocation: '',
    notes: '',
  });

  const startInspectionMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/shipping/inspections/start', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipping/inspections'] });
      toast({ title: "Inspection started successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to start inspection", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startInspectionMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="shipment">Shipment</Label>
        <Select 
          value={formData.shipmentId} 
          onValueChange={(value) => setFormData({ ...formData, shipmentId: value })}
          required
        >
          <SelectTrigger data-testid="select-inspection-shipment">
            <SelectValue placeholder="Select shipment" />
          </SelectTrigger>
          <SelectContent>
            {shipments.map((shipment) => (
              <SelectItem key={shipment.id} value={shipment.id}>
                {shipment.shipmentNumber} - {shipment.originAddress} → {shipment.destinationAddress}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="inspectionLocation">Inspection Location</Label>
        <Input
          id="inspectionLocation"
          value={formData.inspectionLocation}
          onChange={(e) => setFormData({ ...formData, inspectionLocation: e.target.value })}
          required
          data-testid="input-inspection-location"
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          data-testid="input-inspection-notes"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={startInspectionMutation.isPending}
          data-testid="button-submit-inspection"
        >
          {startInspectionMutation.isPending ? 'Starting...' : 'Start Inspection'}
        </Button>
      </div>
    </form>
  );
}

// Component for adding arrival costs
function AddArrivalCostForm({ 
  shipments, 
  onClose 
}: { 
  shipments: Shipment[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    shipmentId: '',
    costType: '',
    amount: '',
    currency: 'USD' as 'USD' | 'ETB',
    description: '',
    vendorName: '',
    documentReference: '',
  });

  const addArrivalCostMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/shipping/arrival-costs', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipping/arrival-costs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shipping/analytics'] });
      toast({ title: "Arrival cost added successfully" });
      onClose();
    },
    onError: () => {
      toast({ title: "Failed to add arrival cost", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addArrivalCostMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="shipment">Shipment</Label>
        <Select 
          value={formData.shipmentId} 
          onValueChange={(value) => setFormData({ ...formData, shipmentId: value })}
          required
        >
          <SelectTrigger data-testid="select-arrival-cost-shipment">
            <SelectValue placeholder="Select shipment" />
          </SelectTrigger>
          <SelectContent>
            {shipments.map((shipment) => (
              <SelectItem key={shipment.id} value={shipment.id}>
                {shipment.shipmentNumber} - {shipment.originAddress} → {shipment.destinationAddress}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="costType">Cost Type</Label>
          <Select 
            value={formData.costType} 
            onValueChange={(value) => setFormData({ ...formData, costType: value })}
            required
          >
            <SelectTrigger data-testid="select-arrival-cost-type">
              <SelectValue placeholder="Select cost type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="broker">Broker</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="customs">Customs</SelectItem>
              <SelectItem value="inspection">Inspection</SelectItem>
              <SelectItem value="handling">Handling</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="vendorName">Vendor Name</Label>
          <Input
            id="vendorName"
            value={formData.vendorName}
            onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
            data-testid="input-vendor-name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
            data-testid="input-arrival-amount"
          />
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select 
            value={formData.currency} 
            onValueChange={(value: any) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger data-testid="select-arrival-currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="ETB">ETB</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          data-testid="input-arrival-description"
        />
      </div>

      <div>
        <Label htmlFor="documentReference">Document Reference</Label>
        <Input
          id="documentReference"
          value={formData.documentReference}
          onChange={(e) => setFormData({ ...formData, documentReference: e.target.value })}
          data-testid="input-document-reference"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={addArrivalCostMutation.isPending}
          data-testid="button-submit-arrival-cost"
        >
          {addArrivalCostMutation.isPending ? 'Adding...' : 'Add Arrival Cost'}
        </Button>
      </div>
    </form>
  );
}