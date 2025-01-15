'use client';

import { useState, useEffect } from 'react';
import useGoalStore from '@/lib/stores/useGoalStore';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import { format, startOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WeeklySchedule } from '@/components/planning/WeeklySchedule';
import { ScheduleDialog } from '@/components/planning/ScheduleDialog';
import { ItineraryItem, Goal, TimeScale } from '@/types/models';
import { Trash2, CalendarIcon, CheckCircle, ChevronDown, ChevronRight, ArrowRight, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlanningSession {
  step: 'review' | 'schedule';
  currentGoalIndex: number;
  markedItems: Set<string>;
  reviewedItems: Set<string>;
  successItems: Set<string>;
  failureItems: Set<string>;
  ongoingItems: Set<string>;
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
    currentGoalIndex: 0,
    markedItems: new Set(),
    reviewedItems: new Set(),
    successItems: new Set(),
    failureItems: new Set(),
    ongoingItems: new Set(),
  });

  const { goals, loadGoals, updateGoal } = useGoalStore();
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
    if (selectedItem && session.markedItems.has(selectedItem.id)) {
      // Convert the new schedule format to the old format
      const schedule: ItineraryItem['schedule'] = {
        schedules: scheduleConfig.schedules,
        repeat: scheduleConfig.repeat
      };

      updateItemSchedule(selectedItem.id, schedule);
      setSession(prev => ({
        ...prev,
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
    setSession(prev => {
      const newMarkedItems = new Set(prev.markedItems);
      newMarkedItems.delete(itemId);
      return {
        ...prev,
        markedItems: newMarkedItems
      };
    });
  };

  const navigateGoals = (direction: 'next' | 'prev') => {
    setSession(prev => ({
      ...prev,
      currentGoalIndex: direction === 'next' 
        ? Math.min(prev.currentGoalIndex + 1, goals.length - 1)
        : Math.max(prev.currentGoalIndex - 1, 0)
    }));
  };

  const moveToStep = (step: 'review' | 'schedule') => {
    setSession(prev => ({
      ...prev,
      step
    }));
  };

  const finishPlanning = () => {
    router.push('/planning');
  };

  const isAllCriteriaReviewed = () => {
    if (!currentGoal?.successCriteria) return true;
    return currentGoal.successCriteria.every(criteria => {
      const itemId = `${currentGoal.id}-${criteria.text}`;
      return session.reviewedItems.has(itemId);
    });
  };

  const handleSuccess = async (goalId: string, criteriaText: string) => {
    const itemId = `${goalId}-${criteriaText}`;
    setSession(prev => {
      const newSession = { ...prev };
      newSession.successItems.add(itemId);
      newSession.failureItems.delete(itemId);
      newSession.ongoingItems.delete(itemId);
      newSession.reviewedItems.add(itemId);
      newSession.markedItems.delete(itemId);
      return newSession;
    });

    // Update goal progress
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const totalCriteria = goal.successCriteria.length;
      const successCount = goal.successCriteria.filter(c => 
        session.successItems.has(`${goalId}-${c.text}`)
      ).length;
      const newProgress = Math.round((successCount / totalCriteria) * 100);
      
      await updateGoal(goalId, { progress: newProgress });
    }
  };

  const handleFailure = async (goalId: string, criteriaText: string) => {
    const itemId = `${goalId}-${criteriaText}`;
    setSession(prev => {
      const newSession = { ...prev };
      newSession.failureItems.add(itemId);
      newSession.successItems.delete(itemId);
      newSession.ongoingItems.delete(itemId);
      newSession.reviewedItems.add(itemId);
      newSession.markedItems.delete(itemId);
      return newSession;
    });

    // Update goal progress
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const totalCriteria = goal.successCriteria.length;
      const successCount = goal.successCriteria.filter(c => 
        session.successItems.has(`${goalId}-${c.text}`)
      ).length;
      const newProgress = Math.round((successCount / totalCriteria) * 100);
      
      await updateGoal(goalId, { progress: newProgress });
    }
  };

  const handleOngoing = (goalId: string, criteriaText: string) => {
    const itemId = `${goalId}-${criteriaText}`;
    setSession(prev => {
      const newSession = { ...prev };
      newSession.ongoingItems.add(itemId);
      newSession.successItems.delete(itemId);
      newSession.failureItems.delete(itemId);
      newSession.reviewedItems.add(itemId);
      newSession.markedItems.add(itemId);
      return newSession;
    });
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
                disabled={session.currentGoalIndex === goals.length - 1 || !isAllCriteriaReviewed()}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">{currentGoal.description}</p>

          <div className="space-y-4">
            {currentGoal.successCriteria?.map((criteria, index) => {
              const itemId = `${currentGoal.id}-${criteria.text}`;
              const isReviewed = session.reviewedItems.has(itemId);
              const isSuccess = session.successItems.has(itemId);
              const isFailure = session.failureItems.has(itemId);
              const isOngoing = session.ongoingItems.has(itemId);
              const isMarkedForSchedule = session.markedItems.has(itemId);

              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{criteria.text}</p>
                    {criteria.frequency && criteria.timescale && (
                      <p className="text-sm text-gray-500">
                        {criteria.frequency} times per {criteria.timescale}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={isSuccess ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSuccess(currentGoal.id, criteria.text)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Success & Close
                    </Button>
                    <Button
                      variant={isFailure ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => handleFailure(currentGoal.id, criteria.text)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Failed & Close
                    </Button>
                    <Button
                      variant={isOngoing ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleOngoing(currentGoal.id, criteria.text)}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Ongoing & Continue
                    </Button>
                    {isReviewed && !isSuccess && !isFailure && (
                      <Button
                        variant={isMarkedForSchedule ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (isMarkedForSchedule) {
                            handleUnmarkForScheduling(itemId);
                          } else {
                            handleMarkForScheduling(itemId);
                          }
                        }}
                      >
                        {isMarkedForSchedule ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marked
                          </>
                        ) : (
                          <>
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Schedule
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => setSession(prev => ({ ...prev, step: 'schedule' }))}
              disabled={!isAllCriteriaReviewed() || !session.markedItems.size}
            >
              Continue to Scheduling
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Schedule Phase */}
      {session.step === 'schedule' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Schedule Items</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveToStep('review')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Review
            </Button>
          </div>

          <div className="space-y-4 mb-6">
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
          </div>

          <WeeklySchedule startDate={startOfWeek(selectedDate)} />
          
          <div className="mt-6 flex justify-end">
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