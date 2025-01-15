'use client';

import { useState, useEffect } from 'react';
import { useGoalStore } from '@/lib/stores/useGoalStore';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import { format, startOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WeeklySchedule } from '@/components/planning/WeeklySchedule';
import { ScheduleDialog } from '@/components/planning/ScheduleDialog';
import { ItineraryItem, Goal, TimeScale } from '@/types/models';
import { Trash2, CalendarIcon, CheckCircle, ChevronDown, ChevronRight, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlanningSession {
  step: 'review' | 'mark' | 'schedule';
  markedItems: Set<string>;
  scheduledItems: Set<string>;
  currentGoalIndex: number;
}

interface SuccessCriteria {
  text: string;
  frequency?: number;
  timescale?: TimeScale;
}

interface ScheduleConfig {
  schedules: Array<{ day: number; time: string }>;
  repeat: TimeScale;
}

export default function WeeklyPlanningPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    name: string;
    frequency?: { value: number; type: any; };
  } | null>(null);
  
  // Planning session state
  const [session, setSession] = useState<PlanningSession>({
    step: 'review',
    markedItems: new Set(),
    scheduledItems: new Set(),
    currentGoalIndex: 0
  });

  const { goals, loadGoals } = useGoalStore();
  const { getActiveHabits, updateItemSchedule } = useItineraryStore();
  const activeHabits = getActiveHabits();

  // Load goals when component mounts
  useEffect(() => {
    loadGoals().catch(error => {
      console.error('Error loading goals:', error);
    });
  }, [loadGoals]);

  const currentGoal = goals[session.currentGoalIndex];

  const handleSchedule = (scheduleConfig: ScheduleConfig) => {
    if (selectedItem) {
      // Convert the new schedule format to the old format
      const schedule: ItineraryItem['schedule'] = {
        days: scheduleConfig.schedules.map(s => s.day),
        time: scheduleConfig.schedules[0].time, // Use the first time for backward compatibility
        repeat: scheduleConfig.repeat
      };

      updateItemSchedule(selectedItem.id, schedule);
      setSession(prev => ({
        ...prev,
        scheduledItems: new Set([...prev.scheduledItems, selectedItem.id]),
        markedItems: new Set([...prev.markedItems].filter(id => id !== selectedItem.id))
      }));
      setScheduleDialogOpen(false);
      
      // If all marked items are scheduled, move to schedule view
      if (session.markedItems.size === 1) { // Since we just removed one
        moveToStep('schedule');
      }
    }
  };

  const handleMarkForScheduling = (itemId: string) => {
    setSession(prev => ({
      ...prev,
      markedItems: new Set([...prev.markedItems, itemId])
    }));
  };

  const handleUnmarkForScheduling = (itemId: string) => {
    setSession(prev => ({
      ...prev,
      markedItems: new Set([...prev.markedItems].filter(id => id !== itemId))
    }));
  };

  const navigateGoals = (direction: 'next' | 'prev') => {
    setSession(prev => ({
      ...prev,
      currentGoalIndex: direction === 'next' 
        ? Math.min(prev.currentGoalIndex + 1, goals.length - 1)
        : Math.max(prev.currentGoalIndex - 1, 0)
    }));
  };

  const moveToStep = (step: PlanningSession['step']) => {
    setSession(prev => ({
      ...prev,
      step
    }));
  };

  const finishPlanning = () => {
    router.push('/planning');
  };

  // Loading state
  if (!goals.length) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="text-center">
          <p>Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Weekly Planning Session</h1>
        <p className="text-gray-600 mt-2">Review your goals, schedule activities, and plan your week</p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between items-center mb-8">
        {['review', 'mark', 'schedule'].map((step, index) => (
          <div 
            key={step}
            className={`flex items-center ${
              session.step === step ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center
              ${session.step === step ? 'bg-blue-100' : 'bg-gray-100'}
            `}>
              {index + 1}
            </div>
            <span className="ml-2 capitalize">{step}</span>
            {index < 2 && (
              <ArrowRight className="mx-4 text-gray-300" />
            )}
          </div>
        ))}
      </div>

      {/* Review Phase */}
      {session.step === 'review' && currentGoal && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{currentGoal.name}</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateGoals('prev')}
                disabled={session.currentGoalIndex === 0}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateGoals('next')}
                disabled={session.currentGoalIndex === goals.length - 1}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">{currentGoal.description}</p>

          <div className="space-y-4">
            {currentGoal.successCriteria?.map((criteria, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{criteria.text}</p>
                  {criteria.frequency && criteria.timescale && (
                    <p className="text-sm text-gray-500">
                      {criteria.frequency} times per {criteria.timescale}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const itemId = `${currentGoal.id}-${criteria.text}`;
                    if (session.markedItems.has(itemId)) {
                      handleUnmarkForScheduling(itemId);
                    } else {
                      handleMarkForScheduling(itemId);
                    }
                  }}
                >
                  {session.markedItems.has(`${currentGoal.id}-${criteria.text}`) ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marked
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Mark for Schedule
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button 
              onClick={() => moveToStep('mark')}
              disabled={session.markedItems.size === 0}
            >
              Continue to Scheduling ({session.markedItems.size} items)
            </Button>
          </div>
        </Card>
      )}

      {/* Mark Phase */}
      {session.step === 'mark' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Items to Schedule</h2>
          
          <div className="space-y-4">
            {Array.from(session.markedItems).map(itemId => {
              const [goalId, ...criteriaParts] = itemId.split('-');
              const criteriaText = criteriaParts.join('-');
              const goal = goals.find(g => g.id === goalId);
              
              return (
                <div key={itemId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">{goal?.name}</p>
                    <p className="font-medium">{criteriaText}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedItem({
                        id: itemId,
                        name: criteriaText
                      });
                      setScheduleDialogOpen(true);
                    }}
                  >
                    Schedule Now
                  </Button>
                </div>
              );
            })}

            {session.markedItems.size === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">All items have been scheduled!</p>
                <Button onClick={() => moveToStep('schedule')}>
                  View Weekly Schedule
                </Button>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => moveToStep('review')}>
              Back to Review
            </Button>
            {session.markedItems.size === 0 && (
              <Button onClick={() => moveToStep('schedule')}>
                View Weekly Schedule
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Schedule Phase */}
      {session.step === 'schedule' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Weekly Schedule</h2>
          <WeeklySchedule startDate={startOfWeek(selectedDate)} />
          
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => moveToStep('mark')}>
              Back to Items
            </Button>
            <Button onClick={finishPlanning}>
              Finish Planning
            </Button>
          </div>
        </Card>
      )}

      <ScheduleDialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        onSchedule={handleSchedule}
        itemName={selectedItem?.name || ''}
      />
    </div>
  );
} 