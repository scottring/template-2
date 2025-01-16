'use client';

import { Card } from "@/components/ui/card";
import useItineraryStore from "@/lib/stores/useItineraryStore";
import useGoalStore from "@/lib/stores/useGoalStore";
import { UnscheduledTasks } from "@/components/dashboard/UnscheduledTasks";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Trash2, ChevronRight, CheckCircle2 } from "lucide-react";
import { ScheduleDialog } from "@/components/planning/ScheduleDialog";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, Variants } from "framer-motion";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
  const { items: allItems, updateItem, deleteItem } = useItineraryStore();
  const { goals: activeGoals } = useGoalStore();
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  // Filter items that are scheduled for today
  const todayItems = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    return allItems.filter(item => {
      if (item.status === 'completed') return false;
      if (!item.schedule?.schedules) return false;
      return item.schedule.schedules.some(schedule => schedule.day === currentDayOfWeek);
    });
  }, [allItems]);

  const handleReschedule = (config: any) => {
    if (!selectedItem || !user) return;
    const schedule: any = {
      startDate: new Date(),
      schedules: config.schedules,
    };
    if (config.repeat !== 'none') {
      schedule.repeat = config.repeat;
      schedule.endDate = config.endDate;
    }
    updateItem(selectedItem.id, {
      schedule,
      updatedBy: user.uid
    });
    setScheduleDialogOpen(false);
    setSelectedItem(null);
  };

  const handleUnschedule = (itemId: string) => {
    if (!user) return;
    deleteItem(itemId);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-4xl font-bold">
          <span className="bg-gradient-to-r from-primary via-accent-foreground to-primary bg-clip-text text-transparent">
            Dashboard
          </span>
        </h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), 'EEEE, MMMM do')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Main Content - Today's Schedule */}
        <motion.div 
          className="md:col-span-8 space-y-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                  Today's Schedule
                </h2>
                <Button variant="outline" size="sm" asChild className="border-primary/20 hover:border-primary">
                  <Link href="/calendar" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    View Calendar
                  </Link>
                </Button>
              </div>
              
              {todayItems.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 rounded-lg bg-gradient-to-b from-accent/5 to-transparent"
                >
                  <CalendarIcon className="h-12 w-12 mx-auto text-primary/30" />
                  <p className="text-muted-foreground mt-2">No items scheduled for today</p>
                  <Button variant="outline" size="sm" className="mt-4 border-primary/20 hover:border-primary" onClick={() => setScheduleDialogOpen(true)}>
                    Schedule Something
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  className="space-y-4"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {todayItems.map(item => {
                    const todaySchedule = item.schedule?.schedules.find(s => s.day === new Date().getDay());
                    const goal = activeGoals.find(g => g.id === item.referenceId);

                    return (
                      <motion.div 
                        key={item.id}
                        variants={itemVariants}
                        className={cn(
                          "group relative flex items-center justify-between p-4 rounded-lg transition-all duration-300",
                          "bg-gradient-to-r from-background to-accent/5 hover:from-accent/5 hover:to-accent/10",
                          "border border-primary/10 hover:border-primary/20",
                          "shadow-sm hover:shadow-md"
                        )}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                        <div className="flex items-center gap-4 relative">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={item.status === 'completed'}
                              className="peer absolute inset-0 opacity-0 cursor-pointer w-6 h-6"
                              onChange={() => updateItem(item.id, { 
                                status: item.status === 'completed' ? 'pending' : 'completed',
                                updatedBy: user?.uid
                              })}
                            />
                            <div className={cn(
                              "w-6 h-6 rounded-full border-2 transition-colors duration-200",
                              "border-primary/20 peer-hover:border-primary/40",
                              item.status === 'completed' ? "bg-primary/10" : "bg-transparent"
                            )}>
                              <CheckCircle2 className={cn(
                                "w-5 h-5 text-primary transition-opacity duration-200",
                                item.status === 'completed' ? "opacity-100" : "opacity-0"
                              )} />
                            </div>
                          </div>
                          <div>
                            <p className={cn(
                              "font-medium transition-all duration-200",
                              item.status === 'completed' && "line-through text-muted-foreground"
                            )}>{item.notes}</p>
                            {todaySchedule?.time && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {todaySchedule.time}
                              </p>
                            )}
                            {goal && (
                              <Link 
                                href={`/goals/${goal.id}`}
                                className="text-xs text-primary hover:text-primary/80 mt-1 inline-block transition-colors"
                              >
                                {goal.name}
                              </Link>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 relative">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedItem(item);
                              setScheduleDialogOpen(true);
                            }}
                            className="hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUnschedule(item.id)}
                            className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Sidebar - Goals and Tasks */}
        <motion.div 
          className="md:col-span-4 space-y-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Active Goals Card */}
          <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
                  Active Goals
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/goals" className="text-muted-foreground hover:text-primary transition-colors">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
              {activeGoals.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 rounded-lg bg-gradient-to-b from-accent/5 to-transparent"
                >
                  <p className="text-muted-foreground">No active goals</p>
                  <Button variant="outline" size="sm" className="mt-4 border-primary/20 hover:border-primary" asChild>
                    <Link href="/goals/new">Create a Goal</Link>
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  className="space-y-3"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {activeGoals.map(goal => (
                    <motion.div
                      key={goal.id}
                      variants={itemVariants}
                    >
                      <Link
                        href={`/goals/${goal.id}`}
                        className={cn(
                          "group block p-3 rounded-lg transition-all duration-300",
                          "bg-gradient-to-r from-background to-accent/5 hover:from-accent/5 hover:to-accent/10",
                          "border border-primary/10 hover:border-primary/20",
                          "relative overflow-hidden"
                        )}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {goal.name}
                          </p>
                          {goal.targetDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Target: {format(new Date(goal.targetDate), 'MMM do, yyyy')}
                            </p>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </Card>

          {/* Unscheduled Tasks Component */}
          <UnscheduledTasks />
        </motion.div>
      </div>

      {selectedItem && (
        <ScheduleDialog
          open={scheduleDialogOpen}
          onClose={() => {
            setScheduleDialogOpen(false);
            setSelectedItem(null);
          }}
          onSchedule={handleReschedule}
          itemName={selectedItem.notes}
          targetDate={activeGoals.find(g => g.id === selectedItem.referenceId)?.targetDate}
          initialSchedule={selectedItem.schedule}
        />
      )}
    </div>
  );
} 