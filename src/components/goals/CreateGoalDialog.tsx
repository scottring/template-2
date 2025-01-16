'use client';

import { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { addMonths } from 'date-fns';
import { Goal, TimeScale } from '@/types/models';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import useGoalStore from '@/lib/stores/useGoalStore';
import { useUserStore } from '@/lib/stores/useUserStore';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getNextOccurrence } from '@/lib/utils/itineraryGeneration';
import { X as XMarkIcon, Plus as PlusIcon, Trash as TrashIcon, ListTodo, StickyNote } from 'lucide-react';
import { UserSelect } from '@/components/shared/UserSelect';

// Import shadcn components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import useAreaStore from '@/lib/stores/useAreaStore';

interface CreateGoalDialogProps {
  open: boolean;
  onClose: () => void;
}

interface SuccessCriteriaInput {
  id: string;
  text: string;
  isTracked: boolean;
  timescale?: TimeScale;
  frequency?: number;
  nextOccurrence?: Date;
  tasks: Array<{
    id: string;
    text: string;
    completed: boolean;
    dueDate?: Date;
  }>;
  notes: Array<{
    id: string;
    text: string;
    timestamp: Date;
  }>;
}

interface FormData {
  name: string;
  description: string;
  startDate: Date;
  targetDate: Date;
  successCriteria: SuccessCriteriaInput[];
  assignedTo: string[];
  householdId: string;
}

export function CreateGoalDialog({ open, onClose }: CreateGoalDialogProps) {
  const addGoal = useGoalStore((state) => state.addGoal);
  const { areas, addArea, fetchAreas } = useAreaStore();
  const { users } = useUserStore();
  const { user } = useAuth();

  useEffect(() => {
    if (open && user?.householdId) {
      fetchAreas(user.householdId);
    }
  }, [open, user?.householdId, fetchAreas]);

  const [selectedArea, setSelectedArea] = useState<string>('');
  const [newAreaName, setNewAreaName] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    startDate: new Date(),
    targetDate: addMonths(new Date(), 1),
    successCriteria: [{
      id: crypto.randomUUID(),
      text: '',
      isTracked: false,
      tasks: [],
      notes: []
    }],
    assignedTo: [],
    householdId: user?.householdId || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.householdId) return;
    
    setIsSubmitting(true);
    try {
      let areaId = selectedArea;
      
      if (selectedArea === 'new' && newAreaName) {
        areaId = await addArea({
          name: newAreaName,
          description: '',
          color: '#000000',
          icon: 'folder',
          householdId: user.householdId,
          isActive: true,
          isFocus: false,
          assignedTo: [user.uid],
        });
      }

      await addGoal({
        ...formData,
        areaId,
        successCriteria: formData.successCriteria.filter(c => c.text.trim()),
        status: 'not_started',
        progress: 0
      } as Partial<Goal>);
      
      onClose();
      setFormData({
        name: '',
        description: '',
        startDate: new Date(),
        targetDate: addMonths(new Date(), 1),
        successCriteria: [{
          id: crypto.randomUUID(),
          text: '',
          isTracked: false,
          tasks: [],
          notes: []
        }],
        assignedTo: [],
        householdId: user.householdId
      });
      setSelectedArea('');
      setNewAreaName('');
    } catch (error) {
      console.error('Error creating goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCriteria = () => {
    setFormData(prev => ({
      ...prev,
      successCriteria: [
        ...prev.successCriteria,
        {
          id: crypto.randomUUID(),
          text: '',
          isTracked: false,
          tasks: [],
          notes: []
        }
      ]
    }));
  };

  const removeCriteria = (index: number) => {
    setFormData(prev => ({
      ...prev,
      successCriteria: prev.successCriteria.filter((_, i) => i !== index)
    }));
  };

  const updateCriteria = (index: number, updates: Partial<SuccessCriteriaInput>) => {
    setFormData(prev => ({
      ...prev,
      successCriteria: prev.successCriteria.map((c, i) =>
        i === index ? { ...c, ...updates } : c
      )
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Goal</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Area</Label>
              <Select
                value={selectedArea}
                onValueChange={setSelectedArea}
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
                  <SelectItem value="new">+ Create New Area</SelectItem>
                </SelectContent>
              </Select>

              {selectedArea === 'new' && (
                <Input
                  placeholder="New area name"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
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
                  value={formData.targetDate.toISOString().split('T')[0]}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetDate: new Date(e.target.value) }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Success Criteria</Label>
              <div className="mt-4 space-y-4">
                {formData.successCriteria.map((criteria, index) => (
                  <Card key={criteria.id}>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex gap-x-2">
                        <Input
                          value={criteria.text}
                          onChange={(e) => updateCriteria(index, { text: e.target.value })}
                          placeholder="Enter success criteria"
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

                      <div className="flex items-center gap-x-6">
                        <div className="flex items-center gap-x-2">
                          <input
                            type="checkbox"
                            checked={criteria.isTracked}
                            onChange={(e) => updateCriteria(index, { 
                              isTracked: e.target.checked,
                              timescale: e.target.checked ? 'weekly' : undefined,
                              frequency: e.target.checked ? 1 : undefined
                            })}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                          />
                          <Label className="text-sm text-gray-600">Track in Itinerary</Label>
                        </div>
                        {criteria.isTracked && (
                          <>
                            <div className="flex items-center gap-x-2">
                              <Input
                                type="number"
                                value={criteria.frequency || 1}
                                onChange={(e) => updateCriteria(index, { frequency: parseInt(e.target.value) })}
                                placeholder="Frequency"
                                min="1"
                                className="w-20"
                              />
                              <span className="text-sm text-gray-500">times</span>
                            </div>
                            <select
                              value={criteria.timescale}
                              onChange={(e) => updateCriteria(index, { 
                                timescale: e.target.value as TimeScale
                              })}
                              className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                              <option value="quarterly">Quarterly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          </>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const tasks = criteria.tasks || [];
                            updateCriteria(index, {
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
                            const notes = criteria.notes || [];
                            updateCriteria(index, {
                              notes: [...notes, { id: crypto.randomUUID(), text: '', timestamp: new Date() }]
                            });
                          }}
                        >
                          <StickyNote className="h-4 w-4 mr-2" />
                          Add Note
                        </Button>
                      </div>

                      {criteria.tasks && criteria.tasks.length > 0 && (
                        <div className="space-y-2">
                          {criteria.tasks.map((task, taskIndex) => (
                            <div key={task.id} className="flex items-center gap-x-2">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={(e) => {
                                  const updatedTasks = [...criteria.tasks];
                                  updatedTasks[taskIndex] = { ...task, completed: e.target.checked };
                                  updateCriteria(index, { tasks: updatedTasks });
                                }}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              <Input
                                value={task.text}
                                onChange={(e) => {
                                  const updatedTasks = [...criteria.tasks];
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
                                  const updatedTasks = criteria.tasks.filter((_, i) => i !== taskIndex);
                                  updateCriteria(index, { tasks: updatedTasks });
                                }}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {criteria.notes && criteria.notes.length > 0 && (
                        <div className="space-y-2">
                          {criteria.notes.map((note, noteIndex) => (
                            <div key={note.id} className="flex items-start gap-x-2">
                              <Textarea
                                value={note.text}
                                onChange={(e) => {
                                  const updatedNotes = [...criteria.notes];
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
                                  const updatedNotes = criteria.notes.filter((_, i) => i !== noteIndex);
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
                Add Criteria
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
            <Button 
              type="submit"
              disabled={isSubmitting || !selectedArea || (selectedArea === 'new' && !newAreaName) || !formData.name}
            >
              Create Goal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
