'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import useGoalStore from '@/lib/stores/useGoalStore';
import { createFinanceGoal } from './finance-goal';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function AddFinanceGoal() {
  const { user } = useAuth();
  const { addGoal } = useGoalStore();
  const { toast } = useToast();

  const handleAddGoal = async () => {
    if (!user?.householdId) {
      toast({
        title: 'Error',
        description: 'You must be part of a household to create goals',
        variant: 'destructive',
      });
      return;
    }

    try {
      const goal = createFinanceGoal(user.uid, user.householdId);
      await addGoal(goal);
      toast({
        title: 'Success',
        description: 'Financial goal has been created',
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create goal. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button 
      onClick={handleAddGoal}
      className="w-full"
    >
      Create Financial Goal
    </Button>
  );
} 