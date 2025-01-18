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
        <h1 className="text-3xl font-bold">Track</h1>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[240px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, 'PPP')}
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
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {items.length === 0 ? (
                <motion.p 
                  variants={item}
                  className="text-muted-foreground"
                >
                  No items scheduled for today
                </motion.p>
              ) : (
                <motion.div className="space-y-2" variants={container}>
                  {items.map(item => {
                    const goal = goals.find(g => g.id === item.referenceId);
                    const streak = getStreak(item.id);
                    
                    return (
                      <motion.div
                        key={item.id}
                        variants={item as any}
                        layout
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleComplete(item.id)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            {item.status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>
                          
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{goal?.name}</span>
                              {item.notes && (
                                <span className="text-sm text-muted-foreground">
                                  - {item.notes}
                                </span>
                              )}
                            </div>
                            
                            {item.schedule?.repeat && (
                              <div className="text-sm text-muted-foreground">
                                Every {item.schedule.repeat}
                                {streak > 0 && (
                                  <span className="ml-2">
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
                            className="text-muted-foreground hover:text-primary"
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
        <Card>
          <CardHeader>
            <CardTitle>Active Habits</CardTitle>
          </CardHeader>
          <CardContent>
            <ActiveHabits />
          </CardContent>
        </Card>

        {/* Unscheduled Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Unscheduled Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <UnscheduledTasks />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 