'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useGoalStore from '@/lib/stores/useGoalStore';
import useTaskStore from '@/lib/stores/useTaskStore';
import { useAuth } from '@/lib/hooks/useAuth';

// Convert stage components to proper React components to fix hook rules
const Onboarding = () => {
  const { goals } = useGoalStore();
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Set Your Vision</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Start by setting your household&apos;s vision and long-term goals.
          </p>
          {/* Add vision setting form or link to goals page */}
        </CardContent>
      </Card>
    </div>
  );
};

const Planning = () => {
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
};

const Daily = () => {
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
};

const Tracking = () => {
  const { goals } = useGoalStore();
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Track Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Monitor your household&apos;s progress towards goals.
          </p>
          {/* Add progress tracking visualizations */}
        </CardContent>
      </Card>
    </div>
  );
};

const Reflection = () => {
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
};

const StageContent = {
  onboarding: Onboarding,
  planning: Planning,
  daily: Daily,
  tracking: Tracking,
  reflection: Reflection
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