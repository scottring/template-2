'use client';

import { Card } from "@/components/ui/card";
import { QuickAddButton } from "@/components/planning/QuickAddButton";
import useItineraryStore from "@/lib/stores/useItineraryStore";
import useGoalStore from "@/lib/stores/useGoalStore";
import { UnscheduledTasks } from "@/components/dashboard/UnscheduledTasks";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Trash2 } from "lucide-react";
import { ScheduleDialog } from "@/components/planning/ScheduleDialog";
import { useAuth } from "@/lib/hooks/useAuth";

export default function DashboardPage() {
  const { items: allItems, updateItem, deleteItem } = useItineraryStore();
  const { goals: activeGoals } = useGoalStore();
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  // Filter items that are scheduled for today based on their recurrence pattern
  const todayItems = useMemo(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    return allItems.filter(item => {
      // Skip completed items
      if (item.status === 'completed') return false;

      // If the item has no schedule, it shouldn't appear
      if (!item.schedule?.schedules) return false;

      // Check if any of the scheduled times match today
      return item.schedule.schedules.some(schedule => schedule.day === currentDayOfWeek);
    });
  }, [allItems]);

  const handleReschedule = (config: any) => {
    if (!selectedItem || !user) return;

    // Create schedule object without undefined values
    const schedule: any = {
      startDate: new Date(),
      schedules: config.schedules,
    };

    // Only add repeat and endDate if they have values
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
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <QuickAddButton />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Today's Schedule ({format(new Date(), 'EEEE')})</h2>
          {todayItems.length === 0 ? (
            <p className="text-muted-foreground">No items scheduled for today</p>
          ) : (
            <ul className="space-y-2">
              {todayItems.map(item => {
                // Find the schedule for today to show the time
                const todaySchedule = item.schedule?.schedules.find(s => s.day === new Date().getDay());
                const goal = activeGoals.find(g => g.id === item.referenceId);

                return (
                  <li key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.status === 'completed'}
                        className="rounded border-gray-300"
                      />
                      <div>
                        <span>{item.notes}</span>
                        {todaySchedule?.time && (
                          <p className="text-xs text-muted-foreground">
                            {todaySchedule.time}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedItem(item);
                          setScheduleDialogOpen(true);
                        }}
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUnschedule(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                );
              })}
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

        <UnscheduledTasks />
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