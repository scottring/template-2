'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UpcomingTasks } from '@/components/dashboard/UpcomingTasks';
import { MyTasks } from '@/components/dashboard/MyTasks';
import { TaskTrends } from '@/components/dashboard/TaskTrends';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { Task } from '@/types/models';

export default function DashboardPage() {
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>();
  const router = useRouter();

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDialog(true);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your household tasks and activities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <MyTasks onTaskClick={handleTaskClick} />
          <UpcomingTasks onTaskClick={handleTaskClick} />
        </div>

        <TaskTrends />
      </div>

      <TaskDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        task={selectedTask}
      />
    </div>
  );
} 