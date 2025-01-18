'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import useGoalStore from '@/lib/stores/useGoalStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, ArrowUpRight } from 'lucide-react';

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

export function ActiveHabits() {
  const { user } = useAuth();
  const { getActiveHabits, completeItem } = useItineraryStore();
  const { goals, fetchGoals } = useGoalStore();
  const activeHabits = getActiveHabits();

  useEffect(() => {
    if (user?.householdId) {
      fetchGoals(user.householdId);
    }
  }, [user?.householdId, fetchGoals]);

  const handleComplete = async (itemId: string) => {
    if (!user) return;
    await completeItem(itemId, user.uid);
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {activeHabits.length === 0 ? (
        <motion.p 
          variants={item}
          className="text-muted-foreground text-center py-8"
        >
          No active habits
        </motion.p>
      ) : (
        <motion.div className="space-y-3" variants={container}>
          {activeHabits.map(habit => {
            const goal = goals.find(g => g.id === habit.referenceId);
            
            return (
              <motion.div
                key={habit.id}
                variants={item}
                layout
                className="group flex items-center justify-between p-4 rounded-lg hover:bg-accent/5 transition-all duration-200 border border-transparent hover:border-accent/20"
              >
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleComplete(habit.id)}
                    className="text-muted-foreground hover:text-primary transition-colors relative"
                  >
                    <div className="absolute inset-0 bg-primary/10 rounded-full scale-0 group-hover:scale-150 transition-transform duration-300 opacity-0 group-hover:opacity-100" />
                    {habit.status === 'completed' ? (
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
                    {habit.notes && (
                      <span className="font-medium text-foreground/90 group-hover:text-foreground transition-colors">
                        {habit.notes}
                      </span>
                    )}
                    
                    {habit.schedule?.repeat && (
                      <div className="text-sm text-muted-foreground/70 group-hover:text-muted-foreground/90 transition-colors">
                        Every {habit.schedule.repeat}
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
  );
} 