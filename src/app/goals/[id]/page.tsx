'use client';

import { useRouter, useParams } from 'next/navigation';
import { Goal } from '@/types/models';
import useGoalStore from '@/lib/stores/useGoalStore';
import GoalDetailView from '@/components/goals/GoalDetailView';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function GoalPage() {
  const params = useParams();
  const router = useRouter();
  const { goals } = useGoalStore();
  const goal = goals.find(g => g.id === params.id);

  if (!goal) return null;

  const handleGoalUpdate = (updatedGoal: Goal) => {
    useGoalStore.getState().updateGoal(goal.id, updatedGoal);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="flex items-center text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
      
      <GoalDetailView
        goal={goal}
        onUpdate={handleGoalUpdate}
      />
    </div>
  );
}
