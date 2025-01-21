'use client';

import { useState, useEffect, useCallback } from 'react';
import useGoalStore from '@/lib/stores/useGoalStore';
import { Goal } from '@/types/models';
import { useRouter } from 'next/navigation';
import { PlusIcon, Share2, Trash2, Target, Calendar, ArrowUpRight, Loader2, Plus } from 'lucide-react';
import { CreateGoalDialog } from '@/components/goals/CreateGoalDialog';
import { ShareDialog } from '@/components/shared/ShareDialog';
import { SharedIndicator } from '@/components/shared/SharedIndicator';
import { useAuth } from '@/lib/contexts/AuthContext';
import { motion, Variants } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FlowCreator } from '@/app/components/FlowCreator';

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
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [sharingGoal, setSharingGoal] = useState<Goal | null>(null);
  
  const goals = useGoalStore(state => state.goals);
  const fetchGoals = useGoalStore(state => state.fetchGoals);
  const { addGoal } = useGoalStore();
  
  useEffect(() => {
    if (!user?.householdId) {
      setIsLoading(false);
      return;
    }

    const loadGoals = async () => {
      try {
        if (!user.householdId) return;
        await fetchGoals(user.householdId);
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGoals();
  }, [user?.householdId, fetchGoals]);

  const handleCreateGoal = async (data: any) => {
    if (!user?.householdId) return;

    const goal: Goal = {
      id: '', // This will be set by Firebase
      name: data.name,
      description: data.description,
      areaId: '', // This should be selected in the flow or set to default
      startDate: new Date(),
      targetDate: data.targetDate,
      progress: 0,
      goalType: 'tangible' as GoalType,
      status: 'in_progress',
      steps: data.steps.map((step: any) => ({
        id: '', // This will be set when adding to Firebase
        text: step.text,
        stepType: step.stepType,
        isTracked: true,
        frequency: step.frequency,
        targetDate: step.targetDate,
        tasks: [],
        notes: []
      })),
      assignedTo: [user.uid],
      householdId: user.householdId,
      createdBy: user.uid,
      updatedBy: user.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await addGoal(goal);
    setIsCreating(false);
  };

  if (isCreating) {
    return (
      <div className="container mx-auto py-8">
        <FlowCreator 
          onComplete={handleCreateGoal}
          onCancel={() => setIsCreating(false)}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Goals
          </h1>
          <Button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Goal
          </Button>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {goals.map((goal) => (
            <motion.div
              key={goal.id}
              variants={item}
              className="group relative"
              onClick={() => {
                console.log('Navigating to goal:', goal.id);
                router.push(`/goals/${goal.id}`);
              }}
            >
              <Card className="cursor-pointer hover:shadow-md transition-shadow backdrop-blur-sm bg-background/95">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <h2 className="font-semibold">{goal.name}</h2>
                    </div>
                    <SharedIndicator sharedWith={goal.assignedTo} />
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    {goal.description}
                  </p>

                  <div className="flex items-center gap-2">
                    <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'}>
                      {goal.status === 'completed' ? 'Completed' : 'In Progress'}
                    </Badge>
                    {typeof goal.targetDate === 'string' && !isNaN(new Date(goal.targetDate).getTime()) && (
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(goal.targetDate).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSharingGoal(goal);
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {goals.length === 0 && (
            <motion.div
              variants={item}
              className="col-span-full"
            >
              <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <Target className="h-12 w-12 text-muted-foreground opacity-50" />
                  <div>
                    <h3 className="font-semibold mb-1">No goals yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Create your first goal to get started on your journey.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsCreating(true)}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Goal
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>

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
