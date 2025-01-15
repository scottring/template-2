'use client';

import { format } from 'date-fns';
import useItineraryStore from '@/lib/stores/useItineraryStore';

export function ActiveHabits() {
  const { getActiveHabits, getProgress } = useItineraryStore();
  const habits = getActiveHabits();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Active Habits & Routines</h2>
      <div className="space-y-6">
        {habits.map((habit) => (
          <div key={habit.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{habit.name}</span>
              <span className="text-sm text-orange-500">
                🔥 {habit.streak} {habit.frequency.type}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>
                Progress: {habit.progress.completed}/{habit.progress.total} this {habit.frequency.type}
              </span>
            </div>

            <div className="text-sm text-gray-500">
              Next: {habit.progress.completed < habit.progress.total ? 'Flexible - ' : ''}
              {habit.progress.completed < habit.progress.total
                ? `${habit.progress.total - habit.progress.completed} more ${habit.frequency.type === 'daily' ? 'times today' : 'sessions needed'}`
                : format(habit.progress.lastUpdatedAt, 'E, MMM d @ h:mm a')}
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