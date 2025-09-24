import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cartonsToKg, kgToCartons, validateKgInput, validateCartonInput, roundKg } from "@shared/measurementUnits";
import type { 
  Shipment, 
  ShipmentLeg,
  ArrivalCost,
  ShipmentInspection,
  LandedCostCalculation,
  Carrier,
  WarehouseStock,
  InsertShipmentLeg,
  InsertArrivalCost,
  InsertShipmentInspection
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Truck, 
  Ship, 
  Plane, 
  Package2, 
  Plus, 
  Calculator,
  CheckCircle,
  Eye,
  Edit,
  MapPin,
  Calendar,
  DollarSign,
  BarChart3,
  Scale,
  AlertTriangle,
  ShoppingCart,
  FileText
} from "lucide-react";

// Form schemas for shipping operations
const createLegSchema = z.object({
  legNumber: z.number().int().positive("Leg number must be positive"),
  carrierId: z.string().min(1, "Carrier is required"),
  method: z.enum(['sea', 'air', 'land', 'rail', 'multimodal']),
  originAddress: z.string().min(1, "Origin address is required"),
  destinationAddress: z.string().min(1, "Destination address is required"),
  netWeightKg: z.string().min(1, "Net weight is required"),
  cartonWeightKg: z.string().min(1, "Carton weight is required"),
  grossWeightKg: z.string().min(1, "Gross weight is required"),
  chargeableWeightKg: z.string().min(1, "Chargeable weight is required"),
  ratePerKg: z.string().min(1, "Rate per kg is required"),
  transferCommissionPercent: z.string().optional(),
  fundingSource: z.enum(['capital', 'external']),
  paymentCurrency: z.string().default('USD'),
  estimatedDepartureDate: z.string().optional(),
  estimatedArrivalDate: z.string().optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
});

const addArrivalCostSchema = z.object({
  costType: z.enum(['broker', 'delivery', 'customs', 'inspection', 'handling', 'other']),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().default('USD'),
  description: z.string().min(1, "Description is required"),
  fundingSource: z.enum(['capital', 'external']),
  paymentMethod: z.enum(['cash', 'advance', 'credit']).optional(),
  invoiceReference: z.string().optional(),
});

const startInspectionSchema = z.object({
  expectedWeightKg: z.string().min(1, "Expected weight is required"),
  receivedWeightKg: z.string().min(1, "Received weight is required"),
  cleanWeightKg: z.string().min(1, "Clean weight is required"),
  damagedWeightKg: z.string().min(1, "Damaged weight is required"),
  inspectionDate: z.string().optional(),
  notes: z.string().optional(),
});

type LegFormData = z.infer<typeof createLegSchema>;
type ArrivalCostFormData = z.infer<typeof addArrivalCostSchema>;
type InspectionFormData = z.infer<typeof startInspectionSchema>;

