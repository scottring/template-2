'use client';

import { useState, useEffect } from 'react';
import { X as XMarkIcon, Plus as PlusIcon, Trash as TrashIcon, ListTodo, StickyNote } from 'lucide-react';
import useGoalStore from '@/lib/stores/useGoalStore';
import { useUserStore } from '@/lib/stores/useUserStore';
import { UserSelect } from '@/components/shared/UserSelect';
import { Goal, Step, GoalType } from '@/types/models';
import { getNextOccurrence } from '@/lib/utils/itineraryGeneration';
import useTaskStore from '@/lib/stores/useTaskStore';
import { useAuth } from '@/lib/hooks/useAuth';

// Import shadcn components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface EditGoalDialogProps {
  goal: Goal;
  open: boolean;
  onClose: () => void;
}

export function EditGoalDialog({ goal, open, onClose }: EditGoalDialogProps) {
  const updateGoal = useGoalStore((state) => state.updateGoal);
  const { users } = useUserStore();
  const { user } = useAuth();
  const { addTask } = useTaskStore();

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    startDate: new Date(),
    targetDate: undefined as Date | undefined,
    successCriteria: [] as Step[],
    progress: 0,
    assignedTo: [] as string[],
    householdId: '',
    goalType: 'Tangible' as GoalType
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!goal) return;
    setFormData({
      ...goal,
      startDate: goal.startDate ? new Date(goal.startDate) : new Date(),
      targetDate: goal.targetDate ? new Date(goal.targetDate) : new Date(),
      successCriteria: Array.isArray(goal.successCriteria) 
        ? goal.successCriteria.map(criteria => {
            if (typeof criteria === 'string') {
              return {
                id: crypto.randomUUID(),
                text: criteria,
                isTracked: false,
                tasks: [],
                notes: []
              };
            }
            return criteria;
          })
        : [],
    });
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateGoal(goal.id, formData);
      onClose();
    } catch (error) {
      console.error('Error updating goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCriteria = () => {
    const newStep: Step = {
      id: crypto.randomUUID(),
      text: '',
      isTracked: false,
      tasks: [],
      notes: []
    };

    setFormData(prev => ({
      ...prev,
      successCriteria: [...prev.successCriteria, newStep]
    }));
  };

  const removeCriteria = (index: number) => {
    setFormData(prev => ({
      ...prev,
      successCriteria: prev.successCriteria.filter((_, i) => i !== index)
    }));
  };

  const updateCriteria = (index: number, updates: Partial<Step>) => {
    setFormData(prev => ({
      ...prev,
      successCriteria: prev.successCriteria.map((c, i) =>
        i === index ? { ...c, ...updates } : c
      )
    }));
  };

  const handleAddTask = async (criteriaIndex: number, text: string) => {
    if (!user || !formData.startDate || !formData.householdId) return;

    try {
      await addTask({
        title: text,
        description: `Task for success criterion: ${formData.successCriteria[criteriaIndex].text}`,
        status: 'pending',
        priority: 'medium',
        category: 'other',
        assignedTo: [user.uid],
        householdId: formData.householdId,
        goalId: formData.id,
        criteriaId: formData.successCriteria[criteriaIndex].id,
        dueDate: formData.targetDate || undefined,
        checklist: [],
        notes: []
      });

      const updatedCriteria = [...formData.successCriteria];
      updatedCriteria[criteriaIndex].tasks.push({
        id: crypto.randomUUID(),
        text,
        completed: false
      });

      setFormData(prev => ({
        ...prev,
        successCriteria: updatedCriteria
      }));
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Goal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Goal Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter goal name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goalType">Goal Type</Label>
              <Select
                value={formData.goalType}
                onValueChange={(value: GoalType) => setFormData({ ...formData, goalType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select goal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Habit">Habit</SelectItem>
                  <SelectItem value="Tangible">Tangible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  type="date"
                  id="startDate"
                  value={formData.startDate.toISOString().split('T')[0]}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="targetDate">Target Date (Optional)</Label>
                <Input
                  type="date"
                  id="targetDate"
                  value={formData.targetDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    targetDate: e.target.value ? new Date(e.target.value) : undefined 
                  }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="progress">Progress (%)</Label>
              <Input
                type="number"
                id="progress"
                min={0}
                max={100}
                value={formData.progress}
                onChange={(e) => setFormData(prev => ({ ...prev, progress: Number(e.target.value) }))}
              />
            </div>

            <div>
              <Label>Steps</Label>
              <div className="mt-4 space-y-4">
                {formData.successCriteria.map((step, index) => (
                  <Card key={step.id}>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex gap-x-2">
                        <Input
                          value={step.text}
                          onChange={(e) => updateCriteria(index, { text: e.target.value })}
                          placeholder="Enter step"
                        />
                        {formData.successCriteria.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => removeCriteria(index)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const tasks = step.tasks || [];
                            handleAddTask(index, '');
                          }}
                        >
                          <ListTodo className="h-4 w-4 mr-2" />
                          Add Task
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const notes = step.notes || [];
                            updateCriteria(index, {
                              notes: [...notes, { id: crypto.randomUUID(), text: '', timestamp: new Date() }]
                            });
                          }}
                        >
                          <StickyNote className="h-4 w-4 mr-2" />
                          Add Note
                        </Button>
                      </div>

                      {step.tasks && step.tasks.length > 0 && (
                        <div className="space-y-2">
                          {step.tasks.map((task, taskIndex) => (
                            <div key={task.id} className="flex items-center gap-x-2">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={(e) => {
                                  const updatedTasks = [...step.tasks];
                                  updatedTasks[taskIndex] = { ...task, completed: e.target.checked };
                                  updateCriteria(index, { tasks: updatedTasks });
                                }}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <Input
                                value={task.text}
                                onChange={(e) => {
                                  const updatedTasks = [...step.tasks];
                                  updatedTasks[taskIndex] = { ...task, text: e.target.value };
                                  updateCriteria(index, { tasks: updatedTasks });
                                }}
                                placeholder="Enter task"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const updatedTasks = step.tasks.filter((_, i) => i !== taskIndex);
                                  updateCriteria(index, { tasks: updatedTasks });
                                }}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {step.notes && step.notes.length > 0 && (
                        <div className="space-y-2">
                          {step.notes.map((note, noteIndex) => (
                            <div key={note.id} className="flex items-start gap-x-2">
                              <Textarea
                                value={note.text}
                                onChange={(e) => {
                                  const updatedNotes = [...step.notes];
                                  updatedNotes[noteIndex] = { ...note, text: e.target.value };
                                  updateCriteria(index, { notes: updatedNotes });
                                }}
                                placeholder="Enter note"
                                rows={2}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const updatedNotes = step.notes.filter((_, i) => i !== noteIndex);
                                  updateCriteria(index, { notes: updatedNotes });
                                }}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full"
                onClick={addCriteria}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </div>

            <div>
              <Label>Assign To</Label>
              <div className="mt-2">
                <UserSelect
                  users={users}
                  selectedUserIds={formData.assignedTo}
                  onSelect={(userIds: string[]) => setFormData(prev => ({ ...prev, assignedTo: userIds }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 