'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Unscheduled Tasks</CardTitle>
        <div className="flex gap-2">
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/schedule')}
            >
              View All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex gap-4 mb-4">
          <Select
            value={selectedArea}
            onValueChange={setSelectedArea}
          >
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[180px]">
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
        </div>

        {groupedCriteria.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No unscheduled tasks found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedCriteria.map(({ areaId, areaName, items }) => (
              <div key={areaId}>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">{areaName}</h3>
                <div className="space-y-2">
                  {items.map(({ goalId, goalName, criteria }) => (
                    <div 
                      key={criteria.id} 
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50"
                    >
                      <div>
                        <p className="font-medium">{criteria.text}</p>
                        <p className="text-sm text-muted-foreground">{goalName}</p>
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
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
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