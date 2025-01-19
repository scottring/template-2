import React, { useEffect, useState } from 'react';
import { useJourneyStore } from '@/lib/stores/useJourneyStore';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import useGoalStore from '@/lib/stores/useGoalStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { ItineraryItem, Schedule } from '@/types/models';
import { CheckCircle2, XCircle } from 'lucide-react';

interface WeeklyReviewProps {
  onComplete: () => void;
  selectedDate: Date;
}

interface ReviewStats {
  totalHabits: number;
  completedHabits: number;
  totalTasks: number;
  completedTasks: number;
}

export function WeeklyReview({ onComplete, selectedDate }: WeeklyReviewProps) {
  const { user } = useAuth();
  const { items, loadItems, updateItem } = useItineraryStore();
  const { goals, fetchGoals } = useGoalStore();
  const { weeklyMeeting, markWeeklyReviewComplete } = useJourneyStore();
  
  const [loading, setLoading] = useState(true);
  const [weekStart] = useState(() => startOfWeek(selectedDate));
  const [weekEnd] = useState(() => endOfWeek(selectedDate));
  const [reviewItems, setReviewItems] = useState<{
    habits: ItineraryItem[];
    tasks: ItineraryItem[];
  }>({ habits: [], tasks: [] });
  
  const [stats, setStats] = useState<ReviewStats>({
    totalHabits: 0,
    completedHabits: 0,
    totalTasks: 0,
    completedTasks: 0
  });
  
  useEffect(() => {
    const householdId = user?.householdId;
    if (householdId) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([
          loadItems(householdId),
          fetchGoals(householdId)
        ]);
        setLoading(false);
      };
      loadData();
    }
  }, [user?.householdId, loadItems, fetchGoals]);
  
  useEffect(() => {
    // Filter items for the past week
    const habits = items.filter(item => 
      item.type === 'habit' &&
      item.createdAt >= weekStart &&
      item.createdAt <= weekEnd
    );
    
    const tasks = items.filter(item => 
      item.type === 'tangible' &&
      item.createdAt >= weekStart &&
      item.createdAt <= weekEnd
    );
    
    setReviewItems({ habits, tasks });
    
    // Calculate stats
    setStats({
      totalHabits: habits.length,
      completedHabits: habits.filter(h => h.status === 'completed').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length
    });
  }, [items, weekStart, weekEnd]);
  
  const handleReschedule = async (item: ItineraryItem, newSchedule: Schedule) => {
    if (!item.id) return;
    
    try {
      await updateItem(item.id, {
        schedule: {
          ...newSchedule,
          schedules: newSchedule.schedules || []
        },
        status: 'pending'
      });
    } catch (error) {
      console.error('Error rescheduling item:', error);
    }
  };
  
  const handleComplete = () => {
    markWeeklyReviewComplete();
    onComplete();
  };
  
  if (loading) {
    return <div>Loading weekly review...</div>;
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Review</CardTitle>
          <CardDescription>
            Let&#39;s review your progress for the week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Summary */}
          <div className="mb-8 p-6 bg-accent/5 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Your Achievements</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-background rounded-lg border border-border">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Habits</h4>
                <p className="text-2xl font-bold">
                  {stats.completedHabits}/{stats.totalHabits}
                </p>
                <div className="h-2 bg-muted mt-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ 
                      width: `${stats.totalHabits ? (stats.completedHabits / stats.totalHabits) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
              <div className="p-4 bg-background rounded-lg border border-border">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Tasks</h4>
                <p className="text-2xl font-bold">
                  {stats.completedTasks}/{stats.totalTasks}
                </p>
                <div className="h-2 bg-muted mt-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ 
                      width: `${stats.totalTasks ? (stats.completedTasks / stats.totalTasks) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Habits Review */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Habits</h3>
            <div className="grid gap-4">
              {/* Completed Habits */}
              {reviewItems.habits.filter(h => h.status === 'completed').length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Completed
                  </h4>
                  {reviewItems.habits
                    .filter(habit => habit.status === 'completed')
                    .map(habit => (
                      <div key={habit.id} className="p-4 border rounded-lg bg-primary/5">
                        <h4 className="font-medium">{habit.notes}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Great job completing this habit!
                        </p>
                      </div>
                    ))}
                </div>
              )}
              
              {/* Incomplete Habits */}
              {reviewItems.habits.filter(h => h.status !== 'completed').length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    Need Attention
                  </h4>
                  {reviewItems.habits
                    .filter(habit => habit.status !== 'completed')
                    .map(habit => (
                      <div key={habit.id} className="p-4 border rounded-lg">
                        <h4 className="font-medium">{habit.notes}</h4>
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            onClick={() => handleReschedule(habit, {
                              ...habit.schedule!,
                              startDate: new Date(),
                              schedules: habit.schedule?.schedules || []
                            })}
                          >
                            Reschedule for Next Week
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Tasks Review */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold">Tasks</h3>
            <div className="grid gap-4">
              {/* Completed Tasks */}
              {reviewItems.tasks.filter(t => t.status === 'completed').length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Completed
                  </h4>
                  {reviewItems.tasks
                    .filter(task => task.status === 'completed')
                    .map(task => (
                      <div key={task.id} className="p-4 border rounded-lg bg-primary/5">
                        <h4 className="font-medium">{task.notes}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Well done completing this task!
                        </p>
                      </div>
                    ))}
                </div>
              )}
              
              {/* Incomplete Tasks */}
              {reviewItems.tasks.filter(t => t.status !== 'completed').length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    Need Attention
                  </h4>
                  {reviewItems.tasks
                    .filter(task => task.status !== 'completed')
                    .map(task => (
                      <div key={task.id} className="p-4 border rounded-lg">
                        <h4 className="font-medium">{task.notes}</h4>
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            onClick={() => handleReschedule(task, {
                              ...task.schedule!,
                              startDate: new Date(),
                              schedules: task.schedule?.schedules || []
                            })}
                          >
                            Reschedule for Next Week
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8">
            <Button onClick={handleComplete} className="w-full">Complete Review</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
