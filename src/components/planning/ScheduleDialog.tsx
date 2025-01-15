'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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

interface ScheduleConfig {
  days: number[];
  time: string;
  repeat: TimeScale;
}

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
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [repeatFrequency, setRepeatFrequency] = useState<TimeScale>(
    frequency?.type || 'weekly'
  );

  const handleSchedule = () => {
    onSchedule({
      days: selectedDays.map(d => d.getDay()),
      time: selectedTime,
      repeat: repeatFrequency
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule {itemName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Select Days</h4>
            <Calendar
              mode="multiple"
              selected={selectedDays}
              onSelect={setSelectedDays}
              className="rounded-md border"
            />
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Select Time</h4>
            <Select
              value={selectedTime}
              onValueChange={setSelectedTime}
            >
              <SelectTrigger>
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
          <div className="space-y-2">
            <h4 className="font-medium">Repeat</h4>
            <Select
              value={repeatFrequency}
              onValueChange={(value: TimeScale) => setRepeatFrequency(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSchedule}>
            Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 