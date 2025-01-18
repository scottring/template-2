'use client';

import { useMemo } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { motion, Variants } from 'framer-motion';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import useGoalStore from '@/lib/stores/useGoalStore';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface WeeklyScheduleProps {
  startDate: Date;
}

export function WeeklySchedule({ startDate }: WeeklyScheduleProps) {
  const { getItemsForDay, completeItem } = useItineraryStore();
  const { goals } = useGoalStore();

  const weekDays = useMemo(() => {
    const start = startOfWeek(startDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [startDate]);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {/* Calendar Header Row */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map(date => {
          const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          
          return (
            <div 
              key={date.toISOString()}
              className={cn(
                "text-center p-3 rounded-lg transition-colors",
                isToday ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent/5"
              )}
            >
              <div className="font-medium">{format(date, 'EEE')}</div>
              <div className="text-sm">{format(date, 'd MMM')}</div>
            </div>
          );
        })}
      </div>

      {/* Calendar Content Row */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map(date => {
          const items = getItemsForDay(date);
          
          return (
            <div 
              key={date.toISOString()}
              className="min-h-[200px] p-2 border-r last:border-r-0 border-border/5"
            >
              <motion.div 
                variants={container}
                className="space-y-2"
              >
                {items.map(item => {
                  const goal = goals.find(g => g.id === item.referenceId);
                  const scheduleTime = item.schedule?.schedules.find(s => s.day === date.getDay())?.time;
                  
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      className="group p-2 rounded-lg hover:bg-accent/5 transition-all duration-200 border border-transparent hover:border-accent/20"
                    >
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => completeItem(item.id, 'user')}
                          className="mt-1 text-muted-foreground hover:text-primary transition-colors relative"
                        >
                          {item.status === 'completed' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Circle className="w-3 h-3" />
                          )}
                        </button>
                        <div className="space-y-1 min-w-0 flex-1">
                          {goal?.name && (
                            <p className="text-xs font-medium text-muted-foreground/80 truncate">
                              {goal.name}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-sm font-medium text-foreground/90 truncate">
                              {item.notes}
                            </p>
                          )}
                          {scheduleTime && (
                            <p className="text-xs text-muted-foreground/70">
                              {scheduleTime}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {items.length === 0 && (
                  <motion.div
                    variants={item}
                    className="h-full flex items-center justify-center text-xs text-muted-foreground/40"
                  >
                    No items
                  </motion.div>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
} 