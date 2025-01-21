'use client';

import React, { useState } from 'react';
import { format, isValid } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import DatePicker from "react-datepicker";
import { ClipboardList, DollarSign, Scale, Plus, FolderPlus, Pencil, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar as DateCalendar } from '@/components/ui/calendar';
import "react-datepicker/dist/react-datepicker.css";
import { cn } from '@/lib/utils';
import { Goal, StepTask } from '@/types/models';

interface GoalDetailViewProps {
  goal: Goal;
  onUpdate: (updatedGoal: Goal) => void;
}

interface FlipTaskProps {
  task: StepTask;
  onComplete: () => void;
  onDateChange: (date: Date | undefined) => void;
}

const FlipTask = ({ task, onComplete, onDateChange }: FlipTaskProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Format the date only if it's valid
  const formattedDate = task.dueDate && isValid(task.dueDate) ? format(task.dueDate, 'MMM d, yyyy') : undefined;

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg transition-all duration-300 ease-in-out",
      task.isNew && "animate-flip-in",
      task.status === 'completed' && "opacity-50"
    )}>
      <Checkbox
        id={task.id}
        checked={task.status === 'completed'}
        onCheckedChange={() => {
          console.log('Checkbox clicked, current status:', task.status);
          onComplete();
        }}
      />
      <label
        htmlFor={task.id}
        className={cn(
          "flex-1 cursor-pointer",
          task.status === 'completed' && "line-through"
        )}
      >
        {task.text}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !task.dueDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formattedDate || <span>Set due date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <DateCalendar
            mode="single"
            selected={task.dueDate && isValid(task.dueDate) ? task.dueDate : undefined}
            onSelect={(date: Date | undefined) => {
              console.log('Date selected:', date);
              onDateChange(date);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default function GoalDetailView({ goal, onUpdate }: GoalDetailViewProps) {
  const [newTaskText, setNewTaskText] = useState<{ [key: string]: string }>({});
  const [newStepText, setNewStepText] = useState('');
  const [showNewStep, setShowNewStep] = useState(false);

  const calculateProgress = () => {
    const totalTasks = goal.steps.reduce((acc, step) => 
      acc + (step.tasks?.length || 0), 0
    );
    const completedTasks = goal.steps.reduce((acc, step) => 
      acc + (step.tasks?.filter(t => t.status === 'completed').length || 0), 0
    );
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const handleTaskCompletion = (stepIndex: number, taskIndex: number) => {
    const step = goal.steps[stepIndex];
    const task = step.tasks[taskIndex];
    
    const updatedSteps = [...goal.steps];
    updatedSteps[stepIndex] = {
      ...step,
      tasks: step.tasks.map((t, i) => 
        i === taskIndex
          ? { ...t, status: t.status === 'completed' ? ('pending' as const) : ('completed' as const) }
          : t
      )
    };
    
    onUpdate({ ...goal, steps: updatedSteps });
  };

  const handleTaskDateChange = (stepId: string, taskId: string, date: Date | undefined) => {
    console.log('Handling date change for step:', stepId, 'task:', taskId, 'date:', date);
    const updatedSteps = goal.steps.map(step => {
      if (step.id === stepId) {
        console.log('Updating task date from', step.tasks.find(t => t.id === taskId)?.dueDate, 'to', date);
        return {
          ...step,
          tasks: step.tasks.map(task => {
            if (task.id === taskId) {
              return { ...task, dueDate: date };
            }
            return task;
          })
        };
      }
      return step;
    });

    console.log('Calling onUpdate with updated steps');
    onUpdate({ ...goal, steps: updatedSteps });
  };

  const addTask = (stepId: string) => {
    if (!newTaskText[stepId]) return;
    
    const updatedSteps = goal.steps.map(step => {
      if (step.id === stepId) {
        const newTask = {
          id: crypto.randomUUID(),
          text: newTaskText[stepId],
          status: 'pending' as const,
          isNew: true,
          dueDate: undefined
        };
        
        return {
          ...step,
          tasks: [...step.tasks, newTask]
        };
      }
      return step;
    });

    onUpdate({ ...goal, steps: updatedSteps });
    setNewTaskText(prev => ({ ...prev, [stepId]: '' }));
  };

  const addStep = () => {
    if (!newStepText) return;
    
    const newStep = {
      id: crypto.randomUUID(),
      text: newStepText,
      stepType: 'Project' as const,
      isTracked: true,
      tasks: [],
      notes: [],
      isNew: true
    };
    
    onUpdate({
      ...goal,
      steps: [...goal.steps, newStep]
    });
    setNewStepText('');
    setShowNewStep(false);
  };

  const getStepIcon = (index: number) => {
    const icons = [
      <ClipboardList key="clipboard" className="w-5 h-5" />,
      <DollarSign key="dollar" className="w-5 h-5" />,
      <Scale key="scale" className="w-5 h-5" />
    ];
    return icons[index % icons.length];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{goal.name}</h1>
          <div className="flex items-center mt-2 text-muted-foreground">
            <CalendarIcon className="w-4 h-4 mr-2" />
            <span>Due: {goal.targetDate && isValid(new Date(goal.targetDate)) ? format(new Date(goal.targetDate), 'MMM d, yyyy') : 'No due date set'}</span>
          </div>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90">
          <Pencil className="w-4 h-4 mr-2 inline-block" />
          Edit Goal
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Progress value={calculateProgress()} className="h-2" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>{calculateProgress()}% Complete</span>
              <span>{goal.steps.length} Items</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {goal.steps.map((step, index) => (
          <Card key={step.id} className={cn(
            "hover:shadow-lg transition-shadow",
            step.isNew && "animate-flip-in origin-top"
          )}>
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    {getStepIcon(index)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">
                      {step.text}
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({step.stepType})
                      </span>
                    </h3>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    {step.tasks.map((task, taskIndex) => (
                      <FlipTask
                        key={task.id}
                        task={task}
                        onComplete={() => handleTaskCompletion(index, taskIndex)}
                        onDateChange={(date) => handleTaskDateChange(step.id, task.id, date)}
                      />
                    ))}
                    <div className="ml-6 mt-2 space-y-2">
                      <div className="flex space-x-2">
                        <Input
                          value={newTaskText[step.id] || ''}
                          onChange={(e) => setNewTaskText(prev => ({
                            ...prev,
                            [step.id]: e.target.value
                          }))}
                          placeholder="New task..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') addTask(step.id);
                          }}
                          className="h-8"
                        />
                        <button
                          onClick={() => addTask(step.id)}
                          className="flex items-center text-primary hover:text-primary/80"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Step Card */}
        <Card className="hover:shadow-lg transition-shadow border-dashed">
          <CardContent className="p-6">
            {showNewStep ? (
              <div className="flex space-x-2">
                <Input
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  placeholder="New step title..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addStep();
                  }}
                />
                <button
                  onClick={addStep}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewStep(true)}
                className="w-full flex items-center justify-center space-x-2 text-primary hover:text-primary/80"
              >
                <FolderPlus className="w-5 h-5" />
                <span>Add New Step</span>
              </button>
            )}
          </CardContent>
        </Card>
      </div>

      <style>{`
        @keyframes flip-in {
          0% {
            transform: perspective(400px) rotateX(-90deg);
            opacity: 0;
          }
          40% {
            transform: perspective(400px) rotateX(20deg);
          }
          60% {
            transform: perspective(400px) rotateX(-10deg);
          }
          80% {
            transform: perspective(400px) rotateX(5deg);
          }
          100% {
            transform: perspective(400px) rotateX(0deg);
            opacity: 1;
          }
        }
        
        .animate-flip-in {
          animation: flip-in 0.6s ease-out forwards;
          backface-visibility: visible !important;
        }
      `}</style>
    </div>
  );
}