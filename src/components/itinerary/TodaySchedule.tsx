'use client';

import { format } from 'date-fns';
import { CheckCircle2, Circle } from 'lucide-react';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import { useGoalStore } from '@/lib/stores/useGoalStore';
import { Goal, SuccessCriteria } from '@/types/models';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface TodayScheduleProps {
  date: Date;
}

export function TodaySchedule({ date }: TodayScheduleProps) {
  const router = useRouter();
  const { getTodayItems, completeItem, getStreak } = useItineraryStore();
  const { goals, loadGoals } = useGoalStore();
  const items = getTodayItems(date);

  // Load goals on component mount
  useEffect(() => {
    const loadGoalsData = async () => {
      try {
        console.log('Loading goals...');
        await loadGoals();
        console.log('Goals loaded:', goals);
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    };
    loadGoalsData();
  }, []); // Only run on mount

  // Get goal information for each item
  const itemsWithContext = items.map(item => {
    // For habits, the referenceId is the goalId
    const goalId = item.type === 'habit' ? item.referenceId : null;
    console.log('Looking for goal:', goalId, 'in goals:', goals);
    const goal = goalId ? goals.find((g: Goal) => g.id === goalId) : null;
    const criteria = goal?.successCriteria.find((c: SuccessCriteria) => 
      c.text === item.notes && c.isTracked && c.timescale === item.timescale
    );
    return { ...item, goal, criteria };
  });

  const handleItemClick = (item: any, e: React.MouseEvent) => {
    // Don't navigate if clicking the complete button
    if ((e.target as HTMLElement).closest('button')) return;
    
    if (item.goal?.id) {
      console.log('Navigating to goal:', item.goal.id);
      router.push(`/goals/${item.goal.id}`);
    } else {
      console.log('No goal found for item:', item, 'Available goals:', goals);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">
        Today's Schedule ({format(date, 'MMM d')})
      </h2>
      <div className="space-y-4">
        {itemsWithContext.map((item) => (
          <div
            key={item.id}
            onClick={(e) => handleItemClick(item, e)}
            className="flex items-start gap-3 p-3 rounded-md hover:bg-gray-50 cursor-pointer group"
          >
            <button 
              className="mt-1 text-gray-400 hover:text-green-500"
              onClick={(e) => {
                e.stopPropagation(); // Prevent the parent click handler
                completeItem(item.id, item.status !== 'completed');
              }}
            >
              {item.status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium group-hover:text-blue-600">{item.notes}</span>
                {item.type === 'habit' && (
                  <span className="text-sm text-orange-500">
                    🔥 {getStreak(item.id)} day streak
                  </span>
                )}
              </div>
              
              {item.goal && (
                <p className="text-sm text-gray-500 group-hover:text-blue-500">
                  Part of: {item.goal.name}
                </p>
              )}

              {item.type === 'habit' && item.timescale && (
                <p className="text-sm text-gray-500">
                  {item.timescale === 'daily' ? 'Daily habit' :
                   item.timescale === 'weekly' ? 'Weekly habit' :
                   'Monthly habit'}
                </p>
              )}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-gray-500 text-sm">
            No items scheduled for today
          </p>
        )}
      </div>
    </div>
  );
} 