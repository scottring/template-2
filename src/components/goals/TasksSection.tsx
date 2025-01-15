'use client';

import { useState } from 'react';
import { PlusIcon, Share2 } from 'lucide-react';
import { useTaskStore } from '@/lib/stores/useTaskStore';
import { useGoalStore } from '@/lib/stores/useGoalStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { SharedIndicator } from '@/components/shared/SharedIndicator';
import { ShareDialog } from '@/components/shared/ShareDialog';
import { Task } from '@/types/models';

export function TasksSection({ goalId }: { goalId: string }) {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sharingTask, setSharingTask] = useState<Task | null>(null);
  const { tasks, completeTask } = useTaskStore();
  const { goals, updateGoal } = useGoalStore();
  
  // Get tasks from task store
  const goalTasks = tasks.filter((task) => task.goalId === goalId);
  
  // Get tasks from success criteria
  const goal = goals.find(g => g.id === goalId);
  const criteriaTasks = goal?.successCriteria?.flatMap(c => 
    (c.tasks || []).map(t => ({
      id: t.id,
      title: t.text,
      description: `Task for success criterion: ${c.text}`,
      status: t.completed ? 'completed' : 'pending',
      assignedTo: [],
      isCompleted: t.completed,
      criteriaId: c.id
    }))
  ) || [];

  // Combine both sets of tasks
  const allTasks = [...goalTasks, ...criteriaTasks];

  const handleTaskCompletion = async (task: Task | typeof criteriaTasks[0]) => {
    if (!user || !goal) return;

    try {
      if ('criteriaId' in task) {
        // Handle success criteria task
        const updatedCriteria = goal.successCriteria?.map(c => {
          if (c.id === task.criteriaId) {
            return {
              ...c,
              tasks: (c.tasks || []).map(t => 
                t.id === task.id 
                  ? { ...t, completed: !t.completed }
                  : t
              )
            };
          }
          return c;
        });

        if (!updatedCriteria) return;

        await updateGoal(goal.id, {
          ...goal,
          successCriteria: updatedCriteria
        });
      } else {
        // Handle regular task
        await completeTask(task.id, user.uid);
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Tasks</h2>
          <button
            type="button"
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            New Task
          </button>
        </div>
        <div className="mt-6 divide-y divide-gray-200">
          {allTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between py-4">
              <div>
                <div className="flex items-center gap-x-3">
                  <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
                  <SharedIndicator sharedWith={task.assignedTo} />
                </div>
                <p className="mt-1 text-sm text-gray-500">{task.description}</p>
              </div>
              <div className="flex items-center gap-x-4">
                <input
                  type="checkbox"
                  checked={task.status === 'completed'}
                  onChange={() => handleTaskCompletion(task)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setSharingTask(task as Task)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {allTasks.length === 0 && (
            <div className="py-4 text-center text-sm text-gray-500">
              No tasks yet. Create one to get started!
            </div>
          )}
        </div>
      </div>

      <CreateTaskDialog
        goalId={goalId}
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />

      {sharingTask && (
        <ShareDialog
          open={true}
          onClose={() => setSharingTask(null)}
          itemType="tasks"
          itemId={sharingTask.id}
          itemName={sharingTask.title}
        />
      )}
    </div>
  );
}
