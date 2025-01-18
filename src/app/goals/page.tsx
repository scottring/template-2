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
          <p className="text-gray-500">No goals yet. Create your first goal!</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="relative group bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/goals/${goal.id}`)}
            >
              <div className="absolute top-4 right-4 flex gap-2">
                <SharedIndicator sharedWith={goal.assignedTo} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSharingGoal(goal);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Share2 className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGoal(goal.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
              <h3 className="text-lg font-semibold mb-2">{goal.name}</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 text-xs rounded ${
                  goal.goalType === 'Habit' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {goal.goalType}
                </span>
                <span className="text-sm text-gray-500">
                  Progress: {goal.progress}%
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">{goal.description}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/goals/${goal.id}`);
                }}
                className="w-full inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      <CreateGoalDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
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
