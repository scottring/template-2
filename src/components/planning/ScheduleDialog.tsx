'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { TimeScale } from '@/types/models';

interface ScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (schedule: ScheduleConfig) => void;
  itemName: string;
  frequency?: {
    value: number;
    type: TimeScale;
  };
}

interface DaySchedule {
  day: number;
  time: string;
}

interface ScheduleConfig {
  schedules: DaySchedule[];
  repeat: TimeScale;
}

const WEEKDAYS = [
  { name: 'Sunday', value: 0 },
  { name: 'Monday', value: 1 },
  { name: 'Tuesday', value: 2 },
  { name: 'Wednesday', value: 3 },
  { name: 'Thursday', value: 4 },
  { name: 'Friday', value: 5 },
  { name: 'Saturday', value: 6 },
];

const timeSlots = Array.from({ length: 24 * 2 }).map((_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

export function ScheduleDialog({ 
  open, 
  onClose, 
  onSchedule, 
  itemName,
  frequency 
}: ScheduleDialogProps) {
  const requiredDays = frequency?.value || 2;
  const [selectedSchedules, setSelectedSchedules] = useState<DaySchedule[]>([]);

  const handleDayToggle = (dayValue: number) => {
    setSelectedSchedules(current => {
      if (current.find(s => s.day === dayValue)) {
        return current.filter(s => s.day !== dayValue);
      }
      if (current.length < requiredDays) {
        return [...current, { day: dayValue, time: '09:00' }];
      }
      return current;
    });
  };

  const handleTimeChange = (dayValue: number, newTime: string) => {
    setSelectedSchedules(current => 
      current.map(schedule => 
        schedule.day === dayValue 
          ? { ...schedule, time: newTime }
          : schedule
      )
    );
  };

  const handleSchedule = () => {
    onSchedule({
      schedules: selectedSchedules,
      repeat: 'weekly'
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Schedule {itemName}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Select {requiredDays} day{requiredDays !== 1 ? 's' : ''} per week
          </p>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h4 className="font-medium">Select Days ({requiredDays})</h4>
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAYS.map((day) => (
                <Button
                  key={day.value}
                  variant={selectedSchedules.some(s => s.day === day.value) ? "default" : "outline"}
                  className={`w-full h-12 ${selectedSchedules.some(s => s.day === day.value) ? 'bg-primary' : ''}`}
                  onClick={() => handleDayToggle(day.value)}
                  disabled={!selectedSchedules.some(s => s.day === day.value) && selectedSchedules.length >= requiredDays}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xs">{day.name.slice(0, 3)}</span>
                  </div>
                </Button>
              ))}
            </div>
            {selectedSchedules.length < requiredDays && (
              <p className="text-sm text-muted-foreground">
                Please select {requiredDays - selectedSchedules.length} more day{requiredDays - selectedSchedules.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {selectedSchedules.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Set Times</h4>
              <div className="space-y-3">
                {selectedSchedules.map((schedule) => (
                  <div key={schedule.day} className="flex items-center gap-3">
                    <span className="w-24 text-sm font-medium">
                      {WEEKDAYS.find(d => d.value === schedule.day)?.name}:
                    </span>
                    <Select
                      value={schedule.time}
                      onValueChange={(time) => handleTimeChange(schedule.day, time)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time}>
                            {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={selectedSchedules.length !== requiredDays}>
            Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 