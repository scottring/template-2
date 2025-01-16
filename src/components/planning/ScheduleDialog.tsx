'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TimeScale } from '@/types/models';
import { format } from 'date-fns';

export interface ScheduleConfig {
  schedules: Array<{ day: number; time: string }>;
  repeat: TimeScale | 'none';
  endDate?: Date;
}

interface ScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (config: ScheduleConfig) => void;
  itemName: string;
  targetDate?: Date;
  initialSchedule?: {
    schedules: Array<{ day: number; time: string }>;
    repeat?: TimeScale;
    endDate?: Date;
  };
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

export function ScheduleDialog({ open, onClose, onSchedule, itemName, targetDate, initialSchedule }: ScheduleDialogProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dayTimes, setDayTimes] = useState<Record<number, string>>({});
  const [repeat, setRepeat] = useState<TimeScale | 'none'>('weekly');
  const [endDate, setEndDate] = useState<Date | undefined>(targetDate);

  // Initialize with existing schedule when dialog opens
  useEffect(() => {
    if (open && initialSchedule) {
      const days = initialSchedule.schedules.map(s => s.day);
      const times = Object.fromEntries(
        initialSchedule.schedules.map(s => [s.day, s.time])
      );
      setSelectedDays(days);
      setDayTimes(times);
      setRepeat(initialSchedule.repeat || 'none');
      setEndDate(initialSchedule.endDate || targetDate);
    } else if (open) {
      // Reset when opening without initial schedule
      setSelectedDays([]);
      setDayTimes({});
      setRepeat('weekly');
      setEndDate(targetDate);
    }
  }, [open, initialSchedule, targetDate]);

  const handleDayToggle = (dayIndex: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayIndex)) {
        // Remove the day and its time
        const newDayTimes = { ...dayTimes };
        delete newDayTimes[dayIndex];
        setDayTimes(newDayTimes);
        return prev.filter((d) => d !== dayIndex);
      }
      // Add the day with default time
      setDayTimes(prev => ({
        ...prev,
        [dayIndex]: '09:00'
      }));
      return [...prev, dayIndex];
    });
  };

  const handleTimeChange = (dayIndex: number, time: string) => {
    setDayTimes(prev => ({
      ...prev,
      [dayIndex]: time
    }));
  };

  const handleSchedule = () => {
    if (selectedDays.length === 0) {
      return;
    }

    const schedules = selectedDays.map(day => ({
      day,
      time: dayTimes[day] || '09:00', // Fallback to default time if not set
    }));

    onSchedule({
      schedules,
      repeat,
      endDate: repeat === 'none' ? undefined : endDate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Item</DialogTitle>
          <DialogDescription>
            Choose when and how often "{itemName}" should occur.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Select Days</h4>
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAYS.map((day, index) => (
                <Button
                  key={day}
                  variant={selectedDays.includes(index) ? 'default' : 'outline'}
                  className="h-9 p-0"
                  onClick={() => handleDayToggle(index)}
                >
                  {day[0]}
                </Button>
              ))}
            </div>
          </div>

          {selectedDays.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Select Times</h4>
              {selectedDays.map(dayIndex => (
                <div key={dayIndex} className="flex items-center gap-2">
                  <span className="w-20 text-sm">{WEEKDAYS[dayIndex]}:</span>
                  <select
                    value={dayTimes[dayIndex] || '09:00'}
                    onChange={(e) => handleTimeChange(dayIndex, e.target.value)}
                    className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                  >
                    {TIME_SLOTS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Repeat</h4>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value as TimeScale | 'none')}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            >
              <option value="none">No repeat (one-time)</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
            {repeat !== 'none' && (
              <p className="text-sm text-muted-foreground">
                {repeat === 'daily' && 'Will repeat every day'}
                {repeat === 'weekly' && 'Will repeat every week on the selected days'}
                {repeat === 'monthly' && 'Will repeat every month on these days'}
                {repeat === 'quarterly' && 'Will repeat every three months on these days'}
                {targetDate ? ` until ${format(targetDate, 'MMM d, yyyy')}` : ''}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={selectedDays.length === 0}>
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 