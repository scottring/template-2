import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useTaskStore } from '@/lib/stores/useTaskStore';
import { useHouseholdStore } from '@/lib/stores/useHouseholdStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { Task, TaskCategory, RecurrencePattern, TimeScale } from '@/types/models';
import { format } from 'date-fns';
import { CalendarIcon, Users } from 'lucide-react';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
}

export function TaskDialog({ open, onOpenChange, task }: TaskDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'chore' as TaskCategory,
    priority: 'medium' as Task['priority'],
    dueDate: undefined as Date | undefined,
    assignedTo: [] as string[],
    isRecurring: false,
    recurrence: {
      frequency: 1,
      interval: 'weekly' as TimeScale,
      daysOfWeek: [] as number[],
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createTask, updateTask, createRecurringTask } = useTaskStore();
  const { members } = useHouseholdStore();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        category: task.category,
        priority: task.priority,
        dueDate: task.dueDate,
        assignedTo: task.assignedTo,
        isRecurring: !!task.recurrence,
        recurrence: task.recurrence ? {
          frequency: task.recurrence.frequency,
          interval: task.recurrence.interval,
          daysOfWeek: task.recurrence.daysOfWeek || [],
        } : {
          frequency: 1,
          interval: 'weekly',
          daysOfWeek: [],
        },
      });
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      const taskData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        dueDate: formData.dueDate,
        assignedTo: formData.assignedTo,
        status: 'pending' as const,
        tags: [] as string[],
      };

      if (task) {
        await updateTask(task.id, taskData);
        toast({
          title: 'Task updated',
          description: 'The task has been updated successfully.',
        });
      } else if (formData.isRecurring) {
        await createRecurringTask(taskData, formData.recurrence);
        toast({
          title: 'Recurring task created',
          description: 'The recurring task has been created successfully.',
        });
      } else {
        await createTask(taskData);
        toast({
          title: 'Task created',
          description: 'The task has been created successfully.',
        });
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving task:', error);
      toast({
        title: 'Error',
        description: 'Failed to save task. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update task details and assignments.' : 'Add a new task to your household.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: TaskCategory) => 
                    setFormData(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chore">Chore</SelectItem>
                    <SelectItem value="errand">Errand</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="kids">Kids</SelectItem>
                    <SelectItem value="meal">Meal</SelectItem>
                    <SelectItem value="shopping">Shopping</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: Task['priority']) => 
                    setFormData(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={!formData.dueDate ? 'text-muted-foreground' : ''}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? format(formData.dueDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, dueDate: date || undefined }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label>Assigned To</Label>
              <Select
                value={formData.assignedTo[0] || ''}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, assignedTo: [value] }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign to member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      {member.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!task && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isRecurring: checked }))
                  }
                />
                <Label htmlFor="recurring">Make this a recurring task</Label>
              </div>
            )}

            {formData.isRecurring && !task && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Frequency</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={formData.recurrence.frequency}
                      onChange={(e) => 
                        setFormData(prev => ({
                          ...prev,
                          recurrence: {
                            ...prev.recurrence,
                            frequency: parseInt(e.target.value) || 1,
                          },
                        }))
                      }
                      className="w-20"
                    />
                    <Select
                      value={formData.recurrence.interval}
                      onValueChange={(value: TimeScale) => 
                        setFormData(prev => ({
                          ...prev,
                          recurrence: {
                            ...prev.recurrence,
                            interval: value,
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Days</SelectItem>
                        <SelectItem value="weekly">Weeks</SelectItem>
                        <SelectItem value="monthly">Months</SelectItem>
                        <SelectItem value="yearly">Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
              {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 