'use client';

import { useEffect, useState } from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useCalendarStore } from '@/lib/stores/useCalendarStore';
import { EventItem } from './EventItem';
import { EventForm } from './EventForm';
import { CalendarEvent } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CalendarProps {
  view: 'day' | 'week' | 'month';
  date: Date;
  onDateChange: (date: Date) => void;
}

export function Calendar({ view, date, onDateChange }: CalendarProps) {
  const [days, setDays] = useState<Date[]>([]);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { events, updateEvent } = useCalendarStore();

  useEffect(() => {
    let interval: { start: Date; end: Date };

    switch (view) {
      case 'day':
        interval = { start: date, end: date };
        break;
      case 'week':
        interval = {
          start: startOfWeek(date),
          end: endOfWeek(date),
        };
        break;
      case 'month':
        interval = {
          start: startOfMonth(date),
          end: endOfMonth(date),
        };
        break;
    }

    setDays(eachDayOfInterval(interval));
  }, [date, view]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, event: CalendarEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.setData('text/plain', event.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, dropDate: Date) => {
    e.preventDefault();
    if (!draggedEvent) return;

    const eventId = e.dataTransfer.getData('text/plain');
    const timeDiff = draggedEvent.end.getTime() - draggedEvent.start.getTime();
    const newStart = new Date(dropDate);
    const newEnd = new Date(newStart.getTime() + timeDiff);

    try {
      await updateEvent(eventId, {
        start: newStart,
        end: newEnd,
      });
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleCellClick = (date: Date) => {
    setSelectedDate(date);
    setShowEventForm(true);
  };

  const renderDayView = () => (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 divide-y">
        {Array.from({ length: 24 }).map((_, hour) => {
          const cellDate = new Date(date);
          cellDate.setHours(hour, 0, 0, 0);

          return (
            <div
              key={hour}
              className="h-16 relative group cursor-pointer"
              onClick={() => handleCellClick(cellDate)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => handleDrop(e, cellDate)}
            >
              <div className="absolute -left-14 top-0 text-sm text-gray-500">
                {format(cellDate, 'ha')}
              </div>
              {events
                .filter(event => !event.allDay && isSameDay(event.start, date))
                .map(event => (
                  <EventItem
                    key={event.id}
                    event={event}
                    view="day"
                    isDragging={draggedEvent?.id === event.id}
                    onDragStart={(e) => handleDragStart(e, event)}
                    onDragEnd={handleDragEnd}
                  />
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {days.map((day) => (
          <div
            key={day.toString()}
            className="bg-white p-2 text-center"
          >
            <div className="text-sm font-medium">
              {format(day, 'EEE')}
            </div>
            <div className="text-lg">{format(day, 'd')}</div>
            <div className="mt-1">
              {events
                .filter(event => event.allDay && isSameDay(event.start, day))
                .map(event => (
                  <EventItem
                    key={event.id}
                    event={event}
                    view="week"
                    isDragging={draggedEvent?.id === event.id}
                    onDragStart={(e) => handleDragStart(e, event)}
                    onDragEnd={handleDragEnd}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-24 gap-px bg-gray-200 flex-1">
        {days.map((day) =>
          Array.from({ length: 24 }).map((_, hour) => {
            const cellDate = new Date(day);
            cellDate.setHours(hour, 0, 0, 0);

            return (
              <div
                key={`${day}-${hour}`}
                className="bg-white h-16 relative group cursor-pointer"
                onClick={() => handleCellClick(cellDate)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => handleDrop(e, cellDate)}
              >
                {events
                  .filter(
                    event =>
                      !event.allDay &&
                      isSameDay(event.start, day) &&
                      event.start.getHours() === hour
                  )
                  .map(event => (
                    <EventItem
                      key={event.id}
                      event={event}
                      view="week"
                      isDragging={draggedEvent?.id === event.id}
                      onDragStart={(e) => handleDragStart(e, event)}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-px bg-gray-200">
      {days.map((day) => (
        <div
          key={day.toString()}
          className={cn(
            'bg-white p-4 relative min-h-[120px] cursor-pointer',
            !isSameMonth(day, date) && 'bg-gray-50 text-gray-500'
          )}
          onClick={() => handleCellClick(day)}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={(e) => handleDrop(e, day)}
        >
          <div className="text-right">
            <span
              className={cn(
                'text-sm',
                isSameDay(day, new Date()) &&
                  'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center ml-auto'
              )}
            >
              {format(day, 'd')}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            {events
              .filter(event => isSameDay(event.start, day))
              .map(event => (
                <EventItem
                  key={event.id}
                  event={event}
                  view="month"
                  isDragging={draggedEvent?.id === event.id}
                  onDragStart={(e) => handleDragStart(e, event)}
                  onDragEnd={handleDragEnd}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-[calc(100vh-12rem)] bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            setSelectedDate(new Date());
            setShowEventForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </div>
      {view === 'day' && renderDayView()}
      {view === 'week' && renderWeekView()}
      {view === 'month' && renderMonthView()}
      <EventForm
        open={showEventForm}
        onOpenChange={setShowEventForm}
        initialDate={selectedDate || undefined}
      />
    </div>
  );
} 