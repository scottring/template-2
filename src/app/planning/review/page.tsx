'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfWeek, endOfWeek } from "date-fns";
import useGoalStore from "@/lib/stores/useGoalStore";
import useItineraryStore from "@/lib/stores/useItineraryStore";
import { CheckCircle2, XCircle, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Goal, ItineraryItem } from "@/types/models";

interface ReviewSession {
  weekStartDate: Date;
  weekEndDate: Date;
  step: 'goals' | 'tasks' | 'reconciliation' | 'reflection';
  status: 'in_progress' | 'completed';
  reviewedItems: {
    id: string;
    type: 'goal' | 'task';
    status: 'completed' | 'in_progress' | 'not_started';
    originalStatus: string;
    wasUpdated: boolean;
  }[];
  insights: {
    completedCount: number;
    missedCount: number;
    updatedCount: number;
  };
}

export default function ReviewPage() {
  const [session, setSession] = useState<ReviewSession>({
    weekStartDate: startOfWeek(new Date()),
    weekEndDate: endOfWeek(new Date()),
    step: 'goals',
    status: 'in_progress',
    reviewedItems: [],
    insights: {
      completedCount: 0,
      missedCount: 0,
      updatedCount: 0
    }
  });

  const { goals } = useGoalStore();
  const { items } = useItineraryStore();

  const stepTitles = {
    goals: "Review Your Goals",
    tasks: "Check Your Tasks",
    reconciliation: "Update Progress",
    reflection: "Weekly Reflection"
  };

  const currentItems = session.step === 'goals' 
    ? goals.filter(goal => goal.status !== 'cancelled')
    : items.filter(item => {
        const itemDate = item.createdAt;
        return itemDate >= session.weekStartDate && itemDate <= session.weekEndDate;
      });

  const handleStatusUpdate = (id: string, newStatus: string) => {
    setSession(prev => ({
      ...prev,
      reviewedItems: [
        ...prev.reviewedItems,
        {
          id,
          type: prev.step === 'goals' ? 'goal' : 'task',
          status: newStatus as any,
          originalStatus: prev.step === 'goals' 
            ? goals.find(g => g.id === id)?.status || ''
            : items.find(i => i.id === id)?.status || '',
          wasUpdated: true
        }
      ]
    }));
  };

  const nextStep = () => {
    const steps: ReviewSession['step'][] = ['goals', 'tasks', 'reconciliation', 'reflection'];
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
      {/* Header */}
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
            {session.step === 'goals' && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Review your goals for the week. Mark their current status and identify any that need updates.
                </p>
                {(currentItems as Goal[]).map(goal => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg border border-primary/10 bg-card"
                  >
                    <div>
                      <p className="font-medium">{goal.name}</p>
                      <p className="text-sm text-muted-foreground">Current progress: {goal.progress}%</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleStatusUpdate(goal.id, 'completed')}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-yellow-500/10 hover:text-yellow-500"
                        onClick={() => handleStatusUpdate(goal.id, 'in_progress')}
                      >
                        <AlertCircle className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleStatusUpdate(goal.id, 'not_started')}
                      >
                        <XCircle className="h-5 w-5" />
                      </Button>
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
                            {item.type === 'goal' 
                              ? goals.find(g => g.id === item.id)?.name
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