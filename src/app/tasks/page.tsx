'use client';

import { useState } from 'react';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { TaskStats } from '@/components/tasks/TaskStats';
import { TaskCategories } from '@/components/tasks/TaskCategories';
import { Task } from '@/types/models';

export default function TasksPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();

  const handleCreateTask = () => {
    setSelectedTask(undefined);
    setShowCreateDialog(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowCreateDialog(true);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track household tasks, chores, and responsibilities.
          </p>
        </div>

        <TaskStats />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <TaskList
              onCreateTask={handleCreateTask}
              onEditTask={handleEditTask}
            />
          </div>
          <div>
            <TaskCategories />
          </div>
        </div>
      </div>

      <TaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        task={selectedTask}
      />
    </div>
  );
} 