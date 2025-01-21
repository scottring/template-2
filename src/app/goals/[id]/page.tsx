'use client';

import { notFound, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getGoalById } from '@/lib/api/goals';
import GoalDetail from '@/components/goals/GoalDetailView';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import DefaultComponent from '@/components/shared/DefaultComponent';
import { useEffect, useState } from 'react';
import { Goal } from '@/types/models';
import useGoalStore from '@/lib/stores/useGoalStore';
import { toast, Toaster } from 'sonner';

interface PageProps {
  params: { id: string };
}

export default function GoalPage({ params }: PageProps) {
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateGoal } = useGoalStore();

  useEffect(() => {
    const loadGoal = async () => {
      try {
        const fetchedGoal = await getGoalById(params.id);
        setGoal(fetchedGoal);
      } catch (error) {
        console.error('Error fetching goal:', error);
        setError('Failed to load goal');
        toast.error('Failed to load goal');
      } finally {
        setLoading(false);
      }
    };

    loadGoal();
  }, [params.id]);

  const handleUpdate = async (updatedGoal: Goal) => {
    setUpdating(true);
    try {
      await updateGoal(updatedGoal.id, updatedGoal);
      setGoal(updatedGoal);
      toast.success('Goal updated successfully');
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        
        <div className="space-y-6">
          {/* Header Card */}
          <div className="h-24 bg-card border rounded-lg animate-pulse" />
          
          {/* Progress Card */}
          <div className="h-24 bg-card border rounded-lg animate-pulse" />
          
          {/* Steps */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-card border rounded-lg animate-pulse" />
          ))}
          
          {/* Add Step Button */}
          <div className="h-10 bg-card border rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => router.push('/goals')}
            className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
          >
            Back to Goals
          </button>
        </div>
      </div>
    );
  }

  if (!goal && !loading) {
    return <DefaultComponent />;
  }

  // We know goal is not null here because of the earlier check
  const safeGoal = goal as Goal;
  
  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4">
        <Toaster position="top-right" />
        <Button
          variant="ghost"
          onClick={() => router.push('/goals')}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Goals
        </Button>
        <h1 className="text-2xl font-bold mb-4">Goal Details</h1>
        <GoalDetail 
          goal={safeGoal}
          onUpdate={handleUpdate}
          disabled={updating}
        />
      </div>
    </ErrorBoundary>
  );
}
