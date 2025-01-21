import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { safeDate } from '@/lib/utils';
import { ArrowRight, ArrowLeft, CalendarIcon, Target, CheckCircle2, Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Goal, Step } from '@/types/models';
import { Badge } from '@/components/ui/badge';
import {
  eachDayOfInterval,
  isSameDay,
  addDays,
  getDay,
  startOfDay,
  parse
} from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

type PlanningPeriod = 'week' | 'month' | 'quarter';

interface PlanningData {
  period: PlanningPeriod;
  startDate: Date;
  endDate: Date;
  includedGoals: string[];
  scheduledTasks: {
    goalId: string;
    stepId: string;
    taskId: string;
    scheduledDate: Date;
    scheduledTime?: string;
  }[];
  habitSchedule: {
    goalId: string;
    stepId: string;
    weeklySchedule: {
      [key: string]: string[]; // day -> times
    };
  }[];
}

interface FlowPlannerProps {
  goals: Goal[];
  onComplete: (data: PlanningData) => void;
  onCancel: () => void;
}

interface ScheduleState {
  selectedDate: Date | undefined;
  selectedStep: {
    goalId: string;
    stepId: string;
    text: string;
    type: 'Routine' | 'Project' | 'One Time Task';
  } | null;
}

export function FlowPlanner({ goals, onComplete, onCancel }: FlowPlannerProps) {
  const [step, setStep] = useState<'intro' | 'period' | 'goals' | 'schedule' | 'review'>('intro');
  const [direction, setDirection] = useState(0);
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const [data, setData] = useState<PlanningData>({
    period: 'week',
    startDate: startOfWeek(new Date()),
    endDate: endOfWeek(new Date()),
    includedGoals: [],
    scheduledTasks: [],
    habitSchedule: []
  });
  const [error, setError] = useState<string | null>(null);
  const [scheduleState, setScheduleState] = useState<ScheduleState>({
    selectedDate: undefined,
    selectedStep: null
  });

  const goToNext = () => {
    setError(null);
    const steps: Array<'intro' | 'period' | 'goals' | 'schedule' | 'review'> = 
      ['intro', 'period', 'goals', 'schedule', 'review'];
    const currentIndex = steps.indexOf(step);
    
    if (currentIndex < steps.length - 1) {
      setDirection(1);
      setStep(steps[currentIndex + 1]);
    }
  };

  const goToPrevious = () => {
    const steps: Array<'intro' | 'period' | 'goals' | 'schedule' | 'review'> = 
      ['intro', 'period', 'goals', 'schedule', 'review'];
    const currentIndex = steps.indexOf(step);
    
    if (currentIndex > 0) {
      setDirection(-1);
      setStep(steps[currentIndex - 1]);
    }
  };

  const setPeriod = (period: PlanningPeriod) => {
    const today = new Date();
    const startDate = period === 'week' ? startOfWeek(today) :
                     period === 'month' ? startOfMonth(today) :
                     startOfMonth(today); // For quarter, we'll need to calculate properly
    const endDate = period === 'week' ? endOfWeek(today) :
                   period === 'month' ? endOfMonth(today) :
                   endOfMonth(addMonths(today, 3)); // Approximate quarter

    setData(prev => ({
      ...prev,
      period,
      startDate,
      endDate
    }));
  };

  const toggleGoal = (goalId: string) => {
    setData(prev => ({
      ...prev,
      includedGoals: prev.includedGoals.includes(goalId)
        ? prev.includedGoals.filter(id => id !== goalId)
        : [...prev.includedGoals, goalId]
    }));
  };

  const goToNextGoal = () => {
    if (currentGoalIndex < goals.length - 1) {
      setCurrentGoalIndex(prev => prev + 1);
    } else {
      goToNext();
    }
  };

  const goToPreviousGoal = () => {
    if (currentGoalIndex > 0) {
      setCurrentGoalIndex(prev => prev - 1);
    } else {
      goToPrevious();
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  // Get included goals and their steps
  const includedGoalsWithSteps = goals
    .filter(goal => data.includedGoals.includes(goal.id))
    .map(goal => ({
      ...goal,
      steps: goal.steps.map(step => ({
        ...step,
        goalId: goal.id
      }))
    }));

  const timeSlots = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
    "20:00", "21:00", "22:00"
  ];

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const scheduleHabit = (goalId: string, stepId: string, day: string, time: string, checked: boolean) => {
    setData(prev => {
      const habitIndex = prev.habitSchedule.findIndex(h => h.goalId === goalId && h.stepId === stepId);
      const newSchedule = [...prev.habitSchedule];

      if (habitIndex === -1) {
        // Create new habit schedule
        newSchedule.push({
          goalId,
          stepId,
          weeklySchedule: {
            [day]: checked ? [time] : []
          }
        });
      } else {
        // Update existing habit schedule
        const existingTimes = newSchedule[habitIndex].weeklySchedule[day] || [];
        newSchedule[habitIndex].weeklySchedule[day] = checked
          ? [...existingTimes, time]
          : existingTimes.filter(t => t !== time);
      }

      return {
        ...prev,
        habitSchedule: newSchedule
      };
    });
  };

  const scheduleTask = (goalId: string, stepId: string, taskId: string, date: Date, time?: string) => {
    setData(prev => ({
      ...prev,
      scheduledTasks: [
        ...prev.scheduledTasks,
        {
          goalId,
          stepId,
          taskId,
          scheduledDate: date,
          scheduledTime: time
        }
      ]
    }));
  };

  return (
    <div className="min-h-[70vh] relative">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="absolute inset-0"
        >
          {step === 'intro' && (
            <div className="flex items-center justify-center min-h-[70vh]">
              <div className="text-center space-y-8">
                <motion.h1 
                  className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Let's Plan Your Goals
                </motion.h1>
                <motion.p 
                  className="text-xl text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  We'll schedule your tasks and habits for success
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button 
                    size="lg"
                    onClick={goToNext}
                    className="mt-8"
                  >
                    Start Planning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
          )}

          {step === 'period' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">Choose Planning Period</h2>
                <p className="text-xl text-muted-foreground">
                  Select the timeframe you want to plan for
                </p>
              </div>

              <Card className="p-6">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Select
                      value={data.period}
                      onValueChange={(value: PlanningPeriod) => setPeriod(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="quarter">Quarter</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex flex-col items-center space-y-4">
                      <Calendar
                        mode="single"
                        selected={data.startDate}
                        onSelect={(date) => {
                          if (!date) return;
                          const startDate = data.period === 'week' ? startOfWeek(date) :
                                         data.period === 'month' ? startOfMonth(date) :
                                         startOfMonth(date);
                          const endDate = data.period === 'week' ? endOfWeek(date) :
                                       data.period === 'month' ? endOfMonth(date) :
                                       endOfMonth(addMonths(date, 3));
                          setData(prev => ({
                            ...prev,
                            startDate,
                            endDate
                          }));
                        }}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />

                      <div className="text-sm text-muted-foreground">
                        {data.startDate && data.endDate && (
                          <p>
                            From {format(data.startDate, 'PPP')} to {format(data.endDate, 'PPP')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={goToPrevious}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button onClick={goToNext}>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {step === 'goals' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">Select Goals to Plan</h2>
                <p className="text-xl text-muted-foreground">
                  Choose which goals you want to work on
                </p>
              </div>

              <Card className="p-6">
                <div className="space-y-6">
                  {goals.length > 0 ? (
                    <motion.div
                      key={currentGoalIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Goal {currentGoalIndex + 1} of {goals.length}</span>
                        <span>{Math.round((currentGoalIndex + 1) / goals.length * 100)}% Complete</span>
                      </div>

                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${((currentGoalIndex + 1) / goals.length) * 100}%` }}
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold">{goals[currentGoalIndex].name}</h3>
                          <Badge variant={goals[currentGoalIndex].goalType === 'Routine' ? 'secondary' : 'default'}>
                            {goals[currentGoalIndex].goalType}
                          </Badge>
                        </div>

                        <p className="text-muted-foreground">{goals[currentGoalIndex].description}</p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            <span>{goals[currentGoalIndex].progress}% Complete</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Due {format(safeDate(goals[currentGoalIndex].targetDate), 'PP')}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">Steps:</h4>
                          <ul className="space-y-2">
                            {goals[currentGoalIndex].steps.map((step: Step, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle2 className="h-5 w-5 mt-0.5 text-muted-foreground" />
                                <div>
                                  <p>{step.text}</p>
                                  {step.stepType === 'Routine' && step.frequency && (
                                    <p className="text-sm text-muted-foreground">
                                      {step.frequency}x per {step.timescale || 'week'}
                                    </p>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Button
                          variant={data.includedGoals.includes(goals[currentGoalIndex].id) ? "default" : "outline"}
                          className="w-full"
                          onClick={() => toggleGoal(goals[currentGoalIndex].id)}
                        >
                          {data.includedGoals.includes(goals[currentGoalIndex].id) 
                            ? "Selected for Planning" 
                            : "Include in Planning"}
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      No goals available for planning
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={currentGoalIndex === 0 ? goToPrevious : goToPreviousGoal}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {currentGoalIndex === 0 ? "Back" : "Previous Goal"}
                    </Button>
                    <Button 
                      onClick={currentGoalIndex === goals.length - 1 ? goToNext : goToNextGoal}
                      disabled={goals.length === 0}
                    >
                      {currentGoalIndex === goals.length - 1 ? "Continue" : "Next Goal"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {step === 'schedule' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">Schedule Your Plan</h2>
                <p className="text-xl text-muted-foreground">
                  Set times for habits and schedule your tasks
                </p>
              </div>

              <div className="grid grid-cols-5 gap-6">
                {/* Left sidebar - Steps list */}
                <Card className="col-span-2 p-4">
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-6">
                      {includedGoalsWithSteps.map(goal => (
                        <div key={goal.id} className="space-y-4">
                          <h3 className="font-semibold text-lg">{goal.name}</h3>
                          <div className="space-y-2">
                            {goal.steps.map(step => (
                              <div
                                key={step.id}
                                className={cn(
                                  "p-3 rounded-lg border cursor-pointer transition-colors",
                                  scheduleState.selectedStep?.stepId === step.id
                                    ? "border-primary bg-primary/5"
                                    : "hover:border-primary/50"
                                )}
                                onClick={() => setScheduleState(prev => ({
                                  ...prev,
                                  selectedStep: {
                                    goalId: goal.id,
                                    stepId: step.id,
                                    text: step.text,
                                    type: step.stepType
                                  }
                                }))}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{step.text}</span>
                                  <Badge variant={step.stepType === 'Routine' ? 'secondary' : 'default'}>
                                    {step.stepType}
                                  </Badge>
                                </div>
                                {step.stepType === 'Routine' && step.frequency && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {step.frequency}x per {step.timescale || 'week'}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>

                {/* Right side - Schedule view */}
                <Card className="col-span-3 p-4">
                  <ScrollArea className="h-[600px]">
                    {scheduleState.selectedStep ? (
                      scheduleState.selectedStep.type === 'Routine' ? (
                        // Habit scheduling - Weekly view
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Time</TableHead>
                              {daysOfWeek.map(day => (
                                <TableHead key={day}>{day.slice(0, 3)}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {timeSlots.map(time => (
                              <TableRow key={time}>
                                <TableCell className="font-medium">{time}</TableCell>
                                {daysOfWeek.map(day => {
                                  const isScheduled = data.habitSchedule
                                    .find(h => 
                                      h.goalId === scheduleState.selectedStep?.goalId && 
                                      h.stepId === scheduleState.selectedStep?.stepId
                                    )?.weeklySchedule[day]?.includes(time);

                                  return (
                                    <TableCell key={`${day}-${time}`} className="text-center">
                                      <Checkbox
                                        checked={isScheduled}
                                        onCheckedChange={(checked) => {
                                          if (scheduleState.selectedStep) {
                                            scheduleHabit(
                                              scheduleState.selectedStep.goalId,
                                              scheduleState.selectedStep.stepId,
                                              day,
                                              time,
                                              checked as boolean
                                            );
                                          }
                                        }}
                                      />
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        // Task scheduling - Calendar view
                        <div className="space-y-4">
                          <Calendar
                            mode="single"
                            selected={scheduleState.selectedDate}
                            onSelect={(date) => setScheduleState(prev => ({
                              ...prev,
                              selectedDate: date
                            }))}
                            fromDate={data.startDate}
                            toDate={data.endDate}
                            className="rounded-md border"
                          />

                          {scheduleState.selectedDate && (
                            <div className="space-y-4">
                              <h4 className="font-medium">
                                Select time for {format(scheduleState.selectedDate, 'PPP')}
                              </h4>
                              <div className="grid grid-cols-4 gap-2">
                                {timeSlots.map(time => (
                                  <Button
                                    key={time}
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                      if (scheduleState.selectedStep && scheduleState.selectedDate) {
                                        scheduleTask(
                                          scheduleState.selectedStep.goalId,
                                          scheduleState.selectedStep.stepId,
                                          '', // We'll need to handle tasks properly
                                          scheduleState.selectedDate,
                                          time
                                        );
                                      }
                                    }}
                                  >
                                    {time}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Select a step to schedule
                      </div>
                    )}
                  </ScrollArea>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={goToPrevious}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={goToNext}>
                  Review Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">Review Your Plan</h2>
                <p className="text-xl text-muted-foreground">
                  Here's what you've planned for {data.period === 'week' ? 'this week' : 
                    data.period === 'month' ? 'this month' : 'this quarter'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Card className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Habits</h3>
                    <ScrollArea className="h-[400px] pr-4">
                      {data.habitSchedule.map((habit) => {
                        const goal = goals.find(g => g.id === habit.goalId);
                        const step = goal?.steps.find(s => s.id === habit.stepId);
                        if (!goal || !step) return null;

                        return (
                          <div key={`${habit.goalId}-${habit.stepId}`} className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">
                                {goal.name}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {step.text}
                              </span>
                            </div>
                            <div className="pl-4 space-y-2">
                              {Object.entries(habit.weeklySchedule).map(([day, times]) => (
                                times.length > 0 && (
                                  <div key={day} className="text-sm">
                                    <span className="font-medium">{day}:</span>{' '}
                                    {times.join(', ')}
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </ScrollArea>
                  </div>
                </Card>

                <Card className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Scheduled Tasks</h3>
                    <ScrollArea className="h-[400px] pr-4">
                      {Object.entries(
                        data.scheduledTasks.reduce((acc, task) => {
                          const dateKey = format(task.scheduledDate, 'PP');
                          if (!acc[dateKey]) acc[dateKey] = [];
                          acc[dateKey].push(task);
                          return acc;
                        }, {} as Record<string, typeof data.scheduledTasks>)
                      ).map(([date, tasks]) => (
                        <div key={date} className="mb-6">
                          <h4 className="font-medium mb-2">{date}</h4>
                          <div className="space-y-3 pl-4">
                            {tasks.map((task) => {
                              const goal = goals.find(g => g.id === task.goalId);
                              const step = goal?.steps.find(s => s.id === task.stepId);
                              if (!goal || !step) return null;

                              return (
                                <div key={`${task.goalId}-${task.stepId}-${task.taskId}`} className="text-sm">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {format(new Date(`2000-01-01T${task.scheduledTime}`), 'h:mm a')}
                                    </Badge>
                                    <span className="font-medium">{goal.name}</span>
                                  </div>
                                  <p className="text-muted-foreground mt-1 pl-[52px]">
                                    {step.text}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={goToPrevious}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  onClick={() => onComplete(data)}
                  disabled={data.habitSchedule.length === 0 && data.scheduledTasks.length === 0}
                >
                  Complete Planning
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
} 