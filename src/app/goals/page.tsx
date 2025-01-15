'use client';

import { useGoalStore } from '@/lib/stores/useGoalStore';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, Trash2 } from 'lucide-react';
import { SharedIndicator } from '@/components/shared/SharedIndicator';
import { ShareDialog } from '@/components/shared/ShareDialog';
import { Goal } from '@/types/models';

export default function GoalsPage() {
  const goals = useGoalStore((state) => state.goals);
  const deleteGoal = useGoalStore((state) => state.deleteGoal);
  const [sharingGoal, setSharingGoal] = useState<Goal | null>(null);
  const router = useRouter();

  const handleDeleteGoal = async (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      try {
        await deleteGoal(goalId);
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Goals</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="relative flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm"
          >
            <div className="p-6">
              <div className="flex items-center gap-x-3">
                <h3 className="text-lg font-semibold">{goal.name}</h3>
                <SharedIndicator sharedWith={goal.assignedTo} />
              </div>
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
            <div className="mt-auto flex divide-x border-t">
              <button
                type="button"
                onClick={() => router.push(`/goals/${goal.id}`)}
                className="flex w-full items-center justify-center gap-x-2.5 p-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                View Details
              </button>
              <button
                type="button"
                onClick={() => setSharingGoal(goal)}
                className="flex w-full items-center justify-center gap-x-2.5 p-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button
                type="button"
                onClick={() => handleDeleteGoal(goal.id)}
                className="flex w-full items-center justify-center gap-x-2.5 p-3 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {sharingGoal && (
        <ShareDialog
          open={true}
          onClose={() => setSharingGoal(null)}
          itemType="goals"
          itemId={sharingGoal.id}
          itemName={sharingGoal.name}
        />
      )}
    </div>
  );
} 