'use client';

import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';

const stages = {
  onboarding: {
    title: 'Base Goal Setting',
    description: 'Set your household vision and invite members to collaborate.',
    icon: '🎯'
  },
  planning: {
    title: 'Review & Planning',
    description: 'Plan out your goals and distribute tasks among household members.',
    icon: '📋'
  },
  daily: {
    title: 'Daily Life',
    description: 'Execute tasks and maintain daily household operations.',
    icon: '🏡'
  },
  tracking: {
    title: 'Progress Tracking',
    description: 'Monitor goal progress and celebrate achievements.',
    icon: '📈'
  },
  reflection: {
    title: 'Reflection & Adjustment',
    description: 'Review progress, identify improvements, and adjust plans.',
    icon: '💭'
  }
};

export default function StageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const stage = stages[params.stage as keyof typeof stages];

  if (!stage) {
    return <div>Invalid stage</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">{stage.icon}</span>
          <div>
            <h1 className="text-2xl font-bold">{stage.title}</h1>
            <p className="text-muted-foreground">{stage.description}</p>
          </div>
        </div>
      </Card>
      {children}
    </div>
  );
} 