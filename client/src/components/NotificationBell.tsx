import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from './NotificationCenter';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
}

export function NotificationBell({ 
  className, 
  variant = 'ghost', 
  size = 'sm' 
}: NotificationBellProps) {
  const { unreadCount } = useNotifications({ status: 'unread' });
  const hasUnread = unreadCount > 0;

  const trigger = (
    <Button
      variant={variant}
      size={size}
      className={cn("relative", className)}
      data-testid="notification-bell-trigger"
    >
      <Bell className="h-5 w-5" />
      {hasUnread && (
        <Badge
          className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
          variant="destructive"
          data-testid="notification-count-badge"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );

  return <NotificationCenter trigger={trigger} />;
}