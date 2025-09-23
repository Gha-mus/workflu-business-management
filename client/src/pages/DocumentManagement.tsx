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
import { BackButton } from '@/components/ui/back-button';
import { 
  FileText,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Calendar,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Plus,
  Share,
  Archive,
  History,
  UserCheck,
  Tag,
  Building,
  Users,
  Package,
  Truck,
  DollarSign,
  Settings,
  Key,
  Lock,
  Unlock,
  Star,
  BookOpen,
  Globe,
  Bell,
  Target,
  Activity,
  BarChart3,
  PieChart,
  TrendingUp,
  Zap,
  Monitor,
  Database,
  FolderOpen,
  FileCheck,
  FilePlus,
  FileX,
  Paperclip,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';

// Zod schemas for forms
const documentUploadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['contract', 'invoice', 'certificate', 'license', 'policy', 'procedure', 'manual', 'specification', 'report', 'correspondence', 'legal', 'financial', 'operational', 'compliance', 'quality', 'safety', 'hr', 'technical', 'marketing', 'other']),
  subCategory: z.string().optional(),
  accessLevel: z.enum(['public', 'internal', 'confidential', 'restricted']).default('internal'),
  tags: z.string().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().optional(),
  requiresCompliance: z.boolean().default(false),
  complianceType: z.string().optional(),
  documentDate: z.string().optional(),
  expiryDate: z.string().optional(),
  effectiveDate: z.string().optional(),
  reminderDate: z.string().optional(),
});

const documentUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['contract', 'invoice', 'certificate', 'license', 'policy', 'procedure', 'manual', 'specification', 'report', 'correspondence', 'legal', 'financial', 'operational', 'compliance', 'quality', 'safety', 'hr', 'technical', 'marketing', 'other']),
  subCategory: z.string().optional(),
  accessLevel: z.enum(['public', 'internal', 'confidential', 'restricted']),
  tags: z.string().optional(),
  status: z.enum(['draft', 'under_review', 'approved', 'active', 'archived', 'expired']),
  requiresCompliance: z.boolean(),
  complianceType: z.string().optional(),
  documentDate: z.string().optional(),
  expiryDate: z.string().optional(),
  effectiveDate: z.string().optional(),
  reminderDate: z.string().optional(),
});

const complianceUpdateSchema = z.object({
  requirementType: z.enum(['regulatory', 'certification', 'internal_policy', 'legal']),
  requirementName: z.string().min(1, 'Requirement name is required'),
  requirementDescription: z.string().optional(),
  regulatoryBody: z.string().optional(),
  status: z.enum(['pending_review', 'compliant', 'non_compliant', 'expired', 'under_review']),
  complianceDate: z.string().optional(),
  expiryDate: z.string().optional(),
  renewalDate: z.string().optional(),
  complianceLevel: z.enum(['full', 'partial', 'conditional']).optional(),
  certificateNumber: z.string().optional(),
  issuingAuthority: z.string().optional(),
  validationMethod: z.enum(['self_attestation', 'third_party', 'audit']).optional(),
  autoRenewal: z.boolean().default(false),
  reminderDaysBefore: z.number().default(30),
});

