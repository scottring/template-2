'use client';

import { useMemo, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import useGoalStore from "@/lib/stores/useGoalStore";
import useItineraryStore from "@/lib/stores/useItineraryStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Calendar, CheckCircle2, Target, Trophy, ArrowUp, ArrowDown } from "lucide-react";
import { Goal, ItineraryItem } from "@/types/models";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const calculateStreak = (items: ItineraryItem[]) => {
  let streak = 0;
  const today = new Date();
  const sortedItems = items
    .filter(item => item.status === 'completed')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (sortedItems.length === 0) return 0;

  let currentDate = today;
  let consecutiveDays = 0;

  while (true) {
    const hasCompletedTask = sortedItems.some(item => {
      const itemDate = new Date(item.updatedAt);
      return itemDate.toDateString() === currentDate.toDateString();
    });

    if (!hasCompletedTask) break;

    consecutiveDays++;
    currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
  }

  return Math.floor(consecutiveDays / 7);
};

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
  const metrics = useMemo(() => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Tasks metrics
    const completedItems = allItems.filter((item: ItineraryItem) => item.status === 'completed').length;
    const totalItems = allItems.length;
    const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    
    const recentItems = allItems.filter(item => new Date(item.createdAt) > lastWeek);
    const recentCompletedItems = recentItems.filter(item => item.status === 'completed').length;
    const recentCompletionRate = recentItems.length > 0 ? (recentCompletedItems / recentItems.length) * 100 : 0;
    const taskTrend = completionRate > recentCompletionRate ? 'up' : 'down';

    // Goals metrics
    const completedGoals = activeGoals.filter((goal: Goal) => 
      goal.steps.every(step => 
        !step.isTracked || 
        (step.tasks?.length === 0 || step.tasks?.every(task => task.completed))
      )
    ).length;
    const totalGoals = activeGoals.length;
    const goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    const recentGoals = activeGoals.filter(goal => new Date(goal.createdAt) > lastWeek);
    const recentCompletedGoals = recentGoals.filter(goal => 
      goal.steps.every(step => 
        !step.isTracked || 
        (step.tasks?.length === 0 || step.tasks?.every(task => task.completed))
      )
    ).length;
    const recentGoalRate = recentGoals.length > 0 ? (recentCompletedGoals / recentGoals.length) * 100 : 0;
    const goalTrend = goalCompletionRate > recentGoalRate ? 'up' : 'down';

    // Calculate streak
    const streak = calculateStreak(allItems);

    return {
      tasks: { total: totalItems, completed: completedItems, rate: completionRate, trend: taskTrend },
      goals: { total: totalGoals, completed: completedGoals, rate: goalCompletionRate, trend: goalTrend },
      streak
    };
  }, [allItems, activeGoals]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
        Dashboard
      </h1>
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <motion.div variants={item}>
          <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                Total Tasks
              </CardTitle>
              <div className="flex items-center gap-2">
                {metrics.tasks.trend === 'up' ? (
                  <ArrowUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.tasks.total}</div>
              <Progress 
                value={metrics.tasks.rate} 
                className="mt-2 bg-primary/10 [&>[role=progressbar]]:bg-gradient-to-r [&>[role=progressbar]]:from-primary [&>[role=progressbar]]:to-accent-foreground" 
              />
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.tasks.completed} completed
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                Active Goals
              </CardTitle>
              <div className="flex items-center gap-2">
                {metrics.goals.trend === 'up' ? (
                  <ArrowUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <Target className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.goals.total}</div>
              <Progress 
                value={metrics.goals.rate} 
                className="mt-2 bg-primary/10 [&>[role=progressbar]]:bg-gradient-to-r [&>[role=progressbar]]:from-primary [&>[role=progressbar]]:to-accent-foreground" 
              />
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.goals.completed} achieved
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                Weekly Streak
              </CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.streak} weeks</div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.streak > 0 ? "Keep up the momentum!" : "Start your streak today!"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                Next Review
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(() => {
                  const today = new Date();
                  const nextSunday = new Date(today.setDate(today.getDate() + (7 - today.getDay())));
                  const daysUntilReview = Math.ceil((nextSunday.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return `${daysUntilReview} days`;
                })()}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Until weekly review
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList className="bg-background/60 border-primary/10">
          <TabsTrigger 
            value="progress"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Progress
          </TabsTrigger>
          <TabsTrigger 
            value="goals"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Goals
          </TabsTrigger>
          <TabsTrigger 
            value="habits"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Habits
          </TabsTrigger>
        </TabsList>
        <TabsContent value="progress" className="space-y-4">
          <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                Weekly Progress
              </CardTitle>
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
          <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                Goal Progress
              </CardTitle>
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
          <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                Habit Streaks
              </CardTitle>
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