import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useTaskStore } from '@/lib/stores/useTaskStore';
import { useHouseholdStore } from '@/lib/stores/useHouseholdStore';
import { Task, TaskCategory } from '@/types/models';
import { format } from 'date-fns';
import { Check, Clock, Filter, Plus, Search, SortAsc } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface TaskListProps {
  onCreateTask: () => void;
  onEditTask: (task: Task) => void;
}

export function TaskList({ onCreateTask, onEditTask }: TaskListProps) {
  const [filter, setFilter] = useState({
    search: '',
    category: 'all',
    status: 'all',
    assignedTo: 'all',
  });
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority'>('dueDate');

  const { tasks, completeTask } = useTaskStore();
  const { members } = useHouseholdStore();
  const { user } = useAuth();

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(filter.search.toLowerCase()) ||
        task.description?.toLowerCase().includes(filter.search.toLowerCase());
      const matchesCategory = filter.category === 'all' || task.category === filter.category;
      const matchesStatus = filter.status === 'all' || task.status === filter.status;
      const matchesAssignee = filter.assignedTo === 'all' || task.assignedTo.includes(filter.assignedTo);

      return matchesSearch && matchesCategory && matchesStatus && matchesAssignee;
    });
  }, [tasks, filter.search, filter.category, filter.status, filter.assignedTo]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
    });
  }, [filteredTasks, sortBy]);

  const handleComplete = async (taskId: string) => {
    if (!user) return;
    try {
      await completeTask(taskId, user.uid);
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const getCategoryColor = (category: TaskCategory) => {
    const colors: Record<TaskCategory, string> = {
      chore: 'bg-blue-100 text-blue-800',
      errand: 'bg-purple-100 text-purple-800',
      maintenance: 'bg-orange-100 text-orange-800',
      kids: 'bg-pink-100 text-pink-800',
      meal: 'bg-green-100 text-green-800',
      shopping: 'bg-yellow-100 text-yellow-800',
      finance: 'bg-emerald-100 text-emerald-800',
      health: 'bg-red-100 text-red-800',
      social: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category];
  };

  const getPriorityColor = (priority: Task['priority']) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority];
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Tasks</CardTitle>
        <Button onClick={onCreateTask}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="pl-8"
              />
            </div>
            <Select
              value={filter.category}
              onValueChange={(value) => setFilter(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="chore">Chores</SelectItem>
                <SelectItem value="errand">Errands</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="kids">Kids</SelectItem>
                <SelectItem value="meal">Meals</SelectItem>
                <SelectItem value="shopping">Shopping</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filter.status}
              onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filter.assignedTo}
              onValueChange={(value) => setFilter(prev => ({ ...prev, assignedTo: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Assigned To" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(value: 'dueDate' | 'priority') => setSortBy(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SortAsc className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50"
              onClick={() => onEditTask(task)}
            >
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleComplete(task.id);
                  }}
                >
                  <Check className={task.status === 'completed' ? 'text-green-600' : 'text-muted-foreground'} />
                </Button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className={task.status === 'completed' ? 'text-muted-foreground line-through' : ''}>
                      {task.title}
                    </p>
                    <Badge className={getCategoryColor(task.category)}>
                      {task.category}
                    </Badge>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                    {task.dueDate && (
                      <p className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        {format(new Date(task.dueDate), 'PPP')}
                      </p>
                    )}
                  </div>
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
          {sortedTasks.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No tasks found. Create a new task to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 