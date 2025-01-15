'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarEvent, RecurrenceRule } from '@/types/models';
import { useCalendarStore } from '@/lib/stores/useCalendarStore';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock } from 'lucide-react';

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  event?: CalendarEvent;
}

export function EventForm({ open, onOpenChange, initialDate, event }: EventFormProps) {
  const { user } = useAuth();
  const { createEvent, updateEvent } = useCalendarStore();
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [startDate, setStartDate] = useState<Date>(event?.start || initialDate || new Date());
  const [endDate, setEndDate] = useState<Date>(event?.end || initialDate || new Date());
  const [allDay, setAllDay] = useState(event?.allDay || false);
  const [color, setColor] = useState(event?.color || '#3b82f6');
  const [isRecurring, setIsRecurring] = useState(!!event?.recurrence);
  const [recurrence, setRecurrence] = useState<RecurrenceRule | undefined>(event?.recurrence);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    const eventData: Omit<CalendarEvent, 'id'> = {
      title,
      description,
      start: startDate,
      end: endDate,
      allDay,
      color,
      userId: user.uid,
      householdId: user.householdId,
      recurrence: isRecurring ? recurrence : undefined,
    };

    try {
      if (event) {
        await updateEvent(event.id, eventData);
      } else {
        await createEvent(eventData);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{event ? 'Edit Event' : 'Create Event'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="allDay"
                checked={allDay}
                onCheckedChange={(checked) => setAllDay(checked as boolean)}
              />
              <Label htmlFor="allDay">All day</Label>
            </div>
            <div className="grid gap-2">
              <Label>Start</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                    />
                  </PopoverContent>
                </Popover>
                {!allDay && (
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <Input
                      type="time"
                      value={format(startDate, 'HH:mm')}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const newDate = new Date(startDate);
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        setStartDate(newDate);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>End</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                    />
                  </PopoverContent>
                </Popover>
                {!allDay && (
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <Input
                      type="time"
                      value={format(endDate, 'HH:mm')}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const newDate = new Date(endDate);
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        setEndDate(newDate);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="color">Color</Label>
              <Input
                type="color"
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 p-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">
              {event ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 