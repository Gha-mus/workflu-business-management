import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SettingsResponse, SuppliersResponse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  Settings as SettingsIcon,
  DollarSign,
  Users,
  Shield,
  Database,
  Plus,
  Edit,
  Save
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [exchangeRate, setExchangeRate] = useState("");
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [supplierTradeName, setSupplierTradeName] = useState("");
  const [supplierNotes, setSupplierNotes] = useState("");
  const [preventNegativeBalance, setPreventNegativeBalance] = useState(true);

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

  const { data: settings } = useQuery<SettingsResponse>({
    queryKey: ['/api/settings'],
  });

  // Update exchange rate when settings data changes
  useEffect(() => {
    if (settings?.exchangeRate) {
      setExchangeRate(settings.exchangeRate.toString());
    }
  }, [settings]);

  // Update preventNegativeBalance when settings data changes
  useEffect(() => {
    if (settings !== undefined) {
      setPreventNegativeBalance(settings.preventNegativeBalance);
    }
  }, [settings]);

  const { data: suppliers } = useQuery<SuppliersResponse>({
    queryKey: ['/api/suppliers'],
  });

  const updateExchangeRateMutation = useMutation({
    mutationFn: async (rate: string) => {
      return await apiRequest('POST', '/api/settings', {
        key: 'USD_ETB_RATE',
        value: rate,
        description: 'USD to ETB exchange rate'
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exchange rate updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
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
        description: "Failed to update exchange rate",
        variant: "destructive",
      });
    },
  });

  const updateNegativeBalanceMutation = useMutation({
    mutationFn: async (prevent: boolean) => {
      return await apiRequest('POST', '/api/settings', {
        key: 'PREVENT_NEGATIVE_BALANCE',
        value: prevent.toString(),
        description: 'Prevent capital balance from going negative'
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Negative balance setting updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
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
        description: "Failed to update negative balance setting",
        variant: "destructive",
      });
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (data: { name: string; tradeName?: string; notes?: string }) => {
      return await apiRequest('POST', '/api/suppliers', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Supplier created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      setShowAddSupplierModal(false);
      setSupplierName("");
      setSupplierTradeName("");
      setSupplierNotes("");
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
        description: "Failed to create supplier",
        variant: "destructive",
      });
    },
  });

  const handleUpdateExchangeRate = () => {
    if (!exchangeRate || isNaN(parseFloat(exchangeRate))) {
      toast({
        title: "Error",
        description: "Please enter a valid exchange rate",
        variant: "destructive",
      });
      return;
    }
    updateExchangeRateMutation.mutate(exchangeRate);
  };

  const handleCreateSupplier = () => {
    if (!supplierName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a supplier name",
        variant: "destructive",
      });
      return;
    }

    createSupplierMutation.mutate({
      name: supplierName.trim(),
      tradeName: supplierTradeName.trim() || undefined,
      notes: supplierNotes.trim() || undefined,
    });
  };

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="h-full flex" data-testid="settings-unauthorized">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-card border-b border-border px-6 py-4">
            <h2 className="text-2xl font-bold text-foreground">Settings</h2>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="pt-6 text-center">
                <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
                <p className="text-muted-foreground">
                  You need admin privileges to access this page.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-full flex" data-testid="settings">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Settings</h2>
              <p className="text-sm text-muted-foreground">Manage system configuration and business settings</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-background p-6">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center">
                    <SettingsIcon className="w-5 h-5 mr-2" />
                    General Settings
                  </h3>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input 
                        id="company-name" 
                        defaultValue="WorkFlu Business" 
                        data-testid="input-company-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select defaultValue="UTC">
                        <SelectTrigger data-testid="select-timezone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Africa/Addis_Ababa">Addis Ababa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="business-address">Business Address</Label>
                    <Textarea 
                      id="business-address"
                      placeholder="Enter your business address..."
                      data-testid="textarea-address"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="notifications" />
                    <Label htmlFor="notifications">Enable email notifications</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="auto-backup" defaultChecked />
                    <Label htmlFor="auto-backup">Enable automatic backups</Label>
                  </div>

                  <Button data-testid="save-general-settings">
                    <Save className="w-4 h-4 mr-2" />
                    Save General Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Financial Settings
                  </h3>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="exchange-rate">USD/ETB Exchange Rate</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="exchange-rate"
                          type="number"
                          step="0.0001"
                          value={exchangeRate}
                          onChange={(e) => setExchangeRate(e.target.value)}
                          placeholder="57.2500"
                          data-testid="input-exchange-rate"
                        />
                        <Button 
                          onClick={handleUpdateExchangeRate}
                          disabled={updateExchangeRateMutation.isPending}
                          data-testid="button-update-rate"
                        >
                          {updateExchangeRateMutation.isPending ? "Updating..." : "Update"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Current rate: {settings?.exchangeRate?.toFixed(4) || 'Not set'}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="base-currency">Base Currency</Label>
                      <Select defaultValue="USD">
                        <SelectTrigger data-testid="select-currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="ETB">ETB - Ethiopian Birr</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="negative-balance" 
                      checked={!preventNegativeBalance}
                      onCheckedChange={(checked) => {
                        const prevent = !checked;
                        setPreventNegativeBalance(prevent);
                        updateNegativeBalanceMutation.mutate(prevent);
                      }}
                      data-testid="switch-negative-balance"
                    />
                    <Label htmlFor="negative-balance">Allow negative capital balance</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="approval-required" defaultChecked />
                    <Label htmlFor="approval-required">Require approval for large transactions</Label>
                  </div>

                  <div>
                    <Label htmlFor="approval-threshold">Approval Threshold (USD)</Label>
                    <Input 
                      id="approval-threshold"
                      type="number"
                      defaultValue="5000"
                      placeholder="5000.00"
                      data-testid="input-approval-threshold"
                    />
                  </div>

                  <Button data-testid="save-financial-settings">
                    <Save className="w-4 h-4 mr-2" />
                    Save Financial Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suppliers" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Supplier Management
                    </h3>
                    <Dialog open={showAddSupplierModal} onOpenChange={setShowAddSupplierModal}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-add-supplier">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Supplier
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Supplier</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="supplier-name">Supplier Name *</Label>
                            <Input
                              id="supplier-name"
                              value={supplierName}
                              onChange={(e) => setSupplierName(e.target.value)}
                              placeholder="ABC Coffee Co."
                              data-testid="input-supplier-name"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="trade-name">Trade Name</Label>
                            <Input
                              id="trade-name"
                              value={supplierTradeName}
                              onChange={(e) => setSupplierTradeName(e.target.value)}
                              placeholder="Optional trade name"
                              data-testid="input-trade-name"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="supplier-notes">Notes</Label>
                            <Textarea
                              id="supplier-notes"
                              value={supplierNotes}
                              onChange={(e) => setSupplierNotes(e.target.value)}
                              placeholder="Quality notes, trust level, etc."
                              rows={3}
                              data-testid="textarea-supplier-notes"
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowAddSupplierModal(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleCreateSupplier}
                              disabled={createSupplierMutation.isPending}
                              data-testid="button-save-supplier"
                            >
                              {createSupplierMutation.isPending ? "Creating..." : "Create Supplier"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Trade Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Created
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {suppliers?.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                              No suppliers found
                            </td>
                          </tr>
                        ) : (
                          suppliers?.map((supplier: any) => (
                            <tr key={supplier.id} className="hover:bg-muted/50" data-testid={`supplier-${supplier.id}`}>
                              <td className="px-4 py-4 text-sm font-medium">
                                {supplier.name}
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {supplier.tradeName || '-'}
                              </td>
                              <td className="px-4 py-4">
                                <Badge variant={supplier.isActive ? "default" : "secondary"}>
                                  {supplier.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                              <td className="px-4 py-4 text-sm">
                                {new Date(supplier.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4">
                                <Button variant="ghost" size="sm" data-testid={`edit-supplier-${supplier.id}`}>
                                  <Edit className="w-4 h-4" />
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

            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    System Configuration
                  </h3>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                      <Input 
                        id="session-timeout"
                        type="number"
                        defaultValue="60"
                        data-testid="input-session-timeout"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="max-file-size">Max File Upload Size (MB)</Label>
                      <Input 
                        id="max-file-size"
                        type="number"
                        defaultValue="10"
                        data-testid="input-max-file-size"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="maintenance-mode" />
                    <Label htmlFor="maintenance-mode">Maintenance mode</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="debug-logging" />
                    <Label htmlFor="debug-logging">Enable debug logging</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch id="api-rate-limiting" defaultChecked />
                    <Label htmlFor="api-rate-limiting">Enable API rate limiting</Label>
                  </div>

                  <div>
                    <Label>System Status</Label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Database:</span>
                          <Badge variant="default" className="ml-2 bg-green-100 text-green-800">Connected</Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Storage:</span>
                          <Badge variant="default" className="ml-2 bg-green-100 text-green-800">Healthy</Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Memory:</span>
                          <Badge variant="outline" className="ml-2">1.2GB / 4GB</Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Uptime:</span>
                          <Badge variant="outline" className="ml-2">7d 14h</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button data-testid="save-system-settings">
                    <Save className="w-4 h-4 mr-2" />
                    Save System Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
