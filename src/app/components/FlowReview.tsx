import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Goal, ItineraryItem, Task } from '@/types/models';
import { cn } from '@/lib/utils';

interface FlowReviewProps {
  selectedDate: Date;
  goals: Goal[];
  items: ItineraryItem[];
  tasks: Task[];
  onComplete: () => void;
  onRescheduleItem: (item: ItineraryItem) => void;
}

interface GoalProgress {
  goal: Goal;
  scheduledSteps: ItineraryItem[];
  completedSteps: ItineraryItem[];
  scheduledTasks: Task[];
  completedTasks: Task[];
}

export function FlowReview({ selectedDate, goals, items, tasks, onComplete, onRescheduleItem }: FlowReviewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [showIntro, setShowIntro] = useState(true);

  // Prepare the data for each goal
  useEffect(() => {
    const progress = goals.map(goal => {
      const goalSteps = items.filter(item => 
        item.referenceId === goal.id && 
        (item.type === 'habit' || item.type === 'tangible')
      );

      const goalTasks = tasks.filter(task => task.goalId === goal.id);

      return {
        goal,
        scheduledSteps: goalSteps,
        completedSteps: goalSteps.filter(step => step.status === 'completed'),
        scheduledTasks: goalTasks,
        completedTasks: goalTasks.filter(task => task.status === 'completed')
      };
    }).filter(progress => 
      progress.scheduledSteps.length > 0 || progress.scheduledTasks.length > 0
    );

    setGoalProgress(progress);
  }, [goals, items, tasks]);

  const goToNext = () => {
    if (showIntro) {
      setShowIntro(false);
      return;
    }
    setDirection(1);
    setCurrentStep(prev => Math.min(prev + 1, goalProgress.length));
  };

  const goToPrevious = () => {
    if (currentStep === 0) {
      setShowIntro(true);
      return;
    }
    setDirection(-1);
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  if (showIntro) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[70vh] flex items-center justify-center"
      >
        <div className="text-center space-y-8">
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Let's Review Your Week
          </motion.h1>
          <motion.p 
            className="text-xl text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            We'll go through each of your goals and see how you did
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button 
              size="lg"
              onClick={goToNext}
              className="mt-8"
            >
              Let's Begin
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (currentStep >= goalProgress.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[70vh] flex items-center justify-center"
      >
        <div className="text-center space-y-8">
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Great Job! 🎉
          </motion.h1>
          <motion.p 
            className="text-xl text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            You've reviewed all your goals for the week
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-x-4"
          >
            <Button 
              variant="outline"
              size="lg"
              onClick={goToPrevious}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Review Again
            </Button>
            <Button 
              size="lg"
              onClick={onComplete}
            >
              Complete Review
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  const currentProgress = goalProgress[currentStep];

  return (
    <div className="min-h-[70vh] relative">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="absolute inset-0"
        >
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {currentProgress.goal.name}
              </h2>
              <p className="text-xl text-muted-foreground">
                Let's review your progress
              </p>
            </div>

            <Card className="p-6">
              {currentProgress.scheduledSteps.length > 0 && (
                <div className="space-y-6 mb-8">
                  <h3 className="text-xl font-semibold">Steps</h3>
                  <div className="space-y-4">
                    {currentProgress.scheduledSteps.map(step => (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "p-4 rounded-lg border",
                          step.status === 'completed' ? "bg-primary/5 border-primary/20" : "border-muted"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{step.notes}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {step.status === 'completed' ? (
                                <span className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                  Completed
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-muted-foreground" />
                                  Not completed
                                </span>
                              )}
                            </p>
                          </div>
                          {step.status !== 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onRescheduleItem(step)}
                            >
                              Reschedule
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {currentProgress.scheduledTasks.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">Tasks</h3>
                  <div className="space-y-4">
                    {currentProgress.scheduledTasks.map(task => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "p-4 rounded-lg border",
                          task.status === 'completed' ? "bg-primary/5 border-primary/20" : "border-muted"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{task.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.status === 'completed' ? (
                                <span className="flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                  Completed
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-muted-foreground" />
                                  Not completed
                                </span>
                              )}
                            </p>
                          </div>
                          {task.status !== 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onRescheduleItem(task as any)}
                            >
                              Reschedule
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={goToPrevious}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                onClick={goToNext}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 