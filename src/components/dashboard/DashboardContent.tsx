'use client';

import { useGoalStore } from '@/lib/stores/useGoalStore';
import { PlusIcon } from 'lucide-react';

export function DashboardContent() {
  const goals = useGoalStore((state) => state.goals);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="relative flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold">{goal.name}</h3>
              <p className="mt-2 text-sm text-gray-600">{goal.description}</p>
              <div className="mt-4">
                <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="absolute inset-y-0 left-0 bg-blue-600 transition-all duration-300"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {goal.progress}% complete
                </p>
              </div>
            </div>
          </div>
        ))}

        {goals.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No goals</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new goal
            </p>
            <button
              type="button"
              className="mt-6 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Create goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 