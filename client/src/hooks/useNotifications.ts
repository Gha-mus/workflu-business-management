import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { NotificationQueue, CreateNotification, NotificationSetting } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

export interface NotificationWithActions extends NotificationQueue {
  canDismiss: boolean;
  canMarkAsRead: boolean;
  timeAgo: string;
  actionText?: string;
}

export interface NotificationCenterData {
  notifications: NotificationWithActions[];
  unreadCount: number;
  totalCount: number;
  hasMore: boolean;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export function useNotifications(filters?: {
  status?: 'all' | 'unread' | 'read';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  limit?: number;
  offset?: number;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch user notifications
  const notificationsQuery = useQuery({
    queryKey: ['/api/notifications', filters],
    queryFn: async (): Promise<NotificationWithActions[]> => {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const notifications: NotificationQueue[] = await response.json();
      
      // Transform notifications with additional UI properties
      return notifications.map(notification => ({
        ...notification,
        canDismiss: true,
        canMarkAsRead: notification.status !== 'read',
        timeAgo: formatTimeAgo(notification.createdAt || new Date()),
        actionText: getActionText(notification.alertType, notification.alertCategory),
      }));
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch notification settings
  const settingsQuery = useQuery({
    queryKey: ['/api/notifications/settings'],
    queryFn: async (): Promise<NotificationSetting> => {
      const response = await fetch('/api/notifications/settings');
      if (!response.ok) throw new Error('Failed to fetch notification settings');
      return response.json();
    },
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest('PUT', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Success",
        description: "Notification marked as read",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark as read",
        variant: "destructive",
      });
    },
  });

  // Dismiss notification mutation
  const dismissNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest('PUT', `/api/notifications/${notificationId}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Success",
        description: "Notification dismissed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to dismiss notification",
        variant: "destructive",
      });
    },
  });

  // Bulk mark as read mutation
  const bulkMarkAsReadMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      return apiRequest('POST', '/api/notifications/bulk-read', { notificationIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Success",
        description: "Notifications marked as read",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark notifications as read",
        variant: "destructive",
      });
    },
  });

  // Send test notification mutation
  const sendTestNotificationMutation = useMutation({
    mutationFn: async (notification: Omit<CreateNotification, 'userId'>) => {
      return apiRequest('POST', '/api/notifications', notification);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Success",
        description: "Test notification sent",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send notification",
        variant: "destructive",
      });
    },
  });

  // Update notification settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<NotificationSetting>) => {
      return apiRequest('PUT', '/api/notifications/settings', settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/settings'] });
      toast({
        title: "Success",
        description: "Notification settings updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  // Calculate notification summary
  const notifications = notificationsQuery.data || [];
  const unreadNotifications = notifications.filter(n => n.status !== 'read');
  const unreadCount = unreadNotifications.length;
  
  const summary = {
    critical: notifications.filter(n => n.priority === 'critical').length,
    high: notifications.filter(n => n.priority === 'high').length,
    medium: notifications.filter(n => n.priority === 'medium').length,
    low: notifications.filter(n => n.priority === 'low').length,
  };

  const notificationCenterData: NotificationCenterData = {
    notifications,
    unreadCount,
    totalCount: notifications.length,
    hasMore: false, // TODO: Implement pagination
    summary,
  };

  return {
    // Data
    notifications,
    unreadCount,
    summary,
    notificationCenterData,
    settings: settingsQuery.data,
    
    // Loading states
    isLoading: notificationsQuery.isLoading,
    isLoadingSettings: settingsQuery.isLoading,
    
    // UI state
    isOpen,
    setIsOpen,
    
    // Actions
    markAsRead: markAsReadMutation.mutateAsync,
    dismissNotification: dismissNotificationMutation.mutateAsync,
    bulkMarkAsRead: bulkMarkAsReadMutation.mutateAsync,
    sendTestNotification: sendTestNotificationMutation.mutateAsync,
    updateSettings: updateSettingsMutation.mutateAsync,
    
    // Mutation states
    isMarkingAsRead: markAsReadMutation.isPending,
    isDismissing: dismissNotificationMutation.isPending,
    isBulkMarking: bulkMarkAsReadMutation.isPending,
    
    // Utility functions
    refetch: notificationsQuery.refetch,
    refetchSettings: settingsQuery.refetch,
  };
}

// Helper functions
function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const notificationDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  } else {
    return notificationDate.toLocaleDateString();
  }
}

function getActionText(alertType: string, alertCategory: string): string {
  const actionMap: Record<string, string> = {
    'threshold_alert': 'Review Threshold',
    'business_alert': 'View Details',
    'system_alert': 'Check System',
    'compliance_alert': 'Review Compliance',
    'financial_alert': 'View Financial',
    'operational_alert': 'Check Operations',
    'security_alert': 'Security Review',
    'workflow_alert': 'Review Workflow',
  };

  const categoryMap: Record<string, string> = {
    'capital_threshold': 'Manage Capital',
    'inventory_level': 'Check Inventory',
    'purchase_order': 'View Purchase',
    'sales_order': 'View Sales',
    'document_expiry': 'Review Document',
    'approval_workflow': 'Review Approval',
    'financial_health': 'View Reports',
    'operational_delay': 'Check Operations',
    'compliance_issue': 'Review Compliance',
  };

  return categoryMap[alertCategory] || actionMap[alertType] || 'View Details';
}

export type UseNotificationsReturn = ReturnType<typeof useNotifications>;