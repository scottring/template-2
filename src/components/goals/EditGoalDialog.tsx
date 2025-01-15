'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X as XMarkIcon, Plus as PlusIcon, Trash as TrashIcon, ListTodo, StickyNote } from 'lucide-react';
import { useGoalStore } from '@/lib/stores/useGoalStore';
import { useUserStore } from '@/lib/stores/useUserStore';
import { UserSelect } from '@/components/shared/UserSelect';
import { Goal, SuccessCriteria } from '@/types/models';
import { getNextOccurrence } from '@/lib/utils/itineraryGeneration';
import { useTaskStore } from '@/lib/stores/useTaskStore';
import { useAuth } from '@/lib/hooks/useAuth';

interface EditGoalDialogProps {
  goal: Goal;
  open: boolean;
  onClose: () => void;
}

export function EditGoalDialog({ goal, open, onClose }: EditGoalDialogProps) {
  const { user } = useAuth();
  const { updateGoal } = useGoalStore();
  const { createTask } = useTaskStore();
  const { users } = useUserStore();
  const [formData, setFormData] = useState<Goal>(() => ({
    ...goal,
    successCriteria: goal.successCriteria.map(c => ({
      id: c.id || crypto.randomUUID(),
      text: c.text,
      isTracked: c.isTracked,
      timescale: c.timescale,
      frequency: c.frequency,
      nextOccurrence: c.nextOccurrence,
      tasks: c.tasks || [],
      notes: c.notes || []
    }))
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCriteria, setExpandedCriteria] = useState<string[]>([]);

  useEffect(() => {
    if (!goal) return;
    
    const startDate = goal.startDate ? new Date(goal.startDate) : new Date();
    const targetDate = goal.targetDate ? new Date(goal.targetDate) : new Date();
    
    const validStartDate = !isNaN(startDate.getTime()) ? startDate : new Date();
    const validTargetDate = !isNaN(targetDate.getTime()) ? targetDate : new Date();
    
    setFormData({
      name: goal.name || '',
      description: goal.description || '',
      startDate: validStartDate,
      targetDate: validTargetDate,
      successCriteria: Array.isArray(goal.successCriteria) 
        ? goal.successCriteria.map(criteria => {
            if (typeof criteria === 'string') {
              return {
                text: criteria,
                isTracked: false,
                timescale: undefined,
                frequency: 1,
                tasks: [],
                notes: []
              };
            }
            return {
              ...criteria,
              tasks: criteria.tasks || [],
              notes: criteria.notes || []
            };
          })
        : [],
      progress: goal.progress || 0,
      assignedTo: goal.assignedTo || [],
    });
  }, [goal]);

  if (!goal) return null;

  const addCriteria = () => {
    const newCriteria: SuccessCriteria = {
      id: crypto.randomUUID(),
      text: '',
      isTracked: false,
      tasks: [],
      notes: []
    };

    setFormData(prev => ({
      ...prev,
      successCriteria: [...prev.successCriteria, newCriteria]
    }));
  };

  const addTask = async (criteriaIndex: number, text: string) => {
    if (!user || !formData.startDate || !formData.householdId) return;

    try {
      // Create the task in the task store
      const taskId = await createTask({
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

      // Update the success criteria with the task reference
      const updatedCriteria = [...formData.successCriteria];
      updatedCriteria[criteriaIndex].tasks.push({
        id: taskId,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.startDate || !formData.targetDate || !formData.householdId) return;

    try {
      const updatedGoal: Partial<Goal> = {
        ...formData,
        startDate: formData.startDate,
        targetDate: formData.targetDate,
        status: formData.status,
        successCriteria: formData.successCriteria.map(c => ({
          id: c.id,
          text: c.text,
          isTracked: c.isTracked,
          timescale: c.timescale,
          frequency: c.frequency,
          nextOccurrence: c.isTracked && formData.startDate
            ? getNextOccurrence(formData.startDate, c.timescale || 'weekly')
            : undefined,
          tasks: c.tasks,
          notes: c.notes
        })),
        updatedAt: new Date(),
        updatedBy: user.uid
      };

      await updateGoal(goal.id, updatedGoal);
      onClose();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const removeCriteria = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      successCriteria: prev.successCriteria.filter((_, i) => i !== index),
    }));
  };

  const updateCriteria = (index: number, updates: Partial<SuccessCriteria>) => {
    setFormData((prev) => ({
      ...prev,
      successCriteria: prev.successCriteria.map((c, i) => 
        i === index ? { ...c, ...updates } : c
      ),
    }));
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <Dialog.Title as="h2" className="text-2xl font-semibold leading-6 text-gray-900 mb-8">
                      Edit Goal
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="space-y-8">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                          Name
                        </label>
                        <div className="mt-2">
                          <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                          Description
                        </label>
                        <div className="mt-2">
                          <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="startDate" className="block text-sm font-medium leading-6 text-gray-900">
                            Start On
                          </label>
                          <div className="mt-2">
                            <input
                              type="date"
                              name="startDate"
                              id="startDate"
                              required
                              value={formData.startDate && !isNaN(formData.startDate.getTime()) 
                                ? formData.startDate.toISOString().split('T')[0] 
                                : new Date().toISOString().split('T')[0]
                              }
                              onChange={(e) => {
                                const date = new Date(e.target.value);
                                if (!isNaN(date.getTime())) {
                                  setFormData((prev) => ({ ...prev, startDate: date }));
                                }
                              }}
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="targetDate" className="block text-sm font-medium leading-6 text-gray-900">
                            End/Target Date
                          </label>
                          <div className="mt-2">
                            <input
                              type="date"
                              name="targetDate"
                              id="targetDate"
                              required
                              min={formData.startDate && !isNaN(formData.startDate.getTime())
                                ? formData.startDate.toISOString().split('T')[0]
                                : new Date().toISOString().split('T')[0]
                              }
                              value={formData.targetDate && !isNaN(formData.targetDate.getTime())
                                ? formData.targetDate.toISOString().split('T')[0]
                                : new Date().toISOString().split('T')[0]
                              }
                              onChange={(e) => {
                                const date = new Date(e.target.value);
                                if (!isNaN(date.getTime())) {
                                  setFormData((prev) => ({ ...prev, targetDate: date }));
                                }
                              }}
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-lg font-medium leading-6 text-gray-900">
                            Success Criteria
                          </label>
                          <button
                            type="button"
                            onClick={addCriteria}
                            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add Criteria
                          </button>
                        </div>
                        <div className="mt-4 space-y-6">
                          {formData.successCriteria.map((criteria, index) => (
                            <div key={index} className="rounded-lg border border-gray-200 shadow-sm">
                              <div className="p-4">
                                <div className="flex gap-x-2">
                                  <input
                                    type="text"
                                    value={criteria.text}
                                    onChange={(e) => updateCriteria(index, { text: e.target.value })}
                                    placeholder="Enter success criteria"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                  />
                                  {formData.successCriteria.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeCriteria(index)}
                                      className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-red-50"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                                
                                <div className="mt-4 border-t pt-4">
                                  <div className="flex items-center gap-x-6">
                                    <label className="flex items-center gap-x-2 text-sm text-gray-600">
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
                                      Track in Itinerary
                                    </label>
                                    {criteria.isTracked && (
                                      <>
                                        <div className="flex items-center gap-x-2">
                                          <input
                                            type="number"
                                            value={criteria.frequency || 1}
                                            onChange={(e) => updateCriteria(index, { frequency: parseInt(e.target.value) })}
                                            placeholder="Frequency"
                                            min="1"
                                            className="block w-20 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                          />
                                          <span className="text-sm text-gray-500">times</span>
                                        </div>
                                        <select
                                          value={criteria.timescale}
                                          onChange={(e) => updateCriteria(index, { 
                                            timescale: e.target.value as SuccessCriteria['timescale']
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
                                </div>

                                <div className="mt-4 border-t pt-4">
                                  <div className="flex space-x-4">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const tasks = criteria.tasks || [];
                                        updateCriteria(index, {
                                          tasks: [...tasks, { id: crypto.randomUUID(), text: '', completed: false }]
                                        });
                                      }}
                                      className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                    >
                                      <ListTodo className="h-4 w-4 mr-2" />
                                      Add Task
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const notes = criteria.notes || [];
                                        updateCriteria(index, {
                                          notes: [...notes, { id: crypto.randomUUID(), text: '', timestamp: new Date() }]
                                        });
                                      }}
                                      className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                    >
                                      <StickyNote className="h-4 w-4 mr-2" />
                                      Add Note
                                    </button>
                                  </div>

                                  {/* Tasks Section */}
                                  {criteria.tasks && criteria.tasks.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                      {criteria.tasks.map((task, taskIndex) => (
                                        <div key={task.id} className="flex items-center gap-x-2">
                                          <input
                                            type="checkbox"
                                            checked={task.completed}
                                            onChange={(e) => {
                                              const updatedTasks = [...(criteria.tasks || [])];
                                              updatedTasks[taskIndex] = { ...task, completed: e.target.checked };
                                              updateCriteria(index, { tasks: updatedTasks });
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                          />
                                          <input
                                            type="text"
                                            value={task.text}
                                            onChange={(e) => {
                                              const updatedTasks = [...(criteria.tasks || [])];
                                              updatedTasks[taskIndex] = { ...task, text: e.target.value };
                                              updateCriteria(index, { tasks: updatedTasks });
                                            }}
                                            placeholder="Enter task"
                                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                          />
                                          <input
                                            type="date"
                                            value={task.dueDate ? task.dueDate.toISOString().split('T')[0] : ''}
                                            onChange={(e) => {
                                              const updatedTasks = [...(criteria.tasks || [])];
                                              updatedTasks[taskIndex] = { 
                                                ...task, 
                                                dueDate: e.target.value ? new Date(e.target.value) : undefined 
                                              };
                                              updateCriteria(index, { tasks: updatedTasks });
                                            }}
                                            className="block w-36 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedTasks = criteria.tasks?.filter((_, i) => i !== taskIndex) || [];
                                              updateCriteria(index, { tasks: updatedTasks });
                                            }}
                                            className="text-gray-400 hover:text-gray-500"
                                          >
                                            <TrashIcon className="h-4 w-4" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Notes Section */}
                                  {criteria.notes && criteria.notes.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                      {criteria.notes.map((note, noteIndex) => (
                                        <div key={note.id} className="flex items-start gap-x-2">
                                          <textarea
                                            value={note.text}
                                            onChange={(e) => {
                                              const updatedNotes = [...(criteria.notes || [])];
                                              updatedNotes[noteIndex] = { ...note, text: e.target.value };
                                              updateCriteria(index, { notes: updatedNotes });
                                            }}
                                            placeholder="Enter note"
                                            rows={2}
                                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedNotes = criteria.notes?.filter((_, i) => i !== noteIndex) || [];
                                              updateCriteria(index, { notes: updatedNotes });
                                            }}
                                            className="text-gray-400 hover:text-gray-500"
                                          >
                                            <TrashIcon className="h-4 w-4" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium leading-6 text-gray-900">
                          Assign To
                        </label>
                        <div className="mt-2">
                          <UserSelect
                            users={users}
                            selectedUserIds={formData.assignedTo}
                            onSelect={(userIds: string[]) => setFormData(prev => ({ ...prev, assignedTo: userIds }))}
                          />
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-end gap-x-6">
                        <button
                          type="button"
                          className="text-sm font-semibold leading-6 text-gray-900"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                          {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 