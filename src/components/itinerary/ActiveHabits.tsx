'use client';

import { format, addDays } from 'date-fns';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import useGoalStore from '@/lib/stores/useGoalStore';
import { Goal, ItineraryItem, TimeScale } from '@/types/models';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface HabitWithContext extends ItineraryItem {
  goal?: Goal;
  streak: number;
  progress: {
    completed: number;
    total: number;
    lastUpdatedAt: Date;
  };
  frequency: {
    type: TimeScale;
    value: number;
  };
}

export function ActiveHabits() {
  const router = useRouter();
  const { user } = useAuth();
  const { getActiveHabits, getStreak } = useItineraryStore();
  const { goals, fetchGoals } = useGoalStore();
  const habits = getActiveHabits();

  // Load goals on component mount
  useEffect(() => {
    const householdId = user?.householdId;
    if (!householdId) return;

    const loadGoalsData = async () => {
      try {
        await fetchGoals(householdId);
        console.log('Goals loaded:', goals.map(g => ({ id: g.id, name: g.name })));
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    };
    loadGoalsData();
  }, [fetchGoals, user?.householdId]);

  // Add goal context to each habit
  const habitsWithContext: HabitWithContext[] = habits.map(habit => {
    console.log('Processing habit:', { id: habit.id, referenceId: habit.referenceId });
    const goal = goals.find((g: Goal) => g.id === habit.referenceId);
    if (!goal) {
      console.log('No goal found for referenceId:', habit.referenceId);
    }
    return {
      ...habit,
      goal,
      streak: getStreak(habit.id),
      progress: {
        completed: 0, // TODO: Calculate from schedule/history
        total: habit.schedule.repeat === 'daily' ? 1 : 
               habit.schedule.repeat === 'weekly' ? 7 : 30,
        lastUpdatedAt: habit.updatedAt
      },
      frequency: {
        type: habit.schedule.repeat || 'weekly',
        value: 1
      }
    };
  });

  const handleHabitClick = (habit: HabitWithContext) => {
    if (habit.goal?.id) {
      console.log('Navigating to goal:', habit.goal.id);
      router.push(`/goals/${habit.goal.id}`);
    } else {
      console.log('No goal found for habit:', { id: habit.id, referenceId: habit.referenceId });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Active Habits & Routines</h2>
      <div className="space-y-6">
        {habitsWithContext.map((habit) => (
          <div 
            key={habit.id} 
            className="relative space-y-2 p-3 rounded-md hover:bg-gray-50 cursor-pointer group"
            onClick={() => handleHabitClick(habit)}
          >
            {/* Goal Context - Always show at the top */}
            {habit.goal ? (
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
                  {habit.goal.name}
                </p>
                <ArrowUpRight className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
              </div>
            ) : (
              <p className="text-sm text-gray-400">Unlinked Habit (ID: {habit.referenceId})</p>
            )}

            <div className="flex items-center gap-2">
              <span className="font-medium">{habit.notes}</span>
              <span className="text-sm text-orange-500">
                🔥 {habit.streak} day streak
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>
                Progress: {habit.progress.completed}/{habit.progress.total} this {habit.frequency.type}
              </span>
            </div>

            <div className="text-sm text-gray-500">
              {habit.progress.completed < habit.progress.total ? (
                <>
                  Next: {habit.progress.total - habit.progress.completed} more {
                    habit.frequency.type === 'daily' ? 'times today' :
                    habit.frequency.type === 'weekly' ? 'times this week' :
                    'times this month'
                  }
                </>
              ) : (
                <>
                  Next: {format(addDays(habit.progress.lastUpdatedAt, 1), 'E, MMM d')}
                </>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(habit.progress.completed / habit.progress.total) * 100}%`
                }}
              />
            </div>
          </div>
        ))}

        {habits.length === 0 && (
          <p className="text-gray-500 text-sm">
            No active habits or routines
          </p>
        )}
      </div>
    </div>
  );
} 