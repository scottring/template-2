'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfWeek, endOfWeek } from "date-fns";
import useGoalStore from "@/lib/stores/useGoalStore";
import useItineraryStore from "@/lib/stores/useItineraryStore";
import { CheckCircle2, XCircle, AlertCircle, ChevronRight, ChevronUp, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Goal, ItineraryItem, SuccessCriteria } from "@/types/models";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReviewSession {
  weekStartDate: Date;
  weekEndDate: Date;
  step: 'criteria' | 'tasks' | 'reconciliation' | 'reflection';
  status: 'in_progress' | 'completed';
  reviewedItems: {
    id: string;
    type: 'criteria' | 'task';
    status: 'completed' | 'in_progress' | 'not_started';
    originalStatus: string;
    wasUpdated: boolean;
    goalId?: string;
    criteriaId?: string;
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
  const [session, setSession] = useState<ReviewSession>({
    weekStartDate: startOfWeek(new Date()),
    weekEndDate: endOfWeek(new Date()),
    step: 'criteria',
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
        loadItems(user.householdId)
      ]);
      console.log('Data fetched successfully:', {
        goals: goals.length,
        items: items.length
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.householdId, fetchGoals, loadItems, goals.length, items.length]);

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
      goalsCount: goals.length,
      itemsCount: items.length
    });
  }, [isRefreshing, goalsLoading, goalsError, itemsLoading, itemsError, goals.length, items.length]);

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
  if (!isRefreshing && (goalsLoading || itemsLoading)) {
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
  if (goalsError || itemsError) {
    console.log('Showing error state:', goalsError || itemsError);
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="space-y-4 text-center">
          <div className="text-destructive">
            <XCircle className="h-8 w-8 mx-auto" />
          </div>
          <div>
            <p className="font-medium">Error Loading Data</p>
            <p className="text-sm text-muted-foreground mt-1">
              {goalsError || itemsError}
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
    criteria: "Review Success Criteria",
    tasks: "Check Tasks",
    reconciliation: "Update Progress",
    reflection: "Weekly Reflection"
  };

  // Get all success criteria from active goals
  const allCriteria = goals
    .filter(goal => goal.status !== 'cancelled')
    .flatMap(goal => 
      goal.successCriteria.map(criteria => ({
        ...criteria,
        goalName: goal.name,
        goalId: goal.id
      }))
    );

  const currentItems = session.step === 'criteria' 
    ? allCriteria.filter(criteria => {
        if (!criteria.isTracked) {
          return false;
        }
        if (!criteria.nextOccurrence) {
          console.log('Skipping criteria due to missing nextOccurrence:', criteria.text);
          return false;
        }
        const nextOcc = new Date(criteria.nextOccurrence);
        return nextOcc >= session.weekStartDate && nextOcc <= session.weekEndDate;
      })
    : items.filter(item => {
        const itemDate = item.createdAt;
        return itemDate >= session.weekStartDate && itemDate <= session.weekEndDate;
      });

  const handleStatusUpdate = (id: string, newStatus: string, goalId?: string, criteriaId?: string) => {
    setSession(prev => ({
      ...prev,
      reviewedItems: [
        ...prev.reviewedItems,
        {
          id,
          type: prev.step === 'criteria' ? 'criteria' : 'task',
          status: newStatus as any,
          originalStatus: prev.step === 'criteria' 
            ? 'not_started' // We'll need to track status for criteria
            : items.find(i => i.id === id)?.status || '',
          wasUpdated: true,
          goalId,
          criteriaId
        }
      ]
    }));
  };

  const nextStep = () => {
    const steps: ReviewSession['step'][] = ['criteria', 'tasks', 'reconciliation', 'reflection'];
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
            {session.step === 'criteria' && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Review your success criteria for this week. Mark which ones you've achieved.
                </p>
                {currentItems.map((criteria: any) => (
                  <motion.div
                    key={criteria.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg border border-primary/10 bg-card"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{criteria.text}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {criteria.timescale}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Goal: {criteria.goalName}
                      </p>
                      {criteria.nextOccurrence && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Due: {format(new Date(criteria.nextOccurrence), 'MMM do')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-primary/10 hover:text-primary"
                              onClick={() => handleStatusUpdate(criteria.id, 'completed', criteria.goalId, criteria.id)}
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mark as Achieved</p>
                            <p className="text-xs text-muted-foreground">Successfully completed this criteria</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-yellow-500/10 hover:text-yellow-500"
                              onClick={() => handleStatusUpdate(criteria.id, 'in_progress', criteria.goalId, criteria.id)}
                            >
                              <AlertCircle className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mark as Partially Done</p>
                            <p className="text-xs text-muted-foreground">Made progress but not fully achieved</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleStatusUpdate(criteria.id, 'not_started', criteria.goalId, criteria.id)}
                            >
                              <XCircle className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Mark as Not Done</p>
                            <p className="text-xs text-muted-foreground">Didn't achieve this criteria</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {session.step === 'tasks' && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Check which tasks you've completed and which ones need attention.
                </p>
                {(currentItems as ItineraryItem[]).map(task => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg border border-primary/10 bg-card"
                  >
                    <div>
                      <p className="font-medium">{task.notes}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {format(task.createdAt, 'MMM do')}
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
                  .map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-lg border border-primary/10 bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {item.type === 'criteria' 
                              ? allCriteria.find(c => c.id === item.id)?.text
                              : items.find(i => i.id === item.id)?.notes}
                          </p>
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
                  ))}
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
