'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CalendarDays, CalendarRange, CalendarClock, ArrowRight, CheckCircle2, ListChecks, Calendar } from 'lucide-react';

const planningTypes = [
  {
    title: 'Weekly Planning',
    description: 'Plan your week ahead, schedule tasks and habits, and ensure a balanced workload.',
    icon: CalendarDays,
    link: '/planning/weekly',
    status: 'Ready',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    title: 'Monthly Planning',
    description: 'Review and adjust monthly goals, plan major milestones, and distribute work across weeks.',
    icon: CalendarRange,
    link: '/planning/monthly',
    status: 'Ready',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    title: 'Quarterly Planning',
    description: 'Set strategic goals, plan key initiatives, and align your monthly objectives.',
    icon: CalendarClock,
    link: '/planning/quarterly',
    status: 'Ready',
    color: 'bg-green-100 text-green-600'
  }
];

const tutorialSteps = [
  {
    title: 'Review Goals',
    description: 'Start by reviewing your goals and their success criteria. This helps you understand what needs to be scheduled.',
    icon: ListChecks
  },
  {
    title: 'Mark for Scheduling',
    description: 'Select which success criteria need to be scheduled. You can mark multiple items before moving to scheduling.',
    icon: CheckCircle2
  },
  {
    title: 'Schedule Items',
    description: 'Choose when and how often each item should occur. The schedule view helps you maintain balance.',
    icon: Calendar
  }
];

export default function PlanningPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Planning</h1>
        <p className="text-gray-600 mt-2">Choose a planning session to get started</p>
      </div>

      {/* Planning Sessions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Planning Sessions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planningTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card 
                key={type.title}
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(type.link)}
              >
                <div className={`w-12 h-12 rounded-lg ${type.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{type.title}</h3>
                <p className="text-gray-600 mb-4">{type.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">{type.status}</span>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How Planning Works */}
      <section>
        <h2 className="text-xl font-semibold mb-4">How Planning Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tutorialSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    {index + 1}
                  </div>
                  <Icon className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
} 