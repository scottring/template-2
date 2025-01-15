'use client';

import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface DateRangePickerProps {
  date: Date;
  view: 'day' | 'week' | 'month';
  onDateChange: (date: Date) => void;
}

export function DateRangePicker({ date, view, onDateChange }: DateRangePickerProps) {
  const getDateRangeText = () => {
    switch (view) {
      case 'day':
        return format(date, 'PPPP');
      case 'week': {
        const start = startOfWeek(date);
        const end = endOfWeek(date);
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      }
      case 'month':
        return format(date, 'MMMM yyyy');
      default:
        return '';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-start text-left font-normal w-[240px]"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getDateRangeText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => date && onDateChange(date)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
} 