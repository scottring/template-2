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
import { PlusCircle, X, ListTodo, StickyNote } from 'lucide-react';
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

interface ScheduleTime {
  day: number;
  time: string;
}

// Local extension of TimeScale to include 'none'
type ScheduleTimeScale = TimeScale | 'none';

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
  const [scheduleTimes, setScheduleTimes] = useState<ScheduleTime[]>([]);
  const [repeat, setRepeat] = useState<ScheduleTimeScale>('weekly');
  const [targetDate, setTargetDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);

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
        setScheduleTimes(times => times.filter(t => t.day !== dayIndex));
        return prev.filter((d) => d !== dayIndex);
      }
      setScheduleTimes(times => {
        const existingTimes = times.filter(t => t.day === dayIndex);
        if (existingTimes.length === 0) {
          return [...times, { day: dayIndex, time: '09:00' }];
        }
        return times;
      });
      return [...prev, dayIndex];
    });
  };

  const handleAddTimeSlot = (dayIndex: number) => {
    setScheduleTimes(prev => {
      const dayTimes = prev.filter(t => t.day === dayIndex);
      const lastTime = dayTimes.length > 0 ? dayTimes[dayTimes.length - 1].time : '09:00';
      return [...prev, { day: dayIndex, time: lastTime }];
    });
  };

  const handleRemoveTimeSlot = (dayIndex: number, timeIndex: number) => {
    setScheduleTimes(prev => {
      const dayTimes = prev.filter(t => t.day === dayIndex);
      if (dayTimes.length <= 1) return prev;
      
      const timeToRemove = dayTimes[timeIndex];
      return prev.filter(slot => slot !== timeToRemove);
    });
  };

  const handleUpdateTime = (dayIndex: number, timeIndex: number, newTime: string) => {
    setScheduleTimes(prev => {
      const dayTimes = prev.filter(t => t.day === dayIndex);
      const timeToUpdate = dayTimes[timeIndex];
      
      return prev.map(slot => 
        slot === timeToUpdate ? { ...slot, time: newTime } : slot
      );
    });
  };

  const handleAddTask = (criteriaIndex: number) => {
    handleUpdateCriteria(criteriaIndex, {
      tasks: [
        ...criteria[criteriaIndex].tasks,
        { id: crypto.randomUUID(), text: '', completed: false }
      ]
    });
  };

  const handleRemoveTask = (criteriaIndex: number, taskIndex: number) => {
    handleUpdateCriteria(criteriaIndex, {
      tasks: criteria[criteriaIndex].tasks.filter((_, i) => i !== taskIndex)
    });
  };

  const handleUpdateTask = (criteriaIndex: number, taskIndex: number, text: string) => {
    handleUpdateCriteria(criteriaIndex, {
      tasks: criteria[criteriaIndex].tasks.map((task, i) => 
        i === taskIndex ? { ...task, text } : task
      )
    });
  };

  const handleAddNote = (criteriaIndex: number) => {
    handleUpdateCriteria(criteriaIndex, {
      notes: [
        ...criteria[criteriaIndex].notes,
        { id: crypto.randomUUID(), text: '', timestamp: new Date() }
      ]
    });
  };

  const handleRemoveNote = (criteriaIndex: number, noteIndex: number) => {
    handleUpdateCriteria(criteriaIndex, {
      notes: criteria[criteriaIndex].notes.filter((_, i) => i !== noteIndex)
    });
  };

  const handleUpdateNote = (criteriaIndex: number, noteIndex: number, text: string) => {
    handleUpdateCriteria(criteriaIndex, {
      notes: criteria[criteriaIndex].notes.map((note, i) => 
        i === noteIndex ? { ...note, text } : note
      )
    });
  };

  const handleSubmit = async () => {
    if (!user?.householdId) return;

    let areaId = selectedArea;
    
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

    const goalId = await addGoal({
      name: goalName,
      description: goalDescription,
      areaId,
      householdId: user.householdId,
      startDate: new Date(startDate),
      targetDate: targetDate ? new Date(targetDate) : undefined,
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
      await addItem({
        type: 'task',
        referenceId: goalId,
        criteriaId: criterion.text,
        schedule: {
          startDate: new Date(),
          schedules: scheduleTimes,
          repeat: repeat === 'none' ? undefined : repeat,
        },
        status: 'pending',
        notes: criterion.text,
        createdBy: user.uid,
        updatedBy: user.uid,
      });
    }

    // Reset form
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
    setScheduleTimes([]);
    setRepeat('weekly');
    setTargetDate('');
    setStartDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <Label className="text-sm">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Target Date</Label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Success Criteria</Label>

            {criteria.map((criterion, index) => (
              <Card key={index} className="p-4 space-y-4">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter success criteria"
                      value={criterion.text}
                      onChange={(e) =>
                        handleUpdateCriteria(index, { text: e.target.value })
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCriteria(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Schedule Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={criterion.isTracked}
                      onChange={(e) => handleUpdateCriteria(index, { isTracked: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label className="text-sm font-normal">Track in Schedule</Label>
                  </div>

                  {criterion.isTracked && (
                    <div className="space-y-4 pl-6">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Select Days</h4>
                        <div className="grid grid-cols-7 gap-2">
                          {WEEKDAYS.map((day, dayIndex) => (
                            <Button
                              key={day}
                              type="button"
                              variant={selectedDays.includes(dayIndex) ? 'default' : 'outline'}
                              className="h-9 p-0"
                              onClick={() => handleDayToggle(dayIndex)}
                            >
                              {day[0]}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {selectedDays.map(dayIndex => {
                        const dayTimes = scheduleTimes.filter(t => t.day === dayIndex);
                        const uniqueDayTimes = Array.from(new Set(dayTimes.map(t => t.time)))
                          .map(time => dayTimes.find(t => t.time === time)!);
                        
                        return (
                          <div key={dayIndex} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-medium">{WEEKDAYS[dayIndex]} Times</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddTimeSlot(dayIndex)}
                              >
                                <PlusCircle className="w-4 h-4 mr-2" />
                                Add Time
                              </Button>
                            </div>
                            {uniqueDayTimes.map((timeSlot, timeIndex) => (
                              <div key={timeIndex} className="flex items-center gap-2">
                                <select
                                  value={timeSlot.time}
                                  onChange={(e) => handleUpdateTime(dayIndex, timeIndex, e.target.value)}
                                  className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                                >
                                  {TIME_SLOTS.map((time) => (
                                    <option key={time} value={time}>
                                      {time}
                                    </option>
                                  ))}
                                </select>
                                {timeIndex > 0 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveTimeSlot(dayIndex, timeIndex)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Repeat</h4>
                        <Select
                          value={repeat}
                          onValueChange={(value) => setRepeat(value as ScheduleTimeScale)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Repeat</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>

                        {repeat !== 'none' && targetDate && (
                          <div className="mt-2">
                            <h4 className="text-sm font-medium mb-1">End Date: {new Date(targetDate).toLocaleDateString()}</h4>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tasks Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Tasks</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddTask(index)}
                    >
                      <ListTodo className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                  {criterion.tasks.map((task, taskIndex) => (
                    <div key={task.id} className="flex items-center gap-2">
                      <Input
                        placeholder="Enter task"
                        value={task.text}
                        onChange={(e) =>
                          handleUpdateTask(index, taskIndex, e.target.value)
                        }
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTask(index, taskIndex)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Notes Section */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Notes</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddNote(index)}
                    >
                      <StickyNote className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                  {criterion.notes.map((note, noteIndex) => (
                    <div key={note.id} className="flex items-center gap-2">
                      <Textarea
                        placeholder="Enter note"
                        value={note.text}
                        onChange={(e) =>
                          handleUpdateNote(index, noteIndex, e.target.value)
                        }
                        className="flex-1"
                        rows={2}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveNote(index, noteIndex)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCriteria}
              className="w-full"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Criteria
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedArea || (selectedArea === 'new' && !newAreaName) || !goalName || criteria.length === 0 || !criteria[0]?.text}
          >
            Create & Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 