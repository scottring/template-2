'use client';

import { Card } from "@/components/ui/card";
import useItineraryStore from "@/lib/stores/useItineraryStore";
import useGoalStore from "@/lib/stores/useGoalStore";
import { UnscheduledTasks } from "@/components/dashboard/UnscheduledTasks";
import { useMemo, useState, useEffect } from "react";
import { format, isPast } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Trash2, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { ScheduleDialog } from "@/components/planning/ScheduleDialog";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { ItineraryItem, Step, Goal } from "@/types/models";
import { useJourneyStore } from '@/lib/stores/useJourneyStore';
import { useRouter } from 'next/navigation';

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

// Add helper for day name conversion
const dayNumberToName = (day: number): string => {
  const days = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
  return days[day];
};

const dayNameToNumber = (name: string): number => {
  const days = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
  return days.indexOf(name);
};

type PendingItem = Omit<ItineraryItem, 'id'>;

type DashboardItem = ItineraryItem | PendingItem;

export default function DashboardPage() {
  const { items: allItems, updateItem, deleteItem, addItem, loadItems } = useItineraryStore();
  const { goals: activeGoals, fetchGoals } = useGoalStore();
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const router = useRouter();
  const { isWeeklyReviewNeeded } = useJourneyStore();

  useEffect(() => {
    if (user?.householdId) {
      console.log('Loading initial data for dashboard...');
      loadItems(user.householdId);
      fetchGoals(user.householdId);
    }
  }, [user?.householdId, loadItems, fetchGoals]);

  useEffect(() => {
    if (isWeeklyReviewNeeded()) {
      router.push('/review');
    }
  }, [isWeeklyReviewNeeded, router]);

  // Filter items that are scheduled for today or are unfinished tangible steps
  const todayItems = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const currentDayName = dayNumberToName(currentDayOfWeek);
    
    // First, get all scheduled items from the itinerary
    const scheduledItems = allItems.filter(item => {
      // For habit steps, check if scheduled for today
      if (item.type === 'habit' && item.schedule?.schedules) {
        return item.schedule.schedules.some(schedule => schedule.day === currentDayOfWeek);
      }
      
      // For tangible steps, include if not completed and either:
      // 1. Has no target date, or
      // 2. Target date is in the past or today
      if (item.type === 'tangible') {
        return !item.targetDate || isPast(new Date(item.targetDate));
      }

      return false;
    });

    // Create a map of existing items to avoid duplicates
    const existingItems = new Map(
      scheduledItems.map(item => [`${item.referenceId}-${item.criteriaId}`, item])
    );

    // Then, get all steps from goals that are scheduled for today but don't have itinerary items yet
    const stepsForToday = activeGoals.flatMap((goal: Goal) => 
      goal.steps
        .filter((step: Step) => {
          // Skip if not tracked
          if (!step.isTracked) return false;
          
          // Skip if we already have an itinerary item for this step
          const existingItem = existingItems.get(`${goal.id}-${step.id}`);
          if (existingItem) return false;
          
          // Check if step is scheduled for today
          return step.selectedDays?.includes(currentDayName);
        })
        .map((step: Step) => ({
          // Don't include an ID for new items
          type: step.stepType.toLowerCase() as 'habit' | 'tangible',
          referenceId: goal.id,
          criteriaId: step.id,
          notes: step.text,
          status: 'pending' as const,
          householdId: goal.householdId,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: user?.uid || '',
          updatedBy: user?.uid || '',
          schedule: {
            startDate: new Date(),
            schedules: step.selectedDays?.map(day => ({
              day: dayNameToNumber(day),
              time: step.scheduledTimes?.[day]?.[0] || ''
            })) || []
          }
        }))
    );

    // Combine items and sort by completion status and time
    return [...scheduledItems, ...stepsForToday].sort((a, b) => {
      // Put completed items at the bottom
      if ('id' in a && 'id' in b) {
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
      }
      
      // Sort by scheduled time if available
      const aSchedule = a.schedule?.schedules?.find(s => s.day === currentDayOfWeek);
      const bSchedule = b.schedule?.schedules?.find(s => s.day === currentDayOfWeek);
      if (aSchedule?.time && bSchedule?.time) {
        return aSchedule.time.localeCompare(bSchedule.time);
      }
      
      return 0;
    });
  }, [allItems, activeGoals, user]);

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

    // Only try to update if the item has an ID
    if ('id' in selectedItem) {
      updateItem(selectedItem.id, {
        schedule,
        updatedBy: user.uid
      });
    }
    setScheduleDialogOpen(false);
    setSelectedItem(null);
  };

  const handleUnschedule = (item: DashboardItem) => {
    if (!user) return;
    if ('id' in item) {
      deleteItem(item.id);
    }
  };

  const handleMarkComplete = async (item: DashboardItem) => {
    if (!user || !user.householdId) {
      console.log('No user or householdId');
      return;
    }

    const itemKey = 'id' in item ? item.id : `${item.referenceId}-${item.criteriaId}`;
    if (isUpdating) {
      console.log('Already updating an item');
      return;
    }
    
    setIsUpdating(itemKey);

    try {
      console.log('Handling mark complete for item:', {
        hasId: 'id' in item,
        type: item.type,
        notes: item.notes,
        status: 'id' in item ? item.status : 'new item',
        referenceId: item.referenceId,
        criteriaId: item.criteriaId,
        householdId: item.householdId
      });

      // If the item doesn't have an ID, it means it's a new item that needs to be created
      if (!('id' in item)) {
        console.log('Creating new itinerary item...');
        // Create new itinerary item
        const newItem = {
          type: item.type,
          referenceId: item.referenceId,
          criteriaId: item.criteriaId,
          notes: item.notes,
          status: 'completed' as const,
          householdId: user.householdId,
          createdBy: user.uid,
          updatedBy: user.uid,
          schedule: item.schedule || {
            startDate: new Date(),
            schedules: []
          }
        };
        
        console.log('Adding new item:', newItem);
        try {
          const newId = await addItem(newItem);
          console.log('Successfully added new item with ID:', newId);
          // Force a refresh of items
          await loadItems(user.householdId);
        } catch (addError) {
          console.error('Error adding item:', addError);
          throw addError;
        }
      } else {
        // For existing items, just update the status
        console.log('Updating existing item:', {
          id: item.id,
          currentStatus: item.status,
          newStatus: item.status === 'completed' ? 'pending' : 'completed'
        });
        try {
          await updateItem(item.id, { 
            status: item.status === 'completed' ? 'pending' : 'completed',
            updatedBy: user.uid
          });
          console.log('Successfully updated item status');
          // Force a refresh of items
          await loadItems(user.householdId);
        } catch (updateError) {
          console.error('Error updating item:', updateError);
          throw updateError;
        }
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    } finally {
      setIsUpdating(null);
    }
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
                  {todayItems.map((item: DashboardItem) => {
                    const todaySchedule = item.schedule?.schedules?.find(s => s.day === new Date().getDay());
                    const goal = activeGoals.find(g => g.id === item.referenceId);
                    const isOverdue = item.type === 'tangible' && item.targetDate && isPast(new Date(item.targetDate));

                    return (
                      <motion.div 
                        key={'id' in item ? item.id : `${item.referenceId}-${item.criteriaId}`}
                        variants={itemVariants}
                        className={cn(
                          "group relative flex items-center justify-between p-4 rounded-lg transition-all duration-300",
                          "bg-gradient-to-r from-background to-accent/5 hover:from-accent/5 hover:to-accent/10",
                          "border border-primary/10 hover:border-primary/20",
                          "shadow-sm hover:shadow-md",
                          isOverdue && "border-destructive/20 bg-destructive/5"
                        )}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                        <div className="flex items-center gap-4 relative">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={'id' in item ? item.status === 'completed' : false}
                              className="peer absolute inset-0 opacity-0 cursor-pointer w-8 h-8 -left-1 -top-1 z-10"
                              onChange={() => handleMarkComplete(item)}
                            />
                            <div className={cn(
                              "w-6 h-6 rounded-full border-2 transition-colors duration-200",
                              "border-primary/20 peer-hover:border-primary/40",
                              'id' in item && item.status === 'completed' ? "bg-primary/10" : "bg-transparent",
                              isOverdue && "border-destructive/40"
                            )}>
                              <CheckCircle2 className={cn(
                                "w-5 h-5 transition-opacity duration-200 pointer-events-none",
                                'id' in item && item.status === 'completed' ? "opacity-100" : "opacity-0",
                                isOverdue ? "text-destructive" : "text-primary"
                              )} />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                "font-medium transition-all duration-200",
                                'id' in item && item.status === 'completed' && "line-through text-muted-foreground"
                              )}>
                                {item.notes}
                              </p>
                              {isOverdue && (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              )}
                            </div>
                            {todaySchedule?.time && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {todaySchedule.time}
                              </p>
                            )}
                            {item.targetDate && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                Due: {format(new Date(item.targetDate), 'MMM do')}
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
                              setSelectedItem(item as ItineraryItem);
                              setScheduleDialogOpen(true);
                            }}
                            className="hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                          {'id' in item && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUnschedule(item)}
                              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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