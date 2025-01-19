'use client';

import { useRouter } from "next/navigation";
import { useJourneyStore } from "@/lib/stores/useJourneyStore";
import { FlowPlanner } from "@/app/components/FlowPlanner";
import useGoalStore from "@/lib/stores/useGoalStore";
import useItineraryStore from "@/lib/stores/useItineraryStore";
import { useAuth } from "@/lib/hooks/useAuth";
import { TimeScale } from "@/types/models";

interface PlanningData {
  period: 'week' | 'month' | 'quarter';
  startDate: Date;
  endDate: Date;
  includedGoals: string[];
  scheduledTasks: {
    goalId: string;
    stepId: string;
    taskId: string;
    scheduledDate: Date;
    scheduledTime?: string;
  }[];
  habitSchedule: {
    goalId: string;
    stepId: string;
    weeklySchedule: {
      [key: string]: string[]; // day -> times
    };
  }[];
}

const dayMap: { [key: string]: number } = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6
};

export default function PlanningPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { startPlanning } = useJourneyStore();
  const { goals } = useGoalStore();
  const { addItem } = useItineraryStore();

  const handleComplete = async (data: PlanningData) => {
    if (!user?.householdId) return;

    startPlanning(data.startDate);

    // Save habits
    for (const habit of data.habitSchedule) {
      const schedules = Object.entries(habit.weeklySchedule)
        .filter(([_, times]) => times.length > 0)
        .flatMap(([day, times]) => 
          times.map(time => ({
            day: dayMap[day.toLowerCase()],
            time
          }))
        );

      if (schedules.length > 0) {
        const goal = goals.find(g => g.id === habit.goalId);
        const step = goal?.steps.find(s => s.id === habit.stepId);
        
        await addItem({
          type: 'habit',
          referenceId: habit.goalId,
          stepId: habit.stepId,
          status: 'pending',
          householdId: user.householdId,
          createdBy: user.uid,
          updatedBy: user.uid,
          notes: step?.text || '',
          schedule: {
            startDate: data.startDate,
            schedules,
            repeat: 'weekly' as TimeScale,
            endDate: data.endDate
          }
        });
      }
    }

    // Save tasks
    for (const task of data.scheduledTasks) {
      const goal = goals.find(g => g.id === task.goalId);
      const step = goal?.steps.find(s => s.id === task.stepId);

      await addItem({
        type: 'tangible',
        referenceId: task.goalId,
        stepId: task.stepId,
        status: 'pending',
        householdId: user.householdId,
        createdBy: user.uid,
        updatedBy: user.uid,
        notes: step?.text || '',
        schedule: {
          startDate: task.scheduledDate,
          schedules: task.scheduledTime ? [{ day: 0, time: task.scheduledTime }] : [],
          repeat: undefined
        }
      });
    }

    router.push('/dashboard');
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  return (
    <div className="container mx-auto py-8">
      <FlowPlanner 
        goals={goals} 
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
} 