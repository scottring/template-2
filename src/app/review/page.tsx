'use client';

import { useState } from 'react';
import { FlowReview } from '@/app/components/FlowReview';
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
import useGoalStore from '@/lib/stores/useGoalStore';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import useTaskStore from '@/lib/stores/useTaskStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { ScheduleDialog } from "@/components/planning/ScheduleDialog";
import { ItineraryItem } from '@/types/models';

export default function ReviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isStarted, setIsStarted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);

  const { goals, loading: goalsLoading } = useGoalStore();
  const { items, loading: itemsLoading } = useItineraryStore();
  const { tasks, loading: tasksLoading } = useTaskStore();

  const handleComplete = () => {
    router.push('/dashboard');
  };

  const handleRescheduleItem = (item: ItineraryItem) => {
    setSelectedItem(item);
    setScheduleDialogOpen(true);
  };

  const handleScheduleConfirm = async (newSchedule: any) => {
    // Handle rescheduling logic here
    setScheduleDialogOpen(false);
    setSelectedItem(null);
  };

  if (goalsLoading || itemsLoading || tasksLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center min-h-[200px]">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      <FlowReview 
        selectedDate={selectedDate}
        goals={goals}
        items={items}
        tasks={tasks}
        onComplete={handleComplete}
        onRescheduleItem={handleRescheduleItem}
      />

      {selectedItem && (
        <ScheduleDialog
          open={scheduleDialogOpen}
          onClose={() => {
            setScheduleDialogOpen(false);
            setSelectedItem(null);
          }}
          onSchedule={handleScheduleConfirm}
          itemName={selectedItem.notes || ''}
          targetDate={selectedItem.schedule?.startDate}
        />
      )}
    </div>
  );
} 