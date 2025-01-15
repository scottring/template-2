'use client';

import { useState, useEffect, useCallback } from 'react';
import useGoalStore from '@/lib/stores/useGoalStore';
import { Goal } from '@/types/models';
import { useRouter } from 'next/navigation';
import { PlusIcon, Share2, Trash2 } from 'lucide-react';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { ShareDialog } from '@/components/shared/ShareDialog';
import { SharedIndicator } from '@/components/shared/SharedIndicator';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function GoalsPage() {
  const { user } = useAuth();
  const goals = useGoalStore(state => state.goals);
  const loading = useGoalStore(state => state.loading);
  const error = useGoalStore(state => state.error);
  const fetchGoals = useGoalStore(state => state.fetchGoals);
  const deleteGoal = useGoalStore(state => state.deleteGoal);
  const migrateGoals = useGoalStore(state => state.migrateGoals);
  
  const [sharingGoal, setSharingGoal] = useState<Goal | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log('Auth state:', { user, householdId: user?.householdId });
    if (user?.householdId) {
      console.log('Fetching goals for household:', user.householdId);
      fetchGoals(user.householdId)
        .then(() => console.log('Goals fetched:', goals))
        .catch(error => console.error('Error fetching goals:', error));
    }
  }, [fetchGoals, user?.householdId]);

  // Debug log when goals change
  useEffect(() => {
    console.log('Goals updated:', goals);
  }, [goals]);

  const handleDeleteGoal = useCallback(async (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      try {
        await deleteGoal(goalId);
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  }, [deleteGoal]);

  const handleMigrateGoals = useCallback(async () => {
    if (!user?.householdId) return;
    if (window.confirm('Are you sure you want to migrate all goals to your household? This action cannot be undone.')) {
      try {
        await migrateGoals(user.householdId);
      } catch (error) {
        console.error('Error migrating goals:', error);
      }
    }
  }, [migrateGoals, user?.householdId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading goals: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Goals</h1>
        <div className="flex gap-2">
          <button
            onClick={handleMigrateGoals}
            className="inline-flex items-center gap-x-1.5 rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
          >
            Migrate Goals
          </button>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            New Goal
          </button>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No goals</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new goal.</p>
          <div className="mt-6">
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
              New Goal
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal: Goal) => (
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
      )}

      <CreateGoalDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        areaId=""
      />

      {sharingGoal && (
        <ShareDialog
          open={!!sharingGoal}
          onClose={() => setSharingGoal(null)}
          itemId={sharingGoal.id}
          itemType="goal"
          itemName={sharingGoal.name}
        />
      )}
    </div>
  );
} 