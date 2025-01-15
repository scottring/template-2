import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealtime } from '@/lib/hooks/useRealtime';
import { markNotificationRead } from '@/lib/firebase/firebaseUtils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '@/types/models';

interface NotificationBellProps {
  householdId: string;
}

export function NotificationBell({ householdId }: NotificationBellProps) {
  const { notifications, loading } = useRealtime(householdId);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id);
    }
    // Handle different notification types
    switch (notification.actionType) {
      case 'accept_handoff':
      case 'reject_handoff':
        // Navigate to task details
        // router.push(`/tasks/${notification.relatedItemId}`);
        break;
      case 'mark_complete':
        // Open task completion dialog
        break;
      case 'reschedule':
        // Open scheduling dialog
        break;
      case 'accept_invite':
        // Open household join dialog
        break;
      case 'view_details':
        // Navigate based on relatedItemType
        break;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {notifications.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h4 className="text-sm font-semibold">Notifications</h4>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'w-full text-left p-4 hover:bg-accent transition-colors',
                    !notification.read && 'bg-accent/50'
                  )}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  {notification.actionRequired && (
                    <Badge variant="outline" className="mt-2">
                      Action Required
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
} 