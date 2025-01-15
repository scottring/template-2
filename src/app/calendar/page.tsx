'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/calendar/Calendar';
import { useSettingsStore } from '@/lib/stores/useSettingsStore';
import { ViewSelector } from '@/components/calendar/ViewSelector';
import { DateRangePicker } from '@/components/calendar/DateRangePicker';
import { subDays, subWeeks, subMonths, addDays, addWeeks, addMonths } from 'date-fns';

export default function CalendarPage() {
  const { settings } = useSettingsStore();
  const [view, setView] = useState<'day' | 'week' | 'month'>(settings?.defaultView || 'week');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    if (settings?.defaultView) {
      setView(settings.defaultView);
    }
  }, [settings?.defaultView]);

  const handlePrevious = () => {
    switch (view) {
      case 'day':
        setDate(subDays(date, 1));
        break;
      case 'week':
        setDate(subWeeks(date, 1));
        break;
      case 'month':
        setDate(subMonths(date, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (view) {
      case 'day':
        setDate(addDays(date, 1));
        break;
      case 'week':
        setDate(addWeeks(date, 1));
        break;
      case 'month':
        setDate(addMonths(date, 1));
        break;
    }
  };

  const handleToday = () => {
    setDate(new Date());
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <ViewSelector view={view} onViewChange={setView} />
        </div>
        
        <div className="flex items-center space-x-2">
          <DateRangePicker 
            date={date} 
            view={view} 
            onDateChange={setDate}
          />
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleToday}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Calendar
        view={view}
        date={date}
        onDateChange={setDate}
      />
    </div>
  );
} 