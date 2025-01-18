'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Plus as PlusIcon, Trash as TrashIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimeScale, Step, GoalType } from '@/types/models';

interface StepSchedulerProps {
  step: Step;
  onUpdate: (updates: Partial<Step>) => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return format(new Date().setHours(hour, minute), 'HH:mm');
});

const getDayName = (day: string): string => {
  const days = {
    'Sun': 'Sunday',
    'Mon': 'Monday',
    'Tue': 'Tuesday',
    'Wed': 'Wednesday',
    'Thu': 'Thursday',
    'Fri': 'Friday',
    'Sat': 'Saturday'
  };
  return days[day as keyof typeof days] || day;
};

export function StepScheduler({ step, onUpdate }: StepSchedulerProps) {
  const [isRecurring, setIsRecurring] = useState(!!step.timescale);
  const [selectedTime, setSelectedTime] = useState(
    step.startDateTime ? format(step.startDateTime, 'HH:mm') : '09:00'
  );

  const handleDayToggle = (day: string) => {
    const currentDays = step.selectedDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    onUpdate({ selectedDays: newDays });
  };

  const handleTimeChange = (newTime: string) => {
    setSelectedTime(newTime);
    if (step.startDateTime) {
      const date = new Date(step.startDateTime);
      const [hours, minutes] = newTime.split(':').map(Number);
      date.setHours(hours, minutes);
      onUpdate({ startDateTime: date });
    }
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const [hours, minutes] = selectedTime.split(':').map(Number);
    date.setHours(hours, minutes);
    onUpdate({ startDateTime: date });
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (!date) return;
    onUpdate({ repeatEndDate: date });
  };

  const handleRecurringToggle = (checked: boolean) => {
    setIsRecurring(checked);
    if (!checked) {
      onUpdate({
        timescale: undefined,
        frequency: undefined,
        selectedDays: undefined,
        repeatEndDate: undefined
      });
    } else {
      onUpdate({
        timescale: 'weekly',
        frequency: 1,
        selectedDays: [],
      });
    }
  };

  const handleAddTime = (day: string) => {
    const times = { ...(step.scheduledTimes || {}) };
    times[day] = [...(times[day] || []), "09:00"];
    onUpdate({ scheduledTimes: times });
  };

  const handleUpdateTime = (day: string, timeIndex: number, newTime: string) => {
    const times = { ...(step.scheduledTimes || {}) };
    times[day] = times[day] || [];
    times[day][timeIndex] = newTime;
    onUpdate({ scheduledTimes: times });
  };

  const handleRemoveTime = (day: string, timeIndex: number) => {
    const times = { ...(step.scheduledTimes || {}) };
    times[day] = times[day].filter((_, i) => i !== timeIndex);
    onUpdate({ scheduledTimes: times });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="start-date">Start Date & Time</Label>
          <div className="flex items-center space-x-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !step.startDateTime && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {step.startDateTime ? format(step.startDateTime, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={step.startDateTime}
                  onSelect={handleStartDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select value={selectedTime} onValueChange={handleTimeChange}>
              <SelectTrigger className="w-[120px]">
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map(time => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="recurring"
            checked={isRecurring}
            onCheckedChange={handleRecurringToggle}
          />
          <Label htmlFor="recurring">Recurring Schedule</Label>
        </div>

        {isRecurring && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Repeat</Label>
              <Select
                value={step.timescale || 'weekly'}
                onValueChange={(value: TimeScale) => onUpdate({ timescale: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {step.timescale === 'weekly' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Days of Week</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day}
                        variant="outline"
                        size="sm"
                        className={cn(
                          "px-3",
                          (step.selectedDays || []).includes(day)
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "hover:bg-accent"
                        )}
                        onClick={() => handleDayToggle(day)}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>

                {(step.selectedDays || []).map((day) => (
                  <div key={day} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>{getDayName(day)} Times</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTime(day)}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Time
                      </Button>
                    </div>
                    {(step.scheduledTimes?.[day] || []).map((time, timeIndex) => (
                      <div key={timeIndex} className="flex items-center gap-2">
                        <Select
                          value={time}
                          onValueChange={(newTime) => handleUpdateTime(day, timeIndex, newTime)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <Clock className="mr-2 h-4 w-4" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map(time => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTime(day, timeIndex)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !step.repeatEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {step.repeatEndDate ? format(step.repeatEndDate, 'PPP') : 'No end date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={step.repeatEndDate}
                    onSelect={handleEndDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 