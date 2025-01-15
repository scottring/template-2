'use client';

import { format, addDays } from 'date-fns';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import { useGoalStore } from '@/lib/stores/useGoalStore';
import { Goal, ItineraryItem } from '@/types/models';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface HabitWithContext {
  id: string;
  name: string;
  description: string;
  frequency: {
    type: 'daily' | 'weekly' | 'monthly';
    value: number;
  };
  progress: {
    completed: number;
    total: number;
    lastUpdatedAt: Date;
  };
  streak: number;
  assignedTo: string[];
  createdAt: Date;
  updatedAt: Date;
  goal?: Goal;
  referenceId?: string;
}

export function ActiveHabits() {
  const router = useRouter();
  const { getActiveHabits } = useItineraryStore();
  const { goals, loadGoals } = useGoalStore();
  const habits = getActiveHabits();

  // Load goals on component mount
  useEffect(() => {
    const loadGoalsData = async () => {
      try {
        console.log('Loading goals...');
        await loadGoals();
        console.log('Goals loaded:', goals.map(g => ({ id: g.id, name: g.name })));
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    };
    loadGoalsData();
  }, []); // Only run on mount

  // Add goal context to each habit
  const habitsWithContext = habits.map(habit => {
    // For habits, we need to extract the goal ID from the habit ID
    const goalId = habit.id.split('-')[0];
    console.log('Looking for goal:', goalId, 'in goals:', goals.map(g => ({ id: g.id, name: g.name })));
    const goal = goals.find((g: Goal) => g.id === goalId);
    return { ...habit, goal, referenceId: goalId } as HabitWithContext;
  });

  const handleHabitClick = (habit: HabitWithContext) => {
    if (habit.goal?.id) {
      console.log('Navigating to goal:', habit.goal.id);
      router.push(`/goals/${habit.goal.id}`);
    } else {
      console.log('No goal found for habit:', { id: habit.id, referenceId: habit.referenceId }, 'Available goals:', goals.map(g => ({ id: g.id, name: g.name })));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Active Habits & Routines</h2>
      <div className="space-y-6">
        {habitsWithContext.map((habit) => (
          <div 
            key={habit.id} 
            className="space-y-2 p-3 rounded-md hover:bg-gray-50 cursor-pointer group"
            onClick={() => handleHabitClick(habit)}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium group-hover:text-blue-600">{habit.name}</span>
              <span className="text-sm text-orange-500">
                🔥 {habit.streak} day streak
              </span>
            </div>
            
            {habit.goal && (
              <p className="text-sm text-gray-500 group-hover:text-blue-500">
                Part of: {habit.goal.name}
              </p>
            )}

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