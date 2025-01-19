import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useTaskStore from '@/lib/stores/useTaskStore';
import { useHouseholdStore } from '@/lib/stores/useHouseholdStore';
import { Task } from '@/types/models';
import { format, isToday, isTomorrow, addDays, isBefore } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';

interface UpcomingTasksProps {
  onTaskClick: (task: Task) => void;
}

export function UpcomingTasks({ onTaskClick }: UpcomingTasksProps) {
  const { tasks } = useTaskStore();
  const { members } = useHouseholdStore();

  const upcomingTasks = useMemo(() => {
    const now = new Date();
    const nextWeek = addDays(now, 7);

    return tasks
      .filter(task => 
        task.status === 'pending' && 
        task.dueDate && 
        isBefore(new Date(task.dueDate), nextWeek)
      )
      .sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 5);
  }, [tasks]);

  const getDueLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  const getPriorityColor = (priority: Task['priority']) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority];
  };

  if (upcomingTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            No upcoming tasks for the next week.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 cursor-pointer"
              onClick={() => onTaskClick(task)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-x-2">
                  <span className="font-medium truncate">{task.title}</span>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{task.dueDate && getDueLabel(new Date(task.dueDate))}</span>
                </div>
              </div>
              <div className="ml-4 flex -space-x-2">
                {task.assignedTo.map((userId) => {
                  const member = members.find((m) => m.userId === userId);
                  if (!member) return null;
                  return (
                    <Avatar key={userId} className="border-2 border-background">
                      <AvatarImage src={member.photoURL} />
                      <AvatarFallback>{member.displayName[0]}</AvatarFallback>
                    </Avatar>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 