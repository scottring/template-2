import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import useTaskStore from '@/lib/stores/useTaskStore';
import { Task, TaskCategory } from '@/types/models';

export function TaskCategories() {
  const tasks = useTaskStore((state: { tasks: Task[] }) => state.tasks);

  const categories = useMemo(() => {
    const categoryStats = tasks.reduce((acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = {
          total: 0,
          completed: 0,
          color: getCategoryColor(task.category),
        };
      }
      acc[task.category].total++;
      if (task.status === 'completed') {
        acc[task.category].completed++;
      }
      return acc;
    }, {} as Record<TaskCategory, { total: number; completed: number; color: string }>);

    return Object.entries(categoryStats)
      .map(([category, stats]) => ({
        name: category,
        ...stats,
        percentage: Math.round((stats.completed / stats.total) * 100),
      }))
      .sort((a, b) => b.total - a.total);
  }, [tasks]);

  function getCategoryColor(category: TaskCategory): string {
    const colors: Record<TaskCategory, string> = {
      chore: 'bg-blue-600',
      errand: 'bg-purple-600',
      maintenance: 'bg-orange-600',
      kids: 'bg-pink-600',
      meal: 'bg-green-600',
      shopping: 'bg-yellow-600',
      finance: 'bg-emerald-600',
      health: 'bg-red-600',
      social: 'bg-indigo-600',
      other: 'bg-gray-600',
    };
    return colors[category];
  }

  function getCategoryLabel(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  if (categories.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map(({ name, total, completed, percentage, color }) => (
            <div key={name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-x-2">
                  <div className={`h-3 w-3 rounded-full ${color}`} />
                  <span>{getCategoryLabel(name)}</span>
                </div>
                <span className="text-muted-foreground">
                  {completed}/{total}
                </span>
              </div>
              <Progress value={percentage} className={color} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 