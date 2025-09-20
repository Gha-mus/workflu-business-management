import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { 
  Settings,
  DollarSign,
  Users,
  Warehouse,
  Bell,
  Shield,
  FileText,
  Calculator,
  Globe,
  Clock,
  Archive,
  Key,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Save,
  History,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Copy,
  Database,
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
  Shapes
} from 'lucide-react';

// Zod schemas for forms
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

const userWarehouseScopeSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  warehouseCode: z.string().min(1, 'Warehouse code is required'),
  isActive: z.boolean().default(true),
});

type Setting = {
  id: string;
  key: string;
  value: string;
  description?: string;
  category: string;
  dataType: string;
  isSystemCritical: boolean;
  requiresApproval: boolean;
  isActive: boolean;
  version: number;
  updatedAt: string;
  updatedBy?: string;
};

type NumberingScheme = {
  id: string;
  entityType: string;
  prefix: string;
  currentNumber: number;
  increment: number;
  minDigits: number;
  suffix: string;
  format: string;
  isActive: boolean;
  resetPeriod?: string;
  lastResetAt?: string;
  createdAt: string;
  updatedAt: string;
};

type ConfigurationSnapshot = {
  id: string;
  name: string;
  description?: string;
  snapshotData: any;
  isAutomatic: boolean;
  snapshotType: string;
  createdBy?: string;
  createdAt: string;
};

type UserWarehouseScope = {
  id: string;
  userId: string;
  warehouseCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type EnhancedSettings = {
  financial: {
    exchangeRate: number;
    preventNegativeBalance: boolean;
    approvalThreshold: number;
    currency: string;
    fiscalYearStart: string;
    taxRate: number;
  };
  operational: {
    timezone: string;
    businessAddress: string;
    enableNotifications: boolean;
    autoBackup: boolean;
    maintenanceMode: boolean;
    maxFileSize: number;
    sessionTimeout: number;
  };
  security: {
    passwordPolicy: any;
    twoFactorRequired: boolean;
    sessionSecurity: any;
    auditRetention: number;
    encryptionLevel: string;
  };
  numbering: {
    schemes: NumberingScheme[];
    defaultFormat: string;
    enableAutoGeneration: boolean;
  };
  notification: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    digestFrequency: string;
    priorityThresholds: any;
  };
  user: {
    defaultRole: string;
    selfRegistration: boolean;
    profileSettings: any;
    warehouseScopes: UserWarehouseScope[];
  };
  warehouse: {
    defaultWarehouse: string;
    stockAlertThreshold: number;
    barcodeFormat: string;
    qualityControlRequired: boolean;
  };
  general: {
    companyName: string;
    companyLogo: string;
    language: string;
    dateFormat: string;
    numberFormat: string;
  };
};

