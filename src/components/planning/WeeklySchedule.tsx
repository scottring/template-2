'use client';

import { useMemo } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { Card } from '@/components/ui/card';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import { ItineraryItem } from '@/types/models';

interface WeeklyScheduleProps {
  startDate: Date;
}

export function WeeklySchedule({ startDate }: WeeklyScheduleProps) {
  const { items } = useItineraryStore();
  
  const weekDays = useMemo(() => {
    const start = startOfWeek(startDate);
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [startDate]);

  const timeSlots = useMemo(() => {
    return Array.from({ length: 24 * 2 }).map((_, i) => {
      const hour = Math.floor(i / 2);
      const minute = i % 2 === 0 ? '00' : '30';
      return `${hour.toString().padStart(2, '0')}:${minute}`;
    });
  }, []);

  const getItemsForDayAndTime = (day: Date, time: string): ItineraryItem[] => {
    return items.filter(item => {
      if (!item.schedule) return false;
      return (
        item.schedule.days.includes(day.getDay()) &&
        item.schedule.time === time
      );
    });
  };

  return (
    <div className="overflow-auto">
      <div className="grid grid-cols-8 gap-2">
        {/* Time column */}
        <div className="space-y-2">
          <div className="h-12" /> {/* Header spacer */}
          {timeSlots.map(time => (
            <div key={time} className="h-12 text-sm text-gray-500 pr-2 text-right">
              {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map(day => (
          <div key={day.toISOString()} className="space-y-2">
            <div className="h-12 text-center">
              <div className="font-medium">{format(day, 'EEE')}</div>
              <div className="text-sm text-gray-500">{format(day, 'MMM d')}</div>
            </div>
            {timeSlots.map(time => {
              const slotItems = getItemsForDayAndTime(day, time);
              return (
                <div key={time} className="h-12 relative">
                  <div className="absolute inset-0.5 rounded border border-dashed border-gray-200">
                    {slotItems.map(item => (
                      <Card key={item.id} className="m-0.5 p-1 text-xs bg-blue-50 border-blue-200">
                        {item.notes}
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
} 