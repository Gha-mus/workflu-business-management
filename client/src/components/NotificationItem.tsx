import { Link } from 'wouter';
import { 
  AlertTriangle, 
  DollarSign, 
  Package, 
  FileText, 
  Truck, 
  Users,
  Shield,
  Activity,
  CheckCircle,
  X,
  ExternalLink,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { NotificationWithActions } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: NotificationWithActions;
  onMarkAsRead: () => void;
  onDismiss: () => void;
  isMarkingAsRead?: boolean;
  isDismissing?: boolean;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDismiss,
  isMarkingAsRead = false,
  isDismissing = false,
}: NotificationItemProps) {
  const isUnread = notification.status !== 'read';
  
  const priorityColors = {
    critical: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    high: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    low: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  };

  const getIcon = () => {
    const iconClass = "h-5 w-5";
    
    switch (notification.alertCategory) {
      case 'capital_threshold':
        return <DollarSign className={iconClass} />;
      case 'inventory_level':
        return <Package className={iconClass} />;
      case 'document_expiry':
        return <FileText className={iconClass} />;
      case 'shipping_delay':
        return <Truck className={iconClass} />;
      case 'approval_workflow':
        return <Users className={iconClass} />;
      case 'compliance_issue':
        return <Shield className={iconClass} />;
      case 'system_health':
        return <Activity className={iconClass} />;
      case 'financial_health':
        return <DollarSign className={iconClass} />;
      default:
        return <AlertTriangle className={iconClass} />;
    }
  };

  const getCategoryLabel = () => {
    const categoryLabels: Record<string, string> = {
      'capital_threshold': 'Capital Alert',
      'inventory_level': 'Inventory Alert',
      'purchase_order': 'Purchase Alert',
      'sales_order': 'Sales Alert',
      'document_expiry': 'Document Alert',
      'approval_workflow': 'Approval Alert',
      'financial_health': 'Financial Alert',
      'operational_delay': 'Operations Alert',
      'compliance_issue': 'Compliance Alert',
      'market_timing': 'Market Alert',
      'system_health': 'System Alert',
      'quality_issue': 'Quality Alert',
      'supplier_issue': 'Supplier Alert',
      'shipping_delay': 'Shipping Alert',
      'payment_due': 'Payment Alert',
      'currency_fluctuation': 'Currency Alert',
    };
    
    return categoryLabels[notification.alertCategory] || 'Alert';
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        isUnread && "border-l-4 border-l-primary bg-primary/5",
        notification.priority === 'critical' && "border-l-red-500",
        notification.priority === 'high' && "border-l-orange-500"
      )}
      data-testid={`notification-item-${notification.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex-shrink-0 p-2 rounded-full",
            notification.priority === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' :
            notification.priority === 'high' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20' :
            notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20' :
            'bg-blue-100 text-blue-600 dark:bg-blue-900/20'
          )}>
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className={cn(
                  "text-sm font-semibold leading-tight",
                  isUnread && "font-bold"
                )}>
                  {notification.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", priorityColors[notification.priority])}
                  >
                    {notification.priority.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {getCategoryLabel()}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {isUnread && notification.canMarkAsRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAsRead}
                    disabled={isMarkingAsRead}
                    className="h-8 w-8 p-0"
                    title="Mark as read"
                    data-testid="mark-read-button"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                
                {notification.canDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                    disabled={isDismissing}
                    className="h-8 w-8 p-0"
                    title="Dismiss"
                    data-testid="dismiss-button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {notification.timeAgo}
                {isUnread && (
                  <Badge variant="outline" className="h-5 text-xs">
                    New
                  </Badge>
                )}
              </div>
              
              {notification.actionUrl && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8"
                  data-testid="action-button"
                >
                  <Link href={notification.actionUrl}>
                    {notification.actionText || 'View'}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}