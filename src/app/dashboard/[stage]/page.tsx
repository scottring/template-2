'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useGoalStore from '@/lib/stores/useGoalStore';
import useTaskStore from '@/lib/stores/taskStore';
import { useAuth } from '@/lib/hooks/useAuth';

const StageContent = {
  onboarding: () => {
    const { goals } = useGoalStore();
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Set Your Vision</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Start by setting your household's vision and long-term goals.
            </p>
            {/* Add vision setting form or link to goals page */}
          </CardContent>
        </Card>
      </div>
    );
  },
  planning: () => {
    const { goals } = useGoalStore();
    const { tasks } = useTaskStore();
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Plan Your Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Break down your goals into manageable tasks and assign them to household members.
            </p>
            {/* Add task planning interface */}
          </CardContent>
        </Card>
      </div>
    );
  },
  daily: () => {
    const { tasks } = useTaskStore();
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              View and manage your daily household tasks.
            </p>
            {/* Add daily task management interface */}
          </CardContent>
        </Card>
      </div>
    );
  },
  tracking: () => {
    const { goals } = useGoalStore();
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Track Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Monitor your household's progress towards goals.
            </p>
            {/* Add progress tracking visualizations */}
          </CardContent>
        </Card>
      </div>
    );
  },
  reflection: () => {
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Reflect & Adjust</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Review your progress and make adjustments to your plans.
            </p>
            {/* Add reflection tools and adjustment interface */}
          </CardContent>
        </Card>
      </div>
    );
  }
};

export default function StagePage() {
  const params = useParams();
  const stage = params.stage as keyof typeof StageContent;
  
  if (!StageContent[stage]) {
    return <div>Invalid stage</div>;
  }

  const StageComponent = StageContent[stage];
  return <StageComponent />;
} 