import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EnhancedSettingsResponse, SuppliersResponse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Settings as SettingsIcon,
  DollarSign,
  Users,
  Shield,
  Database,
  Plus,
  Edit,
  Save,
  Brain,
  Power,
  MessageSquare,
  FileText,
  Globe,
  Warehouse,
  Bell,
  Calculator,
  Clock,
  Archive,
  Key,
  RefreshCw,
  Trash2,
  History,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Copy,
  Monitor,
  Zap,
  Target,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Lock,
  Unlock,
  Search,
  Filter,
  Download,
  Upload,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  Percent,
  Hash,
  Type,
  ToggleLeft,
  ToggleRight,
  Info,
  HelpCircle,
  ExternalLink,
  Laptop,
  Smartphone,
  Tablet,
  Server,
  Cloud,
  HardDrive,
  Cpu,
  Network,
  Wifi,
  Camera,
  Printer,
  Volume2,
  Headphones,
  Mic,
  Video,
  Image,
  Folder,
  FolderOpen,
  File,
  FileCheck,
  FilePlus,
  FileX,
  Paperclip,
  Link,
  Tag,
  Bookmark,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Send,
  Share,
  Forward,
  Reply,
  ReplyAll,
  Inbox,
  Trash,
  MailCheck,
  MailOpen,
  MailX,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Crown,
  Award,
  Trophy,
  Medal,
  Gift,
  Package,
  ShoppingCart,
  ShoppingBag,
  Store,
  CreditCard as CardIcon,
  Coins,
  Banknote,
  Receipt,
  Calculator as CalcIcon,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  MoreVertical,
  Menu,
  X,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Move,
  Crop,
  Scissors,
  PaintBucket,
  Brush,
  Palette,
  Pipette,
  Ruler,
  Grid,
  Layout,
  Layers,
  Shapes,
  Wrench
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [exchangeRate, setExchangeRate] = useState("");
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [supplierTradeName, setSupplierTradeName] = useState("");
  const [supplierNotes, setSupplierNotes] = useState("");
  const [preventNegativeBalance, setPreventNegativeBalance] = useState(true);
  const [aiSettings, setAiSettings] = useState({
    enabled: false,
    features: {
      translation: false,
      assistant: false,
      reports: false
    },
    model: 'gpt-3.5-turbo',
    hasApiKey: false
  });
  const [isSavingAI, setIsSavingAI] = useState(false);

  // Management tab state and schemas
  const [activeManagementTab, setActiveManagementTab] = useState('overview');
  const [showSnapshotDialog, setShowSnapshotDialog] = useState(false);

  // Zod schemas for Management forms
  const settingUpdateSchema = z.object({
    key: z.string().min(1, 'Setting key is required'),
    value: z.string().min(1, 'Setting value is required'),
    description: z.string().optional(),
    category: z.enum(['financial', 'operational', 'security', 'numbering', 'notification', 'user', 'warehouse', 'general']),
    dataType: z.enum(['string', 'number', 'boolean', 'json']),
    isSystemCritical: z.boolean().default(false),
    requiresApproval: z.boolean().default(false),
    changeReason: z.string().min(1, 'Change reason is required'),
  });

  const numberingSchemeSchema = z.object({
    entityType: z.string().min(1, 'Entity type is required'),
    prefix: z.string().default(''),
    currentNumber: z.number().min(0).default(0),
    increment: z.number().min(1).default(1),
    minDigits: z.number().min(1).max(10).default(4),
    suffix: z.string().default(''),
    format: z.string().default('{prefix}{number:0{minDigits}}{suffix}'),
    resetPeriod: z.enum(['never', 'annual', 'monthly']).default('never'),
  });

  const snapshotCreateSchema = z.object({
    name: z.string().min(1, 'Snapshot name is required'),
    description: z.string().optional(),
  });

  // Forms for Management
  const snapshotForm = useForm({
    resolver: zodResolver(snapshotCreateSchema),
    defaultValues: {
      name: '',
      description: ''
    }
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

  // Fetch AI status
  const { data: aiStatus } = useQuery({
    queryKey: ['/api/ai/status'],
    enabled: user?.role === 'admin',
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update local AI settings when status is fetched
  useEffect(() => {
    if (aiStatus && typeof aiStatus === 'object' && 'enabled' in aiStatus) {
      setAiSettings(aiStatus as typeof aiSettings);
    }
  }, [aiStatus]);

  // Mutation for updating AI settings
  const updateAISettingsMutation = useMutation({
    mutationFn: async (updates: typeof aiSettings) => {
      return await apiRequest('POST', '/api/ai/settings', updates);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/status'] });
      toast({
        title: 'AI Settings Updated',
        description: 'AI settings have been successfully updated.',
      });
      if (data?.settings) {
        setAiSettings(data.settings);
      }
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update AI settings. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Handle AI settings update
  const handleAISettingsUpdate = async () => {
    setIsSavingAI(true);
    try {
      await updateAISettingsMutation.mutateAsync(aiSettings);
    } finally {
      setIsSavingAI(false);
    }
  };

  const { data: settings } = useQuery<EnhancedSettingsResponse>({
    queryKey: ['/api/settings'],
  });

  // Update exchange rate when settings data changes
  useEffect(() => {
    if (settings?.financial?.exchangeRate) {
      setExchangeRate(settings.financial.exchangeRate.toString());
    }
  }, [settings?.financial?.exchangeRate]);

  // Update preventNegativeBalance when settings data changes
  useEffect(() => {
    if (settings?.financial !== undefined) {
      setPreventNegativeBalance(settings.financial.preventNegativeBalance);
    }
  }, [settings?.financial?.preventNegativeBalance]);

  const { data: suppliers } = useQuery<SuppliersResponse>({
    queryKey: ['/api/suppliers'],
  });

  const updateExchangeRateMutation = useMutation({
    mutationFn: async (rate: string) => {
      return await apiRequest('POST', '/api/settings', {
        key: 'USD_ETB_RATE',
        value: rate,
        description: 'USD to ETB exchange rate',
        category: 'financial'
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
          setLocation("/auth/login");
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

  // Management tab mutations
  const createSnapshotMutation = useMutation({
    mutationFn: async (data: z.infer<typeof snapshotCreateSchema>) => {
      return await apiRequest('POST', '/api/settings/snapshots', data);
    },
    onSuccess: () => {
      toast({ 
        title: 'Snapshot Created',
        description: 'Configuration snapshot has been created successfully.'
      });
      snapshotForm.reset();
      setShowSnapshotDialog(false);
    },
    onError: (error) => {
      toast({ 
        title: 'Snapshot Creation Failed',
        description: 'Failed to create configuration snapshot.',
        variant: 'destructive'
      });
    }
  });

  const updateNegativeBalanceMutation = useMutation({
    mutationFn: async (prevent: boolean) => {
      return await apiRequest('POST', '/api/settings', {
        key: 'PREVENT_NEGATIVE_BALANCE',
        value: prevent.toString(),
        description: 'Prevent capital balance from going negative',
        category: 'financial'
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
          setLocation("/auth/login");
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
          setLocation("/auth/login");
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="ai">AI</TabsTrigger>
              <TabsTrigger value="management">Management</TabsTrigger>
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
                        Current rate: {settings?.financial?.exchangeRate?.toFixed(4) || 'Not set'}
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

            <TabsContent value="ai" className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center">
                    <Brain className="w-5 h-5 mr-2" />
                    AI Configuration
                  </h3>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Master AI Toggle */}
                  <div className="border-b pb-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base flex items-center">
                          <Power className="w-4 h-4 mr-2" />
                          Master AI Toggle
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Enable or disable all AI features system-wide
                        </p>
                      </div>
                      <Switch 
                        id="ai-master-toggle"
                        checked={aiSettings.enabled}
                        disabled={!user || user.role !== 'admin'}
                        onCheckedChange={(checked) => 
                          setAiSettings(prev => ({ ...prev, enabled: checked }))
                        }
                        data-testid="switch-ai-master"
                      />
                    </div>
                  </div>

                  {/* Feature Toggles */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">FEATURE TOGGLES</h4>
                    
                    {/* Translation Feature */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          Translation
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          AI-powered text translation (Coming Soon)
                        </p>
                      </div>
                      <Switch 
                        id="ai-feature-translation"
                        checked={aiSettings.features.translation}
                        disabled={!aiSettings.enabled || !user || user.role !== 'admin'}
                        onCheckedChange={(checked) => 
                          setAiSettings(prev => ({ 
                            ...prev, 
                            features: { ...prev.features, translation: checked }
                          }))
                        }
                        data-testid="switch-ai-translation"
                      />
                    </div>

                    {/* Assistant Feature */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          AI Assistant
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Business chat assistant and contextual help
                        </p>
                      </div>
                      <Switch 
                        id="ai-feature-assistant"
                        checked={aiSettings.features.assistant}
                        disabled={!aiSettings.enabled || !user || user.role !== 'admin'}
                        onCheckedChange={(checked) => 
                          setAiSettings(prev => ({ 
                            ...prev, 
                            features: { ...prev.features, assistant: checked }
                          }))
                        }
                        data-testid="switch-ai-assistant"
                      />
                    </div>

                    {/* Reports Feature */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          AI Reports
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Intelligent analytics, insights, and recommendations
                        </p>
                      </div>
                      <Switch 
                        id="ai-feature-reports"
                        checked={aiSettings.features.reports}
                        disabled={!aiSettings.enabled || !user || user.role !== 'admin'}
                        onCheckedChange={(checked) => 
                          setAiSettings(prev => ({ 
                            ...prev, 
                            features: { ...prev.features, reports: checked }
                          }))
                        }
                        data-testid="switch-ai-reports"
                      />
                    </div>
                  </div>

                  {/* Model Information */}
                  <div className="border-t pt-6">
                    <h4 className="font-medium text-sm text-muted-foreground mb-4">MODEL CONFIGURATION</h4>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Active Model</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Current AI model being used for all features
                          </p>
                        </div>
                        <Badge variant="secondary" className="font-mono">
                          {aiSettings.model}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Status Information */}
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-4">AI SERVICE STATUS</h4>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">API Status:</span>
                          <Badge 
                            variant={aiSettings.hasApiKey ? "default" : "destructive"} 
                            className={aiSettings.hasApiKey ? "ml-2 bg-green-100 text-green-800" : "ml-2"}
                          >
                            {aiSettings.hasApiKey ? "Connected" : "No API Key"}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rate Limit:</span>
                          <Badge variant="outline" className="ml-2">60 req/min</Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Usage Today:</span>
                          <Badge variant="outline" className="ml-2">234 requests</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {!aiSettings.hasApiKey && (
                      <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                        <p className="text-sm text-yellow-800">
                          <strong>Warning:</strong> No OpenAI API key is configured. AI features will not work without an API key.
                        </p>
                        <p className="text-sm text-yellow-800 mt-2">
                          Please set the OPENAI_API_KEY environment variable and restart the server.
                        </p>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full"
                      onClick={handleAISettingsUpdate}
                      disabled={isSavingAI || !user || user.role !== 'admin'}
                      data-testid="save-ai-settings"
                    >
                      {isSavingAI ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-r-transparent" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save AI Settings
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="management" className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center">
                    <Wrench className="w-5 h-5 mr-2" />
                    Advanced Management Configuration
                  </h3>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeManagementTab} onValueChange={setActiveManagementTab}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="financial">Financial</TabsTrigger>
                      <TabsTrigger value="operational">Operational</TabsTrigger>
                      <TabsTrigger value="numbering">Numbering</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 mt-6">
                      {/* System Overview */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Monitor className="h-5 w-5" />
                            System Overview
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 border rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium">System Status</span>
                              </div>
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Operational
                              </Badge>
                            </div>
                            <div className="p-4 border rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Database className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium">Database</span>
                              </div>
                              <Badge variant="secondary">PostgreSQL</Badge>
                            </div>
                            <div className="p-4 border rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-4 w-4 text-purple-600" />
                                <span className="text-sm font-medium">Version</span>
                              </div>
                              <Badge variant="outline">v1.0.0</Badge>
                            </div>
                          </div>

                          <Separator />

                          <div>
                            <h4 className="font-semibold mb-3">Quick Actions</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 border rounded-lg">
                                <h4 className="font-semibold mb-2">Configuration Backup</h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                  Create a snapshot of current settings for recovery.
                                </p>
                                <Button 
                                  variant="outline" 
                                  className="w-full"
                                  onClick={() => setShowSnapshotDialog(true)}
                                  data-testid="button-create-backup"
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  Create Backup
                                </Button>
                              </div>

                              <div className="p-4 border rounded-lg">
                                <h4 className="font-semibold mb-2">System Health Check</h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                  Run comprehensive system health and configuration checks.
                                </p>
                                <Button variant="outline" className="w-full" data-testid="button-health-check">
                                  <Activity className="mr-2 h-4 w-4" />
                                  Run Health Check
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="financial" className="space-y-6 mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Financial Configuration
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <Label>Tax Rate (%)</Label>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="15.00"
                                data-testid="input-tax-rate"
                              />
                            </div>
                            <div>
                              <Label>Fiscal Year Start</Label>
                              <Select defaultValue="january">
                                <SelectTrigger data-testid="select-fiscal-year">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="january">January</SelectItem>
                                  <SelectItem value="april">April</SelectItem>
                                  <SelectItem value="july">July</SelectItem>
                                  <SelectItem value="october">October</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Payment Terms (Days)</Label>
                            <Input 
                              type="number" 
                              defaultValue="30" 
                              data-testid="input-payment-terms"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch id="auto-calculate-tax" defaultChecked />
                            <Label htmlFor="auto-calculate-tax">Automatically calculate tax on transactions</Label>
                          </div>

                          <Button data-testid="save-financial-config">
                            <Save className="w-4 h-4 mr-2" />
                            Save Financial Configuration
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="operational" className="space-y-6 mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Warehouse className="h-5 w-5" />
                            Operational Configuration
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="space-y-4">
                            <div>
                              <Label>Default Warehouse Code</Label>
                              <Input 
                                defaultValue="WH001" 
                                data-testid="input-default-warehouse"
                              />
                            </div>

                            <div>
                              <Label>Minimum Stock Alert Threshold</Label>
                              <Input 
                                type="number" 
                                defaultValue="100" 
                                data-testid="input-stock-threshold"
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch id="auto-approve-small" />
                              <Label htmlFor="auto-approve-small">Auto-approve transactions under $1,000</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch id="require-two-factor" />
                              <Label htmlFor="require-two-factor">Require two-factor approval for critical operations</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch id="enable-audit-trail" defaultChecked />
                              <Label htmlFor="enable-audit-trail">Enable comprehensive audit trail</Label>
                            </div>
                          </div>

                          <Button data-testid="save-operational-config">
                            <Save className="w-4 h-4 mr-2" />
                            Save Operational Configuration
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="numbering" className="space-y-6 mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Hash className="h-5 w-5" />
                            Numbering Schemes
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold">Purchase Orders</h4>
                                <Badge variant="secondary">PO-{new Date().getFullYear()}-0001</Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Prefix:</span> PO-
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Current:</span> 0001
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Min Digits:</span> 4
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Reset:</span> Annual
                                </div>
                              </div>
                            </div>

                            <div className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold">Sales Invoices</h4>
                                <Badge variant="secondary">INV-{new Date().getFullYear()}-0001</Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Prefix:</span> INV-
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Current:</span> 0001
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Min Digits:</span> 4
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Reset:</span> Annual
                                </div>
                              </div>
                            </div>

                            <div className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold">Shipments</h4>
                                <Badge variant="secondary">SHIP-{new Date().getFullYear()}-0001</Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Prefix:</span> SHIP-
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Current:</span> 0001
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Min Digits:</span> 4
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Reset:</span> Annual
                                </div>
                              </div>
                            </div>

                            <Button variant="outline" className="w-full" data-testid="button-reset-counters">
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Reset All Counters for New Year
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Create Snapshot Dialog */}
      {showSnapshotDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Configuration Snapshot</h2>
            <Form {...snapshotForm}>
              <form onSubmit={snapshotForm.handleSubmit((data) => createSnapshotMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={snapshotForm.control as any}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Snapshot Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Pre-Migration Backup" data-testid="input-snapshot-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={snapshotForm.control as any}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe the purpose of this snapshot..." data-testid="textarea-snapshot-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowSnapshotDialog(false)} data-testid="button-cancel-snapshot">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createSnapshotMutation.isPending} data-testid="button-submit-snapshot">
                    {createSnapshotMutation.isPending ? 'Creating...' : 'Create Snapshot'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
