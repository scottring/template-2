'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PlusCircle, X } from 'lucide-react';
import { TimeScale, Area, SuccessCriteria } from '@/types/models';
import useAreaStore from '@/lib/stores/useAreaStore';
import useGoalStore from '@/lib/stores/useGoalStore';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import { useAuth } from '@/lib/hooks/useAuth';

interface QuickScheduleDialogProps {
  open: boolean;
  onClose: () => void;
}

interface SuccessCriteriaInput {
  text: string;
  isTracked: boolean;
  frequency?: number;
  timescale?: TimeScale;
  tasks: { id: string; text: string; completed: boolean; }[];
  notes: { id: string; text: string; timestamp: Date; }[];
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

export function QuickScheduleDialog({ open, onClose }: QuickScheduleDialogProps) {
  const { user } = useAuth();
  const { areas, addArea } = useAreaStore();
  const { addGoal } = useGoalStore();
  const { addItem } = useItineraryStore();

  // Form state
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [newAreaName, setNewAreaName] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [criteria, setCriteria] = useState<SuccessCriteriaInput[]>([{ 
    text: '', 
    isTracked: false,
    tasks: [],
    notes: []
  }]);

  // Schedule state
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [repeat, setRepeat] = useState<TimeScale>('weekly');

  const handleAddCriteria = () => {
    setCriteria([...criteria, { 
      text: '', 
      isTracked: false,
      tasks: [],
      notes: []
    }]);
  };

  const handleRemoveCriteria = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleUpdateCriteria = (index: number, updates: Partial<SuccessCriteriaInput>) => {
    setCriteria(criteria.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  const handleDayToggle = (dayIndex: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayIndex)) {
        return prev.filter((d) => d !== dayIndex);
      }
      return [...prev, dayIndex];
    });
  };

  const handleSubmit = async () => {
    if (!user?.householdId) return;

    let areaId = selectedArea;
    
    // Create new area if needed
    if (selectedArea === 'new' && newAreaName) {
      areaId = await addArea({
        name: newAreaName,
        description: '',
        color: '#000000',
        icon: 'folder',
        householdId: user.householdId,
        isActive: true,
        isFocus: false,
        assignedTo: [user.uid],
      });
    }

    // Create goal with success criteria
    const goalId = await addGoal({
      name: goalName,
      description: goalDescription,
      areaId,
      householdId: user.householdId,
      startDate: new Date(),
      targetDate: undefined,
      progress: 0,
      status: 'not_started',
      successCriteria: criteria.map(c => ({
        id: crypto.randomUUID(),
        text: c.text,
        isTracked: c.isTracked,
        frequency: c.frequency,
        timescale: c.timescale,
        tasks: c.tasks,
        notes: c.notes
      })),
      assignedTo: [user.uid]
    });

    // Schedule tracked criteria
    const trackedCriteria = criteria.filter(c => c.isTracked);
    
    for (const criterion of trackedCriteria) {
      const schedules = selectedDays.map(day => ({
        day,
        time: selectedTime,
      }));

      await addItem({
        type: 'task',
        referenceId: goalId,
        criteriaId: criterion.text, // Using text as ID for now
        schedule: {
          startDate: new Date(),
          schedules,
          repeat,
        },
        status: 'pending',
        notes: criterion.text,
        createdBy: user.uid,
        updatedBy: user.uid,
      });
    }

    // Reset form and close
    setSelectedArea('');
    setNewAreaName('');
    setGoalName('');
    setGoalDescription('');
    setCriteria([{ 
      text: '', 
      isTracked: false,
      tasks: [],
      notes: []
    }]);
    setSelectedDays([]);
    setSelectedTime('09:00');
    setRepeat('weekly');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quick Schedule</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label>Area</Label>
            <Select
              value={selectedArea}
              onValueChange={setSelectedArea}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an area" />
              </SelectTrigger>
              <SelectContent>
                {areas.map(area => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
                <SelectItem value="new">+ Create New Area</SelectItem>
              </SelectContent>
            </Select>

            {selectedArea === 'new' && (
              <Input
                placeholder="New area name"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Goal</Label>
            <Input
              placeholder="Goal name"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
            />
            <Textarea
              placeholder="Goal description (optional)"
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Success Criteria</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCriteria}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Criteria
              </Button>
            </div>

            {criteria.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="What does success look like?"
                      value={item.text}
                      onChange={(e) => handleUpdateCriteria(index, { text: e.target.value })}
                      className="flex-1"
                    />
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCriteria(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.isTracked}
                        onChange={(e) => handleUpdateCriteria(index, { isTracked: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Track in Itinerary</span>
                    </label>

                    {item.isTracked && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={item.frequency || 1}
                          onChange={(e) => handleUpdateCriteria(index, { frequency: parseInt(e.target.value) })}
                          min="1"
                          className="w-20"
                        />
                        <span className="text-sm">times per</span>
                        <Select
                          value={item.timescale || 'weekly'}
                          onValueChange={(value) => handleUpdateCriteria(index, { timescale: value as TimeScale })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Day</SelectItem>
                            <SelectItem value="weekly">Week</SelectItem>
                            <SelectItem value="monthly">Month</SelectItem>
                            <SelectItem value="quarterly">Quarter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {criteria.some(c => c.isTracked) && (
            <div className="space-y-4">
              <Label>Schedule</Label>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Select Days</h4>
                <div className="grid grid-cols-7 gap-2">
                  {WEEKDAYS.map((day, index) => (
                    <Button
                      key={day}
                      type="button"
                      variant={selectedDays.includes(index) ? 'default' : 'outline'}
                      className="h-9 p-0"
                      onClick={() => handleDayToggle(index)}
                    >
                      {day[0]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Select Time</h4>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                >
                  {TIME_SLOTS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Repeat</h4>
                <Select
                  value={repeat}
                  onValueChange={(value) => setRepeat(value as TimeScale)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedArea || (selectedArea === 'new' && !newAreaName) || !goalName || !criteria[0].text}
          >
            Create & Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 