'use client';

import { useState } from 'react';
import { WeeklyReview } from '@/app/components/WeeklyReview';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function ReviewPage() {
  const router = useRouter();
  const [isStarted, setIsStarted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleComplete = () => {
    router.push('/dashboard');
  };

  if (!isStarted) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Review</CardTitle>
            <CardDescription>
              Review your progress and plan for the week ahead
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Week</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'MMMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-sm text-muted-foreground">
                Week of {format(startOfWeek(selectedDate), 'MMM d')} - {format(endOfWeek(selectedDate), 'MMM d, yyyy')}
              </p>
            </div>
            <Button 
              className="w-full" 
              onClick={() => setIsStarted(true)}
            >
              Start Weekly Review
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <WeeklyReview 
        onComplete={handleComplete} 
        selectedDate={selectedDate}
      />
    </div>
  );
} 