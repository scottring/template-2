'use client';

import { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { addMonths } from 'date-fns';
import { Goal, TimeScale, SuccessCriteria } from '@/types/models';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import { useGoalStore } from '@/lib/stores/useGoalStore';
import { useUserStore } from '@/lib/stores/useUserStore';
import { getNextOccurrence } from '@/lib/utils/itineraryGeneration';
import { X as XMarkIcon, Plus as PlusIcon, Trash as TrashIcon } from 'lucide-react';
import { UserSelect } from '@/components/shared/UserSelect';

interface CreateGoalDialogProps {
  open: boolean;
  onClose: () => void;
  areaId: string;
}

interface FormData {
  name: string;
  description: string;
  startDate: Date;
  targetDate: Date;
  successCriteria: SuccessCriteria[];
  assignedTo: string[];
}

export function CreateGoalDialog({ open, onClose, areaId }: CreateGoalDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    startDate: new Date(),
    targetDate: addMonths(new Date(), 1),
    successCriteria: [],
    assignedTo: []
  });

  const { generateFromGoal } = useItineraryStore();
  const { addGoal } = useGoalStore();
  const { users } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      const goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        description: formData.description,
        areaId,
        startDate: formData.startDate,
        targetDate: formData.targetDate,
        progress: 0,
        successCriteria: formData.successCriteria,
        assignedTo: formData.assignedTo
      };

      await addGoal(goalData);
      generateFromGoal({ ...goalData, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() });

      onClose();
      setFormData({
        name: '',
        description: '',
        startDate: new Date(),
        targetDate: addMonths(new Date(), 1),
        successCriteria: [],
        assignedTo: []
      });
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleAddCriteria = () => {
    setFormData(prev => ({
      ...prev,
      successCriteria: [
        ...prev.successCriteria,
        {
          text: '',
          isTracked: false,
          timescale: undefined,
          nextOccurrence: undefined
        }
      ]
    }));
  };

  const handleUpdateCriteria = (index: number, updates: Partial<SuccessCriteria>) => {
    setFormData((prev) => ({
      ...prev,
      successCriteria: prev.successCriteria.map((criteria, i) =>
        i === index ? { ...criteria, ...updates } : criteria
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
                      Create New Goal
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
                          <label htmlFor="startDate" className="block text-sm font-medium leading-6 text-gray-900">
                            Start Date
                          </label>
                          <div className="mt-2">
                            <input
                              type="date"
                              name="startDate"
                              id="startDate"
                              required
                              value={formData.startDate.toISOString().split('T')[0]}
                              onChange={(e) => setFormData((prev) => ({ ...prev, startDate: new Date(e.target.value) }))}
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="targetDate" className="block text-sm font-medium leading-6 text-gray-900">
                            Target Date
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
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium leading-6 text-gray-900">
                              Success Criteria
                            </label>
                            <button
                              type="button"
                              onClick={handleAddCriteria}
                              className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Add Criteria
                            </button>
                          </div>
                          <div className="mt-2 space-y-2">
                            {formData.successCriteria.map((criteria, index) => (
                              <div key={index} className="flex gap-x-2">
                                <input
                                  type="text"
                                  value={criteria.text || ''}
                                  onChange={(e) => handleUpdateCriteria(index, { text: e.target.value })}
                                  placeholder="Enter success criteria"
                                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                />
                                <div className="flex items-center gap-x-2">
                                  <label className="text-sm text-gray-600">Track</label>
                                  <input
                                    type="checkbox"
                                    checked={criteria.isTracked || false}
                                    onChange={(e) => handleUpdateCriteria(index, { isTracked: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                  />
                                </div>
                                {criteria.isTracked && (
                                  <select
                                    value={criteria.timescale || ''}
                                    onChange={(e) => handleUpdateCriteria(index, { 
                                      timescale: e.target.value as TimeScale,
                                    })}
                                    className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                  >
                                    <option value="">Select Frequency</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                  </select>
                                )}
                                {formData.successCriteria.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        successCriteria: prev.successCriteria.filter((_, i) => i !== index)
                                      }));
                                    }}
                                    className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-red-50"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                )}
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

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:ml-3 sm:w-auto"
                          >
                            Create Goal
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
