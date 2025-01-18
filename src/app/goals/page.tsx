'use client';

import { useState, useEffect, useCallback } from 'react';
import useGoalStore from '@/lib/stores/useGoalStore';
import { Goal } from '@/types/models';
import { useRouter } from 'next/navigation';
import { PlusIcon, Share2, Trash2, Target, Calendar, ArrowUpRight } from 'lucide-react';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { ShareDialog } from '@/components/shared/ShareDialog';
import { SharedIndicator } from '@/components/shared/SharedIndicator';
import { useAuth } from '@/lib/contexts/AuthContext';
import { motion, Variants } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
          Goals
        </h1>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="gap-2 bg-gradient-to-r from-primary to-accent-foreground hover:opacity-90 transition-opacity"
        >
          <PlusIcon className="h-5 w-5" />
          New Goal
        </Button>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      >
        {goals.length === 0 ? (
          <motion.div 
            variants={item}
            className="col-span-full"
          >
            <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <p className="text-lg font-medium text-muted-foreground mb-4">No goals yet. Create your first goal!</p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="gap-2 bg-gradient-to-r from-primary to-accent-foreground hover:opacity-90 transition-opacity"
                >
                  <PlusIcon className="h-5 w-5" />
                  Create Goal
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          goals.map((goal) => (
            <motion.div
              key={goal.id}
              variants={item}
              className="group"
            >
              <Card 
                className="relative overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => router.push(`/goals/${goal.id}`)}
              >
                <CardContent className="p-6">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <SharedIndicator sharedWith={goal.assignedTo} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSharingGoal(goal);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Share2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGoal(goal.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1 pr-24">{goal.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="secondary"
                          className={cn(
                            "bg-primary/10 text-primary hover:bg-primary/20",
                            goal.goalType === 'Habit' && "bg-accent/10 text-accent-foreground hover:bg-accent/20"
                          )}
                        >
                          {goal.goalType}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Progress: {goal.progress}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="h-2 relative overflow-hidden rounded-full bg-primary/10">
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent-foreground"
                          initial={{ width: 0 }}
                          animate={{ width: `${goal.progress}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-primary/5 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Due {goal.targetDate?.toLocaleDateString()}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground/50 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200"
                      >
                        <ArrowUpRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

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
