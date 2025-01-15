'use client';

import { useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { Card } from '@/components/ui/card';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import { ItineraryItem, TimeScale } from '@/types/models';

interface WeeklyScheduleProps {
  startDate: Date;
}

interface DaySchedule {
  day: number;
  time: string;
}

interface NewSchedule {
  schedules: DaySchedule[];
  repeat: TimeScale;
}

interface OldSchedule {
  days: number[];
  time: string;
  repeat: TimeScale;
}

const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
  const hour = (i + 5).toString().padStart(2, '0');
  return `${hour}:00`;
});

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WeeklySchedule({ startDate }: WeeklyScheduleProps) {
  const { items } = useItineraryStore();

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  }, [startDate]);

  const getItemsForDayAndTime = (date: Date, time: string) => {
    return items.filter(item => {
      if (!item.schedule) return false;

      // Check if it's using the new schedule format
      if ('schedules' in item.schedule) {
        const schedule = item.schedule as NewSchedule;
        return schedule.schedules.some(
          (daySchedule: DaySchedule) => 
            daySchedule.day === date.getDay() && 
            daySchedule.time === time
        );
      }

      // Must be using the old schedule format
      const schedule = item.schedule as OldSchedule;
      return (
        schedule.days.includes(date.getDay()) &&
        schedule.time === time
      );
    });
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-8 gap-2 mb-4">
          <div className="font-medium text-sm text-gray-500">Time</div>
          {weekDays.map((date) => (
            <div key={date.toISOString()} className="text-center">
              <div className="font-medium">{WEEKDAYS[date.getDay()]}</div>
              <div className="text-sm text-gray-500">{format(date, 'd')}</div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="space-y-2">
          {TIME_SLOTS.map((time) => (
            <div key={time} className="grid grid-cols-8 gap-2">
              <div className="text-sm text-gray-500 pt-2">{time}</div>
              {weekDays.map((date) => {
                const items = getItemsForDayAndTime(date, time);
                return (
                  <div key={date.toISOString()} className="min-h-[60px]">
                    {items.map((item) => (
                      <Card key={item.id} className="p-2 mb-2 bg-blue-50 border-blue-200">
                        <p className="text-sm font-medium truncate">{item.notes}</p>
                      </Card>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 