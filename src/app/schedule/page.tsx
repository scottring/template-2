'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useGoalStore from "@/lib/stores/useGoalStore";
import useItineraryStore from "@/lib/stores/useItineraryStore";
import { ScheduleDialog, ScheduleConfig } from "@/components/planning/ScheduleDialog";
import { Goal, SuccessCriteria } from "@/types/models";
import { useAuth } from "@/lib/hooks/useAuth";

interface CriteriaWithGoal {
  goalId: string;
  goalName: string;
  criteria: SuccessCriteria;
}

export default function QuickSchedulePage() {
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

  const handleSchedule = (config: ScheduleConfig) => {
    if (!selectedCriteria || !user) return;

    addItem({
      type: 'task',
      referenceId: selectedCriteria.goalId,
      criteriaId: selectedCriteria.criteria.id,
      schedule: {
        startDate: new Date(),
        schedules: config.schedules,
        repeat: config.repeat === 'none' ? undefined : config.repeat,
        endDate: config.endDate
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
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quick Schedule</h1>
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
        >
          Back
        </Button>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Unscheduled Success Criteria</h2>
        {unscheduledCriteria.length === 0 ? (
          <p className="text-gray-500">No unscheduled success criteria found</p>
        ) : (
          <ul className="space-y-4">
            {unscheduledCriteria.map(({ goalId, goalName, criteria }) => (
              <li 
                key={criteria.id} 
                className="border-b pb-4 last:border-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{goalName}</h3>
                    <p className="text-gray-600">{criteria.text}</p>
                    {criteria.frequency && criteria.timescale && (
                      <p className="text-sm text-gray-500">
                        {criteria.frequency} times per {criteria.timescale}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedCriteria({ goalId, goalName, criteria });
                      setScheduleDialogOpen(true);
                    }}
                  >
                    Schedule
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {selectedCriteria && (
        <ScheduleDialog
          open={scheduleDialogOpen}
          onClose={() => {
            setScheduleDialogOpen(false);
            setSelectedCriteria(null);
          }}
          onSchedule={handleSchedule}
          itemName={selectedCriteria.criteria.text}
          targetDate={goals.find(g => g.id === selectedCriteria.goalId)?.targetDate}
        />
      )}
    </div>
  );
} 