export default function Shipping() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("legs");
  
  // Modal states
  const [createLegOpen, setCreateLegOpen] = useState(false);
  const [addArrivalCostOpen, setAddArrivalCostOpen] = useState(false);
  const [startInspectionOpen, setStartInspectionOpen] = useState(false);
  const [calculateLandedCostOpen, setCalculateLandedCostOpen] = useState(false);
  
  // Carton helper states for shipping operations
  const [netWeightInputMethod, setNetWeightInputMethod] = useState<'kg' | 'cartons'>('kg');
  const [cartonWeightInputMethod, setCartonWeightInputMethod] = useState<'kg' | 'cartons'>('kg');
  const [grossWeightInputMethod, setGrossWeightInputMethod] = useState<'kg' | 'cartons'>('kg');
  const [netWeightCartons, setNetWeightCartons] = useState('');
  const [cartonWeightCartons, setCartonWeightCartons] = useState('');
  const [grossWeightCartons, setGrossWeightCartons] = useState('');

  // Forms
  const legForm = useForm<LegFormData>({
    resolver: zodResolver(createLegSchema),
    defaultValues: {
      legNumber: 1,
      carrierId: '',
      method: 'sea',
      originAddress: '',
      destinationAddress: '',
      netWeightKg: '',
      cartonWeightKg: '',
      grossWeightKg: '',
      chargeableWeightKg: '',
      ratePerKg: '',
      transferCommissionPercent: '0',
      fundingSource: 'capital',
      paymentCurrency: 'USD',
      estimatedDepartureDate: '',
      estimatedArrivalDate: '',
      trackingNumber: '',
      notes: '',
    },
  });

  const arrivalCostForm = useForm<ArrivalCostFormData>({
    resolver: zodResolver(addArrivalCostSchema),
    defaultValues: {
      costType: 'broker',
      amount: '',
      currency: 'USD',
      description: '',
      fundingSource: 'capital',
      paymentMethod: 'cash',
      invoiceReference: '',
    },
  });

  const inspectionForm = useForm<InspectionFormData>({
    resolver: zodResolver(startInspectionSchema),
    defaultValues: {
      expectedWeightKg: '',
      receivedWeightKg: '',
      cleanWeightKg: '',
      damagedWeightKg: '',
      inspectionDate: '',
      notes: '',
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

  // Core data queries
  const { data: shipments, isLoading: shipmentsLoading } = useQuery<Shipment[]>({
    queryKey: ['/api/shipping/shipments'],
  });

  const { data: carriers } = useQuery<Carrier[]>({
    queryKey: ['/api/carriers'],
  });

  const { data: warehouseStock } = useQuery<WarehouseStock[]>({
    queryKey: ['/api/warehouse/stock/available-for-shipping'],
  });

  // Tab-specific queries - properly scoped to selected shipment
  const { data: shipmentLegs, isLoading: legsLoading } = useQuery<ShipmentLeg[]>({
    queryKey: ['/api/shipments', selectedShipment, 'legs'],
    enabled: !!selectedShipment,
  });

  const { data: arrivalCosts, isLoading: arrivalCostsLoading } = useQuery<ArrivalCost[]>({
    queryKey: ['/api/shipments', selectedShipment, 'arrival-costs'],
    enabled: !!selectedShipment,
  });

  const { data: inspections, isLoading: inspectionsLoading } = useQuery<ShipmentInspection[]>({
    queryKey: ['/api/shipments', selectedShipment, 'inspections'],
    enabled: !!selectedShipment,
  });

  const { data: landedCosts } = useQuery<LandedCostCalculation[]>({
    queryKey: ['/api/shipments', selectedShipment, 'landed-costs'],
    enabled: !!selectedShipment,
  });

  // Analytics query
  const { data: analyticsData } = useQuery({
    queryKey: ['/api/shipping/analytics'],
  });

  // Mutations
  const createLegMutation = useMutation({
    mutationFn: (data: InsertShipmentLeg) => apiRequest('POST', `/api/shipments/${selectedShipment}/legs`, { ...data, shipmentId: selectedShipment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipments', selectedShipment, 'legs'] });
      setCreateLegOpen(false);
      toast({ title: "Success", description: "Shipping leg created successfully" });
    },
  });

  const createArrivalCostMutation = useMutation({
    mutationFn: (data: InsertArrivalCost) => apiRequest('POST', `/api/shipments/${selectedShipment}/arrival-costs`, { ...data, shipmentId: selectedShipment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipments', selectedShipment, 'arrival-costs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shipments', selectedShipment, 'landed-costs'] });
      setAddArrivalCostOpen(false);
      toast({ title: "Success", description: "Arrival cost added successfully" });
    },
  });

  const createInspectionMutation = useMutation({
    mutationFn: (data: InsertShipmentInspection) => apiRequest('POST', `/api/shipments/${selectedShipment}/inspections`, { ...data, shipmentId: selectedShipment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipments', selectedShipment, 'inspections'] });
      setStartInspectionOpen(false);
      toast({ title: "Success", description: "Inspection started successfully" });
    },
  });

  const calculateLandedCostMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/shipments/${selectedShipment}/landed-costs/calculate`, { shipmentId: selectedShipment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipments', selectedShipment, 'landed-costs'] });
      setCalculateLandedCostOpen(false);
      toast({ title: "Success", description: "Landed cost calculated successfully" });
    },
  });

  // Helper functions
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'sea':
        return <Ship className="h-4 w-4" />;
      case 'air':
        return <Plane className="h-4 w-4" />;
      case 'land':
        return <Truck className="h-4 w-4" />;
      default:
        return <Package2 className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const formatWeight = (weight: number | string) => {
    const num = typeof weight === 'string' ? parseFloat(weight) : weight;
    return `${num.toFixed(2)} kg`;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Shipping & Logistics
            </h1>
            
            {/* Shipment Selector */}
            <div className="flex items-center gap-4">
              <div className="min-w-[200px]">
                <Select value={selectedShipment || ""} onValueChange={setSelectedShipment}>
                  <SelectTrigger data-testid="select-shipment">
                    <SelectValue placeholder="Select a shipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {shipments?.map((shipment) => (
                      <SelectItem key={shipment.id} value={shipment.id}>
                        {shipment.shipmentNumber} - {shipment.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedShipment && (
                <Badge variant="outline" className="ml-2">
                  {shipments?.find(s => s.id === selectedShipment)?.shipmentNumber}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {!selectedShipment ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package2 className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Shipment Selected
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  Please select a shipment from the dropdown above to view shipping operations.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="legs" data-testid="tab-legs">
                  <Truck className="h-4 w-4 mr-2" />
                  Legs
                </TabsTrigger>
                <TabsTrigger value="arrival-costs" data-testid="tab-arrival-costs">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Arrival Costs
                </TabsTrigger>
                <TabsTrigger value="inspection" data-testid="tab-inspection">
                  <Scale className="h-4 w-4 mr-2" />
                  Inspection
                </TabsTrigger>
                <TabsTrigger value="analytics" data-testid="tab-analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              {/* LEGS TAB */}
              <TabsContent value="legs" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Shipping Legs
                  </h2>
                  <Button onClick={() => setCreateLegOpen(true)} data-testid="button-add-leg">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Leg
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Leg #</TableHead>
                          <TableHead>Carrier</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Route</TableHead>
                          <TableHead>Weight (kg)</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {legsLoading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                              Loading legs...
                            </TableCell>
                          </TableRow>
                        ) : shipmentLegs?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                              No shipping legs found. Add your first leg to get started.
                            </TableCell>
                          </TableRow>
                        ) : (
                          shipmentLegs?.map((leg) => (
                            <TableRow key={leg.id}>
                              <TableCell className="font-medium">
                                {leg.legNumber}
                              </TableCell>
                              <TableCell>
                                {carriers?.find(c => c.id === leg.carrierId)?.name || 'Unknown'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  {getMethodIcon(leg.method)}
                                  <span className="ml-2 capitalize">
                                    {leg.method.replace('_', ' ')}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>{leg.originAddress}</div>
                                  <div className="text-gray-500">→ {leg.destinationAddress}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>Net: {formatWeight(leg.netWeightKg)}</div>
                                  <div>Gross: {formatWeight(leg.grossWeightKg)}</div>
                                  <div className="font-medium">Chargeable: {formatWeight(leg.chargeableWeightKg)}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>Rate: {formatCurrency(leg.ratePerKg)}/kg</div>
                                  <div className="font-medium">Total: {formatCurrency(leg.legTotalCost)}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(leg.status)}>
                                  {leg.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" data-testid={`button-view-leg-${leg.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" data-testid={`button-edit-leg-${leg.id}`}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {leg.isConfirmed ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Button variant="ghost" size="sm" data-testid={`button-confirm-leg-${leg.id}`}>
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ARRIVAL COSTS TAB */}
              <TabsContent value="arrival-costs" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Arrival Costs
                  </h2>
                  <div className="flex gap-2">
                    <Button onClick={() => setAddArrivalCostOpen(true)} data-testid="button-add-arrival-cost">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Cost
                    </Button>
                    <Button 
                      onClick={() => {
                        if (!selectedShipment) {
                          toast({ title: "Error", description: "Please select a shipment first", variant: "destructive" });
                          return;
                        }
                        calculateLandedCostMutation.mutate();
                      }} 
                      variant="outline" 
                      data-testid="button-calculate-landed-cost"
                      disabled={!selectedShipment || calculateLandedCostMutation.isPending}
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      {calculateLandedCostMutation.isPending ? 'Calculating...' : 'Calculate Landed Cost'}
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cost Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead>USD Amount</TableHead>
                          <TableHead>Payment Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {arrivalCostsLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              Loading arrival costs...
                            </TableCell>
                          </TableRow>
                        ) : arrivalCosts?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              No arrival costs recorded. Add costs as they occur.
                            </TableCell>
                          </TableRow>
                        ) : (
                          arrivalCosts?.map((cost) => (
                            <TableRow key={cost.id}>
                              <TableCell className="font-medium capitalize">
                                {cost.costType.replace('_', ' ')}
                              </TableCell>
                              <TableCell>{formatCurrency(cost.amount)}</TableCell>
                              <TableCell>{cost.currency}</TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(cost.amountUsd)}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>Paid: {formatCurrency(cost.amountPaid)}</div>
                                  <div className="text-red-600">
                                    Remaining: {formatCurrency(cost.remaining)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" data-testid={`button-view-cost-${cost.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" data-testid={`button-edit-cost-${cost.id}`}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Landed Cost Summary */}
                {landedCosts && landedCosts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calculator className="h-5 w-5 mr-2" />
                        Landed Cost Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {landedCosts.map((calc) => (
                        <div key={calc.id} className="grid grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Total Leg Costs</p>
                            <p className="font-semibold">{formatCurrency(calc.totalLegCosts)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Total Arrival Costs</p>
                            <p className="font-semibold">{formatCurrency(calc.totalArrivalCosts)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Total Landed Cost</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(calc.totalLandedCost)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Cost per KG</p>
                            <p className="font-semibold">{formatCurrency(calc.costPerKg)}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* INSPECTION TAB */}
              <TabsContent value="inspection" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Shipment Inspection
                  </h2>
                  <Button onClick={() => setStartInspectionOpen(true)} data-testid="button-start-inspection">
                    <Scale className="h-4 w-4 mr-2" />
                    Start Inspection
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Inspection #</TableHead>
                          <TableHead>Expected Weight</TableHead>
                          <TableHead>Received Weight</TableHead>
                          <TableHead>Clean Weight</TableHead>
                          <TableHead>Damaged Weight</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inspectionsLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              Loading inspections...
                            </TableCell>
                          </TableRow>
                        ) : inspections?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              No inspections found. Start your first inspection.
                            </TableCell>
                          </TableRow>
                        ) : (
                          inspections?.map((inspection) => (
                            <TableRow key={inspection.id}>
                              <TableCell className="font-medium">
                                {inspection.inspectionNumber}
                              </TableCell>
                              <TableCell>{formatWeight(inspection.expectedWeightKg)}</TableCell>
                              <TableCell>{formatWeight(inspection.receivedWeightKg)}</TableCell>
                              <TableCell className="text-green-600">
                                {formatWeight(inspection.cleanWeightKg)}
                              </TableCell>
                              <TableCell className="text-red-600">
                                {formatWeight(inspection.damagedWeightKg)}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(inspection.status)}>
                                  {inspection.status}
                                </Badge>
                                {inspection.settlementRequired && (
                                  <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2 inline" />
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm" data-testid={`button-view-inspection-${inspection.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {inspection.status === 'pending' && (
                                    <Button variant="ghost" size="sm" data-testid={`button-complete-inspection-${inspection.id}`}>
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {inspection.finalWarehouseTransferred ? (
                                    <Badge variant="outline" className="text-green-600">
                                      Transferred
                                    </Badge>
                                  ) : (
                                    <Button variant="ghost" size="sm" data-testid={`button-transfer-inspection-${inspection.id}`}>
                                      <ShoppingCart className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ANALYTICS TAB */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Shipping Analytics
                  </h2>
                  <Button variant="outline" data-testid="button-export-analytics">
                    <FileText className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
                      <Package2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analyticsData?.totalShipments || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        Active shipments in system
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Shipping Costs</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(analyticsData?.totalShippingCosts || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        All shipping expenses
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Cost per KG</CardTitle>
                      <Scale className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(analyticsData?.avgCostPerKg || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Average shipping cost
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analyticsData?.onTimeDeliveryRate || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Delivery performance
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Shipping Methods Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData?.methodDistribution?.map((method: any) => (
                          <div key={method.method} className="flex items-center justify-between">
                            <div className="flex items-center">
                              {getMethodIcon(method.method)}
                              <span className="ml-2 capitalize">{method.method.replace('_', ' ')}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{method.count} shipments</div>
                              <div className="text-sm text-gray-500">{method.percentage}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Cost Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Shipping Legs</span>
                          <span className="font-medium">
                            {formatCurrency(analyticsData?.costBreakdown?.legs || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Arrival Costs</span>
                          <span className="font-medium">
                            {formatCurrency(analyticsData?.costBreakdown?.arrival || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-medium">Total</span>
                          <span className="font-bold">
                            {formatCurrency((analyticsData?.costBreakdown?.legs || 0) + (analyticsData?.costBreakdown?.arrival || 0))}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Create Leg Dialog */}
      <Dialog open={createLegOpen} onOpenChange={setCreateLegOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Shipping Leg</DialogTitle>
          </DialogHeader>
          <Form {...legForm}>
            <form
              onSubmit={legForm.handleSubmit((data) => {
                if (!selectedShipment) return;
                
                // Validate and normalize weight data before submission
                try {
                  // Validate kg inputs using measurement utilities
                  const netWeightKg = validateKgInput(data.netWeightKg);
                  const cartonWeightKg = validateKgInput(data.cartonWeightKg);
                  const grossWeightKg = validateKgInput(data.grossWeightKg);
                  
                  // Round kg values for precision
                  const normalizedData = {
                    ...data,
                    netWeightKg: roundKg(netWeightKg).toString(),
                    cartonWeightKg: roundKg(cartonWeightKg).toString(),
                    grossWeightKg: roundKg(grossWeightKg).toString(),
                  };
                  
                  createLegMutation.mutate(normalizedData);
                } catch (error) {
                  toast({
                    title: "Validation Error",
                    description: error instanceof Error ? error.message : "Invalid weight values. Please check your inputs.",
                    variant: "destructive"
                  });
                }
              })}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={legForm.control}
                  name="legNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leg Number</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value?.toString() || ''}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          data-testid="input-leg-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={legForm.control}
                  name="carrierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carrier</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-carrier">
                            <SelectValue placeholder="Select carrier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {carriers?.map((carrier) => (
                            <SelectItem key={carrier.id} value={carrier.id}>
                              {carrier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={legForm.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-method">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sea">Sea Freight</SelectItem>
                        <SelectItem value="air">Air Freight</SelectItem>
                        <SelectItem value="land">Land Freight</SelectItem>
                        <SelectItem value="rail">Rail</SelectItem>
                        <SelectItem value="multimodal">Multimodal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={legForm.control}
                  name="originAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-origin" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={legForm.control}
                  name="destinationAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-destination" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={legForm.control}
                  name="netWeightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between">
                        <span>Net Weight</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant={netWeightInputMethod === 'kg' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setNetWeightInputMethod('kg')}
                            data-testid="toggle-net-weight-kg"
                            className="h-6 px-2 text-xs"
                          >
                            kg
                          </Button>
                          <Button
                            type="button"
                            variant={netWeightInputMethod === 'cartons' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setNetWeightInputMethod('cartons')}
                            data-testid="toggle-net-weight-cartons"
                            className="h-6 px-2 text-xs"
                          >
                            C20
                          </Button>
                        </div>
                      </FormLabel>
                      <FormControl>
                        {netWeightInputMethod === 'kg' ? (
                          <div className="space-y-1">
                            <Input 
                              {...field} 
                              data-testid="input-net-weight-kg"
                              onChange={(e) => {
                                field.onChange(e);
                                if (e.target.value) {
                                  const cartonsEq = kgToCartons(parseFloat(e.target.value), 'C20');
                                  setNetWeightCartons(cartonsEq.toFixed(1));
                                }
                              }}
                            />
                            {field.value && (
                              <div className="text-xs text-muted-foreground">
                                ≈ {kgToCartons(parseFloat(field.value) || 0, 'C20').toFixed(1)} C20 cartons
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Input 
                              value={netWeightCartons}
                              onChange={(e) => {
                                setNetWeightCartons(e.target.value);
                                if (e.target.value) {
                                  const kgValue = cartonsToKg(parseFloat(e.target.value), 'C20');
                                  const roundedKg = roundKg(kgValue);
                                  field.onChange(roundedKg.toString());
                                }
                              }}
                              data-testid="input-net-weight-cartons"
                              placeholder="Enter C20 cartons"
                            />
                            {netWeightCartons && (
                              <div className="text-xs text-muted-foreground">
                                = {cartonsToKg(parseFloat(netWeightCartons) || 0, 'C20').toFixed(2)} kg
                              </div>
                            )}
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={legForm.control}
                  name="cartonWeightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between">
                        <span>Carton Weight</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant={cartonWeightInputMethod === 'kg' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setCartonWeightInputMethod('kg')}
                            data-testid="toggle-carton-weight-kg"
                            className="h-6 px-2 text-xs"
                          >
                            kg
                          </Button>
                          <Button
                            type="button"
                            variant={cartonWeightInputMethod === 'cartons' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setCartonWeightInputMethod('cartons')}
                            data-testid="toggle-carton-weight-cartons"
                            className="h-6 px-2 text-xs"
                          >
                            C20
                          </Button>
                        </div>
                      </FormLabel>
                      <FormControl>
                        {cartonWeightInputMethod === 'kg' ? (
                          <div className="space-y-1">
                            <Input 
                              {...field} 
                              data-testid="input-carton-weight-kg"
                              onChange={(e) => {
                                field.onChange(e);
                                if (e.target.value) {
                                  const cartonsEq = kgToCartons(parseFloat(e.target.value), 'C20');
                                  setCartonWeightCartons(cartonsEq.toFixed(1));
                                }
                              }}
                            />
                            {field.value && (
                              <div className="text-xs text-muted-foreground">
                                ≈ {kgToCartons(parseFloat(field.value) || 0, 'C20').toFixed(1)} C20 cartons
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Input 
                              value={cartonWeightCartons}
                              onChange={(e) => {
                                setCartonWeightCartons(e.target.value);
                                if (e.target.value) {
                                  const kgValue = cartonsToKg(parseFloat(e.target.value), 'C20');
                                  const roundedKg = roundKg(kgValue);
                                  field.onChange(roundedKg.toString());
                                }
                              }}
                              data-testid="input-carton-weight-cartons"
                              placeholder="Enter C20 cartons"
                            />
                            {cartonWeightCartons && (
                              <div className="text-xs text-muted-foreground">
                                = {cartonsToKg(parseFloat(cartonWeightCartons) || 0, 'C20').toFixed(2)} kg
                              </div>
                            )}
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={legForm.control}
                  name="grossWeightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between">
                        <span>Gross Weight</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant={grossWeightInputMethod === 'kg' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setGrossWeightInputMethod('kg')}
                            data-testid="toggle-gross-weight-kg"
                            className="h-6 px-2 text-xs"
                          >
                            kg
                          </Button>
                          <Button
                            type="button"
                            variant={grossWeightInputMethod === 'cartons' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setGrossWeightInputMethod('cartons')}
                            data-testid="toggle-gross-weight-cartons"
                            className="h-6 px-2 text-xs"
                          >
                            C20
                          </Button>
                        </div>
                      </FormLabel>
                      <FormControl>
                        {grossWeightInputMethod === 'kg' ? (
                          <div className="space-y-1">
                            <Input 
                              {...field} 
                              data-testid="input-gross-weight-kg"
                              onChange={(e) => {
                                field.onChange(e);
                                if (e.target.value) {
                                  const cartonsEq = kgToCartons(parseFloat(e.target.value), 'C20');
                                  setGrossWeightCartons(cartonsEq.toFixed(1));
                                }
                              }}
                            />
                            {field.value && (
                              <div className="text-xs text-muted-foreground">
                                ≈ {kgToCartons(parseFloat(field.value) || 0, 'C20').toFixed(1)} C20 cartons
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Input 
                              value={grossWeightCartons}
                              onChange={(e) => {
                                setGrossWeightCartons(e.target.value);
                                if (e.target.value) {
                                  const kgValue = cartonsToKg(parseFloat(e.target.value), 'C20');
                                  const roundedKg = roundKg(kgValue);
                                  field.onChange(roundedKg.toString());
                                }
                              }}
                              data-testid="input-gross-weight-cartons"
                              placeholder="Enter C20 cartons"
                            />
                            {grossWeightCartons && (
                              <div className="text-xs text-muted-foreground">
                                = {cartonsToKg(parseFloat(grossWeightCartons) || 0, 'C20').toFixed(2)} kg
                              </div>
                            )}
                          </div>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={legForm.control}
                  name="chargeableWeightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chargeable Weight (kg)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-chargeable-weight" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={legForm.control}
                  name="ratePerKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate per KG</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-rate-per-kg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={legForm.control}
                  name="transferCommissionPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission %</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-commission" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={legForm.control}
                  name="fundingSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funding Source</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-funding-source">
                            <SelectValue placeholder="Select funding" />
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
                control={legForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-leg-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateLegOpen(false)}
                  data-testid="button-cancel-leg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createLegMutation.isPending}
                  data-testid="button-save-leg"
                >
                  {createLegMutation.isPending ? 'Creating...' : 'Create Leg'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Arrival Cost Dialog */}
      <Dialog open={addArrivalCostOpen} onOpenChange={setAddArrivalCostOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Arrival Cost</DialogTitle>
          </DialogHeader>
          <Form {...arrivalCostForm}>
            <form
              onSubmit={arrivalCostForm.handleSubmit((data) => {
                if (!selectedShipment) return;
                createArrivalCostMutation.mutate(data);
              })}
              className="space-y-4"
            >
              <FormField
                control={arrivalCostForm.control}
                name="costType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-cost-type">
                          <SelectValue placeholder="Select cost type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="broker">Broker</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                        <SelectItem value="customs">Customs</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="handling">Handling</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={arrivalCostForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-cost-amount" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={arrivalCostForm.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-cost-currency">
                            <SelectValue placeholder="Currency" />
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

              <FormField
                control={arrivalCostForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-cost-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={arrivalCostForm.control}
                  name="fundingSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funding Source</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-cost-funding">
                            <SelectValue placeholder="Funding" />
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

                <FormField
                  control={arrivalCostForm.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-method">
                            <SelectValue placeholder="Payment" />
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
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddArrivalCostOpen(false)}
                  data-testid="button-cancel-cost"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createArrivalCostMutation.isPending}
                  data-testid="button-save-cost"
                >
                  {createArrivalCostMutation.isPending ? 'Adding...' : 'Add Cost'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Start Inspection Dialog */}
      <Dialog open={startInspectionOpen} onOpenChange={setStartInspectionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Shipment Inspection</DialogTitle>
          </DialogHeader>
          <Form {...inspectionForm}>
            <form
              onSubmit={inspectionForm.handleSubmit((data) => {
                if (!selectedShipment) return;
                createInspectionMutation.mutate(data);
              })}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={inspectionForm.control}
                  name="expectedWeightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Weight (kg)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-expected-weight" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={inspectionForm.control}
                  name="receivedWeightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Received Weight (kg)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-received-weight" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={inspectionForm.control}
                  name="cleanWeightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clean Weight (kg)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-clean-weight" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={inspectionForm.control}
                  name="damagedWeightKg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Damaged Weight (kg)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-damaged-weight" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={inspectionForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspection Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-inspection-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStartInspectionOpen(false)}
                  data-testid="button-cancel-inspection"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createInspectionMutation.isPending}
                  data-testid="button-save-inspection"
                >
                  {createInspectionMutation.isPending ? 'Starting...' : 'Start Inspection'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}