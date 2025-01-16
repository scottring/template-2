'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useGoalStore from "@/lib/stores/useGoalStore";
import useItineraryStore from "@/lib/stores/useItineraryStore";
import { ScheduleDialog } from "@/components/planning/ScheduleDialog";
import { SuccessCriteria } from "@/types/models";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from 'next/navigation';
import { CalendarIcon } from 'lucide-react';

interface CriteriaWithGoal {
  goalId: string;
  goalName: string;
  criteria: SuccessCriteria;
}

export function UnscheduledTasks() {
  const router = useRouter();
  const { user } = useAuth();
  const { goals, loading: goalsLoading } = useGoalStore();
  const { items: itineraryItems, addItem } = useItineraryStore();
  const [unscheduledCriteria, setUnscheduledCriteria] = useState<CriteriaWithGoal[]>([]);
  const [selectedCriteria, setSelectedCriteria] = useState<CriteriaWithGoal | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  useEffect(() => {
    if (!goals || !itineraryItems) return;

    // Find all tracked criteria that aren't scheduled
    const scheduledCriteriaIds = new Set(itineraryItems.map(item => item.criteriaId).filter(Boolean));
    
    const unscheduled = goals.flatMap(goal => {
      return (goal.successCriteria || [])
        .filter(criteria => 
          criteria.isTracked && 
          !scheduledCriteriaIds.has(criteria.id)
        )
        .map(criteria => ({
          goalId: goal.id,
          goalName: goal.name,
          criteria
        }));
    });

    setUnscheduledCriteria(unscheduled);
  }, [goals, itineraryItems]);

  const handleSchedule = (config: { schedules: Array<{ day: number; time: string }>; repeat: any }) => {
    if (!selectedCriteria || !user) return;

    addItem({
      type: 'task',
      referenceId: selectedCriteria.goalId,
      criteriaId: selectedCriteria.criteria.id,
      schedule: {
        startDate: new Date(),
        schedules: config.schedules,
        repeat: config.repeat
      },
      status: 'pending',
      notes: selectedCriteria.criteria.text,
      createdBy: user.uid,
      updatedBy: user.uid
    });

    setScheduleDialogOpen(false);
    setSelectedCriteria(null);
  };

  if (goalsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unscheduled Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedCriteria = unscheduledCriteria.slice(0, 5); // Show only first 5 items
  const hasMore = unscheduledCriteria.length > 5;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Unscheduled Tasks</CardTitle>
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/schedule')}
          >
            View All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {displayedCriteria.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No unscheduled tasks found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedCriteria.map(({ goalId, goalName, criteria }) => (
              <div 
                key={criteria.id} 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50"
              >
                <div>
                  <p className="font-medium">{goalName}</p>
                  <p className="text-sm text-muted-foreground">{criteria.text}</p>
                  {criteria.frequency && criteria.timescale && (
                    <p className="text-xs text-muted-foreground">
                      Target: {criteria.frequency} times per {criteria.timescale}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedCriteria({ goalId, goalName, criteria });
                    setScheduleDialogOpen(true);
                  }}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {selectedCriteria && (
        <ScheduleDialog
          open={scheduleDialogOpen}
          onClose={() => {
            setScheduleDialogOpen(false);
            setSelectedCriteria(null);
          }}
          onSchedule={handleSchedule}
          itemName={selectedCriteria.criteria.text}
        />
      )}
    </Card>
  );
} 