/**
 * Notifications hook for managing notification state
 */
import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  useEffect(() => {
    // Calculate unread count
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const markAsRead = async (id: string) => {
    setIsMarkingAsRead(true);
    try {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
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

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
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
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    isOpen,
    setIsOpen,
    isMarkingAsRead,
    summary,
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