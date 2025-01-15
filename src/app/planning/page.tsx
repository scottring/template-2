'use client';

import { useState } from 'react';
import { useGoalStore } from '@/lib/stores/useGoalStore';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeeklySchedule } from '@/components/planning/WeeklySchedule';
import { ScheduleDialog } from '@/components/planning/ScheduleDialog';
import { ItineraryItem } from '@/types/models';

export default function PlanningPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [planningMode, setPlanningMode] = useState<'week' | 'month' | 'quarter'>('week');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    name: string;
    frequency?: { value: number; type: any; };
  } | null>(null);

  const { goals } = useGoalStore();
  const { getActiveHabits, updateItemSchedule } = useItineraryStore();
  const activeHabits = getActiveHabits();

  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  const nextWeekStart = addWeeks(weekStart, 1);

  const handleSchedule = (schedule: ItineraryItem['schedule']) => {
    if (selectedItem) {
      updateItemSchedule(selectedItem.id, schedule);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Planning Session</h1>
        <div className="flex gap-2">
          <Button 
            variant={planningMode === 'week' ? 'default' : 'outline'}
            onClick={() => setPlanningMode('week')}
          >
            Weekly
          </Button>
          <Button 
            variant={planningMode === 'month' ? 'default' : 'outline'}
            onClick={() => setPlanningMode('month')}
          >
            Monthly
          </Button>
          <Button 
            variant={planningMode === 'quarter' ? 'default' : 'outline'}
            onClick={() => setPlanningMode('quarter')}
          >
            Quarterly
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left sidebar - Calendar and time selection */}
        <div className="col-span-3 space-y-4">
          <Card className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </Card>
        </div>

        {/* Main content area */}
        <div className="col-span-9 space-y-6">
          <Tabs defaultValue="goals" className="w-full">
            <TabsList>
              <TabsTrigger value="goals">Goals & Success Criteria</TabsTrigger>
              <TabsTrigger value="habits">Active Habits</TabsTrigger>
              <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="goals" className="space-y-4">
              <h2 className="text-xl font-semibold">Current Goals</h2>
              {goals.map(goal => (
                <Card key={goal.id} className="p-4">
                  <h3 className="font-medium">{goal.name}</h3>
                  <div className="mt-2 space-y-2">
                    {goal.successCriteria.map((criteria, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span>{criteria.text}</span>
                        {criteria.isTracked && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedItem({
                                id: `${goal.id}-${criteria.text}`,
                                name: criteria.text
                              });
                              setScheduleDialogOpen(true);
                            }}
                          >
                            Schedule
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="habits" className="space-y-4">
              <h2 className="text-xl font-semibold">Active Habits</h2>
              {activeHabits.map(habit => (
                <Card key={habit.id} className="p-4">
                  <h3 className="font-medium">{habit.name}</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {habit.frequency.value}x per {habit.frequency.type}
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => {
                        setSelectedItem({
                          id: habit.id,
                          name: habit.name,
                          frequency: habit.frequency
                        });
                        setScheduleDialogOpen(true);
                      }}
                    >
                      Schedule Times
                    </Button>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <h2 className="text-xl font-semibold">
                Schedule for {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
              </h2>
              <WeeklySchedule startDate={selectedDate} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {selectedItem && (
        <ScheduleDialog
          open={scheduleDialogOpen}
          onClose={() => {
            setScheduleDialogOpen(false);
            setSelectedItem(null);
          }}
          onSchedule={handleSchedule}
          itemName={selectedItem.name}
          frequency={selectedItem.frequency}
        />
      )}
    </div>
  );
} 