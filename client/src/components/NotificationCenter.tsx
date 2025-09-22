import { useState } from 'react';
import { Bell, Settings, Check, X, Filter, RefreshCw } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { NotificationSettings } from './NotificationSettings';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  trigger?: React.ReactNode;
  className?: string;
}

export function NotificationCenter({ trigger, className }: NotificationCenterProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'critical' | 'high' | 'medium' | 'low' | undefined>();
  const [activeTab, setActiveTab] = useState('notifications');

  const {
    notifications,
    unreadCount,
    summary,
    isLoading,
    isOpen,
    setIsOpen,
    markAsRead,
    dismissNotification,
    bulkMarkAsRead,
    refetch,
    isMarkingAsRead,
    isDismissing,
    isBulkMarking,
  } = useNotifications({
    status: statusFilter,
    priority: priorityFilter,
    limit: 50,
  });

  const filteredNotifications = notifications || [];
  const hasUnread = unreadCount > 0;
  const unreadNotifications = filteredNotifications.filter(n => n.status !== 'read');

  const handleMarkAllAsRead = async () => {
    const unreadIds = unreadNotifications.map(n => n.id);
    if (unreadIds.length > 0) {
      await bulkMarkAsRead(unreadIds);
    }
  };

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className={cn("relative", className)}
      data-testid="notification-bell"
    >
      <Bell className="h-5 w-5" />
      {hasUnread && (
        <Badge
          className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
          variant="destructive"
          data-testid="notification-badge"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]" data-testid="notification-center">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Notifications
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                data-testid="refresh-notifications"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
              {hasUnread && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={isBulkMarking}
                  data-testid="mark-all-read"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark All Read
                </Button>
              )}
            </div>
          </SheetTitle>
          <SheetDescription>
            Stay updated with your business alerts and notifications
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications" data-testid="tab-notifications">
              Notifications
              {hasUnread && (
                <Badge className="ml-2 h-5 w-5 text-xs p-0 flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="mt-4 space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-2 pb-2 border-b">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-32" data-testid="filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter || 'all'} onValueChange={(value: any) => 
                setPriorityFilter(value === 'all' ? undefined : value)
              }>
                <SelectTrigger className="w-32" data-testid="filter-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Summary */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border">
                <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {summary.critical}
                </div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
              <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border">
                <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  {summary.high}
                </div>
                <div className="text-xs text-muted-foreground">High</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border">
                <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                  {summary.medium}
                </div>
                <div className="text-xs text-muted-foreground">Medium</div>
              </div>
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {summary.low}
                </div>
                <div className="text-xs text-muted-foreground">Low</div>
              </div>
            </div>

            {/* Notifications List */}
            <ScrollArea className="h-[600px]" data-testid="notifications-list">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No notifications</p>
                  <p className="text-sm">
                    {statusFilter === 'unread' 
                      ? "You're all caught up! No unread notifications."
                      : "No notifications match your current filters."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={() => markAsRead(notification.id)}
                      onDismiss={() => dismissNotification(notification.id)}
                      isMarkingAsRead={isMarkingAsRead}
                      isDismissing={isDismissing}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="mt-4 h-[650px] overflow-auto">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}