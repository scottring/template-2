'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfWeek, endOfWeek, addWeeks } from "date-fns";
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
import { ScheduleDialog } from "@/components/planning/ScheduleDialog";

interface ReviewItem {
  id: string;
  type: 'habit' | 'tangible' | 'task';
  text: string;
  status: 'completed' | 'in_progress' | 'not_started' | 'pending';
  goalId?: string;
  stepId?: string;
  timescale?: string;
  goalName?: string;
  nextOccurrence?: Date;
  frequency?: number;
  targetDate?: Date;
  completionCount?: number;
  targetCount?: number;
}

interface ReviewSession {
  weekStartDate: Date;
  weekEndDate: Date;
  step: 'steps' | 'tasks' | 'reconciliation' | 'reflection';
  status: 'in_progress' | 'completed';
  reviewedItems: {
    id: string;
    type: ReviewItem['type'];
    status: ReviewItem['status'];
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

interface ReviewItemComponent {
  item: ReviewItem;
  onStatusUpdate: (item: ReviewItem, status: ReviewItem['status']) => void;
  onReschedule: (item: ReviewItem) => void;
}

function ReviewItemCard({ item, onStatusUpdate, onReschedule }: ReviewItemComponent) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">{item.text}</h3>
          {item.goalName && (
            <p className="text-sm text-muted-foreground">
              Goal: {item.goalName}
            </p>
          )}
          {item.type === 'habit' && item.completionCount !== undefined && (
            <p className="text-sm text-muted-foreground">
              Completed {item.completionCount} time{item.completionCount !== 1 ? 's' : ''} 
              {item.targetCount ? ` out of ${item.targetCount}` : ''}
            </p>
          )}
          {item.type === 'tangible' && item.targetDate && (
            <p className="text-sm text-muted-foreground">
              Target Date: {format(new Date(item.targetDate), 'MMM do, yyyy')}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onStatusUpdate(item, 'completed')}
                  className={cn(
                    "hover:bg-primary/10",
                    item.status === 'completed' && "bg-primary/10"
                  )}
                >
                  <CheckCircle2 className={cn(
                    "h-5 w-5",
                    item.status === 'completed' ? "text-primary" : "text-muted-foreground"
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mark as completed</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onReschedule(item)}
                  className="hover:bg-primary/10"
                >
                  <RefreshCw className="h-5 w-5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reschedule</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Feedback section */}
      {item.type === 'habit' && item.completionCount !== undefined && item.targetCount && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          {item.completionCount === 0 ? (
            <p>You haven't completed this habit this week. Would you like to adjust the schedule to make it more achievable?</p>
          ) : item.completionCount < item.targetCount ? (
            <p>You completed this {item.completionCount} time{item.completionCount !== 1 ? 's' : ''} this week. Let's aim for {item.targetCount} times next week!</p>
          ) : (
            <p>Great job! You met your goal of {item.targetCount} times this week!</p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReschedule(item)}
            className="mt-2"
          >
            Adjust Schedule
          </Button>
        </div>
      )}

      {item.type === 'tangible' && item.status !== 'completed' && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p>This task is still pending. Would you like to schedule it for next week or leave it unscheduled?</p>
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReschedule(item)}
            >
              Schedule for Next Week
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusUpdate(item, 'in_progress')}
            >
              Leave Unscheduled
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function ReviewPage() {
  const { user, loading: authLoading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { goals, loading: goalsLoading, error: goalsError, fetchGoals } = useGoalStore();
  const { items, loading: itemsLoading, error: itemsError, loadItems } = useItineraryStore();
  const { tasks, loading: tasksLoading, error: tasksError, fetchTasks } = useTaskStore();
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
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

    setIsRefreshing(true);
    
    try {
      await Promise.all([
        fetchGoals(user.householdId),
        loadItems(user.householdId),
        fetchTasks(user.householdId)
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.householdId, fetchGoals, loadItems, fetchTasks]);

  // Initial data fetch
  useEffect(() => {
    if (user && user.householdId) {
      handleRefresh();
    }
  }, [user, user?.householdId, handleRefresh]);

  // Get all success criteria from active goals
  const allSteps = useMemo(() => {
    return goals
      .filter(goal => goal.status !== 'cancelled')
      .flatMap(goal => goal.steps);
  }, [goals]);

  // Get all completed activities for the week
  const getCompletedActivities = useCallback(() => {
    if (!goals || !items) return [];

    const weekStart = session.weekStartDate;
    const weekEnd = session.weekEndDate;

    // Group completed items by step
    const completedByStep = items.reduce((acc, item) => {
      if (item.status === 'completed' && item.criteriaId) {
        if (!acc[item.criteriaId]) {
          acc[item.criteriaId] = [];
        }
        acc[item.criteriaId].push(item);
      }
      return acc;
    }, {} as Record<string, ItineraryItem[]>);

    // Create review items for each step
    return goals.flatMap(goal => 
      goal.steps.map((step: Step) => {
        const completedItems = completedByStep[step.id] || [];
        const isHabit = step.stepType === 'Habit';
        
        return {
          id: step.id,
          type: step.stepType.toLowerCase() as 'habit' | 'tangible',
          text: step.text,
          status: completedItems.length > 0 ? 'completed' : 'not_started',
          goalId: goal.id,
          stepId: step.id,
          goalName: goal.name,
          targetDate: goal.targetDate,
          completionCount: isHabit ? completedItems.length : undefined,
          targetCount: isHabit && step.frequency ? step.frequency : undefined,
          nextOccurrence: step.nextOccurrence
        } as ReviewItem;
      })
    );
  }, [goals, items, session.weekStartDate, session.weekEndDate]);

  const currentItems = useMemo<ReviewItem[]>(() => {
    switch (session.step) {
      case 'steps':
        return getCompletedActivities();
      case 'tasks':
        return tasks.map(task => ({
          id: task.id,
          type: 'task',
          text: task.title,
          status: task.status === 'completed' ? 'completed' : 'pending',
          goalId: task.goalId,
          targetDate: task.dueDate
        }));
      default:
        return [];
    }
  }, [session.step, getCompletedActivities, tasks]);

  const stepTitles = useMemo(() => ({
    steps: "Review Success Criteria",
    tasks: "Check Tasks",
    reconciliation: "Update Progress",
    reflection: "Weekly Reflection"
  }), []);

  // Show loading state
  if (authLoading || goalsLoading || itemsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin">
          <RefreshCw className="h-8 w-8 text-primary/60" />
        </div>
      </div>
    );
  }

  // Show error state
  if (goalsError || itemsError || tasksError) {
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

  const handleStatusUpdate = async (item: ReviewItem, newStatus: ReviewItem['status']) => {
    if (!user?.householdId) return;

    try {
      // Get the store actions
      const { addItem, updateItem, items } = useItineraryStore.getState();

      // Check if there's an existing itinerary item for this step/task
      let existingItem = items.find(i => {
        if (item.type === 'task') {
          return i.referenceId === item.id;
        } else {
          // For steps, we need to match both the step ID and goal ID
          return i.criteriaId === item.stepId && 
                 i.referenceId === item.goalId &&
                 i.type === item.type;
        }
      });

      // Always create a new item if one doesn't exist
      if (!existingItem) {
        // Create a new itinerary item
        const newItem = {
          type: item.type,
          referenceId: item.type === 'task' ? item.id : item.goalId!,
          criteriaId: item.stepId ?? '',
          notes: item.text,
          status: newStatus === 'completed' ? ('completed' as const) : ('pending' as const),
          householdId: user.householdId,
          createdBy: user.uid,
          updatedBy: user.uid,
          schedule: {
            startDate: new Date(),
            schedules: [] as { day: number; time: string; }[],
            repeat: undefined,
            endDate: undefined
          }
        };

        await addItem(newItem);
      } else {
        // Update existing item
        try {
          await updateItem(existingItem.id, {
            status: newStatus === 'completed' ? 'completed' : 'pending',
            updatedBy: user.uid,
            updatedAt: new Date()
          });
        } catch (error) {
          console.error('Error updating item:', error);
          // If update fails, create a new item
          const newItem = {
            type: item.type,
            referenceId: item.type === 'task' ? item.id : item.goalId!,
            criteriaId: item.stepId ?? '',
            notes: item.text,
            status: newStatus === 'completed' ? ('completed' as const) : ('pending' as const),
            householdId: user.householdId,
            createdBy: user.uid,
            updatedBy: user.uid,
            schedule: {
              startDate: new Date(),
              schedules: [] as { day: number; time: string; }[],
              repeat: undefined,
              endDate: undefined
            }
          };
          await addItem(newItem);
        }
      }

      // Update the session state
      setSession(prev => {
        const updatedItems = [...prev.reviewedItems];
        const existingIndex = updatedItems.findIndex(i => i.id === item.id);
        
        if (existingIndex >= 0) {
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            status: newStatus,
            wasUpdated: true
          };
        } else {
          updatedItems.push({
            id: item.id,
            type: item.type,
            status: newStatus,
            originalStatus: item.status,
            wasUpdated: true,
            goalId: item.goalId,
            stepId: item.stepId
          });
        }

        return {
          ...prev,
          reviewedItems: updatedItems,
          insights: {
            ...prev.insights,
            completedCount: newStatus === 'completed' ? prev.insights.completedCount + 1 : prev.insights.completedCount,
            missedCount: newStatus === 'not_started' ? prev.insights.missedCount + 1 : prev.insights.missedCount,
            updatedCount: prev.insights.updatedCount + 1
          }
        };
      });
    } catch (error) {
      console.error('Error updating status:', error);
      // TODO: Show error toast to user
    }
  };

  const handleReschedule = (item: ReviewItem) => {
    setSelectedItem(item);
    setScheduleDialogOpen(true);
  };

  const handleScheduleConfirm = async (config: any) => {
    if (!selectedItem || !user || !user.householdId) return;

    // Create a new itinerary item for the rescheduled step
    const newItem = {
      type: selectedItem.type,
      referenceId: selectedItem.goalId!,
      criteriaId: selectedItem.stepId ?? '',
      notes: selectedItem.text,
      status: 'pending' as const,
      householdId: user.householdId,
      createdBy: user.uid,
      updatedBy: user.uid,
      schedule: {
        startDate: new Date(),
        schedules: config.schedules,
        repeat: config.repeat,
        endDate: config.endDate
      }
    };

    try {
      // Add to itinerary using the addItem function from useItineraryStore
      const { addItem } = useItineraryStore.getState();
      const newId = await addItem(newItem);
      
      // Update the session state to reflect the change
      setSession(prev => ({
        ...prev,
        reviewedItems: [
          ...prev.reviewedItems,
          {
            id: newId,
            type: selectedItem.type,
            status: 'pending',
            originalStatus: selectedItem.status,
            wasUpdated: true,
            goalId: selectedItem.goalId,
            stepId: selectedItem.stepId
          }
        ]
      }));
    } catch (error) {
      console.error('Error scheduling item:', error);
      // TODO: Show error toast to user
    }

    setScheduleDialogOpen(false);
    setSelectedItem(null);
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

      {/* Review Content */}
      <Card className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={session.step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{stepTitles[session.step]}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn(
                  "h-5 w-5",
                  isRefreshing && "animate-spin"
                )} />
              </Button>
            </div>

            {/* Step Content */}
            {session.step === 'steps' && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Review your progress on steps for this week.
                </p>
                <div className="grid gap-6">
                  {currentItems.map((item) => (
                    <ReviewItemCard
                      key={item.id}
                      item={item}
                      onStatusUpdate={handleStatusUpdate}
                      onReschedule={handleReschedule}
                    />
                  ))}
                </div>
              </div>
            )}

            {session.step === 'tasks' && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Check which tasks you've completed and which ones need attention.
                </p>
                <div className="grid gap-6">
                  {currentItems.map((item) => (
                    <ReviewItemCard
                      key={item.id}
                      item={item}
                      onStatusUpdate={handleStatusUpdate}
                      onReschedule={handleReschedule}
                    />
                  ))}
                </div>
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
                    const itemText = item.type === 'task'
                      ? tasks.find(t => t.id === item.id)?.title
                      : allSteps.find(s => s.id === item.id)?.text;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 rounded-lg border border-primary/10 bg-card"
                      >
                        <div>
                          <p className="font-medium">{itemText}</p>
                          <p className="text-sm text-muted-foreground">
                            Status changed to: {item.status}
                          </p>
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

      {selectedItem && (
        <ScheduleDialog
          open={scheduleDialogOpen}
          onClose={() => {
            setScheduleDialogOpen(false);
            setSelectedItem(null);
          }}
          onSchedule={handleScheduleConfirm}
          itemName={selectedItem.text}
          targetDate={selectedItem.targetDate}
        />
      )}
    </div>
  );
}
