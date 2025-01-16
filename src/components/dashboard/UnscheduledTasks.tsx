'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ChevronRight } from 'lucide-react';
import { ScheduleDialog } from '@/components/planning/ScheduleDialog';
import useGoalStore from '@/lib/stores/useGoalStore';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import useAreaStore from '@/lib/stores/useAreaStore';
import { useAuth } from '@/lib/hooks/useAuth';
import { TimeScale } from '@/types/models';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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

interface CriteriaWithGoal {
  goalId: string;
  goalName: string;
  criteria: any;
  areaId: string;
  areaName: string;
}

export function UnscheduledTasks() {
  const router = useRouter();
  const { user } = useAuth();
  const { goals, loading: goalsLoading } = useGoalStore();
  const { items: itineraryItems, addItem } = useItineraryStore();
  const { areas } = useAreaStore();
  const [unscheduledCriteria, setUnscheduledCriteria] = useState<CriteriaWithGoal[]>([]);
  const [selectedCriteria, setSelectedCriteria] = useState<CriteriaWithGoal | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedTimeScale, setSelectedTimeScale] = useState<TimeScale | 'all'>('all');

  // Get all unscheduled criteria
  useEffect(() => {
    if (!goals || !itineraryItems || !areas) return;

    // Find all tracked criteria that aren't scheduled
    const scheduledCriteriaIds = new Set(itineraryItems.map(item => item.criteriaId).filter(Boolean));
    
    const unscheduled = goals.flatMap(goal => {
      const area = areas.find(a => a.id === goal.areaId);
      return (goal.successCriteria || [])
        .filter(criteria => 
          criteria.isTracked && 
          !scheduledCriteriaIds.has(criteria.id)
        )
        .map(criteria => ({
          goalId: goal.id,
          goalName: goal.name,
          criteria,
          areaId: goal.areaId,
          areaName: area?.name || 'Uncategorized'
        }));
    });

    setUnscheduledCriteria(unscheduled);
  }, [goals, itineraryItems, areas]);

  // Filter criteria based on selected area and time scale
  const filteredCriteria = useMemo(() => {
    return unscheduledCriteria.filter(item => {
      const areaMatch = selectedArea === 'all' || item.areaId === selectedArea;
      const timeScaleMatch = selectedTimeScale === 'all' || item.criteria.timescale === selectedTimeScale;
      return areaMatch && timeScaleMatch;
    });
  }, [unscheduledCriteria, selectedArea, selectedTimeScale]);

  // Group criteria by area
  const groupedCriteria = useMemo(() => {
    const groups = new Map<string, CriteriaWithGoal[]>();
    
    filteredCriteria.forEach(item => {
      if (!groups.has(item.areaId)) {
        groups.set(item.areaId, []);
      }
      groups.get(item.areaId)?.push(item);
    });

    return Array.from(groups.entries()).map(([areaId, items]) => ({
      areaId,
      areaName: items[0].areaName,
      items
    }));
  }, [filteredCriteria]);

  const handleSchedule = (config: any) => {
    if (!selectedCriteria || !user) return;

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

    addItem({
      type: 'task',
      referenceId: selectedCriteria.goalId,
      criteriaId: selectedCriteria.criteria.id,
      schedule,
      status: 'pending',
      notes: selectedCriteria.criteria.text,
      createdBy: user.uid,
      updatedBy: user.uid
    });

    setScheduleDialogOpen(false);
    setSelectedCriteria(null);
  };

  const hasMore = unscheduledCriteria.length > 5;
  const displayedCriteria = unscheduledCriteria.slice(0, 5);

  return (
    <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
        <CardTitle className="text-lg font-semibold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
          Unscheduled Tasks
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <Link href="/schedule" className="gap-1">
            View All
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-6 pt-0">
        <motion.div 
          className="flex flex-col gap-4 mb-6 sm:flex-row"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Select
            value={selectedArea}
            onValueChange={setSelectedArea}
          >
            <SelectTrigger className="w-full sm:w-[180px] border-primary/20 hover:border-primary/40 transition-colors">
              <SelectValue placeholder="Filter by Area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {areas.map(area => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedTimeScale}
            onValueChange={(value) => setSelectedTimeScale(value as TimeScale | 'all')}
          >
            <SelectTrigger className="w-full sm:w-[180px] border-primary/20 hover:border-primary/40 transition-colors">
              <SelectValue placeholder="Filter by Time Scale" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time Scales</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {groupedCriteria.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 rounded-lg bg-gradient-to-b from-accent/5 to-transparent"
          >
            <CalendarIcon className="h-12 w-12 mx-auto text-primary/30" />
            <p className="text-muted-foreground mt-2">No unscheduled tasks found</p>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {groupedCriteria.map(({ areaId, areaName, items }) => (
              <motion.div key={areaId} variants={item}>
                <h3 className="font-medium text-sm text-primary/70 mb-3">{areaName}</h3>
                <div className="space-y-2">
                  {items.map(({ goalId, goalName, criteria }) => (
                    <motion.div 
                      key={criteria.id}
                      variants={item}
                      className={cn(
                        "group relative flex items-center justify-between p-3 rounded-lg transition-all duration-300",
                        "bg-gradient-to-r from-background to-accent/5 hover:from-accent/5 hover:to-accent/10",
                        "border border-primary/10 hover:border-primary/20",
                        "shadow-sm hover:shadow-md"
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                      <div className="space-y-1 relative">
                        <p className="font-medium group-hover:text-primary transition-colors">
                          {criteria.text}
                        </p>
                        <Link 
                          href={`/goals/${goalId}`}
                          className="text-xs text-primary hover:text-primary/80 transition-colors block"
                        >
                          {goalName}
                        </Link>
                        {criteria.frequency && criteria.timescale && (
                          <p className="text-xs text-muted-foreground">
                            Target: {criteria.frequency} times per {criteria.timescale}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCriteria({ goalId, goalName, criteria, areaId, areaName });
                          setScheduleDialogOpen(true);
                        }}
                        className="shrink-0 gap-2 border-primary/20 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all relative"
                      >
                        <CalendarIcon className="h-4 w-4" />
                        Schedule
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </CardContent>

      {selectedCriteria && (
        <ScheduleDialog
          open={scheduleDialogOpen}
          onClose={() => {
            setScheduleDialogOpen(false);
            setSelectedCriteria(null);
          }}
          onSchedule={handleSchedule}
          itemName={selectedCriteria.criteria.text}
          targetDate={goals.find(g => g.id === selectedCriteria.goalId)?.targetDate}
        />
      )}
    </Card>
  );
} 