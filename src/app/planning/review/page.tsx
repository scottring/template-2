'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfWeek, endOfWeek } from "date-fns";
import useGoalStore from "@/lib/stores/useGoalStore";
import useItineraryStore from "@/lib/stores/useItineraryStore";
import useTaskStore from "@/lib/stores/useTaskStore";
import { CheckCircle2, XCircle, AlertCircle, ChevronRight, ChevronUp, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Goal, ItineraryItem, Step, Task } from "@/types/models";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReviewItem {
  id: string;
  type: 'step' | 'task';
  text: string;
  status: 'completed' | 'in_progress' | 'not_started';
  goalId?: string;
  stepId?: string;
  timescale?: string;
  goalName?: string;
  nextOccurrence?: Date;
  frequency?: number;
}

interface ReviewSession {
  weekStartDate: Date;
  weekEndDate: Date;
  step: 'steps' | 'tasks' | 'reconciliation' | 'reflection';
  status: 'in_progress' | 'completed';
  reviewedItems: {
    id: string;
    type: 'step' | 'task';
    status: 'completed' | 'in_progress' | 'not_started';
    originalStatus: string;
    wasUpdated: boolean;
    goalId?: string;
    stepId?: string;
  }[];
  insights: {
    completedCount: number;
    missedCount: number;
    updatedCount: number;
  };
}

