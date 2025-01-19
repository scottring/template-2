'use client';

import { useMemo, useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import useGoalStore from "@/lib/stores/useGoalStore";
import useItineraryStore from "@/lib/stores/useItineraryStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Calendar, CheckCircle2, Target, Trophy, ArrowUp, ArrowDown, HelpCircle } from "lucide-react";
import { Goal, ItineraryItem } from "@/types/models";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Onboarding } from "@/components/Onboarding";

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
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user?.householdId) {
      loadItems(user.householdId);
      fetchGoals(user.householdId);
    }
  }, [user?.householdId, loadItems, fetchGoals]);

  // Calculate metrics and organize items
  const dashboardData = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get current items (due today)
    const currentItems = allItems.filter(item => {
      const itemDate = new Date(item.schedule?.startDate || item.dueDate || new Date());
      return itemDate.toDateString() === today.toDateString() && item.status !== 'completed';
    }).sort((a, b) => {
      const aDate = new Date(a.schedule?.startDate || a.dueDate || new Date());
      const bDate = new Date(b.schedule?.startDate || b.dueDate || new Date());
      return aDate.getTime() - bDate.getTime();
    });

    // Get next items (due tomorrow)
    const nextItems = allItems.filter(item => {
      const itemDate = new Date(item.schedule?.startDate || item.dueDate || new Date());
      return itemDate.toDateString() === tomorrow.toDateString();
    }).sort((a, b) => {
      const aDate = new Date(a.schedule?.startDate || a.dueDate || new Date());
      const bDate = new Date(b.schedule?.startDate || b.dueDate || new Date());
      return aDate.getTime() - bDate.getTime();
    });

    // Get upcoming items (beyond tomorrow)
    const upcomingItems = allItems.filter(item => {
      const itemDate = new Date(item.schedule?.startDate || item.dueDate || new Date());
      return itemDate > tomorrow && item.status !== 'completed';
    }).sort((a, b) => {
      const aDate = new Date(a.schedule?.startDate || a.dueDate || new Date());
      const bDate = new Date(b.schedule?.startDate || b.dueDate || new Date());
      return aDate.getTime() - bDate.getTime();
    });

    // Calculate task metrics
    const completedItems = allItems.filter(item => item.status === 'completed').length;
    const totalItems = allItems.length;
    const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    // Get active goals (in progress)
    const inProgressGoals = activeGoals.filter(goal => {
      const hasCompletedSteps = goal.steps.some(step => 
        step.isTracked && step.tasks?.some(task => task.completed)
      );
      const hasIncompleteSteps = goal.steps.some(step => 
        step.isTracked && (!step.tasks?.length || step.tasks.some(task => !task.completed))
      );
      return hasCompletedSteps && hasIncompleteSteps;
    });

    return {
      current: currentItems,
      next: nextItems,
      upcoming: upcomingItems,
      inProgressGoals,
      stats: {
        total: totalItems,
        completed: completedItems,
        rate: completionRate
      }
    };
  }, [allItems, activeGoals]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
          Dashboard
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowOnboarding(true)}
          className="flex items-center gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          Show Tutorial
        </Button>
      </div>
      
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
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.total}</div>
              <Progress 
                value={dashboardData.stats.rate} 
                className="mt-2 bg-primary/10 [&>[role=progressbar]]:bg-gradient-to-r [&>[role=progressbar]]:from-primary [&>[role=progressbar]]:to-accent-foreground" 
              />
              <p className="text-xs text-muted-foreground mt-2">
                {dashboardData.stats.completed} completed
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
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.inProgressGoals.length}</div>
              <Progress 
                value={dashboardData.inProgressGoals.length > 0 ? 100 : 0} 
                className="mt-2 bg-primary/10 [&>[role=progressbar]]:bg-gradient-to-r [&>[role=progressbar]]:from-primary [&>[role=progressbar]]:to-accent-foreground" 
              />
              <p className="text-xs text-muted-foreground mt-2">
                Goals in progress
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                Today's Tasks
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.current.length}</div>
              <Progress 
                value={dashboardData.current.length > 0 ? 100 : 0}
                className="mt-2 bg-primary/10 [&>[role=progressbar]]:bg-gradient-to-r [&>[role=progressbar]]:from-primary [&>[role=progressbar]]:to-accent-foreground" 
              />
              <p className="text-xs text-muted-foreground mt-2">
                Items for today
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

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList className="bg-background/60 border-primary/10">
          <TabsTrigger 
            value="current"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Current
          </TabsTrigger>
          <TabsTrigger 
            value="next"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Next
          </TabsTrigger>
          <TabsTrigger 
            value="upcoming"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Upcoming
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                Today's Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.current.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.current.map((item) => (
                    <div key={item.id} className="flex items-start space-x-4 p-4 rounded-lg bg-primary/5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.notes}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.schedule?.startDate || item.dueDate || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.referenceId && (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {activeGoals.find(g => g.id === item.referenceId)?.name || 'Goal'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>All caught up for today! 🎉</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4"
                    onClick={() => setShowOnboarding(true)}
                  >
                    Create a new goal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {dashboardData.inProgressGoals.length > 0 && (
            <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                  Goals in Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.inProgressGoals.map((goal) => (
                    <div key={goal.id} className="p-4 rounded-lg bg-primary/5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{goal.name}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {Math.round(
                            (goal.steps.filter(s => s.isTracked && s.tasks?.every(t => t.completed)).length /
                            goal.steps.filter(s => s.isTracked).length) * 100
                          )}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{goal.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="next" className="space-y-4">
          <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                Tomorrow's Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.next.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.next.map((item) => (
                    <div key={item.id} className="flex items-start space-x-4 p-4 rounded-lg bg-primary/5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.notes}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.schedule?.startDate || item.dueDate || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {item.referenceId && (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {activeGoals.find(g => g.id === item.referenceId)?.name || 'Goal'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nothing planned for tomorrow yet</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4"
                    onClick={() => setShowOnboarding(true)}
                  >
                    Plan your day
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                Coming Up
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.upcoming.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(
                    dashboardData.upcoming.reduce((acc, item) => {
                      const date = new Date(item.schedule?.startDate || item.dueDate || new Date()).toDateString();
                      if (!acc[date]) acc[date] = [];
                      acc[date].push(item);
                      return acc;
                    }, {} as Record<string, typeof dashboardData.upcoming>)
                  ).map(([date, items]) => (
                    <div key={date}>
                      <h3 className="text-sm font-medium mb-3">{new Date(date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-start space-x-4 p-4 rounded-lg bg-primary/5">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{item.notes}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(item.schedule?.startDate || item.dueDate || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {item.referenceId && (
                              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                {activeGoals.find(g => g.id === item.referenceId)?.name || 'Goal'}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No upcoming tasks scheduled</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4"
                    onClick={() => setShowOnboarding(true)}
                  >
                    Plan ahead
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
} 