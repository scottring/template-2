'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CalendarDays, CalendarRange, Calendar } from 'lucide-react';

interface ViewSelectorProps {
  view: 'day' | 'week' | 'month';
  onViewChange: (view: 'day' | 'week' | 'month') => void;
}

export function ViewSelector({ view, onViewChange }: ViewSelectorProps) {
  return (
    <ToggleGroup type="single" value={view} onValueChange={(value) => value && onViewChange(value as 'day' | 'week' | 'month')}>
      <ToggleGroupItem value="day" aria-label="Day view">
        <CalendarDays className="h-4 w-4" />
        <span className="sr-only">Day view</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="week" aria-label="Week view">
        <CalendarRange className="h-4 w-4" />
        <span className="sr-only">Week view</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="month" aria-label="Month view">
        <Calendar className="h-4 w-4" />
        <span className="sr-only">Month view</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
} 