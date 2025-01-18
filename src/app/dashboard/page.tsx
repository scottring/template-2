'use client';

import { useMemo, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import useGoalStore from "@/lib/stores/useGoalStore";
import useItineraryStore from "@/lib/stores/useItineraryStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Calendar, CheckCircle2, Target, Trophy } from "lucide-react";
import { Goal, ItineraryItem } from "@/types/models";

export default function DashboardPage() {
  const { user } = useAuth();
  const { items: allItems, loadItems } = useItineraryStore();
  const { goals: activeGoals, fetchGoals } = useGoalStore();

  useEffect(() => {
    if (user?.householdId) {
      loadItems(user.householdId);
      fetchGoals(user.householdId);
    }
  }, [user?.householdId, loadItems, fetchGoals]);

  // Calculate metrics
  const completedItems = allItems.filter((item: ItineraryItem) => item.status === 'completed').length;
  const totalItems = allItems.length;
  const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const completedGoals = activeGoals.filter((goal: Goal) => 
    goal.steps.every(step => 
      !step.isTracked || // Skip untracked steps
      (step.tasks.length === 0 || step.tasks.every(task => task.completed)) // All tasks completed or no tasks
    )
  ).length;
  const totalGoals = activeGoals.length;
  const goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <Progress value={completionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedItems} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals}</div>
            <Progress value={goalCompletionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedGoals} achieved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Streak</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4 weeks</div>
            <p className="text-xs text-muted-foreground mt-2">
              Keep up the momentum!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Review</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 days</div>
            <p className="text-xs text-muted-foreground mt-2">
              Until weekly review
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="habits">Habits</TabsTrigger>
        </TabsList>
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Progress</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <BarChart className="h-16 w-16" />
                <span className="ml-4">Progress chart coming soon</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Goal Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <Target className="h-16 w-16" />
                <span className="ml-4">Goal tracking visualization coming soon</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="habits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Habit Streaks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <CheckCircle2 className="h-16 w-16" />
                <span className="ml-4">Habit tracking visualization coming soon</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 