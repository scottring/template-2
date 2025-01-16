'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import useGoalStore from '@/lib/stores/useGoalStore';
import { ItineraryItem, Goal } from '@/types/models';
import { QuickAddButton } from '@/components/planning/QuickAddButton';

export default function DashboardPage() {
  const { items: todayItems } = useItineraryStore();
  const { goals: activeGoals } = useGoalStore();

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <QuickAddButton />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Today's Schedule</h2>
          {todayItems.length === 0 ? (
            <p className="text-muted-foreground">No items scheduled for today</p>
          ) : (
            <ul className="space-y-2">
              {todayItems.map(item => (
                <li key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.status === 'completed'}
                    className="rounded border-gray-300"
                  />
                  <span>{item.notes}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Active Goals</h2>
          {activeGoals.length === 0 ? (
            <p className="text-muted-foreground">No active goals</p>
          ) : (
            <ul className="space-y-2">
              {activeGoals.map(goal => (
                <li key={goal.id}>
                  <a href={`/goals/${goal.id}`} className="hover:underline">
                    {goal.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
} 