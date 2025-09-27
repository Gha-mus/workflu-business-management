/**
 * Notifications hook for managing notification state
 */
import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  status: 'unread' | 'read';
  timestamp: Date;
  read: boolean;
}

export interface NotificationWithActions extends Notification {
  onMarkAsRead?: () => void;
  onDismiss?: () => void;
  alertCategory?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  timeAgo?: string;
  actionUrl?: string;
  actionText?: string;
  canMarkAsRead?: boolean;
  canDismiss?: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [isBulkMarking, setIsBulkMarking] = useState(false);

  useEffect(() => {
    // Calculate unread count
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const markAsRead = async (id?: string) => {
    setIsMarkingAsRead(true);
    try {
      if (id) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, read: true, status: 'read' as const } : n)
        );
      } else {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true, status: 'read' as const }))
        );
      }
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const bulkMarkAsRead = (ids: string[]) => {
    setNotifications(prev => 
      prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n)
    );
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'status'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
      status: 'unread',
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const dismissNotification = (id: string) => {
    removeNotification(id);
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const refetch = async () => {
    setIsLoading(true);
    try {
      // Mock refetch logic - in real implementation, this would fetch from API
      await new Promise(resolve => setTimeout(resolve, 100));
    } finally {
      setIsLoading(false);
    }
  };

  // Mock summary for compatibility
  const summary = {
    total: notifications.length,
    unread: unreadCount,
    recent: notifications.slice(0, 5),
    critical: notifications.filter(n => n.type === 'error').length,
    high: notifications.filter(n => n.type === 'error').length,
    medium: notifications.filter(n => n.type === 'warning').length,
    low: notifications.filter(n => n.type === 'info').length,
  };

  // Mock settings and additional functions for compatibility
  const settings = {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    frequency: 'immediate',
    enableInApp: true,
    enableEmail: true,
    enableSms: false,
    enableWebhook: false,
    defaultFrequency: 'immediate',
    digestTime: '09:00',
    weeklyDigestDay: 'monday',
    monthlyDigestDay: 1,
    escalationEnabled: false,
    escalationTimeoutMinutes: 30,
  };

  const updateSettings = async (newSettings: any) => {
    // Mock implementation
    Object.assign(settings, newSettings);
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    isOpen,
    setIsOpen,
    isMarkingAsRead,
    isDismissing,
    isBulkMarking,
    summary,
    settings,
    isLoadingSettings: false,
    updateSettings,
    markAsRead,
    markAllAsRead,
    bulkMarkAsRead,
    addNotification,
    removeNotification,
    dismissNotification,
    clearAll,
    refetch,
  };
}