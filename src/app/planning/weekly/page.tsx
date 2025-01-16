'use client';

import { useRouter } from "next/navigation";
import { useJourneyStore } from "@/lib/stores/useJourneyStore";
import useGoalStore from "@/lib/stores/useGoalStore";
import { useAuth } from "@/lib/hooks/useAuth";
import useItineraryStore from "@/lib/stores/useItineraryStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle, CalendarIcon } from "lucide-react";
import { ScheduleDialog } from "@/components/planning/ScheduleDialog";
import { useState, useEffect } from "react";
import type { Schedule, Goal, SuccessCriteria, TimeScale } from "@/types/models";

interface SelectedItem {
  id: string;
  name: string;
}

export default function WeeklyPlanningPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { goals, fetchGoals, updateGoal } = useGoalStore();
  const { updateItemSchedule, updateCriteriaStatus } = useItineraryStore();
  const { 
    currentSession, 
    updateSession,
    nextPlanningStep,
    planningStep
  } = useJourneyStore();

  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.householdId) {
      fetchGoals(user.householdId);
    }
  }, [fetchGoals, user?.householdId]);

  // Redirect if no active session
  useEffect(() => {
    if (!currentSession) {
      router.push('/planning');
    }
  }, [currentSession, router]);

  const handleSchedule = (scheduleConfig: { schedules: Array<{ day: number; time: string }>; repeat: TimeScale }) => {
    if (selectedItem && currentSession?.markedItems.has(selectedItem.id)) {
      // Convert the new schedule format to the old format
      const schedule: Schedule = {
        startDate: new Date(),
        schedules: scheduleConfig.schedules,
        repeat: scheduleConfig.repeat
      };

      updateItemSchedule(selectedItem.id, schedule);
      updateSession({
        markedItems: new Set(Array.from(currentSession.markedItems).filter(id => id !== selectedItem.id))
      });
    
      // If all marked items are scheduled, move to next step
      if (currentSession.markedItems.size === 1) { // Since we just removed one
        nextPlanningStep();
        router.push('/planning/complete');
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

  const handleSuccess = async (goalId: string, criteriaText: string) => {
    const itemId = `${goalId}-${criteriaText}`;
    if (!currentSession) return;

    await updateCriteriaStatus(itemId, 'completed');
    updateSession({
      successItems: new Set([...currentSession.successItems, itemId]),
      failureItems: new Set(Array.from(currentSession.failureItems).filter(id => id !== itemId)),
      ongoingItems: new Set(Array.from(currentSession.ongoingItems).filter(id => id !== itemId)),
      reviewedItems: new Set([...currentSession.reviewedItems, itemId])
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

  const handleBack = () => {
    router.push('/planning/review-goals');
  };

  const handleNext = () => {
    nextPlanningStep();
    router.push('/planning/schedule');
  };

  if (!currentSession || !goals.length) {
    return null;
  }

  const currentGoal = goals[currentSession.currentGoalIndex];

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Weekly Planning</h1>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNext}>
            Next Step
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">{currentGoal.name}</h2>
          <p className="text-gray-600 mt-2">{currentGoal.description}</p>
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

                {isOngoing && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (isMarked) {
                          handleUnmarkForScheduling(itemId);
                        } else {
                          handleMarkForScheduling(itemId);
                        }
                      }}
                    >
                      {isMarked ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marked for Schedule
                        </>
                      ) : (
                        <>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Mark for Schedule
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <ScheduleDialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        onSchedule={handleSchedule}
        itemName={selectedItem?.name || ''}
      />
    </div>
  );
} 