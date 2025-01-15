'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarEvent } from '@/types/models';
import { cn } from '@/lib/utils';
import { useCalendarStore } from '@/lib/stores/useCalendarStore';
import { Repeat, Trash2, Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EventItemProps {
  event: CalendarEvent;
  view: 'day' | 'week' | 'month';
  isDragging?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void;
}

export function EventItem({ event, view, isDragging, onDragStart, onDragEnd }: EventItemProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { deleteEvent } = useCalendarStore();

  const handleDelete = async () => {
    try {
      await deleteEvent(event.id);
      setShowDetails(false);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const renderEventContent = () => {
    switch (view) {
      case 'month':
        return (
          <div className="truncate text-sm">
            {event.allDay ? (
              event.title
            ) : (
              <>
                <span className="font-medium">{format(event.start, 'h:mma')}</span>
                {' '}
                {event.title}
              </>
            )}
          </div>
        );
      
      case 'week':
      case 'day':
        return (
          <div className="flex flex-col h-full p-1">
            <div className="font-medium text-sm truncate">
              {event.title}
            </div>
            {!event.allDay && (
              <div className="text-xs opacity-75">
                {format(event.start, 'h:mm')} - {format(event.end, 'h:mm')}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <>
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={() => setShowDetails(true)}
        className={cn(
          'rounded-md cursor-pointer select-none',
          event.allDay ? 'bg-blue-100 text-blue-900' : 'bg-blue-500 text-white',
          isDragging && 'opacity-50',
          view === 'month' ? 'p-1' : 'absolute inset-x-0 flex flex-col'
        )}
        style={{
          backgroundColor: event.color,
          ...(view !== 'month' && {
            top: `${(event.start.getHours() * 60 + event.start.getMinutes()) * 100 / 1440}%`,
            height: `${((event.end.getTime() - event.start.getTime()) / (1000 * 60)) * 100 / 1440}%`,
          }),
        }}
      >
        {renderEventContent()}
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {event.title}
              {event.recurrence && (
                <Repeat className="h-4 w-4 text-muted-foreground" />
              )}
            </DialogTitle>
            <DialogDescription>
              {event.allDay ? (
                format(event.start, 'PPP')
              ) : (
                `${format(event.start, 'PPP h:mm a')} - ${format(event.end, 'h:mm a')}`
              )}
            </DialogDescription>
          </DialogHeader>

          {event.description && (
            <div className="text-sm">{event.description}</div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                // TODO: Implement edit functionality
                setShowDetails(false);
              }}
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 