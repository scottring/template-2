'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import useGoalStore from '@/lib/stores/useGoalStore';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import { ActiveHabits } from '@/components/itinerary/ActiveHabits';
import { UnscheduledTasks } from '@/components/dashboard/UnscheduledTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, Variants } from 'framer-motion';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, CheckCircle2, Circle, ArrowUpRight } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WeeklySchedule } from '@/components/itinerary/WeeklySchedule';

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function TrackPage() {
  const { user } = useAuth();
  const { loadItems, getTodayItems, completeItem, getStreak } = useItineraryStore();
  const { goals, fetchGoals } = useGoalStore();
  const [date, setDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (user?.householdId) {
      loadItems(user.householdId);
      fetchGoals(user.householdId);
    }
  }, [user?.householdId, loadItems, fetchGoals]);

  const items = getTodayItems(date);

  const handleComplete = async (itemId: string) => {
    if (!user) return;
    await completeItem(itemId, user.uid);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
          Track
        </h1>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[240px] justify-start text-left font-normal border-primary/10 hover:border-primary/20 hover:bg-accent/5 transition-all duration-200"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{format(date, 'PPP')}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => {
                setDate(date || new Date());
                setCalendarOpen(false);
              }}
              initialFocus
              className="rounded-md border border-primary/10"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
          <CardHeader className="border-b border-primary/5 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {items.length === 0 ? (
                <motion.p 
                  variants={item}
                  className="text-muted-foreground text-center py-8"
                >
                  No items scheduled for today
                </motion.p>
              ) : (
                <motion.div className="space-y-3" variants={container}>
                  {items.map(item => {
                    const goal = goals.find(g => g.id === item.referenceId);
                    const streak = getStreak(item.id);
                    
                    return (
                      <motion.div
                        key={item.id}
                        variants={item as any}
                        layout
                        className="group flex items-center justify-between p-4 rounded-lg hover:bg-accent/5 transition-all duration-200 border border-transparent hover:border-accent/20"
                      >
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleComplete(item.id)}
                            className="text-muted-foreground hover:text-primary transition-colors relative"
                          >
                            <div className="absolute inset-0 bg-primary/10 rounded-full scale-0 group-hover:scale-150 transition-transform duration-300 opacity-0 group-hover:opacity-100" />
                            {item.status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5 transition-transform duration-200 hover:scale-110" />
                            ) : (
                              <Circle className="w-5 h-5 transition-transform duration-200 hover:scale-110" />
                            )}
                          </button>
                          
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-muted-foreground/80 group-hover:text-muted-foreground transition-colors">
                                {goal?.name}
                              </span>
                            </div>
                            {item.notes && (
                              <span className="font-medium text-foreground/90 group-hover:text-foreground transition-colors">
                                {item.notes}
                              </span>
                            )}
                            
                            {item.schedule?.repeat && (
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground/70 group-hover:text-muted-foreground/90 transition-colors">
                                <span>Every {item.schedule.repeat}</span>
                                {streak > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary-foreground">
                                    🔥 {streak} day streak
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {goal && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.location.href = `/goals/${goal.id}`}
                            className="text-muted-foreground/50 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200"
                          >
                            <ArrowUpRight className="w-5 h-5" />
                          </Button>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          </CardContent>
        </Card>

        {/* Active Habits */}
        <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
          <CardHeader className="border-b border-primary/5 bg-gradient-to-r from-accent/5 to-primary/5">
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-accent-foreground to-primary bg-clip-text text-transparent">
              Active Habits
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ActiveHabits />
          </CardContent>
        </Card>

        {/* Unscheduled Tasks */}
        <Card className="lg:col-span-2 overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
          <CardHeader className="border-b border-primary/5 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
              Unscheduled Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <UnscheduledTasks />
          </CardContent>
        </Card>

        {/* Weekly Schedule */}
        <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
          <CardHeader className="border-b border-primary/5 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
              This Week's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <WeeklySchedule startDate={date} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 