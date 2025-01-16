'use client';

import { useEffect } from 'react';
import { CycleVisualizer } from '@/components/dashboard/CycleVisualizer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import useGoalStore from '@/lib/stores/useGoalStore';
import useTaskStore from '@/lib/stores/taskStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { CalendarDays, CheckCircle2, Clock, Goal, ListTodo } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const { goals, fetchGoals, getGoalsByStatus, getUpcomingGoals } = useGoalStore();
  const { tasks, fetchTasks, getOverdueTasks, getUpcomingTasks, completeTask } = useTaskStore();

  useEffect(() => {
    if (user?.householdId) {
      fetchGoals(user.householdId);
      fetchTasks(user.householdId);
    }
  }, [user?.householdId]);

  const unprocessedGoals = getGoalsByStatus('not_started');
  const inProgressGoals = getGoalsByStatus('in_progress');
  const upcomingGoals = getUpcomingGoals(7);
  const overdueTasks = getOverdueTasks();
  const todaysTasks = getUpcomingTasks(1);

  const calculateProgress = () => {
    const totalTasks = tasks.length;
    if (totalTasks === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    return (completedTasks / totalTasks) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 mb-8">
            Dashboard
          </h1>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unprocessed Goals</CardTitle>
                <Goal className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{unprocessedGoals.length}</div>
                <p className="text-xs text-muted-foreground">
                  Goals needing attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due Today</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todaysTasks.length}</div>
                <p className="text-xs text-muted-foreground">
                  Tasks to complete today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overdueTasks.length}</div>
                <p className="text-xs text-muted-foreground">
                  Tasks past due date
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progress</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(calculateProgress())}%</div>
                <Progress value={calculateProgress()} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Goals and Tasks Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Goal className="h-5 w-5" />
                  Active Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inProgressGoals.slice(0, 5).map(goal => (
                    <Link 
                      key={goal.id} 
                      href={`/goals/${goal.id}`}
                      className="block p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="font-medium">{goal.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Target: {goal.targetDate?.toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                  {inProgressGoals.length === 0 && (
                    <p className="text-muted-foreground text-sm">No active goals</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <ListTodo className="h-5 w-5" />
                  Today's Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todaysTasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100">
                      <input 
                        type="checkbox" 
                        checked={task.status === 'completed'}
                        className="h-4 w-4"
                        onChange={() => task.status !== 'completed' && user && completeTask(task.id, user.uid)}
                      />
                      <div>
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {task.description}
                        </div>
                      </div>
                    </div>
                  ))}
                  {todaysTasks.length === 0 && (
                    <p className="text-muted-foreground text-sm">No tasks due today</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Cycle Visualizer */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Your Household Journey</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track your household's progress through the goal achievement cycle. Each stage represents a key phase in your journey:
              </p>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span><strong>Base Goal Setting:</strong> Vision and members</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span><strong>Review & Planning:</strong> Task distribution</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span><strong>Daily Life:</strong> Task execution</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span><strong>Progress Tracking:</strong> Monitor goals</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span><strong>Reflection:</strong> Review and adjust</span>
                </div>
              </div>
              <CycleVisualizer />
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Click on any stage to view detailed information and actions for that phase
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 