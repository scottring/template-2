'use client';

import { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { Goal, TimeScale, GoalType, Step } from '@/types/models';
import useGoalStore from '@/lib/stores/useGoalStore';
import useAreaStore from '@/lib/stores/useAreaStore';
import { useUserStore } from '@/lib/stores/useUserStore';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getNextOccurrence } from '@/lib/utils/itineraryGeneration';
import { X as XMarkIcon, Plus as PlusIcon, Trash as TrashIcon, ListTodo, StickyNote, Clock, Calendar } from 'lucide-react';
import { UserSelect } from '@/components/shared/UserSelect';

// Import shadcn components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EditGoalDialogProps {
  open: boolean;
  onClose: () => void;
  goal: Goal;
}

const getDayName = (day: string): string => {
  const days = {
    'Su': 'Sunday',
    'M': 'Monday',
    'Tu': 'Tuesday',
    'W': 'Wednesday',
    'Th': 'Thursday',
    'F': 'Friday',
    'Sa': 'Saturday'
  };
  return days[day as keyof typeof days] || day;
};

export function EditGoalDialog({ open, onClose, goal }: EditGoalDialogProps) {
  const updateGoal = useGoalStore((state) => state.updateGoal);
  const { areas, fetchAreas } = useAreaStore();
  const { users } = useUserStore();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Goal>({
    ...goal,
    startDate: goal.startDate instanceof Date ? goal.startDate : new Date(),
    targetDate: goal.targetDate instanceof Date ? goal.targetDate : new Date(new Date().setDate(new Date().getDate() + 7)),
    steps: goal.steps.map(step => ({
      ...step,
      tasks: step.tasks || [],
      notes: step.notes || [],
      repeatEndDate: step.repeatEndDate instanceof Date ? step.repeatEndDate : 
                    goal.targetDate instanceof Date ? goal.targetDate : 
                    new Date(new Date().setDate(new Date().getDate() + 7)),
      nextOccurrence: step.nextOccurrence instanceof Date ? step.nextOccurrence : 
                     getNextOccurrence(
                       goal.startDate instanceof Date ? goal.startDate : new Date(), 
                       step.timescale || 'weekly'
                     )
    }))
  });

  useEffect(() => {
    setFormData({
      ...goal,
      startDate: goal.startDate instanceof Date ? goal.startDate : new Date(),
      targetDate: goal.targetDate instanceof Date ? goal.targetDate : new Date(new Date().setDate(new Date().getDate() + 7)),
      steps: goal.steps.map(step => ({
        ...step,
        tasks: step.tasks || [],
        notes: step.notes || [],
        repeatEndDate: step.repeatEndDate instanceof Date ? step.repeatEndDate : 
                      goal.targetDate instanceof Date ? goal.targetDate : 
                      new Date(new Date().setDate(new Date().getDate() + 7)),
        nextOccurrence: step.nextOccurrence instanceof Date ? step.nextOccurrence : 
                       getNextOccurrence(
                         goal.startDate instanceof Date ? goal.startDate : new Date(), 
                         step.timescale || 'weekly'
                       )
      }))
    });
    setActiveStepIndex(null);
  }, [goal]);

  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open && user?.householdId) {
      fetchAreas(user.householdId);
    }
  }, [open, user?.householdId, fetchAreas]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.householdId) return;
    
    setIsSubmitting(true);
    try {
      const filteredSteps = formData.steps
        .filter(step => step.text.trim())
        .map((step: Step) => {
          // Base step properties that both Tangible and Habit steps share
          const baseStep = {
            id: step.id,
            text: step.text.trim(),
            stepType: step.stepType || 'Tangible',
            isTracked: step.isTracked || false,
            tasks: (step.tasks || []).map(task => ({
              id: task.id,
              text: task.text,
              completed: task.completed || false
            })),
            notes: (step.notes || []).map(note => ({
              id: note.id,
              text: note.text || '',
              timestamp: note.timestamp || new Date()
            })),
            repeatEndDate: step.repeatEndDate instanceof Date ? step.repeatEndDate : undefined,
            selectedDays: step.selectedDays || [],
            scheduledTimes: step.scheduledTimes || {}
          };

          // Add habit-specific properties only if it's a Habit type and isTracked
          if (step.isTracked && step.stepType === 'Habit') {
            return {
              ...baseStep,
              timescale: step.timescale || 'weekly',
              frequency: step.frequency || 1,
              nextOccurrence: getNextOccurrence(formData.startDate, step.timescale || 'weekly')
            };
          }

          return baseStep;
        });

      const updatedGoal = {
        ...formData,
        steps: filteredSteps,
        updatedAt: new Date()
      };

      console.log('Saving goal with steps:', updatedGoal.steps);
      await updateGoal(goal.id, updatedGoal);
      
      onClose();
    } catch (error) {
      console.error('Error updating goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          id: crypto.randomUUID(),
          text: '',
          stepType: 'Tangible' as const,
          isTracked: false,
          tasks: [],
          notes: []
        }
      ]
    }));
  };

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const updateStep = (index: number, updates: Partial<Step>) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((s, i) => {
        if (i !== index) return s;
        
        // Create the updated step
        const updatedStep = { ...s, ...updates };
        
        // If changing from Habit to Tangible, remove only habit-specific fields
        if (updates.stepType === 'Tangible') {
          delete updatedStep.timescale;
          delete updatedStep.frequency;
          delete updatedStep.nextOccurrence;
          // Keep selectedDays and scheduledTimes as they apply to both types
        }
        
        return updatedStep;
      })
    }));
    console.log('Step updated:', index, updates);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Goal</DialogTitle>
          <DialogDescription>
            Make changes to your goal and its steps. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Area</Label>
              <Select
                value={formData.areaId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, areaId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map(area => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Goal Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter goal name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goalType">Goal Type</Label>
              <Select
                value={formData.goalType}
                onValueChange={(value: GoalType) => setFormData(prev => ({ ...prev, goalType: value }))}
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
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  type="date"
                  id="targetDate"
                  value={formData.targetDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetDate: new Date(e.target.value) }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Steps</Label>
              {formData.steps.map((step, index) => (
                <Card key={step.id} className="p-4 space-y-4">
                  <div className="flex gap-x-2 items-center">
                    <div className="flex-1">
                      <Input
                        value={step.text}
                        onChange={(e) => updateStep(index, { text: e.target.value })}
                        placeholder="Enter step"
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setActiveStepIndex(index)}
                      />
                    </div>
                    <div className="flex gap-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setActiveStepIndex(index)}
                      >
                        <ListTodo className="h-4 w-4" />
                      </Button>
                      {formData.steps.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => removeStep(index)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {activeStepIndex === index && (
                    <div className="pl-4 border-l-2 border-gray-100">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Step Details</Label>
                          <Textarea
                            value={step.text}
                            onChange={(e) => updateStep(index, { text: e.target.value })}
                            placeholder="Add more details about this step"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Due Date</Label>
                          <Input
                            type="date"
                            value={step.repeatEndDate instanceof Date ? step.repeatEndDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => updateStep(index, { 
                              repeatEndDate: e.target.value ? new Date(e.target.value) : undefined 
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Step Type</Label>
                      <Select
                        value={step.stepType}
                        onValueChange={(value: GoalType) => {
                          // When changing to Tangible, preserve the base fields but remove habit-specific ones
                          if (value === 'Tangible') {
                            const { timescale, frequency, selectedDays, scheduledTimes, nextOccurrence, ...baseStep } = step;
                            updateStep(index, { ...baseStep, stepType: value });
                          } else {
                            // When changing to Habit, keep existing data
                            updateStep(index, { 
                              ...step,
                              stepType: value,
                              // Only add habit fields if it's tracked
                              ...(step.isTracked ? {
                                timescale: step.timescale || 'weekly',
                                frequency: step.frequency || 1,
                                selectedDays: step.selectedDays || [],
                                scheduledTimes: step.scheduledTimes || {},
                                repeatEndDate: step.repeatEndDate || formData.targetDate
                              } : {})
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Habit">Habit</SelectItem>
                          <SelectItem value="Tangible">Tangible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-x-6">
                      <div className="flex items-center gap-x-2">
                        <input
                          type="checkbox"
                          checked={step.isTracked}
                          onChange={(e) => updateStep(index, { 
                            isTracked: e.target.checked,
                            ...(e.target.checked && step.stepType === 'Habit' ? {
                              timescale: step.timescale || 'weekly',
                              frequency: step.frequency || 1,
                              selectedDays: step.selectedDays || [],
                              scheduledTimes: step.scheduledTimes || {},
                              repeatEndDate: step.repeatEndDate || formData.targetDate
                            } : {})
                          })}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label className="text-sm text-gray-600">Track in Schedule</Label>
                      </div>
                      {step.isTracked && (
                        <div className="space-y-4 w-full">
                          {/* Day Selection */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Select Days</Label>
                            <div className="flex gap-2">
                              {['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'].map((day) => (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => {
                                    const selectedDays = step.selectedDays || [];
                                    const newSelectedDays = selectedDays.includes(day) 
                                      ? selectedDays.filter(d => d !== day)
                                      : [...selectedDays, day];
                                    updateStep(index, { selectedDays: newSelectedDays });
                                  }}
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                                    (step.selectedDays || []).includes(day)
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {day}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Time Selection for each selected day */}
                          {(step.selectedDays || []).map((day) => (
                            <div key={day} className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">{getDayName(day)} Times</Label>
                              {(step.scheduledTimes?.[day] || []).map((time, timeIndex) => (
                                <div key={timeIndex} className="flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <select
                                      value={time}
                                      onChange={(e) => {
                                        const times = { ...(step.scheduledTimes || {}) };
                                        times[day] = times[day] || [];
                                        times[day][timeIndex] = e.target.value;
                                        updateStep(index, { scheduledTimes: times });
                                      }}
                                      className="w-full rounded-lg border border-gray-300 p-2.5 pl-10 appearance-none bg-white"
                                    >
                                      {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                                          {`${i.toString().padStart(2, '0')}:00`}
                                        </option>
                                      ))}
                                    </select>
                                    <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const times = { ...(step.scheduledTimes || {}) };
                                      times[day] = times[day].filter((_, i) => i !== timeIndex);
                                      updateStep(index, { scheduledTimes: times });
                                    }}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const times = { ...(step.scheduledTimes || {}) };
                                  times[day] = [...(times[day] || []), "09:00"];
                                  updateStep(index, { scheduledTimes: times });
                                }}
                              >
                                <PlusIcon className="h-4 w-4 mr-1" /> Add Time
                              </Button>
                            </div>
                          ))}

                          {/* Repeat Settings - Only show for Habit steps */}
                          {step.stepType === 'Habit' && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Repeat</Label>
                                <Select
                                  value={step.timescale || 'weekly'}
                                  onValueChange={(value: TimeScale) => updateStep(index, { timescale: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Repeat Until</Label>
                                <div className="relative">
                                  <Input
                                    type="date"
                                    value={step.repeatEndDate instanceof Date ? step.repeatEndDate.toISOString().split('T')[0] : 
                                          formData.targetDate instanceof Date ? formData.targetDate.toISOString().split('T')[0] : ''}
                                    onChange={(e) => updateStep(index, { 
                                      repeatEndDate: e.target.value ? new Date(e.target.value) : formData.targetDate
                                    })}
                                    className="w-full pl-10"
                                  />
                                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const tasks = step.tasks || [];
                        updateStep(index, {
                          tasks: [...tasks, { id: crypto.randomUUID(), text: '', completed: false }]
                        });
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
                        updateStep(index, {
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
                              updateStep(index, { tasks: updatedTasks });
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Input
                            value={task.text}
                            onChange={(e) => {
                              const updatedTasks = [...step.tasks];
                              updatedTasks[taskIndex] = { ...task, text: e.target.value };
                              updateStep(index, { tasks: updatedTasks });
                            }}
                            placeholder="Enter task"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const updatedTasks = step.tasks.filter((_, i) => i !== taskIndex);
                              updateStep(index, { tasks: updatedTasks });
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
                              updateStep(index, { notes: updatedNotes });
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
                              updateStep(index, { notes: updatedNotes });
                            }}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full"
                onClick={addStep}
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

            <div className="flex justify-end gap-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="default"
                disabled={isSubmitting || !formData.name || !formData.steps.some(step => step.text.trim())}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