const StatusBadge = ({ status, variant = 'secondary' }: { status: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' }) => {
  const colors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  
  return (
    <Badge className={colors[status as keyof typeof colors] || colors.inactive}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  );
};

const CategoryIcon = ({ category }: { category: string }) => {
  const icons = {
    financial: DollarSign,
    operational: Settings,
    security: Shield,
    numbering: Hash,
    notification: Bell,
    user: Users,
    warehouse: Warehouse,
    general: Globe,
  };
  
  const Icon = icons[category as keyof typeof icons] || Settings;
  return <Icon className="h-4 w-4" />;
};

const SettingCard = ({ setting, onEdit }: { setting: Setting; onEdit: (setting: Setting) => void }) => {
  const [showValue, setShowValue] = useState(false);
  
  const getDisplayValue = (value: string, dataType: string) => {
    if (dataType === 'boolean') {
      return value === 'true' ? 'Enabled' : 'Disabled';
    }
    if (dataType === 'number') {
      return parseFloat(value).toLocaleString();
    }
    if (dataType === 'json') {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }
    return value;
  };

  return (
    <Card data-testid={`setting-card-${setting.key}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <CategoryIcon category={setting.category} />
            <h4 className="font-semibold">{setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
            <StatusBadge status={setting.isActive ? 'active' : 'inactive'} />
            {setting.isSystemCritical && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="mr-1 h-2 w-2" />
                Critical
              </Badge>
            )}
            {setting.requiresApproval && (
              <Badge variant="outline" className="text-xs text-orange-600">
                <Shield className="mr-1 h-2 w-2" />
                Approval Required
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              v{setting.version}
            </Badge>
            <Button size="sm" variant="outline" onClick={() => onEdit(setting)} data-testid={`button-edit-${setting.key}`}>
              <Edit className="mr-1 h-3 w-3" />
              Edit
            </Button>
          </div>
        </div>
        
        {setting.description && (
          <p className="text-sm text-muted-foreground mb-2">{setting.description}</p>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Value:</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{setting.dataType}</Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowValue(!showValue)}
                data-testid={`button-toggle-value-${setting.key}`}
              >
                {showValue ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          
          {showValue && (
            <div className="bg-muted p-2 rounded text-sm font-mono">
              {getDisplayValue(setting.value, setting.dataType)}
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Category: {setting.category.toUpperCase()}</span>
            <span>Updated: {new Date(setting.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MetricCard = ({ title, value, change, icon: Icon, color = 'blue' }: {
  title: string;
  value: string | number;
  change?: string;
  icon: any;
  color?: string;
}) => {
  const colorClass = `text-${color}-600`;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </span>
              {change && (
                <span className="text-sm text-muted-foreground">
                  {change}
                </span>
              )}
            </div>
          </div>
          <div className={`p-2 rounded-lg bg-${color}-50 dark:bg-${color}-900/20`}>
            <Icon className={`h-6 w-6 ${colorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function SettingsManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSetting, setSelectedSetting] = useState<Setting | null>(null);
  const [showSettingDialog, setShowSettingDialog] = useState(false);
  const [showSnapshotDialog, setShowSnapshotDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms
  const settingForm = useForm({
    resolver: zodResolver(settingUpdateSchema),
    defaultValues: {
      key: '',
      value: '',
      description: '',
      category: 'general' as const,
      dataType: 'string' as const,
      isSystemCritical: false,
      requiresApproval: false,
      changeReason: '',
    }
  });

  const numberingForm = useForm({
    resolver: zodResolver(numberingSchemeSchema),
    defaultValues: {
      entityType: '',
      prefix: '',
      currentNumber: 0,
      increment: 1,
      minDigits: 4,
      suffix: '',
      format: '{prefix}{number:0{minDigits}}{suffix}',
      resetPeriod: 'never' as const,
    }
  });

  const snapshotForm = useForm({
    resolver: zodResolver(snapshotCreateSchema),
    defaultValues: {
      name: '',
      description: '',
    }
  });

  // Queries
  const { data: enhancedSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/settings'],
    refetchInterval: 30000, // Refresh every 30 seconds
  }) as { data: EnhancedSettings, isLoading: boolean };

  const { data: legacySettings } = useQuery({
    queryKey: ['/api/settings/legacy'],
  }) as { data: any };

  const { data: snapshots = [] } = useQuery({
    queryKey: ['/api/settings/snapshots'],
  }) as { data: ConfigurationSnapshot[] };

  // Mutations
  const updateSettingMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: 'Setting updated successfully!' });
      settingForm.reset();
      setShowSettingDialog(false);
      setSelectedSetting(null);
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update setting', description: error.message, variant: 'destructive' });
    }
  });

  const createSnapshotMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/settings/snapshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: 'Configuration snapshot created successfully!' });
      snapshotForm.reset();
      setShowSnapshotDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create snapshot', description: error.message, variant: 'destructive' });
    }
  });

  const generateNumberMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/settings/numbering/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: (data) => {
      toast({ title: 'Entity number generated successfully!', description: `Generated: ${data.entityNumber}` });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to generate number', description: error.message, variant: 'destructive' });
    }
  });

  const convertCurrencyMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/settings/fx/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: (data) => {
      toast({ 
        title: 'Currency converted successfully!', 
        description: `${data.amountETB} ETB = ${data.amountUSD} USD (Rate: ${data.exchangeRate})`
      });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to convert currency', description: error.message, variant: 'destructive' });
    }
  });

  // Edit setting handler
  const handleEditSetting = (setting: Setting) => {
    setSelectedSetting(setting);
    settingForm.reset({
      key: setting.key,
      value: setting.value,
      description: setting.description || '',
      category: setting.category as any,
      dataType: setting.dataType as any,
      isSystemCritical: setting.isSystemCritical,
      requiresApproval: setting.requiresApproval,
      changeReason: '',
    });
    setShowSettingDialog(true);
  };

  // Get all settings as flat array for searching
  const getAllSettings = (): Setting[] => {
    if (!enhancedSettings) return [];
    
    const settings: Setting[] = [];
    Object.entries(enhancedSettings).forEach(([category, categorySettings]) => {
      if (typeof categorySettings === 'object' && categorySettings !== null) {
        Object.entries(categorySettings).forEach(([key, value]) => {
          settings.push({
            id: `${category}_${key}`,
            key: `${category.toUpperCase()}_${key.toUpperCase()}`,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
            description: `${category} setting for ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
            category,
            dataType: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string',
            isSystemCritical: ['exchangeRate', 'preventNegativeBalance', 'passwordPolicy'].includes(key),
            requiresApproval: ['exchangeRate', 'approvalThreshold', 'passwordPolicy'].includes(key),
            isActive: true,
            version: 1,
            updatedAt: new Date().toISOString(),
            updatedBy: undefined,
          });
        });
      }
    });
    
    return settings;
  };

  // Filter settings
  const filteredSettings = getAllSettings().filter(setting => {
    const matchesSearch = !searchQuery || 
      setting.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      setting.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || setting.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="title-settings-management">Settings Management</h1>
          <p className="text-muted-foreground">Central configuration management for all business stages and system operations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowSnapshotDialog(true)} data-testid="button-create-snapshot">
            <Archive className="mr-2 h-4 w-4" />
            Create Snapshot
          </Button>
          <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="financial" data-testid="tab-financial">Financial</TabsTrigger>
          <TabsTrigger value="operational" data-testid="tab-operational">Operational</TabsTrigger>
          <TabsTrigger value="numbering" data-testid="tab-numbering">Numbering</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
          <TabsTrigger value="snapshots" data-testid="tab-snapshots">Snapshots</TabsTrigger>
          <TabsTrigger value="tools" data-testid="tab-tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Settings"
              value={getAllSettings().length}
              change="Across all categories"
              icon={Settings}
              color="blue"
            />
            <MetricCard
              title="Critical Settings"
              value={getAllSettings().filter(s => s.isSystemCritical).length}
              change="Require careful handling"
              icon={AlertTriangle}
              color="red"
            />
            <MetricCard
              title="Exchange Rate"
              value={`${enhancedSettings?.financial?.exchangeRate || 0} ETB/USD`}
              change="Current rate"
              icon={DollarSign}
              color="green"
            />
            <MetricCard
              title="Configuration Snapshots"
              value={snapshots.length}
              change="Available rollback points"
              icon={Archive}
              color="purple"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-recent-changes">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Setting Changes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getAllSettings().slice(0, 5).map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`recent-change-${setting.key}`}>
                      <div className="space-y-1">
                        <div className="font-medium">{setting.key.replace(/_/g, ' ')}</div>
                        <div className="text-sm text-muted-foreground">
                          {setting.category.toUpperCase()} • Updated {new Date(setting.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={setting.isActive ? 'active' : 'inactive'} />
                        <Badge variant="outline" className="text-xs">v{setting.version}</Badge>
                      </div>
                    </div>
                  ))}
                  
                  {getAllSettings().length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No settings found.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-system-status">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Configuration Service</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Operational
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Exchange Rate Service</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Numbering Service</span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Enabled
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Approval Workflows</span>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      <Shield className="mr-1 h-3 w-3" />
                      Protected
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Snapshot System</span>
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      <Archive className="mr-1 h-3 w-3" />
                      Ready
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Security Level</span>
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      <Lock className="mr-1 h-3 w-3" />
                      High
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card data-testid="card-category-breakdown">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Settings by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(enhancedSettings || {}).map(([category, settings]) => {
                    const count = typeof settings === 'object' && settings !== null ? Object.keys(settings).length : 0;
                    return (
                      <div key={category} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <CategoryIcon category={category} />
                          <span className="text-sm capitalize">{category}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-critical-settings">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Critical Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getAllSettings().filter(s => s.isSystemCritical).slice(0, 5).map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between">
                      <span className="text-sm">{setting.key.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">Critical</Badge>
                        {setting.requiresApproval && (
                          <Badge variant="outline" className="text-xs">Approval</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-quick-actions">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button size="sm" variant="outline" className="w-full justify-start" data-testid="button-test-fx">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Test FX Conversion
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start" data-testid="button-generate-number">
                    <Hash className="mr-2 h-4 w-4" />
                    Generate Test Number
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start" data-testid="button-backup-config">
                    <Archive className="mr-2 h-4 w-4" />
                    Backup Configuration
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start" data-testid="button-view-audit">
                    <History className="mr-2 h-4 w-4" />
                    View Audit Log
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card data-testid="card-financial-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSettings ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading financial settings...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Exchange Rate Management
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Current Rate (ETB/USD):</span>
                          <span className="font-semibold" data-testid="text-current-exchange-rate">
                            {enhancedSettings?.financial?.exchangeRate || 'Not set'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Base Currency:</span>
                          <span className="font-semibold">{enhancedSettings?.financial?.currency || 'USD'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Last Updated:</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date().toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline" data-testid="button-update-exchange-rate">
                          <Edit className="mr-1 h-3 w-3" />
                          Update Rate
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => convertCurrencyMutation.mutate({ amountETB: 1000 })}
                          data-testid="button-test-conversion"
                        >
                          <Calculator className="mr-1 h-3 w-3" />
                          Test Conversion
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Financial Controls
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Prevent Negative Balance:</span>
                          <Switch 
                            checked={enhancedSettings?.financial?.preventNegativeBalance || false}
                            data-testid="switch-prevent-negative-balance"
                          />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Approval Threshold (USD):</span>
                          <span className="font-semibold" data-testid="text-approval-threshold">
                            ${(enhancedSettings?.financial?.approvalThreshold || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Tax Rate (%):</span>
                          <span className="font-semibold">
                            {(enhancedSettings?.financial?.taxRate || 0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Fiscal Configuration
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Fiscal Year Start:</span>
                          <span className="font-semibold">
                            {enhancedSettings?.financial?.fiscalYearStart || 'January 1'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Current Fiscal Period:</span>
                          <span className="font-semibold text-green-600">
                            FY {new Date().getFullYear()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Financial Metrics
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Active Financial Rules:</span>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            5 Active
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Approval Workflows:</span>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Enabled
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Auto-Calculations:</span>
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operational" className="space-y-6">
          <Card data-testid="card-operational-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Operational Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      System Locale
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Timezone:</span>
                        <span className="font-semibold" data-testid="text-system-timezone">
                          {enhancedSettings?.operational?.timezone || 'UTC'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Language:</span>
                        <span className="font-semibold">
                          {enhancedSettings?.general?.language || 'English'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Date Format:</span>
                        <span className="font-semibold">
                          {enhancedSettings?.general?.dateFormat || 'MM/DD/YYYY'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Notification Settings
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Email Notifications:</span>
                        <Switch 
                          checked={enhancedSettings?.notification?.emailEnabled || false}
                          data-testid="switch-email-notifications"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">SMS Notifications:</span>
                        <Switch 
                          checked={enhancedSettings?.notification?.smsEnabled || false}
                          data-testid="switch-sms-notifications"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Push Notifications:</span>
                        <Switch 
                          checked={enhancedSettings?.notification?.pushEnabled || false}
                          data-testid="switch-push-notifications"
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Digest Frequency:</span>
                        <span className="font-semibold">
                          {enhancedSettings?.notification?.digestFrequency || 'Daily'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      System Configuration
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto Backup:</span>
                        <Switch 
                          checked={enhancedSettings?.operational?.autoBackup || false}
                          data-testid="switch-auto-backup"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Maintenance Mode:</span>
                        <Switch 
                          checked={enhancedSettings?.operational?.maintenanceMode || false}
                          data-testid="switch-maintenance-mode"
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Max File Size:</span>
                        <span className="font-semibold" data-testid="text-max-file-size">
                          {(enhancedSettings?.operational?.maxFileSize || 0) / 1024 / 1024} MB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Session Timeout:</span>
                        <span className="font-semibold">
                          {(enhancedSettings?.operational?.sessionTimeout || 0) / 60} minutes
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Company Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Company Name:</span>
                        <span className="font-semibold" data-testid="text-company-name">
                          {enhancedSettings?.general?.companyName || 'WorkFlu Enterprise'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Business Address:</span>
                        <span className="font-semibold text-right text-sm">
                          {enhancedSettings?.operational?.businessAddress || 'Not configured'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="numbering" className="space-y-6">
          <Card data-testid="card-numbering-schemes">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Entity Numbering Schemes
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" data-testid="button-add-numbering-scheme">
                  <Plus className="mr-1 h-3 w-3" />
                  Add Scheme
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => generateNumberMutation.mutate({ entityType: 'order', prefix: 'ORD' })}
                  data-testid="button-test-generation"
                >
                  <Calculator className="mr-1 h-3 w-3" />
                  Test Generation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enhancedSettings?.numbering?.schemes?.length > 0 ? (
                  enhancedSettings.numbering.schemes.map((scheme) => (
                    <div key={scheme.id} className="border rounded-lg p-4" data-testid={`numbering-scheme-${scheme.entityType}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{scheme.entityType.replace('_', ' ').toUpperCase()}</h4>
                          <p className="text-sm text-muted-foreground">
                            Format: {scheme.format} | Current: {scheme.currentNumber}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={scheme.isActive ? 'active' : 'inactive'} />
                          <Button size="sm" variant="outline" data-testid={`button-edit-scheme-${scheme.entityType}`}>
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Prefix:</span>
                          <div>{scheme.prefix || 'None'}</div>
                        </div>
                        <div>
                          <span className="font-medium">Suffix:</span>
                          <div>{scheme.suffix || 'None'}</div>
                        </div>
                        <div>
                          <span className="font-medium">Min Digits:</span>
                          <div>{scheme.minDigits}</div>
                        </div>
                        <div>
                          <span className="font-medium">Reset Period:</span>
                          <div className="capitalize">{scheme.resetPeriod || 'Never'}</div>
                        </div>
                      </div>
                      
                      {scheme.lastResetAt && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Last reset: {new Date(scheme.lastResetAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Hash className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No numbering schemes configured</p>
                    <p>Add numbering schemes to automatically generate entity numbers.</p>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Numbering Configuration</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Auto Generation:</span>
                      <Switch 
                        checked={enhancedSettings?.numbering?.enableAutoGeneration || false}
                        data-testid="switch-auto-generation"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Default Format:</span>
                      <span className="font-semibold font-mono text-sm">
                        {enhancedSettings?.numbering?.defaultFormat || '{prefix}{number:04d}{suffix}'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Supported Entity Types</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {['order', 'purchase', 'capital_entry', 'shipment', 'invoice', 'receipt'].map((type) => (
                      <div key={type} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card data-testid="card-user-management">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      User Policies
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Self Registration:</span>
                        <Switch 
                          checked={enhancedSettings?.user?.selfRegistration || false}
                          data-testid="switch-self-registration"
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Default Role:</span>
                        <span className="font-semibold" data-testid="text-default-role">
                          {enhancedSettings?.user?.defaultRole || 'worker'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Two-Factor Required:</span>
                        <Switch 
                          checked={enhancedSettings?.security?.twoFactorRequired || false}
                          data-testid="switch-two-factor"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Warehouse className="h-4 w-4" />
                      Warehouse Scopes
                    </h4>
                    <div className="space-y-2">
                      {enhancedSettings?.user?.warehouseScopes?.length > 0 ? (
                        enhancedSettings.user.warehouseScopes.slice(0, 3).map((scope, index) => (
                          <div key={scope.id} className="flex justify-between items-center text-sm" data-testid={`warehouse-scope-${index}`}>
                            <span>{scope.warehouseCode}</span>
                            <StatusBadge status={scope.isActive ? 'active' : 'inactive'} />
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No warehouse scopes configured</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Security Settings
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Encryption Level:</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {enhancedSettings?.security?.encryptionLevel || 'AES-256'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Audit Retention:</span>
                        <span className="font-semibold">
                          {enhancedSettings?.security?.auditRetention || 365} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Password Policy:</span>
                        <Badge variant="outline">Enforced</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      User Activity
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Active Sessions:</span>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          5 Active
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Failed Logins (24h):</span>
                        <Badge variant="outline">2</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Role Changes (30d):</span>
                        <Badge variant="outline">0</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="snapshots" className="space-y-6">
          <Card data-testid="card-configuration-snapshots">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Configuration Snapshots
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setShowSnapshotDialog(true)} data-testid="button-create-snapshot-manual">
                  <Plus className="mr-1 h-3 w-3" />
                  Create Snapshot
                </Button>
                <Button size="sm" variant="outline" data-testid="button-schedule-snapshot">
                  <Clock className="mr-1 h-3 w-3" />
                  Schedule Auto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {snapshots.length > 0 ? (
                  snapshots.map((snapshot) => (
                    <div key={snapshot.id} className="border rounded-lg p-4" data-testid={`snapshot-item-${snapshot.id}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{snapshot.name}</h4>
                          {snapshot.description && (
                            <p className="text-sm text-muted-foreground">{snapshot.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={snapshot.isAutomatic ? 'automatic' : 'manual'} />
                          <Badge variant="outline" className="text-xs">{snapshot.snapshotType}</Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Created: {new Date(snapshot.createdAt).toLocaleString()}
                          {snapshot.createdBy && ` by ${snapshot.createdBy}`}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" data-testid={`button-restore-${snapshot.id}`}>
                            <RotateCcw className="mr-1 h-3 w-3" />
                            Restore
                          </Button>
                          <Button size="sm" variant="outline" data-testid={`button-download-${snapshot.id}`}>
                            <Download className="mr-1 h-3 w-3" />
                            Download
                          </Button>
                          <Button size="sm" variant="outline" data-testid={`button-delete-${snapshot.id}`}>
                            <Trash2 className="mr-1 h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Archive className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No snapshots available</p>
                    <p>Create configuration snapshots to enable system rollback capabilities.</p>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Snapshot Statistics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Snapshots:</span>
                      <span className="font-semibold" data-testid="text-total-snapshots">{snapshots.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Automatic Snapshots:</span>
                      <span className="font-semibold">{snapshots.filter(s => s.isAutomatic).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Manual Snapshots:</span>
                      <span className="font-semibold">{snapshots.filter(s => !s.isAutomatic).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Latest Snapshot:</span>
                      <span className="font-semibold">
                        {snapshots.length > 0 
                          ? new Date(Math.max(...snapshots.map(s => new Date(s.createdAt).getTime()))).toLocaleDateString()
                          : 'None'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Backup Policies</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto Snapshots:</span>
                      <Switch checked={true} data-testid="switch-auto-snapshots" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Retention Period:</span>
                      <span className="font-semibold">30 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Snapshot Frequency:</span>
                      <span className="font-semibold">Daily</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Max Snapshots:</span>
                      <span className="font-semibold">50</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card data-testid="card-testing-tools">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Testing & Validation Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Currency Conversion Test</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Test the central FX conversion service used across all stages.
                    </p>
                    <div className="flex gap-2">
                      <Input placeholder="Amount in ETB" className="flex-1" data-testid="input-test-amount" />
                      <Button 
                        onClick={() => convertCurrencyMutation.mutate({ amountETB: 1000 })}
                        data-testid="button-test-fx-conversion"
                      >
                        Convert
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Number Generation Test</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Test entity number generation with different schemes.
                    </p>
                    <div className="flex gap-2">
                      <Select>
                        <SelectTrigger className="flex-1" data-testid="select-entity-type">
                          <SelectValue placeholder="Entity type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="order">Order</SelectItem>
                          <SelectItem value="purchase">Purchase</SelectItem>
                          <SelectItem value="invoice">Invoice</SelectItem>
                          <SelectItem value="receipt">Receipt</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={() => generateNumberMutation.mutate({ entityType: 'order' })}
                        data-testid="button-test-number-generation"
                      >
                        Generate
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Configuration Validation</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Validate all configuration settings and dependencies.
                    </p>
                    <Button className="w-full" data-testid="button-validate-config">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Validate All Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-maintenance-tools">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Maintenance & Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Configuration Backup</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Create a complete backup of all configuration settings.
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={() => setShowSnapshotDialog(true)}
                      data-testid="button-create-backup"
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Create Backup
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Reset Numbering Counters</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Reset numbering counters for new fiscal year or period.
                    </p>
                    <Button variant="outline" className="w-full" data-testid="button-reset-counters">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset Counters
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

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Export Configuration</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Export all settings in various formats for backup or migration.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" data-testid="button-export-json">
                        JSON
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" data-testid="button-export-csv">
                        CSV
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" data-testid="button-export-xlsx">
                        XLSX
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-advanced-tools">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Advanced Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Bulk Operations</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-bulk-update">
                      <Edit className="mr-2 h-4 w-4" />
                      Bulk Update Settings
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-import-config">
                      <Upload className="mr-2 h-4 w-4" />
                      Import Configuration
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-migrate-settings">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Migrate Settings
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Security Operations</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" data-testid="button-rotate-keys">
                      <Key className="mr-2 h-4 w-4" />
                      Rotate Security Keys
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-audit-access">
                      <Shield className="mr-2 h-4 w-4" />
                      Audit Access Logs
                    </Button>
                    <Button variant="outline" className="w-full justify-start" data-testid="button-security-scan">
                      <Activity className="mr-2 h-4 w-4" />
                      Security Scan
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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