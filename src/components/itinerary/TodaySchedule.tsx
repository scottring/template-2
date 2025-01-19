'use client';

import { format } from 'date-fns';
import { CheckCircle2, Circle, ArrowUpRight } from 'lucide-react';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import useGoalStore from '@/lib/stores/useGoalStore';
import { Goal, Step } from '@/types/models';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

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
      <h2 className="text-lg font-semibold">Today&apos;s Schedule</h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground">
          You don&apos;t have any activities scheduled for today.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map(item => {
            const goal = goals.find(g => g.id === item.referenceId);
            const step = goal?.steps?.find(s => s.id === item.stepId);
            
            return (
              <li key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={item.status === 'completed'}
                    onCheckedChange={(checked) => {
                      if (checked && user) {
                        completeItem(item.id, user.uid);
                      }
                    }}
                  />
                  <div>
                    <p className="font-medium">{step?.text || item.notes}</p>
                    {goal && (
                      <Link 
                        href={`/goals/${goal.id}`}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        {goal.name}
                      </Link>
                    )}
                  </div>
                </div>
                {item.schedule?.schedules.map(schedule => (
                  <span key={`${schedule.day}-${schedule.time}`} className="text-sm text-muted-foreground">
                    {schedule.time}
                  </span>
                ))}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
} 