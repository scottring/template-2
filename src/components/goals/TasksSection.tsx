'use client';

import { useState } from 'react';
import { PlusIcon, Share2, Pencil, CheckCircle2 } from 'lucide-react';
import useTaskStore from '@/lib/stores/useTaskStore';
import useGoalStore from '@/lib/stores/useGoalStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { SharedIndicator } from '@/components/shared/SharedIndicator';
import { ShareDialog } from '@/components/shared/ShareDialog';
import { Task, Goal } from '@/types/models';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function TasksSection({ goalId }: { goalId: string }) {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [sharingTask, setSharingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { tasks, completeTask } = useTaskStore();
  const { goals, updateGoal } = useGoalStore();
  
  // Get tasks from task store
  const goalTasks = tasks.filter((task) => task.goalId === goalId);
  
  // Get tasks from goal steps
  const goal = goals.find(g => g.id === goalId) as Goal | undefined;
  const stepTasks = goal?.steps.flatMap(step => 
    (step.tasks || []).map(t => ({
      id: t.id,
      title: t.text,
      description: `Task for step: ${step.text}`,
      status: t.completed ? 'completed' : 'pending',
      assignedTo: [],
      isCompleted: t.completed,
      stepId: step.id
    }))
  ) || [];

  // Combine both sets of tasks
  const allTasks = [...goalTasks, ...stepTasks];

  const handleTaskCompletion = async (task: Task | typeof stepTasks[0]) => {
    if (!user || !goal) return;

    try {
      if ('stepId' in task) {
        // Handle step task
        const updatedSteps = goal?.steps.map(step => {
          if (step.id === task.stepId) {
            return {
              ...step,
              tasks: (step.tasks || []).map(t => 
                t.id === task.id 
                  ? { ...t, completed: !t.completed }
                  : t
              )
            };
          }
          return step;
        });

        if (!updatedSteps || !goal) return;

        await updateGoal(goal.id, {
          ...goal,
          steps: updatedSteps
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
    <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
            Tasks
          </h2>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="gap-2 bg-gradient-to-r from-primary to-accent-foreground hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="h-5 w-5" />
            New Task
          </Button>
        </div>
        <motion.div 
          className="mt-6 space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {allTasks.map((task) => (
            <motion.div 
              key={task.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group flex items-center justify-between rounded-lg border border-transparent hover:border-accent/20 bg-accent/5 hover:bg-accent/10 p-4 transition-all duration-200"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-x-3">
                  <button
                    onClick={() => handleTaskCompletion(task)}
                    className="relative flex h-5 w-5 items-center justify-center group/check"
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-full border-2 transition-colors",
                      task.status === 'completed' 
                        ? "border-primary bg-primary/10" 
                        : "border-primary/20 group-hover/check:border-primary/40"
                    )} />
                    {task.status === 'completed' && (
                      <CheckCircle2 className="absolute h-4 w-4 text-primary" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "text-sm font-medium truncate transition-colors",
                      task.status === 'completed' 
                        ? "text-muted-foreground line-through" 
                        : "text-foreground"
                    )}>
                      {task.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground truncate">
                      {task.description}
                    </p>
                  </div>
                  <SharedIndicator sharedWith={task.assignedTo} />
                </div>
              </div>
              <div className="flex items-center gap-x-2 ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingTask(task as Task)}
                  className="text-muted-foreground/50 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSharingTask(task as Task)}
                  className="text-muted-foreground/50 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
          {allTasks.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-8 text-center"
            >
              <p className="text-sm text-muted-foreground">
                No tasks yet. Create one to get started!
              </p>
            </motion.div>
          )}
        </motion.div>
      </CardContent>

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

      {editingTask && (
        <TaskDialog
          open={true}
          onClose={() => setEditingTask(null)}
          task={editingTask}
        />
      )}
    </Card>
  );
}
