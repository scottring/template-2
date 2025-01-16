'use client';

import { useState } from 'react';
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

export interface ScheduleConfig {
  schedules: Array<{ day: number; time: string }>;
  repeat: TimeScale;
}

interface ScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (config: ScheduleConfig) => void;
  itemName: string;
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

export function ScheduleDialog({ open, onClose, onSchedule, itemName }: ScheduleDialogProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [repeat, setRepeat] = useState<TimeScale>('weekly');

  const handleDayToggle = (dayIndex: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayIndex)) {
        return prev.filter((d) => d !== dayIndex);
      }
      return [...prev, dayIndex];
    });
  };

  const handleSchedule = () => {
    if (selectedDays.length === 0) {
      return;
    }

    const schedules = selectedDays.map(day => ({
      day,
      time: selectedTime,
    }));

    onSchedule({
      schedules,
      repeat,
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

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Select Time</h4>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            >
              {TIME_SLOTS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Repeat</h4>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value as TimeScale)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
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