'use client';

import AddFinanceGoal from '../add-finance-goal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FinanceGoalPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Financial Goal Template</CardTitle>
            <CardDescription>
              Create a structured financial goal with pre-defined steps and tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddFinanceGoal />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 