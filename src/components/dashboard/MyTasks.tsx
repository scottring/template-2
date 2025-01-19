import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import useTaskStore from '@/lib/stores/useTaskStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { Task } from '@/types/models';
import { format } from 'date-fns';
import { Check, Clock } from 'lucide-react';

interface MyTasksProps {
  onTaskClick: (task: Task) => void;
}

export function MyTasks({ onTaskClick }: MyTasksProps) {
  const { tasks, completeTask } = useTaskStore();
  const { user } = useAuth();

  const myTasks = useMemo(() => {
    return tasks
      .filter(
        (task) =>
          task.status !== 'completed' &&
          task.assignedTo.includes(user?.uid || '')
      )
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 5);
  }, [tasks, user]);

  const handleComplete = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await completeTask(taskId, user.uid);
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority];
  };

  if (!user) return null;

  if (myTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            No tasks assigned to you.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {myTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center space-x-4 p-2 rounded-lg hover:bg-accent/50 cursor-pointer"
              onClick={() => onTaskClick(task)}
            >
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={(e) => handleComplete(e, task.id)}
              >
                <Check className="h-4 w-4 text-muted-foreground" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-x-2">
                  <span className="font-medium truncate">{task.title}</span>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
                {task.dueDate && (
                  <div className="mt-1 flex items-center gap-x-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(task.dueDate), 'PPP')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 