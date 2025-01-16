'use client';

import { useState, useEffect } from 'react';
import useGoalStore from '@/lib/stores/useGoalStore';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import usePlanningStore from '@/lib/stores/usePlanningStore';
import { format, startOfWeek, addDays, isBefore, isAfter } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WeeklySchedule } from '@/components/planning/WeeklySchedule';
import { ScheduleDialog } from '@/components/planning/ScheduleDialog';
import { ItineraryItem, Goal, TimeScale, Schedule } from '@/types/models';
import { CriteriaInstance } from '@/types/planning';
import { Trash2, CalendarIcon, CheckCircle, ChevronDown, ChevronRight, ArrowRight, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ScheduleConfig {
  schedules: Array<{ day: number; time: string }>;
  repeat: TimeScale;
}

interface PlanningPeriodSelectorProps {
  regularStartDate: Date;
  actualStartDate: Date;
  onPeriodSelect: (useRegularStart: boolean) => void;
  carryoverInstances: Map<string, CriteriaInstance[]>;
  onCarryoverConfirm: (criteriaId: string, instanceId: string, isConfirmed: boolean) => void;
}

function PlanningPeriodSelector({
  regularStartDate,
  actualStartDate,
  onPeriodSelect,
  carryoverInstances,
  onCarryoverConfirm
}: PlanningPeriodSelectorProps) {
  const [selectedOption, setSelectedOption] = useState<'regular' | 'actual'>('regular');
  
  const handleOptionChange = (value: string) => {
    const option = value as 'regular' | 'actual';
    setSelectedOption(option);
    onPeriodSelect(option === 'regular');
  };

  const daysLate = Math.floor((actualStartDate.getTime() - regularStartDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Select Planning Period</h2>
      {daysLate > 0 && (
        <p className="text-amber-600 mb-4">
          This meeting is {daysLate} days late from your regular schedule
        </p>
      )}
      
      <RadioGroup
        value={selectedOption}
        onValueChange={handleOptionChange}
        className="space-y-4 mb-6"
      >
        <div className="flex items-start space-x-3">
          <RadioGroupItem value="regular" id="regular" />
          <div className="grid gap-1.5">
            <Label htmlFor="regular">
              Start from regular day ({format(regularStartDate, 'EEEE, MMM d')})
            </Label>
            <p className="text-sm text-muted-foreground">
              Maintain your regular weekly schedule
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <RadioGroupItem value="actual" id="actual" />
          <div className="grid gap-1.5">
            <Label htmlFor="actual">
              Start from today ({format(actualStartDate, 'EEEE, MMM d')})
            </Label>
            <p className="text-sm text-muted-foreground">
              Adjust schedule to start from today
            </p>
          </div>
        </div>
      </RadioGroup>

      {carryoverInstances.size > 0 && (
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Previous Week Activities</h3>
          <div className="space-y-3">
            {Array.from(carryoverInstances.entries()).map(([criteriaId, instances]) => (
              <div key={criteriaId} className="p-3 bg-gray-50 rounded-lg">
                {instances.map((instance, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <p className="text-sm">{format(instance.date, 'EEEE')}: {instance.criteriaId}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={instance.isConfirmed ? "default" : "outline"}
                        onClick={() => onCarryoverConfirm(criteriaId, idx.toString(), !instance.isConfirmed)}
                      >
                        {instance.isConfirmed ? "Confirmed" : "Count for new week?"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

interface ScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (scheduleConfig: ScheduleConfig) => void;
  itemName: string;
}

export default function WeeklyPlanningPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    name: string;
    frequency?: { value: number; type: any; };
  } | null>(null);

  const { goals, fetchGoals: loadGoals, updateGoal } = useGoalStore();
  const { getActiveHabits, updateItemSchedule } = useItineraryStore();
  const { 
    currentSession,
    currentPeriod,
    initializeSession,
    updateSession,
    confirmCarryover,
    updateCriteriaStatus,
    startNewPeriod,
    completePeriod
  } = usePlanningStore();

  // Load goals and initialize session when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (user?.householdId) {
        await loadGoals(user.householdId);
        const today = new Date();
        const regularStart = startOfWeek(today);
        await initializeSession(regularStart, today);
      }
    };
    loadData().catch(error => {
      console.error('Error loading data:', error);
    });
  }, [loadGoals, user?.householdId, initializeSession]);

  const handleSchedule = (scheduleConfig: ScheduleConfig) => {
    if (selectedItem && currentSession?.markedItems.has(selectedItem.id)) {
      // Convert the new schedule format to the old format
      const schedule: Schedule = {
        startDate: new Date(),
        schedules: scheduleConfig.schedules,
        repeat: scheduleConfig.repeat
      };

      updateItemSchedule(selectedItem.id, schedule);
      if (currentSession) {
        updateSession({
          markedItems: new Set(Array.from(currentSession.markedItems).filter(id => id !== selectedItem.id))
        });
      
        // If all marked items are scheduled, move to schedule view
        if (currentSession.markedItems.size === 1) { // Since we just removed one
          moveToStep('schedule');
        }
      }
      setScheduleDialogOpen(false);
    }
  };

  const handleMarkForScheduling = (itemId: string) => {
    if (currentSession) {
      updateSession({
        markedItems: new Set([...currentSession.markedItems, itemId])
      });
    }
  };

  const handleUnmarkForScheduling = (itemId: string) => {
    if (currentSession) {
      updateSession({
        markedItems: new Set(Array.from(currentSession.markedItems).filter(id => id !== itemId))
      });
    }
  };

  const navigateGoals = (direction: 'next' | 'prev') => {
    if (currentSession) {
      updateSession({
        currentGoalIndex: direction === 'next' 
          ? Math.min(currentSession.currentGoalIndex + 1, goals.length - 1)
          : Math.max(currentSession.currentGoalIndex - 1, 0)
      });
    }
  };

  const moveToStep = (step: 'review' | 'schedule') => {
    if (currentSession) {
      updateSession({ step });
    }
  };

  const finishPlanning = async () => {
    await completePeriod();
    router.push('/planning');
  };

  const handleSuccess = async (goalId: string, criteriaText: string) => {
    const itemId = `${goalId}-${criteriaText}`;
    if (!currentSession) return;

    await updateCriteriaStatus(itemId, 'completed');
    updateSession({
      successItems: new Set([...currentSession.successItems, itemId]),
      failureItems: new Set(Array.from(currentSession.failureItems).filter(id => id !== itemId)),
      ongoingItems: new Set(Array.from(currentSession.ongoingItems).filter(id => id !== itemId)),
      reviewedItems: new Set([...currentSession.reviewedItems, itemId]),
      markedItems: new Set(Array.from(currentSession.markedItems).filter(id => id !== itemId))
    });

    // Update goal progress
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const totalCriteria = goal.successCriteria.length;
      const successCount = goal.successCriteria.filter(c => 
        currentSession.successItems.has(`${goalId}-${c.text}`)
      ).length;
      const newProgress = Math.round((successCount / totalCriteria) * 100);
      
      await updateGoal(goalId, { progress: newProgress });
    }
  };

  const handleFailure = async (goalId: string, criteriaText: string) => {
    const itemId = `${goalId}-${criteriaText}`;
    if (!currentSession) return;

    await updateCriteriaStatus(itemId, 'cancelled');
    updateSession({
      failureItems: new Set([...currentSession.failureItems, itemId]),
      successItems: new Set(Array.from(currentSession.successItems).filter(id => id !== itemId)),
      ongoingItems: new Set(Array.from(currentSession.ongoingItems).filter(id => id !== itemId)),
      reviewedItems: new Set([...currentSession.reviewedItems, itemId]),
      markedItems: new Set(Array.from(currentSession.markedItems).filter(id => id !== itemId))
    });

    // Update goal progress
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const totalCriteria = goal.successCriteria.length;
      const successCount = goal.successCriteria.filter(c => 
        currentSession.successItems.has(`${goalId}-${c.text}`)
      ).length;
      const newProgress = Math.round((successCount / totalCriteria) * 100);
      
      await updateGoal(goalId, { progress: newProgress });
    }
  };

  const handleOngoing = async (goalId: string, criteriaText: string) => {
    const itemId = `${goalId}-${criteriaText}`;
    if (!currentSession) return;
    
    await updateCriteriaStatus(itemId, 'ongoing');
    
    // Get confirmed carryover instances
    const carryoverInstances = currentSession.carryoverInstances.get(itemId) || [];
    const confirmedInstances = carryoverInstances.filter(i => i.isConfirmed);
    
    updateSession({
      ongoingItems: new Set([...currentSession.ongoingItems, itemId]),
      successItems: new Set(Array.from(currentSession.successItems).filter(id => id !== itemId)),
      failureItems: new Set(Array.from(currentSession.failureItems).filter(id => id !== itemId)),
      reviewedItems: new Set([...currentSession.reviewedItems, itemId]),
      markedItems: new Set([...currentSession.markedItems, itemId])
    });
  };

  const handlePeriodSelect = async (useRegularStart: boolean) => {
    if (!currentSession) return;
    
    const startDate = useRegularStart ? currentSession.regularStartDate : currentSession.actualStartDate;
    await startNewPeriod(startDate, 'weekly');
    
    updateSession({
      actualStartDate: startDate
    });
  };

  // Loading state
  if (!goals.length || !currentSession) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="text-center">
          <p>Loading goals...</p>
        </div>
      </div>
    );
  }

  const currentGoal = goals[currentSession.currentGoalIndex];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Weekly Planning Session</h1>
        <p className="text-gray-600 mt-2">Review your goals, schedule activities, and plan your week</p>
      </div>

      {/* Show period selector before the steps if we're just starting */}
      {currentSession.step === 'review' && currentSession.currentGoalIndex === 0 && (
        <PlanningPeriodSelector
          regularStartDate={currentSession.regularStartDate}
          actualStartDate={currentSession.actualStartDate}
          onPeriodSelect={handlePeriodSelect}
          carryoverInstances={currentSession.carryoverInstances}
          onCarryoverConfirm={confirmCarryover}
        />
      )}

      {/* Progress Steps */}
      <div className="flex justify-between items-center mb-8">
        {['review', 'schedule'].map((step, index) => (
          <div 
            key={step}
            className={`flex items-center ${
              currentSession.step === step ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center
              ${currentSession.step === step ? 'bg-blue-100' : 'bg-gray-100'}
            `}>
              {index + 1}
            </div>
            <span className="ml-2 capitalize">{step}</span>
            {index < 1 && (
              <ArrowRight className="mx-4 text-gray-300" />
            )}
          </div>
        ))}
      </div>

      {/* Review Phase */}
      {currentSession.step === 'review' && currentGoal && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{currentGoal.name}</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateGoals('prev')}
                disabled={currentSession.currentGoalIndex === 0}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateGoals('next')}
                disabled={currentSession.currentGoalIndex === goals.length - 1}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {currentGoal.successCriteria.map((criteria, index) => {
              const itemId = `${currentGoal.id}-${criteria.text}`;
              const isReviewed = currentSession.reviewedItems.has(itemId);
              const isSuccess = currentSession.successItems.has(itemId);
              const isFailure = currentSession.failureItems.has(itemId);
              const isOngoing = currentSession.ongoingItems.has(itemId);
              const isMarked = currentSession.markedItems.has(itemId);

              return (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="font-medium">{criteria.text}</p>
                      {criteria.frequency && (
                        <p className="text-sm text-gray-500">
                          Target: {criteria.frequency} times per {criteria.timescale}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={isSuccess ? "default" : "outline"}
                        onClick={() => handleSuccess(currentGoal.id, criteria.text)}
                      >
                        Success & Close
                      </Button>
                      <Button
                        size="sm"
                        variant={isFailure ? "default" : "outline"}
                        onClick={() => handleFailure(currentGoal.id, criteria.text)}
                      >
                        Failed & Close
                      </Button>
                      <Button
                        size="sm"
                        variant={isOngoing ? "default" : "outline"}
                        onClick={() => handleOngoing(currentGoal.id, criteria.text)}
                      >
                        Ongoing & Continue
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-between">
            {currentSession.currentGoalIndex === goals.length - 1 && (
              <Button onClick={() => moveToStep('schedule')}>
                View Weekly Schedule
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Schedule Phase */}
      {currentSession.step === 'schedule' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Weekly Schedule</h2>
          <WeeklySchedule startDate={currentSession.actualStartDate} />
          
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => moveToStep('review')}>
              Back to Review
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