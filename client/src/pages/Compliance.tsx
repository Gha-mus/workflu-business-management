import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BackButton } from '@/components/ui/back-button';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  FileText,
  Building,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Shield,
  Eye
} from 'lucide-react';
import { formatDistance, format } from 'date-fns';
import {
  ComplianceDashboard,
  ComplianceAlert
} from '@shared/schema';

// Priority colors mapping
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

// Status colors mapping
const getComplianceStatusColor = (status: string) => {
  switch (status) {
    case 'compliant': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'non_compliant': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'expired': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

// Extended dashboard interface
interface ExtendedComplianceDashboard {
  totalRequirements: number;
  compliantCount: number;
  nonCompliantCount: number;
  expiringSoonCount: number;
  complianceScore: number;
  recentActivity: Array<{
    title: string;
    description: string;
    timestamp: string;
    type: string;
    user: string;
  }>;
}

// Get status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'compliant': return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'non_compliant': return <AlertCircle className="h-4 w-4 text-red-600" />;
    case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
    case 'expired': return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
  }
};

export default function Compliance() {
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Query for compliance dashboard
  const { data: dashboard, isLoading: dashboardLoading, refetch } = useQuery<ExtendedComplianceDashboard>({
    queryKey: ['/api/compliance/dashboard']
  });

  // Query for compliance alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery<ComplianceAlert[]>({
    queryKey: ['/api/compliance/alerts', { priority: selectedPriority !== 'all' ? selectedPriority : undefined }]
  });

  // Query for expiring compliance items
  const { data: expiringItems, isLoading: expiringLoading } = useQuery<ComplianceAlert[]>({
    queryKey: ['/api/compliance/expiring', { days: 30 }]
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <BackButton to="/" text="Back to Dashboard" mobileIconOnly={true} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Compliance Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor compliance status, track expiring requirements, and manage regulatory obligations
            </p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          data-testid="button-refresh-compliance"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Dashboard Overview */}
      {dashboardLoading ? (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading compliance dashboard...</p>
        </div>
      ) : dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                Total Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboard.totalRequirements}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Active compliance items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Compliant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{dashboard.compliantCount}</div>
              <Progress 
                value={(dashboard.compliantCount / dashboard.totalRequirements) * 100} 
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{dashboard.expiringSoonCount}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Within 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                Non-Compliant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{dashboard.nonCompliantCount}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Requires attention</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compliance Score */}
      {dashboard && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Compliance Score
            </CardTitle>
            <CardDescription>
              Overall compliance performance across all requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Score</span>
                <span className="text-2xl font-bold text-green-600">
                  {dashboard.complianceScore}%
                </span>
              </div>
              <Progress value={dashboard.complianceScore} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-green-600">{dashboard.compliantCount}</div>
                  <div className="text-gray-600 dark:text-gray-400">Compliant</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-yellow-600">{dashboard.expiringSoonCount}</div>
                  <div className="text-gray-600 dark:text-gray-400">Expiring</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-red-600">{dashboard.nonCompliantCount}</div>
                  <div className="text-gray-600 dark:text-gray-400">Non-Compliant</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts and Expiring Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Priority Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Priority Alerts
              </CardTitle>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-32" data-testid="select-priority-filter">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription>
              Critical compliance issues requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="text-center py-4">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert: any) => (
                  <div key={alert.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(alert.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{alert.documentTitle}</h4>
                          <Badge className={getPriorityColor(alert.priority)}>
                            {alert.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {alert.requirementName}
                        </p>
                        {alert.expiryDate && (
                          <p className="text-xs text-red-600">
                            Expires: {format(new Date(alert.expiryDate), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      data-testid={`button-view-alert-${alert.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {alerts.length > 5 && (
                  <div className="text-center">
                    <Button variant="link" size="sm">
                      View all {alerts.length} alerts
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-600 dark:text-gray-400">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p>No alerts at this priority level</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              Expiring Soon
            </CardTitle>
            <CardDescription>
              Compliance requirements expiring within 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expiringLoading ? (
              <div className="text-center py-4">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
              </div>
            ) : expiringItems && expiringItems.length > 0 ? (
              <div className="space-y-3">
                {expiringItems.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{item.documentTitle}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {item.requirementName}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge className={item.daysUntilExpiry <= 7 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                            {item.daysUntilExpiry} days left
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {format(new Date(item.expiryDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      data-testid={`button-view-expiring-${item.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {expiringItems.length > 5 && (
                  <div className="text-center">
                    <Button variant="link" size="sm">
                      View all {expiringItems.length} expiring items
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-600 dark:text-gray-400">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p>No items expiring soon</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Compliance Activity
          </CardTitle>
          <CardDescription>
            Latest updates and changes to compliance status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboard?.recentActivity && dashboard.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recentActivity.map((activity: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStatusIcon(activity.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{activity.title}</h4>
                      <span className="text-xs text-gray-500">
                        {formatDistance(new Date(activity.timestamp), new Date(), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{activity.description}</p>
                    {activity.user && (
                      <p className="text-xs text-gray-500 mt-1">by {activity.user}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-600 dark:text-gray-400">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>No recent compliance activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}