import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useTaskStore from '@/lib/stores/useTaskStore';
import { Task } from '@/types/models';
import { format, isToday, isTomorrow, isThisWeek, isPast } from 'date-fns';
import { CheckCircle2, Clock, ListTodo, AlertTriangle } from 'lucide-react';

export function TaskStats() {
  const tasks = useTaskStore(state => state.tasks);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const pending = total - completed;
    const overdue = tasks.filter(task => 
      task.status === 'pending' && 
      task.dueDate && 
      isPast(new Date(task.dueDate))
    ).length;

    const dueToday = tasks.filter(task => 
      task.status === 'pending' && 
      task.dueDate && 
      isToday(new Date(task.dueDate))
    ).length;

    const dueTomorrow = tasks.filter(task => 
      task.status === 'pending' && 
      task.dueDate && 
      isTomorrow(new Date(task.dueDate))
    ).length;

    const dueThisWeek = tasks.filter(task => 
      task.status === 'pending' && 
      task.dueDate && 
      isThisWeek(new Date(task.dueDate)) &&
      !isToday(new Date(task.dueDate)) &&
      !isTomorrow(new Date(task.dueDate))
    ).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      overdue,
      dueToday,
      dueTomorrow,
      dueThisWeek,
      completionRate,
    };
  }, [tasks]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <ListTodo className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.completionRate}% completion rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completed}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pending} tasks remaining
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Due Today</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.dueToday}</div>
          <p className="text-xs text-muted-foreground">
            {stats.dueTomorrow} due tomorrow
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.overdue}</div>
          <p className="text-xs text-muted-foreground">
            {stats.dueThisWeek} more this week
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 