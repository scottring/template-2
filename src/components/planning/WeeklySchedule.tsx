'use client';

import { useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { Card } from '@/components/ui/card';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import { ItineraryItem } from '@/types/models';

interface WeeklyScheduleProps {
  startDate: Date;
}

interface DaySchedule {
  day: number;
  time: string;
}

interface NewSchedule {
  schedules: DaySchedule[];
  repeat: string;
}

interface OldSchedule {
  days: number[];
  time: string;
  repeat: string;
}

// Generate time slots from 5am to 10pm
const timeSlots = Array.from({ length: (22 - 5 + 1) * 2 }).map((_, i) => {
  const hour = Math.floor(i / 2) + 5; // Start from 5am
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

export function WeeklySchedule({ startDate }: WeeklyScheduleProps) {
  const { items } = useItineraryStore();

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
  }, [startDate]);

  const getItemsForDayAndTime = (day: Date, time: string) => {
    return items.filter(item => {
      if (!item.schedule) return false;
      
      // Check if it's using the new format
      if ('schedules' in item.schedule) {
        const schedule = item.schedule as NewSchedule;
        return schedule.schedules.some(
          (daySchedule: DaySchedule) => 
            daySchedule.day === day.getDay() && 
            daySchedule.time === time
        );
      }
      
      // Must be using the old format
      const schedule = item.schedule as OldSchedule;
      return schedule.days.includes(day.getDay()) && 
             schedule.time === time;
    });
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-2 mb-4">
          <div className="text-sm font-medium text-muted-foreground">Time</div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className="text-sm font-medium">
              {format(day, 'EEE MM/dd')}
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="space-y-2">
          {timeSlots.map(time => (
            <div key={time} className="grid grid-cols-[100px_repeat(7,1fr)] gap-2">
              <div className="text-sm text-muted-foreground">
                {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
              </div>
              {weekDays.map(day => {
                const dayItems = getItemsForDayAndTime(day, time);
                return (
                  <div key={day.toISOString()} className="min-h-[40px]">
                    {dayItems.map(item => (
                      <Card key={item.id} className="p-2 text-sm bg-primary/10">
                        {item.notes}
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