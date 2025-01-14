'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X as XMarkIcon, Plus as PlusIcon, Trash as TrashIcon } from 'lucide-react';
import { useGoalStore } from '@/lib/stores/useGoalStore';
import { Goal } from '@/types/models';

interface SuccessCriteria {
  text: string;
  isTracked: boolean;
  timescale?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

interface EditGoalDialogProps {
  goal: Goal;
  open: boolean;
  onClose: () => void;
}

export function EditGoalDialog({ goal, open, onClose }: EditGoalDialogProps) {
  const updateGoal = useGoalStore((state) => state.updateGoal);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetDate: new Date(),
    successCriteria: [] as SuccessCriteria[],
    progress: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        description: goal.description,
        targetDate: goal.targetDate,
        successCriteria: goal.successCriteria.map(criteria => ({
          text: criteria,
          isTracked: false,
          timescale: undefined,
        })),
        progress: goal.progress,
      });
    }
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateGoal(goal.id, {
        ...formData,
        successCriteria: formData.successCriteria.map(c => c.text).filter(Boolean),
      });
      onClose();
    } catch (error) {
      console.error('Error updating goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCriteria = () => {
    setFormData((prev) => ({
      ...prev,
      successCriteria: [...prev.successCriteria, { text: '', isTracked: false }],
    }));
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
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
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Edit Goal
                    </Dialog.Title>
                    <div className="mt-4">
                      <form onSubmit={handleSubmit} className="space-y-4">
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
                              value={formData.targetDate.toISOString().split('T')[0]}
                              onChange={(e) => setFormData((prev) => ({ ...prev, targetDate: new Date(e.target.value) }))}
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="progress" className="block text-sm font-medium leading-6 text-gray-900">
                            Progress (%)
                          </label>
                          <div className="mt-2">
                            <input
                              type="number"
                              name="progress"
                              id="progress"
                              min="0"
                              max="100"
                              value={formData.progress}
                              onChange={(e) => setFormData((prev) => ({ ...prev, progress: Number(e.target.value) }))}
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium leading-6 text-gray-900">
                              Success Criteria
                            </label>
                            <button
                              type="button"
                              onClick={addCriteria}
                              className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Add Criteria
                            </button>
                          </div>
                          <div className="mt-2 space-y-4">
                            {formData.successCriteria.map((criteria, index) => (
                              <div key={index} className="space-y-2">
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
                                <div className="flex items-center gap-x-4">
                                  <label className="flex items-center gap-x-2 text-sm text-gray-600">
                                    <input
                                      type="checkbox"
                                      checked={criteria.isTracked}
                                      onChange={(e) => updateCriteria(index, { 
                                        isTracked: e.target.checked,
                                        timescale: e.target.checked ? 'weekly' : undefined 
                                      })}
                                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                    />
                                    Track in Itinerary
                                  </label>
                                  {criteria.isTracked && (
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
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                            onClick={onClose}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
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