export default function ReviewPage() {
  const { user, loading: authLoading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { goals, loading: goalsLoading, error: goalsError, fetchGoals } = useGoalStore();
  const { items, loading: itemsLoading, error: itemsError, loadItems } = useItineraryStore();
  const { tasks, loading: tasksLoading, error: tasksError, fetchTasks } = useTaskStore();
  const [session, setSession] = useState<ReviewSession>({
    weekStartDate: startOfWeek(new Date()),
    weekEndDate: endOfWeek(new Date()),
    step: 'steps',
    status: 'in_progress',
    reviewedItems: [],
    insights: {
      completedCount: 0,
      missedCount: 0,
      updatedCount: 0
    }
  });

  // Function to handle manual refresh
  const handleRefresh = useCallback(async () => {
    if (!user?.householdId) {
      console.error('No household ID available');
      return;
    }

    console.log('Starting refresh with household ID:', user.householdId);
    setIsRefreshing(true);
    
    try {
      await Promise.all([
        fetchGoals(user.householdId),
        loadItems(user.householdId),
        fetchTasks(user.householdId)
      ]);
      console.log('Data fetched successfully:', {
        goals: goals.length,
        items: items.length,
        tasks: tasks.length
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.householdId, fetchGoals, loadItems, fetchTasks, goals.length, items.length, tasks.length]);

  // Initial data fetch
  useEffect(() => {
    console.log('Review page mounted, auth state:', {
      authLoading,
      user: user?.uid,
      householdId: user?.householdId
    });
    
    if (user && user.householdId) {
      handleRefresh();
    }
  }, [user, user?.householdId, handleRefresh]);

  // Debug logging
  useEffect(() => {
    console.log('Current state:', {
      isRefreshing,
      goalsLoading,
      goalsError,
      itemsLoading,
      itemsError,
      tasksLoading,
      tasksError,
      goalsCount: goals.length,
      itemsCount: items.length,
      tasksCount: tasks.length
    });
  }, [isRefreshing, goalsLoading, goalsError, itemsLoading, itemsError, tasksLoading, tasksError, goals.length, items.length, tasks.length]);

  // Show auth loading state
  if (authLoading) {
    console.log('Auth is loading...');
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Show not authenticated state
  if (!authLoading && !user) {
    console.log('User is not authenticated');
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="space-y-4 text-center">
          <div className="text-destructive">
            <XCircle className="h-8 w-8 mx-auto" />
          </div>
          <div>
            <p className="font-medium">Not Authenticated</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please sign in to access this page
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state for initial load
  if (!isRefreshing && (goalsLoading || itemsLoading || tasksLoading)) {
    console.log('Showing loading state');
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (goalsError || itemsError || tasksError) {
    console.log('Showing error state:', goalsError || itemsError || tasksError);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="space-y-4 text-center">
          <div className="text-destructive">
            <XCircle className="h-8 w-8 mx-auto" />
          </div>
          <div>
            <p className="font-medium">Error Loading Data</p>
            <p className="text-sm text-muted-foreground mt-1">
              {goalsError || itemsError || tasksError}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={handleRefresh}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stepTitles = {
    steps: "Review Success Criteria",
    tasks: "Check Tasks",
    reconciliation: "Update Progress",
    reflection: "Weekly Reflection"
  };

  // Get all success criteria from active goals
  const allSteps = goals
    .filter(goal => goal.status !== 'cancelled')
    .flatMap(goal => goal.successCriteria);

  const getGoalItems = (goals: Goal[]): ReviewItem[] => {
    return goals.flatMap(goal => {
      return goal.successCriteria.map(step => ({
        id: step.id,
        type: 'step' as const,
        text: step.text,
        status: step.isTracked ? 'in_progress' : 'not_started',
        goalId: goal.id,
        stepId: step.id,
        timescale: step.timescale,
        goalName: goal.name,
        nextOccurrence: step.nextOccurrence,
        frequency: step.frequency
      }));
    });
  };

  const getCompletedActivities = (step: Step): string[] => {
    const activities = [];
    if (step.isTracked) {
      activities.push('Tracked in Schedule');
    }
    if (step.tasks?.length > 0) {
      activities.push(`${step.tasks.length} Tasks`);
    }
    if (step.notes?.length > 0) {
      activities.push(`${step.notes.length} Notes`);
    }
    return activities;
  };

  const currentItems = session.step === 'steps'
    ? getGoalItems(goals)
    : session.step === 'tasks'
      ? tasks
      : [];

  const handleStatusUpdate = (id: string, newStatus: string, goalId?: string, stepId?: string) => {
    setSession(prev => ({
      ...prev,
      reviewedItems: [
        ...prev.reviewedItems,
        {
          id,
          type: prev.step === 'steps' ? 'step' : 'task',
          status: newStatus as any,
          originalStatus: prev.step === 'steps' 
            ? 'not_started' // We'll need to track status for steps
            : items.find(i => i.id === id)?.status || '',
          wasUpdated: true,
          goalId,
          stepId
        }
      ]
    }));
  };

  const nextStep = () => {
    const steps: ReviewSession['step'][] = ['steps', 'tasks', 'reconciliation', 'reflection'];
    const currentIndex = steps.indexOf(session.step);
    if (currentIndex < steps.length - 1) {
      setSession(prev => ({
        ...prev,
        step: steps[currentIndex + 1]
      }));
    } else {
      setSession(prev => ({
        ...prev,
        status: 'completed'
      }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Background refresh indicator */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-primary/10">
            <div className="h-full bg-primary animate-[progress_2s_ease-in-out_infinite]" />
          </div>
        </div>
      )}

      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            <span className="bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
              {stepTitles[session.step]}
            </span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Week of {format(session.weekStartDate, 'MMMM do, yyyy')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={cn(
            "gap-2",
            isRefreshing && "animate-pulse"
          )}
        >
          <RefreshCw className={cn(
            "h-4 w-4",
            isRefreshing && "animate-spin"
          )} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between max-w-2xl">
        {Object.entries(stepTitles).map(([key, title], index) => (
          <div key={key} className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full",
              session.step === key ? "bg-primary text-primary-foreground" : 
              index < Object.keys(stepTitles).indexOf(session.step) ? "bg-primary/20" : 
              "bg-muted"
            )}>
              {index + 1}
            </div>
            {index < Object.keys(stepTitles).length - 1 && (
              <div className="w-16 h-px bg-muted mx-2" />
            )}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <Card className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={session.step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {session.step === 'steps' && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Review your progress on each step.
                </p>
                {(currentItems as ReviewItem[]).map(item => {
                  const step = allSteps.find(s => s.id === item.stepId);
                  const activities = step ? getCompletedActivities(step) : [];
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex flex-col p-4 rounded-lg border border-primary/10 bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{item.text}</p>
                            {item.timescale && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {item.timescale}
                              </span>
                            )}
                          </div>
                          {item.goalName && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Goal: {item.goalName}
                            </p>
                          )}
                          {item.nextOccurrence && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Due: {format(item.nextOccurrence, 'MMM do')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleStatusUpdate(item.id, 'completed', item.goalId, item.stepId)}
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-yellow-500/10 hover:text-yellow-500"
                            onClick={() => handleStatusUpdate(item.id, 'in_progress', item.goalId, item.stepId)}
                          >
                            <AlertCircle className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleStatusUpdate(item.id, 'not_started', item.goalId, item.stepId)}
                          >
                            <XCircle className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress Section */}
                      {activities.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-primary/10">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-muted-foreground">
                                Progress this week:
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {activities.length} activities
                              </p>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-500" 
                                style={{ 
                                  width: `${Math.min(100, (activities.length / (item.frequency || 1)) * 100)}%` 
                                }}
                              />
                            </div>

                            {/* Activity List */}
                            <div className="mt-2 space-y-2">
                              {activities.map((activity, index) => (
                                <div 
                                  key={index}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-primary/60" />
                                  <span>{activity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {session.step === 'tasks' && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Check which tasks you've completed and which ones need attention.
                </p>
                {(currentItems as Task[]).map(task => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg border border-primary/10 bg-card"
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {task.dueDate ? format(task.dueDate, 'MMM do') : 'No due date'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleStatusUpdate(task.id, 'completed')}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleStatusUpdate(task.id, 'pending')}
                      >
                        <XCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {session.step === 'reconciliation' && (
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  Review items that need updates. Make sure everything is accurately reflected.
                </p>
                {session.reviewedItems
                  .filter(item => item.wasUpdated)
                  .map(item => {
                    const itemText = item.type === 'step'
                      ? allSteps.find(s => s.id === item.id)?.text
                      : tasks.find(t => t.id === item.id)?.title;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 rounded-lg border border-primary/10 bg-card"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{itemText}</p>
                            <p className="text-sm text-muted-foreground">
                              Status changed from {item.originalStatus} to {item.status}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            Edit
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}

            {session.step === 'reflection' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 text-center">
                    <p className="text-4xl font-bold text-primary">{session.insights.completedCount}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-4xl font-bold text-yellow-500">{session.insights.missedCount}</p>
                    <p className="text-sm text-muted-foreground">Missed</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-4xl font-bold text-blue-500">{session.insights.updatedCount}</p>
                    <p className="text-sm text-muted-foreground">Updated</p>
                  </Card>
                </div>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Take a moment to reflect on your week. What went well? What could be improved?
                  </p>
                  <textarea
                    className="w-full h-32 p-3 rounded-lg border border-primary/10 bg-card resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Add your reflections here..."
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Button
          onClick={nextStep}
          className="flex items-center gap-2"
        >
          {session.step === 'reflection' ? 'Complete Review' : 'Next Step'}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
