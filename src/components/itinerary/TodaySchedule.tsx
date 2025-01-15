'use client';

import { format } from 'date-fns';
import { CheckCircle2, Circle, ArrowUpRight } from 'lucide-react';
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
        await loadGoals();
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    };
    loadGoalsData();
  }, []); // Only run on mount

  // Get goal information for each item
  const itemsWithContext = items.map(item => {
    const goal = item.referenceId ? goals.find((g: Goal) => g.id === item.referenceId) : null;
    const criteria = goal?.successCriteria.find((c: SuccessCriteria) => 
      c.text === item.notes && c.isTracked && c.timescale === item.timescale
    );
    return { ...item, goal, criteria };
  });

  const handleItemClick = (item: any, e: React.MouseEvent) => {
    // Don't navigate if clicking the complete button
    if ((e.target as HTMLElement).closest('button')) return;
    
    if (item.goal?.id) {
      router.push(`/goals/${item.goal.id}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Today's Schedule ({format(date, 'MMM d')})
        </h2>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to clear all itinerary items? This cannot be undone.')) {
              useItineraryStore.getState().clearAllItems();
            }
          }}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Clear All Items
        </button>
      </div>
      <div className="space-y-4">
        {itemsWithContext.map((item) => (
          <div
            key={item.id}
            onClick={(e) => handleItemClick(item, e)}
            className="relative flex items-start gap-3 p-3 rounded-md hover:bg-gray-50 cursor-pointer group"
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
              {/* Goal Context - Always show at the top */}
              {item.goal ? (
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-blue-600 group-hover:text-blue-700">
                    {item.goal.name}
                  </p>
                  <ArrowUpRight className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                </div>
              ) : (
                <p className="text-sm text-gray-400 mb-1">Unlinked Item</p>
              )}

              <div className="flex items-center gap-2">
                <span className="font-medium">{item.notes}</span>
                {item.type === 'habit' && (
                  <span className="text-sm text-orange-500">
                    🔥 {getStreak(item.id)} day streak
                  </span>
                )}
              </div>

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