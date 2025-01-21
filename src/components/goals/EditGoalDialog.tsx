'use client';

import { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { Goal, TimeScale, GoalType, Step } from '@/types/models';
import useGoalStore from '@/lib/stores/useGoalStore';
import useAreaStore from '@/lib/stores/useAreaStore';
import { useUserStore } from '@/lib/stores/useUserStore';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useAuthorization } from '@/lib/hooks/useAuthorization';
import { getNextOccurrence } from '@/lib/utils/itineraryGeneration';
import { VisibilitySelector } from '@/components/shared/VisibilitySelector';
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
import { StepScheduler } from './StepScheduler';

interface EditGoalDialogProps {
  open: boolean;
  onClose: () => void;
  goal: Goal;
}

export function EditGoalDialog({ open, onClose, goal }: EditGoalDialogProps) {
  const updateGoal = useGoalStore((state) => state.updateGoal);
  const { areas, fetchAreas } = useAreaStore();
  const { users } = useUserStore();
  const { user } = useAuth();
  const { getDefaultVisibility } = useAuthorization();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Goal>({
    ...goal,
    startDate: goal.startDate instanceof Date ? goal.startDate : new Date(),
    targetDate: goal.targetDate instanceof Date ? goal.targetDate : new Date(new Date().setDate(new Date().getDate() + 7)),
    visibility: goal.visibility || getDefaultVisibility(),
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
          const baseStep = {
            id: step.id,
            text: step.text.trim(),
            stepType: step.stepType || 'Project',
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
            }))
          };

          if (step.isTracked) {
            Object.assign(baseStep, {
              startDateTime: step.startDateTime instanceof Date ? step.startDateTime : new Date(),
              repeatEndDate: step.repeatEndDate instanceof Date ? step.repeatEndDate : undefined,
              selectedDays: step.selectedDays || [],
              ...(step.stepType === 'Routine' ? {
                timescale: step.timescale || 'weekly',
                frequency: step.frequency || 1,
                nextOccurrence: getNextOccurrence(
                  step.startDateTime instanceof Date ? step.startDateTime : new Date(),
                  step.timescale || 'weekly'
                )
              } : {})
            });
          }

          return baseStep;
        });

      const updatedGoal = {
        ...formData,
        steps: filteredSteps,
        updatedAt: new Date()
      };

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
          details: '',
          stepType: 'Project' as const,
          isTracked: false,
          startDateTime: new Date(),
          endDateTime: undefined,
          repeatEndDate: undefined,
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
      steps: prev.steps.map((s, i) => i === index ? { ...s, ...updates } : s)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Goal</DialogTitle>
          <DialogDescription>
            <p className="text-muted-foreground">
              Let&apos;s update your goal.
            </p>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-6">
            {/* Visibility Settings */}
            <div className="space-y-2">
              <VisibilitySelector
                value={formData.visibility}
                onChange={(value) => setFormData(prev => ({ ...prev, visibility: value }))}
              />
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              {/* Area Selection */}
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

              {/* Goal Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Goal Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter goal name"
                />
              </div>

              {/* Goal Type */}
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
                    <SelectItem value="Routine">Routine</SelectItem>
                    <SelectItem value="Project">Project</SelectItem>
                    <SelectItem value="One Time Task">One Time Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Dates */}
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

              {/* Steps */}
              <div className="space-y-4">
                <Label>Steps</Label>
                {formData.steps.map((step, index) => (
                  <Card key={step.id} className="p-4 space-y-4">
                    <div className="flex items-center gap-x-4 mb-4">
                      <Input
                        value={step.text}
                        onChange={(e) => updateStep(index, { text: e.target.value })}
                        placeholder="Step name"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStep(index)}
                        className="shrink-0"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    {activeStepIndex === index && (
                      <div className="pl-4 border-l-2 border-gray-100">
                        <StepScheduler 
                          step={step} 
                          onUpdate={(updates) => updateStep(index, updates)} 
                        />
                      </div>
                    )}
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={addStep}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>

              {/* Assignment */}
              <div className="space-y-2">
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

            {/* Actions */}
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
