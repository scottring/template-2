'use client';

import { format } from 'date-fns';
import { CheckCircle2, Circle, ArrowUpRight } from 'lucide-react';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import useGoalStore from '@/lib/stores/useGoalStore';
import { Goal, SuccessCriteria } from '@/types/models';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

interface TodayScheduleProps {
  date: Date;
}

export function TodaySchedule({ date }: TodayScheduleProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { getTodayItems, completeItem, getStreak } = useItineraryStore();
  const { goals, fetchGoals } = useGoalStore();
  const items = getTodayItems(date);

  useEffect(() => {
    if (user?.householdId) {
      fetchGoals(user.householdId);
    }
  }, [fetchGoals, user?.householdId]);

  const handleComplete = async (itemId: string) => {
    if (!user) return;
    await completeItem(itemId, user.uid);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Today's Schedule</h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground">No items scheduled for today</p>
      ) : (
        <ul className="space-y-2">
          {items.map(item => {
            const goal = goals.find(g => g.id === item.referenceId);
            const criteria = goal?.successCriteria?.find(c => c.id === item.criteriaId);
            
            return (
              <li key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleComplete(item.id)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {item.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{goal?.name}</span>
                      {criteria && (
                        <span className="text-sm text-muted-foreground">
                          - {criteria.text}
                        </span>
                      )}
                    </div>
                    
                    {item.schedule.recurrence && (
                      <div className="text-sm text-muted-foreground">
                        Every {item.schedule.recurrence.frequency} {item.schedule.recurrence.interval}
                        {getStreak(item.id) > 0 && (
                          <span className="ml-2">
                            🔥 {getStreak(item.id)} day streak
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => router.push(`/goals/${goal?.id}`)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
} 