type Document = {
  id: string;
  documentNumber: string;
  title: string;
  description?: string;
  category: string;
  subCategory?: string;
  status: string;
  accessLevel: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  checksum: string;
  documentDate?: string;
  expiryDate?: string;
  effectiveDate?: string;
  reminderDate?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  currentVersion: number;
  isLatestVersion: boolean;
  tags?: string[];
  requiresCompliance: boolean;
  complianceType?: string;
  encryptionStatus: string;
  passwordProtected: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type DocumentVersion = {
  id: string;
  documentId: string;
  version: number;
  versionLabel?: string;
  fileName: string;
  filePath: string;
  contentType: string;
  fileSize: number;
  checksum: string;
  changeDescription?: string;
  changeReason?: string;
  changeType: string;
  approvalRequired: boolean;
  isApproved: boolean;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  approvedAt?: string;
};

type DocumentCompliance = {
  id: string;
  documentId: string;
  requirementType: string;
  requirementName: string;
  requirementDescription?: string;
  regulatoryBody?: string;
  status: string;
  complianceDate?: string;
  expiryDate?: string;
  renewalDate?: string;
  complianceLevel?: string;
  certificateNumber?: string;
  issuingAuthority?: string;
  validationMethod?: string;
  autoRenewal: boolean;
  reminderDaysBefore: number;
  lastReminderSent?: string;
  nextReminderDate?: string;
  createdAt: string;
  updatedAt: string;
};

type DocumentStatistics = {
  totalDocuments: number;
  activeDocuments: number;
  expiredDocuments: number;
  complianceDocuments: number;
  pendingApprovals: number;
  documentsByCategory: Record<string, number>;
  documentsByStatus: Record<string, number>;
  recentUploads: number;
  storageUsed: number;
  averageProcessingTime: number;
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    under_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    archived: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    compliant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    non_compliant: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  
  return (
    <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  );
};

const AccessLevelBadge = ({ level }: { level: string }) => {
  const colors = {
    public: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    internal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    confidential: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    restricted: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  
  const icons = {
    public: Globe,
    internal: Building,
    confidential: Lock,
    restricted: Shield,
  };
  
  const Icon = icons[level as keyof typeof icons] || Shield;
  
  return (
    <Badge className={colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}>
      <Icon className="mr-1 h-3 w-3" />
      {level.toUpperCase()}
    </Badge>
  );
};

const DocumentMetricCard = ({ title, value, change, icon: Icon, color = 'blue' }: {
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

export default function DocumentManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all-categories');
  const [selectedStatus, setSelectedStatus] = useState('all-status');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('all-access-levels');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showComplianceDialog, setShowComplianceDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms
  const uploadForm = useForm({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'other' as const,
      subCategory: '',
      accessLevel: 'internal' as const,
      tags: '',
      relatedEntityType: '',
      relatedEntityId: '',
      requiresCompliance: false,
      complianceType: '',
      documentDate: '',
      expiryDate: '',
      effectiveDate: '',
      reminderDate: '',
    }
  });

  const updateForm = useForm({
    resolver: zodResolver(documentUpdateSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'other' as const,
      subCategory: '',
      accessLevel: 'internal' as const,
      tags: '',
      status: 'draft' as const,
      requiresCompliance: false,
      complianceType: '',
      documentDate: '',
      expiryDate: '',
      effectiveDate: '',
      reminderDate: '',
    }
  });

  const complianceForm = useForm({
    resolver: zodResolver(complianceUpdateSchema),
    defaultValues: {
      requirementType: 'regulatory' as const,
      requirementName: '',
      requirementDescription: '',
      regulatoryBody: '',
      status: 'pending_review' as const,
      complianceDate: '',
      expiryDate: '',
      renewalDate: '',
      complianceLevel: 'full' as const,
      certificateNumber: '',
      issuingAuthority: '',
      validationMethod: 'self_attestation' as const,
      autoRenewal: false,
      reminderDaysBefore: 30,
    }
  });

  // Queries
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['/api/documents', { 
      search: searchQuery, 
      category: selectedCategory, 
      status: selectedStatus, 
      accessLevel: selectedAccessLevel 
    }],
    refetchInterval: 30000, // Refresh every 30 seconds
  }) as { data: Document[], isLoading: boolean };

  const { data: documentStats } = useQuery({
    queryKey: ['/api/documents/statistics'],
  }) as { data: DocumentStatistics };

  const { data: complianceDashboard } = useQuery({
    queryKey: ['/api/compliance/dashboard'],
  }) as { data: any };

  const { data: expiringDocuments } = useQuery({
    queryKey: ['/api/compliance/expiring'],
  }) as { data: any[] };

  const { data: documentVersions = [] } = useQuery({
    queryKey: ['/api/documents', selectedDocument?.id, 'versions'],
    enabled: !!selectedDocument?.id,
  }) as { data: DocumentVersion[] };

  const { data: documentCompliance = [] } = useQuery({
    queryKey: ['/api/documents', selectedDocument?.id, 'compliance'],
    enabled: !!selectedDocument?.id && selectedDocument?.requiresCompliance,
  }) as { data: DocumentCompliance[] };

  // Mutations
  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      Object.keys(data).forEach(key => {
        if (data[key] !== '' && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });

      return fetch('/api/documents/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({ title: 'Document uploaded successfully!' });
      uploadForm.reset();
      setSelectedFile(null);
      setShowUploadDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to upload document', description: error.message, variant: 'destructive' });
    }
  });

  const updateDocumentMutation = useMutation({
    mutationFn: (data: any) => fetch(`/api/documents/${selectedDocument?.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: 'Document updated successfully!' });
      updateForm.reset();
      setShowEditDialog(false);
      setSelectedDocument(null);
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update document', description: error.message, variant: 'destructive' });
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/documents/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: 'Document deleted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to delete document', description: error.message, variant: 'destructive' });
    }
  });

  const updateComplianceMutation = useMutation({
    mutationFn: (data: any) => fetch(`/api/documents/${selectedDocument?.id}/compliance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      toast({ title: 'Compliance information updated successfully!' });
      complianceForm.reset();
      setShowComplianceDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update compliance', description: error.message, variant: 'destructive' });
    }
  });

  // Edit document handler
  const handleEditDocument = (document: Document) => {
    setSelectedDocument(document);
    updateForm.reset({
      title: document.title,
      description: document.description || '',
      category: document.category as any,
      subCategory: document.subCategory || '',
      accessLevel: document.accessLevel as any,
      tags: document.tags?.join(', ') || '',
      status: document.status as any,
      requiresCompliance: document.requiresCompliance,
      complianceType: document.complianceType || '',
      documentDate: document.documentDate || '',
      expiryDate: document.expiryDate || '',
      effectiveDate: document.effectiveDate || '',
      reminderDate: document.reminderDate || '',
    });
    setShowEditDialog(true);
  };

  // Download document handler
  const handleDownloadDocument = (document: Document) => {
    const link = document.createElement('a');
    link.href = `/api/documents/${document.id}/download`;
    link.download = document.originalFileName;
    link.click();
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all-categories' || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all-status' || doc.status === selectedStatus;
    const matchesAccessLevel = selectedAccessLevel === 'all-access-levels' || doc.accessLevel === selectedAccessLevel;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesAccessLevel;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-start gap-4">
          <BackButton to="/" text="Back to Dashboard" mobileIconOnly={true} />
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="title-document-management">Document Management</h1>
            <p className="text-muted-foreground">Comprehensive document storage, version control, compliance tracking, and lifecycle management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowUploadDialog(true)} data-testid="button-upload-document">
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
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
          <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
          <TabsTrigger value="versions" data-testid="tab-versions">Versions</TabsTrigger>
          <TabsTrigger value="compliance" data-testid="tab-compliance">Compliance</TabsTrigger>
          <TabsTrigger value="workflow" data-testid="tab-workflow">Workflow</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DocumentMetricCard
              title="Total Documents"
              value={documentStats?.totalDocuments || 0}
              change={`${documentStats?.recentUploads || 0} this month`}
              icon={FileText}
              color="blue"
            />
            <DocumentMetricCard
              title="Active Documents"
              value={documentStats?.activeDocuments || 0}
              change={`${((documentStats?.activeDocuments || 0) / Math.max(documentStats?.totalDocuments || 1, 1) * 100).toFixed(1)}% of total`}
              icon={FileCheck}
              color="green"
            />
            <DocumentMetricCard
              title="Compliance Items"
              value={documentStats?.complianceDocuments || 0}
              change={`${expiringDocuments?.length || 0} expiring soon`}
              icon={Shield}
              color="orange"
            />
            <DocumentMetricCard
              title="Pending Approvals"
              value={documentStats?.pendingApprovals || 0}
              change="Requires action"
              icon={Clock}
              color="red"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-recent-documents">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.slice(0, 5).map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`recent-document-${document.id}`}>
                      <div className="space-y-1">
                        <div className="font-medium">{document.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {document.category.replace('_', ' ').toUpperCase()} • {new Date(document.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={document.status} />
                        <AccessLevelBadge level={document.accessLevel} />
                      </div>
                    </div>
                  ))}
                  
                  {documents.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No documents found.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-compliance-alerts">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Compliance Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expiringDocuments?.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-900/10" data-testid={`compliance-alert-${index}`}>
                      <div className="space-y-1">
                        <div className="font-medium">{item.title || `Document ${index + 1}`}</div>
                        <div className="text-sm text-muted-foreground">
                          Expires: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'Not set'}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        {item.daysUntilExpiry || 0} days
                      </Badge>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                      <p>All compliance items are current.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card data-testid="card-document-categories">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Document Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(documentStats?.documentsByCategory || {}).slice(0, 5).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{category.replace('_', ' ')}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                  
                  {Object.keys(documentStats?.documentsByCategory || {}).length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No categories found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-document-status">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Document Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(documentStats?.documentsByStatus || {}).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-storage-info">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Storage Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Storage Used</span>
                    <span className="font-semibold">{((documentStats?.storageUsed || 0) / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average File Size</span>
                    <span className="font-semibold">
                      {documentStats?.totalDocuments 
                        ? ((documentStats.storageUsed / documentStats.totalDocuments) / 1024).toFixed(2) + ' KB'
                        : '0 KB'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Processing Time</span>
                    <span className="font-semibold">{documentStats?.averageProcessingTime || 0}s avg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Document Library
              </CardTitle>
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-documents"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48" data-testid="select-category-filter">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-categories">All Categories</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="certificate">Certificate</SelectItem>
                    <SelectItem value="license">License</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="procedure">Procedure</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="specification">Specification</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="correspondence">Correspondence</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48" data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-status">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedAccessLevel} onValueChange={setSelectedAccessLevel}>
                  <SelectTrigger className="w-48" data-testid="select-access-filter">
                    <SelectValue placeholder="Filter by access" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-access-levels">All Access Levels</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingDocuments ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading documents...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDocuments.map((document) => (
                    <div key={document.id} className="border rounded-lg p-4 space-y-3" data-testid={`document-item-${document.id}`}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{document.title}</h3>
                            <Badge variant="outline">{document.documentNumber}</Badge>
                            <StatusBadge status={document.status} />
                            <AccessLevelBadge level={document.accessLevel} />
                            {document.requiresCompliance && (
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                <Shield className="mr-1 h-3 w-3" />
                                Compliance
                              </Badge>
                            )}
                          </div>
                          {document.description && (
                            <p className="text-sm text-muted-foreground">{document.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>📁 {document.category.replace('_', ' ').toUpperCase()}</span>
                            <span>📄 {document.originalFileName}</span>
                            <span>📏 {(document.fileSize / 1024).toFixed(2)} KB</span>
                            <span>🕒 {new Date(document.createdAt).toLocaleDateString()}</span>
                            {document.expiryDate && (
                              <span className="text-orange-600">
                                ⏰ Expires: {new Date(document.expiryDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {document.tags && document.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {document.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  <Tag className="mr-1 h-2 w-2" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button size="sm" variant="outline" onClick={() => handleDownloadDocument(document)} data-testid={`button-download-${document.id}`}>
                            <Download className="mr-1 h-3 w-3" />
                            Download
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setSelectedDocument(document)} data-testid={`button-view-${document.id}`}>
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditDocument(document)} data-testid={`button-edit-${document.id}`}>
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => deleteDocumentMutation.mutate(document.id)} data-testid={`button-delete-${document.id}`}>
                            <Trash2 className="mr-1 h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                      
                      {document.relatedEntityType && document.relatedEntityId && (
                        <div className="pt-2 border-t">
                          <div className="text-sm text-muted-foreground">
                            <strong>Related to:</strong> {document.relatedEntityType.replace('_', ' ').toUpperCase()} ({document.relatedEntityId})
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {filteredDocuments.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No documents found</p>
                      <p>Try adjusting your search criteria or upload a new document.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="space-y-6">
          {selectedDocument ? (
            <Card data-testid="card-document-versions">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Version History - {selectedDocument.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documentVersions.map((version) => (
                    <div key={version.id} className="border rounded-lg p-4" data-testid={`version-item-${version.id}`}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="default">v{version.version}</Badge>
                            {version.versionLabel && (
                              <Badge variant="outline">{version.versionLabel}</Badge>
                            )}
                            {version.isApproved ? (
                              <Badge variant="secondary" className="text-green-600">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Approved
                              </Badge>
                            ) : version.approvalRequired ? (
                              <Badge variant="secondary" className="text-yellow-600">
                                <Clock className="mr-1 h-3 w-3" />
                                Pending Approval
                              </Badge>
                            ) : null}
                          </div>
                          
                          {version.changeDescription && (
                            <p className="text-sm font-medium">{version.changeDescription}</p>
                          )}
                          
                          {version.changeReason && (
                            <p className="text-sm text-muted-foreground">{version.changeReason}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>📄 {version.fileName}</span>
                            <span>📏 {(version.fileSize / 1024).toFixed(2)} KB</span>
                            <span>👤 {version.createdBy}</span>
                            <span>🕒 {new Date(version.createdAt).toLocaleDateString()}</span>
                            {version.approvedAt && (
                              <span>✅ Approved: {new Date(version.approvedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" data-testid={`button-download-version-${version.id}`}>
                            <Download className="mr-1 h-3 w-3" />
                            Download
                          </Button>
                          {version.approvalRequired && !version.isApproved && (
                            <Button size="sm" variant="outline" data-testid={`button-approve-version-${version.id}`}>
                              <UserCheck className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {documentVersions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No version history available.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <History className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a document to view version history</p>
                  <p>Go to the Documents tab and click "View" on any document.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DocumentMetricCard
              title="Compliance Score"
              value={`${complianceDashboard?.overallScore || 0}%`}
              change={complianceDashboard?.overallScore >= 90 ? 'Excellent' : 'Needs attention'}
              icon={Shield}
              color="green"
            />
            <DocumentMetricCard
              title="Expiring Documents"
              value={expiringDocuments?.length || 0}
              change="Next 30 days"
              icon={AlertTriangle}
              color="orange"
            />
            <DocumentMetricCard
              title="Compliant Items"
              value={complianceDashboard?.compliantItems || 0}
              change="Active compliance"
              icon={CheckCircle}
              color="blue"
            />
            <DocumentMetricCard
              title="Non-Compliant"
              value={complianceDashboard?.nonCompliantItems || 0}
              change="Requires action"
              icon={FileX}
              color="red"
            />
          </div>

          {selectedDocument && selectedDocument.requiresCompliance && (
            <Card data-testid="card-document-compliance">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Compliance Details - {selectedDocument.title}
                </CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setShowComplianceDialog(true)} data-testid="button-update-compliance">
                    <Plus className="mr-1 h-3 w-3" />
                    Update Compliance
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documentCompliance.map((compliance) => (
                    <div key={compliance.id} className="border rounded-lg p-4 space-y-3" data-testid={`compliance-item-${compliance.id}`}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{compliance.requirementName}</h4>
                            <StatusBadge status={compliance.status} />
                            <Badge variant="outline">{compliance.requirementType.replace('_', ' ').toUpperCase()}</Badge>
                          </div>
                          
                          {compliance.requirementDescription && (
                            <p className="text-sm text-muted-foreground">{compliance.requirementDescription}</p>
                          )}
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {compliance.complianceDate && (
                              <div>
                                <span className="font-medium">Compliance Date:</span>
                                <div>{new Date(compliance.complianceDate).toLocaleDateString()}</div>
                              </div>
                            )}
                            {compliance.expiryDate && (
                              <div>
                                <span className="font-medium">Expiry Date:</span>
                                <div className={new Date(compliance.expiryDate) < new Date() ? 'text-red-600' : ''}>
                                  {new Date(compliance.expiryDate).toLocaleDateString()}
                                </div>
                              </div>
                            )}
                            {compliance.renewalDate && (
                              <div>
                                <span className="font-medium">Renewal Date:</span>
                                <div>{new Date(compliance.renewalDate).toLocaleDateString()}</div>
                              </div>
                            )}
                            {compliance.certificateNumber && (
                              <div>
                                <span className="font-medium">Certificate #:</span>
                                <div>{compliance.certificateNumber}</div>
                              </div>
                            )}
                          </div>
                          
                          {compliance.issuingAuthority && (
                            <div className="text-sm">
                              <span className="font-medium">Issuing Authority:</span> {compliance.issuingAuthority}
                            </div>
                          )}
                          
                          {compliance.regulatoryBody && (
                            <div className="text-sm">
                              <span className="font-medium">Regulatory Body:</span> {compliance.regulatoryBody}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {compliance.autoRenewal && (
                            <Badge variant="secondary" className="text-blue-600">
                              <RefreshCw className="mr-1 h-3 w-3" />
                              Auto-Renewal
                            </Badge>
                          )}
                          {compliance.complianceLevel && (
                            <Badge variant="outline">
                              {compliance.complianceLevel.replace('_', ' ').toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {documentCompliance.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No compliance information available.</p>
                      <Button 
                        size="sm" 
                        className="mt-2" 
                        onClick={() => setShowComplianceDialog(true)}
                        data-testid="button-add-compliance"
                      >
                        Add Compliance Information
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {(!selectedDocument || !selectedDocument.requiresCompliance) && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a compliance document</p>
                  <p>Go to the Documents tab and select a document that requires compliance tracking.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="workflow" className="space-y-6">
          <Card data-testid="card-workflow-overview">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Document Workflow Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-3xl font-bold text-blue-600" data-testid="text-pending-workflows">
                    {documentStats?.pendingApprovals || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Approvals</div>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-3xl font-bold text-green-600" data-testid="text-completed-workflows">
                    {(documentStats?.totalDocuments || 0) - (documentStats?.pendingApprovals || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed Workflows</div>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-3xl font-bold text-orange-600" data-testid="text-avg-processing-time">
                    {documentStats?.averageProcessingTime || 0}s
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Processing Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-workflow-stages">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Workflow Stages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FilePlus className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold">Draft</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Document creation and initial review</p>
                    <div className="mt-2">
                      <Badge variant="secondary">{documentStats?.documentsByStatus?.draft || 0} documents</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <h4 className="font-semibold">Under Review</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Approval process and content validation</p>
                    <div className="mt-2">
                      <Badge variant="secondary">{documentStats?.documentsByStatus?.under_review || 0} documents</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold">Approved</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Approved and ready for use</p>
                    <div className="mt-2">
                      <Badge variant="secondary">{documentStats?.documentsByStatus?.approved || 0} documents</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Archive className="h-5 w-5 text-gray-600" />
                      <h4 className="font-semibold">Archived</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Archived and historical documents</p>
                    <div className="mt-2">
                      <Badge variant="secondary">{documentStats?.documentsByStatus?.archived || 0} documents</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DocumentMetricCard
              title="Upload Trend"
              value={documentStats?.recentUploads || 0}
              change="This month"
              icon={TrendingUp}
              color="blue"
            />
            <DocumentMetricCard
              title="Access Rate"
              value="92.5%"
              change="Documents accessed"
              icon={Activity}
              color="green"
            />
            <DocumentMetricCard
              title="Compliance Rate"
              value={`${complianceDashboard?.overallScore || 0}%`}
              change="Overall compliance"
              icon={Target}
              color="orange"
            />
            <DocumentMetricCard
              title="Storage Growth"
              value={`${((documentStats?.storageUsed || 0) / 1024 / 1024).toFixed(1)}MB`}
              change="+5.2% this month"
              icon={Database}
              color="purple"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-category-distribution">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Category Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(documentStats?.documentsByCategory || {}).map(([category, count], index) => {
                    const total = Object.values(documentStats?.documentsByCategory || {}).reduce((a, b) => a + b, 1);
                    const percentage = ((count as number) / total) * 100;
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm capitalize">{category.replace('_', ' ')}</span>
                          <span className="text-sm font-medium">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-access-analytics">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Access Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 border rounded">
                      <div className="text-2xl font-bold text-blue-600">{documents.filter(d => d.accessLevel === 'public').length}</div>
                      <div className="text-sm text-muted-foreground">Public Documents</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-2xl font-bold text-green-600">{documents.filter(d => d.accessLevel === 'internal').length}</div>
                      <div className="text-sm text-muted-foreground">Internal Documents</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-2xl font-bold text-orange-600">{documents.filter(d => d.accessLevel === 'confidential').length}</div>
                      <div className="text-sm text-muted-foreground">Confidential Documents</div>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="text-2xl font-bold text-red-600">{documents.filter(d => d.accessLevel === 'restricted').length}</div>
                      <div className="text-sm text-muted-foreground">Restricted Documents</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-performance-metrics">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold">Document Health</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Active Documents</span>
                      <span className="font-medium">{((documentStats?.activeDocuments || 0) / Math.max(documentStats?.totalDocuments || 1, 1) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Expired Documents</span>
                      <span className="font-medium text-red-600">{((documentStats?.expiredDocuments || 0) / Math.max(documentStats?.totalDocuments || 1, 1) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Compliance Coverage</span>
                      <span className="font-medium text-green-600">{((documentStats?.complianceDocuments || 0) / Math.max(documentStats?.totalDocuments || 1, 1) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Workflow Efficiency</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Approval Rate</span>
                      <span className="font-medium">{(100 - (documentStats?.pendingApprovals || 0) / Math.max(documentStats?.totalDocuments || 1, 1) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Processing Time</span>
                      <span className="font-medium">{documentStats?.averageProcessingTime || 0}s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Version Control Usage</span>
                      <span className="font-medium">85%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Storage Metrics</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Total Storage</span>
                      <span className="font-medium">{((documentStats?.storageUsed || 0) / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg File Size</span>
                      <span className="font-medium">
                        {documentStats?.totalDocuments 
                          ? ((documentStats.storageUsed / documentStats.totalDocuments) / 1024).toFixed(2) + ' KB'
                          : '0 KB'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Growth Rate</span>
                      <span className="font-medium text-green-600">+5.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card data-testid="card-document-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Document Management Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Storage Settings</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Maximum file size</span>
                        <Badge variant="secondary">10 MB</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Allowed file types</span>
                        <Badge variant="secondary">PDF, DOC, XLSX, TXT</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Auto-versioning</span>
                        <Badge variant="secondary" className="text-green-600">Enabled</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Encryption</span>
                        <Badge variant="secondary" className="text-blue-600">AES-256</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Compliance Settings</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Compliance tracking</span>
                        <Badge variant="secondary" className="text-green-600">Enabled</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Default reminder days</span>
                        <Badge variant="secondary">30 days</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Auto-renewal alerts</span>
                        <Badge variant="secondary" className="text-blue-600">Enabled</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Regulatory notifications</span>
                        <Badge variant="secondary" className="text-orange-600">Enabled</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Workflow Settings</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Approval workflows</span>
                        <Badge variant="secondary" className="text-green-600">Active</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Parallel approvals</span>
                        <Badge variant="secondary">Allowed</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Auto-assignment</span>
                        <Badge variant="secondary" className="text-blue-600">Role-based</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Escalation rules</span>
                        <Badge variant="secondary">48 hours</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Access Control</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Role-based access</span>
                        <Badge variant="secondary" className="text-green-600">Enforced</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Audit logging</span>
                        <Badge variant="secondary" className="text-blue-600">Complete</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Password protection</span>
                        <Badge variant="secondary">Optional</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Download restrictions</span>
                        <Badge variant="secondary" className="text-orange-600">Role-based</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Document Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Upload Document</h2>
            <Form {...uploadForm}>
              <form onSubmit={uploadForm.handleSubmit((data) => uploadDocumentMutation.mutate(data))} className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                    data-testid="input-file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" data-testid="button-select-file">
                      Select File
                    </Button>
                  </label>
                  {selectedFile && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={uploadForm.control as any}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-upload-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={uploadForm.control as any}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-upload-category">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="invoice">Invoice</SelectItem>
                            <SelectItem value="certificate">Certificate</SelectItem>
                            <SelectItem value="license">License</SelectItem>
                            <SelectItem value="policy">Policy</SelectItem>
                            <SelectItem value="procedure">Procedure</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="specification">Specification</SelectItem>
                            <SelectItem value="report">Report</SelectItem>
                            <SelectItem value="correspondence">Correspondence</SelectItem>
                            <SelectItem value="legal">Legal</SelectItem>
                            <SelectItem value="financial">Financial</SelectItem>
                            <SelectItem value="operational">Operational</SelectItem>
                            <SelectItem value="compliance">Compliance</SelectItem>
                            <SelectItem value="quality">Quality</SelectItem>
                            <SelectItem value="safety">Safety</SelectItem>
                            <SelectItem value="hr">HR</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={uploadForm.control as any}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="textarea-upload-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={uploadForm.control as any}
                    name="accessLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Access Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-upload-access">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="internal">Internal</SelectItem>
                            <SelectItem value="confidential">Confidential</SelectItem>
                            <SelectItem value="restricted">Restricted</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={uploadForm.control as any}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="tag1, tag2, tag3" data-testid="input-upload-tags" />
                        </FormControl>
                        <FormDescription>Comma-separated tags</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowUploadDialog(false)} data-testid="button-cancel-upload">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploadDocumentMutation.isPending || !selectedFile} data-testid="button-submit-upload">
                    {uploadDocumentMutation.isPending ? 'Uploading...' : 'Upload Document'}
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